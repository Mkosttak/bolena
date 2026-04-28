import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { ChartPie, Table as TableIcon } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchOrderTypeBreakdown } from '@/app/[locale]/admin/reports/actions'
import { CHART_COLORS, chartLegendStyle, chartTooltipStyle } from '@/lib/utils/chart-colors'

interface OrderTypeChartProps {
  dateRange: DateRange
}

export function OrderTypeChart({ dateRange }: OrderTypeChartProps) {
  const t = useTranslations('reports')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.orderTypes(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchOrderTypeBreakdown(dateRange.start, dateRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const labelMap: Record<string, string> = {
    table: t('labels.table'),
    reservation: t('labels.reservation'),
    takeaway: t('labels.takeaway'),
    platform: t('labels.platform'),
    yemeksepeti: 'Yemeksepeti',
    getir: 'Getir',
    trendyol: 'Trendyol',
    courier: 'Kurye',
  }

  const points =
    'data' in (data ?? {})
      ? (
          data as {
            data: { type: string; count: number; revenue: number }[]
          }
        ).data.map((p) => ({
          name: labelMap[p.type] ?? p.type,
          value: p.count,
          revenue: p.revenue,
          type: p.type,
        }))
      : []

  const totalRevenue = points.reduce((sum, p) => sum + p.revenue, 0)
  const tooltipStyle = chartTooltipStyle(isDark)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{t('charts.orderTypes')}</CardTitle>
          <div className="flex bg-muted rounded-md p-0.5">
            <Button
              variant={view === 'chart' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setView('chart')}
              title={t('labels.showChart')}
            >
              <ChartPie className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setView('table')}
              title={t('labels.showTable')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56 w-full rounded-lg" />
        ) : points.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            {t('noData')}
          </div>
        ) : view === 'chart' ? (
          <div className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={points}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {points.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle.contentStyle}
                  itemStyle={tooltipStyle.itemStyle}
                  formatter={(value: unknown, name: unknown, props: { payload?: { revenue?: number } }) => [
                    `${Number(value ?? 0)} sipariş — ${formatCurrency(props.payload?.revenue ?? 0)}`,
                    String(name),
                  ]}
                />
                <Legend iconSize={10} iconType="circle" wrapperStyle={chartLegendStyle()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[220px]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">{t('labels.platform')} / Tip</th>
                  <th className="text-right py-2">{t('labels.orderCount')}</th>
                  <th className="text-right py-2">{t('labels.revenue')}</th>
                  <th className="text-right py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 font-medium flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                       {p.name}
                    </td>
                    <td className="py-2.5 text-right">{p.value}</td>
                    <td className="py-2.5 text-right font-semibold">{formatCurrency(p.revenue)}</td>
                    <td className="py-2.5 text-right text-muted-foreground">
                       {totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
