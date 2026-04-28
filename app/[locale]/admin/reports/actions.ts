'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type {
  KpiSummary,
  DailyRevenuePoint,
  OrderTypeBreakdown,
  PaymentMethodBreakdown,
  TopProduct,
  CategoryRevenue,
  HourlyHeatmapPoint,
  PlatformStat,
  ReservationStats,
  CampaignStat,
  ComplimentarySummary,
  OrderOutcomeStats,
} from '@/lib/queries/reports.queries'
import type { OrderType, PlatformType, PaymentMethod } from '@/types'

type ActionResult<T> = { data: T } | { error: string }
const ISTANBUL_TIME_ZONE = 'Europe/Istanbul'

async function ensureReportsAccess(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return 'Unauthorized'

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return 'Unauthorized'
  if (profile.role === 'admin') return null

  const { data: permission, error: permError } = await supabase
    .from('module_permissions')
    .select('can_access')
    .eq('user_id', user.id)
    .eq('module_name', 'reports')
    .maybeSingle()

  if (permError || !permission?.can_access) return 'Forbidden'
  return null
}

function getIstanbulParts(input: string): { date: string; hour: number; dayOfWeek: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ISTANBUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  })

  const parts = formatter.formatToParts(new Date(input))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    dayOfWeek: weekdayMap[get('weekday')] ?? 0,
  }
}

// ─── Yardımcı: tarih aralığını TR saat dilimine göre başlangıç/bitiş'e çevir ─
// TR = UTC+3; "Z" yerine "+03:00" kullanarak gece yarısı sapmasını önlüyoruz.

function toUtcRange(start: string, end: string): { from: string; to: string } {
  return {
    from: `${start}T00:00:00.000+03:00`,
    to: `${end}T23:59:59.999+03:00`,
  }
}

// ─── KPI Özeti ───────────────────────────────────────────────────────────────

export async function fetchKpiSummary(
  start: string,
  end: string,
  prevStart: string,
  prevEnd: string
): Promise<ActionResult<KpiSummary>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()

  async function getKpi(s: string, e: string) {
    const { from, to } = toUtcRange(s, e)

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('total_amount, discount_amount, status, type, created_at, completed_at')
      .gte('created_at', from)
      .lte('created_at', to)
      .in('status', ['completed', 'cancelled', 'no_show'])

    if (ordersErr) throw new Error(ordersErr.message)

    const completed = (orders ?? []).filter((o) => o.status === 'completed')
    const cancelled = (orders ?? []).filter(
      (o) => o.status === 'cancelled' || o.status === 'no_show'
    )
    const total = (orders ?? []).length

    const revenue = completed.reduce((s, o) => s + (o.total_amount ?? 0), 0)
    const orderCount = completed.length
    const avgBasket = orderCount > 0 ? revenue / orderCount : 0
    const cancelRate = total > 0 ? (cancelled.length / total) * 100 : 0
    const totalDiscount = completed.reduce((s, o) => s + (o.discount_amount ?? 0), 0)
    const platformOrderCount = completed.filter(o => o.type === 'platform').length
    
    // Ortalama hazırlama süresi (dakika)
    const ordersWithTiming = completed.filter(o => o.created_at && o.completed_at)
    const totalPrepMinutes = ordersWithTiming.reduce((s, o) => {
      const start = new Date(o.created_at).getTime()
      const end = new Date(o.completed_at!).getTime()
      return s + (end - start) / (1000 * 60)
    }, 0)
    const avgPrepTime = ordersWithTiming.length > 0 ? totalPrepMinutes / ordersWithTiming.length : 0

    const { data: reservations, error: resErr } = await supabase
      .from('reservations')
      .select('id')
      .gte('created_at', from)
      .lte('created_at', to)

    if (resErr) throw new Error(resErr.message)

    return {
      revenue,
      orderCount,
      avgBasket,
      cancelRate,
      totalDiscount,
      reservationCount: (reservations ?? []).length,
      platformOrderCount,
      avgPrepTime,
    }
  }

  try {
    const [current, prev] = await Promise.all([getKpi(start, end), getKpi(prevStart, prevEnd)])
    return { data: { current, prev } }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Bilinmeyen hata' }
  }
}

// ─── Günlük Ciro ─────────────────────────────────────────────────────────────

export async function fetchDailyRevenue(
  start: string,
  end: string
): Promise<ActionResult<DailyRevenuePoint[]>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  const { data, error } = await supabase
    .from('orders')
    .select('total_amount, completed_at, created_at')
    .eq('status', 'completed')
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) return { error: error.message }

  const isSingleDay = start === end
  const byPeriod = new Map<string, { revenue: number; orderCount: number }>()

  if (isSingleDay) {
    const dayPrefix = start // YYYY-MM-DD
    // 00'dan 23'e kadar boş saatleri doldur
    for (let i = 0; i < 24; i++) {
      const hourStr = i.toString().padStart(2, '0')
      byPeriod.set(`${dayPrefix}T${hourStr}:00`, { revenue: 0, orderCount: 0 })
    }

    for (const o of data ?? []) {
      const { hour } = getIstanbulParts(o.completed_at ?? o.created_at)
      const hourValue = hour.toString().padStart(2, '0')
      const hourStr = hourValue === '24' ? '00' : hourValue
      const periodKey = `${dayPrefix}T${hourStr}:00`
      const existing = byPeriod.get(periodKey) ?? { revenue: 0, orderCount: 0 }
      byPeriod.set(periodKey, {
        revenue: existing.revenue + (o.total_amount ?? 0),
        orderCount: existing.orderCount + 1,
      })
    }
  } else {
    for (const o of data ?? []) {
      const { date: dateStr } = getIstanbulParts(o.completed_at ?? o.created_at)
      const existing = byPeriod.get(dateStr) ?? { revenue: 0, orderCount: 0 }
      byPeriod.set(dateStr, {
        revenue: existing.revenue + (o.total_amount ?? 0),
        orderCount: existing.orderCount + 1,
      })
    }
  }

  const result: DailyRevenuePoint[] = Array.from(byPeriod.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { data: result }
}

// ─── Sipariş Tipi Dağılımı ───────────────────────────────────────────────────

export async function fetchOrderTypeBreakdown(
  start: string,
  end: string
): Promise<ActionResult<OrderTypeBreakdown[]>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  const { data, error } = await supabase
    .from('orders')
    .select('type, total_amount, platform')
    .eq('status', 'completed')
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) return { error: error.message }

  const byType = new Map<OrderType | PlatformType, { count: number; revenue: number }>()

  for (const o of data ?? []) {
    const type = (o.type === 'platform' && o.platform ? o.platform : o.type) as OrderType | PlatformType
    const existing = byType.get(type) ?? { count: 0, revenue: 0 }
    byType.set(type, {
      count: existing.count + 1,
      revenue: existing.revenue + (o.total_amount ?? 0),
    })
  }

  return {
    data: Array.from(byType.entries()).map(([type, v]) => ({ type, ...v })),
  }
}

// ─── Ödeme Yöntemi Dağılımı ──────────────────────────────────────────────────

export async function fetchPaymentMethodBreakdown(
  start: string,
  end: string
): Promise<ActionResult<PaymentMethodBreakdown[]>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  const { data, error } = await supabase
    .from('payments')
    .select('method, amount, orders!inner(status, created_at)')
    .eq('orders.status', 'completed')
    .gte('orders.created_at', from)
    .lte('orders.created_at', to)

  if (error) return { error: error.message }

  const byMethod = new Map<PaymentMethod, number>()

  for (const p of data ?? []) {
    const method = p.method as PaymentMethod
    byMethod.set(method, (byMethod.get(method) ?? 0) + (p.amount ?? 0))
  }

  return {
    data: Array.from(byMethod.entries()).map(([method, total]) => ({ method, total })),
  }
}

// ─── Top Ürünler ─────────────────────────────────────────────────────────────

export async function fetchTopProducts(
  start: string,
  end: string,
  limit = 10
): Promise<ActionResult<TopProduct[]>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  // limit 0 gelirse hepsini getir
  const query = supabase
    .from('order_items')
    .select('product_name_tr, quantity, total_price, orders!inner(status, created_at)')
    .eq('orders.status', 'completed')
    .gte('orders.created_at', from)
    .lte('orders.created_at', to)
    .eq('is_complimentary', false)

  const { data, error } = await query

  if (error) return { error: error.message }

  const byProduct = new Map<string, { quantity: number; revenue: number }>()

  for (const item of data ?? []) {
    const name = item.product_name_tr
    const existing = byProduct.get(name) ?? { quantity: 0, revenue: 0 }
    byProduct.set(name, {
      quantity: existing.quantity + (item.quantity ?? 0),
      revenue: existing.revenue + (item.total_price ?? 0),
    })
  }

  const result = Array.from(byProduct.entries())
    .map(([productName, v]) => ({ productName, ...v }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    data: limit > 0 ? result.slice(0, limit) : result,
  }
}

// ─── Kampanya İstatistikleri ─────────────────────────────────────────────────

export async function fetchCampaignStats(
  start: string,
  end: string
): Promise<ActionResult<CampaignStat[]>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  // Kampanyadan yararlanan ürünleri bulmak için:
  // unit_price < products.price olan ve ikram olmayan kalemler.
  // Not: products ile join yaparak orijinal fiyatı alıyoruz.
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      product_name_tr,
      quantity,
      unit_price,
      products!inner(price),
      orders!inner(status, created_at)
    `)
    .eq('orders.status', 'completed')
    .gte('orders.created_at', from)
    .lte('orders.created_at', to)
    .eq('is_complimentary', false)

  if (error) return { error: error.message }

  const byProduct = new Map<string, { quantity: number; discountAmount: number }>()

  for (const item of data ?? []) {
    const product = item.products as unknown as { price: number }
    const originalPrice = product.price
    const paidPrice = item.unit_price
    
    // Eğer ödenen fiyat orijinal fiyattan düşükse kampanyalı sayıyoruz
    if (paidPrice < originalPrice) {
      const discountPerUnit = originalPrice - paidPrice
      const totalDiscount = discountPerUnit * item.quantity
      
      const existing = byProduct.get(item.product_name_tr) ?? { quantity: 0, discountAmount: 0 }
      byProduct.set(item.product_name_tr, {
        quantity: existing.quantity + item.quantity,
        discountAmount: existing.discountAmount + totalDiscount,
      })
    }
  }

  return {
    data: Array.from(byProduct.entries())
      .map(([productName, v]) => ({ productName, ...v }))
      .sort((a, b) => b.discountAmount - a.discountAmount),
  }
}

// ─── Kategori Geliri ─────────────────────────────────────────────────────────

export async function fetchCategoryRevenue(
  start: string,
  end: string
): Promise<ActionResult<CategoryRevenue[]>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  const { data, error } = await supabase
    .from('order_items')
    .select(
      'total_price, product_id, products!inner(category_id, categories!inner(name_tr)), orders!inner(status, created_at)'
    )
    .eq('orders.status', 'completed')
    .gte('orders.created_at', from)
    .lte('orders.created_at', to)
    .eq('is_complimentary', false)

  if (error) return { error: error.message }

  const byCategory = new Map<string, number>()

  for (const item of data ?? []) {
    const product = item.products as { categories: { name_tr: string } } | null
    const catName = product?.categories?.name_tr ?? 'Kategorisiz'
    byCategory.set(catName, (byCategory.get(catName) ?? 0) + (item.total_price ?? 0))
  }

  const totalRevenue = Array.from(byCategory.values()).reduce((s, v) => s + v, 0)

  return {
    data: Array.from(byCategory.entries())
      .map(([categoryName, revenue]) => ({
        categoryName,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue),
  }
}

// ─── Saatlik Yoğunluk Heatmap ────────────────────────────────────────────────

export async function fetchHourlyHeatmap(
  start: string,
  end: string
): Promise<ActionResult<HourlyHeatmapPoint[]>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  const { data, error } = await supabase
    .from('orders')
    .select('created_at')
    .eq('status', 'completed')
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) return { error: error.message }

  const bySlot = new Map<string, number>()

  for (const o of data ?? []) {
    const { dayOfWeek, hour } = getIstanbulParts(o.created_at)
    const key = `${dayOfWeek}-${hour}`
    bySlot.set(key, (bySlot.get(key) ?? 0) + 1)
  }

  const result: HourlyHeatmapPoint[] = Array.from(bySlot.entries()).map((entry) => {
    const [key, count] = entry
    const [dayStr, hourStr] = key.split('-')
    return {
      dayOfWeek: parseInt(dayStr, 10),
      hour: parseInt(hourStr, 10),
      count,
    }
  })

  return { data: result }
}

// ─── Platform İstatistikleri ─────────────────────────────────────────────────

export async function fetchPlatformStats(
  start: string,
  end: string
): Promise<ActionResult<PlatformStat[]>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  const { data, error } = await supabase
    .from('orders')
    .select('platform, total_amount, status')
    .eq('type', 'platform')
    .gte('created_at', from)
    .lte('created_at', to)
    .not('platform', 'is', null)

  if (error) return { error: error.message }

  const byPlatform = new Map<
    PlatformType,
    { orderCount: number; revenue: number; cancelCount: number }
  >()

  for (const o of data ?? []) {
    const platform = o.platform as PlatformType
    const existing = byPlatform.get(platform) ?? { orderCount: 0, revenue: 0, cancelCount: 0 }
    byPlatform.set(platform, {
      orderCount: existing.orderCount + (o.status === 'completed' ? 1 : 0),
      revenue: existing.revenue + (o.status === 'completed' ? (o.total_amount ?? 0) : 0),
      cancelCount:
        existing.cancelCount + (o.status === 'cancelled' || o.status === 'no_show' ? 1 : 0),
    })
  }

  return {
    data: Array.from(byPlatform.entries()).map(([platform, v]) => ({ platform, ...v })),
  }
}

// ─── Rezervasyon İstatistikleri ──────────────────────────────────────────────

export async function fetchReservationStats(
  start: string,
  end: string
): Promise<ActionResult<ReservationStats>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  const { data, error } = await supabase
    .from('reservations')
    .select('status, party_size')
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) return { error: error.message }

  const rows = data ?? []
  const total = rows.length
  const completed = rows.filter((r) => r.status === 'completed').length
  const noShow = rows.filter((r) => r.status === 'no_show').length
  const cancelled = rows.filter((r) => r.status === 'cancelled').length
  const pending = rows.filter((r) => r.status === 'pending').length
  const seated = rows.filter((r) => r.status === 'seated').length
  const partySizes = rows.map((r) => r.party_size).filter((s): s is number => s !== null)
  const avgPartySize =
    partySizes.length > 0 ? partySizes.reduce((s, v) => s + v, 0) / partySizes.length : 0

  return { data: { total, completed, noShow, cancelled, pending, seated, avgPartySize } }
}

// ─── İkram (complimentary) özeti ────────────────────────────────────────────

export async function fetchComplimentarySummary(
  start: string,
  end: string
): Promise<ActionResult<ComplimentarySummary>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  const { data, error } = await supabase
    .from('order_items')
    .select('quantity, total_price, orders!inner(status, created_at)')
    .eq('orders.status', 'completed')
    .gte('orders.created_at', from)
    .lte('orders.created_at', to)
    .eq('is_complimentary', true)

  if (error) return { error: error.message }

  const items = data ?? []
  const lineCount = items.length
  const totalQuantity = items.reduce((s, row) => s + (row.quantity ?? 0), 0)
  const listValueTry = items.reduce((s, row) => s + (row.total_price ?? 0), 0)

  return { data: { lineCount, totalQuantity, listValueTry } }
}

// ─── Sipariş durumu özeti (dönem içi oluşturulan siparişler) ─────────────────

export async function fetchOrderOutcomeStats(
  start: string,
  end: string
): Promise<ActionResult<OrderOutcomeStats>> {
  const accessError = await ensureReportsAccess()
  if (accessError) return { error: accessError }
  const supabase = createAdminClient()
  const { from, to } = toUtcRange(start, end)

  const { data, error } = await supabase
    .from('orders')
    .select('status, total_amount')
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) return { error: error.message }

  const rows = data ?? []
  let active = 0
  let completed = 0
  let cancelled = 0
  let noShow = 0
  let completedRevenue = 0

  for (const o of rows) {
    if (o.status === 'active') active += 1
    else if (o.status === 'completed') {
      completed += 1
      completedRevenue += o.total_amount ?? 0
    } else if (o.status === 'cancelled') cancelled += 1
    else if (o.status === 'no_show') noShow += 1
  }

  return { data: { active, completed, cancelled, noShow, completedRevenue } }
}
