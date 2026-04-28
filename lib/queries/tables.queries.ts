import { createClient } from '@/lib/supabase/client'
import type { Table, TableCategory } from '@/types'

export const tablesKeys = {
  all: ['tables'] as const,
  list: () => [...tablesKeys.all, 'list'] as const,
  detail: (id: string) => [...tablesKeys.all, id] as const,
  categories: () => [...tablesKeys.all, 'categories'] as const,
}

export async function fetchTablesWithOrder(): Promise<Table[]> {
  const supabase = createClient()

  // Tek sorguda tables + aktif order bilgisi (LEFT JOIN semantiği)
  const { data, error } = await supabase
    .from('tables')
    .select(`
      *,
      table_categories(id, name, sort_order),
      orders!orders_table_id_fkey(
        id, status, subtotal, total_amount, payment_status, session_token, created_at,
        order_items(count),
        payments(amount)
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((t) => {
    const activeOrder = (t.orders as typeof t.orders & { order_items?: { count: number }[]; payments?: { amount: number }[] }[])
      ?.find((o: { status: string }) => o.status === 'active') ?? null

    if (!activeOrder) return { ...t, orders: undefined, activeOrder: null } as unknown as Table

    const paid_amount = ((activeOrder as { payments?: { amount: number }[] }).payments ?? [])
      .reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0)
    const orderItems = (activeOrder as { order_items?: { count: number }[] }).order_items
    const items_count = orderItems?.[0]?.count ?? 0
    const is_qr_order = !!((activeOrder as { session_token?: string | null }).session_token)

    return {
      ...t,
      orders: undefined,
      activeOrder: { ...activeOrder, items_count, paid_amount, is_qr_order },
    } as unknown as Table
  })
}

export async function fetchTableCategories(): Promise<TableCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('table_categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as TableCategory[]
}
