import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com'

export async function GET() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('title_tr, title_en, excerpt_tr, excerpt_en, slug, published_at, updated_at, author_name, cover_image_url')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(20)

  const items = (posts ?? [])
    .map((post) => {
      const trUrl = `${SITE_URL}/tr/blog/${post.slug}`
      const enUrl = `${SITE_URL}/en/blog/${post.slug}`
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString()
      const image = post.cover_image_url
        ? `<enclosure url="${post.cover_image_url}" type="image/jpeg" length="0" />`
        : ''

      return `
    <item>
      <title><![CDATA[${post.title_tr}]]></title>
      <link>${trUrl}</link>
      <guid isPermaLink="true">${trUrl}</guid>
      <description><![CDATA[${post.excerpt_tr ?? ''}]]></description>
      <author>${post.author_name ?? 'Bolena'}</author>
      <pubDate>${pubDate}</pubDate>
      ${image}
      <language>tr</language>
    </item>
    <item>
      <title><![CDATA[${post.title_en ?? post.title_tr}]]></title>
      <link>${enUrl}</link>
      <guid isPermaLink="true">${enUrl}</guid>
      <description><![CDATA[${post.excerpt_en ?? post.excerpt_tr ?? ''}]]></description>
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
