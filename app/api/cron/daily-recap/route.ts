import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)
const token = process.env.TELEGRAM_BOT_TOKEN

export async function GET(request: Request) {
  try {
    // 1. Ambil Waktu Saat Ini Berdasarkan Zona Waktu WIB (Asia/Jakarta)
    const nowOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    
    const formatter = new Intl.DateTimeFormat('id-ID', nowOptions)
    const parts = formatter.formatToParts(new Date())
    const timeMap = Object.fromEntries(parts.map(p => [p.type, p.value]))
    
    const todayStr = `${timeMap.year}-${timeMap.month}-${timeMap.day}` // Format YYYY-MM-DD WIB

    // 2. PROTEKSI ANTI-DOUBLE: Cek apakah rekap untuk tanggal hari ini sudah pernah dikirim
    const { data: existingLog } = await supabase
      .from('cron_logs')
      .select('id')
      .eq('task_name', 'daily_recap')
      .eq('date_log', todayStr)
      .single()

    if (existingLog) {
      return NextResponse.json({ success: true, message: 'Rekap harian untuk hari ini sudah pernah dikirim sebelumnya.' })
    }

    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)

    if (!stores || stores.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada toko terhubung' })
    }

    // Rentang awal dan akhir hari berdasarkan waktu lokal WIB (+07:00)
    const todayStartISO = `${todayStr}T00:00:00+07:00`
    const todayEndISO = `${todayStr}T23:59:59+07:00`

    for (const store of stores) {
      if (!store.telegram_chat_id) continue

      const { data: transactions } = await supabase
        .from('transactions')
        .select('total_amount, payment_method')
        .eq('store_id', store.id)
        .gte('created_at', todayStartISO)
        .lte('created_at', todayEndISO)

      const totalOmzet = transactions ? transactions.reduce((sum, t) => sum + t.total_amount, 0) : 0
      const cash = transactions ? transactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + t.total_amount, 0) : 0
      const nonCash = transactions ? transactions.filter(t => t.payment_method !== 'cash').reduce((sum, t) => sum + t.total_amount, 0) : 0
      const count = transactions ? transactions.length : 0

      const recapMessage = `🌙 *REKAP OTOMATIS HARIAN (23:59 WIB)*\n\n🏪 Toko: ${store.name}\n💰 *Total Omzet: Rp ${totalOmzet.toLocaleString('id-ID')}*\n\n• Tunai: Rp ${cash.toLocaleString('id-ID')}\n• Non-Tunai: Rp ${nonCash.toLocaleString('id-ID')}\n• Total Transaksi: ${count} pesanan\n\n_JuraganKasir Automated Report_`

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: store.telegram_chat_id,
          text: recapMessage,
          parse_mode: 'Markdown'
        })
      })
    }

    // 3. Catat ke Database Bahwa Hari Ini Berhasil Dikirim (Mengunci Supaya Tidak Double)
    await supabase.from('cron_logs').insert([
      { task_name: 'daily_recap', date_log: todayStr }
    ])

    return NextResponse.json({ success: true, message: 'Rekap harian terkirim' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}