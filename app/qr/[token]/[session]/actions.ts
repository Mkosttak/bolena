'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { SubmitQrOrderSchema } from '@/lib/validations/qr.schema'
import { logger } from '@/lib/utils/logger'
import type { QrCartItem } from '@/types'

export async function submitQrOrder(
  token: string,
  sessionToken: string,
  _clientOrderId: string,   // client'tan gelen — yalnızca fallback, server'da yeniden doğrulanır
  items: QrCartItem[]
): Promise<{ success: boolean; error?: string }> {
  if (!token || !sessionToken || !items?.length) {
    return { success: false, error: 'Eksik sipariş bilgisi' }
  }

  const supabase = createAdminClient()

  // session_token ile güncel orderId'yi ve durumu çek
  const { data: sessionRows, error: sessionErr } = await supabase.rpc(
    'get_order_by_session_token',
    { p_session_token: sessionToken }
  )

  if (sessionErr || !sessionRows || sessionRows.length === 0) {
    return { success: false, error: 'Oturum bulunamadı. Sayfayı yenileyin.' }
  }

  const sessionRow = sessionRows[0] as {
    order_id: string
    qr_token: string
    order_status: string
  }

  // Oturum sona ermiş mi?
  if (sessionRow.order_status !== 'active') {
    return { success: false, error: 'session_expired' }
  }

  // qr_token URL'deki token ile eşleşmeli (güvenlik)
  if (sessionRow.qr_token !== token) {
    return { success: false, error: 'Geçersiz oturum.' }
  }

  const orderId = sessionRow.order_id

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
    logger.error('[submitQrOrder] Zod validation failed', issues)
    return { success: false, error: `Geçersiz sipariş: ${firstError?.message ?? 'Bilinmeyen hata'}` }
  }

  const { qrToken, orderId: validOrderId, items: validItems } = parse.data

  for (const item of validItems) {
    const { error } = await supabase.rpc('add_order_item_via_qr', {
      p_qr_token: qrToken,
      p_order_id: validOrderId,
      p_session_token: sessionToken,
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
      logger.error('[submitQrOrder] RPC error', error)
      return { success: false, error: error.message }
    }
  }

  return { success: true }
}
