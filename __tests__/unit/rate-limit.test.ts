import { describe, it, expect } from 'vitest'
import { checkRateLimit, getClientIdentifier, rateLimits } from '@/lib/rate-limit'

describe('checkRateLimit', () => {
  it('limit altında success: true döner', async () => {
    const cfg = { name: `test-${Math.random()}`, limit: 3, windowSeconds: 60 }
    const r1 = await checkRateLimit('ip-A', cfg)
    expect(r1.success).toBe(true)
    expect(r1.remaining).toBe(2)
  })

  it('limit aşımında success: false ve retryAfter pozitif', async () => {
    const cfg = { name: `test-${Math.random()}`, limit: 2, windowSeconds: 60 }
    await checkRateLimit('ip-B', cfg)
    await checkRateLimit('ip-B', cfg)
    const r3 = await checkRateLimit('ip-B', cfg)
    expect(r3.success).toBe(false)
    expect(r3.retryAfterSeconds).toBeGreaterThan(0)
    expect(r3.remaining).toBe(0)
  })

  it('Farklı identifier\'lar bağımsız sayılır', async () => {
    const cfg = { name: `test-${Math.random()}`, limit: 1, windowSeconds: 60 }
    const a = await checkRateLimit('ip-X', cfg)
    const b = await checkRateLimit('ip-Y', cfg)
    expect(a.success).toBe(true)
    expect(b.success).toBe(true)
  })

  it('Pencere bittikten sonra sayaç sıfırlanır', async () => {
    const cfg = { name: `test-${Math.random()}`, limit: 1, windowSeconds: 0.001 } // 1ms
    const r1 = await checkRateLimit('ip-Z', cfg)
    expect(r1.success).toBe(true)
    await new Promise((res) => setTimeout(res, 5))
    const r2 = await checkRateLimit('ip-Z', cfg)
    expect(r2.success).toBe(true)
  })
})

describe('getClientIdentifier', () => {
  it('x-forwarded-for ilk IP', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' })
    expect(getClientIdentifier(headers)).toBe('203.0.113.1')
  })

  it('x-real-ip fallback', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.1' })
    expect(getClientIdentifier(headers)).toBe('198.51.100.1')
  })

  it('Hiçbir başlık yoksa "unknown"', () => {
    expect(getClientIdentifier(new Headers())).toBe('unknown')
  })
})

describe('rateLimits presetler', () => {
  it('auth/qrOrder/contact preset\'leri tanımlı', () => {
    expect(rateLimits.auth.limit).toBe(5)
    expect(rateLimits.qrOrder.limit).toBe(10)
    expect(rateLimits.contact.limit).toBe(3)
  })
})
