import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSiteSettingsHubAccess } from '@/lib/utils/server-guard'
import { SiteSettingsClient } from '@/components/modules/site-settings/SiteSettingsClient'
import SiteSettingsLoading from './loading'

interface SiteSettingsPageProps {
  params: Promise<{ locale: string }>
}

export default async function SiteSettingsPage({ params }: SiteSettingsPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireSiteSettingsHubAccess(supabase, user.id, locale)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role) redirect(`/${locale}/login`)

  return (
    <Suspense fallback={<SiteSettingsLoading />}>
      <SiteSettingsClient userRole={profile.role as 'admin' | 'employee'} />
    </Suspense>
  )
}
