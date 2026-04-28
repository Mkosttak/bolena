'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { Route } from 'next'
import {
  LayoutDashboard,
  UtensilsCrossed,
  TableProperties,
  CalendarDays,
  ShoppingBag,
  ChefHat,
  Sun,
  Moon,
  BarChart3,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import type { ModuleName } from '@/types'
import { cn } from '@/lib/utils'

interface NavItem {
  module: ModuleName
  href: string
  labelKey: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { module: 'dashboard',       href: '/admin/dashboard',       labelKey: 'dashboard',      icon: LayoutDashboard },
  { module: 'tables',          href: '/admin/tables',          labelKey: 'tables',         icon: TableProperties },
  { module: 'kds',             href: '/admin/kds',             labelKey: 'kds',            icon: ChefHat },
  { module: 'reservations',    href: '/admin/reservations',    labelKey: 'reservations',   icon: CalendarDays },
  { module: 'platform-orders', href: '/admin/platform-orders', labelKey: 'platformOrders', icon: ShoppingBag },
  { module: 'menu',            href: '/admin/menu',            labelKey: 'menu',           icon: UtensilsCrossed },
  { module: 'reports',         href: '/admin/reports',         labelKey: 'reports',        icon: BarChart3 },
  { module: 'blog',            href: '/admin/blog',            labelKey: 'blog',           icon: BookOpen },
]

const SITE_SETTINGS_HUB_ITEM: NavItem = {
  module: 'site-settings',
  href: '/admin/site-settings',
  labelKey: 'siteSettings',
  icon: Settings,
}

const NAV_MAIN_ITEMS = NAV_ITEMS.filter((i) => i.module !== 'blog')
const BLOG_NAV_ITEM = NAV_ITEMS.find((i) => i.module === 'blog')!

interface SiteSettingsHubNavLinkProps {
  locale: string
  role: 'admin' | 'employee'
  allowedModules: ModuleName[]
  onItemClick?: () => void
  isCollapsed: boolean
}

/** Tek giriş: hub içinde QR / çalışma saatleri / kullanıcılar (yetkiye göre) */
function SiteSettingsHubNavLink({
  locale,
  role,
  allowedModules,
  onItemClick,
  isCollapsed,
}: SiteSettingsHubNavLinkProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const href = `/${locale}${SITE_SETTINGS_HUB_ITEM.href}`
  const hasAccess =
    role === 'admin' ||
    allowedModules.includes('site-settings') ||
    allowedModules.includes('working-hours')
  if (!hasAccess) return null

  const isActive = pathname.startsWith(href)
  const Icon = SITE_SETTINGS_HUB_ITEM.icon

  return (
    <Link
      href={href as Route}
      onClick={onItemClick}
      className={cn(
        'group flex h-12 items-center rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
        isActive
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      <div
        className={cn(
          'flex h-full shrink-0 items-center justify-center transition-all duration-300',
          isCollapsed ? 'w-full' : 'w-14'
        )}
      >
        <Icon
          className={cn(
            'h-5.5 w-5.5 transition-colors',
            isActive ? 'text-primary-foreground' : 'group-hover:text-primary'
          )}
        />
      </div>
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="truncate font-sans tracking-tight font-semibold"
          >
            {t(SITE_SETTINGS_HUB_ITEM.labelKey as Parameters<typeof t>[0])}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

interface NavLinkProps {
  item: NavItem
  locale: string
  role: 'admin' | 'employee'
  allowedModules: ModuleName[]
  onItemClick?: () => void
  isCollapsed: boolean
}

function NavLink({ item, locale, role, allowedModules, onItemClick, isCollapsed }: NavLinkProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  const hasAccess = role === 'admin' || allowedModules.includes(item.module)
  if (!hasAccess) return null

  const href = `/${locale}${item.href}`
  const isActive = pathname.startsWith(href)
  const Icon = item.icon

  return (
    <Link
      href={href as Route}
      onClick={onItemClick}
      className={cn(
        'group flex items-center h-12 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
        isActive
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      {/* Icon Container - Perfectly centered in the link */}
      <div className={cn(
        "h-full flex items-center justify-center shrink-0 transition-all duration-300",
        isCollapsed ? "w-full" : "w-14"
      )}>
        <Icon className={cn(
          'h-5.5 w-5.5 transition-colors',
          isActive ? 'text-primary-foreground' : 'group-hover:text-primary'
        )} />
      </div>

      {/* Label - Visible only when expanded */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="truncate font-sans tracking-tight font-semibold"
          >
            {t(item.labelKey as Parameters<typeof t>[0])}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

interface SidebarContentProps {
  locale: string
  role: 'admin' | 'employee'
  fullName: string
  allowedModules: ModuleName[]
  onItemClick?: () => void
  isCollapsed: boolean
  onToggle: () => void
}

export function SidebarContent({ locale, role, fullName, allowedModules, onItemClick, isCollapsed, onToggle }: SidebarContentProps) {
  const t = useTranslations('nav')

  return (
    <div className="flex h-full flex-col relative overflow-visible bg-sidebar/50 backdrop-blur-md">
      {/* Toggle Collapse Button - Perfectly centered on the right border line */}
      <button
        onClick={onToggle}
        className="absolute top-1/2 right-[-14px] -translate-y-1/2 bg-background border border-sidebar-border rounded-full p-1.5 shadow-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 z-[100] group/toggle active:scale-90"
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>

      {/* Brand Logo Container */}
      <div className={cn(
        "border-b flex flex-col items-center bg-gradient-to-b from-primary/10 to-transparent relative",
        isCollapsed ? "h-24" : "h-36"
      )}>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 w-full">
          <Link 
            href={`/${locale}/admin/dashboard` as Route} 
            onClick={onItemClick}
            className="relative transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <motion.div 
              layout
              className="bg-white p-1.5 rounded-lg shadow-sm border border-primary/10 dark:bg-zinc-900/50"
            >
              <Image
                src="/images/bolena_logo.png"
                alt="Bolena Logo"
                width={isCollapsed ? 32 : 56}
                height={isCollapsed ? 32 : 56}
                className="object-contain dark:invert-[0.1] dark:brightness-110"
                priority
              />
            </motion.div>
          </Link>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <p className="text-[9px] font-bold text-primary uppercase tracking-[0.3em] leading-none opacity-80 font-sans">
                  {t('adminPanel')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      {/* Navigation - Scrollable area */}
      <nav className={cn(
        "flex-1 space-y-2 overflow-y-auto scrollbar-none transition-all duration-300",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {NAV_MAIN_ITEMS.map((item) => (
          <NavLink
            key={item.module}
            item={item}
            locale={locale}
            role={role}
            allowedModules={allowedModules}
            onItemClick={onItemClick}
            isCollapsed={isCollapsed}
          />
        ))}
        <NavLink
          item={BLOG_NAV_ITEM}
          locale={locale}
          role={role}
          allowedModules={allowedModules}
          onItemClick={onItemClick}
          isCollapsed={isCollapsed}
        />
        <SiteSettingsHubNavLink
          locale={locale}
          role={role}
          allowedModules={allowedModules}
          onItemClick={onItemClick}
          isCollapsed={isCollapsed}
        />
      </nav>

      {/* User Footer - Compact Style */}
      <div className="p-3 border-t bg-sidebar-accent/30 backdrop-blur-sm space-y-2">
        <div className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-lg bg-card/50 border border-sidebar-border shadow-sm",
          isCollapsed ? "flex-col py-3 px-1" : "justify-between"
        )}>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col min-w-0 pr-2"
            >
              <p className="text-xs font-bold truncate tracking-tight text-sidebar-foreground">{fullName}</p>
              <div className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter opacity-70">{role}</p>
              </div>
            </motion.div>
          )}
          <div className={cn(
            "flex items-center gap-1",
            isCollapsed && "flex-col w-full"
          )}>
            <ThemeToggle />
            <LogoutButton locale={locale} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="p-2 w-8 h-8" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md transition-all hover:bg-accent hover:text-accent-foreground active:scale-90"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" />
      )}
    </button>
  )
}

function LogoutButton({ locale }: { locale: string }) {
  const t = useTranslations('nav')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = `/${locale}/login`
  }

  return (
    <button
      onClick={handleLogout}
      title={t('logout')}
      className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
    >
      <LogOut className="h-4 w-4 shrink-0" />
    </button>
  )
}
