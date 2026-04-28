import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { KdsClient } from '@/components/modules/kds/KdsClient'

interface KdsPageProps {
  params: Promise<{ locale: string }>
}

export default async function KdsPage({ params }: KdsPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'kds', locale)

  return <KdsClient locale={locale} />
}
