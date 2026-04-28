import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import { MobileSidebar } from '@/components/shared/MobileSidebar'
import { AuthInitializer } from '@/components/shared/AuthInitializer'
import { GlobalErrorBoundary } from '@/components/shared/GlobalErrorBoundary'
import type { ModuleName } from '@/types'

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Profil ve modül izinleri — server-side çekiliyor
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_active) {
    redirect(`/${locale}/login`)
  }

  // Employee için izin verilen modüller — admin için gerek yok
  let allowedModules: ModuleName[] = []
  if (profile.role === 'employee') {
    const { data: perms } = await supabase
      .from('module_permissions')
      .select('module_name')
      .eq('user_id', user.id)
      .eq('can_access', true)
    allowedModules = (perms ?? []).map((p) => p.module_name as ModuleName)
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      <AuthInitializer />
      
      {/* Desktop Sidebar */}
      <Sidebar
        locale={locale}
        role={profile.role as 'admin' | 'employee'}
        fullName={profile.full_name}
        allowedModules={allowedModules}
      />

      {/* Mobile Header + Sidebar Trigger */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 sm:px-6 shrink-0 shadow-sm">
        <MobileSidebar 
          locale={locale}
          role={profile.role as 'admin' | 'employee'}
          fullName={profile.full_name}
          allowedModules={allowedModules}
        />
        <div className="flex-1 flex justify-center lg:justify-start pr-8">
          <Link href={`/${locale}/admin/dashboard`}>
            <Image
              src="/images/bolena_logo.png"
              alt="Bolena Logo"
              width={32}
              height={32}
              className="object-contain dark:invert-[0.1]"
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden bg-background min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
        <GlobalErrorBoundary>
          {children}
        </GlobalErrorBoundary>
      </main>
    </div>
  )
}

