import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/tr/admin/', '/en/admin/', '/tr/login/', '/en/login/', '/qr/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
