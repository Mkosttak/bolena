'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatCurrency, type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchTopProducts } from '@/app/[locale]/admin/reports/actions'
import { chartGridStroke, chartTickFill, chartTooltipStyle } from '@/lib/utils/chart-colors'
import { useTheme } from 'next-themes'

interface TopProductsTableProps {
  dateRange: DateRange
  limit?: number
}

type ViewMode = 'chart' | 'table'

export function TopProductsTable({ dateRange, limit = 20 }: TopProductsTableProps) {
  const t = useTranslations('reports')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [view, setView] = useState<ViewMode>('chart')
  const [showAll, setShowAll] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: [...reportsKeys.topProducts(dateRange.key, dateRange.start, dateRange.end), showAll, limit],
    queryFn: () => fetchTopProducts(dateRange.start, dateRange.end, showAll ? 0 : limit),
    staleTime: 5 * 60 * 1000,
  })

  const products =
    'data' in (data ?? {})
      ? (data as { data: { productName: string; quantity: number; revenue: number }[] }).data
      : []

  const maxRevenue = products[0]?.revenue ?? 1

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <CardTitle className="text-sm font-semibold">{t('charts.topProducts')}</CardTitle>
            <div className="flex bg-muted rounded-md p-0.5">
              <Button
                variant={!showAll ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setShowAll(false)}
              >
                Top {limit}
              </Button>
              <Button
                variant={showAll ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setShowAll(true)}
              >
                {t('labels.all')}
              </Button>
            </div>
          </div>
          <div className="flex gap-1 bg-muted rounded-md p-0.5">
            <Button
              variant={view === 'chart' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setView('chart')}
            >
              {t('labels.showChart')}
            </Button>
            <Button
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setView('table')}
            >
              {t('labels.showTable')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : products.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            {t('noData')}
          </div>
        ) : view === 'chart' ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={products}
              layout="vertical"
              margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke={chartGridStroke(isDark)}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: chartTickFill(isDark) }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `₺${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="productName"
                tick={{ fontSize: 11, fill: chartTickFill(isDark) }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={chartTooltipStyle(isDark).contentStyle}
                itemStyle={chartTooltipStyle(isDark).itemStyle}
                formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), t('labels.revenue')]}
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {products.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill="var(--chart-1)"
                    fillOpacity={0.32 + 0.68 * (entry.revenue / maxRevenue)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={cn("overflow-x-auto", showAll ? "max-h-[500px] overflow-y-auto" : "")}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 pr-4 font-medium w-12">#</th>
                  <th className="text-left py-2 pr-4 font-medium">{t('labels.product')}</th>
                  <th className="text-right py-2 pr-4 font-medium">{t('labels.quantity')}</th>
                  <th className="text-right py-2 font-medium">{t('labels.revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => (
                  <tr key={p.productName} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className="text-xs text-muted-foreground font-mono">
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{p.productName}</td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">{p.quantity}</td>
                    <td className="py-2.5 text-right font-semibold">{formatCurrency(p.revenue)}</td>
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
