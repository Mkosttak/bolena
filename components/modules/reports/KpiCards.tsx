'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Receipt,
  Tag,
  CalendarCheck,
  Globe,
  Timer,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  formatCurrency,
  formatPercentChange,
  buildPrevDateRange,
  type DateRange,
} from '@/lib/utils/reports.utils'
import { reportsKeys, type KpiSummary } from '@/lib/queries/reports.queries'
import { fetchKpiSummary } from '@/app/[locale]/admin/reports/actions'

interface KpiCardsProps {
  dateRange: DateRange
}

export function KpiCards({ dateRange }: KpiCardsProps) {
  const t = useTranslations('reports')
  const prevRange = buildPrevDateRange(dateRange)

  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.kpi(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () =>
      fetchKpiSummary(dateRange.start, dateRange.end, prevRange.start, prevRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const kpi: KpiSummary | null = data && 'data' in data ? (data as { data: KpiSummary }).data : null

  const cards = [
    {
      key: 'revenue',
      label: t('kpi.revenue'),
      icon: Receipt,
      iconClass: 'text-emerald-600 dark:text-primary',
      bgClass: 'bg-emerald-50 dark:bg-primary/14',
      format: (v: number) => formatCurrency(v),
      value: kpi?.current.revenue ?? 0,
      prevValue: kpi?.prev.revenue ?? 0,
    },
    {
      key: 'orderCount',
      label: t('kpi.orders'),
      icon: ShoppingCart,
      iconClass: 'text-blue-600 dark:text-chart-2',
      bgClass: 'bg-blue-50 dark:bg-chart-2/14',
      format: (v: number) => v.toLocaleString('tr-TR'),
      value: kpi?.current.orderCount ?? 0,
      prevValue: kpi?.prev.orderCount ?? 0,
    },
    {
      key: 'avgBasket',
      label: t('kpi.avgBasket'),
      icon: TrendingUp,
      iconClass: 'text-violet-600 dark:text-chart-3',
      bgClass: 'bg-violet-50 dark:bg-chart-3/14',
      format: (v: number) => formatCurrency(v),
      value: kpi?.current.avgBasket ?? 0,
      prevValue: kpi?.prev.avgBasket ?? 0,
    },
    {
      key: 'avgPrepTime',
      label: t('kpi.avgPrepTime'),
      icon: Timer,
      iconClass: 'text-cyan-600 dark:text-chart-4',
      bgClass: 'bg-cyan-50 dark:bg-chart-4/14',
      format: (v: number) => t('kpi.avgPrepMinutes', { minutes: Math.round(v) }),
      value: kpi?.current.avgPrepTime ?? 0,
      prevValue: kpi?.prev.avgPrepTime ?? 0,
      invertChange: true,
    },
    {
      key: 'platformOrderCount',
      label: t('labels.platformOrders'),
      icon: Globe,
      iconClass: 'text-orange-600 dark:text-chart-5',
      bgClass: 'bg-orange-50 dark:bg-chart-5/14',
      format: (v: number) => v.toLocaleString('tr-TR'),
      value: kpi?.current.platformOrderCount ?? 0,
      prevValue: kpi?.prev.platformOrderCount ?? 0,
    },
    {
      key: 'totalDiscount',
      label: t('kpi.totalDiscount'),
      icon: Tag,
      iconClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-500/12',
      format: (v: number) => formatCurrency(v),
      value: kpi?.current.totalDiscount ?? 0,
      prevValue: kpi?.prev.totalDiscount ?? 0,
      invertChange: true,
    },
    {
      key: 'reservationCount',
      label: t('kpi.reservations'),
      icon: CalendarCheck,
      iconClass: 'text-teal-600 dark:text-primary',
      bgClass: 'bg-teal-50 dark:bg-primary/10',
      format: (v: number) => v.toLocaleString('tr-TR'),
      value: kpi?.current.reservationCount ?? 0,
      prevValue: kpi?.prev.reservationCount ?? 0,
    },
  ]

  const getVsLabel = () => {
    switch (dateRange.key) {
      case 'today':
        return t('dateRange.vs_today')
      case 'yesterday':
        return t('dateRange.vs_yesterday')
      case 'week':
        return t('dateRange.vs_week')
      case 'month':
        return t('dateRange.vs_month')
      default:
        return t('dateRange.vs')
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((card) => {
        const change = formatPercentChange(card.value, card.prevValue)
        const isGood = card.invertChange ? !change.isPositive : change.isPositive
        const Icon = card.icon
        const TrendIcon = change.isPositive ? TrendingUp : TrendingDown

        return (
          <Card key={card.key} className="overflow-hidden">
            <CardHeader className="pb-1 pt-3 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {card.label}
                </CardTitle>
                <div className={cn('p-1 rounded-md', card.bgClass)}>
                  <Icon className={cn('h-3 w-3', card.iconClass)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-0.5">
              <p className="text-xl font-heading truncate">{card.format(card.value)}</p>
              {(dateRange.key === 'today' ||
                dateRange.key === 'yesterday' ||
                dateRange.key === 'week' ||
                dateRange.key === 'month') && (
                <>
                  {!change.isZero && (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        isGood ? 'text-emerald-600 dark:text-primary' : 'text-red-500 dark:text-destructive'
                      )}
                    >
                      <TrendIcon className="h-3 w-3" />
                      <span>{change.value}</span>
                      <span className="text-muted-foreground font-normal">
                        {getVsLabel()}
                      </span>
                    </div>
                  )}
                  {change.isZero && (
                    <p className="text-xs text-muted-foreground">{getVsLabel()}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
