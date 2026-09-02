'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useRouter } from 'next/navigation'

interface Staff {
  id: string
  name: string
  role: string
}

interface ShiftSchedule {
  id: string
  employee_name: string
  shift_date: string
  start_time: string
  end_time: string
  is_off_day: boolean
}

export default function ShiftManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [shiftList, setShiftList] = useState<ShiftSchedule[]>([])

  // Form State
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [shiftDate, setShiftDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('16:00')
  const [isOffDay, setIsOffDay] = useState(false)
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
      fetchStaffAndShifts(userData.store_id)
    }
    init()
  }, [router])

  const fetchStaffAndShifts = async (sId: string) => {
    // Ambil daftar karyawan
    const { data: staffData } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('store_id', sId)
      .order('name', { ascending: true })

    if (staffData) setStaffList(staffData)

    // Ambil daftar shift
    const { data: shiftData } = await supabase
      .from('shift_schedules')
      .select('*')
      .eq('store_id', sId)
      .order('shift_date', { ascending: true })

    if (shiftData) setShiftList(shiftData)
    setLoading(false)
  }

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee || !shiftDate) {
      alert('Pilih karyawan dan tanggal shift terlebih dahulu!')
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase
      .from('shift_schedules')
      .insert([{
        store_id: storeId,
        employee_name: selectedEmployee,
        shift_date: shiftDate,
        start_time: isOffDay ? '00:00' : startTime,
        end_time: isOffDay ? '00:00' : endTime,
        is_off_day: isOffDay
      }])

    if (error) {
      alert('Gagal menyimpan shift: ' + error.message)
    } else {
      alert('Jadwal shift berhasil ditambahkan!')
      setSelectedEmployee('')
      setShiftDate('')
      fetchStaffAndShifts(storeId)
    }
    setIsSubmitting(false)
  }

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Yakin ingin menghapus jadwal shift ini?')) return

    const { error } = await supabase
      .from('shift_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      fetchStaffAndShifts(storeId)
    }
  }

  if (loading) return <div className="py-8 text-gray-500">Memuat data shift...</div>

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Shift & Penjadwalan</h2>
        <p className="text-xs text-gray-500 mt-1">Atur jadwal kerja mingguan, jam masuk, dan hari libur karyawan.</p>
      </div>

      {/* Form Tambah Shift */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Buat Jadwal Shift Baru</h3>
        <form onSubmit={handleAddShift} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Karyawan</label>
            <select 
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Shift</label>
            <input 
              type="date"
              value={shiftDate}
              onChange={e => setShiftDate(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Shift</label>
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox"
                id="offday"
                checked={isOffDay}
                onChange={e => setIsOffDay(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="offday" className="text-sm font-medium text-red-600">Hari Libur (Off)</label>
            </div>
          </div>

          {!isOffDay && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Masuk</label>
                <input 
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Pulang</label>
                <input 
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 outline-none"
                />
              </div>
            </>
          )}

          <div className="md:col-span-2 lg:col-span-4 mt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal Shift'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Daftar Shift */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b font-semibold text-sm text-gray-800">
          Daftar Jadwal Shift Aktif
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-gray-600 text-sm border-b">
              <th className="p-4">Tanggal</th>
              <th className="p-4">Nama Karyawan</th>
              <th className="p-4">Jam Kerja</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {shiftList.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Belum ada jadwal shift yang dibuat.</td></tr>
            ) : (
              shiftList.map((shift) => (
                <tr key={shift.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{shift.shift_date}</td>
                  <td className="p-4 font-semibold">{shift.employee_name}</td>
                  <td className="p-4 font-mono text-sm">
                    {shift.is_off_day ? '-' : `${shift.start_time} - ${shift.end_time}`}
                  </td>
                  <td className="p-4">
                    {shift.is_off_day ? (
                      <span className="bg-red-50 text-red-600 font-bold text-xs px-2.5 py-1 rounded">LIBUR</span>
                    ) : (
                      <span className="bg-green-50 text-green-600 font-bold text-xs px-2.5 py-1 rounded">MASUK</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDeleteShift(shift.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1 bg-red-50 rounded-lg"
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
  )
}