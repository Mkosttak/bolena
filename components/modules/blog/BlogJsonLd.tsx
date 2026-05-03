import type { BlogPost } from '@/types'
import {
  buildKeywords,
  buildSeoDescription,
  countWords,
} from '@/lib/utils/blog-seo'

interface BlogJsonLdProps {
  post: BlogPost
  locale: string
  siteUrl: string
}

/**
 * Blog detayı için Schema.org structured data — Google'a yazıyı zengin sonuç
 * (rich result) adayı olarak sunar. İki ayrı JSON-LD blogu üretir:
 *
 *  1. BlogPosting (Article) — yazı meta verisi
 *  2. BreadcrumbList — Anasayfa › Blog › Yazı navigasyon kırıntıları
 *
 * Her ikisi de tek `<script>` içinde Graph olarak verilir (Google önerilen yapı).
 */
export function BlogJsonLd({ post, locale, siteUrl }: BlogJsonLdProps) {
  const isEn = locale === 'en'
  const postTitle = isEn && post.title_en ? post.title_en : post.title_tr
  const contentHtml = isEn ? (post.content_en ?? post.content_tr) : post.content_tr
  const excerpt = isEn ? (post.excerpt_en ?? post.excerpt_tr) : post.excerpt_tr

  const description = buildSeoDescription({
    manualMetaDescription: post.meta_description,
    excerpt,
    contentHtml,
    postTitle,
  })

  const keywords = buildKeywords({
    manualKeywords: post.focus_keywords,
    tags: post.tags,
  })

  const wordCount = countWords(contentHtml)
  const url = `${siteUrl}/${locale}/blog/${post.slug}`

  const blogPosting = {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: postTitle,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: isEn ? 'en-US' : 'tr-TR',
    author: {
      '@type': 'Person',
      name: post.author_name,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${siteUrl}#organization`,
      name: 'Bolena Glutensiz Cafe',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/bolena_logo.png`,
        width: 512,
        height: 512,
      },
    },
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    image: post.cover_image_url
      ? {
          '@type': 'ImageObject',
          url: post.cover_image_url,
          width: 1200,
          height: 630,
        }
      : undefined,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    articleSection: post.tags?.[0],
    wordCount: wordCount > 0 ? wordCount : undefined,
    timeRequired: post.reading_time_minutes
      ? `PT${post.reading_time_minutes}M`
      : undefined,
  }

  const breadcrumbList = {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isEn ? 'Home' : 'Ana Sayfa',
        item: `${siteUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/${locale}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: postTitle,
        item: url,
      },
    ],
  }

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [blogPosting, breadcrumbList],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  )
}
