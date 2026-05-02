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

describe('kds/actions: markKdsGroupReady', () => {
  it('boş itemIds → erken success', async () => {
    const { markKdsGroupReady } = await import('@/app/[locale]/admin/kds/actions')
    const result = await markKdsGroupReady([])
    expect(result).toEqual({ success: true })
    expect(mockClient.mock.from).not.toHaveBeenCalled()
  })

  it('happy path: order_items kds_status=ready güncellenir', async () => {
    const { markKdsGroupReady } = await import('@/app/[locale]/admin/kds/actions')
    mockClient.fromChain.in.mockReturnValueOnce(
      Promise.resolve({ data: null, error: null }) as never,
    )
    const result = await markKdsGroupReady(['item-1', 'item-2'])
    expect(result).toEqual({ success: true })
    expect(mockClient.mock.from).toHaveBeenCalledWith('order_items')
    expect(mockClient.fromChain.update).toHaveBeenCalledWith({ kds_status: 'ready' })
    expect(mockClient.fromChain.in).toHaveBeenCalledWith('id', ['item-1', 'item-2'])
  })

  it('DB hatası error mesajını döner', async () => {
    const { markKdsGroupReady } = await import('@/app/[locale]/admin/kds/actions')
    mockClient.fromChain.in.mockReturnValueOnce(
      Promise.resolve({ data: null, error: { message: 'permission denied' } }) as never,
    )
    const result = await markKdsGroupReady(['item-1'])
    expect(result).toEqual({ error: 'permission denied' })
  })
})

describe('kds/actions: undoKdsGroupReady', () => {
  it('happy path: kds_status=pending geri alır', async () => {
    const { undoKdsGroupReady } = await import('@/app/[locale]/admin/kds/actions')
    mockClient.fromChain.in.mockReturnValueOnce(
      Promise.resolve({ data: null, error: null }) as never,
    )
    const result = await undoKdsGroupReady(['item-1'])
    expect(result).toEqual({ success: true })
    expect(mockClient.fromChain.update).toHaveBeenCalledWith({ kds_status: 'pending' })
  })

  it('boş itemIds → erken success, DB çağrılmaz', async () => {
    const { undoKdsGroupReady } = await import('@/app/[locale]/admin/kds/actions')
    const result = await undoKdsGroupReady([])
    expect(result).toEqual({ success: true })
    expect(mockClient.mock.from).not.toHaveBeenCalled()
  })
})
