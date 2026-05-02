'use client'

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { DashboardData } from '@/lib/queries/dashboard.queries'
import { DashboardKpiCard } from './DashboardKpiCard'
import {
  UtensilsCrossed,
  ChefHat,
  Truck,
  TrendingUp,
  ShoppingBag,
  LayoutDashboard,
  Clock,
  CreditCard,
  Banknote,
  CalendarClock,
  BarChart3,
  ArrowUpRight,
  Trophy,
  Medal,
  Award,
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

function rankBadge(index: number) {
  // Top 3: Trophy / Medal / Award icons + altın/gümüş/bronz ton
  if (index === 0)
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-50 shadow-sm shadow-amber-500/30">
        <Trophy className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
    )
  if (index === 1)
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-300 to-slate-500 text-slate-50 shadow-sm shadow-slate-500/25">
        <Medal className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
    )
  if (index === 2)
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-orange-50 shadow-sm shadow-orange-500/25">
        <Award className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
    )
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold tabular-nums text-muted-foreground/70">
      {index + 1}
    </span>
  )
}

export function DashboardClient({ initialData, locale }: DashboardClientProps) {
  const router = useRouter()
  const t = useTranslations('admin.dashboard')
  const tk = useTranslations('admin.dashboard.kpi')
  const tf = useTranslations('admin.dashboard.finance')
  const tp = useTranslations('admin.dashboard.topProducts')
  const tq = useTranslations('admin.dashboard.quickActions')

  const quickActions = [
    {
      key: 'tables',
      label: tq('tables'),
      desc: tq('tablesDesc'),
      icon: UtensilsCrossed,
      href: `/${locale}/admin/tables` as Route,
      tone: 'emerald',
    },
    {
      key: 'kds',
      label: tq('kds'),
      desc: tq('kdsDesc'),
      icon: ChefHat,
      href: `/${locale}/admin/kds` as Route,
      tone: 'amber',
    },
    {
      key: 'reservations',
      label: tq('reservations'),
      desc: tq('reservationsDesc'),
      icon: CalendarClock,
      href: `/${locale}/admin/reservations` as Route,
      tone: 'sky',
    },
    {
      key: 'reports',
      label: tq('reports'),
      desc: tq('reportsDesc'),
      icon: BarChart3,
      href: `/${locale}/admin/reports` as Route,
      tone: 'violet',
    },
  ] as const

  const toneClasses: Record<string, { bg: string; ring: string; iconBg: string; iconColor: string }> = {
    emerald: {
      bg: 'hover:bg-emerald-500/[0.04]',
      ring: 'group-hover:ring-emerald-500/30',
      iconBg: 'bg-emerald-500/12 group-hover:bg-emerald-500/20',
      iconColor: 'text-emerald-700 dark:text-emerald-400',
    },
    amber: {
      bg: 'hover:bg-amber-500/[0.04]',
      ring: 'group-hover:ring-amber-500/30',
      iconBg: 'bg-amber-500/12 group-hover:bg-amber-500/20',
      iconColor: 'text-amber-700 dark:text-amber-400',
    },
    sky: {
      bg: 'hover:bg-sky-500/[0.04]',
      ring: 'group-hover:ring-sky-500/30',
      iconBg: 'bg-sky-500/12 group-hover:bg-sky-500/20',
      iconColor: 'text-sky-700 dark:text-sky-400',
    },
    violet: {
      bg: 'hover:bg-violet-500/[0.04]',
      ring: 'group-hover:ring-violet-500/30',
      iconBg: 'bg-violet-500/12 group-hover:bg-violet-500/20',
      iconColor: 'text-violet-700 dark:text-violet-400',
    },
  }

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

          {/* TOP 5 ÜRÜNLER — Mini bar chart + medal badges */}
          <Card className="relative flex h-full flex-col overflow-hidden border-border/60 bg-card/90 shadow-sm backdrop-blur-sm lg:col-span-2">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-amber-500/[0.08] blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-orange-500/[0.06] blur-3xl"
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
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
                    <ShoppingBag
                      className="h-8 w-8 text-muted-foreground/40"
                      aria-hidden
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{tp('empty')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {initialData.topProducts.map((product, index, arr) => {
                    const maxQty = Math.max(...arr.map((p) => p.quantity), 1)
                    const widthPct = (product.quantity / maxQty) * 100
                    return (
                      <li
                        key={`${product.name}-${index}`}
                        className={cn(
                          'group relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30',
                          rankRowClass(index),
                        )}
                      >
                        {rankBadge(index)}

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-baseline justify-between gap-3">
                            <span className="truncate text-sm font-semibold">
                              {product.name || tp('unknownName')}
                            </span>
                            <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                              {tp('units', { count: product.quantity })}
                            </span>
                          </div>

                          {/* Mini bar — qty oranı */}
                          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                            <div
                              className={cn(
                                'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                                index === 0 && 'bg-gradient-to-r from-amber-400 to-amber-600',
                                index === 1 && 'bg-gradient-to-r from-slate-400 to-slate-600',
                                index === 2 && 'bg-gradient-to-r from-orange-500 to-orange-700',
                                index > 2 && 'bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/60',
                              )}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* HIZLI EYLEMLER — 4 modul kisayol kartı */}
          <Card className="relative overflow-hidden border-border/60 bg-card shadow-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl"
            />
            <CardHeader className="relative border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold md:text-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                </span>
                {tq('title')}
              </CardTitle>
              <p className="mt-1 pl-[3rem] text-xs text-muted-foreground">{tq('subtitle')}</p>
            </CardHeader>
            <CardContent className="relative p-3">
              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  const tone = toneClasses[action.tone]
                  return (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => router.push(action.href)}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 p-3 text-left transition-all',
                        'hover:border-border hover:shadow-sm hover:-translate-y-0.5',
                        tone?.bg,
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                          tone?.iconBg,
                          tone?.iconColor,
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight">{action.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{action.desc}</p>
                      </div>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
