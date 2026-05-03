import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import bundleAnalyzer from '@next/bundle-analyzer'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const isProd = process.env.NODE_ENV === 'production'

const supabaseHost = 'wrnwkuummzlyplpcleoz.supabase.co'

const cspDirectives: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    ...(isProd ? [] : ["'unsafe-eval'"]),
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    `https://${supabaseHost}`,
    'https://images.unsplash.com',
  ],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    `https://${supabaseHost}`,
    `wss://${supabaseHost}`,
  ],
  'frame-src': [
    "'self'",
    'https://www.google.com',
    'https://maps.google.com',
  ],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  // NOT: 'upgrade-insecure-requests' Report-Only modda spec gereği yoksayılır
  // (browser console warning verir). Vercel zaten HTTPS-only servis ediyor;
  // bu directive sadece eski HTTP linkleri rewrite eder. Şimdilik atlandı.
  // CSP enforce moda geçerken (Content-Security-Policy header) eklenebilir.
}

const cspHeader = Object.entries(cspDirectives)
  .map(([key, values]) => (values.length ? `${key} ${values.join(' ')}` : key))
  .join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
  {
    key: isProd ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
    value: cspHeader,
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  // Docker/küçük image deployment için (Vercel'de etkisiz, ihtiyaç olunca açılır)
  // output: 'standalone',
  productionBrowserSourceMaps: true,   // Sentry source map upload için
  experimental: {
    // Bu paketleri tree-shake et — public bundle'a sadece kullanılan parçaları al
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'framer-motion',
    ],
  },
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ['@sentry/nextjs'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHost,
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/icon.png', permanent: true },
    ]
  },
  webpack(config) {
    // @sentry/nextjs opsiyonel — kurulu değilse boş modül döndür
    config.resolve.alias['@sentry/nextjs'] = false
    return config
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(withNextIntl(nextConfig))
