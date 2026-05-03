import type { Metadata, Viewport } from 'next'
import { QrToaster } from '@/components/modules/qr/QrToaster'

export const viewport: Viewport = {
  themeColor: '#efe4cf',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Bolena Cafe — Sipariş',
  description: 'Bolena Cafe masa siparişi',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bolena Cafe',
  },
  // QR token URL'leri kisa omurlu / ozel — arama motoru indekslememeli
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
      'max-snippet': 0,
      'max-image-preview': 'none',
    },
  },
}

export default function QrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* body/html bg'yi QR sayfasının rengiyle eşleştir — dark mode yeşil override önler */}
      <style>{`body, html { background-color: #efe4cf !important; }`}</style>
      {children}
      {/* QR rotaları [locale] segmentinin dışında — Providers'taki Toaster
          buraya ulaşmıyordu; bu yüzden toast'lar görünmüyordu. */}
      <QrToaster />
    </>
  )
}
