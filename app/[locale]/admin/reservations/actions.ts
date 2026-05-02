'use server'

import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/auth/guards'
import { reservationSchema } from '@/lib/validations/reservation.schema'
import type { ReservationInput } from '@/lib/validations/reservation.schema'

export async function createReservation(input: ReservationInput) {
  const auth = await requireModuleAccess("reservations")
  if ("error" in auth) return { error: auth.error }

  const parsed = reservationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }

  const supabase = await createClient()
  const data = parsed.data

  const { data: result, error } = await supabase.rpc('create_reservation_with_order_atomic', {
    p_type: data.type,
    p_customer_name: data.customer_name,
    p_customer_phone: (data.customer_phone.replace(/\s/g, '') || null) as string,
    p_notes: (data.notes ?? null) as string,
    p_reservation_date: (data.reservation_date || null) as string,
    p_reservation_time: (data.reservation_time || null) as string,
    p_party_size: (data.party_size ?? null) as number,
  })

  if (error) return { error: error.message }
  const row = result?.[0]
  if (!row?.reservation_id || !row?.order_id) {
    return { error: 'Rezervasyon oluşturulamadı' }
  }

  return { success: true, reservationId: row.reservation_id, orderId: row.order_id }
}

export async function updateReservation(id: string, input: ReservationInput) {
  const auth = await requireModuleAccess("reservations")
  if ("error" in auth) return { error: auth.error }

  const parsed = reservationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }

  const supabase = await createClient()
  const data = parsed.data

  const { data: currentRes, error: fetchError } = await supabase
    .from('reservations')
    .select('order_id')
    .eq('id', id)
    .single()

  if (fetchError) return { error: fetchError.message }

  const { error: resError } = await supabase
    .from('reservations')
    .update({
      customer_name: data.customer_name,
      customer_phone: data.customer_phone.replace(/\s/g, '') || undefined,
      reservation_date: data.reservation_date || null,
      reservation_time: data.reservation_time || null,
      party_size: data.party_size ?? null,
      notes: data.notes || null,
    })
    .eq('id', id)
  if (resError) return { error: resError.message }

  if (currentRes.order_id) {
    await supabase
      .from('orders')
      .update({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone.replace(/\s/g, '') || null,
        notes: data.notes ?? null,
      })
      .eq('id', currentRes.order_id)
  }

  return { success: true }
}

export async function assignReservationToTable(reservationId: string, tableId: string) {
  const auth = await requireModuleAccess("reservations")
  if ("error" in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', tableId)
    .eq('status', 'active')
    .limit(1)

  if (activeOrders && activeOrders.length > 0) {
    return { error: 'Bu masada zaten aktif bir sipariş var.' }
  }

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .select('order_id')
    .eq('id', reservationId)
    .single()
  if (resError) return { error: resError.message }
  if (!reservation.order_id) return { error: 'Rezervasyona bağlı sipariş bulunamadı.' }

  const { error: orderError } = await supabase
    .from('orders')
    .update({ table_id: tableId, type: 'table' })
    .eq('id', reservation.order_id)
  if (orderError) return { error: orderError.message }

  const { error: resUpdateError } = await supabase
    .from('reservations')
    .update({ status: 'seated', table_id: tableId })
    .eq('id', reservationId)
  if (resUpdateError) return { error: resUpdateError.message }

  return { success: true }
}

export async function updateReservationStatus(
  reservationId: string,
  status: 'cancelled' | 'no_show' | 'completed'
) {
  const auth = await requireModuleAccess("reservations")
  if ("error" in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .select('order_id')
    .eq('id', reservationId)
    .single()
  if (resError) return { error: resError.message }

  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', reservationId)
  if (error) return { error: error.message }

  if (reservation.order_id) {
    const orderStatus = status === 'completed' ? 'completed' : status
    const update: { status: string; completed_at?: string; payment_status?: string } = { status: orderStatus }
    if (orderStatus === 'completed') {
      update.completed_at = new Date().toISOString()
      update.payment_status = 'paid'
    }
    await supabase.from('orders').update(update).eq('id', reservation.order_id)
  }

  return { success: true }
}

export async function completeReservationOrder(reservationId: string) {
  const auth = await requireModuleAccess("reservations")
  if ("error" in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .select('order_id')
    .eq('id', reservationId)
    .single()
  if (resError) return { error: resError.message }

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'completed' })
    .eq('id', reservationId)
  if (error) return { error: error.message }

  if (reservation.order_id) {
    await supabase
      .from('orders')
      .update({ status: 'completed', payment_status: 'paid', completed_at: new Date().toISOString() })
      .eq('id', reservation.order_id)
  }

  return { success: true }
}

