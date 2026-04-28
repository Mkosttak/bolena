import { createClient } from '@/lib/supabase/client'
import type { KdsOrderItem } from '@/lib/utils/kds.utils'

// =====================================================
// KDS (Mutfak/Bar Ekranı) — Query Keys & Fetch Functions
// =====================================================

export const kdsKeys = {
  all: ['kds'] as const,
  activeItems: () => [...kdsKeys.all, 'active-items'] as const,
  completedToday: () => [...kdsKeys.all, 'completed-today'] as const,
}

export interface KdsCompletedOrder {
  id: string
  type: string
  status: string
  customer_name: string | null
  table_id: string | null
  platform: string | null
  completed_at: string | null
  created_at: string
  items: {
    id: string
    product_name_tr: string
    product_name_en: string
    quantity: number
    notes: string | null
    kds_status: 'pending' | 'ready'
    created_at?: string
  }[]
}

/**
 * Tüm aktif siparişlerdeki pending order_items'ı order bilgileriyle birlikte çeker.
 * KDS ekranının ana veri kaynağı.
 */
export async function fetchKdsActiveItems(): Promise<KdsOrderItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('order_items')
    .select(
      `
      id,
      order_id,
      product_name_tr,
      product_name_en,
      quantity,
      notes,
      removed_ingredients,
      selected_extras,
      is_complimentary,
      kds_status,
      created_at,
      orders!inner (
        id,
        type,
        status,
        table_id,
        customer_name,
        platform,
        notes,
        created_at,
        session_token,
        reservations (
          reservation_date,
          reservation_time
        )
      )
    `
    )
    .eq('kds_status', 'pending')
    .gt('quantity', 0)
    .eq('orders.status', 'active')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown[]).map((row) => {
    const r = row as {
      id: string
      order_id: string
      product_name_tr: string
      product_name_en: string
      quantity: number
      notes: string | null
      removed_ingredients: unknown[]
      selected_extras: unknown[]
      is_complimentary: boolean
      kds_status: 'pending' | 'ready'
      created_at: string
      orders: {
        id: string
        type: string
        status: string
        table_id: string | null
        customer_name: string | null
        platform: string | null
        notes: string | null
        created_at: string
        session_token: string | null
        reservations: {
          reservation_date: string | null
          reservation_time: string | null
        }[] | null
      }
    }

    const reservation = r.orders.reservations?.[0] ?? null

    return {
      id: r.id,
      order_id: r.order_id,
      product_name_tr: r.product_name_tr,
      product_name_en: r.product_name_en,
      quantity: r.quantity,
      notes: r.notes,
      removed_ingredients: r.removed_ingredients as KdsOrderItem['removed_ingredients'],
      selected_extras: r.selected_extras as KdsOrderItem['selected_extras'],
      is_complimentary: r.is_complimentary,
      kds_status: r.kds_status,
      created_at: r.created_at,
      order_type: r.orders.type as KdsOrderItem['order_type'],
      order_table_id: r.orders.table_id,
      order_customer_name: r.orders.customer_name,
      order_platform: r.orders.platform as KdsOrderItem['order_platform'],
      order_notes: r.orders.notes,
      order_created_at: r.orders.created_at,
      is_qr_order: !!r.orders.session_token,
      reservation_date: reservation?.reservation_date ?? null,
      reservation_time: reservation?.reservation_time ?? null,
    } satisfies KdsOrderItem
  })
}

/**
 * Bugün tamamlanan siparişleri item'larıyla birlikte çeker (geçmiş ekranı için).
 */
export async function fetchKdsCompletedToday(): Promise<KdsCompletedOrder[]> {
  const supabase = createClient()

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  /** Bugün oluşturulmuş tamamlanmış siparişler + kalemler (`completed_at` sipariş kapanışı için kullanılır). */
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      type,
      customer_name,
      table_id,
      platform,
      completed_at,
      created_at,
      status,
      order_items (
        id,
        product_name_tr,
        product_name_en,
        quantity,
        notes,
        kds_status,
        created_at
      )
    `
    )
    .gte('created_at', dayStart.toISOString())
    .lt('created_at', dayEnd.toISOString())
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown[]).map((row) => {
    const r = row as {
      id: string
      type: string
      status: string
      customer_name: string | null
      table_id: string | null
      platform: string | null
      completed_at: string | null
      created_at: string
      order_items:
        | {
            id: string
            product_name_tr: string
            product_name_en: string
            quantity: number
            notes: string | null
            kds_status: 'pending' | 'ready'
            created_at?: string
          }[]
        | {
            id: string
            product_name_tr: string
            product_name_en: string
            quantity: number
            notes: string | null
            kds_status: 'pending' | 'ready'
            created_at?: string
          }
        | null
    }
    const raw = r.order_items
    const items = Array.isArray(raw) ? raw : raw ? [raw] : []
    return {
      id: r.id,
      type: r.type,
      status: r.status,
      customer_name: r.customer_name,
      table_id: r.table_id,
      platform: r.platform,
      completed_at: r.completed_at,
      created_at: r.created_at,
      items,
    } satisfies KdsCompletedOrder
  })
}
