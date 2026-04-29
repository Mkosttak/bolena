import type { OrderType, PlatformType, RemovedIngredient, SelectedExtra } from '@/types'

/** Bilinen platform sipariş kanalları (i18n `kds.platform.*` ile eşleşir). */
export function isKnownPlatformChannel(p: string): p is PlatformType {
  return p === 'yemeksepeti' || p === 'getir' || p === 'trendyol' || p === 'courier'
}

// =====================================================
// KDS (Mutfak/Bar Ekranı) — Pure Utility Functions
// =====================================================

export type UrgencyLevel = 'normal' | 'warning' | 'critical'

export interface KdsOrderItem {
  id: string
  order_id: string
  product_name_tr: string
  product_name_en: string
  quantity: number
  notes: string | null
  removed_ingredients: RemovedIngredient[]
  selected_extras: SelectedExtra[]
  is_complimentary: boolean
  kds_status: 'pending' | 'ready'
  created_at: string
  // Joined from orders table
  order_type: OrderType
  order_table_id: string | null
  order_customer_name: string | null
  order_platform: PlatformType | null
  order_notes: string | null
  order_created_at: string
  is_qr_order: boolean
  reservation_date?: string | null
  reservation_time?: string | null
}

export interface KdsGroup {
  id: string // synthetic: `${orderId}__${windowStart}`
  orderId: string
  orderType: OrderType
  tableId: string | null
  tableName: string | null
  customerName: string | null
  platform: PlatformType | null
  orderNotes: string | null
  itemIds: string[]
  items: KdsOrderItem[]
  windowStart: string // ISO of earliest item in group
  elapsedMinutes: number
  urgency: UrgencyLevel
  isQrOrder: boolean
  reservationDate?: string | null
  reservationTime?: string | null
}

export interface ProductionSummaryItem {
  productNameTr: string
  totalQuantity: number
}

/**
 * İki ISO timestamp arasındaki farkı dakika cinsinden döner.
 */
export function getElapsedMinutes(isoTimestamp: string): number {
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  return Math.floor((now - then) / 60000)
}

/**
 * Geçen süreye göre aciliyet seviyesini belirler.
 * normal: <10 dk | warning: 10-20 dk | critical: >20 dk
 */
export function getUrgencyLevel(elapsedMinutes: number): UrgencyLevel {
  if (elapsedMinutes >= 20) return 'critical'
  if (elapsedMinutes >= 10) return 'warning'
  return 'normal'
}

/**
 * Aynı siparişin kalemlerini zaman pencerelerine göre gruplar.
 * - Farklı order_id'ler → her zaman farklı grup
 * - Aynı order_id içinde: ardışık iki kalem arasındaki fark windowMs'i geçiyorsa → yeni grup
 *
 * @param items     Sıralı (created_at ASC) KDS kalemleri
 * @param windowMs  Gruplama zaman penceresi (varsayılan: 2 dakika)
 * @param tableNames  Masa id → ad eşlemesi (opsiyonel)
 */
export function groupItemsByTimeWindow(
  items: KdsOrderItem[],
  windowMs: number = 2 * 60 * 1000,
  tableNames: Record<string, string> = {}
): KdsGroup[] {
  if (items.length === 0) return []

  // order_id'ye göre grupla, her order için kendi listesi
  const byOrder = new Map<string, KdsOrderItem[]>()
  for (const item of items) {
    const existing = byOrder.get(item.order_id)
    if (existing) {
      existing.push(item)
    } else {
      byOrder.set(item.order_id, [item])
    }
  }

  const groups: KdsGroup[] = []

  for (const [orderId, orderItems] of byOrder) {
    // created_at'e göre sırala
    const sorted = [...orderItems].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    let currentGroup: KdsOrderItem[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const gap = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()

      if (gap > windowMs) {
        // Mevcut grubu kaydet, yeni grup başlat
        groups.push(buildGroup(orderId, currentGroup, tableNames))
        currentGroup = [curr]
      } else {
        currentGroup.push(curr)
      }
    }

    // Son grubu kaydet
    groups.push(buildGroup(orderId, currentGroup, tableNames))
  }

  // windowStart'a göre sırala (en eskiden en yeniye)
  return groups.sort((a, b) => {
    const timeA = new Date(a.windowStart).getTime()
    const timeB = new Date(b.windowStart).getTime()
    return timeA - timeB
  })
}

function buildGroup(
  orderId: string,
  items: KdsOrderItem[],
  tableNames: Record<string, string>
): KdsGroup {
  const first = items[0]
  const windowStart = first.created_at
  const elapsedMinutes = getElapsedMinutes(windowStart)

  return {
    id: `${orderId}__${windowStart}`,
    orderId,
    orderType: first.order_type,
    tableId: first.order_table_id,
    tableName: first.order_table_id ? (tableNames[first.order_table_id] ?? null) : null,
    customerName: first.order_customer_name,
    platform: first.order_platform,
    orderNotes: first.order_notes,
    itemIds: items.map((i) => i.id),
    items,
    windowStart,
    elapsedMinutes,
    urgency: getUrgencyLevel(elapsedMinutes),
    isQrOrder: items.some((i) => i.is_qr_order),
    reservationDate: first.reservation_date ?? null,
    reservationTime: first.reservation_time ?? null,
  }
}

/**
 * QR sipariş kalemlerini ürün başına ayrı gruplar halinde döner.
 * Her kalem kendi kartında gösterilir (ürün bazlı KDS görünümü).
 */
export function groupQrItemsPerProduct(
  items: KdsOrderItem[],
  tableNames: Record<string, string> = {}
): KdsGroup[] {
  const qrItems = items.filter((i) => i.is_qr_order)
  if (qrItems.length === 0) return []

  return qrItems
    .map((item): KdsGroup => {
      const elapsedMinutes = getElapsedMinutes(item.created_at)
      return {
        id: `qr__${item.id}`,
        orderId: item.order_id,
        orderType: item.order_type,
        tableId: item.order_table_id,
        tableName: item.order_table_id ? (tableNames[item.order_table_id] ?? null) : null,
        customerName: item.order_customer_name,
        platform: item.order_platform,
        orderNotes: item.order_notes,
        itemIds: [item.id],
        items: [item],
        windowStart: item.created_at,
        elapsedMinutes,
        urgency: getUrgencyLevel(elapsedMinutes),
        isQrOrder: true,
        reservationDate: item.reservation_date ?? null,
        reservationTime: item.reservation_time ?? null,
      }
    })
    .sort((a, b) => new Date(a.windowStart).getTime() - new Date(b.windowStart).getTime())
}

/**
 * Yeni eklenen `order_items` satırının ait olduğu KDS zaman penceresi grubunu bulur.
 * Aynı açık siparişteki eski kalemler başka pencerelerde kalır; bildirimde yalnızca bu “parti” görünür.
 */
export function findKdsGroupContainingOrderItem(
  groups: KdsGroup[],
  orderId: string,
  orderItemId: string
): KdsGroup | undefined {
  return groups.find(
    (g) => g.orderId === orderId && g.items.some((item) => item.id === orderItemId)
  )
}

/**
 * Tüm KDS gruplarındaki aynı ürünleri toplar (üretim özeti için).
 * quantity=0 (iptal) kalemleri hariç tutulur.
 * Azalan adet sırasıyla döner.
 */
/** Sipariş oluşturulduktan sonra tamamlanmaya kadar geçen süre (dakika). */
export function orderLeadTimeMinutes(order: {
  created_at: string
  completed_at: string | null
}): number | null {
  if (!order.completed_at) return null
  const start = new Date(order.created_at).getTime()
  const end = new Date(order.completed_at).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
  return Math.round((end - start) / 60000)
}

/** Kalem eklenme anından sipariş kapanışına kadar (dakika). */
export function itemLeadTimeMinutes(
  item: { created_at?: string },
  orderCompletedAt: string | null
): number | null {
  if (!orderCompletedAt || !item.created_at) return null
  const start = new Date(item.created_at).getTime()
  const end = new Date(orderCompletedAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
  return Math.round((end - start) / 60000)
}

export function buildProductionSummary(groups: KdsGroup[]): ProductionSummaryItem[] {
  const totals = new Map<string, number>()

  for (const group of groups) {
    for (const item of group.items) {
      if (item.quantity <= 0) continue
      const existing = totals.get(item.product_name_tr) ?? 0
      totals.set(item.product_name_tr, existing + item.quantity)
    }
  }

  return Array.from(totals.entries())
    .map(([productNameTr, totalQuantity]) => ({ productNameTr, totalQuantity }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
}
