import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { ProductForm } from '@/components/modules/menu/ProductForm'

interface NewProductPageProps {
  params: Promise<{ locale: string }>
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'menu', locale)

  return (
    <div className="p-6">
      <ProductForm locale={locale} />
    </div>
  )
}
