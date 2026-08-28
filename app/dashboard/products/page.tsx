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

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

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

  // 👉 HELPER KIRIM NOTIFIKASI AUDIT TELEGRAM
  const sendTelegramAudit = async (msg: string) => {
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('telegram_chat_id')
        .eq('id', storeId)
        .single()

      if (storeData && storeData.telegram_chat_id) {
        await fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: storeData.telegram_chat_id, message: msg })
        })
      }
    } catch (err) {
      console.error('Gagal kirim audit Telegram:', err)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const cleanCategory = formData.category.trim() ? formData.category.trim().toUpperCase() : 'UMUM'

    const { error } = await supabase
      .from('products')
      .insert([{
        store_id: storeId,
        name: formData.name.trim(),
        price: Number(formData.price),
        hpp: Number(formData.hpp),
        stock: Number(formData.stock),
        category: cleanCategory
      }])

    if (error) {
      alert('Gagal menambah produk: ' + error.message)
    } else {
      setFormData({ name: '', price: '', hpp: '', stock: '', category: 'Minuman' })
      fetchProducts(storeId)

      // 👉 NOTIFIKASI TELEGRAM TAMBAH MENU BARU
      await sendTelegramAudit(`📦 *MENU BARU DITAMBAHKAN*\n\n📝 Nama: ${formData.name.trim()}\n🏷️ Kategori: ${cleanCategory}\n💰 Harga Jual: Rp ${Number(formData.price).toLocaleString('id-ID')}\n📊 Stok: ${formData.stock}`)
    }
    setIsSubmitting(false)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    const prodToDelete = products.find(p => p.id === id)
    
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
      fetchProducts(storeId)
      if (prodToDelete) {
        await sendTelegramAudit(`🗑️ *MENU DIHAPUS*\n\n📝 Nama: ${prodToDelete.name}\n🏷️ Kategori: ${prodToDelete.category}`)
      }
    }
  }

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct({ ...product })
    setIsEditModalOpen(true)
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    setIsUpdating(true)

    const cleanCategory = editingProduct.category.trim() ? editingProduct.category.trim().toUpperCase() : 'UMUM'

    const { error } = await supabase
      .from('products')
      .update({
        name: editingProduct.name.trim(),
        category: cleanCategory,
        hpp: Number(editingProduct.hpp),
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock)
      })
      .eq('id', editingProduct.id)

    if (error) {
      alert('Gagal mengupdate produk: ' + error.message)
    } else {
      setIsEditModalOpen(false)
      setEditingProduct(null)
      fetchProducts(storeId)

      // 👉 NOTIFIKASI TELEGRAM AUDIT PERUBAHAN / INDIKASI KECURANGAN HARGA/STOK
      await sendTelegramAudit(`⚠️ *AUDIT PERUBAHAN MENU / PRODUK*\n\n📝 Menu: ${editingProduct.name.trim()}\n💰 Harga Jual Baru: Rp ${Number(editingProduct.price).toLocaleString('id-ID')}\n📦 HPP (Modal): Rp ${Number(editingProduct.hpp).toLocaleString('id-ID')}\n🔢 Stok Baru: ${editingProduct.stock}`)
    }
    setIsUpdating(false)
  }

  if (loading) return <div className="py-8 text-gray-500">Memuat produk...</div>

  return (
    <div className="space-y-8 max-w-6xl">
      <h2 className="text-2xl font-bold text-gray-900">Kelola Menu & Produk</h2>

      {/* Form Tambah Produk dengan Kategori Custom */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tambah Menu Baru</h3>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Menu</label>
            <input 
              type="text" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900 text-sm"
              placeholder="Contoh: Kopi Susu Aren"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori (Bebas / Custom)</label>
            <input 
              type="text" required value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900 text-sm uppercase"
              placeholder="Contoh: MINUMAN / TITIPAN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Modal (Rp)</label>
            <input 
              type="number" required min={0} value={formData.hpp}
              onChange={(e) => setFormData({ ...formData, hpp: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900 text-sm"
              placeholder="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Rp)</label>
            <input 
              type="number" required min={0} value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900 text-sm"
              placeholder="15000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
            <input 
              type="number" required min={0} value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-gray-900 text-sm"
              placeholder="50"
            />
          </div>
          <div className="md:col-span-5">
            <button 
              type="submit" disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm shadow-sm"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Menu Baru'}
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
                      <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">
                        {p.category || 'UMUM'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      Rp {(p.hpp || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      Rp {p.price.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 font-semibold">{p.stock}</td>
                    <td className="p-4 text-center space-x-2">
                      <button 
                        onClick={() => handleOpenEditModal(p)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 transition"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 transition"
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

      {/* MODAL EDIT PRODUK */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit Menu & Produk</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white font-bold text-lg">✕</button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Nama Menu</label>
                <input 
                  type="text" required value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg outline-none text-gray-900 text-sm focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Kategori (Custom)</label>
                <input 
                  type="text" required value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg outline-none text-gray-900 text-sm uppercase focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Harga Modal / HPP (Rp)</label>
                  <input 
                    type="number" required min={0} value={editingProduct.hpp}
                    onChange={(e) => setEditingProduct({ ...editingProduct, hpp: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border rounded-lg outline-none text-gray-900 text-sm focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Harga Jual (Rp)</label>
                  <input 
                    type="number" required min={0} value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border rounded-lg outline-none text-gray-900 text-sm focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Stok Produk</label>
                <input 
                  type="number" required min={0} value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border rounded-lg outline-none text-gray-900 text-sm font-bold focus:border-blue-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">Ubah langsung angka stok di atas jika ada barang masuk atau penyesuaian opname.</p>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="flex-1 px-4 py-2.5 border rounded-xl text-gray-600 text-xs font-bold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating} 
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}