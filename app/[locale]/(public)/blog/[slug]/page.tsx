import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { BlogDetailContent } from '@/components/modules/blog/BlogDetailContent'
import { BlogJsonLd } from '@/components/modules/blog/BlogJsonLd'
import type { BlogPost } from '@/types'
import {
  buildKeywords,
  buildSeoDescription,
  buildSeoTitle,
} from '@/lib/utils/blog-seo'

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
    .select(
      'title_tr, title_en, meta_title, meta_description, excerpt_tr, excerpt_en, content_tr, content_en, cover_image_url, published_at, updated_at, focus_keywords, tags, slug, author_name'
    )
    .eq('slug', slug)
    .single()

  if (!post) return {}

  const isEn = locale === 'en'
  const postTitle = isEn && post.title_en ? post.title_en : post.title_tr
  const excerpt = isEn ? (post.excerpt_en ?? post.excerpt_tr) : post.excerpt_tr
  const contentHtml = isEn ? (post.content_en ?? post.content_tr) : post.content_tr

  const seoTitle = buildSeoTitle({
    manualMetaTitle: post.meta_title,
    postTitle,
    locale,
  })
  const seoDescription = buildSeoDescription({
    manualMetaDescription: post.meta_description,
    excerpt,
    contentHtml,
    postTitle,
  })
  const seoKeywords = buildKeywords({
    manualKeywords: post.focus_keywords as string[] | null | undefined,
    tags: post.tags as string[] | null | undefined,
  })

  const ogImage = post.cover_image_url
  const url = `${SITE_URL}/${locale}/blog/${slug}`

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    authors: post.author_name ? [{ name: post.author_name }] : undefined,
    alternates: {
      canonical: url,
      languages: {
        tr: `${SITE_URL}/tr/blog/${slug}`,
        en: `${SITE_URL}/en/blog/${slug}`,
      },
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url,
      siteName: 'Bolena Glutensiz Cafe',
      type: 'article',
      locale: isEn ? 'en_US' : 'tr_TR',
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      authors: post.author_name ? [post.author_name] : undefined,
      tags: (post.tags as string[] | null | undefined) ?? undefined,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: postTitle }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: ogImage ? [ogImage] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
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
