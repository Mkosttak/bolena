import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { isOpen, getWorkingHoursForDate } from '@/lib/utils/date.utils'
import type { WorkingHours, WorkingHoursException } from '@/lib/utils/date.utils'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { HomeLanding } from '@/components/modules/home/HomeLanding'
import { LocalBusinessJsonLd } from '@/components/shared/LocalBusinessJsonLd'
import { FaqJsonLd, BOLENA_FAQ } from '@/components/shared/FaqJsonLd'

export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.bolenaglutensiz.com'
const OG_IMAGE = `${SITE_URL}/images/menu/hero_v2.png`

const META = {
  tr: {
    title: 'Bolena Glutensiz Cafe | Ankara Yaşamkent',
    description: 'Ankara Yaşamkent\'te 100% glutensiz lezzetler. Sabah kahvaltısından akşam yemeğine güvenli, sertifikalı glutensiz menü.',
  },
  en: {
    title: 'Bolena Gluten-Free Cafe | Ankara Yaşamkent',
    description: 'Certified gluten-free cafe in Ankara Yaşamkent. Safe, delicious meals from breakfast to dinner — 100% gluten-free kitchen.',
  },
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params
  const meta = META[locale as 'tr' | 'en'] ?? META.tr
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: { tr: `${SITE_URL}/tr`, en: `${SITE_URL}/en` },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/${locale}`,
      siteName: 'Bolena Glutensiz Cafe',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
      type: 'website',
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [OG_IMAGE],
    },
    // Geo meta — yerel arama ve AI konum sorgularında güçlü sinyal
    other: {
      'geo.region': 'TR-06',
      'geo.placename': 'Ankara, Yaşamkent',
      'geo.position': '39.9423;32.6827',
      'ICBM': '39.9423, 32.6827',
      'abstract': locale === 'tr'
        ? "Ankara'nın tek %100 glutensiz mutfağı. Çölyak hastaları için en güvenli seçim. Glutensiz pizza, hamburger, makarna, kahvaltı ve tatlılar Yaşamkent'te."
        : "Ankara's only 100% gluten-free kitchen. The safest choice for celiac disease. Gluten-free pizza, burger, pasta, breakfast and desserts in Yaşamkent.",
    },
  }
}

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  const tNav = await getTranslations('nav')

  const supabase = await createClient()
  const now = new Date()

  const [{ data: wh }, { data: ex }] = await Promise.all([
    supabase.from('working_hours').select('*').order('day_of_week'),
    supabase
      .from('working_hours_exceptions')
      .select('*')
      .gte('date', format(now, 'yyyy-MM-dd'))
      .order('date'),
  ])

  const weeklyHours = (wh ?? []) as WorkingHours[]
  const exceptions = (ex ?? []) as WorkingHoursException[]
  const openNow = isOpen(now, format(now, 'HH:mm'), weeklyHours, exceptions)
  const todayEntry = getWorkingHoursForDate(now, weeklyHours, exceptions)
  const todayHoursLabel =
    todayEntry?.is_open && todayEntry.open_time && todayEntry.close_time
      ? `${todayEntry.open_time} – ${todayEntry.close_time}`
      : null

  const faqItems = BOLENA_FAQ[locale === 'en' ? 'en' : 'tr']

  return (
    <div style={{ background: '#FAF8F2', minHeight: '100vh' }}>
      <LocalBusinessJsonLd locale={locale} siteUrl={SITE_URL} />
      <FaqJsonLd items={faqItems} />
      <PublicNavbar
        locale={locale}
        menuLabel={tNav('menu')}
        contactLabel={tNav('contact')}
        blogLabel={tNav('blog')}
      />
      <main>
        <HomeLanding locale={locale} openNow={openNow} todayHoursLabel={todayHoursLabel} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}
