import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// NOT: lib/env.ts import edilmedi — sitemap build-time generate edilir,
// build sırasında env'ler eksik olabilir. Direkt process.env + fallback'lerle
// defensive yapı: env yoksa sadece static entries döner, build patlamaz.

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolenaglutensiz.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const STATIC_PATHS = ['', '/menu', '/blog', '/contact'] as const

// ISR — sitemap saatte bir yeniden üretilir (yeni blog post'lar için)
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static pages — her locale için + hreflang alternates (her zaman üretilir)
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

  // Blog post'ları — Supabase env'leri varsa fetch et, yoksa skip
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return staticEntries
  }

  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at, cover_image_url')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1000)

    if (posts) {
      blogEntries = posts.flatMap((post: { slug: string; updated_at: string; published_at: string | null; cover_image_url: string | null }) =>
        ['tr', 'en'].map((locale) => ({
          url: `${BASE_URL}/${locale}/blog/${post.slug}`,
          lastModified: new Date(post.updated_at ?? post.published_at ?? now),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
          // Google Image Sitemap — kapak gorseli indekslensin
          ...(post.cover_image_url ? { images: [post.cover_image_url] } : {}),
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
