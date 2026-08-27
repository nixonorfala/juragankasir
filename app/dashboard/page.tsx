'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../src/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')

  // State Filter & Data
  const [dateRange, setDateRange] = useState('today') // 'today', '7d', '30d', 'month'
  const [metrics, setMetrics] = useState({
    bruto: 0,
    netto: 0,
    expenses: 0,
    aov: 0,
    totalTransactions: 0,
    itemsSold: 0,
    cash: 0,
    qris: 0,
    debit: 0,
    cogs: 0, // HPP
    grossProfit: 0 // Laba Kotor
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (storeId) {
      fetchDashboardData()
      fetchLowStock()
    }
  }, [storeId, dateRange])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: userData } = await supabase
      .from('users')
      .select('store_id')
      .eq('id', session.user.id)
      .single()

    if (userData) {
      setStoreId(userData.store_id)
    }
  }

  const getStartDate = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    if (dateRange === '7d') d.setDate(d.getDate() - 7)
    if (dateRange === '30d') d.setDate(d.getDate() - 30)
    if (dateRange === 'month') d.setDate(1)
    return d.toISOString()
  }

  const fetchLowStock = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('store_id', storeId)
      .lt('stock', 10)
      .order('stock', { ascending: true })
      .limit(5)
    
    if (data) setLowStockProducts(data)
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    const startDate = getStartDate()

    // 1. Fetch Transactions
    const { data: trxData } = await supabase
      .from('transactions')
      .select('*, transaction_items(product_name, price, quantity, product_id)')
      .eq('store_id', storeId)
      .gte('created_at', startDate)
      .order('created_at', { ascending: true })

    // 2. Fetch Expenses
    const { data: expData } = await supabase
      .from('cash_expenses')
      .select('amount')
      .eq('store_id', storeId)
      .gte('created_at', startDate)

    // 3. (Opsional) Fetch HPP dari Master Produk untuk ngitung laba
    const { data: prodData } = await supabase
      .from('products')
      .select('id, hpp')
      .eq('store_id', storeId)

    const hppMap = new Map((prodData || []).map(p => [p.id, p.hpp || 0]))

    if (trxData) {
      let bruto = 0, cash = 0, qris = 0, debit = 0, itemsSold = 0, totalCogs = 0
      const productCount: Record<string, { qty: number, rev: number }> = {}
      const dailyChart: Record<string, number> = {}

      trxData.forEach(trx => {
        bruto += trx.total_amount
        if (trx.payment_method === 'cash') cash += trx.total_amount
        if (trx.payment_method === 'qris') qris += trx.total_amount
        if (trx.payment_method === 'debit') debit += trx.total_amount

        // Kelompokkan data untuk Chart
        const dateKey = new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        dailyChart[dateKey] = (dailyChart[dateKey] || 0) + trx.total_amount

        // Hitung Item Terjual & HPP
        trx.transaction_items?.forEach((item: any) => {
          itemsSold += item.quantity
          
          if (!productCount[item.product_name]) productCount[item.product_name] = { qty: 0, rev: 0 }
          productCount[item.product_name].qty += item.quantity
          productCount[item.product_name].rev += (item.price * item.quantity)

          const itemHpp = hppMap.get(item.product_id) || 0
          totalCogs += (itemHpp * item.quantity)
        })
      })

      const totalExpenses = (expData || []).reduce((sum, e) => sum + e.amount, 0)
      const netto = bruto - totalExpenses
      const grossProfit = bruto - totalCogs

      setMetrics({
        bruto,
        netto,
        expenses: totalExpenses,
        aov: trxData.length > 0 ? bruto / trxData.length : 0,
        totalTransactions: trxData.length,
        itemsSold,
        cash, qris, debit,
        cogs: totalCogs,
        grossProfit
      })

      const formattedChart = Object.keys(dailyChart).map(date => ({
        name: date,
        Pendapatan: dailyChart[date]
      }))
      setChartData(formattedChart)

      const sortedTop = Object.entries(productCount)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5)
      setTopProducts(sortedTop)

      setRecentTransactions([...trxData].reverse().slice(0, 5))
    }
    
    setLoading(false)
  }

  if (!storeId) return <div className="h-full flex items-center justify-center bg-gray-50/50">Memuat Dashboard...</div>

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard & Analitik Bisnis</h2>
          <p className="text-gray-500 text-sm mt-1">Pantau performa keuangan dan operasional secara komprehensif.</p>
        </div>
        {/* DATE FILTER */}
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="today">Hari Ini</option>
          <option value="7d">7 Hari Terakhir</option>
          <option value="30d">30 Hari Terakhir</option>
          <option value="month">Bulan Ini</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-400 font-medium">Memuat Analitik Data...</div>
      ) : (
        <div className="space-y-6">
          
          {/* ROW 1: METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Pendapatan (Bruto)</p>
              <h3 className="text-2xl font-black text-blue-600 mb-2">Rp {metrics.bruto.toLocaleString('id-ID')}</h3>
              <span className="inline-block bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded font-semibold">Semua Transaksi</span>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Pengeluaran Kas</p>
              <h3 className="text-2xl font-black text-red-500 mb-2">Rp {metrics.expenses.toLocaleString('id-ID')}</h3>
              <span className="inline-block bg-red-50 text-red-500 text-[10px] px-2 py-1 rounded font-semibold">Kas Keluar</span>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Laba Kotor (Gross Profit)</p>
              <h3 className="text-2xl font-black text-green-500 mb-2">Rp {metrics.grossProfit.toLocaleString('id-ID')}</h3>
              <span className="inline-block bg-green-50 text-green-600 text-[10px] px-2 py-1 rounded font-semibold">Omzet - HPP</span>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Rata-rata Struk (AOV)</p>
              <h3 className="text-2xl font-black text-purple-600 mb-2">Rp {Math.round(metrics.aov).toLocaleString('id-ID')}</h3>
              <span className="inline-block bg-purple-50 text-purple-600 text-[10px] px-2 py-1 rounded font-semibold">Per Transaksi</span>
            </div>
          </div>

          {/* ROW 2: CHART & VOLUME */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CHART AREA */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Tren Penjualan</h3>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={(val) => `Rp ${val/1000}k`} />
                      <Tooltip 
                        formatter={(value: any) => [`Rp ${Number(value || 0).toLocaleString('id-ID')}`, 'Pendapatan']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="Pendapatan" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data transaksi di rentang waktu ini.</div>
                )}
              </div>
            </div>

            {/* VOLUME & METHODS */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Volume Operasional</h3>
                <div className="flex justify-between items-center pb-4 border-b border-gray-50 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Transaksi</p>
                    <p className="text-xl font-bold text-gray-900">{metrics.totalTransactions} Struk</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">Produk Terjual</p>
                    <p className="text-xl font-bold text-gray-900">{metrics.itemsSold} Pcs</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-blue-600">Tunai</span>
                    <span className="font-bold text-gray-800">Rp {metrics.cash.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-teal-600">QRIS</span>
                    <span className="font-bold text-gray-800">Rp {metrics.qris.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-orange-500">Debit</span>
                    <span className="font-bold text-gray-800">Rp {metrics.debit.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: WIDGETS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LOW STOCK ALERT */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Peringatan Stok Menipis</h3>
              </div>
              <div className="space-y-3">
                {lowStockProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">Semua stok produk aman.</p>
                ) : (
                  lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{p.name}</span>
                      <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded">Sisa {p.stock}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TOP PRODUCTS */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center"><span className="mr-2">🏆</span> Produk Paling Laris</h3>
              <div className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada penjualan.</p>
                ) : (
                  topProducts.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 font-bold w-4">{idx + 1}.</span>
                        <div>
                          <p className="text-sm font-bold text-gray-700">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.qty} Terjual</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-blue-600">Rp {p.rev.toLocaleString('id-ID')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RECENT TRANSACTIONS */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center"><span className="mr-2">⚡</span> Transaksi Terbaru</h3>
              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada transaksi.</p>
                ) : (
                  recentTransactions.map(trx => (
                    <div key={trx.id} className="flex justify-between items-center p-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-bold text-gray-500">#{trx.id.substring(0,8)}</p>
                        <p className="text-[10px] text-gray-400">{new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • Kasir: {trx.cashier_name}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-800">Rp {trx.total_amount.toLocaleString('id-ID')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}