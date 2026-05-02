import { describe, it, expect } from 'vitest'
import {
  addOrderItemSchema,
  applyOrderDiscountSchema,
  addPaymentSchema,
  removeOrderItemSchema,
} from '@/lib/validations/order.schema'

describe('addOrderItemSchema', () => {
  const valid = {
    orderId: '11111111-1111-1111-1111-111111111111',
    productId: '22222222-2222-2222-2222-222222222222',
    productNameTr: 'Latte',
    productNameEn: 'Latte',
    unitPrice: 50,
    quantity: 2,
    notes: null,
    removedIngredients: [],
    selectedExtras: [],
    trackStock: true,
  }

  it('geçerli input\'u kabul eder', () => {
    expect(addOrderItemSchema.safeParse(valid).success).toBe(true)
  })

  it('quantity 0 reddeder (min 1)', () => {
    const r = addOrderItemSchema.safeParse({ ...valid, quantity: 0 })
    expect(r.success).toBe(false)
  })

  it('quantity 1000 reddeder (max 999)', () => {
    const r = addOrderItemSchema.safeParse({ ...valid, quantity: 1000 })
    expect(r.success).toBe(false)
  })

  it('negatif fiyat reddeder', () => {
    const r = addOrderItemSchema.safeParse({ ...valid, unitPrice: -5 })
    expect(r.success).toBe(false)
  })

  it('geçersiz UUID reddeder', () => {
    const r = addOrderItemSchema.safeParse({ ...valid, orderId: 'not-a-uuid' })
    expect(r.success).toBe(false)
  })
})

describe('applyOrderDiscountSchema', () => {
  it('null discountType kabul edilir', () => {
    const r = applyOrderDiscountSchema.safeParse({
      orderId: '11111111-1111-1111-1111-111111111111',
      discountAmount: 10,
      discountType: null,
    })
    expect(r.success).toBe(true)
  })

  it('Geçersiz discountType reddeder', () => {
    const r = applyOrderDiscountSchema.safeParse({
      orderId: '11111111-1111-1111-1111-111111111111',
      discountAmount: 10,
      discountType: 'invalid' as never,
    })
    expect(r.success).toBe(false)
  })
})

describe('addPaymentSchema', () => {
  it('Geçerli payment input', () => {
    const r = addPaymentSchema.safeParse({
      orderId: '11111111-1111-1111-1111-111111111111',
      method: 'cash',
      amount: 50,
    })
    expect(r.success).toBe(true)
  })

  it('Sıfır amount reddeder (positive)', () => {
    const r = addPaymentSchema.safeParse({
      orderId: '11111111-1111-1111-1111-111111111111',
      method: 'cash',
      amount: 0,
    })
    expect(r.success).toBe(false)
  })

  it('Geçersiz method reddeder', () => {
    const r = addPaymentSchema.safeParse({
      orderId: '11111111-1111-1111-1111-111111111111',
      method: 'bitcoin' as never,
      amount: 10,
    })
    expect(r.success).toBe(false)
  })
})

describe('removeOrderItemSchema', () => {
  it('Geçerli UUID\'leri kabul eder', () => {
    expect(
      removeOrderItemSchema.safeParse({
        itemId: '11111111-1111-1111-1111-111111111111',
        orderId: '22222222-2222-2222-2222-222222222222',
      }).success,
    ).toBe(true)
  })
})
