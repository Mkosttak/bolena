import { redirect } from 'next/navigation'
import type { Route } from 'next'
import type { createClient } from '@/lib/supabase/server'

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

/**
 * Employee'nin belirli bir modüle erişim iznini sunucu tarafında kontrol eder.
 * Admin her zaman geçer. Employee için module_permissions tablosu sorgulanır.
 * İzin yoksa dashboard'a yönlendirilir.
 */
export async function requireModuleAccess(
  supabase: ServerSupabase,
  userId: string,
  moduleName: string,
  locale: string
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role === 'admin') return

  const { data: perm } = await supabase
    .from('module_permissions')
    .select('can_access')
    .eq('user_id', userId)
    .eq('module_name', moduleName)
    .maybeSingle()

  if (!perm?.can_access) {
    redirect(`/${locale}/admin/dashboard` as Route)
  }
}

/**
 * Site ayarları hub: admin veya (site-settings | working-hours) izni olan çalışan.
 */
export async function requireSiteSettingsHubAccess(
  supabase: ServerSupabase,
  userId: string,
  locale: string
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role === 'admin') return

  const { data: rows } = await supabase
    .from('module_permissions')
    .select('module_name')
    .eq('user_id', userId)
    .eq('can_access', true)
    .in('module_name', ['site-settings', 'working-hours'])

  if (!rows?.length) {
    redirect(`/${locale}/admin/dashboard` as Route)
  }
}
