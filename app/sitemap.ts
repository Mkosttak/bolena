import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.bolenaglutensiz.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ISR — saatte bir yenilenir
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static sayfalar — her locale için
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/tr`,         lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/en`,         lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/tr/menu`,    lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/en/menu`,    lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/tr/blog`,    lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/en/blog`,    lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/tr/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/en/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

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
      blogEntries = posts.flatMap((post: { slug: string; updated_at: string; published_at: string | null }) => [
        {
          url: `${BASE_URL}/tr/blog/${post.slug}`,
          lastModified: new Date(post.updated_at ?? post.published_at ?? now),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        },
        {
          url: `${BASE_URL}/en/blog/${post.slug}`,
          lastModified: new Date(post.updated_at ?? post.published_at ?? now),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        },
      ])
    }
  } catch {
    // DB erişilemezse static entries döner
  }

  return [...staticEntries, ...blogEntries]
}
