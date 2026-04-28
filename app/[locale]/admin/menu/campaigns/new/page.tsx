import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { CampaignForm } from '@/components/modules/menu/CampaignForm'

interface NewCampaignPageProps {
  params: Promise<{ locale: string }>
}

export default async function NewCampaignPage({ params }: NewCampaignPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'menu', locale)

  return (
    <div className="p-6">
      <CampaignForm locale={locale} />
    </div>
  )
}
