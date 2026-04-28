'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDateLabel, type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchDailyRevenue } from '@/app/[locale]/admin/reports/actions'
import { CHART_COLORS, chartTooltipStyle, chartGridStroke, chartTickFill } from '@/lib/utils/chart-colors'
import { useTheme } from 'next-themes'

interface RevenueChartProps {
  dateRange: DateRange
}

type ChartMode = 'revenue' | 'orderCount'

export function RevenueChart({ dateRange }: RevenueChartProps) {
  const t = useTranslations('reports')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [mode, setMode] = useState<ChartMode>('revenue')

  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.dailyRevenue(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchDailyRevenue(dateRange.start, dateRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const points =
    'data' in (data ?? {})
      ? (data as { data: { date: string; revenue: number; orderCount: number }[] }).data.map(
          (p) => ({
            ...p,
            label: formatDateLabel(p.date, dateRange.key),
          })
        )
      : []

  const isSingleDay = dateRange.start === dateRange.end

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <div className="w-1.5 h-4 bg-primary rounded-full" />
            {isSingleDay 
              ? (mode === 'revenue' ? t('charts.hourlyRevenue') : t('charts.hourlyOrders'))
              : (mode === 'revenue' ? t('charts.dailyRevenue') : t('charts.dailyOrders'))
            }
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={mode === 'revenue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('revenue')}
            >
              {t('labels.revenue')}
            </Button>
            <Button
              variant={mode === 'orderCount' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('orderCount')}
            >
              {t('labels.orderCount')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : points.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            {t('noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            {isSingleDay ? (
              <BarChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke(isDark)} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: chartTickFill(isDark) }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartTickFill(isDark) }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={mode === 'revenue' ? (v: number) => `₺${(v / 1000).toFixed(0)}k` : undefined}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle(isDark).contentStyle}
                  itemStyle={chartTooltipStyle(isDark).itemStyle}
                  formatter={(value: unknown) => {
                    const v = Number(value ?? 0)
                    return mode === 'revenue'
                      ? [formatCurrency(v), t('labels.revenue')]
                      : [v, t('labels.orderCount')]
                  }}
                />
                <Bar
                  dataKey={mode}
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke(isDark)} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: chartTickFill(isDark) }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartTickFill(isDark) }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={mode === 'revenue' ? (v: number) => `₺${(v / 1000).toFixed(0)}k` : undefined}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle(isDark).contentStyle}
                  itemStyle={chartTooltipStyle(isDark).itemStyle}
                  formatter={(value: unknown) => {
                    const v = Number(value ?? 0)
                    return mode === 'revenue'
                      ? [formatCurrency(v), t('labels.revenue')]
                      : [v, t('labels.orderCount')]
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={mode}
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: CHART_COLORS[0],
                    stroke: 'var(--card)',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
