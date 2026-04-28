import { describe, it, expect } from 'vitest'
import { extraGroupSchema, extraOptionSchema } from '@/lib/validations/extras.schema'

describe('extraGroupSchema', () => {
  it('geçerli grup verisini kabul eder', () => {
    const result = extraGroupSchema.safeParse({
      name_tr: 'Köfte Seçimi',
      name_en: 'Patty Choice',
      is_required: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name_tr).toBe('Köfte Seçimi')
      expect(result.data.is_required).toBe(true)
    }
  })

  it('is_required varsayılan değeri false olmalı', () => {
    const result = extraGroupSchema.safeParse({
      name_tr: 'Şeker',
      name_en: 'Sugar',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_required).toBe(false)
    }
  })

  it('boş Türkçe ismi reddeder', () => {
    const result = extraGroupSchema.safeParse({
      name_tr: '',
      name_en: 'Sugar',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name_tr')
    }
  })

  it('boş İngilizce ismi reddeder', () => {
    const result = extraGroupSchema.safeParse({
      name_tr: 'Şeker',
      name_en: '',
    })
    expect(result.success).toBe(false)
  })

  it('her iki isim de dolu olunca geçer', () => {
    const result = extraGroupSchema.safeParse({
      name_tr: 'Ekstra Sos',
      name_en: 'Extra Sauce',
      is_required: false,
    })
    expect(result.success).toBe(true)
  })
})

describe('extraOptionSchema', () => {
  it('geçerli seçenek verisini kabul eder', () => {
    const result = extraOptionSchema.safeParse({
      name_tr: 'Dana Köfte',
      name_en: 'Beef Patty',
      price: 15.0,
      max_selections: 1,
      is_active: true,
      sort_order: 0,
    })
    expect(result.success).toBe(true)
  })

  it('fiyat 0 ise ücretsiz seçenek geçerli', () => {
    const result = extraOptionSchema.safeParse({
      name_tr: 'Ketçap',
      name_en: 'Ketchup',
      price: 0,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(0)
    }
  })

  it('negatif fiyatı reddeder', () => {
    const result = extraOptionSchema.safeParse({
      name_tr: 'Test',
      name_en: 'Test',
      price: -5,
    })
    expect(result.success).toBe(false)
  })

  it('max_selections 0 veya negatif ise reddeder', () => {
    const result = extraOptionSchema.safeParse({
      name_tr: 'Test',
      name_en: 'Test',
      price: 0,
      max_selections: 0,
    })
    expect(result.success).toBe(false)
  })

  it('varsayılan değerleri doğru atar', () => {
    const result = extraOptionSchema.safeParse({
      name_tr: 'Seçenek',
      name_en: 'Option',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(0)
      expect(result.data.max_selections).toBe(1)
      expect(result.data.is_active).toBe(true)
      expect(result.data.sort_order).toBe(0)
    }
  })

  it('boş Türkçe ismi reddeder', () => {
    const result = extraOptionSchema.safeParse({
      name_tr: '',
      name_en: 'Option',
    })
    expect(result.success).toBe(false)
  })

  it('boş İngilizce ismi reddeder', () => {
    const result = extraOptionSchema.safeParse({
      name_tr: 'Seçenek',
      name_en: '',
    })
    expect(result.success).toBe(false)
  })

  it('max_selections 2 ve üzerini kabul eder', () => {
    const result = extraOptionSchema.safeParse({
      name_tr: 'Test',
      name_en: 'Test',
      price: 5,
      max_selections: 3,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.max_selections).toBe(3)
    }
  })
})
