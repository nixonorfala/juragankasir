import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)
const token = process.env.TELEGRAM_BOT_TOKEN

export async function GET(request: Request) {
  try {
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)

    if (!stores || stores.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada toko terhubung' })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayISO = todayStart.toISOString()

    for (const store of stores) {
      if (!store.telegram_chat_id) continue

      const { data: transactions } = await supabase
        .from('transactions')
        .select('total_amount, payment_method')
        .eq('store_id', store.id)
        .gte('created_at', todayISO)

      const totalOmzet = transactions ? transactions.reduce((sum, t) => sum + t.total_amount, 0) : 0
      const cash = transactions ? transactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + t.total_amount, 0) : 0
      const nonCash = transactions ? transactions.filter(t => t.payment_method !== 'cash').reduce((sum, t) => sum + t.total_amount, 0) : 0
      const count = transactions ? transactions.length : 0

      const recapMessage = `🌙 *REKAP OTOMATIS HARIAN (23:59)*\n\n🏪 Toko: ${store.name}\n💰 *Total Omzet: Rp ${totalOmzet.toLocaleString('id-ID')}*\n\n• Tunai: Rp ${cash.toLocaleString('id-ID')}\n• Non-Tunai: Rp ${nonCash.toLocaleString('id-ID')}\n• Total Transaksi: ${count} pesanan\n\n_JuraganKasir Automated Report_`

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

    return NextResponse.json({ success: true, message: 'Rekap harian terkirim' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}