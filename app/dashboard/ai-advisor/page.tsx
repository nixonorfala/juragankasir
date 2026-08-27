'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIAdvisorPage() {
  const router = useRouter()
  const [storeId, setStoreId] = useState('')
  const [loading, setLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Halo, Juragan! Saya AI Financial Advisor Anda. Saya sudah membaca data omzet, produk, dan pengeluaran toko secara real-time. Ada yang bisa saya bantu analisis atau diskusikan hari ini?'
    }
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')

      const { data: userData } = await supabase
        .from('users')
        .select('store_id, role')
        .eq('id', session.user.id)
        .single()

      if (!userData || userData.role !== 'owner') return router.push('/login')

      setStoreId(userData.store_id)
    }
    init()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || loading) return

    const userMsg = inputMessage.trim()
    setInputMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          messages: [...messages, { role: 'user', content: userMsg }]
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err: any) {
      alert('Gagal mendapatkan respons AI: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-800">🤖 AI Financial & Business Advisor</h1>
          <p className="text-xs text-gray-500">Konsultasi strategi dan analisis kesehatan keuangan toko secara real-time</p>
        </div>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition">
          Kembali ke Dashboard
        </button>
      </header>

      {/* CHAT CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none text-gray-800 leading-normal space-y-2">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-500 p-4 rounded-2xl text-sm animate-pulse shadow-sm">
              AI sedang menganalisis data keuangan toko...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT FORM */}
      <div className="bg-white border-t p-4 shadow-md">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input 
            type="text" 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tanyakan analisis keuangan, ide bundling, atau strategi toko..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold text-sm rounded-xl shadow transition"
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  )
}