'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchReservationStats } from '@/app/[locale]/admin/reports/actions'
import { CHART_COLORS } from '@/lib/utils/chart-colors'

interface ReservationStatsProps {
  dateRange: DateRange
}

export function ReservationStats({ dateRange }: ReservationStatsProps) {
  const t = useTranslations('reports')

  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.reservationStats(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchReservationStats(dateRange.start, dateRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const stats =
    'data' in (data ?? {})
      ? (
          data as {
            data: {
              total: number
              completed: number
              noShow: number
              cancelled: number
              pending: number
              seated: number
              avgPartySize: number
            }
          }
        ).data
      : null

  const pieData = stats
    ? [
        { name: t('labels.reservationPending'), value: stats.pending },
        { name: t('labels.reservationSeated'), value: stats.seated },
        { name: t('labels.completed'), value: stats.completed },
        { name: t('labels.noShow'), value: stats.noShow },
        { name: t('labels.cancelled'), value: stats.cancelled },
      ].filter((d) => d.value > 0)
    : []

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{t('charts.reservationStats')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-44 w-full rounded-lg" />
        ) : !stats || stats.total === 0 ? (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
            {t('noData')}
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width={140} height={140} className="mx-auto sm:mx-0 shrink-0">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                  {pieData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                  </Pie>
                  <Tooltip formatter={(value: unknown, name: unknown) => [Number(value ?? 0), String(name)]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="mx-auto flex h-[140px] w-[140px] shrink-0 items-center justify-center rounded-full border border-dashed text-center text-xs text-muted-foreground px-2">
                {t('reservationNoPie')}
              </div>
            )}

            <div className="flex-1 space-y-2 text-sm min-w-0">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t('labels.reservationTotal')}</span>
                <span className="font-semibold tabular-nums">{stats.total}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t('labels.reservationPending')}</span>
                <span className="font-semibold tabular-nums text-slate-600">{stats.pending}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t('labels.reservationSeated')}</span>
                <span className="font-semibold tabular-nums text-blue-600">{stats.seated}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t('labels.completed')}</span>
                <span className="font-semibold tabular-nums text-emerald-600">{stats.completed}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t('labels.noShow')}</span>
                <span className="font-semibold tabular-nums text-red-500">{stats.noShow}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t('labels.cancelled')}</span>
                <span className="font-semibold tabular-nums text-amber-600">{stats.cancelled}</span>
              </div>
              <div className="flex justify-between gap-2 border-t pt-2">
                <span className="text-muted-foreground">{t('labels.avgPartySize')}</span>
                <span className="font-semibold tabular-nums">{stats.avgPartySize.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
