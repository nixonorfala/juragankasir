'use client'

import { useState } from 'react'
import { supabase } from '../../src/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterOwner() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [registeredSlug, setRegisteredSlug] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    namaToko: '',
    namaPemilik: '',
    email: '',
    password: '',
    confirmPassword: '',
    kodeReferral: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Password dan Konfirmasi Password tidak sama!')
      setIsLoading(false)
      return
    }

    try {
      // 1. Buat Akun Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat akun')

      // 2. Generate Slug / Kode Merchant
      let slug = formData.namaToko.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const randomSuffix = Math.floor(100 + Math.random() * 900)
      slug = `${slug}-${randomSuffix}`

      // 3. AMAN: Set Trial Awal 7 Hari (Tidak langsung 1 bulan gratis agar terhindar dari kecolongan)
      const trialDays = 7;
      const today = new Date();
      const expiredDate = new Date(today.getTime() + (trialDays * 24 * 60 * 60 * 1000));
      const formattedExpiredDate = expiredDate.toISOString();

      const cleanReferralCode = formData.kodeReferral.trim().toUpperCase()

      // 4. Simpan Data Toko Baru dengan Status Trial
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .insert([{ 
           name: formData.namaToko, 
           slug: slug,
           subscription_status: 'trial',
           trial_ends_at: formattedExpiredDate,
           referred_by: cleanReferralCode || null
        }])
        .select()
        .single()

      if (storeError) throw storeError

      // 5. Simpan Profil Owner
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          store_id: storeData.id,
          name: formData.namaPemilik,
          role: 'owner'
        }])

      if (userError) throw userError

      // Tampilkan Layar Sukses
      setRegisteredSlug(slug)
      setIsSuccess(true)

    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan sistem')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-100 p-4 overflow-x-hidden">
        <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-2xl shadow-xl text-center">
          <div className="flex justify-center mb-4 md:mb-6">
            <Image 
              src="/logo-utama.png" 
              alt="JuraganKasir Logo" 
              width={150} 
              height={38} 
              className="h-16 md:h-20 w-auto object-contain" 
            />
          </div>

          <div className="w-14 h-14 md:w-16 md:h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Toko Berhasil Dibuat!</h2>
          <p className="text-gray-600 text-xs md:text-sm mb-5 md:mb-6">Masa Trial 7 Hari lu sudah aktif. Hubungi sales atau admin untuk upgrade paket. Kode Merchant lu:</p>
          
          <div className="bg-blue-50 border border-blue-100 p-3.5 md:p-4 rounded-xl mb-5 md:mb-6">
            <p className="text-[10px] md:text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Kode Merchant / Toko</p>
            <p className="text-lg md:text-xl font-bold text-blue-800 font-mono tracking-wide">{registeredSlug}</p>
          </div>

          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 md:py-3 rounded-xl transition-colors shadow-sm text-xs md:text-sm"
          >
            Lanjut ke Halaman Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-100 p-4 py-8 md:py-12 overflow-x-hidden">
      <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-2xl shadow-xl">
        
        <div className="flex justify-center mb-4 md:mb-6">
          <Image 
            src="/logo-utama.png" 
            alt="JuraganKasir Logo" 
            width={160} 
            height={40} 
            className="h-16 md:h-20 w-auto object-contain" 
            priority
          />
        </div>

        <div className="text-center mb-5 md:mb-6">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Pendaftaran Akun Owner</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">Daftarkan toko lu dan nikmati Trial 7 Hari</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs md:text-sm rounded-xl text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Nama Toko</label>
            <input 
              type="text" name="namaToko" value={formData.namaToko} onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-xs md:text-sm"
              placeholder="Contoh: Kopi Senja"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Kode Referral Sales (Opsional)</label>
            <input 
              type="text" name="kodeReferral" value={formData.kodeReferral} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-xs md:text-sm uppercase font-mono font-bold"
              placeholder="Contoh: JK-0001"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Nama Pemilik (Owner)</label>
            <input 
              type="text" name="namaPemilik" value={formData.namaPemilik} onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-xs md:text-sm"
              placeholder="Nama lengkap lu"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Email LogIn</label>
            <input 
              type="email" name="email" value={formData.email} onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-xs md:text-sm"
              placeholder="owner@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required minLength={6}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-xs md:text-sm pr-12"
                placeholder="Minimal 6 karakter"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-xs font-semibold text-gray-400 hover:text-gray-600">
                {showPassword ? 'Sembunyi' : 'Lihat'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Konfirmasi Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={6}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-xs md:text-sm pr-12"
                placeholder="Ulangi password"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-xs font-semibold text-gray-400 hover:text-gray-600">
                {showConfirmPassword ? 'Sembunyi' : 'Lihat'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-70 text-xs md:text-sm mt-2">
            {isLoading ? 'Memproses Pendaftaran...' : 'Mulai Trial 7 Hari'}
          </button>
        </form>

        <div className="mt-5 md:mt-6 text-center text-xs md:text-sm text-gray-500">
          Sudah punya akun? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Masuk di sini</Link>
        </div>
      </div>
    </div>
  )
}