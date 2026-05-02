'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { QrCode } from 'lucide-react'
import { fetchQrSettings, fetchTablesWithQr, siteSettingsKeys } from '@/lib/queries/site-settings.queries'
import { usePermission } from '@/lib/hooks/usePermission'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkingHoursClient } from '@/components/modules/working-hours/WorkingHoursClient'
import { UsersClient } from '@/components/modules/users/UsersClient'
import type { UserRole } from '@/types'
import { GlobalQrToggle } from './GlobalQrToggle'
import { QrTableCard } from './QrTableCard'

type HubTab = 'qr' | 'hours' | 'users'

interface SiteSettingsClientProps {
  userRole: UserRole
}

export function SiteSettingsClient({ userRole }: SiteSettingsClientProps) {
  const t = useTranslations('siteSettings')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const profile = useAuthStore((s) => s.profile)

  const canQr = usePermission('site-settings')
  const canHours = usePermission('working-hours')
  const canUsers = userRole === 'admin'

  const allowedTabs = useMemo(() => {
    const list: HubTab[] = []
    if (canQr) list.push('qr')
    if (canHours) list.push('hours')
    if (canUsers) list.push('users')
    return list
  }, [canQr, canHours, canUsers])

  const activeTab = useMemo((): HubTab => {
    const raw = tabParam as HubTab | null
    if (raw && allowedTabs.includes(raw)) return raw
    return allowedTabs[0] ?? 'qr'
  }, [tabParam, allowedTabs])

  useEffect(() => {
    if (allowedTabs.length === 0) return
    const raw = tabParam as HubTab | null
    if (!raw || !allowedTabs.includes(raw)) {
      router.replace(`${pathname}?tab=${allowedTabs[0]}` as Route)
    }
  }, [tabParam, allowedTabs, pathname, router])

  function handleTabChange(v: string | number | null) {
    if (v == null || typeof v === 'number') return
    router.replace(`${pathname}?tab=${v}` as Route)
  }

  if (isAuthLoading || !profile) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 py-6 md:p-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-10 w-full max-w-xl rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (allowedTabs.length === 0) {
    return (
      <div className="mx-auto max-w-5xl p-6 text-sm text-muted-foreground">
        {t('hubNoAccess')}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 py-6 md:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <QrCode className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('hubSubtitle')}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full gap-4">
        <TabsList
          variant="line"
          className="flex h-auto w-full flex-wrap gap-1 border-b border-border/60 bg-transparent p-0 pb-px"
        >
          {canQr && (
            <TabsTrigger value="qr" className="flex-1 min-w-[8rem] rounded-none border-0 px-4 py-3 shadow-none data-active:shadow-none">
              {t('hubTabQr')}
            </TabsTrigger>
          )}
          {canHours && (
            <TabsTrigger value="hours" className="flex-1 min-w-[8rem] rounded-none border-0 px-4 py-3 shadow-none data-active:shadow-none">
              {t('hubTabHours')}
            </TabsTrigger>
          )}
          {canUsers && (
            <TabsTrigger value="users" className="flex-1 min-w-[8rem] rounded-none border-0 px-4 py-3 shadow-none data-active:shadow-none">
              {t('hubTabUsers')}
            </TabsTrigger>
          )}
        </TabsList>

        {canQr && (
          <TabsContent value="qr" className="mt-4">
            <QrSettingsTabPanel />
          </TabsContent>
        )}
        {canHours && (
          <TabsContent value="hours" className="mt-4">
            <WorkingHoursClient embeddedInHub />
          </TabsContent>
        )}
        {canUsers && (
          <TabsContent value="users" className="mt-4">
            <UsersClient embeddedInHub />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function QrSettingsTabPanel() {
  const t = useTranslations('siteSettings')
  const { data: qrSettings, isLoading: loadingSettings } = useQuery({
    queryKey: siteSettingsKeys.setting('qr_ordering'),
    queryFn: fetchQrSettings,
  })

  const { data: tables, isLoading: loadingTables } = useQuery({
    queryKey: siteSettingsKeys.tablesWithQr(),
    queryFn: fetchTablesWithQr,
  })

  const [globalEnabled, setGlobalEnabled] = useState<boolean | null>(null)
  const effectiveGlobalEnabled = globalEnabled ?? qrSettings?.global_enabled ?? true

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? ''

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('qrSection')}</h2>
        {loadingSettings ? (
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        ) : (
          <GlobalQrToggle enabled={effectiveGlobalEnabled} onToggle={setGlobalEnabled} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('tablesSection')}</h2>

        {loadingTables ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (tables ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noTablesHint')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(tables ?? []).map((table) => (
              <QrTableCard key={table.id} table={table} baseUrl={baseUrl} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
