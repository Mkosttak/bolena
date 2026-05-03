import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolenaglutensiz.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Bolena Cafe — %100 Glutensiz Mutfak | Ankara Yaşamkent',
    template: '%s | Bolena Glutensiz Cafe',
  },
  description: 'Bolena Cafe, Ankara\'nın Yaşamkent semtinde %100 glutensiz pizza, burger, bowl ve tatlılar sunan özel bir cafe. Çölyak dostu, sertifikalı mutfak.',
  applicationName: 'Bolena Glutensiz Cafe',
  authors: [{ name: 'Bolena Glutensiz Cafe', url: SITE_URL }],
  creator: 'Bolena Glutensiz Cafe',
  publisher: 'Bolena Glutensiz Cafe',
  category: 'Food & Drink',
  keywords: [
    'glutensiz cafe',
    'glutensiz cafe ankara',
    'glutensiz cafe yaşamkent',
    'ankara çölyak',
    'çölyak cafe',
    'glutensiz pizza',
    'glutensiz pizza ankara',
    'glutensiz hamburger',
    'glutensiz hamburger ankara',
    'glutensiz beslenme',
    'glutensiz buluşma noktası',
    'glutensiz restoran ankara',
    'glutensiz tatlı ankara',
    'gluten-free ankara',
    'gluten-free cafe',
    'gluten-free restaurant ankara',
    'celiac safe restaurant',
    'celiac friendly ankara',
  ],
  // icons: app/icon.png + app/apple-icon.png (Next.js file convention) otomatik
  // <link rel="icon"> ve apple-touch-icon üretir — manuel metadata.icons gereksiz.
  // Mutlak path — locale prefix'siz çözülmesi için (yoksa /tr/manifest.webmanifest 404)
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'Bolena Glutensiz Cafe',
    locale: 'tr_TR',
    alternateLocale: ['en_US'],
    images: [
      {
        url: '/images/menu/hero_v2.png',
        width: 1200,
        height: 630,
        alt: 'Bolena Glutensiz Cafe — Ankara Yaşamkent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bolenaglutensizcafe',
    creator: '@bolenaglutensizcafe',
    images: ['/images/menu/hero_v2.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
}

// iOS Safari status bar / Android Chrome address bar — sayfa arka planı ile uyumlu krem ton.
// Koyu mod cihazlarda da koyu yesil yerine ayni krem tonu, hero ile gecis daha yumusak.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF8F2' },
    { media: '(prefers-color-scheme: dark)', color: '#FAF8F2' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className={`h-full antialiased ${playfair.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body className="min-h-full font-sans" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
