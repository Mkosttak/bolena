import type { DateRangeKey } from '@/lib/utils/reports.utils'
import type { OrderType, PlatformType, PaymentMethod } from '@/types'

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const reportsKeys = {
  all: ['reports'] as const,
  kpi: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'kpi', range, start, end] as const,
  dailyRevenue: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'daily', range, start, end] as const,
  orderTypes: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'orderTypes', range, start, end] as const,
  paymentMethods: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'payments', range, start, end] as const,
  topProducts: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'products', range, start, end] as const,
  categories: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'categories', range, start, end] as const,
  heatmap: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'heatmap', range, start, end] as const,
  platforms: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'platforms', range, start, end] as const,
  reservationStats: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'reservations', range, start, end] as const,
  campaigns: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'campaigns', range, start, end] as const,
  complimentary: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'complimentary', range, start, end] as const,
  orderOutcomes: (range: DateRangeKey, start: string, end: string) =>
    [...reportsKeys.all, 'orderOutcomes', range, start, end] as const,
}

// ─── Return Types ─────────────────────────────────────────────────────────────

export interface KpiPeriod {
  revenue: number
  orderCount: number
  avgBasket: number
  cancelRate: number
  totalDiscount: number
  reservationCount: number
  platformOrderCount: number
  avgPrepTime: number // minutes
}

export interface KpiSummary {
  current: KpiPeriod
  prev: KpiPeriod
}

export interface DailyRevenuePoint {
  date: string
  revenue: number
  orderCount: number
}

export interface OrderTypeBreakdown {
  type: OrderType | PlatformType
  count: number
  revenue: number
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod
  total: number
}

export interface TopProduct {
  productName: string
  quantity: number
  revenue: number
}

export interface CategoryRevenue {
  categoryName: string
  revenue: number
  percentage: number
}

export interface HourlyHeatmapPoint {
  dayOfWeek: number // 0=Sun, 1=Mon … 6=Sat
  hour: number
  count: number
}

export interface PlatformStat {
  platform: PlatformType
  orderCount: number
  revenue: number
  cancelCount: number
}

export interface ReservationStats {
  total: number
  completed: number
  noShow: number
  cancelled: number
  pending: number
  seated: number
  avgPartySize: number
}

export interface CampaignStat {
  productName: string
  quantity: number
  discountAmount: number
}

export interface ComplimentarySummary {
  lineCount: number
  totalQuantity: number
  listValueTry: number
}

export interface OrderOutcomeStats {
  active: number
  completed: number
  cancelled: number
  noShow: number
  completedRevenue: number
}
