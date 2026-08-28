'use client'

import { useState } from 'react'

interface Tutorial {
  id: string
  title: string
  category: string
  content: React.ReactNode
}

export default function HelpCenterPage() {
  const [activeId, setActiveId] = useState<string | null>('t-1')
  const [searchQuery, setSearchQuery] = useState('')

  const toggleAccordion = (id: string) => {
    setActiveId(activeId === id ? null : id)
  }

  // Daftar Tutorial sesuai fitur JuraganKasir
  const tutorials: Tutorial[] = [
    {
      id: 't-1',
      category: 'Mulai Cepat',
      title: '1. Cara Membuka dan Menutup Shift Kasir',
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <p>Sistem JuraganKasir mewajibkan kasir untuk membuka <em>shift</em> sebelum mulai berjualan agar laporan keuangan akurat.</p>
          <ul className="list-decimal pl-5 space-y-1 mt-2 font-medium">
            <li>Masuk ke menu <strong>Mesin Kasir (POS)</strong>.</li>
            <li>Jika shift belum terbuka, akan muncul pop-up peringatan.</li>
            <li>Masukkan nominal <strong>Modal Awal Laci</strong> (uang fisik yang ada di laci kasir sebelum jualan mulai).</li>
            <li>Klik tombol <strong>Mulai Shift Sekarang</strong>.</li>
            <li>Setelah selesai shift, klik tombol merah <strong>Tutup Shift</strong> di sidebar kiri, lalu masukkan sisa uang fisik aktual untuk mencetak Laporan Shift.</li>
          </ul>
        </div>
      )
    },
    {
      id: 't-2',
      category: 'Transaksi',
      title: '2. Cara Melakukan Transaksi & Memberi Diskon',
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <ul className="list-decimal pl-5 space-y-1 font-medium">
            <li>Pilih menu makanan/minuman dari daftar produk di sebelah kiri halaman POS.</li>
            <li>Item akan masuk ke keranjang di sebelah kanan. Anda bisa menambah/mengurangi jumlah <em>(quantity)</em> menggunakan tombol + dan -.</li>
            <li>Klik tombol biru <strong>Bayar</strong>.</li>
            <li>Jika ada diskon, masukkan pada kolom <strong>Diskon / Potongan Harga</strong> (bisa pilih Persen atau Rupiah Nominal).</li>
            <li>Pilih Metode Pembayaran (Tunai / QRIS / Debit). Jika Tunai, masukkan jumlah uang yang diterima dari pelanggan.</li>
            <li>Klik <strong>Konfirmasi & Bayar</strong>, lalu Anda dapat mencetak struk.</li>
          </ul>
        </div>
      )
    },
    {
      id: 't-3',
      category: 'Transaksi',
      title: '3. Menyimpan Pesanan (Open Bill / Gantung Bill)',
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <p>Berguna jika pelanggan memesan dulu tapi bayarnya belakangan (setelah makan selesai).</p>
          <ul className="list-decimal pl-5 space-y-1 mt-2 font-medium">
            <li>Masukkan menu ke keranjang seperti biasa.</li>
            <li>Klik tombol kuning <strong>Simpan Bill</strong> di bagian bawah keranjang.</li>
            <li>Masukkan nama pelanggan atau nomor meja (Contoh: "Meja 4").</li>
            <li>Keranjang akan kosong dan siap melayani pelanggan lain.</li>
            <li>Untuk memanggil kembali tagihan tadi, klik tombol <strong>Bill Simpan</strong> di pojok kanan atas pesanan, lalu pilih <strong>Pilih</strong> pada nama meja pelanggan tersebut.</li>
          </ul>
        </div>
      )
    },
    {
      id: 't-4',
      category: 'Manajemen',
      title: '4. Cara Menambah Karyawan / Akun Kasir Baru',
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <p>Hanya Pemilik Toko (Owner) yang dapat melakukan ini.</p>
          <ul className="list-decimal pl-5 space-y-1 mt-2 font-medium">
            <li>Buka menu <strong>Karyawan / Kasir</strong> dari Dashboard Owner.</li>
            <li>Isi Nama Kasir, Email Login (format bebas), Password Sistem, dan PIN Kasir (4-digit).</li>
            <li>Klik <strong>Daftarkan Kasir</strong>.</li>
            <li>Karyawan kini bisa login menggunakan Email dan Password yang baru saja Anda buat.</li>
          </ul>
        </div>
      )
    },
    {
      id: 't-5',
      category: 'Pengaturan',
      title: '5. Cara Memasukkan Pajak / PPN pada Struk',
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <ul className="list-decimal pl-5 space-y-1 font-medium">
            <li>Buka menu <strong>Pengaturan Toko</strong>.</li>
            <li>Pada bagian <em>Struk Belanja & Pajak</em>, masukkan angka pajak (Contoh: 11 untuk PPN 11%).</li>
            <li>Klik <strong>Simpan Pengaturan Toko</strong>.</li>
            <li>Pajak akan otomatis ditambahkan ke total tagihan setiap kali kasir memproses pesanan di POS.</li>
          </ul>
        </div>
      )
    },
    {
      id: 't-6',
      category: 'Langganan',
      title: '6. Cara Memperpanjang Masa Aktif / Langganan',
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <ul className="list-decimal pl-5 space-y-1 font-medium">
            <li>Masuk ke menu <strong>Langganan & Tagihan</strong>.</li>
            <li>Anda dapat melihat sisa masa aktif toko Anda.</li>
            <li>Pilih paket perpanjangan yang diinginkan (1, 3, 6, atau 12 Bulan).</li>
            <li>Klik <strong>Perpanjang via WA</strong>. Anda akan diarahkan ke WhatsApp Admin JuraganKasir untuk mendapatkan instruksi pembayaran.</li>
            <li>Setelah pembayaran dikonfirmasi, Admin akan langsung memperbarui masa aktif toko Anda.</li>
          </ul>
        </div>
      )
    }
  ]

  // Filter pencarian
  const filteredTutorials = tutorials.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            💡 Pusat Bantuan & Panduan
          </h2>
          <p className="text-gray-500 text-sm mt-1">Pelajari cara menggunakan setiap fitur JuraganKasir agar operasional bisnis Anda maksimal.</p>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari panduan (misal: Diskon, Shift, Langganan)..." 
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* TUTORIAL LIST (ACCORDION) */}
        <div className="space-y-3">
          {filteredTutorials.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-400 text-sm font-medium">Panduan tidak ditemukan. Coba gunakan kata kunci lain.</p>
            </div>
          ) : (
            filteredTutorials.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                <button 
                  onClick={() => toggleAccordion(t.id)}
                  className="w-full text-left p-5 flex justify-between items-center focus:outline-none hover:bg-gray-50/50 transition-colors"
                >
                  <div className="pr-4">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                      {t.category}
                    </span>
                    <h3 className={`text-base font-bold ${activeId === t.id ? 'text-blue-700' : 'text-gray-800'}`}>
                      {t.title}
                    </h3>
                  </div>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${activeId === t.id ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-gray-100 text-gray-500'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${activeId === t.id ? 'max-h-96 opacity-100 border-t border-gray-50' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="p-5 bg-gray-50/30">
                    {t.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* KONTAK ADMIN RESMI */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Pusat Bantuan Resmi JuraganKasir</h1>
          <p className="text-sm text-slate-500 mb-8">
            Butuh bantuan, ada kendala sistem, atau mau upgrade paket? Tim kami siap sedia membantu lu kapan saja. Hubungi kontak resmi kami di bawah ini:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kontak WhatsApp */}
            <a href="https://wa.me/6285646602868?text=Halo%20Admin%20JuraganKasir,%20saya%20butuh%20bantuan." target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-green-50 hover:border-green-200 transition group cursor-pointer">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold">WA</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-green-600">WhatsApp Resmi</p>
                <p className="font-semibold text-slate-800 text-sm">0856-4660-2868</p>
              </div>
            </a>

            {/* Kontak Email */}
            <a href="mailto:juragankasirofficial@gmail.com" className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition group cursor-pointer">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">@</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-600">Email Support</p>
                <p className="font-semibold text-slate-800 text-sm break-all">juragankasirofficial<br/>@gmail.com</p>
              </div>
            </a>

            {/* Kontak Instagram */}
            <a href="https://instagram.com/juragankasir_" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-pink-50 hover:border-pink-200 transition group cursor-pointer">
              <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center font-bold">IG</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-pink-600">Instagram</p>
                <p className="font-semibold text-slate-800 text-sm">@juragankasir_</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}