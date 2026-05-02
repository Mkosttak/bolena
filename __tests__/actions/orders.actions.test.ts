import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock } from '../helpers/supabase-mock'

const mockClient = createSupabaseMock()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockClient.client),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

beforeEach(() => {
  mockClient.reset?.()
  vi.clearAllMocks()
})

const baseAddItemInput = {
  orderId: '11111111-1111-1111-1111-111111111111',
  productId: '22222222-2222-2222-2222-222222222222',
  productNameTr: 'Test Ürün',
  productNameEn: 'Test Product',
  unitPrice: 50,
  quantity: 2,
  notes: null,
  removedIngredients: [],
  selectedExtras: [],
  trackStock: true,
}

describe('orders/actions: addOrderItem', () => {
  it('happy path: RPC başarıyla döndüğünde { success: true } döner', async () => {
    const { addOrderItem } = await import('@/app/[locale]/admin/orders/actions')
    mockClient.setNextRpcResult({ data: null, error: null })
    const result = await addOrderItem(baseAddItemInput)
    expect(result).toEqual({ success: true })
    expect(mockClient.mock.rpc).toHaveBeenCalledWith(
      'add_order_item_atomic',
      expect.objectContaining({
        p_order_id: baseAddItemInput.orderId,
        p_quantity: 2,
        p_unit_price: 50,
        p_total_price: 100,
      }),
    )
  })

  it('extras eklendiğinde total fiyata yansır', async () => {
    const { addOrderItem } = await import('@/app/[locale]/admin/orders/actions')
    mockClient.setNextRpcResult({ data: null, error: null })
    await addOrderItem({
      ...baseAddItemInput,
      selectedExtras: [
        {
          group_id: '33333333-3333-3333-3333-333333333333',
          group_name_tr: 'Boyut',
          option_id: '44444444-4444-4444-4444-444444444444',
          option_name_tr: 'Büyük',
          option_name_en: 'Large',
          price: 10,
        },
      ],
    })
    // (50 + 10) * 2 = 120
    expect(mockClient.mock.rpc).toHaveBeenCalledWith(
      'add_order_item_atomic',
      expect.objectContaining({ p_total_price: 120 }),
    )
  })

  it('stok yetersiz hatası kullanıcı dostu Türkçe mesaja dönüşür', async () => {
    const { addOrderItem } = await import('@/app/[locale]/admin/orders/actions')
    mockClient.setNextRpcResult({
      data: null,
      error: { message: 'Available: 3, Requested: 5' },
    })
    const result = await addOrderItem(baseAddItemInput)
    expect(result).toEqual({ error: 'Yetersiz stok. Bu üründen en fazla 3 adet ekleyebilirsiniz.' })
  })

  it('Insufficient stock generic mesajı yakalar', async () => {
    const { addOrderItem } = await import('@/app/[locale]/admin/orders/actions')
    mockClient.setNextRpcResult({
      data: null,
      error: { message: 'Insufficient stock for product' },
    })
    const result = await addOrderItem(baseAddItemInput)
    expect(result).toEqual({ error: 'Bu ürün için yeterli stok bulunmuyor.' })
  })
})

describe('orders/actions: removeOrderItem', () => {
  it('happy path: RPC başarıyla çağrılır', async () => {
    const { removeOrderItem } = await import('@/app/[locale]/admin/orders/actions')
    mockClient.setNextRpcResult({ data: null, error: null })
    const result = await removeOrderItem('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
    expect(result).toEqual({ success: true })
    expect(mockClient.mock.rpc).toHaveBeenCalledWith('remove_order_item_atomic', {
      p_item_id: '22222222-2222-2222-2222-222222222222',
      p_order_id: '11111111-1111-1111-1111-111111111111',
    })
  })

  it('RPC hatası error mesajını döner', async () => {
    const { removeOrderItem } = await import('@/app/[locale]/admin/orders/actions')
    mockClient.setNextRpcResult({ data: null, error: { message: 'not found' } })
    const result = await removeOrderItem('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
    expect(result).toEqual({ error: 'not found' })
  })
})

describe('orders/actions: closeOrder', () => {
  it('happy path: aktif order kapatılır', async () => {
    const { closeOrder } = await import('@/app/[locale]/admin/orders/actions')
    // closeOrder .update().eq().eq().select().maybeSingle() — race guard ile
    mockClient.setNextQueryResult({ data: { id: 'order-1' }, error: null })
    const result = await closeOrder('11111111-1111-1111-1111-111111111111')
    expect(result).toEqual({ success: true })
    expect(mockClient.mock.from).toHaveBeenCalledWith('orders')
  })

  it('Race guard: zaten kapatılmış order için idempotent başarı', async () => {
    const { closeOrder } = await import('@/app/[locale]/admin/orders/actions')
    // .maybeSingle() null döner → updated yok → alreadyClosed
    mockClient.setNextQueryResult({ data: null, error: null })
    const result = await closeOrder('11111111-1111-1111-1111-111111111111')
    expect(result).toEqual({ success: true, alreadyClosed: true })
  })
})

describe('orders/actions: addPayment', () => {
  const orderId = '11111111-1111-1111-1111-111111111111'

  it('happy path: yarısı ödenmiş → partial status', async () => {
    const { addPayment } = await import('@/app/[locale]/admin/orders/actions')
    // Yeni akış: 1) idempotency dedupe check (maybeSingle), 2) insert+select+single, 3) select payments (then), 4) select order (single), 5) update (then)
    mockClient.queueResults({
      maybeSingle: [{ data: null, error: null }],   // dedupe: yok
      single: [
        { data: { id: 'pay-1' }, error: null },
        { data: { total_amount: 100, payment_status: 'pending' }, error: null },
      ],
      then: [
        { data: [{ amount: 50 }], error: null },
        { data: null, error: null },
      ],
    })
    const result = await addPayment(orderId, 'cash', 50)
    expect(result).toMatchObject({ success: true, paymentStatus: 'partial' })
  })

  it('Tam ödeme → paid status', async () => {
    const { addPayment } = await import('@/app/[locale]/admin/orders/actions')
    mockClient.queueResults({
      maybeSingle: [{ data: null, error: null }],
      single: [
        { data: { id: 'pay-2' }, error: null },
        { data: { total_amount: 100, payment_status: 'pending' }, error: null },
      ],
      then: [
        { data: [{ amount: 100 }], error: null },
        { data: null, error: null },
      ],
    })
    const result = await addPayment(orderId, 'card', 100)
    expect(result).toMatchObject({ success: true, paymentStatus: 'paid' })
  })

  it('Insert hatası → error döner', async () => {
    const { addPayment } = await import('@/app/[locale]/admin/orders/actions')
    mockClient.queueResults({
      maybeSingle: [{ data: null, error: null }],
      single: [{ data: null, error: { message: 'permission denied' } }],
    })
    const result = await addPayment(orderId, 'cash', 50)
    expect(result).toEqual({ error: 'permission denied' })
  })

  it('Idempotency: aynı key ile ikinci çağrı dedupe edilir', async () => {
    const { addPayment } = await import('@/app/[locale]/admin/orders/actions')
    mockClient.queueResults({
      maybeSingle: [{ data: { id: 'existing-pay', order_id: orderId }, error: null }],
      single: [{ data: { payment_status: 'partial' }, error: null }],
    })
    const result = await addPayment(orderId, 'cash', 50, undefined, '55555555-5555-5555-5555-555555555555')
    expect(result).toMatchObject({ success: true, deduped: true })
  })
})
