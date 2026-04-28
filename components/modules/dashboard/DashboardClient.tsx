'use client'

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { DashboardData } from '@/lib/queries/dashboard.queries'
import { DashboardKpiCard } from './DashboardKpiCard'
import {
  Users,
  UtensilsCrossed,
  ChefHat,
  Truck,
  TrendingUp,
  ShoppingBag,
  LayoutDashboard,
  Clock,
  CreditCard,
  Banknote,
  Activity,
  ListOrdered
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DashboardClientProps {
  initialData: DashboardData
  locale: string
}

function rankRowClass(index: number): string {
  if (index === 0) {
    return 'border-l-2 border-l-amber-500/70 bg-amber-500/[0.04]'
  }
  if (index === 1) {
    return 'border-l-2 border-l-slate-400/50 bg-slate-500/[0.04]'
  }
  if (index === 2) {
    return 'border-l-2 border-l-orange-600/45 bg-orange-500/[0.04]'
  }
  return 'border-l-2 border-l-transparent'
}

export function DashboardClient({ initialData, locale }: DashboardClientProps) {
  const router = useRouter()
  const t = useTranslations('admin.dashboard')
  const tk = useTranslations('admin.dashboard.kpi')
  const tf = useTranslations('admin.dashboard.finance')
  const tp = useTranslations('admin.dashboard.topProducts')

  const formatCurrency = (value: number) => {
    const loc = locale === 'en' ? 'en-US' : 'tr-TR'
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: 'TRY',
    }).format(value)
  }

  const dateLabel = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const occupancyPercentage =
    initialData.tables.total > 0
      ? Math.round((initialData.tables.active / initialData.tables.total) * 100)
      : 0

  const kdsTotal = initialData.kds.pending + initialData.kds.preparing

  const { cash, card } = initialData.paymentSplits || { cash: 0, card: 0 }
  const totalRevenue = initialData.revenue.today
  const cashPercent = totalRevenue > 0 ? (cash / totalRevenue) * 100 : 0
  const cardPercent = totalRevenue > 0 ? (card / totalRevenue) * 100 : 0

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 right-0 h-80 w-80 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute top-48 -left-20 h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-chart-4/[0.05] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 md:p-8 md:pt-6">
        <header className="border-b border-border/60 pb-5 sm:pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm ring-1 ring-primary/15">
                  <LayoutDashboard className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {t('title')}
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t('subtitle', { date: dateLabel })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          <DashboardKpiCard
            title={tk('tablesTitle')}
            icon={<UtensilsCrossed className="h-5 w-5" aria-hidden />}
            iconTone="emerald"
            mainValue={tk('tablesRatio', {
              active: initialData.tables.active,
              total: initialData.tables.total,
            })}
            subValue={tk('tablesPercent', { percent: occupancyPercentage })}
            onClick={() => router.push(`/${locale}/admin/tables` as Route)}
          />

          <DashboardKpiCard
            title={tk('kdsTitle')}
            icon={<ChefHat className="h-5 w-5" aria-hidden />}
            iconTone="amber"
            mainValue={tk('kdsMain', { count: kdsTotal })}
            subValue={tk('kdsSub')}
            footnote={tk('kdsFootnote', {
              pending: initialData.kds.pending,
              preparing: initialData.kds.preparing,
            })}
            onClick={() => router.push(`/${locale}/admin/kds` as Route)}
          />

          <DashboardKpiCard
            title="Açık Masa Cirosu"
            icon={<Clock className="h-5 w-5" aria-hidden />}
            iconTone="sky"
            mainValue={formatCurrency(initialData.expectedRevenue || 0)}
            subValue="Mevcut masalarda bekleyen tutar"
            footnote="Tahsil edilmemiş aktif siparişler"
            onClick={() => router.push(`/${locale}/admin/tables` as Route)}
          />

          <DashboardKpiCard
            title={tk('courierTitle')}
            icon={<Truck className="h-5 w-5" aria-hidden />}
            iconTone="orange"
            mainValue={initialData.courier.onTheWay}
            subValue={tk('courierSub')}
            footnote={tk('courierFootnote', {
              delivered: initialData.courier.deliveredInfo,
            })}
            onClick={() => router.push(`/${locale}/admin/orders` as Route)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* FİNANS ÖZETİ (Geniş Panel) */}
          <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm backdrop-blur-sm lg:col-span-3">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-emerald-500/[0.08] blur-3xl"
            />
            <CardHeader className="relative border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold md:text-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" aria-hidden />
                </span>
                Günün Finansal Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="relative grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-muted-foreground">{tf('todayRevenue')}</p>
                  <Badge
                    variant={
                      initialData.revenue.trend >= 0 ? 'default' : 'destructive'
                    }
                    className="font-medium"
                  >
                    {tf('vsYesterday', {
                      sign: initialData.revenue.trend >= 0 ? '+' : '',
                      value: initialData.revenue.trend.toFixed(1),
                    })}
                  </Badge>
                </div>
                <p className="font-heading text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(initialData.revenue.today)}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <p className="text-muted-foreground">Toplam Sipariş: <strong className="text-foreground">{initialData.revenue.todayOrderCount}</strong></p>
                  <p className="text-xs text-muted-foreground border-l pl-3 ml-3">Dün: {formatCurrency(initialData.revenue.yesterday)}</p>
                </div>
              </div>

              {/* Nakit / Kredi Kartı Ayrımı */}
              <div className="col-span-2 grid grid-cols-2 gap-4 md:border-l md:border-border/50 md:pl-8">
                <div className="bg-muted/40 rounded-xl p-4 border border-border/40 hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                     <Banknote className="h-5 w-5 text-green-600" />
                     <p className="text-sm font-medium">Nakit Ödeme</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(cash)}</p>
                  <div className="w-full bg-muted mt-3 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${cashPercent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">% {cashPercent.toFixed(1)} Paya sahip</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 border border-border/40 hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                     <CreditCard className="h-5 w-5 text-blue-600" />
                     <p className="text-sm font-medium">Kredi Kartı</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(card)}</p>
                  <div className="w-full bg-muted mt-3 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${cardPercent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">% {cardPercent.toFixed(1)} Paya sahip</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SON HAREKETLER (Live Feed) */}
          <Card className="relative overflow-hidden border-border/60 bg-card shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold md:text-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/12 text-blue-700 dark:text-blue-400">
                  <Activity className="h-4 w-4" aria-hidden />
                </span>
                Canlı Akış (Son İşlemler)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {(!initialData.recentActivity || initialData.recentActivity.length === 0) ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">İşlem bulunamadı.</div>
               ) : (
                  <div className="flex flex-col">
                    {initialData.recentActivity.map((activity, i) => (
                       <div key={activity.id} className={cn("flex items-center justify-between p-4 transition-colors hover:bg-muted/40", i !== 0 && "border-t border-border/40")}>
                         <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-full">
                               <ListOrdered className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                               <p className="font-medium text-sm">
                                 {activity.type === 'dine_in' ? `Masa Siparişi • ${activity.table_id || 'Bilinmeyen Masa'}` : activity.type === 'takeaway' ? 'Gel-Al Siparişi' : 'Paket Servis'}
                               </p>
                               <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <span>{new Date(activity.created_at).toLocaleTimeString(locale === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>•</span>
                                  <Badge variant={activity.status === 'completed' ? 'default' : activity.status === 'active' ? 'secondary' : 'destructive'} className="text-[10px] px-1.5 py-0">
                                    {activity.status === 'completed' ? 'Ödendi' : activity.status === 'active' ? 'Aktif' : 'İptal'}
                                  </Badge>
                               </div>
                            </div>
                         </div>
                         <p className="font-semibold">{formatCurrency(activity.total_amount || 0)}</p>
                       </div>
                    ))}
                    <button 
                      onClick={() => router.push(`/${locale}/admin/orders` as Route)}
                      className="w-full p-3 text-sm font-medium text-primary hover:bg-muted/50 border-t border-border/40 transition-colors"
                    >
                      Tüm Fişleri Görüntüle
                    </button>
                  </div>
               )}
            </CardContent>
          </Card>

          {/* TOP 5 ÜRÜNLER (Dar Panel) */}
          <Card className="relative flex h-full flex-col overflow-hidden border-border/60 bg-card/90 shadow-sm backdrop-blur-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-amber-500/[0.09] blur-3xl"
            />
            <CardHeader className="relative border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold md:text-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/12 text-orange-700 dark:text-orange-400">
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                </span>
                {tp('title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative flex-1 p-0">
              {initialData.topProducts.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                  <ShoppingBag
                    className="h-10 w-10 text-muted-foreground/35"
                    aria-hidden
                  />
                  <p className="text-sm text-muted-foreground">{tp('empty')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {initialData.topProducts.map((product, index) => (
                    <li
                      key={`${product.name}-${index}`}
                      className={cn(
                        'flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40',
                        rankRowClass(index),
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums',
                            index === 0 &&
                              'bg-amber-500/20 text-amber-900 dark:text-amber-200',
                            index === 1 &&
                              'bg-slate-500/15 text-slate-800 dark:text-slate-200',
                            index === 2 &&
                              'bg-amber-600/20 text-amber-900 dark:text-amber-200',
                            index > 2 && 'text-muted-foreground/70',
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="truncate text-sm font-medium">
                          {product.name || tp('unknownName')}
                        </span>
                      </div>
                      <Badge variant="secondary" className="shrink-0 font-semibold">
                        {tp('units', { count: product.quantity })}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
