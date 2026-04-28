import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

function isAdminPath(pathname: string): boolean {
  // /tr/admin/... veya /en/admin/... şeklindeki yollar admin path'i
  return /^\/(tr|en)\/admin(\/|$)/.test(pathname)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /qr/ path'leri: intl routing ve auth guard atlanır
  if (pathname.startsWith('/qr/')) {
    return NextResponse.next()
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
