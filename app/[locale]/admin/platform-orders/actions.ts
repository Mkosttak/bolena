'use server'

import { createClient } from '@/lib/supabase/server'
import { platformOrderSchema } from '@/lib/validations/platform-order.schema'
import type { PlatformOrderInput } from '@/lib/validations/platform-order.schema'

// ─── Sipariş Oluştur ─────────────────────────────────────────────────────────

export async function createPlatformOrder(input: PlatformOrderInput) {
  const parsed = platformOrderSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const data = parsed.data

  // Teslim tarihi/saatini not olarak öne ekle
  const fullNotes = data.notes ?? null


  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      type: 'platform',
      platform: data.platform,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone.replace(/\s/g, '') || null,
      customer_address: data.customer_address.trim() || null,
      notes: fullNotes,
      status: 'active',
      subtotal: 0,
      discount_amount: 0,
      total_amount: 0,
      payment_status: 'pending',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, orderId: order.id }
}

// ─── Teslim Et ───────────────────────────────────────────────────────────────
// Yemeksepeti/Getir/Trendyol: ödeme otomatik `platform` yöntemiyle kaydedilir.
// Kurye: ödeme ayrıca PaymentModalSimple ile alınır; bu aksiyon sadece kapatır.

export async function deliverPlatformOrder(orderId: string) {
  const supabase = await createClient()

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('total_amount, platform, payment_status')
    .eq('id', orderId)
    .single()

  if (fetchError) return { error: fetchError.message }

  // Platform ödemeleri otomatik kaydedilir (kurye hariç)
  if (order.platform !== 'courier' && order.total_amount > 0) {
    const { error: paymentError } = await supabase.from('payments').insert({
      order_id: orderId,
      amount: order.total_amount,
      method: 'platform',
    })
    if (paymentError) return { error: paymentError.message }
  }

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

// ─── İptal Et ────────────────────────────────────────────────────────────────

export async function cancelPlatformOrder(orderId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)

  if (error) return { error: error.message }
  return { success: true }
}
