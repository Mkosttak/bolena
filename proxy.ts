import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { routing } from './i18n/routing'
import { checkRateLimit, getClientIdentifier, rateLimits, rateLimitHeaders } from './lib/rate-limit'

const intlMiddleware = createMiddleware(routing)

// Locale listesi i18n routing'inden dinamik — yeni locale eklemek için sadece routing.ts.
const adminPathRegex = new RegExp(`^\\/(${routing.locales.join('|')})\\/admin(\\/|$)`)
const loginPathRegex = new RegExp(`^\\/(${routing.locales.join('|')})\\/login\\/?$`)

function isAdminPath(pathname: string): boolean {
  return adminPathRegex.test(pathname)
}

function isLoginPath(pathname: string): boolean {
  return loginPathRegex.test(pathname)
}

/**
 * Tum private/internal path'lerde HTTP `X-Robots-Tag` ile NOINDEX zorla.
 *
 * `noindex` (sayfa indexlenmesin), `nofollow` (linklerini takip etme),
 * `noarchive` (cache versiyonu gosterme), `nosnippet` (arama sonucunda metin
 * snippeti gosterme), `noimageindex` (gorselleri indexlmeme).
 *
 * Bu HTTP header robots.txt'den daha guclu sinyaldir:
 * - robots.txt: crawler'in URL'yi ZIYARET ETMESINI engeller (ama 3. parti bir
 *   site bu URL'ye link verirse Google "URL var ama icerik bilmiyoruz" diye
 *   yine de listeleyebilir)
 * - X-Robots-Tag: URL ZIYARET edilirse bile indexlenmesini ENGELLER → kullanici
 *   admin/login URL'sini hicbir zaman aramada goremez
 */
const PRIVATE_PATH_REGEX = new RegExp(
  `^\\/(${routing.locales.join('|')})\\/(admin|login)(\\/|$)|^\\/qr\\/`,
)

function applyPrivateHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, noarchive, nosnippet, noimageindex',
  )
  // Admin sayfalarinin browser-cache edilmesini de engelle
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /qr/ path'leri: intl routing ve auth guard atlanır
  // Yine de noindex + no-store header'lari uygula (QR token URL'leri public ama
  // arama motoru indekslememeli)
  if (pathname.startsWith('/qr/')) {
    return applyPrivateHeaders(NextResponse.next())
  }

  // Login POST'a rate limit (brute force koruması)
  if (request.method === 'POST' && isLoginPath(pathname)) {
    const clientId = getClientIdentifier(request.headers)
    const rl = await checkRateLimit(clientId, rateLimits.auth)
    if (!rl.success) {
      return new NextResponse(
        JSON.stringify({ error: `Çok fazla deneme. ${rl.retryAfterSeconds} sn sonra tekrar deneyin.` }),
        {
          status: 429,
          headers: { 'content-type': 'application/json', ...rateLimitHeaders(rl) },
        },
      )
    }
  }

  // Run intl middleware first (handles locale routing)
  const intlResponse = intlMiddleware(request)

  // Private path'ler (admin / login / qr) — daima noindex header'i ekle
  const isPrivate = PRIVATE_PATH_REGEX.test(pathname)

  // Sadece admin path'lerini koru
  if (!isAdminPath(pathname)) {
    if (isPrivate && intlResponse) {
      return applyPrivateHeaders(intlResponse)
    }
    return intlResponse
  }

  // Admin path'leri için Supabase session kontrolü
  let response = intlResponse || NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const locale = pathname.startsWith('/en') ? 'en' : 'tr'
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    return applyPrivateHeaders(redirectResponse)
  }

  // Authenticated admin response — noindex header ekle
  return applyPrivateHeaders(response)
}

export const config = {
  // Middleware (next-intl locale prefix) bu path'leri ATLAYACAK:
  // - _next assets
  // - api route'ları
  // - root-level static dosyalar (manifest, robots, sitemap, feed, favicon)
  // - görsel uzantıları
  // Aksi halde /manifest.webmanifest > /tr/manifest.webmanifest redirect olur > 404.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|feed\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
}
