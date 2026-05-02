import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { MenuDisplay } from '@/components/modules/menu/MenuDisplay'
import { MenuHero } from '@/components/modules/menu/MenuHero'
import type { Category, MenuCampaign, Product } from '@/types'

export const revalidate = 1800

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com'

const META = {
  tr: {
    title: 'Menü | Bolena Glutensiz Cafe',
    description: 'Bolena\'nın 100% glutensiz menüsünü keşfedin. Kahvaltılar, ana yemekler, tatlılar ve içecekler — hepsi sertifikalı glutensiz mutfakta hazırlanır.',
  },
  en: {
    title: 'Menu | Bolena Gluten-Free Cafe',
    description: 'Explore Bolena\'s 100% gluten-free menu. Breakfasts, mains, desserts and drinks — all prepared in our certified gluten-free kitchen.',
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
    },
    twitter: {
      title: meta.title,
      description: meta.description,
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
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
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
