import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.bolenaglutensiz.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ISR — saatte bir yenilenir
export const revalidate = 3600

// Her sayfa için tr/en + x-default hreflang kümesi — sitemap'te alternates
// vermek Google'ın dil eşleşmesini güçlendirir (denetimdeki hreflang
// bulgularını destekler).
function langAlternates(path: string) {
  return {
    languages: {
      tr: `${BASE_URL}/tr${path}`,
      en: `${BASE_URL}/en${path}`,
      'x-default': `${BASE_URL}/tr${path}`,
    },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static sayfalar — her locale + hreflang alternates
  const STATIC_PATHS = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
    { path: '/menu', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/blog', changeFrequency: 'daily' as const, priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
  ]

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap(
    ({ path, changeFrequency, priority }) =>
      (['tr', 'en'] as const).map((loc) => ({
        url: `${BASE_URL}/${loc}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: langAlternates(path),
      }))
  )

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
      .select('slug, updated_at, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1000)

    if (posts) {
      blogEntries = posts.flatMap((post: { slug: string; updated_at: string; published_at: string | null }) => {
        const lastModified = new Date(post.updated_at ?? post.published_at ?? now)
        const alternates = langAlternates(`/blog/${post.slug}`)
        return [
          {
            url: `${BASE_URL}/tr/blog/${post.slug}`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
            alternates,
          },
          {
            url: `${BASE_URL}/en/blog/${post.slug}`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
            alternates,
          },
        ]
      })
    }
  } catch {
    // DB erişilemezse static entries döner
  }

  return [...staticEntries, ...blogEntries]
}
