'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../src/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [storeName, setStoreName] = useState('Toko')
  const [ownerName, setOwnerName] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('name, role, store_id, stores ( name )')
        .eq('id', session.user.id)
        .single()

      if (!userData || userData.role !== 'owner') {
        router.push('/pos')
        return
      }

      setOwnerName(userData.name)
      
      const storeInfo = userData.stores as any
      if (storeInfo) {
        setStoreName(storeInfo.name || 'Toko')
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-xs">Memuat Dashboard...</div>
  }

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Produk & Menu', href: '/dashboard/products' },
    { name: 'Kelola Add-Ons / Varian', href: '/dashboard/addons' },
    { name: 'Karyawan / Kasir', href: '/dashboard/staff' },
    { name: 'Manajemen Shift', href: '/dashboard/shift' },
    { name: 'Manajemen Gaji', href: '/dashboard/payroll' },
    { name: 'Absensi Karyawan', href: '/dashboard/attendance' },
    { name: 'Laporan Penjualan', href: '/dashboard/sales' },
    { name: 'AI Advisor', href: '/dashboard/ai-advisor' },
    { name: 'Langganan & Tagihan', href: '/dashboard/billing' },
    { name: 'Pengaturan Toko', href: '/dashboard/settings' },
    { name: 'Pusat Bantuan', href: '/dashboard/help' },
  ]

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col md:flex-row overflow-x-hidden">
      {/* SIDEBAR DESKTOP */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-blue-600 tracking-tight">JuraganKasir</h1>
          </div>
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => router.push('/pos')}
            className="w-full mb-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm text-center"
          >
            Buka Mesin Kasir (POS)
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-colors text-center"
          >
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex md:hidden">
          <div className="w-72 bg-white h-full shadow-2xl p-5 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-lg font-black text-blue-600">JuraganKasir</h2>
                  <p className="text-xs text-gray-400">{storeName}</p>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center">✕</button>
              </div>
              <nav className="space-y-1 overflow-y-auto max-h-[calc(100dvh-200px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <button
                onClick={() => { setIsMobileMenuOpen(false); router.push('/pos'); }}
                className="w-full bg-green-600 text-white text-xs font-semibold py-2.5 rounded-xl text-center"
              >
                Buka Mesin Kasir (POS)
              </button>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-semibold text-gray-800">{ownerName}</span>
                <button onClick={handleLogout} className="text-xs text-red-500 font-bold">Keluar Akun</button>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shadow-sm sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition"
              aria-label="Buka Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div className="flex items-center space-x-2 truncate">
              <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">Toko:</span>
              <span className="font-bold text-gray-800 text-sm sm:text-base truncate max-w-[150px] sm:max-w-xs">{storeName}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Halo, <strong className="text-gray-900">{ownerName}</strong></span>
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Keluar
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-8 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}