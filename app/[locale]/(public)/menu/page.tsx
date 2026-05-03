import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { MenuDisplay } from '@/components/modules/menu/MenuDisplay'
import { MenuHero } from '@/components/modules/menu/MenuHero'
import { BreadcrumbJsonLd } from '@/components/shared/BreadcrumbJsonLd'
import type { Category, MenuCampaign, Product } from '@/types'

export const revalidate = 1800

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolenaglutensiz.com'

const META: Record<'tr' | 'en', { title: string; description: string; keywords: string[] }> = {
  tr: {
    title: 'Glutensiz Menü — Pizza, Hamburger, Kahvaltı | Bolena Cafe Ankara',
    description: 'Ankara Yaşamkent\'te %100 glutensiz menü: glutensiz pizza, hamburger, makarna, kahvaltı, bowl ve tatlılar. Çölyak güvenli, sertifikalı mutfak.',
    keywords: [
      'glutensiz menü',
      'glutensiz pizza ankara',
      'glutensiz hamburger ankara',
      'glutensiz kahvaltı',
      'glutensiz makarna',
      'glutensiz tatlı',
      'çölyak menü',
      'ankara glutensiz restoran menü',
    ],
  },
  en: {
    title: 'Gluten-Free Menu — Pizza, Burger, Breakfast | Bolena Ankara',
    description: 'Ankara Yaşamkent 100% gluten-free menu: gluten-free pizza, burger, pasta, breakfast, bowls and desserts. Celiac-safe certified kitchen.',
    keywords: [
      'gluten-free menu',
      'gluten-free pizza ankara',
      'gluten-free burger ankara',
      'gluten-free breakfast',
      'celiac menu ankara',
    ],
  },
}

interface MenuPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const { locale } = await params
  const meta = META[locale as 'tr' | 'en'] ?? META.tr
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `${SITE_URL}/${locale}/menu`,
      languages: { tr: `${SITE_URL}/tr/menu`, en: `${SITE_URL}/en/menu` },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/${locale}/menu`,
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

export default async function MenuPage({ params }: MenuPageProps) {
  const { locale } = await params
  const tNav = await getTranslations('nav')
  const tMenu = await getTranslations('menu')
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: categories }, { data: products }, { data: campaigns }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select('*, product_ingredients(*), extra_groups(*, extra_options(*))')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('menu_campaigns')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('priority', { ascending: false }),
  ])

  const translations = {
    outOfStock: tMenu('outOfStock'),
    allergens: tMenu('allergens'),
    featured: tMenu('featured'),
    campaignBadge: tMenu('campaignBadge'),
    productDetailIngredients: tMenu('productDetailIngredients'),
    productDetailAllergens: tMenu('productDetailAllergens'),
    productDetailClose: tMenu('productDetailClose'),
    emptyState: tMenu('emptyState'),
  }

  const isEn = locale === 'en'

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <BreadcrumbJsonLd
        items={[
          { name: isEn ? 'Home' : 'Ana Sayfa', url: `${SITE_URL}/${locale}` },
          { name: isEn ? 'Menu' : 'Menü', url: `${SITE_URL}/${locale}/menu` },
        ]}
      />
      <PublicNavbar
        locale={locale}
        menuLabel={tNav('menu')}
        contactLabel={tNav('contact')}
        blogLabel={tNav('blog')}
      />

      <MenuHero
        locale={locale}
        title={tMenu('publicTitle')}
        subtitle={tMenu('publicSubtitle')}
        eyebrowText={tMenu('heroEyebrow')}
        badges={[tMenu('badge1'), tMenu('badge2'), tMenu('badge3')]}
      />

      {/* ── Menu content ───────────────────────────────────────── */}
      <main className="flex-1 relative z-20">
        <MenuDisplay
          categories={(categories ?? []) as Category[]}
          products={(products ?? []) as Product[]}
          locale={locale}
          uncategorizedLabel={tMenu('uncategorized')}
          campaigns={(campaigns ?? []) as MenuCampaign[]}
          translations={translations}
        />
      </main>

      <SiteFooter locale={locale} />
    </div>
  )
}
