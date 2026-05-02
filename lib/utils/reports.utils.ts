import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'

export type DateRangeKey = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export interface DateRange {
  key: DateRangeKey
  start: string // ISO date 'YYYY-MM-DD'
  end: string   // ISO date 'YYYY-MM-DD'
}

function toIso(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function buildDateRange(
  key: DateRangeKey,
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = new Date()

  if (key === 'today') {
    const today = toIso(now)
    return { key, start: today, end: today }
  }
  
  if (key === 'yesterday') {
    const yesterday = toIso(subDays(now, 1))
    return { key, start: yesterday, end: yesterday }
  }

  if (key === 'week') {
    return {
      key,
      start: toIso(startOfWeek(now, { weekStartsOn: 1 })),
      end: toIso(endOfWeek(now, { weekStartsOn: 1 })),
    }
  }

  if (key === 'month') {
    return {
      key,
      start: toIso(startOfMonth(now)),
      end: toIso(endOfMonth(now)),
    }
  }

  // custom
  return {
    key: 'custom',
    start: customStart ?? toIso(now),
    end: customEnd ?? toIso(now),
  }
}

export function buildPrevDateRange(range: DateRange): DateRange {
  const start = new Date(range.start)
  const end = new Date(range.end)

  if (range.key === 'today') {
    const yesterday = toIso(subDays(start, 1))
    return { key: 'custom', start: yesterday, end: yesterday }
  }

  if (range.key === 'yesterday') {
    const prevDay = toIso(subDays(start, 1))
    return { key: 'custom', start: prevDay, end: prevDay }
  }

  if (range.key === 'week') {
    return {
      key: 'custom',
      start: toIso(subWeeks(start, 1)),
      end: toIso(subWeeks(end, 1)),
    }
  }

  if (range.key === 'month') {
    return {
      key: 'custom',
      start: toIso(subMonths(start, 1)),
      end: toIso(subMonths(end, 1)),
    }
  }

  // custom: aynı uzunlukta geriye git
  const days = differenceInDays(end, start) + 1
  return {
    key: 'custom',
    start: toIso(subDays(start, days)),
    end: toIso(subDays(end, days)),
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercentChange(
  current: number,
  prev: number
): { value: string; isPositive: boolean; isZero: boolean } {
  if (prev === 0) {
    if (current === 0) return { value: '0%', isPositive: true, isZero: true }
    return { value: '+∞%', isPositive: true, isZero: false }
  }
  const pct = ((current - prev) / prev) * 100
  const rounded = Math.round(pct * 10) / 10
  const isPositive = rounded >= 0
  const value = `${isPositive ? '+' : ''}${rounded}%`
  return { value, isPositive, isZero: rounded === 0 }
}

export function getHeatmapIntensity(count: number, max: number): number {
  if (max === 0) return 0
  return Math.min(count / max, 1)
}

/** Heatmap API satırı — yoğun slotu bulmak için */
export interface HeatmapCountPoint {
  dayOfWeek: number
  hour: number
  count: number
}

export function findPeakHeatmapSlot(points: HeatmapCountPoint[]): HeatmapCountPoint | null {
  if (points.length === 0) return null
  return points.reduce((best, p) => (p.count > best.count ? p : best))
}

export function exportToCsv(rows: Record<string, unknown>[], filename: string): void {
  const firstRow = rows[0]
  if (!firstRow) return

  const headers = Object.keys(firstRow)
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          const str = val === null || val === undefined ? '' : String(val)
          // Virgül veya tırnak içeriyorsa tırnak içine al
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    ),
  ]

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function formatDateLabel(dateStr: string, rangeKey: DateRangeKey): string {
  const date = new Date(dateStr)
  if (rangeKey === 'today' || rangeKey === 'yesterday') return format(date, 'HH:mm')
  if (rangeKey === 'month') return format(date, 'd MMM', { locale: tr })
  return format(date, 'd MMM', { locale: tr })
}

export function getRangeLabelTr(key: DateRangeKey, start: string, end: string): string {
  if (key === 'today') return 'Bugün'
  if (key === 'week') return 'Bu Hafta'
  if (key === 'month') return 'Bu Ay'
  return `${start} – ${end}`
}
