'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useRouter } from 'next/navigation'

interface AttendanceRecord {
  id: string
  cashier_name: string
  status: string
  notes: string
  clock_in: string
  clock_out: string | null
}

export default function AttendanceReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')

      const { data: userData } = await supabase
        .from('users')
        .select('store_id, role')
        .eq('id', session.user.id)
        .single()

      if (!userData || userData.role !== 'owner') return router.push('/login')

      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('store_id', userData.store_id)
        .order('clock_in', { ascending: false })

      if (data) setRecords(data)
      setLoading(false)
    }
    init()
  }, [router])

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Kasir,Status,Waktu Masuk,Catatan\n"
    records.forEach(r => {
      csvContent += `"${r.cashier_name}","${r.status}","${new Date(r.clock_in).toLocaleString('id-ID')}","${r.notes || '-'}"\n`
    })
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "laporan_absensi.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="p-8 text-gray-500">Memuat laporan absensi...</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Laporan & Riwayat Absensi Kasir</h2>
        <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
          Ekspor ke CSV / Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4">Nama Kasir</th>
              <th className="p-4">Status Kehadiran</th>
              <th className="p-4">Waktu Absen Masuk</th>
              <th className="p-4">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800 text-sm">
            {records.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-gray-500">Belum ada data absensi tercatat.</td></tr>
            ) : (
              records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold">{r.cashier_name}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${r.status === 'Hadir' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4">{new Date(r.clock_in).toLocaleString('id-ID')}</td>
                  <td className="p-4 text-gray-500 italic">{r.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}