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
}

export default function SuperadminDashboard() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // State Fitur Kompleks Baru
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, expired, suspended
  const [selectedStore, setSelectedStore] = useState<Store | null>(null) // Untuk Modal Detail

  // 🛡️ EMAIL SUPERADMIN LU 🛡️
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
      fetchStores()
    }
    
    checkAuth()
  }, [router])

  const fetchStores = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setStores(data || [])
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message || 'Gagal mengambil data toko' })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi Tambah Masa Aktif 30 Hari dengan SweetAlert
  const handleExtendSubscription = async (storeId: string, currentExpiredAt: string, storeName: string) => {
    const result = await Swal.fire({
      title: `Perpanjang ${storeName}?`,
      text: "Masa aktif toko ini akan ditambahkan 30 hari ke depan.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Perpanjang!',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    setActionLoading(storeId)
    try {
      const baseDate = currentExpiredAt && new Date(currentExpiredAt) > new Date() ? new Date(currentExpiredAt) : new Date()
      const newExpiredDate = new Date(baseDate.getTime() + (30 * 24 * 60 * 60 * 1000))
      
      const { error } = await supabase
        .from('stores')
        .update({ 
          subscription_status: 'trial',
          trial_ends_at: newExpiredDate.toISOString() 
        })
        .eq('id', storeId)

      if (error) throw error
      
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Masa aktif toko berhasil ditambah 30 hari.', timer: 2000, showConfirmButton: false })
      fetchStores()
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message })
    } finally {
      setActionLoading(null)
    }
  }

  // Fungsi Blokir / Suspend Toko
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
      fetchStores()
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message })
    } finally {
      setActionLoading(null)
    }
  }

  // Fungsi Unblokir
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
      const { error } = await supabase.from('stores').update({ subscription_status: 'trial' }).eq('id', storeId)
      if (error) throw error
      
      Swal.fire({ icon: 'success', title: 'Aktif!', text: 'Toko berhasil diaktifkan kembali.', timer: 2000, showConfirmButton: false })
      fetchStores()
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

  // Filter & Pencarian Toko Kompleks
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

  if (!isAuthorized) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold tracking-widest animate-pulse">MEMVERIFIKASI OTORITAS...</div>

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Top Navbar */}
      <nav className="bg-slate-900 text-white px-6 py-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">J</div>
          <h1 className="text-xl font-bold tracking-tight">Superadmin <span className="font-light text-slate-400">Portal</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-full text-slate-300 border border-slate-700 hidden md:block">
            Mode Dewa Aktif
          </span>
          <button onClick={fetchStores} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition" title="Refresh Data">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* Stats Grid */}
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

        {/* Control & Search Bar Kompleks */}
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

        {/* Tabel Data Toko */}
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
                              onClick={() => handleExtendSubscription(store.id, store.trial_ends_at, store.name)}
                              disabled={actionLoading === store.id}
                              className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                            >
                              +30 Hari
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

      </div>

      {/* Modal Detail Toko Kompleks */}
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