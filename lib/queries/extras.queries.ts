import { createClient } from '@/lib/supabase/client'
import type { ExtraGroup, ExtraOption } from '@/types'

export const extrasKeys = {
  all: ['extras'] as const,
  byProduct: (productId: string) => [...extrasKeys.all, 'product', productId] as const,
  options: (groupId: string) => [...extrasKeys.all, groupId, 'options'] as const,
}

export async function fetchExtraGroupsByProduct(productId: string): Promise<ExtraGroup[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('extra_groups')
    .select('*, extra_options(*)')
    .eq('product_id', productId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ExtraGroup[]
}

export async function fetchExtraOptions(groupId: string): Promise<ExtraOption[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('extra_options')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ExtraOption[]
}
