import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock } from '../helpers/supabase-mock'

const mockClient = createSupabaseMock()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockClient.client),
}))

beforeEach(() => {
  mockClient.reset?.()
  vi.clearAllMocks()
})

const validReservation = {
  type: 'reservation' as const,
  customer_name: 'Ali Veli',
  customer_phone: '05551234567',
  reservation_date: '2026-06-01',
  reservation_time: '19:30',
  party_size: 4,
  notes: '',
}

describe('reservations/actions: createReservation', () => {
  it('happy path: RPC başarılı, reservationId + orderId döner', async () => {
    const { createReservation } = await import('@/app/[locale]/admin/reservations/actions')
    mockClient.setNextRpcResult({
      data: [{ reservation_id: 'res-1', order_id: 'order-1' }],
      error: null,
    })
    const result = await createReservation(validReservation)
    expect(result).toEqual({ success: true, reservationId: 'res-1', orderId: 'order-1' })
    expect(mockClient.mock.rpc).toHaveBeenCalledWith(
      'create_reservation_with_order_atomic',
      expect.objectContaining({
        p_customer_name: 'Ali Veli',
        p_party_size: 4,
      }),
    )
  })

  it('Geçersiz telefon → Zod fail', async () => {
    const { createReservation } = await import('@/app/[locale]/admin/reservations/actions')
    const result = await createReservation({ ...validReservation, customer_phone: '123' })
    expect(result).toHaveProperty('error')
  })

  it('Rezervasyon türünde tarih boşsa Zod fail', async () => {
    const { createReservation } = await import('@/app/[locale]/admin/reservations/actions')
    const result = await createReservation({ ...validReservation, reservation_date: '' })
    expect(result).toHaveProperty('error')
  })

  it('takeaway türünde tarih/saat zorunlu değil', async () => {
    const { createReservation } = await import('@/app/[locale]/admin/reservations/actions')
    mockClient.setNextRpcResult({
      data: [{ reservation_id: 'res-2', order_id: 'order-2' }],
      error: null,
    })
    const result = await createReservation({
      ...validReservation,
      type: 'takeaway',
      reservation_date: '',
      reservation_time: '',
      party_size: undefined,
    })
    expect(result).toMatchObject({ success: true })
  })

  it('RPC null sonuç → "oluşturulamadı"', async () => {
    const { createReservation } = await import('@/app/[locale]/admin/reservations/actions')
    mockClient.setNextRpcResult({ data: [], error: null })
    const result = await createReservation(validReservation)
    expect(result).toEqual({ error: 'Rezervasyon oluşturulamadı' })
  })
})

describe('reservations/actions: assignReservationToTable', () => {
  it('Masada aktif sipariş varsa atama reddedilir', async () => {
    const { assignReservationToTable } = await import('@/app/[locale]/admin/reservations/actions')
    // 1. orders select - aktif var
    mockClient.fromChain.limit.mockReturnValueOnce(
      Promise.resolve({ data: [{ id: 'existing-order' }], error: null }) as never,
    )
    const result = await assignReservationToTable('res-1', 'table-1')
    expect(result).toEqual({ error: 'Bu masada zaten aktif bir sipariş var.' })
  })

  it('Rezervasyona bağlı sipariş yoksa hata', async () => {
    const { assignReservationToTable } = await import('@/app/[locale]/admin/reservations/actions')
    // 1. orders select boş
    mockClient.fromChain.limit.mockReturnValueOnce(
      Promise.resolve({ data: [], error: null }) as never,
    )
    // 2. reservation select - order_id null
    mockClient.setNextQueryResult({ data: { order_id: null }, error: null })
    const result = await assignReservationToTable('res-1', 'table-1')
    expect(result).toEqual({ error: 'Rezervasyona bağlı sipariş bulunamadı.' })
  })
})
