export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { fetchDashboardData } from '@/lib/queries/dashboard.queries'
import { DashboardClient } from '@/components/modules/dashboard/DashboardClient'
import { ShieldAlert } from 'lucide-react'

interface DashboardPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin.dashboard' })
  return { title: `${t('title')} — Bolena` }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params
  const tAuth = await getTranslations('auth')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'employee') {
      const { data: perm } = await supabase
        .from('module_permissions')
        .select('can_access')
        .eq('user_id', user.id)
        .eq('module_name', 'dashboard')
        .maybeSingle()

      if (!perm?.can_access) {
        return (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] gap-4 text-center p-8">
            <ShieldAlert className="w-12 h-12 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">{tAuth('unauthorized')}</p>
              <p className="text-sm text-muted-foreground">{tAuth('unauthorizedHint')}</p>
            </div>
          </div>
        )
      }
    }
  }

  const dashboardData = await fetchDashboardData()

  return <DashboardClient initialData={dashboardData} locale={locale} />
}
