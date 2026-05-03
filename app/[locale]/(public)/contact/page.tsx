import type { Metadata } from 'next'
import { ContactClient } from '@/components/modules/contact/ContactClient'
import { BreadcrumbJsonLd } from '@/components/shared/BreadcrumbJsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com.tr'

const META: Record<'tr' | 'en', { title: string; description: string; keywords: string[] }> = {
  tr: {
    title: 'İletişim — Adres, Telefon, Çalışma Saatleri | Bolena Glutensiz Cafe Ankara',
    description: 'Bolena Glutensiz Cafe — Ankara Yaşamkent, 3058. Sokak 3/1, 06810 Çankaya. Telefon: +90 544 973 05 09. Çalışma saatleri, harita ve rezervasyon bilgileri.',
    keywords: [
      'bolena iletişim',
      'bolena adres',
      'glutensiz cafe ankara adres',
      'glutensiz cafe yaşamkent',
      'çölyak restoran ankara konum',
      'bolena rezervasyon',
      'bolena çalışma saatleri',
    ],
  },
  en: {
    title: 'Contact — Address, Phone, Hours | Bolena Gluten-Free Cafe Ankara',
    description: 'Bolena Gluten-Free Cafe — Yaşamkent, 3058. St 3/1, 06810 Çankaya, Ankara. Phone: +90 544 973 05 09. Hours, map and reservation info.',
    keywords: [
      'bolena contact',
      'bolena address',
      'gluten-free cafe ankara location',
      'celiac restaurant ankara',
      'bolena reservation',
      'bolena hours',
    ],
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
    keywords: meta.keywords,
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
      images: [
        {
          url: '/images/menu/hero_v2.png',
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: ['/images/menu/hero_v2.png'],
    },
  }
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params
  const isEn = locale === 'en'
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: isEn ? 'Home' : 'Ana Sayfa', url: `${SITE_URL}/${locale}` },
          { name: isEn ? 'Contact' : 'İletişim', url: `${SITE_URL}/${locale}/contact` },
        ]}
      />
      <ContactClient locale={locale} />
    </>
  )
}
