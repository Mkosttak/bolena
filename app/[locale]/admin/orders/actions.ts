'use server'

import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/auth/guards'
import { applyDiscount } from '@/lib/utils/order.utils'
import {
  addOrderItemSchema,
  updateOrderItemSchema,
  updateOrderItemQuantitySchema,
  applyOrderDiscountSchema,
  addPaymentSchema,
  removeOrderItemSchema,
  closeOrderSchema,
  type AddOrderItemInput,
  type UpdateOrderItemInput,
} from '@/lib/validations/order.schema'
import { logger } from '@/lib/utils/logger'
import type { DiscountType, PaymentMethod } from '@/types'
import type { Json } from '@/types/database.types'

// Supabase'den gelen ham stok hata mesajını kullanıcı dostu Türkçeye çevirir
function formatStockError(message: string): string {
  const match = message.match(/Available: (\d+), Requested: (\d+)/)
  if (match) {
    const available = match[1]
    return `Yetersiz stok. Bu üründen en fazla ${available} adet ekleyebilirsiniz.`
  }
  if (message.includes('Insufficient stock')) {
    return 'Bu ürün için yeterli stok bulunmuyor.'
  }
  return message
}

export async function recalculateOrderTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string
) {
  await supabase.rpc('recalculate_order_totals', { p_order_id: orderId })
}

export async function addOrderItem(input: AddOrderItemInput) {
  const auth = await requireModuleAccess('tables')
  if ('error' in auth) return { error: auth.error }

  const parsed = addOrderItemSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Geçersiz sipariş verisi' }
  }
  const data = parsed.data
  const supabase = await createClient()

  const extrasTotal = data.selectedExtras.reduce((sum, e) => sum + e.price, 0)
  const totalPrice = (data.unitPrice + extrasTotal) * data.quantity

  const { error } = await supabase.rpc('add_order_item_atomic', {
    p_order_id: data.orderId,
    p_product_id: data.productId as string,
    p_product_name_tr: data.productNameTr,
    p_product_name_en: data.productNameEn,
    p_unit_price: data.unitPrice,
    p_quantity: data.quantity,
    p_notes: (data.notes ?? null) as string,
    p_removed_ingredients: data.removedIngredients as unknown as Json,
    p_selected_extras: data.selectedExtras as unknown as Json,
    p_total_price: totalPrice,
    p_track_stock: data.trackStock,
  })

  if (error) return { error: formatStockError(error.message) }
  return { success: true }
}

export async function removeOrderItem(itemId: string, orderId: string) {
  const auth = await requireModuleAccess('tables')
  if ('error' in auth) return { error: auth.error }

  const parsed = removeOrderItemSchema.safeParse({ itemId, orderId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('remove_order_item_atomic', {
    p_item_id: parsed.data.itemId,
    p_order_id: parsed.data.orderId,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleItemComplimentary(
  itemId: string,
  orderId: string,
  isComplimentary: boolean
) {
  const auth = await requireModuleAccess('tables')
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('order_items')
    .update({ is_complimentary: isComplimentary })
    .eq('id', itemId)
  if (error) return { error: error.message }
  await recalculateOrderTotals(supabase, orderId)
  return { success: true }
}

export async function applyOrderDiscount(
  orderId: string,
  discountAmount: number,
  discountType: DiscountType | null
) {
  const auth = await requireModuleAccess('tables')
  if ('error' in auth) return { error: auth.error }

  const parsed = applyOrderDiscountSchema.safeParse({
    orderId,
    discountAmount,
    discountType: discountType === 'percent' || discountType === 'amount' ? discountType : null,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Geçersiz indirim verisi' }
  }
  const data = parsed.data
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('order_items')
    .select('total_price, is_complimentary')
    .eq('order_id', data.orderId)

  const subtotal = (items ?? []).reduce(
    (sum, item) => (item.is_complimentary ? sum : sum + Number(item.total_price)),
    0
  )
  const total = applyDiscount(subtotal, data.discountAmount, data.discountType)

  const { error } = await supabase
    .from('orders')
    .update({
      discount_amount: data.discountAmount,
      discount_type: data.discountType,
      subtotal,
      total_amount: total,
    })
    .eq('id', data.orderId)
  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Ödeme ekleme — iki katmanlı idempotency:
 *
 * 1. **DB-level (kesin):** `idempotencyKey` UUID gönderilirse `payments.idempotency_key`
 *    UNIQUE constraint'i (migration 019) duplicate'i engeller. Client retry / network
 *    timeout'a karşı kesin koruma.
 * 2. **App-level (best-effort):** Key gönderilmezse son 10 sn içinde aynı
 *    (orderId, amount, method) ile ödeme varsa dedupe edilir.
 *
 * Client önerisi: `crypto.randomUUID()` ile her ödeme niyetinde key üret;
 * retry sırasında aynı key ile gönder.
 */
export async function addPayment(
  orderId: string,
  method: PaymentMethod,
  amount: number,
  note?: string,
  idempotencyKey?: string,
) {
  const auth = await requireModuleAccess('tables')
  if ('error' in auth) return { error: auth.error }

  const parsed = addPaymentSchema.safeParse({ orderId, method, amount, note, idempotencyKey })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Geçersiz ödeme verisi' }
  }
  const data = parsed.data
  const supabase = await createClient()

  // 1. DB-level idempotency (eğer key verildiyse)
  // Not: idempotency_key column'u 019_production_hardening migration ile eklendi.
  // Tip dosyası prod uygulamasından sonra `supabase gen types` ile güncellenmeli.
  if (data.idempotencyKey) {
    const { data: existing } = await (supabase
      .from('payments')
      .select('id, order_id') as unknown as ReturnType<typeof supabase.from>)
      .eq('idempotency_key' as never, data.idempotencyKey)
      .maybeSingle()
    if (existing) {
      logger.info('[addPayment] dedupe via idempotency_key', { key: data.idempotencyKey })
      const { data: o } = await supabase
        .from('orders').select('payment_status').eq('id', data.orderId).single()
      return { success: true, paymentStatus: o?.payment_status ?? 'partial', deduped: true }
    }
  }

  // 2. App-level dedupe (10 sn aynı amount/method) — key yoksa fallback
  if (!data.idempotencyKey) {
    const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString()
    const { data: recentDupe } = await supabase
      .from('payments')
      .select('id')
      .eq('order_id', data.orderId)
      .eq('amount', data.amount)
      .eq('method', data.method)
      .gte('created_at', tenSecondsAgo)
      .limit(1)
      .maybeSingle()
    if (recentDupe) {
      logger.warn('[addPayment] duplicate suppressed (app-level)', {
        orderId: data.orderId, amount: data.amount, method: data.method,
      })
      const { data: o } = await supabase
        .from('orders').select('payment_status').eq('id', data.orderId).single()
      return { success: true, paymentStatus: o?.payment_status ?? 'partial', deduped: true }
    }
  }

  // idempotency_key: 019 migration sonrası gen types ile tip dosyasına eklenecek.
  const insertPayload = {
    order_id: data.orderId,
    method: data.method,
    amount: data.amount,
    note: data.note ?? null,
    idempotency_key: data.idempotencyKey ?? null,
  } as never
  const { data: newPayment, error } = await supabase
    .from('payments')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    // UNIQUE violation → race olmuş, dedupe et
    if (error.code === '23505' && data.idempotencyKey) {
      const { data: o } = await supabase
        .from('orders').select('payment_status').eq('id', data.orderId).single()
      return { success: true, paymentStatus: o?.payment_status ?? 'partial', deduped: true }
    }
    return { error: error.message }
  }
  if (!newPayment) return { error: 'Ödeme kaydedilemedi' }

  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('order_id', data.orderId)

  const { data: order } = await supabase
    .from('orders')
    .select('total_amount, payment_status')
    .eq('id', data.orderId)
    .single()

  const totalPaid = (allPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  const totalAmount = Number(order?.total_amount ?? 0)

  if (order?.payment_status === 'paid' && totalPaid >= totalAmount) {
    return { success: true, paymentStatus: 'paid' }
  }

  const paymentStatus = totalPaid >= totalAmount - 0.01 ? 'paid' : 'partial'

  await supabase
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', data.orderId)

  return { success: true, paymentStatus }
}

/**
 * Sipariş kapatma.
 *
 * **Race condition guard:** Sadece halen `active` olan order kapatılabilir.
 * İki paralel `closeOrder` çağrısı — biri kazanır, diğeri "already closed" döner.
 */
export async function closeOrder(orderId: string) {
  const auth = await requireModuleAccess('tables')
  if ('error' in auth) return { error: auth.error }

  const parsed = closeOrderSchema.safeParse({ orderId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Geçersiz sipariş ID' }
  }

  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      status: 'completed',
      payment_status: 'paid',
      completed_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.orderId)
    .eq('status', 'active')   // ⬅ race guard: sadece halen aktif olan kapanır
    .select('id')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!updated) {
    // Order zaten completed veya silinmiş — idempotent başarı
    return { success: true, alreadyClosed: true }
  }
  return { success: true }
}

export async function updateOrderItem(input: UpdateOrderItemInput) {
  const auth = await requireModuleAccess('tables')
  if ('error' in auth) return { error: auth.error }

  const parsed = updateOrderItemSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }
  }
  const data = parsed.data
  const supabase = await createClient()

  const extrasTotal = data.selectedExtras.reduce((sum, e) => sum + e.price, 0)
  const totalPrice = (data.unitPrice + extrasTotal) * data.quantity

  const { error } = await supabase.rpc('update_order_item_atomic', {
    p_item_id: data.itemId,
    p_order_id: data.orderId,
    p_product_id: data.productId as string,
    p_quantity: data.quantity,
    p_notes: (data.notes ?? null) as string,
    p_removed_ingredients: data.removedIngredients as unknown as Json,
    p_selected_extras: data.selectedExtras as unknown as Json,
    p_total_price: totalPrice,
    p_track_stock: data.trackStock,
  })

  if (error) return { error: formatStockError(error.message) }
  return { success: true }
}

export async function updateOrderItemQuantity(
  itemId: string,
  orderId: string,
  newQuantity: number,
  productId: string | null,
  trackStock?: boolean
) {
  const auth = await requireModuleAccess('tables')
  if ('error' in auth) return { error: auth.error }

  const parsed = updateOrderItemQuantitySchema.safeParse({
    itemId, orderId, newQuantity, productId, trackStock,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }
  }
  const data = parsed.data
  const supabase = await createClient()

  let shouldTrack = data.trackStock ?? false
  if (data.productId && data.trackStock === undefined) {
    const { data: product } = await supabase
      .from('products')
      .select('track_stock')
      .eq('id', data.productId)
      .single()
    shouldTrack = product?.track_stock ?? false
  }

  const { error } = await supabase.rpc('update_order_item_quantity_atomic', {
    p_item_id: data.itemId,
    p_order_id: data.orderId,
    p_product_id: data.productId as string,
    p_new_quantity: data.newQuantity,
    p_track_stock: shouldTrack,
  })

  if (error) return { error: formatStockError(error.message) }
  return { success: true }
}
