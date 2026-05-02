import type { Metadata } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Providers } from '@/components/shared/Providers'
import { WebVitalsReporter } from '@/components/shared/WebVitalsReporter'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com.tr'

const META_BY_LOCALE: Record<string, { title: string; description: string; ogLocale: string }> = {
  tr: {
    title: 'Bolena Cafe — %100 Glutensiz Mutfak | Ankara Yaşamkent',
    description:
      "Ankara Yaşamkent'te %100 glutensiz pizza, burger, bowl ve tatlılar. Çölyak dostu sertifikalı mutfak.",
    ogLocale: 'tr_TR',
  },
  en: {
    title: 'Bolena Cafe — 100% Gluten-Free Kitchen | Ankara',
    description:
      'A 100% gluten-free cafe in Yaşamkent, Ankara. Pizza, burgers, bowls and desserts — celiac-friendly certified kitchen.',
    ogLocale: 'en_US',
  },
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const meta = META_BY_LOCALE[locale] ?? META_BY_LOCALE.tr!

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        tr: `${SITE_URL}/tr`,
        en: `${SITE_URL}/en`,
        'x-default': `${SITE_URL}/tr`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      locale: meta.ogLocale,
      url: `${SITE_URL}/${locale}`,
    },
    twitter: {
      title: meta.title,
      description: meta.description,
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <WebVitalsReporter />
        {children}
      </Providers>
    </NextIntlClientProvider>
  )
}
