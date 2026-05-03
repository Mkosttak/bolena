import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { BlogListSection } from '@/components/modules/blog/BlogListSection'
import type { BlogPost } from '@/types'

export const dynamic = 'force-dynamic'

interface BlogIndexPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: BlogIndexPageProps): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === 'en'
  return {
    title: isEn ? 'Blog — Bolena Cafe' : 'Blog — Bolena Cafe',
    description: isEn
      ? 'Gluten-free recipes, health tips and news from Bolena Cafe.'
      : 'Bolena Cafe\'den glutensiz tarifler, sağlık önerileri ve haberler.',
    alternates: {
      canonical: `/${locale}/blog`,
      languages: { tr: '/tr/blog', en: '/en/blog' },
    },
    openGraph: {
      title: isEn ? 'Blog — Bolena Cafe' : 'Blog — Bolena Cafe',
      description: isEn
        ? 'Gluten-free recipes, health tips and news.'
        : 'Glutensiz tarifler, sağlık önerileri ve haberler.',
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

  return (
    <div style={{ background: '#FAF8F2', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
