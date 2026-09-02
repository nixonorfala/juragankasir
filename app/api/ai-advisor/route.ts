import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '../../../src/lib/supabase'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

export async function POST(req: Request) {
  try {
    const { storeId, messages } = await req.json()

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID tidak ditemukan' }, { status: 400 })
    }

    // 1. Tarik Data Toko & Transaksi dari Supabase secara Real-Time
    const { data: storeData } = await supabase.from('stores').select('name').eq('id', storeId).single()
    const { data: transactions } = await supabase.from('transactions').select('total_amount, payment_method, created_at').eq('store_id', storeId)
    const { data: expenses } = await supabase.from('cash_expenses').select('amount, description, created_at').eq('store_id', storeId)
    const { data: products } = await supabase.from('products').select('name, price, stock, category').eq('store_id', storeId)

    // 2. Kalkulasi Ringkas Data untuk Konteks AI
    const totalOmzet = transactions?.reduce((sum: number, t: { total_amount: number }) => sum + t.total_amount, 0) || 0
    const totalExpense = expenses?.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0) || 0
    const netIncome = totalOmzet - totalExpense

    const productSummary = products?.map((p: { name: string; category: string; price: number; stock: number }) => 
      `- ${p.name} (Kategori: ${p.category}, Harga: Rp ${p.price}, Stok: ${p.stock})`
    ).join('\n') || 'Tidak ada data produk'

    const expenseSummary = expenses?.map((e: { description: string; amount: number }) => 
      `- ${e.description}: Rp ${e.amount}`
    ).slice(-5).join('\n') || 'Tidak ada pengeluaran'

    // 3. Susun System Prompt / Context Injection
    const systemInstruction = `
      Anda adalah AI Financial & Business Advisor ahli untuk UMKM pencatat POS bernama "${storeData?.name || 'Toko'}".
      Berikut adalah data keuangan dan operasional toko saat ini secara real-time:
      - Total Omzet Keseluruhan: Rp ${totalOmzet.toLocaleString('id-ID')}
      - Total Pengeluaran Kas: Rp ${totalExpense.toLocaleString('id-ID')}
      - Estimasi Pendapatan Bersih: Rp ${netIncome.toLocaleString('id-ID')}
      
      Daftar Produk:
      ${productSummary}

      Pengeluaran Kas Terbaru:
      ${expenseSummary}

      Tugas Anda:
      1. Berikan analisis kesehatan keuangan toko yang tajam, profesional, namun santai ala konsultan bisnis berpengalaman.
      2. Berikan rekomendasi strategis otomatis (misal: pengeluaran yang bengkak, strategi bundling produk, atau pengelolaan stok).
      3. Jawab pertanyaan konsultasi dengan merujuk pada data toko di atas secara akurat. Gunakan bahasa Indonesia yang ramah, lugas, dan solutif.
    `

    // Format chat history untuk SDK @google/genai
    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))

    // Mekanisme Retry otomatis jika terjadi error 503 (Overload)
    let responseText = ''
    let retries = 3
    let delay = 2000

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: formattedMessages,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        })
        responseText = response.text || ''
        break
      } catch (err: any) {
        const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand') || err?.message?.includes('UNAVAILABLE')
        if (is503 && attempt < retries) {
          console.warn(`Model AI sedang sibuk (Percobaan ${attempt}/${retries}), mencoba lagi dalam ${delay}ms...`)
          await new Promise(res => setTimeout(res, delay))
          delay *= 2
        } else {
          throw err
        }
      }
    }

    return NextResponse.json({ reply: responseText })

  } catch (error: any) {
    console.error('AI Advisor Error:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan pada AI' }, { status: 500 })
  }
}