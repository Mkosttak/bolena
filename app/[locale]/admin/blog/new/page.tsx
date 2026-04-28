import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/utils/server-guard'
import { BlogForm } from '@/components/modules/blog/BlogForm'

interface NewBlogPageProps {
  params: Promise<{ locale: string }>
}

export default async function NewBlogPage({ params }: NewBlogPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  await requireModuleAccess(supabase, user.id, 'blog', locale)

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 px-3 pb-10 pt-3 sm:px-5 sm:pb-12 sm:pt-4 lg:px-8">
      <BlogForm locale={locale} />
    </div>
  )
}
