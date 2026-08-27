'use client'

import { useState } from 'react'
import { supabase } from '../../src/lib/supabase'

export default function MitraSalesPortal() {
  const [identifier, setIdentifier] = useState('')
  const [salesData, setSalesData] = useState<any>(null)
  const [referredStores, setReferredStores] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  const handleLoginSales = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) return

    setLoading(true)
    const { data, error } = await supabase
      .from('sales_agents')
      .select('*')
      .or(`kode_referral.eq.${identifier.trim().toUpperCase()},no_wa.eq.${identifier.trim()}`)
      .single()

    if (error || !data) {
      alert('Kode Referral atau No. WhatsApp tidak ditemukan!')
      setSalesData(null)
    } else {
      setSalesData(data)
      fetchSalesDetails(data.id, data.kode_referral)
    }
    setLoading(false)
  }

  const fetchSalesDetails = async (salesId: string, referralCode: string) => {
    // 1. Ambil semua toko yang merujuk ke kode referral sales ini
    const { data: storeData } = await supabase
      .from('stores')
      .select('name, created_at, subscription_status, trial_ends_at')
      .eq('referred_by', referralCode)
    if (storeData) setReferredStores(storeData)

    // 2. Ambil riwayat penarikan komisi sales ini
    const { data: wdData } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('sales_id', salesId)
      .order('created_at', { ascending: false })
    if (wdData) setWithdrawals(wdData)

    // 3. Refresh data sales terbaru
    const { data: freshSales } = await supabase
      .from('sales_agents')
      .select('*')
      .eq('id', salesId)
      .single()
    if (freshSales) setSalesData(freshSales)
  }

  const handleWithdrawRequest = async () => {
    if (!salesData || salesData.saldo_komisi <= 0) return
    const confirmWd = confirm(`Tarik semua saldo komisi sebesar Rp ${salesData.saldo_komisi.toLocaleString('id-ID')}?`)
    if (!confirmWd) return

    setWithdrawLoading(true)
    const { error } = await supabase.from('withdrawal_requests').insert([{
      sales_id: salesData.id,
      nominal: salesData.saldo_komisi,
      status: 'pending'
    }])

    if (!error) {
      alert('Permintaan tarik komisi berhasil diajukan! Owner akan segera memproses transfer ke rekening lu.')
      fetchSalesDetails(salesData.id, salesData.kode_referral)
    } else {
      alert('Gagal mengajukan: ' + error.message)
    }
    setWithdrawLoading(false)
  }

  const isExpired = (dateString: string) => {
    if (!dateString) return true
    return new Date(dateString) < new Date()
  }

  if (!salesData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-gray-800">Portal Mitra Sales</h1>
            <p className="text-xs text-gray-500">Masukkan Kode Referral atau No. WhatsApp lu</p>
          </div>
          <form onSubmit={handleLoginSales} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Kode Referral / No. WA</label>
              <input 
                type="text" 
                required 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} 
                placeholder="Contoh: JK-0001 atau 08123..." 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-500 font-semibold uppercase" 
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition">
              {loading ? 'Mencari Data...' : 'Masuk Dasbor Sales'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900 pb-12">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-sm flex justify-between items-center">
          <div>
            <span className="text-xs bg-blue-500 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">Mitra Freelance Sales</span>
            <h1 className="text-2xl font-bold mt-1">{salesData.nama}</h1>
            <p className="text-xs text-blue-100 mt-1">Kode Referral: <strong>{salesData.kode_referral}</strong></p>
          </div>
          <button onClick={() => setSalesData(null)} className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 rounded-lg text-xs font-bold transition">Ganti Akun</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Toko Diakuisisi</p>
            <p className="text-2xl font-bold text-gray-800">{referredStores.length} Toko</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Saldo Komisi Aktif</p>
            <p className="text-2xl font-bold text-green-600">Rp {salesData.saldo_komisi.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Pendapatan Bersih</p>
            <p className="text-2xl font-bold text-blue-600">Rp {salesData.total_pendapatan.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-amber-500 text-white p-5 rounded-xl shadow-sm flex justify-between items-center">
          <div>
            <h2 className="font-bold text-base">Mau Tarik Komisi?</h2>
            <p className="text-xs text-amber-100 mt-0.5">Pencairan diproses manual ke rekening: {salesData.info_rekening}</p>
          </div>
          <button 
            onClick={handleWithdrawRequest} 
            disabled={salesData.saldo_komisi <= 0 || withdrawLoading}
            className="px-5 py-2.5 bg-white text-amber-800 hover:bg-amber-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-bold rounded-xl text-xs shadow-sm transition"
          >
            {withdrawLoading ? 'Memproses...' : '💸 Tarik Gaji lu Sob!'}
          </button>
        </div>

        {/* TABEL RIWAYAT PENARIKAN KOMISI */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
          <h2 className="font-bold text-gray-800 text-base">Riwayat Penarikan Gaji / Komisi</h2>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada riwayat penarikan komisi.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {withdrawals.map((wd, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-gray-800">Rp {wd.nominal.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-400">{new Date(wd.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border ${
                      wd.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      • {wd.status === 'paid' ? 'Berhasil (Dicairkan)' : 'Menunggu Approval (Pending)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TABEL TOKO DIAKUISISI (DENGAN STATUS PENDING / TRIAL / AKTIF) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
          <h2 className="font-bold text-gray-800 text-base">Daftar Toko Rujukan (Referral)</h2>
          {referredStores.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada toko yang menggunakan kode referral lu. Yuk mulai tawarkan ke warkop/UMKM terdekat!</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {referredStores.map((store, idx) => {
                const isActive = store.subscription_status === 'active' && !isExpired(store.trial_ends_at)
                
                return (
                  <div key={idx} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-semibold text-gray-800">{store.name}</p>
                      <p className="text-xs text-gray-400">Terdaftar: {new Date(store.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      {isActive ? (
                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-bold">
                          • Aktif Langganan
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-bold">
                          • Pending / Menunggu Pembayaran
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}