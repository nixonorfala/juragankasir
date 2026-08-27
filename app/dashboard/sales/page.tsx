'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useRouter } from 'next/navigation'

interface TransactionItem {
  product_name: string
  price: number
  quantity: number
}

interface Transaction {
  id: string
  cashier_name: string
  total_amount: number
  discount_amount?: number
  payment_method: string
  created_at: string
  note?: string
  transaction_items?: TransactionItem[]
}

export default function SalesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')
  const [storeName, setStoreName] = useState('Toko')
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalTrxCount, setTotalTrxCount] = useState(0)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')

      const { data: userData } = await supabase
        .from('users')
        .select('store_id, role')
        .eq('id', session.user.id)
        .single()

      if (!userData || userData.role !== 'owner') {
        router.push('/pos')
        return
      }

      setStoreId(userData.store_id)
      fetchStoreInfo(userData.store_id)
      await fetchReport(userData.store_id, todayStr, todayStr)
      setLoading(false)
    }

    init()
  }, [router, todayStr])

  const fetchStoreInfo = async (sId: string) => {
    const { data } = await supabase.from('stores').select('name').eq('id', sId).single()
    if (data) setStoreName(data.name)
  }

  const fetchReport = async (sId: string, start: string, end: string) => {
    setLoading(true)
    const startDateTime = `${start}T00:00:00`
    const endDateTime = `${end}T23:59:59`

    const { data: trxData } = await supabase
      .from('transactions')
      .select(`*, transaction_items ( product_name, price, quantity )`)
      .eq('store_id', sId)
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime)
      .order('created_at', { ascending: false })

    if (trxData) {
      setTransactions(trxData)
      setTotalTrxCount(trxData.length)
      const revenue = trxData.reduce((sum, trx) => sum + trx.total_amount, 0)
      setTotalRevenue(revenue)
    }
    setLoading(false)
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (storeId) {
      fetchReport(storeId, startDate, endDate)
    }
  }

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor pada rentang tanggal ini.')
      return
    }

    let csvContent = "\uFEFF" 
      + "ID Transaksi;Waktu;Kasir;Metode Pembayaran;Total Pendapatan;Catatan\n"

    transactions.forEach(t => {
      const row = [
        t.id,
        new Date(t.created_at).toLocaleString('id-ID'),
        `"${t.cashier_name}"`,
        t.payment_method.toUpperCase(),
        t.total_amount,
        `"${t.note || '-'}"`
      ].join(";")
      csvContent += row + "\r\n"
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Laporan_Sales_${storeName}_${startDate}_sampai_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-7xl font-sans text-gray-900">
      
      {/* HEADER & TOMBOL EKSPOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Penjualan Historis</h2>
          <p className="text-sm text-gray-500 mt-1">Rekapitulasi transaksi, omzet, dan rincian produk berdasarkan rentang tanggal.</p>
        </div>
        
        <button 
          onClick={handleExportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2"
        >
          📥 Unduh CSV / Excel
        </button>
      </div>

      {/* FILTER FORM INTERAKTIF */}
      <form onSubmit={handleFilterSubmit} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Dari Tanggal</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Sampai Tanggal</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button 
          type="submit"
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition"
        >
          Terapkan Filter
        </button>
      </form>

      {/* SUMMARY CARDS VISUAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Pendapatan (Periode Ini)</p>
          <h3 className="text-2xl font-extrabold text-blue-600 mt-2">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Struk / Transaksi</p>
          <h3 className="text-2xl font-extrabold text-gray-800 mt-2">{totalTrxCount} Transaksi</h3>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Rincian Riwayat Transaksi</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Memuat data laporan...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Tidak ada transaksi pada rentang tanggal tersebut.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="p-4">Waktu</th>
                  <th className="p-4">Kasir</th>
                  <th className="p-4">Metode</th>
                  <th className="p-4">Item Pembelian</th>
                  <th className="p-4">Catatan</th>
                  <th className="p-4 text-right">Total (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {transactions.map(trx => (
                  <tr key={trx.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-600 text-xs">
                      {new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">{trx.cashier_name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-gray-100 text-gray-700">
                        {trx.payment_method}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-xs">
                      {trx.transaction_items?.map((item, idx) => (
                        <div key={idx}>• {item.product_name} ({item.quantity}x @Rp {item.price.toLocaleString('id-ID')})</div>
                      ))}
                    </td>
                    <td className="p-4 text-gray-500 text-xs italic">{trx.note || '-'}</td>
                    <td className="p-4 text-right font-bold text-gray-900">
                      Rp {trx.total_amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}