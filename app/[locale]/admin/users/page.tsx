import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/server'

interface UsersPageProps {
  params: Promise<{ locale: string }>
}

/** Eski rota — site ayarları hub içindeki kullanıcılar sekmesine yönlendirir (yalnızca admin) */
export default async function UsersPage({ params }: UsersPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect(`/${locale}/admin/dashboard` as Route)

  redirect(`/${locale}/admin/site-settings?tab=users` as Route)
}
