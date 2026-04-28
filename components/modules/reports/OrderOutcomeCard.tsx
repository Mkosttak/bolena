'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchOrderOutcomeStats } from '@/app/[locale]/admin/reports/actions'

interface OrderOutcomeCardProps {
  dateRange: DateRange
}

export function OrderOutcomeCard({ dateRange }: OrderOutcomeCardProps) {
  const t = useTranslations('reports')

  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.orderOutcomes(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchOrderOutcomeStats(dateRange.start, dateRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const s = data && 'data' in data ? data.data : null
  const total =
    s !== null ? s.active + s.completed + s.cancelled + s.noShow : 0

  const rows: { labelKey: string; value: number; className?: string }[] = s
    ? [
        { labelKey: 'activeOrders', value: s.active, className: 'text-sky-600' },
        { labelKey: 'completedOrders', value: s.completed, className: 'text-emerald-600' },
        { labelKey: 'cancelledOrders', value: s.cancelled, className: 'text-amber-600' },
        { labelKey: 'noShowOrders', value: s.noShow, className: 'text-red-500' },
      ]
    : []

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden />
          <CardTitle className="text-sm font-semibold">{t('charts.orderOutcomes')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-lg" />
        ) : !s || total === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t('noData')}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {rows.map((row) => (
                <div
                  key={row.labelKey}
                  className="flex min-w-[5.5rem] flex-1 flex-col rounded-lg border bg-muted/30 px-3 py-2"
                >
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {t(`labels.${row.labelKey}`)}
                  </span>
                  <span className={`text-lg font-bold tabular-nums ${row.className ?? ''}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">{t('labels.completedRevenue')}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(s.completedRevenue)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
