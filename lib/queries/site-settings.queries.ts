import { createClient } from '@/lib/supabase/client'
import type { SiteSetting, TableWithQr } from '@/types'

export const siteSettingsKeys = {
  all: ['site-settings'] as const,
  setting: (key: string) => [...siteSettingsKeys.all, key] as const,
  tablesWithQr: () => [...siteSettingsKeys.all, 'tables-qr'] as const,
}

export interface QrOrderingSettings {
  global_enabled: boolean
}

/** QR ordering ayarlarını getir */
export async function fetchQrSettings(): Promise<QrOrderingSettings> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'qr_ordering')
    .maybeSingle()
  if (error) throw new Error(error.message)
  const value = (data as SiteSetting | null)?.value ?? {}
  return {
    global_enabled: (value as { global_enabled?: boolean }).global_enabled ?? true,
  }
}

/** Tüm masaları qr_token ve qr_enabled ile getir (admin için) */
export async function fetchTablesWithQr(): Promise<TableWithQr[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tables')
    .select(`
      *,
      table_categories(id, name, sort_order)
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as TableWithQr[]
}
