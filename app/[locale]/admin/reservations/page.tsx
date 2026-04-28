import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { ReservationsClient } from '@/components/modules/reservations/ReservationsClient'

interface ReservationsPageProps {
  params: Promise<{ locale: string }>
}

export default async function ReservationsPage({ params }: ReservationsPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'reservations', locale)

  return <ReservationsClient />
}
