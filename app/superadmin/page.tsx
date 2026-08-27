'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../src/lib/supabase'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

interface Store {
  id: string
  name: string
  slug: string
  subscription_status: string
  trial_ends_at: string
  address?: string
  phone?: string
  referred_by?: string
}

interface SalesAgent {
  id: string
  nama: string
  kode_referral: string
  no_wa: string
  info_rekening: string
  saldo_komisi: number
  total_pendapatan: number
  created_at: string
}

interface WithdrawalRequest {
  id: string
  sales_id: string
  nominal: number
  status: 'pending' | 'paid' | 'rejected'
  created_at: string
  sales_agents?: {
    nama: string
    no_wa: string
    info_rekening: string
  }
}

export default function SuperadminDashboard() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [salesList, setSalesList] = useState<SalesAgent[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const [activeAdminTab, setActiveAdminTab] = useState<'stores' | 'sales' | 'withdrawals'>('stores')

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') 
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  const [isAddSalesModalOpen, setIsAddSalesModalOpen] = useState(false)
  const [salesName, setSalesName] = useState('')
  const [salesWa, setSalesWa] = useState('')
  const [salesBank, setSalesBank] = useState('')
  const [salesCode, setSalesCode] = useState('')
  const [salesSubmitting, setSalesSubmitting] = useState(false)

  const ADMIN_EMAILS = ['juragankasirofficial@gmail.com']

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.replace('/login')
        return
      }

      if (!session.user.email || !ADMIN_EMAILS.includes(session.user.email)) {
        Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Lu bukan Superadmin!' })
        router.replace('/dashboard')
        return
      }

      setIsAuthorized(true)
      fetchAllData()
    }
    
    checkAuth()
  }, [router])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const { data: storeData, error: storeErr } = await supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true })
      if (storeErr) throw storeErr
      setStores(storeData || [])

      const { data: salesData, error: salesErr } = await supabase
        .from('sales_agents')
        .select('*')
        .order('created_at', { ascending: false })
      if (salesErr) throw salesErr
      setSalesList(salesData || [])

      const { data: wdData, error: wdErr } = await supabase
        .from('withdrawal_requests')
        .select('*, sales_agents(nama, no_wa, info_rekening)')
        .order('created_at', { ascending: false })
      if (wdErr) throw wdErr
      setWithdrawals(wdData || [])

    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message || 'Gagal mengambil data sistem' })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi Pilih Paket Perpanjangan (1, 3, 6 Bulan, atau 1 Tahun) & Tambah Komisi Sales Otomatis
  const handleOpenExtendModal = async (store: Store) => {
    const { value: packageChoice } = await Swal.fire({
      title: `Pilih Paket untuk ${store.name}`,
      text: "Pilih durasi paket langganan yang sudah dibayar oleh merchant:",
      input: 'select',
      inputOptions: {
        '30': 'Paket 1 Bulan (30 Hari)',
        '90': 'Paket 3 Bulan (90 Hari)',
        '180': 'Paket 6 Bulan (180 Hari)',
        '365': 'Paket 1 Tahun (365 Hari)'
      },
      inputPlaceholder: 'Pilih durasi paket',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Aktifkan Paket',
      cancelButtonText: 'Batal'
    })

    if (!packageChoice) return

    const daysToAdd = parseInt(packageChoice)
    executeExtendSubscription(store, daysToAdd)
  }

  const executeExtendSubscription = async (store: Store, days: number) => {
    setActionLoading(store.id)
    try {
      const currentExpiredAt = store.trial_ends_at
      const baseDate = currentExpiredAt && new Date(currentExpiredAt) > new Date() ? new Date(currentExpiredAt) : new Date()
      const newExpiredDate = new Date(baseDate.getTime() + (days * 24 * 60 * 60 * 1000))
      
      // 1. Update masa aktif toko jadi active
      const { error: storeErr } = await supabase
        .from('stores')
        .update({ 
          subscription_status: 'active',
          trial_ends_at: newExpiredDate.toISOString() 
        })
        .eq('id', store.id)

      if (storeErr) throw storeErr

      // 2. Jika toko ini ada kode referral sales, berikan komisi proporsional berdasarkan durasi paket
      if (store.referred_by) {
        const { data: salesData, error: salesFetchErr } = await supabase
          .from('sales_agents')
          .select('id, saldo_komisi')
          .eq('kode_referral', store.referred_by)
          .single()

        if (!salesFetchErr && salesData) {
          // Atur besaran komisi berdasarkan paket (contoh: 1 bln = 20rb, 3 bln = 50rb, 6 bln = 100rb, 1 thn = 200rb)
          let komisiBonus = 20000
          if (days === 90) komisiBonus = 50000
          if (days === 180) komisiBonus = 100000
          if (days === 365) komisiBonus = 200000

          const updatedSaldo = Number(salesData.saldo_komisi || 0) + komisiBonus

          await supabase
            .from('sales_agents')
            .update({ saldo_komisi: updatedSaldo })
            .eq('id', salesData.id)
        }
      }
      
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: `Paket ${days} hari berhasil diaktifkan & komisi sales tercatat.`, timer: 2000, showConfirmButton: false })
      fetchAllData()
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async (storeId: string, storeName: string) => {
    const result = await Swal.fire({
      title: `Blokir Toko ${storeName}?`,
      text: "Kasir toko ini tidak akan bisa login ke sistem selama diblokir.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Blokir!',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    setActionLoading(storeId)
    try {
      const { error } = await supabase.from('stores').update({ subscription_status: 'suspended' }).eq('id', storeId)
      if (error) throw error
      
      Swal.fire({ icon: 'success', title: 'Terblokir!', text: 'Toko berhasil disuspend.', timer: 2000, showConfirmButton: false })
      fetchAllData()
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnsuspend = async (storeId: string, storeName: string) => {
    const result = await Swal.fire({
      title: `Aktifkan Kembali ${storeName}?`,
      text: "Akses login kasir toko ini akan dibuka kembali.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Aktifkan!',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    setActionLoading(storeId)
    try {
      const { error } = await supabase.from('stores').update({ subscription_status: 'active' }).eq('id', storeId)
      if (error) throw error
      
      Swal.fire({ icon: 'success', title: 'Aktif!', text: 'Toko berhasil diaktifkan kembali.', timer: 2000, showConfirmButton: false })
      fetchAllData()
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateSales = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!salesName || !salesWa || !salesBank || !salesCode) {
      Swal.fire({ icon: 'warning', title: 'Lengkapi Data', text: 'Semua kolom wajib diisi!' })
      return
    }

    setSalesSubmitting(true)
    try {
      const { error } = await supabase.from('sales_agents').insert([{
        nama: salesName.trim(),
        no_wa: salesWa.trim(),
        info_rekening: salesBank.trim(),
        kode_referral: salesCode.trim().toUpperCase(),
        saldo_komisi: 0,
        total_pendapatan: 0
      }])

      if (error) throw error

      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Mitra sales baru berhasil didaftarkan.', timer: 2000, showConfirmButton: false })
      setIsAddSalesModalOpen(false)
      setSalesName('')
      setSalesWa('')
      setSalesBank('')
      setSalesCode('')
      fetchAllData()
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message || 'Kode referral mungkin sudah terpakai.' })
    } finally {
      setSalesSubmitting(false)
    }
  }

  const handleApproveWithdrawal = async (wdId: string, salesId: string, nominal: number, salesName: string) => {
    const result = await Swal.fire({
      title: `Proses Tarik Gaji ${salesName}?`,
      text: `Pastikan lu sudah mentransfer Rp ${nominal.toLocaleString('id-ID')} ke rekening tujuan sales. Saldo komisi sales akan direset jadi 0.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Sudah Ditransfer & Selesai!',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    setActionLoading(wdId)
    try {
      const { data: salesData, error: fetchErr } = await supabase
        .from('sales_agents')
        .select('saldo_komisi, total_pendapatan')
        .eq('id', salesId)
        .single()
      if (fetchErr) throw fetchErr

      const newTotalPendapatan = Number(salesData.total_pendapatan || 0) + Number(nominal)
      const newSaldoKomisi = Math.max(0, Number(salesData.saldo_komisi || 0) - Number(nominal))

      const { error: wdErr } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'paid' })
        .eq('id', wdId)
      if (wdErr) throw wdErr

      const { error: salesErr } = await supabase
        .from('sales_agents')
        .update({ 
          saldo_komisi: newSaldoKomisi,
          total_pendapatan: newTotalPendapatan 
        })
        .eq('id', salesId)
      if (salesErr) throw salesErr

      Swal.fire({ icon: 'success', title: 'Selesai!', text: 'Pencairan komisi berhasil dikonfirmasi dan saldo sales telah direset.', timer: 2500, showConfirmButton: false })
      fetchAllData()
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message })
    } finally {
      setActionLoading(null)
    }
  }

  const isExpired = (dateString: string) => {
    if (!dateString) return true
    return new Date(dateString) < new Date()
  }

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) || store.slug.toLowerCase().includes(searchTerm.toLowerCase())
    const isSuspended = store.subscription_status === 'suspended'
    const expired = isExpired(store.trial_ends_at)

    if (filterStatus === 'active') return matchesSearch && !isSuspended && !expired
    if (filterStatus === 'expired') return matchesSearch && !isSuspended && expired
    if (filterStatus === 'suspended') return matchesSearch && isSuspended
    return matchesSearch
  })
  
  const totalStores = stores.length
  const activeStores = stores.filter(s => s.subscription_status !== 'suspended' && !isExpired(s.trial_ends_at)).length
  const expiredStores = stores.filter(s => s.subscription_status === 'suspended' || isExpired(s.trial_ends_at)).length
  const pendingWdCount = withdrawals.filter(w => w.status === 'pending').length

  if (!isAuthorized) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold tracking-widest animate-pulse">MEMVERIFIKASI OTORITAS...</div>

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <nav className="bg-slate-900 text-white px-6 py-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">J</div>
          <h1 className="text-xl font-bold tracking-tight">Superadmin <span className="font-light text-slate-400">Portal</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-full text-slate-300 border border-slate-700 hidden md:block">
            Mode Dewa Aktif
          </span>
          <button onClick={fetchAllData} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition" title="Refresh Data">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4 overflow-x-auto">
          <button 
            onClick={() => setActiveAdminTab('stores')} 
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm whitespace-nowrap ${activeAdminTab === 'stores' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            🏪 Manajemen Toko ({totalStores})
          </button>
          <button 
            onClick={() => setActiveAdminTab('sales')} 
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm whitespace-nowrap ${activeAdminTab === 'sales' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            🤝 Mitra Sales Freelance ({salesList.length})
          </button>
          <button 
            onClick={() => setActiveAdminTab('withdrawals')} 
            className={`relative px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm whitespace-nowrap ${activeAdminTab === 'withdrawals' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            💸 Persetujuan Gaji Sales
            {pendingWdCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                {pendingWdCount}
              </span>
            )}
          </button>
        </div>

        {activeAdminTab === 'stores' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Total Merchant</p>
                  <h3 className="text-3xl font-black text-slate-800">{isLoading ? '-' : totalStores}</h3>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Toko Aktif</p>
                  <h3 className="text-3xl font-black text-slate-800">{isLoading ? '-' : activeStores}</h3>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Expired / Diblokir</p>
                  <h3 className="text-3xl font-black text-slate-800">{isLoading ? '-' : expiredStores}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-full md:w-96">
                <input 
                  type="text" 
                  placeholder="Cari nama toko atau kode slug..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Semua</button>
                <button onClick={() => setFilterStatus('active')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filterStatus === 'active' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>Aktif</button>
                <button onClick={() => setFilterStatus('expired')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filterStatus === 'expired' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>Expired</button>
                <button onClick={() => setFilterStatus('suspended')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filterStatus === 'suspended' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>Diblokir</button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Detail Toko</th>
                      <th className="p-4">Kode Login Kasir</th>
                      <th className="p-4">Status Layanan</th>
                      <th className="p-4">Batas Waktu</th>
                      <th className="p-4 text-center pr-6">Eksekusi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan={5} className="text-center p-10 text-slate-400 font-medium">Menyinkronkan data...</td></tr>
                    ) : filteredStores.length === 0 ? (
                      <tr><td colSpan={5} className="text-center p-10 text-slate-400 font-medium">Tidak ada toko yang ditemukan.</td></tr>
                    ) : (
                      filteredStores.map((store) => {
                        const isSuspended = store.subscription_status === 'suspended'
                        const expired = isExpired(store.trial_ends_at)
                        const statusText = isSuspended ? 'Suspended' : expired ? 'Expired' : 'Active'
                        
                        return (
                          <tr key={store.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-900 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                {store.name ? store.name.substring(0, 2) : 'TK'}
                              </div>
                              <div>
                                <span 
                                  onClick={() => setSelectedStore(store)} 
                                  className="cursor-pointer hover:text-blue-600 transition"
                                  title="Klik untuk lihat detail"
                                >
                                  {store.name}
                                </span>
                                <span className="block text-[11px] font-normal text-slate-400">ID: {store.id.substring(0, 8)}...</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-md font-mono text-xs text-slate-600 border border-slate-200">{store.slug}</span>
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border ${
                                statusText === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                                statusText === 'Expired' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}>
                                • {statusText}
                              </span>
                            </td>
                            <td className={`p-4 font-medium ${expired ? 'text-red-500' : 'text-slate-600'}`}>
                              {store.trial_ends_at ? new Date(store.trial_ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum diset'}
                            </td>
                            <td className="p-4 pr-6">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleOpenExtendModal(store)}
                                  disabled={actionLoading === store.id}
                                  className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                                >
                                  + Pilih Paket
                                </button>
                                
                                {isSuspended ? (
                                  <button 
                                    onClick={() => handleUnsuspend(store.id, store.name)}
                                    disabled={actionLoading === store.id}
                                    className="bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                                  >
                                    Aktifkan
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleSuspend(store.id, store.name)}
                                    disabled={actionLoading === store.id}
                                    className="bg-white border border-slate-200 text-slate-500 hover:bg-red-600 hover:text-white hover:border-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                                  >
                                    Blokir
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeAdminTab === 'sales' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Daftar Mitra Sales Freelance</h2>
                <p className="text-xs text-slate-500 mt-0.5">Kelola data agen sales dan pantau performa perolehan toko mereka.</p>
              </div>
              <button 
                onClick={() => setIsAddSalesModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition flex items-center gap-2"
              >
                <span>+ Tambah Sales Baru</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 pl-6">Nama & Kontak</th>
                    <th className="p-4">Kode Referral</th>
                    <th className="p-4">Info Rekening Pencairan</th>
                    <th className="p-4 text-right">Saldo Komisi</th>
                    <th className="p-4 text-right pr-6">Total Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesList.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-10 text-slate-400 font-medium">Belum ada mitra sales yang terdaftar.</td></tr>
                  ) : (
                    salesList.map((sales) => (
                      <tr key={sales.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-900">
                          {sales.nama}
                          <span className="block text-xs font-normal text-slate-400">WA: {sales.no_wa}</span>
                        </td>
                        <td className="p-4">
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-mono font-bold text-xs border border-blue-200">{sales.kode_referral}</span>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600">{sales.info_rekening}</td>
                        <td className="p-4 text-right font-bold text-green-600">Rp {sales.saldo_komisi.toLocaleString('id-ID')}</td>
                        <td className="p-4 text-right font-bold text-slate-800 pr-6">Rp {sales.total_pendapatan.toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeAdminTab === 'withdrawals' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Persetujuan Tarik Komisi (Withdrawals)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daftar permintaan pencairan gaji/komisi dari sales yang perlu ditransfer manual.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 pl-6">Waktu Request</th>
                    <th className="p-4">Nama Sales</th>
                    <th className="p-4">Tujuan Rekening</th>
                    <th className="p-4">Nominal Tarik</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center pr-6">Aksi Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-10 text-slate-400 font-medium">Belum ada riwayat permintaan penarikan komisi.</td></tr>
                  ) : (
                    withdrawals.map((wd) => (
                      <tr key={wd.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-4 pl-6 text-xs text-slate-500">
                          {new Date(wd.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })} {new Date(wd.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {wd.sales_agents?.nama || 'Sales Terhapus'}
                          <span className="block text-xs font-normal text-slate-400">WA: {wd.sales_agents?.no_wa}</span>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-700">{wd.sales_agents?.info_rekening || '-'}</td>
                        <td className="p-4 font-black text-blue-600">Rp {wd.nominal.toLocaleString('id-ID')}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border ${
                            wd.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            • {wd.status}
                          </span>
                        </td>
                        <td className="p-4 text-center pr-6">
                          {wd.status === 'pending' ? (
                            <button 
                              onClick={() => handleApproveWithdrawal(wd.id, wd.sales_id, wd.nominal, wd.sales_agents?.nama || 'Sales')}
                              disabled={actionLoading === wd.id}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                            >
                              {actionLoading === wd.id ? 'Memproses...' : '✓ Proses & Selesai'}
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">Sudah Dicairkan</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {isAddSalesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase">Pendaftaran Internal</span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">Tambah Mitra Sales Baru</h3>
              </div>
              <button onClick={() => setIsAddSalesModalOpen(false)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSales} className="space-y-4 text-sm mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Nama Lengkap Sales</label>
                <input 
                  type="text" 
                  required 
                  value={salesName} 
                  onChange={(e) => setSalesName(e.target.value)} 
                  placeholder="Contoh: Andi Pratama" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Nomor WhatsApp Aktif</label>
                <input 
                  type="text" 
                  required 
                  value={salesWa} 
                  onChange={(e) => setSalesWa(e.target.value)} 
                  placeholder="Contoh: 08123456789" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Kode Referral Unik</label>
                <input 
                  type="text" 
                  required 
                  value={salesCode} 
                  onChange={(e) => setSalesCode(e.target.value)} 
                  placeholder="Contoh: JRG-ANDI" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white uppercase transition font-mono font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Info Rekening / E-Wallet (Pencairan)</label>
                <input 
                  type="text" 
                  required 
                  value={salesBank} 
                  onChange={(e) => setSalesBank(e.target.value)} 
                  placeholder="Contoh: BCA 1234567890 a.n Andi" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddSalesModalOpen(false)} 
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={salesSubmitting} 
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50"
                >
                  {salesSubmitting ? 'Menyimpan...' : 'Simpan Agen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStore && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase">Detail Informasi Toko</span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">{selectedStore.name}</h3>
              </div>
              <button onClick={() => setSelectedStore(null)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">✕</button>
            </div>

            <div className="space-y-4 text-sm mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-slate-500 flex justify-between"><span>Slug / Kode Login:</span> <strong className="font-mono text-slate-800">{selectedStore.slug}</strong></p>
                <p className="text-slate-500 flex justify-between"><span>Status Layanan:</span> <strong className="uppercase text-slate-800">{selectedStore.subscription_status}</strong></p>
                <p className="text-slate-500 flex justify-between"><span>Masa Berakhir:</span> <strong className="text-slate-800">{selectedStore.trial_ends_at ? new Date(selectedStore.trial_ends_at).toLocaleDateString('id-ID') : '-'}</strong></p>
                <p className="text-slate-500 flex justify-between"><span>Kode Referral Sales:</span> <strong className="font-mono text-blue-600">{selectedStore.referred_by || 'Tanpa Sales / Direct'}</strong></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-slate-500"><strong>Alamat Toko:</strong><span className="block text-slate-800 mt-0.5">{selectedStore.address || 'Belum diisi'}</span></p>
                <p className="text-slate-500"><strong>No Telepon:</strong><span className="block text-slate-800 mt-0.5">{selectedStore.phone || 'Belum diisi'}</span></p>
              </div>
            </div>

            <button 
              onClick={() => setSelectedStore(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}