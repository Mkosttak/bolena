import { createClient } from '@/lib/supabase/client'
import type { Reservation, ReservationStatus } from '@/types'

export const reservationsKeys = {
  all: ['reservations'] as const,
  list: (status?: ReservationStatus | 'active') =>
    [...reservationsKeys.all, 'list', status ?? 'all'] as const,
  detail: (id: string) => [...reservationsKeys.all, id] as const,
}

export interface ReservationWithOrder extends Reservation {
  orders?: {
    id: string
    type: string
    status: string
    table_id: string | null
    customer_name: string | null
    customer_phone: string | null
    customer_address: string | null
    platform: string | null
    notes: string | null
    subtotal: number
    discount_amount: number
    discount_type: string | null
    total_amount: number
    payment_status: string
    created_at: string
    updated_at: string
    completed_at: string | null
  } | null
}

export async function fetchReservations(
  status?: ReservationStatus | 'active'
): Promise<ReservationWithOrder[]> {
  const supabase = createClient()

  let query = supabase
    .from('reservations')
    .select('*, orders(*)')
    .order('created_at', { ascending: false })

  if (status === 'active') {
    query = query.in('status', ['pending', 'seated'])
  } else if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ReservationWithOrder[]
}

export async function fetchReservation(id: string): Promise<ReservationWithOrder | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('*, orders(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as unknown as ReservationWithOrder | null
}
