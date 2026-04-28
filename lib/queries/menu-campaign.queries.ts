import { createClient } from '@/lib/supabase/client'
import type { MenuCampaign } from '@/types'

export const campaignKeys = {
  all: ['menu_campaigns'] as const,
  list: () => [...campaignKeys.all, 'list'] as const,
  active: () => [...campaignKeys.all, 'active'] as const,
}

/** Tüm kampanyaları döner — admin listesi için */
export async function fetchCampaigns(): Promise<MenuCampaign[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('menu_campaigns')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as MenuCampaign[]
}

/**
 * Tarih aralığı aktif olan kampanyaları döner.
 * Gün ve saat filtresi JS tarafında yapılır (resolveActiveCampaign).
 * Bu şekilde query cache'lenebilir, her saniye yenilenmez.
 */
export async function fetchActiveCampaigns(): Promise<MenuCampaign[]> {
  const supabase = createClient()
  
  // Use local timezone date to ensure campaigns strictly end at local midnight
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const today = `${year}-${month}-${day}`

  const { data, error } = await supabase
    .from('menu_campaigns')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('priority', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as MenuCampaign[]
}
