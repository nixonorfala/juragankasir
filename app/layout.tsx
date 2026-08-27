import './globals.css'
import SweetAlertInitializer from './components/SweetAlertInitializer'

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Inisialisasi Global SweetAlert */}
        <SweetAlertInitializer />
        {children}
      </body>
    </html>
  )
}