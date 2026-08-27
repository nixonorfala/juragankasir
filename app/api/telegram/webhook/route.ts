import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '../../../../src/lib/supabase'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message

    if (!message || !message.text) {
      return NextResponse.json({ status: 'ignored' })
    }

    const chatId = message.chat.id.toString()
    const text = message.text.trim()

    // 1. Cek Toko berdasarkan Chat ID
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('telegram_chat_id', chatId)
      .single()

    if (storeError || !store) {
      // Jika chat belum terdaftar, abaikan atau beri info
      return NextResponse.json({ status: 'ok' })
    }

    // 2. Command /omzet (Fitur sebelumnya)
    if (text === '/omzet') {
      const todayStr = new Date().toISOString().split('T')[0]
      const { data: transactions } = await supabase
        .from('transactions')
        .select('total_amount, payment_method')
        .eq('store_id', store.id)
        .gte('created_at', `${todayStr}T00:00:00.000Z`)

      const totalOmzet = transactions?.reduce((sum, trx) => sum + trx.total_amount, 0) || 0
      const cashOmzet = transactions?.filter(t => t.payment_method === 'cash').reduce((sum, trx) => sum + trx.total_amount, 0) || 0
      const qrisOmzet = transactions?.filter(t => t.payment_method !== 'cash').reduce((sum, trx) => sum + trx.total_amount, 0) || 0

      const replyText = `📈 *OMZET HARI INI* 📈\n\n` +
                        `🏪 Toko: ${store.name}\n\n` +
                        `💵 Tunai: Rp ${cashOmzet.toLocaleString('id-ID')}\n` +
                        `💳 Non-Tunai: Rp ${qrisOmzet.toLocaleString('id-ID')}\n\n` +
                        `💰 *Total: Rp ${totalOmzet.toLocaleString('id-ID')}*`

      await sendMessage(chatId, replyText)
    } 
    // 3. Command /tanya [pertanyaan] untuk Konsultasi AI via Telegram
    else if (text.startsWith('/tanya')) {
      const userQuery = text.replace('/tanya', '').trim()
      if (!userQuery) {
        await sendMessage(chatId, '⚠️ Format salah. Ketik contoh: `/tanya Bagaimana omzet minggu ini dan produk apa yang bagus dibundle?`')
        return NextResponse.json({ status: 'ok' })
      }

      // Tarik data toko untuk konteks AI
      const { data: transactions } = await supabase.from('transactions').select('total_amount, payment_method, created_at').eq('store_id', store.id)
      const { data: expenses } = await supabase.from('cash_expenses').select('amount, description').eq('store_id', store.id)
      const { data: products } = await supabase.from('products').select('name, price, stock, category').eq('store_id', store.id)

      const totalOmzet = transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0
      const totalExpense = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
      const netIncome = totalOmzet - totalExpense

      const productSummary = products?.map(p => `- ${p.name} (Kategori: ${p.category}, Harga: Rp ${p.price}, Stok: ${p.stock})`).join('\n') || ''

      const systemInstruction = `
        Anda adalah AI Financial & Business Advisor untuk toko "${store.name}".
        Data Keuangan: Omzet Total Rp ${totalOmzet.toLocaleString('id-ID')}, Pengeluaran Rp ${totalExpense.toLocaleString('id-ID')}, Bersih Rp ${netIncome.toLocaleString('id-ID')}.
        Produk:\n${productSummary}
        Berikan saran bisnis/keuangan yang taktis, ramah, dan solutif dalam Bahasa Indonesia.
      `

      // Panggil Gemini API
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: userQuery }] }],
        config: { systemInstruction, temperature: 0.7 }
      })

      await sendMessage(chatId, `🤖 *AI Advisor:* \n\n${aiResponse.text}`)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

async function sendMessage(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  })
}