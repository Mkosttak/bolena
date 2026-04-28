import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { ChartPie, Table as TableIcon } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchPaymentMethodBreakdown } from '@/app/[locale]/admin/reports/actions'
import type { PaymentMethod } from '@/types'
import { CHART_COLORS, chartLegendStyle, chartTooltipStyle } from '@/lib/utils/chart-colors'

interface PaymentMethodChartProps {
  dateRange: DateRange
}

export function PaymentMethodChart({ dateRange }: PaymentMethodChartProps) {
  const t = useTranslations('reports')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.paymentMethods(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchPaymentMethodBreakdown(dateRange.start, dateRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const labelMap: Record<PaymentMethod, string> = {
    cash: t('labels.cash'),
    card: t('labels.card'),
    platform: t('labels.platformPayment'),
  }

  const points =
    'data' in (data ?? {})
      ? (data as { data: { method: PaymentMethod; total: number }[] }).data.map((p) => ({
          name: labelMap[p.method] ?? String(p.method),
          value: p.total,
        }))
      : []

  const total = points.reduce((s, p) => s + p.value, 0)
  const tooltipStyle = chartTooltipStyle(isDark)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{t('charts.paymentMethods')}</CardTitle>
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
                  formatter={(value: unknown, name: unknown) => {
                    const v = Number(value ?? 0)
                    return [
                      `${formatCurrency(v)} (%${total > 0 ? ((v / total) * 100).toFixed(1) : 0})`,
                      String(name),
                    ]
                  }}
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
                  <th className="text-left py-2">{t('labels.paymentMethod')}</th>
                  <th className="text-right py-2">{t('labels.revenue')}</th>
                  <th className="text-right py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 font-medium flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                       {p.name}
                    </td>
                    <td className="py-3 text-right font-semibold">{formatCurrency(p.value)}</td>
                    <td className="py-3 text-right text-muted-foreground">
                       {total > 0 ? ((p.value / total) * 100).toFixed(1) : 0}%
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
