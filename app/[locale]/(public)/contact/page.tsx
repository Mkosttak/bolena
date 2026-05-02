import type { Metadata } from 'next'
import { ContactClient } from '@/components/modules/contact/ContactClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com.tr'

const META = {
  tr: {
    title: 'İletişim | Bolena Glutensiz Cafe — Ankara Yaşamkent',
    description: 'Bolena Glutensiz Cafe iletişim bilgileri, çalışma saatleri ve konum. Ankara Yaşamkent, 3058. Sk 3/1.',
  },
  en: {
    title: 'Contact | Bolena Gluten-Free Cafe — Ankara Yaşamkent',
    description: 'Contact Bolena Gluten-Free Cafe. Opening hours and location in Ankara Yaşamkent, 3058. Sk 3/1.',
  },
}

interface ContactPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params
  const meta = META[locale as 'tr' | 'en'] ?? META.tr
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/contact`,
      languages: { tr: `${SITE_URL}/tr/contact`, en: `${SITE_URL}/en/contact` },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/${locale}/contact`,
      siteName: 'Bolena Glutensiz Cafe',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
      type: 'website',
    },
  }
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params
  return <ContactClient locale={locale} />
}
