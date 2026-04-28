'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, type DateRange } from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchCampaignStats } from '@/app/[locale]/admin/reports/actions'

interface CampaignStatsTableProps {
  dateRange: DateRange
}

export function CampaignStatsTable({ dateRange }: CampaignStatsTableProps) {
  const t = useTranslations('reports')

  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.campaigns(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchCampaignStats(dateRange.start, dateRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const stats =
    'data' in (data ?? {})
      ? (data as { data: { productName: string; quantity: number; discountAmount: number }[] }).data
      : []

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-1 ring-1 ring-primary/15">
            <Tag className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-semibold">{t('charts.campaignStats')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-44 w-full rounded-lg" />
        ) : stats.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
            {t('noData')}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 pr-4 font-medium">{t('labels.product')}</th>
                  <th className="text-right py-2 pr-4 font-medium">{t('labels.usageCount')}</th>
                  <th className="text-right py-2 font-medium">{t('labels.totalDiscount')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 pr-4 font-medium">{s.productName}</td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">{s.quantity} adet</td>
                    <td className="py-2.5 text-right font-semibold text-primary">
                      {formatCurrency(s.discountAmount)}
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
