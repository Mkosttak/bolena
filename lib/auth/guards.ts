import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ModuleName } from '@/types'

/**
 * Server-side yetkilendirme guard'ları.
 *
 * Tüm admin server action'larının ilk satırında çağrılmalı:
 *
 *   export async function deleteX(id: string) {
 *     const auth = await requireAdmin()
 *     if ('error' in auth) return { error: auth.error }
 *     ...
 *   }
 *
 * RLS son savunma katmanıdır; bu guard'lar **defense in depth** sağlar:
 * - Yetkisiz kullanıcı action'ı çağırırsa erken reddedilir (DB hit yok)
 * - Net hata mesajı (Unauthorized vs Forbidden)
 * - Audit/log noktası tek yerde
 */

type Role = 'admin' | 'employee'

type AuthGuardSuccess = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  role: Role
}

type AuthGuardError = { error: 'Unauthorized' | 'Forbidden' }

export type AuthGuardResult = AuthGuardSuccess | AuthGuardError

/**
 * Sadece login + aktif profile ister. Rol fark etmez.
 */
export async function requireAuth(): Promise<AuthGuardResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) return { error: 'Forbidden' }
  if (profile.role !== 'admin' && profile.role !== 'employee') {
    return { error: 'Forbidden' }
  }

  return { supabase, userId: user.id, role: profile.role as Role }
}

/**
 * Sadece admin rolüne izin verir.
 */
export async function requireAdmin(): Promise<AuthGuardResult> {
  const auth = await requireAuth()
  if ('error' in auth) return auth
  if (auth.role !== 'admin') return { error: 'Forbidden' }
  return auth
}

/**
 * Admin VEYA belirtilen module_permissions hakkı olan employee.
 * Çoğu admin module action'ı için bu kullanılmalı (örn. orders, kds, menu).
 */
export async function requireModuleAccess(
  module: ModuleName,
): Promise<AuthGuardResult> {
  const auth = await requireAuth()
  if ('error' in auth) return auth
  if (auth.role === 'admin') return auth

  const { data: permission } = await auth.supabase
    .from('module_permissions')
    .select('can_access')
    .eq('user_id', auth.userId)
    .eq('module_name', module)
    .maybeSingle()

  if (!permission?.can_access) return { error: 'Forbidden' }
  return auth
}
