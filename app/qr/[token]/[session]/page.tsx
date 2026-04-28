import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QrOrderRoute } from '@/components/modules/qr/QrOrderRoute'
import { QrInvalidToken } from '@/components/modules/qr/QrInvalidToken'
import { QrSessionExpired } from '@/components/modules/qr/QrSessionExpired'
import { fetchFullOrderWithClient } from '@/lib/queries/orders.queries'
import type { Category, MenuCampaign, Product } from '@/types'

interface QrSessionPageProps {
  params: Promise<{ token: string; session: string }>
}

export default async function QrSessionPage({ params }: QrSessionPageProps) {
  const { token, session } = await params
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  // 1. Her iki parametreyi UUID formatı için doğrula
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(token) || !uuidRegex.test(session)) notFound()

  // 2. Global QR ayarını kontrol et
  const { data: settingData } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'qr_ordering')
    .maybeSingle()

  const globalEnabled =
    (settingData?.value as { global_enabled?: boolean } | null)
      ?.global_enabled ?? true

  if (!globalEnabled) {
    return <QrInvalidToken reason="global_disabled" />
  }

  // 3. Session token ile sipariş bilgisini getir
  const { data: sessionRows, error: sessionError } = await supabase.rpc(
    'get_order_by_session_token',
    { p_session_token: session }
  )

  if (sessionError || !sessionRows || sessionRows.length === 0) notFound()

  const sessionRow = sessionRows[0] as {
    order_id: string
    table_id: string
    table_name: string
    qr_token: string
    order_status: string
    qr_enabled: boolean
  }

  // 4. Güvenlik: session'ın qr_token'ı URL'deki token ile eşleşmeli
  if (sessionRow.qr_token !== token) notFound()

  // 5. Sipariş tamamlandıysa "Oturum Sona Erdi" ekranı göster
  if (sessionRow.order_status !== 'active') {
    return <QrSessionExpired tableName={sessionRow.table_name} />
  }

  const qrEnabled = sessionRow.qr_enabled

  // 6. Menü + sipariş snapshot
  const [catResult, prodResult, campaignResult, initialFullOrder] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select('*, product_ingredients(*), extra_groups(*, extra_options(*))')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('menu_campaigns')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('priority', { ascending: false }),
    fetchFullOrderWithClient(supabase, sessionRow.order_id).catch((): null => null),
  ])

  return (
    <QrOrderRoute
      token={token}
      sessionToken={session}
      tableId={sessionRow.table_id}
      tableName={sessionRow.table_name}
      initialOrderId={sessionRow.order_id}
      qrEnabled={qrEnabled}
      initialCategories={(catResult.data ?? []) as Category[]}
      initialProducts={(prodResult.data ?? []) as unknown as Product[]}
      initialCampaigns={(campaignResult.data ?? []) as MenuCampaign[]}
      initialFullOrder={initialFullOrder}
    />
  )
}
