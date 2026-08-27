'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
  const router = useRouter()
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // GANTI DENGAN NOMOR WA ADMIN LU (Gunakan format 628xxx tanpa tanda + atau 0 di depan)
  const ADMIN_WA_NUMBER = '6281234567890' 

  useEffect(() => {
    async function fetchStoreData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')

      const { data: userData } = await supabase
        .from('users')
        .select('store_id, role, stores (*)')
        .eq('id', session.user.id)
        .single()

      if (!userData || userData.role !== 'owner') return router.push('/login')

      setStore(userData.stores)
      setLoading(false)
    }
    fetchStoreData()
  }, [router])

  // FUNGSI BARU: Nembak ke WhatsApp Admin
  const handleSubscribe = (months: number, price: number, planName: string) => {
    if (!store) return

    const text = `Halo Admin JuraganKasir, saya mau perpanjang/aktifkan langganan.\n\nNama Toko: *${store.name}*\nStore ID: *${store.id}*\nPaket Pilihan: *${planName} (Rp ${price.toLocaleString('id-ID')})*\n\nMohon instruksi pembayarannya.`
    
    const encodedText = encodeURIComponent(text)
    const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodedText}`
    
    // Redirect owner ke WhatsApp di tab baru
    window.open(waUrl, '_blank')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memuat Data Langganan...</div>
  }

  const isTrial = store?.subscription_status === 'trial'
  const endDate = isTrial ? store?.trial_ends_at : store?.subscription_ends_at
  const formattedDate = endDate ? new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum aktif'

  // Opsi Skema Harga
  const plans = [
    { months: 1, name: 'Paket 1 Bulan', price: 49000, desc: 'Akses penuh fitur POS selama 30 hari.' },
    { months: 3, name: 'Paket 3 Bulan', price: 147000, desc: 'Cocok untuk evaluasi bisnis kuartalan.' },
    { months: 6, name: 'Paket 6 Bulan', price: 294000, desc: 'Operasional tenang setengah tahun penuh.' },
    { months: 12, name: 'Paket 1 Tahun', price: 588000, desc: 'Pilihan hemat dan aman untuk jangka panjang.', highlight: true },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            💳 Status Langganan Toko
          </h2>
          <p className="text-gray-500 text-sm mt-1">Kelola paket langganan JuraganKasir untuk menjaga operasional toko tetap aktif.</p>
        </div>

        {/* STATUS CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Status Saat Ini</p>
            <div className="text-3xl font-extrabold text-blue-900 capitalize">
              {store?.subscription_status || 'Trial'}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Berlaku hingga: <strong className="text-gray-800 font-semibold">{formattedDate}</strong>
            </p>
          </div>
          <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 text-sm text-blue-800 max-w-sm">
            Tingkatkan atau perpanjang masa aktif langganan Anda melalui pilihan paket di bawah ini. Pembayaran diproses manual via WhatsApp demi keamanan & kenyamanan.
          </div>
        </div>

        {/* PRICING PLANS */}
        <div className="pt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Pilih Paket Perpanjangan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.months} 
                className={`relative bg-white p-6 rounded-2xl shadow-sm border flex flex-col transition-all hover:shadow-md ${plan.highlight ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Terpopuler
                  </span>
                )}
                
                <div className="flex-1">
                  <h4 className="text-base font-bold text-gray-900">{plan.name}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 min-h-[34px]">{plan.desc}</p>
                  
                  <div className="mt-4 mb-6">
                    <span className="text-2xl font-extrabold text-gray-900">Rp {plan.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleSubscribe(plan.months, plan.price, plan.name)}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                >
                  Perpanjang via WA
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}