import type { BlogPost } from '@/types'

interface BlogJsonLdProps {
  post: BlogPost
  locale: string
  siteUrl: string
}

export function BlogJsonLd({ post, locale, siteUrl }: BlogJsonLdProps) {
  const title = locale === 'en' && post.title_en ? post.title_en : post.title_tr
  const description = locale === 'en' && post.meta_description
    ? post.meta_description
    : (post.meta_description ?? post.excerpt_tr ?? '')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: post.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bolena Cafe',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/bolena_logo.png`,
      },
    },
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    image: post.cover_image_url
      ? { '@type': 'ImageObject', url: post.cover_image_url }
      : undefined,
    url: `${siteUrl}/${locale}/blog/${post.slug}`,
    inLanguage: locale === 'en' ? 'en-US' : 'tr-TR',
    keywords: post.focus_keywords.join(', '),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
