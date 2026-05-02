import type { Metadata } from 'next'
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com'

export const metadata: Metadata = {
  title: 'Bolena Cafe — %100 Glutensiz Mutfak | Ankara Yaşamkent',
  description: 'Bolena Cafe, Ankara\'nın Yaşamkent semtinde %100 glutensiz pizza, burger, bowl ve tatlılar sunan özel bir cafe. Çölyak dostu, sertifikalı mutfak.',
  icons: {
    icon: '/images/bolena_logo.png',
    apple: '/images/bolena_logo.png',
  },
  alternates: {
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
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
