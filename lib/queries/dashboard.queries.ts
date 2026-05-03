import { createClient } from '@/lib/supabase/client'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export interface DashboardData {
  tables: {
    active: number
    total: number
  }
  kds: {
    pending: number
    preparing: number
  }
  reservations: {
    upcoming: number
    seated: number
  }
  courier: {
    onTheWay: number
    deliveredInfo: number
  }
  revenue: {
    today: number
    yesterday: number
    trend: number
    todayOrderCount: number
    yesterdayOrderCount: number
  }
  topProducts: {
    name: string
    quantity: number
  }[]
  expectedRevenue: number
  paymentSplits: {
    cash: number
    card: number
  }
  recentActivity: {
    id: string
    type: string
    table_id: string | null
    status: string
    created_at: string
    total_amount: number | null
  }[]
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  pulse: () => [...dashboardKeys.all, 'pulse'] as const,
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createClient()
  const now = new Date()
  const todayStart = startOfDay(now).toISOString()
  const todayEnd = endOfDay(now).toISOString()
  const yesterdayStart = startOfDay(subDays(now, 1)).toISOString()
  const yesterdayEnd = endOfDay(subDays(now, 1)).toISOString()

  // Tüm bağımsız sorgular paralel — tek network round-trip
  const [
    { count: totalTablesCount },
    { data: activeTableOrders },
    { count: pendingKds },
    { count: readyKds },
    { data: todayReservations },
    { count: activeCourierCount },
    { count: completedCourierToday },
    { data: todayOrders },
    { data: yesterdayOrders },
    { data: allOrderItems },
    { data: activeOrdersList },
    { data: paymentsToday },
    { data: recentOrders },
  ] = await Promise.all([
    // 1. Toplam aktif masa sayısı
    supabase
      .from('tables')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),

    // 2. Aktif masa siparişleri (unique masa sayısı için)
    // tables INNER JOIN + is_active=true: pasif masaya bağlı eski/orphan
    // siparişler sayılmasın (uniqueActiveTables > total fallacy'sini önler).
    supabase
      .from('orders')
      .select('table_id, tables!inner(is_active)')
      .eq('status', 'active')
      .not('table_id', 'is', null)
      .eq('tables.is_active', true),

    // 3. KDS bekleyen
    supabase
      .from('order_items')
      .select('id, orders!inner(status)', { count: 'exact', head: true })
      .eq('kds_status', 'pending')
      .gt('quantity', 0)
      .eq('orders.status', 'active'),

    // 4. KDS hazır
    supabase
      .from('order_items')
      .select('id, orders!inner(status)', { count: 'exact', head: true })
      .eq('kds_status', 'ready')
      .gt('quantity', 0)
      .eq('orders.status', 'active'),

    // 5. Bugünkü rezervasyonlar
    supabase
      .from('reservations')
      .select('status')
      .gte('reservation_date', todayStart)
      .lte('reservation_date', todayEnd),

    // 6. Aktif kurye siparişleri
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('type', 'delivery'),

    // 7. Bugün tamamlanan kurye siparişleri
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .eq('type', 'delivery')
      .gte('completed_at', todayStart)
      .lte('completed_at', todayEnd),

    // 8. Bugünkü ciro
    supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('completed_at', todayStart)
      .lte('completed_at', todayEnd),

    // 9. Dünkü ciro
    supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('completed_at', yesterdayStart)
      .lte('completed_at', yesterdayEnd),

    // 10. En çok satan ürünler
    supabase
      .from('order_items')
      .select('product_name_tr, quantity, orders!inner(status, completed_at)')
      .eq('orders.status', 'completed')
      .gte('orders.completed_at', todayStart)
      .lte('orders.completed_at', todayEnd),

    // 11. Açık masa cirosu (beklenen gelir)
    supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'active'),

    // 12. Ödeme dağılımı
    supabase
      .from('payments')
      .select('method, amount, orders!inner(created_at)')
      .gte('orders.created_at', todayStart)
      .lte('orders.created_at', todayEnd),

    // 13. Son hareketler
    supabase
      .from('orders')
      .select('id, type, table_id, status, created_at, total_amount')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // — Hesaplamalar —
  // Defensive: aynı masada birden fazla aktif order varsa Set ile distinct.
  // null table_id'ler zaten query'de filtrelendi ama tip safety için filter.
  const uniqueActiveTables = new Set(
    (activeTableOrders ?? [])
      .map((o) => o.table_id)
      .filter((id): id is string => typeof id === 'string'),
  ).size

  // Defansif clamping: aktif sayı total'dan buyuk olamaz (RLS / data drift edge)
  const totalTablesActive = totalTablesCount ?? 0
  const tablesActiveClamped = Math.min(uniqueActiveTables, totalTablesActive)

  const upcomingReservations = todayReservations?.filter(r => r.status === 'confirmed').length || 0
  const seatedReservations = todayReservations?.filter(r => r.status === 'seated').length || 0

  const todayRevenue = todayOrders?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0
  const yesterdayRevenue = yesterdayOrders?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0
  const trend = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 100

  const productMap = new Map<string, number>()
  if (allOrderItems) {
    allOrderItems.forEach((item) => {
      const name = item.product_name_tr?.trim() || ''
      productMap.set(name, (productMap.get(name) || 0) + item.quantity)
    })
  }
  const topProducts = Array.from(productMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const expectedRevenue = activeOrdersList?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0

  const cash = paymentsToday?.filter(p => p.method === 'cash').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0
  const card = paymentsToday?.filter(p => p.method === 'card').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

  return {
    tables: {
      active: tablesActiveClamped,
      total: totalTablesActive,
    },
    kds: {
      pending: pendingKds || 0,
      preparing: readyKds || 0
    },
    reservations: {
      upcoming: upcomingReservations,
      seated: seatedReservations
    },
    courier: {
      onTheWay: activeCourierCount || 0,
      deliveredInfo: completedCourierToday || 0
    },
    revenue: {
      today: todayRevenue,
      yesterday: yesterdayRevenue,
      trend,
      todayOrderCount: todayOrders?.length || 0,
      yesterdayOrderCount: yesterdayOrders?.length || 0
    },
    topProducts,
    expectedRevenue,
    paymentSplits: {
      cash,
      card
    },
    recentActivity: recentOrders || []
  }
}
