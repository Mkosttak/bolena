import { createClient } from '@/lib/supabase/client'
import type { Category, Product, TableWithQr } from '@/types'
import { mapRowToFullOrder, type FullOrder } from './orders.queries'

export const qrKeys = {
  all: ['qr'] as const,
  table: (token: string) => [...qrKeys.all, 'table', token] as const,
  order: (token: string) => [...qrKeys.all, 'order', token] as const,
  menu: (token: string) => [...qrKeys.all, 'menu', token] as const,
}

export interface QrMenuData {
  categories: Category[]
  products: Product[]
}

/** QR token ile masa bilgisini getir (anon RLS ile çalışır) */
export async function fetchQrTable(token: string): Promise<TableWithQr | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_table_by_qr_token', { p_qr_token: token })
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  // qr_token ve qr_enabled client'ta biliniyor; DB'den sadece id+name+qr_enabled dönüyor
  return { ...(data as { id: string; name: string; qr_enabled: boolean }), qr_token: token } as TableWithQr
}

/**
 * Yalnızca token biliniyorsa (orderId yok) — masa RPC + aktif sipariş.
 * QR sayfasında `orderId` biliniyorsa `fetchFullOrder(orderId)` kullanın; gereksiz RPC yapmaz.
 */
export async function fetchQrOrder(token: string): Promise<FullOrder | null> {
  const supabase = createClient()
  const tableData = await fetchQrTable(token)
  if (!tableData) return null

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*, order_items(*), payments(*)')
    .eq('table_id', tableData.id)
    .eq('status', 'active')
    .maybeSingle()

  if (orderError) throw new Error(orderError.message)
  return mapRowToFullOrder(orderData)
}

/** QR menü verisi: kategoriler + ürünler (extra_groups dahil) */
export async function fetchQrMenuData(token: string): Promise<QrMenuData> {
  const supabase = createClient()

  // Token geçerliyse anon RLS kategorilere erişime izin verir
  const [catResult, prodResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select(`
        *,
        categories(id, name_tr, name_en),
        product_ingredients(*),
        extra_groups(*, extra_options(*))
      `)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
  ])

  if (catResult.error) throw new Error(catResult.error.message)
  if (prodResult.error) throw new Error(prodResult.error.message)

  return {
    categories: (catResult.data ?? []) as Category[],
    products: (prodResult.data ?? []) as unknown as Product[],
  }
}
