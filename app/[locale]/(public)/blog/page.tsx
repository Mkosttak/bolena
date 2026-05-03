import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { BlogListSection } from '@/components/modules/blog/BlogListSection'
import { BreadcrumbJsonLd } from '@/components/shared/BreadcrumbJsonLd'
import type { BlogPost } from '@/types'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com.tr'

interface BlogIndexPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: BlogIndexPageProps): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === 'en'
  const title = isEn
    ? 'Blog — Gluten-Free Recipes, Celiac Tips & News'
    : 'Blog — Glutensiz Tarifler, Çölyak Rehberi ve Haberler'
  const description = isEn
    ? 'Gluten-free recipes, celiac-friendly tips, Ankara gluten-free guide and news from Bolena Cafe — Turkey\'s 100% gluten-free kitchen.'
    : 'Glutensiz tarifler, çölyak dostu yaşam ipuçları, Ankara glutensiz rehberi ve Bolena\'dan haberler. %100 glutensiz mutfaktan içerikler.'

  return {
    title,
    description,
    keywords: isEn
      ? ['gluten-free recipes', 'celiac blog', 'gluten-free Ankara', 'Bolena blog', 'gluten-free lifestyle']
      : ['glutensiz tarifler', 'çölyak blog', 'glutensiz yaşam', 'ankara çölyak rehberi', 'glutensiz beslenme', 'glutensiz pizza tarifi'],
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog`,
      languages: {
        tr: `${SITE_URL}/tr/blog`,
        en: `${SITE_URL}/en/blog`,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}/${locale}/blog`,
      siteName: 'Bolena Glutensiz Cafe',
      locale: isEn ? 'en_US' : 'tr_TR',
      alternateLocale: isEn ? ['tr_TR'] : ['en_US'],
      images: [
        {
          url: '/images/menu/hero_v2.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/menu/hero_v2.png'],
    },
  }
}

export default async function BlogIndexPage({ params }: BlogIndexPageProps) {
  const { locale } = await params
  const tNav = await getTranslations('nav')
  const tBlog = await getTranslations('blog')
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .lte('published_at', today)
    .order('published_at', { ascending: false })

  const isEn = locale === 'en'

  return (
    <div style={{ background: '#FAF8F2', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <BreadcrumbJsonLd
        items={[
          { name: isEn ? 'Home' : 'Ana Sayfa', url: `${SITE_URL}/${locale}` },
          { name: 'Blog', url: `${SITE_URL}/${locale}/blog` },
        ]}
      />
      <PublicNavbar
        locale={locale}
        menuLabel={tNav('menu')}
        contactLabel={tNav('contact')}
        blogLabel={tNav('blog')}
      />

      {/* Hero — kompakt */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(27,60,42,0.04) 0%, transparent 100%)',
          textAlign: 'center',
          padding: 'calc(72px + 1.75rem) clamp(1.25rem, 5vw, 2.5rem) 1.25rem',
        }}
      >
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: '#C4841A',
            margin: '0 0 0.5rem',
          }}
        >
          {tBlog('eyebrow')}
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.65rem, 3.5vw, 2.4rem)',
            fontWeight: 800,
            color: '#1B3C2A',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {tBlog('title')}
        </h1>
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.875rem',
            lineHeight: 1.55,
            color: 'rgba(27,60,42,0.55)',
            maxWidth: 460,
            margin: '0.5rem auto 0',
          }}
        >
          {tBlog('subtitle')}
        </p>
      </div>

      {/* Posts */}
      <main style={{ flex: 1 }}>
        <BlogListSection
          posts={(posts ?? []) as BlogPost[]}
          locale={locale}
          translations={{
            noPosts: tBlog('noPosts'),
            readMore: tBlog('readMore'),
            by: tBlog('by'),
            minRead: tBlog('minRead'),
          }}
        />
      </main>

      <SiteFooter locale={locale} />
    </div>
  )
}
