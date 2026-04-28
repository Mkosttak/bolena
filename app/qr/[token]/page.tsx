import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QrInvalidToken } from '@/components/modules/qr/QrInvalidToken'

interface QrPageProps {
  params: Promise<{ token: string }>
}

/**
 * QR giriş sayfası — yalnızca yönlendirme.
 * QR kodlar hep bu kalıcı URL'e yönlendirir (/qr/[tableToken]).
 * Bu sayfa yeni bir session_token üretip /qr/[token]/[session]'a redirect eder.
 */
export default async function QrPage({ params }: QrPageProps) {
  const { token } = await params
  const supabase = await createClient()

  // 1. Token formatını doğrula (UUID formatı)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(token)) notFound()

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

  // 3. Masa bilgisini kontrol et
  const { data: tableRows, error: tableError } = await supabase.rpc(
    'get_table_by_qr_token',
    { p_qr_token: token }
  )

  if (tableError || !tableRows || tableRows.length === 0) notFound()

  const tableRow = tableRows[0] as { id: string; name: string; qr_enabled: boolean }
  if (!tableRow.qr_enabled) {
    return <QrInvalidToken reason="table_disabled" />
  }

  // 4. Oturum oluştur/bul ve session_token al
  const { data: sessionRows, error: sessionError } = await supabase.rpc(
    'get_or_create_session_for_table',
    { p_qr_token: token }
  )

  if (sessionError || !sessionRows || sessionRows.length === 0) {
    return <QrInvalidToken reason="global_disabled" />
  }

  const { session_token } = sessionRows[0] as { order_id: string; session_token: string }

  // 5. Müşteriye özel oturum URL'ine yönlendir
  redirect(`/qr/${token}/${session_token}`)
}
