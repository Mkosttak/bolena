import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getElapsedMinutes,
  getUrgencyLevel,
  groupItemsByTimeWindow,
  findKdsGroupContainingOrderItem,
  buildProductionSummary,
  isKnownPlatformChannel,
  orderLeadTimeMinutes,
  itemLeadTimeMinutes,
} from '@/lib/utils/kds.utils'
import type { KdsOrderItem } from '@/lib/utils/kds.utils'

// =====================================================
// Test Yardımcıları
// =====================================================

function makeKdsItem(overrides: Partial<KdsOrderItem> = {}): KdsOrderItem {
  return {
    id: 'item-1',
    order_id: 'order-1',
    product_name_tr: 'Hamburger',
    product_name_en: 'Hamburger',
    quantity: 1,
    notes: null,
    removed_ingredients: [],
    selected_extras: [],
    is_complimentary: false,
    kds_status: 'pending',
    created_at: new Date().toISOString(),
    order_type: 'table',
    order_table_id: 'table-1',
    order_customer_name: null,
    order_platform: null,
    order_notes: null,
    order_created_at: new Date().toISOString(),
    is_qr_order: false,
    ...overrides,
  }
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

function isoSecondsAgo(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString()
}

// =====================================================
// getElapsedMinutes
// =====================================================

describe('getElapsedMinutes', () => {
  it('şu an için 0 döner', () => {
    const now = new Date().toISOString()
    expect(getElapsedMinutes(now)).toBe(0)
  })

  it('30 dakika önce için 30 döner', () => {
    const ts = isoMinutesAgo(30)
    expect(getElapsedMinutes(ts)).toBe(30)
  })

  it('1 dakika 30 saniye önce için 1 döner (floor)', () => {
    const ts = isoSecondsAgo(90)
    expect(getElapsedMinutes(ts)).toBe(1)
  })
})

// =====================================================
// getUrgencyLevel
// =====================================================

describe('getUrgencyLevel', () => {
  it('0 dk → normal', () => {
    expect(getUrgencyLevel(0)).toBe('normal')
  })

  it('9 dk → normal', () => {
    expect(getUrgencyLevel(9)).toBe('normal')
  })

  it('10 dk → warning', () => {
    expect(getUrgencyLevel(10)).toBe('warning')
  })

  it('19 dk → warning', () => {
    expect(getUrgencyLevel(19)).toBe('warning')
  })

  it('20 dk → critical', () => {
    expect(getUrgencyLevel(20)).toBe('critical')
  })

  it('21 dk → critical', () => {
    expect(getUrgencyLevel(21)).toBe('critical')
  })
})

// =====================================================
// groupItemsByTimeWindow
// =====================================================

describe('groupItemsByTimeWindow', () => {
  it('boş dizi → boş sonuç', () => {
    expect(groupItemsByTimeWindow([])).toEqual([])
  })

  it('tek item → tek grup', () => {
    const item = makeKdsItem({ id: 'i1', order_id: 'o1', created_at: isoMinutesAgo(5) })
    const groups = groupItemsByTimeWindow([item])
    expect(groups).toHaveLength(1)
    expect(groups[0].itemIds).toEqual(['i1'])
    expect(groups[0].orderId).toBe('o1')
  })

  it('aynı siparişten 1 dk arayla 2 item → tek grup', () => {
    const base = isoMinutesAgo(10)
    const t1 = new Date(new Date(base).getTime()).toISOString()
    const t2 = new Date(new Date(base).getTime() + 60 * 1000).toISOString() // +1 dk
    const items = [
      makeKdsItem({ id: 'i1', order_id: 'o1', created_at: t1 }),
      makeKdsItem({ id: 'i2', order_id: 'o1', created_at: t2 }),
    ]
    const groups = groupItemsByTimeWindow(items)
    expect(groups).toHaveLength(1)
    expect(groups[0].itemIds).toEqual(['i1', 'i2'])
  })

  it('aynı siparişten 3 dk arayla 2 item → iki grup (>2 dk window)', () => {
    const base = Date.now()
    const t1 = new Date(base - 10 * 60 * 1000).toISOString()
    const t2 = new Date(base - 7 * 60 * 1000).toISOString() // t1+3dk
    const items = [
      makeKdsItem({ id: 'i1', order_id: 'o1', created_at: t1 }),
      makeKdsItem({ id: 'i2', order_id: 'o1', created_at: t2 }),
    ]
    const groups = groupItemsByTimeWindow(items)
    expect(groups).toHaveLength(2)
    expect(groups[0].itemIds).toEqual(['i1'])
    expect(groups[1].itemIds).toEqual(['i2'])
  })

  it('farklı siparişlerden gelen eş zamanlı itemlar → her zaman farklı grup', () => {
    const ts = isoMinutesAgo(5)
    const items = [
      makeKdsItem({ id: 'i1', order_id: 'o1', created_at: ts }),
      makeKdsItem({ id: 'i2', order_id: 'o2', created_at: ts }),
    ]
    const groups = groupItemsByTimeWindow(items)
    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.orderId).sort()).toEqual(['o1', 'o2'])
  })

  it('windowStart grubun en erken created_at değerine eşittir', () => {
    const t1 = isoMinutesAgo(10)
    const t2 = new Date(new Date(t1).getTime() + 30 * 1000).toISOString() // t1+30sn
    const items = [
      makeKdsItem({ id: 'i1', order_id: 'o1', created_at: t1 }),
      makeKdsItem({ id: 'i2', order_id: 'o1', created_at: t2 }),
    ]
    const groups = groupItemsByTimeWindow(items)
    expect(groups[0].windowStart).toBe(t1)
  })

  it('gruplar windowStart sırasıyla döner (en eskiden yeniye)', () => {
    const t1 = isoMinutesAgo(15)
    const t2 = isoMinutesAgo(5)
    const items = [
      makeKdsItem({ id: 'i2', order_id: 'o2', created_at: t2 }),
      makeKdsItem({ id: 'i1', order_id: 'o1', created_at: t1 }),
    ]
    const groups = groupItemsByTimeWindow(items)
    expect(groups[0].orderId).toBe('o1') // daha eski
    expect(groups[1].orderId).toBe('o2') // daha yeni
  })

  it('tableName tableNames haritasından gelir', () => {
    const item = makeKdsItem({
      id: 'i1',
      order_id: 'o1',
      order_table_id: 'table-5',
      created_at: isoMinutesAgo(3),
    })
    const groups = groupItemsByTimeWindow([item], 2 * 60 * 1000, { 'table-5': 'Masa 5' })
    expect(groups[0].tableName).toBe('Masa 5')
  })
})

// =====================================================
// findKdsGroupContainingOrderItem
// =====================================================

describe('findKdsGroupContainingOrderItem', () => {
  it('yeni kalem id’sine göre yalnızca o zaman penceresindeki grubu döndürür (eski pencere ayrı)', () => {
    const oldTs = isoMinutesAgo(8)
    const newTs = isoSecondsAgo(30)
    const items = [
      makeKdsItem({
        id: 'i-old',
        order_id: 'o-split',
        product_name_tr: 'Köfte',
        created_at: oldTs,
      }),
      makeKdsItem({
        id: 'i-new',
        order_id: 'o-split',
        product_name_tr: 'Salata',
        created_at: newTs,
      }),
    ]
    const groups = groupItemsByTimeWindow(items, 2 * 60 * 1000, { 'table-1': 'Masa 1' })
    expect(groups.filter((g) => g.orderId === 'o-split').length).toBeGreaterThanOrEqual(2)

    const forNew = findKdsGroupContainingOrderItem(groups, 'o-split', 'i-new')
    expect(forNew).toBeDefined()
    expect(forNew!.items.map((i) => i.id)).toEqual(['i-new'])

    const forOld = findKdsGroupContainingOrderItem(groups, 'o-split', 'i-old')
    expect(forOld).toBeDefined()
    expect(forOld!.items.map((i) => i.id)).toEqual(['i-old'])
  })
})

// =====================================================
// buildProductionSummary
// =====================================================

describe('buildProductionSummary', () => {
  it('boş gruplar → boş sonuç', () => {
    expect(buildProductionSummary([])).toEqual([])
  })

  it('aynı ürün iki farklı gruptan → toplanmış tek satır', () => {
    const item1 = makeKdsItem({ id: 'i1', order_id: 'o1', product_name_tr: 'Pizza', quantity: 2 })
    const item2 = makeKdsItem({ id: 'i2', order_id: 'o2', product_name_tr: 'Pizza', quantity: 3 })
    const ts = isoMinutesAgo(5)
    const groups = groupItemsByTimeWindow(
      [
        { ...item1, created_at: ts },
        { ...item2, created_at: ts, order_id: 'o2', order_table_id: 'table-2' },
      ],
      2 * 60 * 1000
    )
    const summary = buildProductionSummary(groups)
    expect(summary).toHaveLength(1)
    expect(summary[0]).toEqual({ productNameTr: 'Pizza', totalQuantity: 5 })
  })

  it('quantity=0 (iptal) kalemler hariç tutulur', () => {
    const ts = isoMinutesAgo(5)
    const item = makeKdsItem({ id: 'i1', order_id: 'o1', product_name_tr: 'Wrap', quantity: 0, created_at: ts })
    const groups = groupItemsByTimeWindow([item])
    const summary = buildProductionSummary(groups)
    expect(summary).toEqual([])
  })

  it('azalan adet sırasıyla döner', () => {
    const ts = isoMinutesAgo(5)
    const items = [
      makeKdsItem({ id: 'i1', order_id: 'o1', product_name_tr: 'Hamburger', quantity: 1, created_at: ts }),
      makeKdsItem({ id: 'i2', order_id: 'o2', product_name_tr: 'Pizza', quantity: 3, created_at: ts, order_table_id: 'table-2' }),
    ]
    const groups = groupItemsByTimeWindow(items)
    const summary = buildProductionSummary(groups)
    expect(summary[0].productNameTr).toBe('Pizza') // 3 adet
    expect(summary[1].productNameTr).toBe('Hamburger') // 1 adet
  })
})

// =====================================================
// isKnownPlatformChannel
// =====================================================

describe('isKnownPlatformChannel', () => {
  it('returns true for supported channels', () => {
    expect(isKnownPlatformChannel('getir')).toBe(true)
    expect(isKnownPlatformChannel('yemeksepeti')).toBe(true)
  })

  it('returns false for unknown slug', () => {
    expect(isKnownPlatformChannel('other')).toBe(false)
  })
})

describe('orderLeadTimeMinutes', () => {
  it('returns minutes between created_at and completed_at', () => {
    expect(
      orderLeadTimeMinutes({
        created_at: '2025-01-01T10:00:00.000Z',
        completed_at: '2025-01-01T10:25:00.000Z',
      })
    ).toBe(25)
  })

  it('returns null when completed_at missing', () => {
    expect(
      orderLeadTimeMinutes({
        created_at: '2025-01-01T10:00:00.000Z',
        completed_at: null,
      })
    ).toBeNull()
  })
})

describe('itemLeadTimeMinutes', () => {
  it('returns null without item created_at', () => {
    expect(itemLeadTimeMinutes({}, '2025-01-01T11:00:00.000Z')).toBeNull()
  })

  it('returns minutes from item created to order completion', () => {
    expect(
      itemLeadTimeMinutes(
        { created_at: '2025-01-01T10:10:00.000Z' },
        '2025-01-01T10:40:00.000Z'
      )
    ).toBe(30)
  })
})
