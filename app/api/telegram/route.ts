import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = process.env.TELEGRAM_BOT_TOKEN

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token Telegram tidak ditemukan' }, { status: 400 })
    }

    // 1. SKENARIO ASLI (AMAN): POS mengirim pesan keluar ke Telegram
    const { message, chat_id } = body
    if (message && chat_id) {
      const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`

      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat_id,
          text: message,
          parse_mode: 'Markdown'
        }),
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.description || 'Gagal mengirim pesan Telegram')
      }

      return NextResponse.json({ success: true, data })
    }

    // 2. SKENARIO TAMBAHAN: Webhook Telegram menerima perintah dari Owner (/omzet, /stok)
    const incomingMessage = body.message || body.edited_message
    if (incomingMessage && incomingMessage.text) {
      const chatId = incomingMessage.chat.id
      const text = incomingMessage.text.trim()

      const { data: store } = await supabase
        .from('stores')
        .select('id, name')
        .eq('telegram_chat_id', chatId.toString())
        .single()

      if (!store) {
        if (text.startsWith('/')) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `❌ *Toko Belum Terhubung*\n\nChat ID Telegram ini (${chatId}) belum didaftarkan ke toko mana pun di JuraganKasir. Masukkan Chat ID ini ke Pengaturan Toko Dashboard Owner.`,
              parse_mode: 'Markdown'
            })
          })
        }
        return NextResponse.json({ success: true })
      }

      let replyText = ''

      if (text === '/help' || text === '/start') {
        replyText = `🤖 *Pusat Bantuan Bot JuraganKasir*\n\nHalo Owner *${store.name}*!\n\n• /omzet - Cek total omzet hari ini\n• /stok - Cek status stok barang\n• /help - Bantuan perintah`
      } 
      else if (text === '/omzet') {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { data: transactions } = await supabase
          .from('transactions')
          .select('total_amount, payment_method')
          .eq('store_id', store.id)
          .gte('created_at', todayStart.toISOString())

        if (!transactions || transactions.length === 0) {
          replyText = `📊 *Laporan Omzet Hari Ini*\n\n🏪 Toko: ${store.name}\nBelum ada transaksi tercatat hari ini.`
        } else {
          const totalOmzet = transactions.reduce((sum, t) => sum + t.total_amount, 0)
          const cash = transactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + t.total_amount, 0)
          const nonCash = transactions.filter(t => t.payment_method !== 'cash').reduce((sum, t) => sum + t.total_amount, 0)
          replyText = `📊 *Laporan Omzet (${store.name})*\n\n💰 *Total: Rp ${totalOmzet.toLocaleString('id-ID')}*\n• Tunai: Rp ${cash.toLocaleString('id-ID')}\n• Non-Tunai: Rp ${nonCash.toLocaleString('id-ID')}\n• Total Pesanan: ${transactions.length}`
        }
      } 
      else if (text === '/stok') {
        const { data: products } = await supabase
          .from('products')
          .select('name, stock, category')
          .eq('store_id', store.id)
          .order('stock', { ascending: true })

        if (!products || products.length === 0) {
          replyText = `📦 *Informasi Stok*\n\nBelum ada produk di toko *${store.name}*.`
        } else {
          replyText = `📦 *Status Stok Produk (${store.name})*\n\n`
          products.forEach(p => {
            const icon = p.stock <= 0 ? '🔴 [HABIS]' : p.stock <= 5 ? '🟡 [MENIPIS]' : '🟢'
            replyText += `${icon} *${p.name}* (${p.category || 'UMUM'}): *${p.stock} pcs*\n`
          })
        }
      }

      if (replyText) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: 'Markdown'
          })
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}