import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  defaultPathAfterLogin,
  isSafeLocaleAdminRedirect,
} from '@/lib/utils/post-login-redirect'
import type { ModuleName } from '@/types'
import { LoginForm } from './LoginForm'

// Login sayfasi indekslenmesin — admin'in varligini gizleme stratejisinin parcasi
export const metadata: Metadata = {
  title: 'Restricted',
  description: '',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    notranslate: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
      'max-snippet': 0,
      'max-image-preview': 'none',
    },
  },
  openGraph: { title: '', description: '', images: [] },
  twitter: { title: '', description: '', images: [] },
}

interface LoginPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const { locale } = await params
  const { redirect: redirectTo } = await searchParams

  // Zaten giriş yapmışsa yönlendir — profil yok veya pasifse loop'a girmemek için
  // login sayfasında bırak (form tekrar denenebilir).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profile && profile.is_active !== false) {
      let path: string
      if (isSafeLocaleAdminRedirect(redirectTo, locale)) {
        path = redirectTo
      } else {
        const role = profile.role === 'employee' ? 'employee' : 'admin'
        let allowed: ModuleName[] = []
        if (role === 'employee') {
          const { data: perms } = await supabase
            .from('module_permissions')
            .select('module_name')
            .eq('user_id', user.id)
            .eq('can_access', true)
          allowed = (perms ?? []).map((p) => p.module_name as ModuleName)
        }
        path = defaultPathAfterLogin(locale, role, allowed)
      }
      redirect(path as Route)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoginForm locale={locale} redirectTo={redirectTo} />
    </div>
  )
}
