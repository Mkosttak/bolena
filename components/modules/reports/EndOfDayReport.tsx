'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQueries } from '@tanstack/react-query'
import { formatCurrency, type DateRange } from '@/lib/utils/reports.utils'
import { Loader2, Banknote, CreditCard, ShoppingBag, Utensils, BadgePercent, Flame } from 'lucide-react'
import {
  fetchPaymentMethodBreakdown,
  fetchPlatformStats,
  fetchOrderTypeBreakdown,
  fetchKpiSummary,
  fetchTopProducts,
  fetchCampaignStats
} from '@/app/[locale]/admin/reports/actions'

interface EndOfDayReportProps {
  dateRange: DateRange
}

export function EndOfDayReport({ dateRange }: EndOfDayReportProps) {

  const queries = useQueries({
    queries: [
      {
        queryKey: ['kpi', dateRange],
        queryFn: () => fetchKpiSummary(dateRange.start, dateRange.end, dateRange.start, dateRange.end)
      },
      {
        queryKey: ['payments', dateRange],
        queryFn: () => fetchPaymentMethodBreakdown(dateRange.start, dateRange.end)
      },
      {
        queryKey: ['platforms', dateRange],
        queryFn: () => fetchPlatformStats(dateRange.start, dateRange.end)
      },
      {
        queryKey: ['orderTypes', dateRange],
        queryFn: () => fetchOrderTypeBreakdown(dateRange.start, dateRange.end)
      },
      {
        queryKey: ['topProducts', dateRange],
        queryFn: () => fetchTopProducts(dateRange.start, dateRange.end, 5)
      },
      {
        queryKey: ['campaigns', dateRange],
        queryFn: () => fetchCampaignStats(dateRange.start, dateRange.end)
      }
    ]
  })

  // Wait for all queries to finish
  const isLoading = queries.some(q => q.isLoading)
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Extract data safely
  const kpiData = queries[0].data && 'data' in queries[0].data ? queries[0].data.data.current : null
  const payments = queries[1].data && 'data' in queries[1].data ? queries[1].data.data : []
  const platforms = queries[2].data && 'data' in queries[2].data ? queries[2].data.data : []
  const types = queries[3].data && 'data' in queries[3].data ? queries[3].data.data : []
  const topProducts = queries[4].data && 'data' in queries[4].data ? queries[4].data.data : []
  const campaigns = queries[5].data && 'data' in queries[5].data ? queries[5].data.data : []

  // Derived summaries
  const totalRevenue = kpiData?.revenue || 0
  const orderCount = kpiData?.orderCount || 0
  
  const cashObj = payments.find((p: { method: string; total: number }) => p.method === 'cash')
  const cardObj = payments.find((p: { method: string; total: number }) => p.method === 'card')
  const cashTotal = cashObj ? cashObj.total : 0
  const cardTotal = cardObj ? cardObj.total : 0
  
  const totalDiscount = kpiData?.totalDiscount || 0

  const top3Campaigns = campaigns.slice(0, 3)
  const allCampaignsTotalDiscount = campaigns.reduce((acc, c) => acc + c.discountAmount, 0)
  const allCampaignsTotalQty = campaigns.reduce((acc, c) => acc + c.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Core Finance Metrics */}
        <Card className="border-t-4 border-t-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Toplam Ciro</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-400 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Adisyon Sayısı</p>
              <p className="text-2xl font-bold">{orderCount}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
              <ShoppingBag className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-green-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Ciro (Nakit)</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(cashTotal)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
              <Banknote className="h-5 w-5 text-green-700 dark:text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Ciro (Kredi Kartı)</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(cardTotal)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
              <CreditCard className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-rose-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Uygulanan İndirimler</p>
              <p className="text-2xl font-bold text-rose-700">{formatCurrency(totalDiscount)}</p>
            </div>
            <div className="p-3 bg-rose-100 rounded-full dark:bg-rose-900">
              <BadgePercent className="h-5 w-5 text-rose-700 dark:text-rose-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kanallar / Platformlar Modülü */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Satış Kanalları & Platformlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platforms.map(p => (
                <div key={p.platform} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold capitalize">{p.platform}</p>
                    <p className="text-xs text-muted-foreground">{p.orderCount} Sipariş</p>
                  </div>
                  <span className="font-bold">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
              {platforms.length === 0 && <p className="text-muted-foreground text-sm">Platform verisi yok.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Sipariş Türleri Modülü */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Sipariş Türü Dağılımı (Kurye / Masa / Gel-Al)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {types.map(o => (
                <div key={o.type} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold capitalize">
                      {o.type === 'table' ? 'Masa' : o.type === 'takeaway' ? 'Gel-Al' : o.type === 'platform' ? 'Platform' : o.type}
                    </p>
                    <p className="text-xs text-muted-foreground">{o.count} Sipariş</p>
                  </div>
                  <span className="font-bold">{formatCurrency(o.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              En Çok Satan Ürünler (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((p, index) => (
                <div key={p.productName} className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-mono w-4">{index + 1}.</span>
                    <p className="font-medium">{p.productName}</p>
                  </div>
                  <div className="flex gap-4 text-sm items-center">
                    <span className="text-muted-foreground">{p.quantity} Adet</span>
                    <span className="font-bold min-w-16 text-right">{formatCurrency(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Usage */}
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BadgePercent className="h-5 w-5 text-purple-500" />
              Kampanya Özeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md mb-4 border border-purple-100 dark:border-purple-800">
                   <div>
                     <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">Toplam Kampanya İndirimi</p>
                     <p className="text-xs text-purple-600/80 dark:text-purple-400">Total Kullanım: {allCampaignsTotalQty}</p>
                   </div>
                   <span className="font-bold text-lg text-purple-700 dark:text-purple-400">{formatCurrency(allCampaignsTotalDiscount)}</span>
                </div>
                {top3Campaigns.map(c => (
                  <div key={c.productName} className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                    <div>
                      <p className="font-medium text-sm">{c.productName}</p>
                      <p className="text-xs text-muted-foreground">Kullanılan Miktar: {c.quantity}</p>
                    </div>
                    <span className="font-semibold text-sm text-rose-600">İndirim: {formatCurrency(c.discountAmount)}</span>
                  </div>
                ))}
                {campaigns.length > 3 && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    + {campaigns.length - 3} kampanya daha uygulandı. Tüm liste için Excel indirin.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
                Kullanılan kampanya yok.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
