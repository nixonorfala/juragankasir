'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useRouter } from 'next/navigation'

interface Staff {
  id: string
  name: string
  role: string
}

interface SalaryRecord {
  id: string
  employee_name: string
  salary_type: 'monthly' | 'daily'
  base_salary: number
  daily_rate: number
  transport_allowance: number
  bonus: number
  notes: string
}

interface AttendanceItem {
  cashier_name: string
  status: string
}

export default function PayrollPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [salaryList, setSalaryList] = useState<SalaryRecord[]>([])
  const [attendanceCounts, setAttendanceCounts] = useState<{ [name: string]: number }>({})

  // Form State
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [salaryType, setSalaryType] = useState<'monthly' | 'daily'>('monthly')
  const [baseSalary, setBaseSalary] = useState<number | ''>('')
  const [dailyRate, setDailyRate] = useState<number | ''>('')
  const [transportAllowance, setTransportAllowance] = useState<number | ''>('')
  const [bonus, setBonus] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      setStoreId(userData.store_id)
      fetchData(userData.store_id)
    }
    init()
  }, [router])

  const fetchData = async (sId: string) => {
    // 1. Ambil staf toko
    const { data: staffData } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('store_id', sId)
      .order('name', { ascending: true })

    if (staffData) setStaffList(staffData)

    // 2. Ambil data gaji
    const { data: salaryData } = await supabase
      .from('staff_salaries')
      .select('*')
      .eq('store_id', sId)
      .order('employee_name', { ascending: true })

    if (salaryData) setSalaryList(salaryData)

    // 3. Ambil data absensi untuk hitung total hadir
    const { data: attData } = await supabase
      .from('attendance')
      .select('cashier_name, status')
      .eq('store_id', sId)
      .eq('status', 'Hadir')

    if (attData) {
      const counts: { [name: string]: number } = {}
      attData.forEach((item: AttendanceItem) => {
        counts[item.cashier_name] = (counts[item.cashier_name] || 0) + 1
      })
      setAttendanceCounts(counts)
    }

    setLoading(false)
  }

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) {
      alert('Pilih karyawan terlebih dahulu!')
      return
    }

    setIsSubmitting(true)
    const existing = salaryList.find(s => s.employee_name === selectedEmployee)

    const payload = {
      store_id: storeId,
      employee_name: selectedEmployee,
      salary_type: salaryType,
      base_salary: salaryType === 'monthly' ? Number(baseSalary) || 0 : 0,
      daily_rate: salaryType === 'daily' ? Number(dailyRate) || 0 : 0,
      transport_allowance: Number(transportAllowance) || 0,
      bonus: Number(bonus) || 0,
      notes: notes
    }

    if (existing) {
      const { error } = await supabase.from('staff_salaries').update(payload).eq('id', existing.id)
      if (error) alert('Gagal memperbarui gaji: ' + error.message)
      else alert('Data gaji berhasil diperbarui!')
    } else {
      const { error } = await supabase.from('staff_salaries').insert([payload])
      if (error) alert('Gagal menyimpan gaji: ' + error.message)
      else alert('Data gaji berhasil ditambahkan!')
    }

    setSelectedEmployee('')
    setSalaryType('monthly')
    setBaseSalary('')
    setDailyRate('')
    setTransportAllowance('')
    setBonus('')
    setNotes('')
    fetchData(storeId)
    setIsSubmitting(false)
  }

  const handleDeleteSalary = async (id: string) => {
    if (!confirm('Yakin ingin menghapus komponen gaji ini?')) return
    const { error } = await supabase.from('staff_salaries').delete().eq('id', id)
    if (!error) fetchData(storeId)
  }

  if (loading) return <div className="py-8 text-gray-500">Memuat data penggajian...</div>

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Gaji & Penggajian</h2>
        <p className="text-xs text-gray-500 mt-1">Pilih metode gaji bulanan tetap atau otomatis berdasarkan jumlah kehadiran absen.</p>
      </div>

      {/* Form Setup Gaji */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pengaturan Komponen Gaji Karyawan</h3>
        <form onSubmit={handleSaveSalary} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Karyawan</label>
            <select 
              value={selectedEmployee}
              onChange={e => {
                const name = e.target.value
                setSelectedEmployee(name)
                const found = salaryList.find(s => s.employee_name === name)
                if (found) {
                  setSalaryType(found.salary_type || 'monthly')
                  setBaseSalary(found.base_salary)
                  setDailyRate(found.daily_rate)
                  setTransportAllowance(found.transport_allowance)
                  setBonus(found.bonus)
                  setNotes(found.notes || '')
                } else {
                  setSalaryType('monthly')
                  setBaseSalary('')
                  setDailyRate('')
                  setTransportAllowance('')
                  setBonus('')
                  setNotes('')
                }
              }}
              required
              className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Staf --</option>
              {staffList.map(st => (
                <option key={st.id} value={st.name}>{st.name} ({st.role.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode Perhitungan Gaji</label>
            <select 
              value={salaryType}
              onChange={e => setSalaryType(e.target.value as 'monthly' | 'daily')}
              className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Bulanan (Gaji Tetap)</option>
              <option value="daily">Berdasarkan Kehadiran (Harian)</option>
            </select>
          </div>

          {salaryType === 'monthly' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gaji Pokok Bulanan (Rp)</label>
              <input 
                type="number" min={0}
                value={baseSalary}
                onChange={e => setBaseSalary(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 2500000"
                required
                className="w-full px-3 py-2 border rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarif Upah Per Hari (Rp)</label>
              <input 
                type="number" min={0}
                value={dailyRate}
                onChange={e => setDailyRate(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 100000"
                required
                className="w-full px-3 py-2 border rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tunjangan Lain (Rp)</label>
            <input 
              type="number" min={0}
              value={transportAllowance}
              onChange={e => setTransportAllowance(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Contoh: 500000"
              className="w-full px-3 py-2 border rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Kinerja (Rp)</label>
            <input 
              type="number" min={0}
              value={bonus}
              onChange={e => setBonus(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Contoh: 200000"
              className="w-full px-3 py-2 border rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
            <input 
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Potongan kasbon / lembur"
              className="w-full px-3 py-2 border rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 mt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan Gaji'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Ringkasan */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b font-semibold text-sm text-gray-800">
          Ringkasan Gaji & Pendapatan Bersih Karyawan
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-gray-600 text-sm border-b">
              <th className="p-4">Nama Karyawan</th>
              <th className="p-4">Mode Gaji</th>
              <th className="p-4">Rincian Komponen</th>
              <th className="p-4">Total Gaji Bersih</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {salaryList.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Belum ada data gaji yang diatur.</td></tr>
            ) : (
              salaryList.map((item) => {
                const totalHadir = attendanceCounts[item.employee_name] || 0
                let calculatedBase = 0

                if (item.salary_type === 'daily') {
                  calculatedBase = totalHadir * (item.daily_rate || 0)
                } else {
                  calculatedBase = item.base_salary || 0
                }

                const totalTakeHome = calculatedBase + (item.transport_allowance || 0) + (item.bonus || 0)

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold">{item.employee_name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.salary_type === 'daily' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.salary_type === 'daily' ? `Harian (${totalHadir} Hadir)` : 'Bulanan Tetap'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-600 space-y-0.5">
                      {item.salary_type === 'daily' ? (
                        <div>Tarif: Rp {(item.daily_rate || 0).toLocaleString('id-ID')} × {totalHadir} Hadir = <strong className="text-gray-900">Rp {calculatedBase.toLocaleString('id-ID')}</strong></div>
                      ) : (
                        <div>Gaji Pokok = <strong className="text-gray-900">Rp {calculatedBase.toLocaleString('id-ID')}</strong></div>
                      )}
                      <div>Tunjangan: Rp {(item.transport_allowance || 0).toLocaleString('id-ID')} | Bonus: Rp {(item.bonus || 0).toLocaleString('id-ID')}</div>
                      {item.notes && <div className="italic text-gray-400">Catatan: {item.notes}</div>}
                    </td>
                    <td className="p-4 text-sm font-mono font-bold text-blue-600">Rp {totalTakeHome.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDeleteSalary(item.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1 bg-red-50 rounded-lg"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}