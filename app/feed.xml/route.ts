import { createClient } from '@supabase/supabase-js'

// Build-time generate edilmesin — env'ler runtime'da set olur.
// Cache HTTP header ile (s-maxage=3600), CDN edge'de saatlik tutulur.
export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.bolenaglutensiz.com'

function escapeCdata(text: string): string {
  // CDATA içinde "]]>" tek geçersiz dizidir; güvenle bölelim
  return text.replace(/]]>/g, ']]]]><![CDATA[>')
}

function emptyFeed(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Bolena Glutensiz Cafe — Blog</title>
    <link>${SITE_URL}/tr/blog</link>
    <description>Bolena Glutensiz Cafe'den glutensiz yaşam, tarifler ve haberler.</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
  </channel>
</rss>`
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Env yoksa boş feed dön — build/runtime patlamasın
  if (!url || !anonKey) {
    return new Response(emptyFeed(), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60',
      },
    })
  }

  let posts: Array<{
    title_tr: string
    title_en: string | null
    excerpt_tr: string | null
    excerpt_en: string | null
    slug: string
    published_at: string | null
    updated_at: string | null
    author_name: string | null
    cover_image_url: string | null
  }> = []

  try {
    const supabase = createClient(url, anonKey, { auth: { persistSession: false } })
    const { data } = await supabase
      .from('blog_posts')
      .select('title_tr, title_en, excerpt_tr, excerpt_en, slug, published_at, updated_at, author_name, cover_image_url')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(20)
    posts = (data ?? []) as typeof posts
  } catch {
    // DB unreachable — boş feed dön
    return new Response(emptyFeed(), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60',
      },
    })
  }

  const items = posts
    .map((post) => {
      const trUrl = `${SITE_URL}/tr/blog/${post.slug}`
      const enUrl = `${SITE_URL}/en/blog/${post.slug}`
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString()
      const image = post.cover_image_url
        ? `<enclosure url="${post.cover_image_url}" type="image/jpeg" length="0" />`
        : ''

      return `
    <item>
      <title><![CDATA[${escapeCdata(post.title_tr)}]]></title>
      <link>${trUrl}</link>
      <guid isPermaLink="true">${trUrl}</guid>
      <description><![CDATA[${escapeCdata(post.excerpt_tr ?? '')}]]></description>
      <author>${post.author_name ?? 'Bolena'}</author>
      <pubDate>${pubDate}</pubDate>
      ${image}
      <language>tr</language>
    </item>
    <item>
      <title><![CDATA[${escapeCdata(post.title_en ?? post.title_tr)}]]></title>
      <link>${enUrl}</link>
      <guid isPermaLink="true">${enUrl}</guid>
      <description><![CDATA[${escapeCdata(post.excerpt_en ?? post.excerpt_tr ?? '')}]]></description>
      <author>${post.author_name ?? 'Bolena'}</author>
      <pubDate>${pubDate}</pubDate>
      ${image}
      <language>en</language>
    </item>`
    })
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Bolena Glutensiz Cafe — Blog</title>
    <link>${SITE_URL}/tr/blog</link>
    <description>Bolena Glutensiz Cafe'den glutensiz yaşam, tarifler ve haberler.</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/images/bolena_logo.png</url>
      <title>Bolena Glutensiz Cafe</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
