import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { ChartPie, Table as TableIcon } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchCategoryRevenue } from '@/app/[locale]/admin/reports/actions'
import { CHART_COLORS, chartLegendStyle, chartTooltipStyle } from '@/lib/utils/chart-colors'

interface CategoryRevenueChartProps {
  dateRange: DateRange
}

export function CategoryRevenueChart({ dateRange }: CategoryRevenueChartProps) {
  const t = useTranslations('reports')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [view, setView] = useState<'chart' | 'table'>('chart')


  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.categories(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchCategoryRevenue(dateRange.start, dateRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const categories =
    'data' in (data ?? {})
      ? (
          data as {
            data: { categoryName: string; revenue: number; percentage: number }[]
          }
        ).data
      : []

  const totalRevenue = categories.reduce((sum, c) => sum + c.revenue, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{t('charts.categoryRevenue')}</CardTitle>
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
        ) : categories.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            {t('noData')}
          </div>
        ) : view === 'chart' ? (
          <div className="pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="revenue"
                  nameKey="categoryName"
                  stroke="none"
                >
                  {categories.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle(isDark).contentStyle}
                  itemStyle={chartTooltipStyle(isDark).itemStyle}
                  formatter={(value: unknown, name: unknown) => [
                    `${formatCurrency(Number(value ?? 0))} (%${(
                      (Number(value ?? 0) / totalRevenue) *
                      100
                    ).toFixed(1)})`,
                    String(name),
                  ]}
                />
                <Legend iconSize={10} iconType="circle" wrapperStyle={chartLegendStyle({ fontSize: 11 })} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[260px]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">{t('menu.category')}</th>
                  <th className="text-right py-2">{t('labels.revenue')}</th>
                  <th className="text-right py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-2.5 font-medium flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      {c.categoryName}
                    </td>
                    <td className="py-2.5 text-right font-semibold">
                      {formatCurrency(c.revenue)}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {c.percentage.toFixed(1)}%
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
