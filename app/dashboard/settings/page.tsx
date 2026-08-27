'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'

export default function StoreSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [storeId, setStoreId] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    receipt_footer: '',
    tax_percentage: 0
  })

  useEffect(() => {
    fetchStoreSettings()
  }, [])

  const fetchStoreSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: userData } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', session.user.id)
        .single()

      if (!userData || !userData.store_id) {
        throw new Error('Data user atau store_id tidak ditemukan.')
      }
      
      setStoreId(userData.store_id)

      const { data: storeData, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', userData.store_id)
        .single()

      if (error) throw error

      if (storeData) {
        setFormData({
          name: storeData.name || '',
          slug: storeData.slug || '',
          address: storeData.address || '',
          phone: storeData.phone || '',
          receipt_footer: storeData.receipt_footer || 'Terima kasih atas kunjungan Anda!',
          tax_percentage: storeData.tax_percentage || 0
        })
      }
    } catch (error: any) {
      console.error('Gagal memuat pengaturan:', error.message)
      setMessage({ text: 'Gagal memuat data: ' + error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId) {
      alert('ID Toko tidak valid.')
      return
    }

    setSaving(true)
    setMessage({ text: '', type: '' })

    try {
      const { data: updatedRows, error } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          receipt_footer: formData.receipt_footer,
          tax_percentage: Number(formData.tax_percentage)
        })
        .eq('id', storeId)
        .select()

      if (error) throw error
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('Gagal menyimpan perubahan ke database.')
      }

      setMessage({ text: 'Pengaturan toko berhasil disimpan!', type: 'success' })
    } catch (error: any) {
      setMessage({ text: 'Gagal menyimpan: ' + error.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center text-gray-400 font-medium">Memuat Pengaturan Toko...</div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full font-sans">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan Toko & Merchant</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola identitas toko dan informasi struk kasir.</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* CARD 1: INFORMASI UTAMA */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider pb-3 border-b border-gray-100">1. Informasi Identitas Toko</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Nama Toko</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Kode Merchant / Slug (Unik)</label>
                <input 
                  type="text" 
                  value={formData.slug} 
                  disabled 
                  className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400 mt-1">Kode unik untuk login kasir (tidak dapat diubah).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Nomor Telepon / WhatsApp</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="Contoh: 081234567890" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Alamat Toko</label>
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  placeholder="Contoh: Jl. Merdeka No. 45, Jakarta" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* CARD 2: PENGATURAN STRUK & PAJAK */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider pb-3 border-b border-gray-100">2. Struk Belanja & Pajak</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Pesan Penutup Struk (Footer)</label>
                <textarea 
                  name="receipt_footer" 
                  rows={3}
                  value={formData.receipt_footer} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Persentase Pajak / PPN (%)</label>
                <input 
                  type="number" 
                  name="tax_percentage" 
                  min={0} 
                  max={100} 
                  value={formData.tax_percentage} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Masukkan angka 0 jika tidak mengenakan pajak pada transaksi.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-70 text-sm"
            >
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Pengaturan Toko'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}