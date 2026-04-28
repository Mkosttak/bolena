import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { ReportsClient } from '@/components/modules/reports/ReportsClient'

interface ReportsPageProps {
  params: Promise<{ locale: string }>
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'reports', locale)

  return <ReportsClient locale={locale} />
}
