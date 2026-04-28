import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderItem, Payment } from '@/types'

export const ordersKeys = {
  all: ['orders'] as const,
  active: (tableId: string) => [...ordersKeys.all, 'active', tableId] as const,
  order: (orderId: string) => [...ordersKeys.all, orderId] as const,
  items: (orderId: string) => [...ordersKeys.all, orderId, 'items'] as const,
  payments: (orderId: string) => [...ordersKeys.all, orderId, 'payments'] as const,
  /** Tek sorguda order + items + payments */
  full: (orderId: string) => [...ordersKeys.all, orderId, 'full'] as const,
}

export interface FullOrder {
  order: Order
  items: OrderItem[]
  payments: Payment[]
}

/** Supabase `orders` tek satır + nested select çıktısı */
export function mapRowToFullOrder(data: unknown): FullOrder | null {
  if (!data || typeof data !== 'object') return null
  const row = data as {
    order_items?: OrderItem[]
    payments?: Payment[]
    [key: string]: unknown
  }
  const { order_items, payments, ...order } = row

  const sortedItems = [...(order_items ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const sortedPayments = [...(payments ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return { order: order as unknown as Order, items: sortedItems, payments: sortedPayments }
}

/** Sunucu bileşenleri — tek round-trip, token→masa RPC’si yok */
export async function fetchFullOrderWithClient(
  supabase: SupabaseClient,
  orderId: string
): Promise<FullOrder | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), payments(*)')
    .eq('id', orderId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return mapRowToFullOrder(data)
}

/** Tek Supabase round-trip ile order + order_items + payments (QR’da orderId biliniyorsa bunu kullanın; `fetchQrOrder` gereksiz RPC yapar) */
export async function fetchFullOrder(orderId: string): Promise<FullOrder | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), payments(*)')
    .eq('id', orderId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return mapRowToFullOrder(data)
}

export async function fetchActiveOrder(tableId: string): Promise<Order | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('table_id', tableId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Order | null
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as OrderItem[]
}

export async function fetchPayments(orderId: string): Promise<Payment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Payment[]
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Order | null
}
