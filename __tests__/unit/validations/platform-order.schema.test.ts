import { describe, it, expect } from 'vitest'
import { platformOrderSchema } from '@/lib/validations/platform-order.schema'

const VALID_INPUT = {
  platform: 'yemeksepeti' as const,
  customer_name: 'Ahmet Yılmaz',
  customer_phone: '05001234567',
  customer_address: 'Kadıköy, İstanbul',
  notes: 'Zile basmayın',
}

describe('platformOrderSchema', () => {
  // ── Geçerli veri ────────────────────────────────────────────────────────────

  it('geçerli yemeksepeti siparişini kabul eder', () => {
    const result = platformOrderSchema.safeParse(VALID_INPUT)
    expect(result.success).toBe(true)
  })

  it('tüm platform değerlerini kabul eder', () => {
    const platforms = ['yemeksepeti', 'getir', 'trendyol', 'courier'] as const
    for (const platform of platforms) {
      const result = platformOrderSchema.safeParse({ ...VALID_INPUT, platform })
      expect(result.success).toBe(true)
    }
  })

  it('notlar alanı opsiyoneldir', () => {
    const { notes: _, ...withoutNotes } = VALID_INPUT
    const result = platformOrderSchema.safeParse(withoutNotes)
    expect(result.success).toBe(true)
  })

  it('notlar boş string geçebilir', () => {
    const result = platformOrderSchema.safeParse({ ...VALID_INPUT, notes: '' })
    expect(result.success).toBe(true)
  })

  it('telefon ve adres boşken müşteri adı yeterlidir', () => {
    const result = platformOrderSchema.safeParse({
      ...VALID_INPUT,
      customer_phone: '',
      customer_address: '',
    })
    expect(result.success).toBe(true)
  })

  // ── Platform doğrulama ───────────────────────────────────────────────────────

  it('geçersiz platform değerini reddeder', () => {
    const result = platformOrderSchema.safeParse({ ...VALID_INPUT, platform: 'bitigiyemek' })
    expect(result.success).toBe(false)
  })

  it('platform eksikse reddeder', () => {
    const { platform: _, ...withoutPlatform } = VALID_INPUT
    const result = platformOrderSchema.safeParse(withoutPlatform)
    expect(result.success).toBe(false)
  })

  // ── Müşteri adı ──────────────────────────────────────────────────────────────

  it('1 karakterli müşteri adını reddeder', () => {
    const result = platformOrderSchema.safeParse({ ...VALID_INPUT, customer_name: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('customer_name')
    }
  })

  it('boş müşteri adını reddeder', () => {
    const result = platformOrderSchema.safeParse({ ...VALID_INPUT, customer_name: '' })
    expect(result.success).toBe(false)
  })

  // ── Telefon ──────────────────────────────────────────────────────────────────

  it('eksik veya hatalı haneli telefonu reddeder', () => {
    const result = platformOrderSchema.safeParse({ ...VALID_INPUT, customer_phone: '050012345' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('customer_phone')
    }
  })

  it('11 haneli geçerli telefonu kabul eder', () => {
    const result = platformOrderSchema.safeParse({ ...VALID_INPUT, customer_phone: '05001234567' })
    expect(result.success).toBe(true)
  })

  // ── Adres ───────────────────────────────────────────────────────────────────

  it('doldurulduğunda 4 karakterden kısa adresi reddeder', () => {
    const result = platformOrderSchema.safeParse({ ...VALID_INPUT, customer_address: 'Cad.' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('customer_address')
    }
  })

  it('5+ karakterli adresi kabul eder', () => {
    const result = platformOrderSchema.safeParse({ ...VALID_INPUT, customer_address: 'Cad. 5' })
    expect(result.success).toBe(true)
  })
})
