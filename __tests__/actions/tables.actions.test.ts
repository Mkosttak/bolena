import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock } from '../helpers/supabase-mock'

const mockClient = createSupabaseMock()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockClient.client),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

beforeEach(() => {
  mockClient.reset?.()
  vi.clearAllMocks()
})

describe('tables/actions: createTableCategory', () => {
  it('happy path: kategori insert edilir', async () => {
    const { createTableCategory } = await import('@/app/[locale]/admin/tables/actions')
    mockClient.setNextQueryResult({ data: null, error: null })
    const result = await createTableCategory({ name: 'Bahçe', sort_order: 1 })
    expect(result).toEqual({ success: true })
    expect(mockClient.mock.from).toHaveBeenCalledWith('table_categories')
  })

  it('boş isim Zod tarafından reject edilir', async () => {
    const { createTableCategory } = await import('@/app/[locale]/admin/tables/actions')
    const result = await createTableCategory({ name: '', sort_order: 1 })
    expect(result).toHaveProperty('error')
  })
})

describe('tables/actions: deleteTableCategory', () => {
  it('Kategoride masa varsa silmez, hata döner', async () => {
    const { deleteTableCategory } = await import('@/app/[locale]/admin/tables/actions')
    // count check: head:true + count:'exact' chain
    mockClient.fromChain.eq.mockReturnValueOnce(
      Promise.resolve({ count: 3, error: null }) as never,
    )
    const result = await deleteTableCategory('cat-id')
    expect(result).toEqual({
      error: 'Bu kategoride masalar bulunduğu için silinemez. Önce masaların kategorisini değiştirin.',
    })
  })

  it('Kategoride masa yoksa silinir', async () => {
    const { deleteTableCategory } = await import('@/app/[locale]/admin/tables/actions')
    mockClient.fromChain.eq.mockReturnValueOnce(
      Promise.resolve({ count: 0, error: null }) as never,
    )
    mockClient.setNextQueryResult({ data: null, error: null })
    const result = await deleteTableCategory('cat-id')
    expect(result).toEqual({ success: true })
  })
})

describe('tables/actions: deleteTable', () => {
  it('Aktif siparişi olan masa silinemez', async () => {
    const { deleteTable } = await import('@/app/[locale]/admin/tables/actions')
    mockClient.fromChain.limit.mockReturnValueOnce(
      Promise.resolve({ data: [{ id: 'order-1' }], error: null }) as never,
    )
    const result = await deleteTable('table-id')
    expect(result).toEqual({ error: 'Bu masada aktif sipariş var. Önce siparişi kapatın.' })
  })

  it('Aktif sipariş yoksa soft delete (is_active: false)', async () => {
    const { deleteTable } = await import('@/app/[locale]/admin/tables/actions')
    mockClient.fromChain.limit.mockReturnValueOnce(
      Promise.resolve({ data: [], error: null }) as never,
    )
    mockClient.setNextQueryResult({ data: null, error: null })
    const result = await deleteTable('table-id')
    expect(result).toEqual({ success: true })
  })
})

describe('tables/actions: getOrCreateTableOrder', () => {
  it('happy path: orderId döner', async () => {
    const { getOrCreateTableOrder } = await import('@/app/[locale]/admin/tables/actions')
    mockClient.setNextRpcResult({ data: 'new-order-id', error: null })
    const result = await getOrCreateTableOrder('table-id')
    expect(result).toEqual({ orderId: 'new-order-id' })
    expect(mockClient.mock.rpc).toHaveBeenCalledWith('get_or_create_table_order_atomic', {
      p_table_id: 'table-id',
    })
  })

  it('RPC null dönerse hata', async () => {
    const { getOrCreateTableOrder } = await import('@/app/[locale]/admin/tables/actions')
    mockClient.setNextRpcResult({ data: null, error: null })
    const result = await getOrCreateTableOrder('table-id')
    expect(result).toEqual({ error: 'Sipariş oluşturulamadı' })
  })

  it('RPC hatası error mesajını döner', async () => {
    const { getOrCreateTableOrder } = await import('@/app/[locale]/admin/tables/actions')
    mockClient.setNextRpcResult({ data: null, error: { message: 'RLS denied' } })
    const result = await getOrCreateTableOrder('table-id')
    expect(result).toEqual({ error: 'RLS denied' })
  })
})

describe('tables/actions: transferTableOrder', () => {
  it('happy path: revalidatePath çağrılır', async () => {
    const { transferTableOrder } = await import('@/app/[locale]/admin/tables/actions')
    const { revalidatePath } = await import('next/cache')
    mockClient.setNextRpcResult({ data: null, error: null })
    const result = await transferTableOrder('source', 'target')
    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalled()
  })
})

describe('tables/actions: regenerateQrTokenAction', () => {
  it('happy path: yeni token döner', async () => {
    const { regenerateQrTokenAction } = await import('@/app/[locale]/admin/tables/actions')
    mockClient.setNextRpcResult({ data: 'new-token-abc123', error: null })
    const result = await regenerateQrTokenAction('table-id')
    expect(result).toEqual({ success: true, newToken: 'new-token-abc123' })
  })
})
