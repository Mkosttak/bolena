'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchComplimentarySummary } from '@/app/[locale]/admin/reports/actions'

interface ComplimentaryStatsProps {
  dateRange: DateRange
}

export function ComplimentaryStats({ dateRange }: ComplimentaryStatsProps) {
  const t = useTranslations('reports')

  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.complimentary(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchComplimentarySummary(dateRange.start, dateRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const summary = data && 'data' in data ? data.data : null

  return (
    <Card className="border-dashed border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent dark:border-primary/35 dark:from-primary/[0.12]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" aria-hidden />
          <CardTitle className="text-sm font-semibold">{t('charts.complimentary')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : !summary || summary.lineCount === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('noData')}</p>
        ) : (
          <dl className="grid grid-cols-3 gap-3 text-center sm:text-left">
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t('labels.complimentaryLines')}
              </dt>
              <dd className="text-lg font-semibold tabular-nums">{summary.lineCount}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t('labels.quantity')}
              </dt>
              <dd className="text-lg font-semibold tabular-nums">{summary.totalQuantity}</dd>
            </div>
            <div className="sm:col-span-1 col-span-3">
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t('labels.complimentaryListValue')}
              </dt>
              <dd className="text-lg font-semibold tabular-nums">{formatCurrency(summary.listValueTry)}</dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
