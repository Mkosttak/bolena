import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { TablesClient } from '@/components/modules/tables/TablesClient'

interface TablesPageProps {
  params: Promise<{ locale: string }>
}

export default async function TablesPage({ params }: TablesPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'tables', locale)

  return <TablesClient locale={locale} />
}
