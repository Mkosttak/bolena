import { createClient } from '@/lib/supabase/client'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export interface DashboardData {
  tables: {
    active: number
    total: number
  }
  kds: {
    pending: number
    preparing: number // We map 'ready' or just keep it simple
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
  const todayStart = startOfDay(new Date()).toISOString()
  const todayEnd = endOfDay(new Date()).toISOString()
  const yesterdayStart = startOfDay(subDays(new Date(), 1)).toISOString()
  const yesterdayEnd = endOfDay(subDays(new Date(), 1)).toISOString()

  // 1. Masa Durumu
  const { count: totalTablesCount } = await supabase
    .from('tables')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { data: activeTableOrders } = await supabase
    .from('orders')
    .select('table_id')
    .eq('status', 'active')
    .not('table_id', 'is', null)

  const uniqueActiveTables = new Set(activeTableOrders?.map(o => o.table_id)).size

  // 2. KDS Durumu
  const { count: pendingKds } = await supabase
    .from('order_items')
    .select('id, orders!inner(status)', { count: 'exact', head: true })
    .eq('kds_status', 'pending')
    .gt('quantity', 0)
    .eq('orders.status', 'active')

  const { count: readyKds } = await supabase
    .from('order_items')
    .select('id, orders!inner(status)', { count: 'exact', head: true })
    .eq('kds_status', 'ready') // Assuming 'ready' is prepping or ready.
    .gt('quantity', 0)
    .eq('orders.status', 'active')

  // 3. Rezervasyonlar
  const { data: todayReservations } = await supabase
    .from('reservations')
    .select('status')
    .gte('reservation_date', todayStart)
    .lte('reservation_date', todayEnd)

  const upcomingReservations = todayReservations?.filter(r => r.status === 'confirmed').length || 0
  const seatedReservations = todayReservations?.filter(r => r.status === 'seated').length || 0

  // 4. Paket/Kurye Durumu
  const { count: activeCourierCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('type', 'delivery')

  const { count: completedCourierToday } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completed')
    .eq('type', 'delivery')
    .gte('completed_at', todayStart)
    .lte('completed_at', todayEnd)

  // 5. Ciro / Finansal Durum
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'completed')
    .gte('completed_at', todayStart)
    .lte('completed_at', todayEnd)

  const { data: yesterdayOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'completed')
    .gte('completed_at', yesterdayStart)
    .lte('completed_at', yesterdayEnd)

  const todayRevenue = todayOrders?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0
  const yesterdayRevenue = yesterdayOrders?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0
  const trend = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 100

  // 6. En Çok Satan 5 Ürün (Bugün)
  const { data: allOrderItems } = await supabase
    .from('order_items')
    .select('product_name_tr, quantity, orders!inner(status, completed_at)')
    .eq('orders.status', 'completed')
    .gte('orders.completed_at', todayStart)
    .lte('orders.completed_at', todayEnd)

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

  // 7. Bekleyen (Açık) Masa Cirosu (Expected Revenue)
  const { data: activeOrdersList } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'active')
  
  const expectedRevenue = activeOrdersList?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0

  // 8. Ödeme Dağılımı (Nakit vs Kart)
  const { data: paymentsToday } = await supabase
    .from('payments')
    .select('method, amount, orders!inner(created_at)')
    .gte('orders.created_at', todayStart)
    .lte('orders.created_at', todayEnd)

  const cash = paymentsToday?.filter(p => p.method === 'cash').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0
  const card = paymentsToday?.filter(p => p.method === 'card').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

  // 9. Son Hareketler (Recent Activity)
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, type, table_id, status, created_at, total_amount')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    tables: {
      active: uniqueActiveTables,
      total: totalTablesCount || 0
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
