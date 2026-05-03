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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /qr/ path'leri: intl routing ve auth guard atlanır
  if (pathname.startsWith('/qr/')) {
    return NextResponse.next()
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

  // Sadece admin path'lerini koru
  if (!isAdminPath(pathname)) {
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
    return NextResponse.redirect(loginUrl)
  }

  return response
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
