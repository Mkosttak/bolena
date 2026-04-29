import type { Metadata, Viewport } from 'next'

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
}

export default function QrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* body/html bg'yi QR sayfasının rengiyle eşleştir — dark mode yeşil override önler */}
      <style>{`body, html { background-color: #efe4cf !important; }`}</style>
      {children}
    </>
  )
}
