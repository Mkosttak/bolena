'use server'

import { createClient } from '@/lib/supabase/server'
import { applyDiscount } from '@/lib/utils/order.utils'
import type { DiscountType, PaymentMethod, RemovedIngredient, SelectedExtra } from '@/types'
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

interface AddOrderItemInput {
  orderId: string
  productId: string | null
  productNameTr: string
  productNameEn: string
  unitPrice: number
  quantity: number
  notes?: string | null
  removedIngredients: RemovedIngredient[]
  selectedExtras: SelectedExtra[]
  trackStock: boolean
}

export async function addOrderItem(input: AddOrderItemInput) {
  const supabase = await createClient()

  const extrasTotal = input.selectedExtras.reduce((sum, e) => sum + e.price, 0)
  const totalPrice = (input.unitPrice + extrasTotal) * input.quantity

  const { error } = await supabase.rpc('add_order_item_atomic', {
    p_order_id: input.orderId,
    p_product_id: input.productId as string,
    p_product_name_tr: input.productNameTr,
    p_product_name_en: input.productNameEn,
    p_unit_price: input.unitPrice,
    p_quantity: input.quantity,
    p_notes: (input.notes ?? null) as string,
    p_removed_ingredients: input.removedIngredients as unknown as Json,
    p_selected_extras: input.selectedExtras as unknown as Json,
    p_total_price: totalPrice,
    p_track_stock: input.trackStock,
  })

  if (error) return { error: formatStockError(error.message) }
  return { success: true }
}

export async function removeOrderItem(itemId: string, orderId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('remove_order_item_atomic', {
    p_item_id: itemId,
    p_order_id: orderId,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleItemComplimentary(
  itemId: string,
  orderId: string,
  isComplimentary: boolean
) {
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
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('order_items')
    .select('total_price, is_complimentary')
    .eq('order_id', orderId)

  const subtotal = (items ?? []).reduce(
    (sum, item) => (item.is_complimentary ? sum : sum + Number(item.total_price)),
    0
  )
  const total = applyDiscount(subtotal, discountAmount, discountType)

  const { error } = await supabase
    .from('orders')
    .update({
      discount_amount: discountAmount,
      discount_type: discountType,
      subtotal,
      total_amount: total,
    })
    .eq('id', orderId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function addPayment(
  orderId: string,
  method: PaymentMethod,
  amount: number,
  note?: string
) {
  const supabase = await createClient()

  const { data: newPayment, error } = await supabase.from('payments').insert({
    order_id: orderId,
    method,
    amount,
    note: note ?? null,
  }).select().single()

  if (error) return { error: error.message }
  if (!newPayment) return { error: 'Ödeme kaydedilemedi' }

  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('order_id', orderId)

  const { data: order } = await supabase
    .from('orders')
    .select('total_amount, payment_status')
    .eq('id', orderId)
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
    .eq('id', orderId)

  return { success: true, paymentStatus }
}

export async function closeOrder(orderId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'completed',
      payment_status: 'paid',
      completed_at: new Date().toISOString(),
    })
    .eq('id', orderId)
  if (error) return { error: error.message }
  return { success: true }
}

interface UpdateOrderItemInput {
  itemId: string
  orderId: string
  productId: string | null
  unitPrice: number
  quantity: number
  notes?: string | null
  removedIngredients: RemovedIngredient[]
  selectedExtras: SelectedExtra[]
  trackStock: boolean
}

export async function updateOrderItem(input: UpdateOrderItemInput) {
  const supabase = await createClient()

  const extrasTotal = input.selectedExtras.reduce((sum, e) => sum + e.price, 0)
  const totalPrice = (input.unitPrice + extrasTotal) * input.quantity

  const { error } = await supabase.rpc('update_order_item_atomic', {
    p_item_id: input.itemId,
    p_order_id: input.orderId,
    p_product_id: input.productId as string,
    p_quantity: input.quantity,
    p_notes: (input.notes ?? null) as string,
    p_removed_ingredients: input.removedIngredients as unknown as Json,
    p_selected_extras: input.selectedExtras as unknown as Json,
    p_total_price: totalPrice,
    p_track_stock: input.trackStock,
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
  const supabase = await createClient()

  let shouldTrack = trackStock ?? false
  if (productId && trackStock === undefined) {
    const { data: product } = await supabase
      .from('products')
      .select('track_stock')
      .eq('id', productId)
      .single()
    shouldTrack = product?.track_stock ?? false
  }

  const { error } = await supabase.rpc('update_order_item_quantity_atomic', {
    p_item_id: itemId,
    p_order_id: orderId,
    p_product_id: productId as string,
    p_new_quantity: newQuantity,
    p_track_stock: shouldTrack,
  })

  if (error) return { error: formatStockError(error.message) }
  return { success: true }
}

