'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useRouter } from 'next/navigation'

interface Addon {
  id: string
  name: string
  category: string
  additional_price: number
}

export default function AddonsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')
  const [addonsList, setAddonsList] = useState<Addon[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Minuman',
    additional_price: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function initData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')

      const { data: userData } = await supabase.from('users').select('store_id, role').eq('id', session.user.id).single()
      if (!userData || userData.role !== 'owner') return router.push('/login')

      setStoreId(userData.store_id)
      fetchAddons(userData.store_id)
    }
    initData()
  }, [router])

  const fetchAddons = async (sId: string) => {
    const { data } = await supabase.from('product_addons').select('*').eq('store_id', sId).order('category', { ascending: true })
    if (data) setAddonsList(data)
    setLoading(false)
  }

  const handleAddAddon = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase.from('product_addons').insert([{
      store_id: storeId,
      name: formData.name,
      category: formData.category,
      additional_price: Number(formData.additional_price) || 0
    }])

    if (!error) {
      setFormData({ name: '', category: 'Minuman', additional_price: '' })
      fetchAddons(storeId)
    } else {
      alert('Gagal menambah add-on: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const handleDeleteAddon = async (id: string) => {
    if (!confirm('Hapus add-on ini?')) return
    const { error } = await supabase.from('product_addons').delete().eq('id', id)
    if (!error) fetchAddons(storeId)
  }

  if (loading) return <div className="py-8 text-gray-500">Memuat data add-ons...</div>

  return (
    <div className="space-y-8 max-w-5xl">
      <h2 className="text-2xl font-bold text-gray-900">Kelola Varian & Add-Ons</h2>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tambah Varian Baru</h3>
        <form onSubmit={handleAddAddon} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Varian (Contoh: Size Large)</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900" placeholder="Size Large" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Untuk Kategori</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900 bg-white">
              <option value="Semua">Semua Kategori</option>
              <option value="Minuman">Minuman</option>
              <option value="Makanan">Makanan</option>
              <option value="Dessert">Dessert</option>
              <option value="Snack">Snack</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Tambahan (Rp)</label>
            <input type="number" required min={0} value={formData.additional_price} onChange={(e) => setFormData({ ...formData, additional_price: e.target.value })} placeholder="4000" className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900" />
          </div>
          <div className="md:col-span-3">
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg">{isSubmitting ? 'Menyimpan...' : 'Simpan Varian'}</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-gray-50 text-gray-600 text-sm border-b"><th className="p-4">Kategori Target</th><th className="p-4">Nama Varian</th><th className="p-4">Extra Harga</th><th className="p-4 text-center">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {addonsList.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-gray-500">Belum ada varian add-on.</td></tr> : addonsList.map((addon) => (
              <tr key={addon.id} className="hover:bg-gray-50">
                <td className="p-4"><span className="px-2 py-1 rounded text-xs font-bold uppercase bg-gray-100 text-gray-700">{addon.category}</span></td>
                <td className="p-4 font-medium">{addon.name}</td>
                <td className="p-4 text-blue-600 font-bold">+ Rp {addon.additional_price.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center"><button onClick={() => handleDeleteAddon(addon.id)} className="text-red-500 text-xs font-medium px-3 py-1 bg-red-50 rounded">Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}