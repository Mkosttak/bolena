import { describe, it, expect } from 'vitest'
import { categorySchema, productSchema, ingredientSchema } from '@/lib/validations/menu.schema'

// ─── categorySchema ───────────────────────────────────────────────────────────

describe('categorySchema', () => {
  it('geçerli kategori verisini kabul eder', () => {
    const result = categorySchema.safeParse({
      name_tr: 'Tatlılar',
      name_en: 'Desserts',
      sort_order: 1,
      is_active: true,
    })
    expect(result.success).toBe(true)
  })

  it('boş Türkçe ismi reddeder', () => {
    const result = categorySchema.safeParse({
      name_tr: '',
      name_en: 'Desserts',
    })
    expect(result.success).toBe(false)
    expect(result.success === false && result.error.issues[0].path).toContain('name_tr')
  })

  it('boş İngilizce ismi reddeder', () => {
    const result = categorySchema.safeParse({
      name_tr: 'Tatlılar',
      name_en: '',
    })
    expect(result.success).toBe(false)
    expect(result.success === false && result.error.issues[0].path).toContain('name_en')
  })

  it('sort_order varsayılan değer 0 olarak atar', () => {
    const result = categorySchema.safeParse({
      name_tr: 'Tatlılar',
      name_en: 'Desserts',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sort_order).toBe(0)
    }
  })

  it('negatif sort_order reddeder', () => {
    const result = categorySchema.safeParse({
      name_tr: 'Tatlılar',
      name_en: 'Desserts',
      sort_order: -1,
    })
    expect(result.success).toBe(false)
  })
})

// ─── ingredientSchema ─────────────────────────────────────────────────────────

describe('ingredientSchema', () => {
  it('geçerli içerik verisini kabul eder', () => {
    const result = ingredientSchema.safeParse({
      name_tr: 'Şeker',
      name_en: 'Sugar',
      is_removable: true,
    })
    expect(result.success).toBe(true)
  })

  it('boş içerik adını reddeder', () => {
    const result = ingredientSchema.safeParse({
      name_tr: '',
      name_en: 'Sugar',
    })
    expect(result.success).toBe(false)
  })

  it('is_removable varsayılan değer false olarak atar', () => {
    const result = ingredientSchema.safeParse({
      name_tr: 'Şeker',
      name_en: 'Sugar',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_removable).toBe(false)
    }
  })
})

// ─── productSchema ────────────────────────────────────────────────────────────

describe('productSchema', () => {
  const validProduct = {
    category_id: '11111111-1111-1111-1111-111111111111',
    name_tr: 'Cheesecake',
    name_en: 'Cheesecake',
    price: 85.0,
  }

  it('geçerli ürün verisini kabul eder', () => {
    const result = productSchema.safeParse(validProduct)
    expect(result.success).toBe(true)
  })

  it('boş ürün adını reddeder', () => {
    const result = productSchema.safeParse({ ...validProduct, name_tr: '' })
    expect(result.success).toBe(false)
  })

  it('negatif fiyatı reddeder', () => {
    const result = productSchema.safeParse({ ...validProduct, price: -10 })
    expect(result.success).toBe(false)
  })

  it('sıfır fiyatı reddeder', () => {
    const result = productSchema.safeParse({ ...validProduct, price: 0 })
    expect(result.success).toBe(false)
  })

  it('kategori seçilmemişse reddeder', () => {
    const result = productSchema.safeParse({ ...validProduct, category_id: '' })
    expect(result.success).toBe(false)
  })

  it('kampanya fiyatı normal fiyattan küçükse kabul eder', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      campaign_price: 70.0,
      campaign_end_date: '2026-12-31',
    })
    expect(result.success).toBe(true)
  })

  it('kampanya fiyatı var ama bitiş tarihi yoksa reddeder', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      campaign_price: 70.0,
      campaign_end_date: null,
    })
    expect(result.success).toBe(false)
  })

  it('kampanya bitiş tarihi var ama kampanya fiyatı yoksa reddeder', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      campaign_price: null,
      campaign_end_date: '2026-12-31',
    })
    expect(result.success).toBe(false)
  })

  it('kampanya fiyatı normal fiyata eşitse reddeder', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      campaign_price: 85.0,
      campaign_end_date: '2026-12-31',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const campaignPriceError = result.error.issues.find(
        (issue) => issue.path.includes('campaign_price')
      )
      expect(campaignPriceError).toBeDefined()
    }
  })

  it('kampanya fiyatı normal fiyattan büyükse reddeder', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      campaign_price: 100.0,
      campaign_end_date: '2026-12-31',
    })
    expect(result.success).toBe(false)
  })

  it('kampanya fiyatı null ise fiyat kıyaslaması yapılmaz', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      campaign_price: null,
    })
    expect(result.success).toBe(true)
  })

  it('is_available varsayılan değeri true olarak atar', () => {
    const result = productSchema.safeParse(validProduct)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_available).toBe(true)
    }
  })

  it('ingredients listesiyle birlikte kabul eder', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      ingredients: [
        { name_tr: 'Lor Peyniri', name_en: 'Cream Cheese', is_removable: false },
        { name_tr: 'Bisküvi', name_en: 'Biscuit', is_removable: true },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ingredients).toHaveLength(2)
    }
  })

  it('içindeki boş isimli ingredient reddeder', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      ingredients: [{ name_tr: '', name_en: 'Sugar' }],
    })
    expect(result.success).toBe(false)
  })

  it('stok takibi aktifken stock_count beklenir', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      track_stock: true,
      stock_count: 10,
    })
    expect(result.success).toBe(true)
  })
})
