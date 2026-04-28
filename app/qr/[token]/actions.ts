'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { SubmitQrOrderSchema } from '@/lib/validations/qr.schema'
import type { QrCartItem } from '@/types'

export async function submitQrOrder(
  token: string,
  _clientOrderId: string,   // client'tan gelen — yalnızca fallback, server'da yeniden doğrulanır
  items: QrCartItem[]
): Promise<{ success: boolean; error?: string }> {
  if (!token || !items?.length) {
    return { success: false, error: 'Eksik sipariş bilgisi' }
  }

  const supabase = createAdminClient()

  // Her zaman server'da güncel orderId'yi çek (sipariş kapanıp yeniden açılmış olabilir)
  const { data: freshOrderId, error: orderErr } = await supabase.rpc(
    'get_or_create_table_order_by_qr',
    { p_qr_token: token }
  )

  if (orderErr || !freshOrderId) {
    console.error('[submitQrOrder] get_or_create_table_order_by_qr error:', orderErr)
    return { success: false, error: 'Masa siparişi alınamadı. Sayfayı yenileyin.' }
  }

  const orderId = freshOrderId as string

  const parse = SubmitQrOrderSchema.safeParse({
    qrToken: token,
    orderId,
    items: items.map((item) => {
      const extrasTotal = item.selected_extras.reduce((s, e) => s + e.price, 0)
      const unitPrice = item.product.campaign_price ?? item.product.price
      const totalPrice = (unitPrice + extrasTotal) * item.quantity

      return {
        productId: item.product.id,
        productNameTr: item.product.name_tr,
        productNameEn: item.product.name_en || item.product.name_tr,
        unitPrice,
        quantity: item.quantity,
        notes: item.notes ?? '',
        removedIngredients: item.removed_ingredients,
        selectedExtras: item.selected_extras,
        totalPrice,
        trackStock: item.product.track_stock,
      }
    }),
  })

  if (!parse.success) {
    const issues = parse.error.issues
    const firstError = issues[0]
    console.error('[submitQrOrder] Zod validation failed:', issues)
    return { success: false, error: `Geçersiz sipariş: ${firstError?.message ?? 'Bilinmeyen hata'}` }
  }

  const { qrToken, orderId: validOrderId, items: validItems } = parse.data

  for (const item of validItems) {
    const { error } = await supabase.rpc('add_order_item_via_qr', {
      p_qr_token: qrToken,
      p_order_id: validOrderId,
      p_product_id: item.productId,
      p_product_name_tr: item.productNameTr,
      p_product_name_en: item.productNameEn,
      p_unit_price: item.unitPrice,
      p_quantity: item.quantity,
      p_notes: item.notes ?? '',
      p_removed_ingredients: item.removedIngredients as unknown as import('@/types/database.types').Json,
      p_selected_extras: item.selectedExtras as unknown as import('@/types/database.types').Json,
      p_total_price: item.totalPrice,
      p_track_stock: item.trackStock,
    })

    if (error) {
      console.error('[submitQrOrder] RPC error:', error)
      return { success: false, error: error.message }
    }
  }

  return { success: true }
}
