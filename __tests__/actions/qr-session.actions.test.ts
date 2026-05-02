import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock } from '../helpers/supabase-mock'

const mockClient = createSupabaseMock()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockClient.client),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ 'x-forwarded-for': '127.0.0.1' })),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

beforeEach(() => {
  mockClient.reset?.()
  vi.clearAllMocks()
})

// Zod 4 strict UUID — variant bit'i [89ab] olmalı, version bit'i [1-8].
const validToken = '8d52b8a0-3a3f-4f8e-9c8d-1a2b3c4d5e6f'
const validSession = '7b3e5f4a-2c1d-4a8f-b9e0-3f2a1b8c7d6e'
const validOrderId = '6c4d7e2f-9b1a-4f3c-a5d8-2e1f6b9c8d7a'

const validItem = {
  product: {
    id: '5a3b6c8d-1e2f-4d7c-9a8b-1c2d3e4f5a6b',
    name_tr: 'Latte',
    name_en: 'Latte',
    price: 50,
    campaign_price: null,
    track_stock: false,
  },
  selected_extras: [],
  removed_ingredients: [],
  quantity: 1,
  notes: '',
} as const

describe('qr/[session]/actions: submitQrOrder', () => {
  it('Eksik bilgi → error döner', async () => {
    const { submitQrOrder } = await import('@/app/qr/[token]/[session]/actions')
    const result = await submitQrOrder('', '', '', [])
    expect(result).toEqual({ success: false, error: 'Eksik sipariş bilgisi' })
  })

  it('Session bulunamazsa "Oturum bulunamadı" döner', async () => {
    const { submitQrOrder } = await import('@/app/qr/[token]/[session]/actions')
    mockClient.setNextRpcResult({ data: null, error: null })
    const result = await submitQrOrder(validToken, validSession, 'cid', [validItem as never])
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Oturum bulunamad/)
  })

  it('Session expired ise session_expired döner', async () => {
    const { submitQrOrder } = await import('@/app/qr/[token]/[session]/actions')
    mockClient.setNextRpcResult({
      data: [{ order_id: validOrderId, qr_token: validToken, order_status: 'completed' }],
      error: null,
    })
    const result = await submitQrOrder(validToken, validSession, 'cid', [validItem as never])
    expect(result).toEqual({ success: false, error: 'session_expired' })
  })

  it('Token uyumsuzsa "Geçersiz oturum" döner', async () => {
    const { submitQrOrder } = await import('@/app/qr/[token]/[session]/actions')
    mockClient.setNextRpcResult({
      data: [{ order_id: validOrderId, qr_token: 'baska-token', order_status: 'active' }],
      error: null,
    })
    const result = await submitQrOrder(validToken, validSession, 'cid', [validItem as never])
    expect(result).toEqual({ success: false, error: 'Geçersiz oturum.' })
  })

  it('Happy path: tüm item RPC çağrıları başarılı', async () => {
    const { submitQrOrder } = await import('@/app/qr/[token]/[session]/actions')
    // 1. session lookup
    mockClient.setNextRpcResult({
      data: [{ order_id: validOrderId, qr_token: validToken, order_status: 'active' }],
      error: null,
    })
    // 2. add_order_item_via_qr
    mockClient.setNextRpcResult({ data: null, error: null })
    const result = await submitQrOrder(validToken, validSession, 'cid', [validItem as never])
    expect(result).toEqual({ success: true })
  })
})

describe('qr/[session]/actions: rate limit', () => {
  it('11. istek limit aşımı sebebiyle reddedilir', async () => {
    const { submitQrOrder } = await import('@/app/qr/[token]/[session]/actions')
    // Aynı IP ve token için 10 başarılı istek + 1 limit aşımı
    for (let i = 0; i < 10; i++) {
      mockClient.setNextRpcResult({
        data: [{ order_id: validOrderId, qr_token: validToken, order_status: 'active' }],
        error: null,
      })
      mockClient.setNextRpcResult({ data: null, error: null })
      await submitQrOrder(validToken, `${validSession}-${i}`, 'cid', [validItem as never])
    }
    const result = await submitQrOrder(validToken, validSession, 'cid', [validItem as never])
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Çok fazla istek/)
  })
})
