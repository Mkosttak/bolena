import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { ProductForm } from '@/components/modules/menu/ProductForm'
import type { Product, ProductIngredient } from '@/types'

interface EditProductPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'menu', locale)

  const { data: productData, error } = await supabase
    .from('products')
    .select('*, product_ingredients(*)')
    .eq('id', id)
    .single()

  if (error || !productData) notFound()

  const product = productData as Product & { product_ingredients: ProductIngredient[] }

  return (
    <div className="p-6">
      <ProductForm locale={locale} product={product} />
    </div>
  )
}
