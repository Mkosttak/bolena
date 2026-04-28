import { createClient } from '@/lib/supabase/client'
import type { Category, Product } from '@/types'

export const menuKeys = {
  all: ['menu'] as const,
  categories: () => [...menuKeys.all, 'categories'] as const,
  products: () => [...menuKeys.all, 'products'] as const,
  productsByCategory: (categoryId: string | null) =>
    [...menuKeys.products(), 'category', categoryId] as const,
  product: (id: string) => [...menuKeys.products(), id] as const,
}

export async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Category[]
}

export async function fetchProducts(categoryId?: string | null): Promise<Product[]> {
  const supabase = createClient()
  const query = supabase
    .from('products')
    .select('*, categories(name_tr, name_en), product_ingredients(*), extra_groups(id, name_tr, name_en, is_required)')
    .order('sort_order', { ascending: true })
    .order('name_tr', { ascending: true })

  const { data, error } = categoryId
    ? await query.eq('category_id', categoryId)
    : await query

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Product[]
}

export async function fetchAvailableProducts(categoryId?: string | null): Promise<Product[]> {
  const supabase = createClient()
  // track_stock=true olan ürünler stok bitince is_available=false olur ama menüde "Tükendi" olarak gösterilmeli
  const query = supabase
    .from('products')
    .select('*, product_ingredients(*), extra_groups(id, is_required)')
    .eq('is_visible', true)
    .or('is_available.eq.true,track_stock.eq.true')
    .order('sort_order', { ascending: true })
    .order('name_tr', { ascending: true })

  const { data, error } = categoryId
    ? await query.eq('category_id', categoryId)
    : await query

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Product[]
}

export async function fetchProductForOrder(productId: string): Promise<{
  product: Product & { product_ingredients: import('@/types').ProductIngredient[] }
  extraGroups: import('@/types').ExtraGroup[]
}> {
  const supabase = createClient()

  const [{ data: product, error }, { data: extraGroups }] = await Promise.all([
    supabase
      .from('products')
      .select('*, product_ingredients(*)')
      .eq('id', productId)
      .single(),
    supabase
      .from('extra_groups')
      .select('*, extra_options(*)')
      .eq('product_id', productId)
      .order('created_at', { ascending: true }),
  ])

  if (error) throw new Error(error.message)

  return {
    product: product as never,
    extraGroups: (extraGroups ?? []) as unknown as import('@/types').ExtraGroup[],
  }
}

export async function fetchProduct(id: string): Promise<Product> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, product_ingredients(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as Product
}
