'use client'

import { useState } from 'react'
import { supabase } from '../../src/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface StoreData {
  id: string
  name: string
  slug: string
}

interface CashierUser {
  id: string
  name: string
  pin: string
  store_id: string
}

export default function Login() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [loginMode, setLoginMode] = useState<'owner' | 'cashier'>('owner')
  
  // State Owner
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  // State Kasir (Sistem Kode Merchant / Toko)
  const [storeSlugInput, setStoreSlugInput] = useState('')
  const [foundStore, setFoundStore] = useState<StoreData | null>(null)
  const [cashierList, setCashierList] = useState<CashierUser[]>([])
  const [selectedCashierId, setSelectedCashierId] = useState('')
  const [pinInput, setPinInput] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal login')

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (userError) throw userError

      if (userData.role === 'owner') {
        router.push('/dashboard')
      } else if (userData.role === 'cashier') {
        router.push('/pos')
      } else {
        throw new Error('Role tidak dikenali')
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Email atau Password salah!')
    } finally {
      setIsLoading(false)
    }
  }

  // Langkah 1: Validasi Kode Merchant / Toko (Slug)
  const handleVerifyStoreCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeSlugInput.trim()) return

    setIsLoading(true)
    setErrorMsg('')

    try {
      // Bersihkan format input jadi lowercase / slug standard (misal: Juragan Coba -> juragan-coba)
      const cleanSlug = storeSlugInput.trim().toLowerCase().replace(/\s+/g, '-')

      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, slug')
        .eq('slug', cleanSlug)
        .single()

      if (storeError || !storeData) {
        throw new Error('Kode Toko / Merchant tidak ditemukan!')
      }

      setFoundStore(storeData)

      // Ambil daftar kasir khusus toko ini
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select('id, name, pin, store_id')
        .eq('store_id', storeData.id)
        .eq('role', 'cashier')
        .order('name', { ascending: true })

      if (staffError) throw staffError
      setCashierList(staffData || [])

    } catch (error: any) {
      setErrorMsg(error.message)
      setFoundStore(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Langkah 2: Verifikasi PIN Kasir
  const handleCashierPinLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCashierId) {
      setErrorMsg('Silakan pilih nama kasir!')
      return
    }
    if (pinInput.length !== 4) {
      setErrorMsg('PIN harus tepat 4 digit angka!')
      return
    }

    setIsLoading(true)
    setErrorMsg('')

    try {
      const cashier = cashierList.find(c => c.id === selectedCashierId)
      if (!cashier) throw new Error('Kasir tidak ditemukan')

      if (!cashier.pin || cashier.pin !== pinInput) {
        throw new Error('PIN Kasir salah!')
      }

      localStorage.setItem('juragankasir_active_cashier', JSON.stringify({
        id: cashier.id,
        name: cashier.name,
        store_id: cashier.store_id,
        role: 'cashier'
      }))

      router.push('/pos')

    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal login dengan PIN')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        
        {/* LOGO DI ATAS HALAMAN LOGIN */}
        <div className="flex justify-center mb-6">
          <Image 
            src="/logo-utama.png" 
            alt="JuraganKasir Logo" 
            width={100} 
            height={30} 
            className="h-25 w-auto object-contain" 
            priority
          />
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm">Sistem Point of Sales & Manajemen Toko</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button 
            type="button"
            onClick={() => { setLoginMode('owner'); setErrorMsg(''); setFoundStore(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${loginMode === 'owner' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Login Owner
          </button>
          <button 
            type="button"
            onClick={() => { setLoginMode('cashier'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${loginMode === 'cashier' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Login Kasir (PIN)
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center font-medium">
            {errorMsg}
          </div>
        )}

        {loginMode === 'owner' ? (
          <div>
            <form onSubmit={handleOwnerLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-sm"
                  placeholder="email@owner.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-sm pr-12"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-xs font-semibold text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-70 text-sm mt-2"
              >
                {isLoading ? 'Memproses...' : 'Masuk Sebagai Owner'}
              </button>
            </form>
            
            {/* Teks Belum Punya Akun */}
            <div className="mt-6 text-center text-sm text-gray-500">
              Belum punya akun? <Link href="/register" className="text-blue-600 font-semibold hover:underline">Daftar di sini, Juragan!</Link>
            </div>
          </div>
        ) : !foundStore ? (
          /* LANGKAH 1: MASUKKAN KODE MERCHANT / KODE TOKO */
          <form onSubmit={handleVerifyStoreCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Kode Merchant / Toko</label>
              <input 
                type="text" 
                value={storeSlugInput}
                onChange={(e) => setStoreSlugInput(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-sm"
                placeholder="Contoh: juragan-coba"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">Masukkan slug/kode unik toko lu (misal: juragan-coba)</p>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-70 text-sm mt-2"
            >
              {isLoading ? 'Memeriksa Kode...' : 'Lanjutkan'}
            </button>
          </form>
        ) : (
          /* LANGKAH 2: PILIH KASIR & MASUKKAN PIN */
          <form onSubmit={handleCashierPinLogin} className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center text-sm">
              <span className="text-gray-600">Toko: <strong className="text-blue-700">{foundStore.name}</strong></span>
              <button 
                type="button" 
                onClick={() => { setFoundStore(null); setSelectedCashierId(''); setPinInput(''); }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Ganti Toko
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Pilih Nama Kasir</label>
              <select 
                value={selectedCashierId}
                onChange={(e) => setSelectedCashierId(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-sm bg-white"
              >
                <option value="">-- Pilih Kasir --</option>
                {cashierList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">PIN 4 Digit</label>
              <input 
                type="password" 
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-center text-2xl font-bold tracking-widest bg-gray-50"
                placeholder="••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-70 text-sm mt-2"
            >
              {isLoading ? 'Memverifikasi...' : 'Masuk Mesin Kasir'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}