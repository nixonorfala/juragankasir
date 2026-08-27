'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useRouter } from 'next/navigation'

interface Staff {
  id: string
  name: string
  email?: string
  role: string
  pin?: string
}

export default function StaffPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')
  const [staffList, setStaffList] = useState<Staff[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    pin: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State untuk Modal Edit/Set PIN Karyawan
  const [selectedStaffForPin, setSelectedStaffForPin] = useState<Staff | null>(null)
  const [newPinInput, setNewPinInput] = useState('')
  const [isUpdatingPin, setIsUpdatingPin] = useState(false)

  useEffect(() => {
    async function initData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')

      const { data: userData } = await supabase
        .from('users')
        .select('store_id, role')
        .eq('id', session.user.id)
        .single()

      if (!userData || userData.role !== 'owner') return router.push('/login')

      setStoreId(userData.store_id)
      fetchStaff(userData.store_id)
    }
    initData()
  }, [router])

  const fetchStaff = async (sId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, role, pin')
      .eq('store_id', sId)
      .eq('role', 'cashier')
      .order('name', { ascending: true })

    if (data && !error) {
      setStaffList(data)
    }
    setLoading(false)
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.pin || formData.pin.length !== 4) {
      alert('PIN Kasir harus tepat 4 digit angka!')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat akun')

      const { error: dbError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          store_id: storeId,
          name: formData.name,
          role: 'cashier',
          pin: formData.pin
        }])

      if (dbError) throw dbError

      alert('Kasir berhasil didaftarkan!\nSistem akan otomatis mengeluarkan akun Owner untuk alasan keamanan. Silakan login kembali.')
      await supabase.auth.signOut()
      router.push('/login')

    } catch (error: any) {
      alert('Gagal menambah karyawan: ' + error.message)
      setIsSubmitting(false)
    }
  }

  // Fungsi untuk menyimpan PIN baru dari Modal Konfigurasi
  const handleUpdatePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffForPin || newPinInput.length !== 4) {
      alert('PIN harus tepat 4 digit angka!')
      return
    }

    setIsUpdatingPin(true)
    const { error } = await supabase
      .from('users')
      .update({ pin: newPinInput })
      .eq('id', selectedStaffForPin.id)

    if (error) {
      alert('Gagal memperbarui PIN: ' + error.message)
    } else {
      alert(`PIN untuk ${selectedStaffForPin.name} berhasil diperbarui!`)
      setSelectedStaffForPin(null)
      setNewPinInput('')
      fetchStaff(storeId)
    }
    setIsUpdatingPin(false)
  }

  if (loading) return <div className="py-8 text-gray-500">Memuat data karyawan...</div>

  return (
    <div className="space-y-8 max-w-5xl">
      <h2 className="text-2xl font-bold text-gray-900">Kelola Karyawan / Kasir</h2>

      {/* Form Tambah Kasir */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Buat Akun Kasir Baru</h3>
        <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kasir</label>
            <input 
              type="text" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              placeholder="Contoh: Budi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Login</label>
            <input 
              type="email" required value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              placeholder="budi.kasir@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Sistem</label>
            <input 
              type="password" required minLength={6} value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Kasir (4 Digit)</label>
            <input 
              type="text" required maxLength={4} pattern="\d{4}" value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-bold tracking-widest text-center text-lg"
              placeholder="1234"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-4 mt-2">
            <button 
              type="submit" disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Kasir'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Daftar Karyawan */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4">Nama Karyawan</th>
              <th className="p-4">PIN Kasir</th>
              <th className="p-4">Jabatan</th>
              <th className="p-4 text-center">Konfigurasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {staffList.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-gray-500">Belum ada kasir yang didaftarkan.</td></tr>
            ) : (
              staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{staff.name}</td>
                  <td className="p-4 font-mono font-bold tracking-widest text-gray-600">{staff.pin ? '••••' : 'Belum diatur'}</td>
                  <td className="p-4">
                    <span className="uppercase text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
                      {staff.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => { setSelectedStaffForPin(staff); setNewPinInput(''); }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      Atur PIN
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL KONFIGURASI / ATUR PIN */}
      {selectedStaffForPin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 bg-blue-600 text-white">
              <h2 className="text-lg font-bold">Atur PIN Kasir</h2>
              <p className="text-xs text-blue-100 mt-1">Karyawan: <strong>{selectedStaffForPin.name}</strong></p>
            </div>
            <form onSubmit={handleUpdatePinSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Baru (4 Digit Angka)</label>
                <input 
                  type="text" required maxLength={4} pattern="\d{4}" value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-bold tracking-widest text-center text-xl"
                  placeholder="0000"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedStaffForPin(null)} 
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdatingPin} 
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm"
                >
                  {isUpdatingPin ? 'Menyimpan...' : 'Simpan PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}