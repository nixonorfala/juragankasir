import { NextResponse } from 'next/server'
import { supabase } from '../../../../src/lib/supabase'

export async function POST(req: Request) {
  try {
    const { storeId } = await req.json()

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID tidak ditemukan' }, { status: 400 })
    }

    // Ambil detail toko
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('name')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 })
    }

    // Payload / Data yang dikirim ke API GOXGATE
    // Sesuaikan endpoint dan payload dengan dokumentasi resmi GOXGATE lu (goxgate.biz.id)
    const goxgateApiKey = process.env.GOXGATE_API_KEY || ''
    const goxgateUrl = 'https://goxgate.biz.id/api/v1/payment/create' // Sesuaikan base URL API GOXGATE

    const payload = {
      api_key: goxgateApiKey,
      amount: 50000, // Harga berlangganan per bulan: Rp 50.000
      merchant_ref: `SUB-${storeId}-${Date.now()}`,
      customer_name: store.name,
      redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/billing?status=success`,
      expired_time: 1440 // dalam menit (24 jam)
    }

    // Eksekusi request ke GOXGATE
    const response = await fetch(goxgateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    // Ambil URL pembayaran dari respons GOXGATE (sesuaikan kodenya jika property dari GOXGATE berbeda, misal result.payment_url)
    const paymentUrl = result.payment_url || result.data?.payment_url

    if (!paymentUrl) {
      // Fallback simulasi development jika API Key GOXGATE belum diset secara spesifik
      return NextResponse.json({ 
        error: 'Gagal terhubung ke gateway GOXGATE. Pastikan GOXGATE_API_KEY sudah terdaftar di .env.local' 
      }, { status: 400 })
    }

    return NextResponse.json({ paymentUrl })

  } catch (err: any) {
    console.error('GOXGATE Checkout Error:', err)
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan pada sistem pembayaran' }, { status: 500 })
  }
}