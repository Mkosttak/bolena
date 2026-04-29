'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  BarChart3,
  LineChart,
  Package,
  RadioTower,
  Timer,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildDateRange, type DateRange } from '@/lib/utils/reports.utils'
import { DateRangePicker } from './DateRangePicker'
import { ExportButton } from './ExportButton'
import { ReportSection } from './ReportSection'
import { KpiCards } from './KpiCards'
import { RevenueChart } from './RevenueChart'
import { OrderTypeChart } from './OrderTypeChart'
import { PaymentMethodChart } from './PaymentMethodChart'
import { TopProductsTable } from './TopProductsTable'
import { CategoryRevenueChart } from './CategoryRevenueChart'
import { HourlyHeatmap } from './HourlyHeatmap'
import { PlatformCompareTable } from './PlatformCompareTable'
import { EndOfDayReport } from './EndOfDayReport'
import { ReservationStats } from './ReservationStats'
import { CampaignStatsTable } from './CampaignStatsTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ReportsClientProps {
  locale: string
}

type ActiveReport = 'sales' | 'products' | 'channels' | 'operations' | 'end-of-day' | null

export function ReportsClient({ locale: _locale }: ReportsClientProps) {
  const t = useTranslations('reports')
  const [dateRange, setDateRange] = useState<DateRange>(buildDateRange('today'))
  const [activeReport, setActiveReport] = useState<ActiveReport>(null)

  const reportButtons = [
    { id: 'end-of-day', icon: Wallet, hardcodedLabel: 'Gün Sonu (Z-Raporu)', hardcodedDesc: 'Ciro, kanallar, ödemeler ve genel gün özeti' },
    { id: 'sales', icon: LineChart, labelKey: 'sections.sales' as const, descKey: 'charts.dailyRevenue' as const },
    { id: 'products', icon: Package, labelKey: 'sections.products' as const, descKey: 'charts.topProducts' as const },
    { id: 'channels', icon: RadioTower, labelKey: 'sections.channels' as const, descKey: 'charts.platforms' as const },
    { id: 'operations', icon: Timer, labelKey: 'sections.operations' as const, descKey: 'charts.hourlyHeatmap' as const },
  ]

  return (
    <div className="reports-page relative min-h-full pb-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/[0.07] via-transparent to-transparent dark:from-primary/25 dark:via-primary/[0.07]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-screen-2xl space-y-8 p-4 md:p-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-sm ring-1 ring-primary/10 dark:from-primary/25 dark:to-primary/10 dark:shadow-[0_0_24px_oklch(0.55_0.16_145/0.25)] dark:ring-primary/30">
              <BarChart3 className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
              <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <ExportButton dateRange={dateRange} />
          </div>
        </header>

        {/* Report Selection Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reportButtons.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveReport(item.id as ActiveReport)}
                className={cn(
                  'group flex flex-col items-start gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm'
                )}
              >
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold leading-none tracking-tight">{item.hardcodedLabel || t(item.labelKey as Parameters<typeof t>[0])}</h3>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.hardcodedDesc || t(item.descKey as Parameters<typeof t>[0])}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Always visible overview */}
        <ReportSection
          id="reports-overview"
          icon={BarChart3}
          title={t('sections.overview')}
          description={t('subtitle')}
        >
          <KpiCards dateRange={dateRange} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TopProductsTable dateRange={dateRange} limit={5} />
            <CategoryRevenueChart dateRange={dateRange} />
          </div>
        </ReportSection>
      </div>

      <Dialog open={activeReport !== null} onOpenChange={(open) => !open && setActiveReport(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-7xl sm:max-w-7xl overflow-y-auto">
          <DialogHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              {activeReport && (() => {
                const activeData = reportButtons.find(b => b.id === activeReport)
                const Icon = activeData?.icon || BarChart3
                return (
                  <>
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {activeData?.hardcodedLabel || t(activeData?.labelKey as Parameters<typeof t>[0] || 'sections.overview')}
                  </>
                )
              })()}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 pr-6">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <ExportButton dateRange={dateRange} activeReport={activeReport} />
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-6 pb-4">
            {activeReport === 'sales' && (
              <>
                <RevenueChart dateRange={dateRange} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <OrderTypeChart dateRange={dateRange} />
                  <PaymentMethodChart dateRange={dateRange} />
                  <CategoryRevenueChart dateRange={dateRange} />
                </div>
              </>
            )}

            {activeReport === 'products' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <TopProductsTable dateRange={dateRange} />
                <CampaignStatsTable dateRange={dateRange} />
              </div>
            )}

            {activeReport === 'channels' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <PlatformCompareTable dateRange={dateRange} />
                <ReservationStats dateRange={dateRange} />
              </div>
            )}

            {activeReport === 'operations' && (
              <HourlyHeatmap dateRange={dateRange} />
            )}

            {activeReport === 'end-of-day' && (
              <EndOfDayReport dateRange={dateRange} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
