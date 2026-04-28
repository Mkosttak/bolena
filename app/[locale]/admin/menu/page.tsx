import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { MenuClient } from '@/components/modules/menu/MenuClient'

interface MenuPageProps {
  params: Promise<{ locale: string }>
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'menu', locale)

  return <MenuClient locale={locale} />
}
