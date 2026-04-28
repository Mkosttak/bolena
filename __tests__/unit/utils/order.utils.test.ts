import { describe, it, expect } from 'vitest'
import {
  calculateEffectivePrice,
  calculateSubtotal,
  applyDiscount,
  calculateRemaining,
  calculatePaid,
  applyRadioOptionSelection,
  resolveActiveCampaign,
  applyGlobalCampaignDiscount,
  calculateFinalPrice,
} from '@/lib/utils/order.utils'
import type { OrderItem, MenuCampaign, Payment, Product } from '@/types'

const TODAY = new Date()
const YESTERDAY = new Date(TODAY)
YESTERDAY.setDate(YESTERDAY.getDate() - 1)
const TOMORROW = new Date(TODAY)
TOMORROW.setDate(TOMORROW.getDate() + 1)

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    category_id: 'cat-1',
    name_tr: 'Test Ürün',
    name_en: 'Test Product',
    description_tr: null,
    description_en: null,
    image_url: null,
    price: 100,
    campaign_price: null,
    campaign_end_date: null,
    allergens_tr: null,
    allergens_en: null,
    is_available: true,
    is_featured: false,
    is_visible: true,
    track_stock: false,
    stock_count: null,
    sort_order: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function makeOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 'i1',
    order_id: 'o1',
    product_id: 'p1',
    product_name_tr: 'Ürün',
    product_name_en: 'Product',
    unit_price: 100,
    quantity: 1,
    notes: null,
    removed_ingredients: [],
    selected_extras: [],
    total_price: 100,
    is_complimentary: false,
    kds_status: 'pending',
    created_at: '',
    ...overrides,
  }
}

function makePayment(amount: number): Payment {
  return {
    id: 'pay1',
    order_id: 'o1',
    amount,
    method: 'cash',
    note: null,
    created_at: '',
  }
}

describe('calculateEffectivePrice', () => {
  it('kampanya yoksa normal fiyatı döner', () => {
    const p = makeProduct({ price: 100 })
    expect(calculateEffectivePrice(p)).toBe(100)
  })

  it('kampanya bitiş tarihi geçmemişse kampanya fiyatını döner', () => {
    const p = makeProduct({
      price: 100,
      campaign_price: 75,
      campaign_end_date: TOMORROW.toISOString().slice(0, 10),
    })
    expect(calculateEffectivePrice(p)).toBe(75)
  })

  it('kampanya bitiş tarihi geçmişse normal fiyatı döner', () => {
    const p = makeProduct({
      price: 100,
      campaign_price: 75,
      campaign_end_date: YESTERDAY.toISOString().slice(0, 10),
    })
    expect(calculateEffectivePrice(p)).toBe(100)
  })

  it('campaign_end_date null ise normal fiyat döner', () => {
    const p = makeProduct({ price: 100, campaign_price: 75, campaign_end_date: null })
    expect(calculateEffectivePrice(p)).toBe(100)
  })
})

describe('calculateSubtotal', () => {
  it('normal kalemlerin toplamını hesaplar', () => {
    const items = [
      makeOrderItem({ total_price: 100 }),
      makeOrderItem({ id: 'i2', total_price: 50 }),
    ]
    expect(calculateSubtotal(items)).toBe(150)
  })

  it('ikram kalemleri toplama dahil etmez', () => {
    const items = [
      makeOrderItem({ total_price: 100 }),
      makeOrderItem({ id: 'i2', total_price: 50, is_complimentary: true }),
    ]
    expect(calculateSubtotal(items)).toBe(100)
  })

  it('boş liste 0 döner', () => {
    expect(calculateSubtotal([])).toBe(0)
  })
})

describe('applyDiscount', () => {
  it('indirim tipi null ise tutarı değiştirmez', () => {
    expect(applyDiscount(200, 20, null)).toBe(200)
  })

  it('tutar indirimi doğru uygulanır', () => {
    expect(applyDiscount(200, 50, 'amount')).toBe(150)
  })

  it('yüzde indirimi doğru uygulanır', () => {
    expect(applyDiscount(200, 10, 'percent')).toBe(180)
  })

  it('indirim toplam tutarı aşamaz (0\'ın altına inmez)', () => {
    expect(applyDiscount(100, 200, 'amount')).toBe(0)
  })

  it('yüzde 100 indirim tutarı sıfırlar', () => {
    expect(applyDiscount(100, 100, 'percent')).toBe(0)
  })

  it('indirim miktarı 0 ise değişmez', () => {
    expect(applyDiscount(200, 0, 'amount')).toBe(200)
  })
})

describe('calculateRemaining', () => {
  it('ödenmemiş kalan tutarı hesaplar', () => {
    expect(calculateRemaining(100, [makePayment(40), makePayment(30)])).toBe(30)
  })

  it('tam ödenince 0 döner', () => {
    expect(calculateRemaining(100, [makePayment(100)])).toBe(0)
  })

  it('fazla ödeme varsa 0 döner (negatife düşmez)', () => {
    expect(calculateRemaining(100, [makePayment(150)])).toBe(0)
  })

  it('hiç ödeme yoksa toplam tutarı döner', () => {
    expect(calculateRemaining(100, [])).toBe(100)
  })
})

describe('calculatePaid', () => {
  it('tüm ödemelerin toplamını hesaplar', () => {
    expect(calculatePaid([makePayment(40), makePayment(60)])).toBe(100)
  })

  it('ödeme yoksa 0 döner', () => {
    expect(calculatePaid([])).toBe(0)
  })
})

// ─── applyRadioOptionSelection ───────────────────────────────────────────────

describe('applyRadioOptionSelection', () => {
  const optionIds = ['opt-a', 'opt-b', 'opt-c']

  it('boş haritada seçilen seçenek 1 olur', () => {
    const result = applyRadioOptionSelection(optionIds, 'opt-a', {})
    expect(result['opt-a']).toBe(1)
    expect(result['opt-b'] ?? 0).toBe(0)
    expect(result['opt-c'] ?? 0).toBe(0)
  })

  it('başka seçenek varken yeni seçim onu sıfırlar', () => {
    const prev = { 'opt-a': 1, 'opt-b': 0, 'opt-c': 0 }
    const result = applyRadioOptionSelection(optionIds, 'opt-b', prev)
    expect(result['opt-a']).toBe(0)
    expect(result['opt-b']).toBe(1)
    expect(result['opt-c']).toBe(0)
  })

  it('zaten seçili seçenek tıklanırsa aynı referans döner (değişiklik yok)', () => {
    const prev = { 'opt-a': 1, 'opt-b': 0, 'opt-c': 0 }
    const result = applyRadioOptionSelection(optionIds, 'opt-a', prev)
    expect(result).toBe(prev)
  })

  it('orijinal nesneyi mutate etmez', () => {
    const prev = { 'opt-a': 0, 'opt-b': 1, 'opt-c': 0 }
    applyRadioOptionSelection(optionIds, 'opt-a', prev)
    expect(prev['opt-b']).toBe(1)
  })

  it('grup dışı seçeneklerin değerlerini korur', () => {
    const prev = { 'opt-a': 0, 'opt-b': 0, 'opt-c': 0, 'other-group-opt': 2 }
    const result = applyRadioOptionSelection(optionIds, 'opt-c', prev)
    expect(result['opt-c']).toBe(1)
    expect(result['other-group-opt']).toBe(2)
  })

  it('ardışık seçimlerde yalnızca son seçenek aktif kalır', () => {
    const step1 = applyRadioOptionSelection(optionIds, 'opt-a', {})
    const step2 = applyRadioOptionSelection(optionIds, 'opt-b', step1)
    const step3 = applyRadioOptionSelection(optionIds, 'opt-c', step2)
    const selected = optionIds.filter((id) => (step3[id] ?? 0) > 0)
    expect(selected).toHaveLength(1)
    expect(selected[0]).toBe('opt-c')
  })

  it('tek seçenekli grupta seçim doğru çalışır', () => {
    const result = applyRadioOptionSelection(['solo'], 'solo', {})
    expect(result['solo']).toBe(1)
  })
})

// ─── Global Kampanya Fonksiyonları ───────────────────────────────────────────

const TODAY_STR = new Date().toISOString().slice(0, 10)
const TOMORROW_STR = (() => {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10)
})()

function makeCampaign(overrides: Partial<MenuCampaign> = {}): MenuCampaign {
  return {
    id: 'camp1',
    name_tr: 'Test Kampanya',
    name_en: 'Test Campaign',
    description_tr: null,
    description_en: null,
    price_basis: 'effective',
    discount_percent: 10,
    max_discount_amount: null,
    start_date: TODAY_STR,
    end_date: TOMORROW_STR,
    active_days: [0, 1, 2, 3, 4, 5, 6], // tüm günler
    start_time: null,
    end_time: null,
    is_active: true,
    priority: 0,
    notes: null,
    applies_to_category_ids: null,
    applies_to_product_ids: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('resolveActiveCampaign', () => {
  it('boş liste için null döner', () => {
    expect(resolveActiveCampaign([])).toBeNull()
  })

  it('tüm günler aktif kampanyayı döner', () => {
    const camp = makeCampaign()
    expect(resolveActiveCampaign([camp])).toBe(camp)
  })

  it('bugünün günü aktif_days içinde değilse null döner', () => {
    const today = new Date().getDay()
    // Bugün hariç diğer günler
    const otherDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== today)
    const camp = makeCampaign({ active_days: otherDays })
    expect(resolveActiveCampaign([camp])).toBeNull()
  })

  it('birden fazla kampanyadan priority yüksek olanı döner (liste zaten sıralı gelir)', () => {
    const low = makeCampaign({ id: 'c1', priority: 0, discount_percent: 5 })
    const high = makeCampaign({ id: 'c2', priority: 10, discount_percent: 20 })
    // priority DESC sıralı liste (fetchActiveCampaigns gibi)
    expect(resolveActiveCampaign([high, low])).toBe(high)
  })

  it('saat penceresi dışındaki kampanyayı atlar', () => {
    const now = new Date()
    // Şu andan 2 saat sonrasına başlayan kampanya
    const futureHour = (now.getHours() + 2) % 24
    const startTime = `${String(futureHour).padStart(2, '0')}:00`
    const endTime = `${String((futureHour + 1) % 24).padStart(2, '0')}:00`
    const camp = makeCampaign({ start_time: startTime, end_time: endTime })
    expect(resolveActiveCampaign([camp])).toBeNull()
  })
})

describe('applyGlobalCampaignDiscount', () => {
  it('price_basis=effective → effective fiyat üzerinden indirim yapar', () => {
    const product = makeProduct({ price: 100, campaign_price: 80, campaign_end_date: TOMORROW_STR })
    const camp = makeCampaign({ price_basis: 'effective', discount_percent: 10 })
    // effective = 80, %10 indirim → 72
    expect(applyGlobalCampaignDiscount(product, camp)).toBeCloseTo(72)
  })

  it('price_basis=base → orijinal fiyat üzerinden indirim yapar', () => {
    const product = makeProduct({ price: 100, campaign_price: 80, campaign_end_date: TOMORROW_STR })
    const camp = makeCampaign({ price_basis: 'base', discount_percent: 10 })
    // base = 100, %10 indirim → 90
    expect(applyGlobalCampaignDiscount(product, camp)).toBeCloseTo(90)
  })

  it('max_discount_amount indirimi sınırlandırır', () => {
    const product = makeProduct({ price: 200 })
    const camp = makeCampaign({ price_basis: 'base', discount_percent: 50, max_discount_amount: 30 })
    // %50 = 100₺ indirim ama tavan 30₺ → 200 - 30 = 170
    expect(applyGlobalCampaignDiscount(product, camp)).toBeCloseTo(170)
  })

  it('kampanya yoksa calculateEffectivePrice sonucunu döner', () => {
    const product = makeProduct({ price: 100 })
    expect(calculateFinalPrice(product, [])).toBe(100)
  })

  it('indirim sonucu 0\'ın altına inmez', () => {
    const product = makeProduct({ price: 10 })
    const camp = makeCampaign({ price_basis: 'base', discount_percent: 100 })
    expect(applyGlobalCampaignDiscount(product, camp)).toBeGreaterThanOrEqual(0)
  })
})

describe('calculateFinalPrice', () => {
  it('kampanya yoksa calculateEffectivePrice döner', () => {
    const product = makeProduct({ price: 100, campaign_price: 80, campaign_end_date: TOMORROW_STR })
    expect(calculateFinalPrice(product, [])).toBe(80)
  })

  it('aktif kampanya varsa global indirim uygulanır', () => {
    const product = makeProduct({ price: 100 })
    const camp = makeCampaign({ price_basis: 'base', discount_percent: 20 })
    expect(calculateFinalPrice(product, [camp])).toBeCloseTo(80)
  })

  it('kategori kısıtlaması: ürün doğru kategorideyse indirim uygulanır', () => {
    const product = makeProduct({ id: 'prod-1', category_id: 'cat-A', price: 100 })
    const camp = makeCampaign({ price_basis: 'base', discount_percent: 10, applies_to_category_ids: ['cat-A', 'cat-B'] })
    expect(calculateFinalPrice(product, [camp])).toBeCloseTo(90)
  })

  it('kategori kısıtlaması: ürün farklı kategorideyse indirim uygulanmaz', () => {
    const product = makeProduct({ id: 'prod-1', category_id: 'cat-X', price: 100 })
    const camp = makeCampaign({ price_basis: 'base', discount_percent: 10, applies_to_category_ids: ['cat-A', 'cat-B'] })
    expect(calculateFinalPrice(product, [camp])).toBe(100)
  })

  it('ürün kısıtlaması: hedef listede ise indirim uygulanır', () => {
    const product = makeProduct({ id: 'prod-1', category_id: 'cat-1', price: 200 })
    const camp = makeCampaign({ price_basis: 'base', discount_percent: 25, applies_to_product_ids: ['prod-1', 'prod-2'] })
    expect(calculateFinalPrice(product, [camp])).toBeCloseTo(150)
  })

  it('ürün kısıtlaması: hedef listede değilse indirim uygulanmaz', () => {
    const product = makeProduct({ id: 'prod-X', category_id: 'cat-1', price: 200 })
    const camp = makeCampaign({ price_basis: 'base', discount_percent: 25, applies_to_product_ids: ['prod-1', 'prod-2'] })
    expect(calculateFinalPrice(product, [camp])).toBe(200)
  })

  it('çakışan kampanyalar: pizza(%15 priority 5) + genel(%10 priority 10) → pizza için %10 kazanır', () => {
    // priority 10 > 5, liste priority DESC sıralı gelir
    const generalCamp = makeCampaign({ id: 'c1', priority: 10, price_basis: 'base', discount_percent: 10 })
    const pizzaCamp = makeCampaign({ id: 'c2', priority: 5, price_basis: 'base', discount_percent: 15, applies_to_product_ids: ['pizza-1'] })
    const pizza = makeProduct({ id: 'pizza-1', category_id: 'cat-1', price: 100 })
    // Her ikisi de pizza'ya uygulanabilir; priority 10 kazanır → %10
    expect(calculateFinalPrice(pizza, [generalCamp, pizzaCamp])).toBeCloseTo(90)
  })

  it('çakışan kampanyalar: pizza(%15 priority 20) + genel(%10 priority 10) → pizza için %15 kazanır', () => {
    const generalCamp = makeCampaign({ id: 'c1', priority: 10, price_basis: 'base', discount_percent: 10 })
    const pizzaCamp = makeCampaign({ id: 'c2', priority: 20, price_basis: 'base', discount_percent: 15, applies_to_product_ids: ['pizza-1'] })
    const pizza = makeProduct({ id: 'pizza-1', category_id: 'cat-1', price: 100 })
    // priority 20 kazanır → %15
    expect(calculateFinalPrice(pizza, [pizzaCamp, generalCamp])).toBeCloseTo(85)
  })

  it('çakışan kampanyalar: ürün bazlı olmayan ürün genel kampanyadan faydalanır', () => {
    const generalCamp = makeCampaign({ id: 'c1', priority: 10, price_basis: 'base', discount_percent: 10 })
    const pizzaCamp = makeCampaign({ id: 'c2', priority: 20, price_basis: 'base', discount_percent: 15, applies_to_product_ids: ['pizza-1'] })
    const burger = makeProduct({ id: 'burger-1', category_id: 'cat-1', price: 100 })
    // Burger pizza kampanyası kapsamında değil → sadece genel %10
    expect(calculateFinalPrice(burger, [pizzaCamp, generalCamp])).toBeCloseTo(90)
  })
})
