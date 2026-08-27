'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  price: number
  hpp: number
  stock: number
  category: string
}

export default function ProductsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')
  const [products, setProducts] = useState<Product[]>([])

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    hpp: '',
    stock: '',
    category: 'Minuman'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      fetchProducts(userData.store_id)
    }
    initData()
  }, [router])

  const fetchProducts = async (sId: string) => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', sId)
      .order('name', { ascending: true })

    if (data) setProducts(data)
    setLoading(false)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase
      .from('products')
      .insert([{
        store_id: storeId,
        name: formData.name,
        price: Number(formData.price),
        hpp: Number(formData.hpp),
        stock: Number(formData.stock),
        category: formData.category
      }])

    if (error) {
      alert('Gagal menambah produk: ' + error.message)
    } else {
      setFormData({ name: '', price: '', hpp: '', stock: '', category: 'Minuman' })
      fetchProducts(storeId)
    }
    setIsSubmitting(false)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) fetchProducts(storeId)
  }

  if (loading) return <div className="py-8 text-gray-500">Memuat produk...</div>

  return (
    <div className="space-y-8 max-w-6xl">
      <h2 className="text-2xl font-bold text-gray-900">Kelola Menu & Produk</h2>

      {/* Form Tambah Produk */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tambah Menu Baru</h3>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Menu</label>
            <input 
              type="text" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900"
              placeholder="Contoh: Kopi Susu Aren"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900 bg-white"
            >
              <option value="Minuman">Minuman</option>
              <option value="Makanan">Makanan</option>
              <option value="Dessert">Dessert</option>
              <option value="Snack">Snack</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Modal (Rp)</label>
            <input 
              type="number" required min={0} value={formData.hpp}
              onChange={(e) => setFormData({ ...formData, hpp: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900"
              placeholder="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Rp)</label>
            <input 
              type="number" required min={0} value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900"
              placeholder="15000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
            <input 
              type="number" required min={0} value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900"
              placeholder="50"
            />
          </div>
          <div className="md:col-span-5">
            <button 
              type="submit" disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Menu'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Daftar Produk */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b whitespace-nowrap">
                <th className="p-4">Nama Menu</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga Modal (HPP)</th>
                <th className="p-4">Harga Jual</th>
                <th className="p-4">Stok</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800 text-sm">
              {products.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">Belum ada menu terdaftar.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">{p.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-gray-100 text-gray-700">
                        {p.category || 'Umum'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      Rp {(p.hpp || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      Rp {p.price.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">{p.stock}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1 rounded bg-red-50"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}