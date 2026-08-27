import Link from "next/link";
import Image from "next/image";
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export default function Home() {
  return (
    <div className={`min-h-screen flex flex-col bg-white selection:bg-blue-200 text-slate-800 ${poppins.className}`}>
      
      {/* NAVBAR */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
        <div className="flex items-center gap-2">
          {/* LOGO UTAMA DI NAVBAR */}
          <Link href="/">
            <Image 
              src="/logo-utama.png" 
              alt="JuraganKasir Logo" 
              width={240} 
              height={70} 
              className="h-20 w-auto object-contain"
              priority 
            />
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-8 font-medium text-sm text-slate-600">
          <a href="#fitur" className="hover:text-blue-600 transition">Fitur</a>
          <a href="#pricing" className="hover:text-blue-600 transition">Harga</a>
          <a href="#bantuan" className="hover:text-blue-600 transition">Bantuan</a>
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition hidden sm:block">
            Login
          </Link>
          <Link 
            href="/register" 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Coba Gratis
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="pt-16 pb-20 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col-reverse md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Aplikasi POS + AI Pertama
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Sistem Kasir Pintar Buat <span className="text-blue-600">Juragan Masa Kini.</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-xl leading-relaxed mx-auto md:mx-0">
            Kelola transaksi lebih cepat, cegah kebocoran dana dengan notifikasi real-time, dan dapatkan saran bisnis langsung dari AI. Semua dalam satu aplikasi dengan harga paling masuk akal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
            <Link
              href="/register"
              className="flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-white font-bold text-base hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              Mulai 7 Hari Gratis
            </Link>
            <a
              href="#fitur"
              className="flex items-center justify-center rounded-lg bg-white border border-slate-300 px-8 py-3.5 font-bold text-base text-slate-700 hover:bg-slate-50 transition"
            >
              Pelajari Fitur
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-2">Didesain khusus untuk UMKM Indonesia.</p>
        </div>

        <div className="flex-1 w-full relative">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 translate-x-10 translate-y-10 z-0"></div>
          <div className="relative z-10 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[400px]">
            <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex-1 bg-slate-50 p-6 flex gap-4">
              <div className="w-1/3 bg-white border border-slate-100 rounded-xl h-full p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex gap-4">
                   <div className="flex-1 bg-white border border-slate-100 rounded-xl h-24 p-4"><div className="h-4 bg-slate-100 rounded w-1/2 mb-2"></div><div className="h-6 bg-blue-100 rounded w-3/4"></div></div>
                   <div className="flex-1 bg-white border border-slate-100 rounded-xl h-24 p-4"><div className="h-4 bg-slate-100 rounded w-1/2 mb-2"></div><div className="h-6 bg-green-100 rounded w-3/4"></div></div>
                </div>
                <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 relative overflow-hidden">
                   <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-blue-50 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* TRUST BANNER */}
      <section className="border-y border-slate-100 bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Cocok untuk berbagai jenis usaha Anda</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-12 text-slate-600 font-bold">
            <span className="flex items-center gap-2">☕ Coffee Shop</span>
            <span className="flex items-center gap-2">🍲 Rumah Makan</span>
            <span className="flex items-center gap-2">👕 Thrift Store</span>
            <span className="flex items-center gap-2">🛒 Retail & Minimarket</span>
            <span className="flex items-center gap-2">💈 Barbershop</span>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="fitur" className="py-24 space-y-24">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 w-full order-2 md:order-1">
            <div className="bg-slate-100 rounded-2xl aspect-video relative flex items-center justify-center overflow-hidden border border-slate-200">
               <span className="text-6xl">🤖</span>
               <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="h-2 w-20 bg-blue-200 rounded mb-2"></div>
                  <div className="h-3 w-full bg-slate-200 rounded"></div>
               </div>
            </div>
          </div>
          <div className="flex-1 order-1 md:order-2">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-2 block">Kecerdasan Buatan</span>
            <h3 className="text-3xl font-black text-slate-900 mb-4">Konsultan Bisnis Pribadi (AI Advisor)</h3>
            <p className="text-slate-600 leading-relaxed text-lg mb-6">
              Jangan cuma jualan buta. JuraganKasir dilengkapi AI dari Gemini yang otomatis menganalisa laporan penjualan Anda. Sistem akan memberi tahu menu apa yang sedang laku, hari apa yang paling ramai, dan strategi promo yang harus Anda jalankan.
            </p>
            <ul className="space-y-3 font-medium text-slate-700">
              <li className="flex items-center gap-3"><span className="text-blue-600">✔</span> Rekomendasi Promo Akurat</li>
              <li className="flex items-center gap-3"><span className="text-blue-600">✔</span> Analisa Tren Penjualan Harian</li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-2 block">Keamanan Ekstra</span>
            <h3 className="text-3xl font-black text-slate-900 mb-4">Anti-Bocor dengan Notif Telegram</h3>
            <p className="text-slate-600 leading-relaxed text-lg mb-6">
              Tinggalkan toko tanpa was-was. Setiap kali kasir membuka shift, menutup shift, atau menghapus transaksi (void), Anda sebagai Owner akan langsung menerima notifikasi real-time melalui bot Telegram di HP Anda.
            </p>
            <ul className="space-y-3 font-medium text-slate-700">
              <li className="flex items-center gap-3"><span className="text-blue-600">✔</span> Notifikasi Kasir Buka/Tutup Laci</li>
              <li className="flex items-center gap-3"><span className="text-blue-600">✔</span> Cegah Manipulasi Transaksi</li>
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-blue-50 rounded-2xl aspect-video relative flex items-center justify-center overflow-hidden border border-blue-100">
               <span className="text-6xl">📱</span>
               <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-48 bg-white p-4 rounded-xl shadow-lg border border-slate-100 text-xs z-10">
                  <strong className="text-slate-800 block mb-1">Telegram Bot</strong>
                  <span className="text-slate-500">Peringatan: Transaksi Rp 50.000 dibatalkan oleh Kasir.</span>
               </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 w-full order-2 md:order-1">
            <div className="bg-slate-100 rounded-2xl aspect-video relative flex items-center justify-center overflow-hidden border border-slate-200">
               <span className="text-6xl">⚡</span>
            </div>
          </div>
          <div className="flex-1 order-1 md:order-2">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-2 block">Operasional Kasir</span>
            <h3 className="text-3xl font-black text-slate-900 mb-4">Transaksi Sat-Set, Pelanggan Senang</h3>
            <p className="text-slate-600 leading-relaxed text-lg mb-6">
              Sistem POS yang dirancang khusus untuk kecepatan. Masukkan pesanan, beri diskon, hitung pajak (PPN), dan simpan pesanan (Open Bill) dalam hitungan detik.
            </p>
            <Link href="/register" className="inline-block text-blue-600 font-bold hover:text-blue-800 underline underline-offset-4">
              Coba Mesin Kasir Sekarang &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING & FEATURE COMPARISON TABLE SECTION */}
      <section id="pricing" className="py-24 px-6 bg-slate-50 border-t border-slate-100">
         <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Pilih Paket Sesuai Kebutuhan</h2>
               <p className="text-slate-600 mt-4 text-lg">Mulai dari langganan terjangkau dengan fitur lengkap, hingga custom khusus bisnis Anda.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-16">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-6 px-6 bg-white text-slate-900 font-bold text-lg w-[45%]">
                        Fitur JuraganKasir
                      </th>
                      <th className="py-6 px-6 bg-blue-50 text-center border-l border-r border-slate-200 w-[27%]">
                        <div className="text-blue-700 font-black text-xl mb-1">PRO</div>
                        <div className="text-xs text-slate-600 font-medium">Mulai dari Rp 49.000/bln</div>
                      </th>
                      <th className="py-6 px-6 bg-slate-50 text-center w-[28%]">
                        <div className="text-slate-900 font-black text-xl mb-1">Enterprise</div>
                        <div className="text-xs text-slate-500 font-medium">Bikin POS-mu sendiri</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">Aplikasi POS (PC, Laptop, Tablet, HP)</td>
                      <td className="py-4 px-6 text-center text-green-500 border-l border-r border-slate-200">
                         <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </td>
                      <td rowSpan={10} className="py-6 px-6 text-center align-middle bg-slate-50 border-l border-slate-200 relative">
                         <div className="flex flex-col items-center justify-center h-full min-h-[350px] space-y-4">
                            <p className="font-bold text-slate-800 text-lg">Mau custom fitur?</p>
                            <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                               Integrasi ke sistem gudang (ERP), multi-cabang, atau tampilan khusus untuk brand usaha Anda.
                            </p>
                            <a 
                              href="https://wa.me/6281234567890?text=Halo%20JuraganKasir,%20saya%20tertarik%20dengan%20paket%20Enterprise." 
                              target="_blank" 
                              rel="noreferrer"
                              className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition shadow-md whitespace-nowrap mt-2"
                            >
                              Hubungi Admin
                            </a>
                         </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">Cetak Struk (Bluetooth) & Pembayaran QRIS</td>
                      <td className="py-4 px-6 text-center text-green-500 border-l border-r border-slate-200">
                         <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">Manajemen Karyawan & Hak Akses Kasir</td>
                      <td className="py-4 px-6 text-center text-green-500 border-l border-r border-slate-200">
                         <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">Simpan Pesanan (Open Bill / Gantung Bill)</td>
                      <td className="py-4 px-6 text-center text-green-500 border-l border-r border-slate-200">
                         <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">Kelola Diskon & Potongan Harga PPN</td>
                      <td className="py-4 px-6 text-center text-green-500 border-l border-r border-slate-200">
                         <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">Pengaturan Harga Modal & Laba Produk</td>
                      <td className="py-4 px-6 text-center text-green-500 border-l border-r border-slate-200">
                         <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">Rekap Shift & Laporan Buka/Tutup Laci</td>
                      <td className="py-4 px-6 text-center text-green-500 border-l border-r border-slate-200">
                         <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">Ekspor Laporan Penjualan (Excel / PDF)</td>
                      <td className="py-4 px-6 text-center text-green-500 border-l border-r border-slate-200">
                         <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">AI Business Advisor (Support Gemini AI)</td>
                      <td className="py-4 px-6 text-center text-green-500 border-l border-r border-slate-200">
                         <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">Notifikasi Keamanan Anti-Bocor via Telegram</td>
                      <td className="py-4 px-6 text-center text-green-500 border-l border-r border-slate-200">
                         <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* HARGA PAKET PRO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-lg transition-all">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900">1 Bulan</h3>
                     <div className="mt-2 mb-6"><span className="text-3xl font-black text-slate-900">Rp 49rb</span></div>
                  </div>
                  <Link href="/register" className="block w-full py-2.5 bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-900 font-bold rounded-lg transition-colors text-center text-sm">Mulai</Link>
               </div>
               <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-lg transition-all">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900">3 Bulan</h3>
                     <div className="mt-2 mb-6"><span className="text-3xl font-black text-slate-900">Rp 147rb</span></div>
                  </div>
                  <Link href="/register" className="block w-full py-2.5 bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-900 font-bold rounded-lg transition-colors text-center text-sm">Mulai</Link>
               </div>
               <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-lg transition-all">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900">6 Bulan</h3>
                     <div className="mt-2 mb-6"><span className="text-3xl font-black text-slate-900">Rp 294rb</span></div>
                  </div>
                  <Link href="/register" className="block w-full py-2.5 bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-900 font-bold rounded-lg transition-colors text-center text-sm">Mulai</Link>
               </div>
               <div className="relative bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between shadow-xl transform md:-translate-y-2">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm whitespace-nowrap">Terpopuler & Hemat</span>
                  <div>
                     <h3 className="text-lg font-bold text-white mt-1">1 Tahun</h3>
                     <div className="mt-2 mb-6"><span className="text-3xl font-black text-white">Rp 588rb</span></div>
                  </div>
                  <Link href="/register" className="block w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-center text-sm">Pilih Paket</Link>
               </div>
            </div>

         </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-blue-600 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
           <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Siap Bikin Bisnis Makin Maju?</h2>
              <p className="text-blue-100 mb-8 max-w-xl mx-auto text-lg">
                Daftar sekarang, gratis coba 7 hari. Gak pakai kartu kredit, gak ada ikatan kontrak.
              </p>
              <Link href="/register" className="inline-block px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-xl hover:bg-slate-50 transition shadow-lg">
                 Buat Akun Toko Sekarang
              </Link>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="bantuan" className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
           <div className="col-span-1 md:col-span-2">
              <div className="mb-4">
                 <Image src="/logo-utama.png" alt="JuraganKasir Logo" width={150} height={38} className="h-8 w-auto object-contain" />
              </div>
              <p className="max-w-sm text-sm text-slate-500 leading-relaxed">Sistem Point of Sales pintar dengan AI Advisor untuk memajukan UMKM Indonesia.</p>
           </div>
           <div>
              <h4 className="text-slate-900 font-bold mb-4">Produk</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                 <li><a href="#fitur" className="hover:text-blue-600 transition">Fitur POS</a></li>
                 <li><a href="#fitur" className="hover:text-blue-600 transition">Keamanan Telegram</a></li>
                 <li><a href="#pricing" className="hover:text-blue-600 transition">Harga Paket</a></li>
              </ul>
           </div>
           <div>
              <h4 className="text-slate-900 font-bold mb-4">Kontak</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                 <li><a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition">Bantuan / Support WA</a></li>
                 <li><a href="#" className="hover:text-blue-600 transition">Kebijakan Privasi</a></li>
              </ul>
           </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} JuraganKasir. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}