import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

const BASE_URL = env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com.tr'
const STATIC_PATHS = ['', '/menu', '/blog', '/contact'] as const

// ISR — sitemap saatte bir yeniden üretilir (yeni blog post'lar için)
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static pages — her locale için + hreflang alternates
  const staticEntries: MetadataRoute.Sitemap = []
  for (const locale of ['tr', 'en'] as const) {
    for (const path of STATIC_PATHS) {
      staticEntries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1.0 : 0.8,
        alternates: {
          languages: {
            tr: `${BASE_URL}/tr${path}`,
            en: `${BASE_URL}/en${path}`,
          },
        },
      })
    }
  }

  // Blog post'ları — yayında olanlar
  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1000)

    if (posts) {
      blogEntries = posts.flatMap((post: { slug: string; updated_at: string; published_at: string | null }) =>
        ['tr', 'en'].map((locale) => ({
          url: `${BASE_URL}/${locale}/blog/${post.slug}`,
          lastModified: new Date(post.updated_at ?? post.published_at ?? now),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
          alternates: {
            languages: {
              tr: `${BASE_URL}/tr/blog/${post.slug}`,
              en: `${BASE_URL}/en/blog/${post.slug}`,
            },
          },
        })),
      )
    }
  } catch {
    // Sitemap build sırasında DB'ye ulaşılamazsa sadece static entries döndür.
    // Production'da bu durum izlenmeli (Sentry).
  }

  return [...staticEntries, ...blogEntries]
}
