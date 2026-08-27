import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, chat_id } = body

    // Ambil Token dari Environment Variable (.env.local)
    const token = process.env.TELEGRAM_BOT_TOKEN

    if (!token || !chat_id) {
      return NextResponse.json({ success: false, error: 'Token atau Chat ID tidak ditemukan' }, { status: 400 })
    }

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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}