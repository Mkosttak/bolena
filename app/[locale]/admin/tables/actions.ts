'use server'

import { createClient } from '@/lib/supabase/server'
import { tableSchema, tableCategorySchema } from '@/lib/validations/tables.schema'
import type { TableInput, TableCategoryInput } from '@/lib/validations/tables.schema'

export async function createTableCategory(input: TableCategoryInput) {
  const parsed = tableCategorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('table_categories').insert({
    name: parsed.data.name,
    sort_order: parsed.data.sort_order,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateTableCategory(id: string, input: TableCategoryInput) {
  const parsed = tableCategorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('table_categories')
    .update({ name: parsed.data.name, sort_order: parsed.data.sort_order })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteTableCategory(id: string) {
  const supabase = await createClient()

  const { count, error: countError } = await supabase
    .from('tables')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (countError) return { error: countError.message }
  if (count && count > 0) {
    return { error: 'Bu kategoride masalar bulunduğu için silinemez. Önce masaların kategorisini değiştirin.' }
  }

  const { error } = await supabase.from('table_categories').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function createTable(input: TableInput) {
  const parsed = tableSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('tables').insert({
    name: parsed.data.name,
    category_id: parsed.data.category_id ?? null,
    is_active: parsed.data.is_active,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateTable(id: string, input: TableInput) {
  const parsed = tableSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tables')
    .update({
      name: parsed.data.name,
      category_id: parsed.data.category_id ?? null,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteTable(id: string) {
  const supabase = await createClient()

  const { data: activeOrders, error: checkError } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', id)
    .eq('status', 'active')
    .limit(1)
  if (checkError) return { error: checkError.message }
  if (activeOrders && activeOrders.length > 0) {
    return { error: 'Bu masada aktif sipariş var. Önce siparişi kapatın.' }
  }

  const { error } = await supabase.from('tables').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function getOrCreateTableOrder(
  tableId: string
): Promise<{ orderId: string } | { error: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_or_create_table_order_atomic', {
    p_table_id: tableId,
  })

  if (error) return { error: error.message }
  if (!data) return { error: 'Sipariş oluşturulamadı' }

  return { orderId: data }
}

export async function transferTableOrder(sourceTableId: string, targetTableId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('transfer_table_order_atomic', {
    p_source_table_id: sourceTableId,
    p_target_table_id: targetTableId,
  })

  if (error) return { error: error.message }
  return { success: true }
}

// ── QR Sipariş Action'ları ──────────────────────────────────────────────────

export async function updateQrEnabled(tableId: string, enabled: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tables')
    .update({ qr_enabled: enabled })
    .eq('id', tableId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function regenerateQrTokenAction(tableId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('regenerate_qr_token', {
    p_table_id: tableId,
  })
  if (error) return { error: error.message }
  return { success: true, newToken: data as string }
}

export async function updateGlobalQrSetting(enabled: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('site_settings')
    .update({ value: { global_enabled: enabled } })
    .eq('key', 'qr_ordering')
  if (error) return { error: error.message }
  return { success: true }
}

