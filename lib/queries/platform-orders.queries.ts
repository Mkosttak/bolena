import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types'

export const platformOrdersKeys = {
  all: ['platform-orders'] as const,
  active: () => [...platformOrdersKeys.all, 'active'] as const,
  history: () => [...platformOrdersKeys.all, 'history'] as const,
  order: (orderId: string) => [...platformOrdersKeys.all, orderId] as const,
}

export async function fetchActivePlatformOrders(): Promise<Order[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('type', 'platform')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Order[]
}

export async function fetchPlatformOrderHistory(): Promise<Order[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('type', 'platform')
    .neq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data ?? []) as Order[]
}
