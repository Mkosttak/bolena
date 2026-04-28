'use server'

import { createClient } from '@/lib/supabase/server'
import { categorySchema, productSchema } from '@/lib/validations/menu.schema'
import type { CategoryInput, ProductInput } from '@/lib/validations/menu.schema'
import { extraGroupSchema, extraOptionSchema } from '@/lib/validations/extras.schema'
import type { ExtraGroupInput, ExtraOptionInput } from '@/lib/validations/extras.schema'

// ─── Category Actions ────────────────────────────────────────────────────────

export async function createCategory(input: CategoryInput) {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').insert({
    name_tr: parsed.data.name_tr,
    name_en: parsed.data.name_en,
    sort_order: parsed.data.sort_order,
    is_active: parsed.data.is_active,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateCategory(id: string, input: CategoryInput) {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .update({
      name_tr: parsed.data.name_tr,
      name_en: parsed.data.name_en,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { data: products, error: checkError } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', id)
    .limit(1)
  if (checkError) return { error: checkError.message }
  if (products && products.length > 0) {
    return { error: 'Bu kategoride ürünler var. Önce ürünleri başka kategoriye taşıyın.' }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateCategoriesOrder(orders: { id: string, sort_order: number }[]) {
  const supabase = await createClient()

  // In a real scenarios with many categories, we might use a more optimized RPC or a custom query.
  // For standard menus, updating each is fine.
  for (const item of orders) {
    const { error } = await supabase
      .from('categories')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
    if (error) return { error: error.message }
  }

  return { success: true }
}

// ─── Product Actions ─────────────────────────────────────────────────────────

export async function createProduct(input: ProductInput) {
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert({
      category_id: parsed.data.category_id,
      name_tr: parsed.data.name_tr,
      name_en: parsed.data.name_en,
      description_tr: parsed.data.description_tr ?? null,
      description_en: parsed.data.description_en ?? null,
      image_url: parsed.data.image_url ?? null,
      price: parsed.data.price,
      campaign_price: parsed.data.campaign_price ?? null,
      campaign_end_date: parsed.data.campaign_end_date ?? null,
      allergens_tr: parsed.data.allergens_tr ?? null,
      allergens_en: parsed.data.allergens_en ?? null,
      is_available: parsed.data.is_available,
      is_featured: parsed.data.is_featured,
      is_visible: parsed.data.is_visible,
      track_stock: parsed.data.track_stock,
      stock_count: parsed.data.track_stock ? (parsed.data.stock_count ?? 0) : null,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  const productId = data.id

  if (parsed.data.ingredients.length > 0) {
    const { error: ingErr } = await supabase.from('product_ingredients').insert(
      parsed.data.ingredients.map((ing, idx) => ({
        product_id: productId,
        name_tr: ing.name_tr,
        name_en: ing.name_en,
        is_removable: ing.is_removable,
        sort_order: idx,
      }))
    )
    if (ingErr) return { error: ingErr.message }
  }

  return { success: true, productId }
}

export async function updateProduct(id: string, input: ProductInput) {
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({
      category_id: parsed.data.category_id,
      name_tr: parsed.data.name_tr,
      name_en: parsed.data.name_en,
      description_tr: parsed.data.description_tr ?? null,
      description_en: parsed.data.description_en ?? null,
      image_url: parsed.data.image_url ?? null,
      price: parsed.data.price,
      campaign_price: parsed.data.campaign_price ?? null,
      campaign_end_date: parsed.data.campaign_end_date ?? null,
      allergens_tr: parsed.data.allergens_tr ?? null,
      allergens_en: parsed.data.allergens_en ?? null,
      is_available: parsed.data.is_available,
      is_featured: parsed.data.is_featured,
      is_visible: parsed.data.is_visible,
      track_stock: parsed.data.track_stock,
      stock_count: parsed.data.track_stock ? (parsed.data.stock_count ?? 0) : null,
    })
    .eq('id', id)
  if (error) return { error: error.message }

  // Güvenli ingredient güncelleme: önce yeni kayıtları upsert et, sonra kaldırılanları sil
  if (parsed.data.ingredients.length > 0) {
    const { error: upsertErr } = await supabase.from('product_ingredients').upsert(
      parsed.data.ingredients.map((ing, idx) => ({
        ...(ing.id ? { id: ing.id } : {}),
        product_id: id,
        name_tr: ing.name_tr,
        name_en: ing.name_en,
        is_removable: ing.is_removable,
        sort_order: idx,
      }))
    )
    if (upsertErr) return { error: upsertErr.message }
    const keepIds = parsed.data.ingredients.filter((i) => i.id).map((i) => i.id!)
    if (keepIds.length > 0) {
      await supabase
        .from('product_ingredients')
        .delete()
        .eq('product_id', id)
        .not('id', 'in', `(${keepIds.map((k) => `'${k}'`).join(',')})`)
    }
  } else {
    await supabase.from('product_ingredients').delete().eq('product_id', id)
  }

  return { success: true }
}

export async function toggleProductField(
  id: string,
  field: 'is_available' | 'is_visible' | 'is_featured',
  value: boolean
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ [field]: value })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  // K-11: Ürün fiziksel silinmez — is_visible = false (geçmiş siparişlerde FK ihlali önlenir)
  const { error } = await supabase
    .from('products')
    .update({ is_visible: false })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateProductsOrder(orders: { id: string; sort_order: number }[]) {
  const supabase = await createClient()
  for (const item of orders) {
    const { error } = await supabase
      .from('products')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
    if (error) return { error: error.message }
  }
  return { success: true }
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ─── Extra Group Actions ─────────────────────────────────────────────────────

export async function createExtraGroup(productId: string, input: ExtraGroupInput) {
  const parsed = extraGroupSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('extra_groups')
    .insert({ product_id: productId, ...parsed.data })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { success: true, groupId: data.id }
}

export async function updateExtraGroup(id: string, input: ExtraGroupInput) {
  const parsed = extraGroupSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('extra_groups')
    .update(parsed.data)
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteExtraGroup(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('extra_groups').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ─── Extra Option Actions ────────────────────────────────────────────────────

export async function createExtraOption(groupId: string, input: ExtraOptionInput) {
  const parsed = extraOptionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('extra_options').insert({
    group_id: groupId,
    ...parsed.data,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateExtraOption(id: string, input: ExtraOptionInput) {
  const parsed = extraOptionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('extra_options')
    .update(parsed.data)
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteExtraOption(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('extra_options').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleExtraOptionActive(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('extra_options')
    .update({ is_active: !isActive })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

