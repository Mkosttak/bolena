'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchPlatformStats } from '@/app/[locale]/admin/reports/actions'
import type { PlatformType } from '@/types'
import { chartFillAt } from '@/lib/utils/chart-colors'

const PLATFORM_LABELS: Record<PlatformType, string> = {
  yemeksepeti: 'Yemeksepeti',
  getir: 'Getir',
  trendyol: 'Trendyol',
  courier: 'Kurye',
}

const PLATFORM_CHART_INDEX: Record<PlatformType, number> = {
  yemeksepeti: 0,
  getir: 1,
  trendyol: 2,
  courier: 3,
}

interface PlatformCompareTableProps {
  dateRange: DateRange
}

export function PlatformCompareTable({ dateRange }: PlatformCompareTableProps) {
  const t = useTranslations('reports')

  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.platforms(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchPlatformStats(dateRange.start, dateRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const platforms =
    'data' in (data ?? {})
      ? (
          data as {
            data: {
              platform: PlatformType
              orderCount: number
              revenue: number
              cancelCount: number
            }[]
          }
        ).data
      : []

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{t('charts.platforms')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-44 w-full rounded-lg" />
        ) : platforms.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
            {t('noData')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 pr-4 font-medium">{t('labels.platform')}</th>
                  <th className="text-right py-2 pr-4 font-medium">{t('labels.orderCount')}</th>
                  <th className="text-right py-2 pr-4 font-medium">{t('labels.revenue')}</th>
                  <th className="text-right py-2 font-medium">{t('labels.cancelRate')}</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => {
                  const totalOrders = p.orderCount + p.cancelCount
                  const cancelRate =
                    totalOrders > 0 ? ((p.cancelCount / totalOrders) * 100).toFixed(1) : '0.0'

                  return (
                    <tr key={p.platform} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <Badge
                          variant="outline"
                          className="border font-medium text-foreground"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${chartFillAt(PLATFORM_CHART_INDEX[p.platform])} 16%, var(--card))`,
                            borderColor: `color-mix(in oklch, ${chartFillAt(PLATFORM_CHART_INDEX[p.platform])} 38%, var(--border))`,
                          }}
                        >
                          {PLATFORM_LABELS[p.platform]}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-right">{p.orderCount}</td>
                      <td className="py-2 pr-4 text-right font-semibold">
                        {formatCurrency(p.revenue)}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            parseFloat(cancelRate) > 10 ? 'text-destructive font-medium' : 'text-muted-foreground'
                          }
                        >
                          %{cancelRate}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
