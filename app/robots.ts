import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com.tr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/admin/',
          '/tr/admin/',
          '/en/admin/',
          '/login',
          '/tr/login',
          '/en/login',
          '/qr/',
          '/api/',
        ],
      },
      {
        userAgent: ['GPTBot', 'CCBot', 'ChatGPT-User'],
        disallow: ['/'],   // AI crawler'larına kapalı (kullanıcı tercihi)
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
