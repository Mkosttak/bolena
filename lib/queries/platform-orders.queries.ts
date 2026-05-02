import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types'

export const PLATFORM_HISTORY_PAGE_SIZE = 20

export const platformOrdersKeys = {
  all: ['platform-orders'] as const,
  active: () => [...platformOrdersKeys.all, 'active'] as const,
  history: (page?: number) => [...platformOrdersKeys.all, 'history', page ?? 0] as const,
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

export interface PlatformHistoryResult {
  orders: Order[]
  total: number
  page: number
  pageSize: number
}

export async function fetchPlatformOrderHistory(page = 0): Promise<PlatformHistoryResult> {
  const supabase = createClient()
  const from = page * PLATFORM_HISTORY_PAGE_SIZE
  const to = from + PLATFORM_HISTORY_PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('type', 'platform')
    .neq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)
  return {
    orders: (data ?? []) as Order[],
    total: count ?? 0,
    page,
    pageSize: PLATFORM_HISTORY_PAGE_SIZE,
  }
}
