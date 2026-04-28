import type { Route } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'

interface WorkingHoursPageProps {
  params: Promise<{ locale: string }>
}

/** Eski rota — site ayarları hub içindeki çalışma saatleri sekmesine yönlendirir */
export default async function WorkingHoursPage({ params }: WorkingHoursPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'working-hours', locale)

  redirect(`/${locale}/admin/site-settings?tab=hours` as Route)
}
