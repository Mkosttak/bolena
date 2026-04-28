import type { ModuleName } from '@/types'

/**
 * Sidebar (Nav + site settings) ile aynı öncelik — çalışanın ilk erişebildiği modül.
 */
/** `SidebarContent`: ana nav → site ayarları (hub) → blog */
const MODULE_ORDER: ModuleName[] = [
  'dashboard',
  'tables',
  'kds',
  'reservations',
  'platform-orders',
  'menu',
  'reports',
  'site-settings',
  'working-hours',
  'users',
  'blog',
]

const MODULE_PATH: Record<ModuleName, string> = {
  dashboard: '/admin/dashboard',
  tables: '/admin/tables',
  kds: '/admin/kds',
  reservations: '/admin/reservations',
  'platform-orders': '/admin/platform-orders',
  menu: '/admin/menu',
  reports: '/admin/reports',
  blog: '/admin/blog',
  'site-settings': '/admin/site-settings',
  'working-hours': '/admin/site-settings?tab=hours',
  users: '/admin/site-settings?tab=users',
}

/**
 * Açık yönlendirme riski olmadan, sadece kendi locale admin path'ine izin verir.
 */
export function isSafeLocaleAdminRedirect(
  redirectTo: string | undefined,
  locale: string
): redirectTo is string {
  if (!redirectTo || !redirectTo.startsWith('/')) return false
  if (redirectTo.startsWith('//')) return false
  const prefix = `/${locale}/admin`
  return redirectTo === prefix || redirectTo.startsWith(`${prefix}/`)
}

export function defaultPathAfterLogin(
  locale: string,
  role: 'admin' | 'employee',
  allowedModules: ModuleName[]
): string {
  if (role === 'admin') {
    return `/${locale}/admin/dashboard`
  }
  for (const mod of MODULE_ORDER) {
    if (allowedModules.includes(mod)) {
      return `/${locale}${MODULE_PATH[mod]}`
    }
  }
  return `/${locale}/admin/dashboard`
}
