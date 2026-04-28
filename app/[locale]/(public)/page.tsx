import { getTranslations } from 'next-intl/server'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { isOpen, getWorkingHoursForDate } from '@/lib/utils/date.utils'
import type { WorkingHours, WorkingHoursException } from '@/lib/utils/date.utils'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { HomeLanding } from '@/components/modules/home/HomeLanding'

export const dynamic = 'force-dynamic'

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  const tNav = await getTranslations('nav')

  const supabase = await createClient()
  const now = new Date()

  const [{ data: wh }, { data: ex }] = await Promise.all([
    supabase.from('working_hours').select('*').order('day_of_week'),
    supabase
      .from('working_hours_exceptions')
      .select('*')
      .gte('date', format(now, 'yyyy-MM-dd'))
      .order('date'),
  ])

  const weeklyHours = (wh ?? []) as WorkingHours[]
  const exceptions = (ex ?? []) as WorkingHoursException[]
  const openNow = isOpen(now, format(now, 'HH:mm'), weeklyHours, exceptions)
  const todayEntry = getWorkingHoursForDate(now, weeklyHours, exceptions)
  const todayHoursLabel =
    todayEntry?.is_open && todayEntry.open_time && todayEntry.close_time
      ? `${todayEntry.open_time} – ${todayEntry.close_time}`
      : null

  return (
    <div style={{ background: '#FAF8F2', minHeight: '100vh' }}>
      <PublicNavbar
        locale={locale}
        menuLabel={tNav('menu')}
        contactLabel={tNav('contact')}
        blogLabel={tNav('blog')}
      />
      <main>
        <HomeLanding locale={locale} openNow={openNow} todayHoursLabel={todayHoursLabel} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}
