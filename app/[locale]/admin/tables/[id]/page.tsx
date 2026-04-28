import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { getOrCreateTableOrder } from '@/app/[locale]/admin/tables/actions'
import { TableOrderScreen } from '@/components/modules/tables/TableOrderScreen'

interface TableDetailPageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: TableDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: table } = await supabase.from('tables').select('name').eq('id', id).single()

  return {
    title: `${table?.name || 'Masa Detail'} — Bolena`,
  }
}

export default async function TableDetailPage({ params }: TableDetailPageProps) {
  const { locale, id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'tables', locale)

  // Masa adı + orderId aynı anda — iki ayrı await yerine paralel
  const [tableResult, orderResult] = await Promise.all([
    supabase.from('tables').select('id, name').eq('id', id).single(),
    getOrCreateTableOrder(id),
  ])

  if (!tableResult.data) notFound()
  if ('error' in orderResult) {
    // Sipariş oluşturulamadı — sayfayı yine de göster, client hata mesajı verir
    return (
      <TableOrderScreen
        tableId={id}
        tableName={tableResult.data.name}
        locale={locale}
        initialOrderId={null}
        initialOrderError={orderResult.error}
      />
    )
  }

  return (
    <TableOrderScreen
      tableId={id}
      tableName={tableResult.data.name}
      locale={locale}
      initialOrderId={orderResult.orderId}
    />
  )
}
