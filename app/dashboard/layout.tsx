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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memuat Dashboard...</div>
  }

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Produk & Menu', href: '/dashboard/products' },
    { name: 'Kelola Add-Ons / Varian', href: '/dashboard/addons' },
    { name: 'Karyawan / Kasir', href: '/dashboard/staff' },
    { name: 'Absensi Karyawan', href: '/dashboard/attendance' }, // 👉 Menu Absensi Diselipkan Disini!
    { name: 'Laporan Penjualan', href: '/dashboard/sales' },
    { name: 'AI Advisor', href: '/dashboard/ai-advisor' },
    { name: 'Langganan & Tagihan', href: '/dashboard/billing' },
    { name: 'Pengaturan Toko', href: '/dashboard/settings' },
    { name: 'Pusat Bantuan', href: '/dashboard/help' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Samping */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-blue-600 tracking-tight">JuraganKasir</h1>
          </div>
          <nav className="p-4 space-y-1">
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

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Toko:</span>
            <span className="font-bold text-gray-800">{storeName}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Halo, <strong className="text-gray-900">{ownerName}</strong></span>
            <button
              onClick={handleLogout}
              className="md:hidden bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Keluar
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}