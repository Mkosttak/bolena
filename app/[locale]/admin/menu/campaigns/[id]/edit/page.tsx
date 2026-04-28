import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { CampaignForm } from '@/components/modules/menu/CampaignForm'
import type { MenuCampaign } from '@/types'

interface EditCampaignPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'menu', locale)

  const { data: campaign, error } = await supabase
    .from('menu_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !campaign) notFound()

  return (
    <div className="p-6">
      <CampaignForm locale={locale} defaultValues={campaign as MenuCampaign} />
    </div>
  )
}
