import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { BlogDetailContent } from '@/components/modules/blog/BlogDetailContent'
import { BlogJsonLd } from '@/components/modules/blog/BlogJsonLd'
import type { BlogPost } from '@/types'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com'

interface BlogDetailPageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title_tr, title_en, meta_title, meta_description, excerpt_tr, excerpt_en, cover_image_url, published_at, updated_at, focus_keywords, slug')
    .eq('slug', slug)
    .single()

  if (!post) return {}

  const isEn = locale === 'en'
  const title = isEn && post.title_en ? post.title_en : post.title_tr
  const description = isEn && post.meta_description
    ? post.meta_description
    : (post.meta_description ?? (isEn ? post.excerpt_en : post.excerpt_tr) ?? undefined)
  const seoTitle = post.meta_title ?? `${title} — Bolena Cafe`

  return {
    title: seoTitle,
    description: description ?? undefined,
    keywords: (post.focus_keywords as string[] | undefined) ?? [],
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog/${slug}`,
      languages: {
        tr: `${SITE_URL}/tr/blog/${slug}`,
        en: `${SITE_URL}/en/blog/${slug}`,
      },
    },
    openGraph: {
      title: seoTitle,
      description: description ?? undefined,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: description ?? undefined,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params
  const tNav = await getTranslations('nav')
  const tBlog = await getTranslations('blog')
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .lte('published_at', today)
    .maybeSingle()

  if (!post) notFound()

  const typedPost = post as BlogPost

  return (
    <div style={{ background: '#FAF8F2', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <BlogJsonLd post={typedPost} locale={locale} siteUrl={SITE_URL} />
      <PublicNavbar
        locale={locale}
        menuLabel={tNav('menu')}
        contactLabel={tNav('contact')}
        blogLabel={tNav('blog')}
      />

      <main style={{ flex: 1, paddingTop: 72 }}>
        <BlogDetailContent
          post={typedPost}
          locale={locale}
          translations={{
            backToBlog: tBlog('backToBlog'),
            by: tBlog('by'),
            minRead: tBlog('minRead'),
            tags: tBlog('tags'),
          }}
        />
      </main>

      <SiteFooter locale={locale} />
    </div>
  )
}
