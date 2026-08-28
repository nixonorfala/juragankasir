import './globals.css'
import SweetAlertInitializer from './components/SweetAlertInitializer'
import { Plus_Jakarta_Sans } from 'next/font/google'

// Optimasi Font Plus Jakarta Sans bawaan Next.js
const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: 'JuraganKasir',
  description: 'Aplikasi Kasir POS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        {/* Menggunakan Tailwind Play CDN dengan cara yang aman untuk Next.js */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      {/* Mengaplikasikan font secara global melalui className */}
      <body className={`${plusJakarta.className} bg-slate-50 text-slate-900 antialiased`}>
        {/* Inisialisasi Global SweetAlert */}
        <SweetAlertInitializer />
        {children}
      </body>
    </html>
  )
}