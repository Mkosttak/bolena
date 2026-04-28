import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { PlatformOrdersClient } from '@/components/modules/platform-orders/PlatformOrdersClient'

interface PlatformOrdersPageProps {
  params: Promise<{ locale: string }>
}

export default async function PlatformOrdersPage({ params }: PlatformOrdersPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'platform-orders', locale)

  return <PlatformOrdersClient />
}
