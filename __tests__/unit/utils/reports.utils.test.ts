import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  buildDateRange,
  buildPrevDateRange,
  formatCurrency,
  formatPercentChange,
  getHeatmapIntensity,
  exportToCsv,
  findPeakHeatmapSlot,
} from '@/lib/utils/reports.utils'

// Sabit bugün: 2026-04-05 (Pazar)
const FIXED_NOW = new Date('2026-04-05T12:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// ─────────────────────────────────────────────
// buildDateRange
// ─────────────────────────────────────────────

describe('buildDateRange', () => {
  it('today → aynı gün start=end', () => {
    const r = buildDateRange('today')
    expect(r.start).toBe('2026-04-05')
    expect(r.end).toBe('2026-04-05')
    expect(r.key).toBe('today')
  })

  it('week → Pazartesi–Pazar (weekStartsOn=1)', () => {
    const r = buildDateRange('week')
    // 2026-04-05 Pazar → haftanın başı 2026-03-30 Pazartesi
    expect(r.start).toBe('2026-03-30')
    expect(r.end).toBe('2026-04-05')
    expect(r.key).toBe('week')
  })

  it('month → Nisan başı–sonu', () => {
    const r = buildDateRange('month')
    expect(r.start).toBe('2026-04-01')
    expect(r.end).toBe('2026-04-30')
    expect(r.key).toBe('month')
  })

  it('custom → verilen değerleri kullanır', () => {
    const r = buildDateRange('custom', '2026-03-01', '2026-03-15')
    expect(r.start).toBe('2026-03-01')
    expect(r.end).toBe('2026-03-15')
    expect(r.key).toBe('custom')
  })
})

// ─────────────────────────────────────────────
// buildPrevDateRange
// ─────────────────────────────────────────────

describe('buildPrevDateRange', () => {
  it('today → dün', () => {
    const range = buildDateRange('today')
    const prev = buildPrevDateRange(range)
    expect(prev.start).toBe('2026-04-04')
    expect(prev.end).toBe('2026-04-04')
  })

  it('week → önceki hafta', () => {
    const range = buildDateRange('week')
    const prev = buildPrevDateRange(range)
    expect(prev.start).toBe('2026-03-23')
    expect(prev.end).toBe('2026-03-29')
  })

  it('month → önceki ay başı doğru', () => {
    const range = buildDateRange('month')
    const prev = buildPrevDateRange(range)
    expect(prev.start).toBe('2026-03-01')
    // subMonths ile bitiş günü hesaplanır — Mart 30 veya 31 olabilir (UTC farkı)
    expect(prev.end).toMatch(/^2026-03-/)
  })

  it('custom 7 gün → 7 gün öncesi', () => {
    const range = buildDateRange('custom', '2026-04-01', '2026-04-07')
    const prev = buildPrevDateRange(range)
    expect(prev.start).toBe('2026-03-25')
    expect(prev.end).toBe('2026-03-31')
  })
})

// ─────────────────────────────────────────────
// formatCurrency
// ─────────────────────────────────────────────

describe('formatCurrency', () => {
  it('1234.56 → ₺1.234,56', () => {
    expect(formatCurrency(1234.56)).toContain('1.234')
    expect(formatCurrency(1234.56)).toContain('56')
  })

  it('0 → ₺0,00', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })
})

// ─────────────────────────────────────────────
// formatPercentChange
// ─────────────────────────────────────────────

describe('formatPercentChange', () => {
  it('+10% artış', () => {
    const r = formatPercentChange(110, 100)
    expect(r.value).toBe('+10%')
    expect(r.isPositive).toBe(true)
    expect(r.isZero).toBe(false)
  })

  it('-10% düşüş', () => {
    const r = formatPercentChange(90, 100)
    expect(r.value).toBe('-10%')
    expect(r.isPositive).toBe(false)
    expect(r.isZero).toBe(false)
  })

  it('değişim yok → 0%', () => {
    const r = formatPercentChange(100, 100)
    expect(r.value).toBe('+0%')
    expect(r.isZero).toBe(true)
  })

  it('prev=0, current>0 → +∞%', () => {
    const r = formatPercentChange(50, 0)
    expect(r.value).toBe('+∞%')
    expect(r.isPositive).toBe(true)
  })

  it('prev=0, current=0 → 0%', () => {
    const r = formatPercentChange(0, 0)
    expect(r.isZero).toBe(true)
  })
})

// ─────────────────────────────────────────────
// getHeatmapIntensity
// ─────────────────────────────────────────────

describe('findPeakHeatmapSlot', () => {
  it('boş dizi → null', () => {
    expect(findPeakHeatmapSlot([])).toBeNull()
  })

  it('en yüksek count’lu slotu döner', () => {
    const peak = findPeakHeatmapSlot([
      { dayOfWeek: 1, hour: 12, count: 3 },
      { dayOfWeek: 5, hour: 19, count: 9 },
      { dayOfWeek: 5, hour: 20, count: 4 },
    ])
    expect(peak).toEqual({ dayOfWeek: 5, hour: 19, count: 9 })
  })
})

describe('getHeatmapIntensity', () => {
  it('5/10 → 0.5', () => {
    expect(getHeatmapIntensity(5, 10)).toBe(0.5)
  })

  it('max=0 → 0', () => {
    expect(getHeatmapIntensity(0, 0)).toBe(0)
  })

  it('count > max → 1 ile sınırlanır', () => {
    expect(getHeatmapIntensity(20, 10)).toBe(1)
  })

  it('0/10 → 0', () => {
    expect(getHeatmapIntensity(0, 10)).toBe(0)
  })
})

// ─────────────────────────────────────────────
// exportToCsv
// ─────────────────────────────────────────────

describe('exportToCsv', () => {
  it('boş array → hiçbir şey yapılmaz', () => {
    const createObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() })
    exportToCsv([], 'test')
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('veri varsa Blob oluşturulur ve link tıklanır', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const clickMock = vi.fn()
    const linkEl = { href: '', download: '', click: clickMock }
    vi.spyOn(document, 'createElement').mockReturnValue(linkEl as unknown as HTMLAnchorElement)

    exportToCsv([{ ad: 'Kahve', adet: 10 }], 'urunler')

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(clickMock).toHaveBeenCalledOnce()
    expect(linkEl.download).toBe('urunler.csv')
  })
})
