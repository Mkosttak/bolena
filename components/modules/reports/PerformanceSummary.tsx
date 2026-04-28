'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Award, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchCategoryRevenue, fetchTopProducts } from '@/app/[locale]/admin/reports/actions'

interface PerformanceSummaryProps {
  dateRange: DateRange
}

export function PerformanceSummary({ dateRange }: PerformanceSummaryProps) {
  const t = useTranslations('reports')

  // Kategori verisini al (En iyi kategori için)
  const categoryQuery = useQuery({
    queryKey: reportsKeys.categories(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchCategoryRevenue(dateRange.start, dateRange.end),
  })

  // En çok satılan ürünler (Yıldız ürün için)
  const productsQuery = useQuery({
    queryKey: reportsKeys.topProducts(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchTopProducts(dateRange.start, dateRange.end, 10),
  })

  const isLoading = categoryQuery.isLoading || productsQuery.isLoading

  if (isLoading) return <Skeleton className="h-32 w-full rounded-xl" />

  // En iyi kategoriyi bul
  const categoryData = categoryQuery.data && 'data' in categoryQuery.data ? categoryQuery.data.data : []
  const topCategory = categoryData.length > 0 ? categoryData[0] : null

  // Yıldız ürün
  const products = productsQuery.data && 'data' in productsQuery.data ? productsQuery.data.data : []
  const starProduct = products.length > 0 ? products[0] : null

  const insights = [
    {
      label: t('labels.starProduct'),
      value: starProduct ? starProduct.productName : '—',
      subValue: starProduct
        ? t('insights.qtySold', { count: starProduct.quantity })
        : '',
      icon: Star,
      color: 'text-amber-600 dark:text-chart-4',
      bg: 'bg-amber-50 dark:bg-chart-4/12'
    },
    {
      label: t('kpi.categories'),
      value: topCategory ? topCategory.categoryName : '—',
      subValue: topCategory
        ? t('insights.categoryShare', { pct: topCategory.percentage.toFixed(1) })
        : '',
      icon: Award,
      color: 'text-purple-600 dark:text-chart-2',
      bg: 'bg-purple-50 dark:bg-chart-2/12'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map((insight, idx) => (
        <Card
          key={idx}
          className="border-none bg-gradient-to-br from-background to-muted/30 shadow-sm dark:from-primary/[0.06] dark:to-transparent dark:shadow-[inset_0_1px_0_0_oklch(0.62_0.14_145/0.08)]"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${insight.bg}`}>
              <insight.icon className={`h-5 w-5 ${insight.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {insight.label}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-bold">{insight.value}</p>
                {insight.subValue && (
                  <span className="text-xs text-muted-foreground font-normal">
                    {insight.subValue}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
