'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
  LayoutGrid,
  RefreshCw,
  Settings,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableOrderScreen } from '../TableOrderScreen'
import type { Table, TableCategory } from '@/types'

interface TablesMobileViewProps {
  tables: Table[]
  categories: TableCategory[]
  isLoading: boolean
  locale: string
  onEditTables: () => void
  onRefresh: () => void
  groupedTables: Record<string, Table[] | undefined>
  sortedCategoryIds: string[]
}

export function TablesMobileView({
  tables,
  categories,
  isLoading,
  locale,
  onEditTables,
  onRefresh,
  groupedTables,
  sortedCategoryIds,
}: TablesMobileViewProps) {
  const t = useTranslations('tables')
  const tOrders = useTranslations('orders')
  const reduceMotion = useReducedMotion()

  const [selectedTable, setSelectedTable] = useState<{ id: string; name: string } | null>(null)

  const activeCount = tables.filter((tbl) => (tbl.activeOrder?.items_count ?? 0) > 0).length
  const totalRevenue = tables
    .filter((tbl) => (tbl.activeOrder?.items_count ?? 0) > 0)
    .reduce((sum, tbl) => {
      const total = Number(tbl.activeOrder?.total_amount ?? 0)
      const paid = Number(tbl.activeOrder?.paid_amount ?? 0)
      return sum + Math.max(0, total - paid)
    }, 0)

  const slideTransition = {
    type: 'spring' as const,
    stiffness: 420,
    damping: 42,
  }

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] overflow-hidden bg-[#f7f4ef] dark:bg-stone-950">
      {/* Arka plan blob'ları — QR menüden ilham */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute top-1/2 -left-16 h-48 w-48 rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-52 w-52 rounded-full bg-emerald-500/8 blur-3xl" />
      </div>

      <AnimatePresence initial={false}>
        {/* ── EKRAN 1: MASA LİSTESİ ── */}
        {!selectedTable && (
          <motion.div
            key="table-list"
            className="absolute inset-0 flex flex-col"
            initial={reduceMotion ? false : { x: '-100%' }}
            animate={{ x: 0 }}
            exit={reduceMotion ? {} : { x: '-100%' }}
            transition={slideTransition}
          >
            {/* Yapışkan üst başlık */}
            <header className="shrink-0 flex items-center gap-3 border-b border-white/60 bg-[#f7f4ef]/90 dark:bg-stone-950/90 px-4 py-3 backdrop-blur-xl shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                <LayoutGrid className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-[15px] font-bold tracking-tight text-foreground leading-tight">
                  {t('title')}
                </p>
                {activeCount > 0 && (
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 tracking-wider">
                    {activeCount} aktif masa · {totalRevenue.toFixed(2)} ₺ kalan
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onRefresh}
                aria-label="Yenile"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/80 dark:bg-stone-800 dark:border-stone-700 text-muted-foreground shadow-sm active:scale-95 transition-transform"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onEditTables}
                aria-label="Masa ayarları"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/80 dark:bg-stone-800 dark:border-stone-700 text-muted-foreground shadow-sm active:scale-95 transition-transform"
              >
                <Settings className="h-4 w-4" />
              </button>
            </header>

            {/* Kaydırılabilir masa listesi */}
            <div className="flex-1 overflow-y-auto overscroll-y-contain">
              {isLoading ? (
                <div className="space-y-3 p-4 pt-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[72px] w-full animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800"
                    />
                  ))}
                </div>
              ) : tables.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/20">
                    <LayoutGrid className="h-10 w-10" strokeWidth={1} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-heading text-base font-semibold text-foreground">{t('noTables')}</p>
                    <p className="text-sm text-muted-foreground">Sistemde henüz kayıtlı masa bulunmuyor.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onEditTables}
                    className="rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                  >
                    {t('addTable')}
                  </button>
                </div>
              ) : (
                <div className="space-y-5 px-3 pt-4 pb-10">
                  {sortedCategoryIds.map((catId) => {
                    const catName =
                      catId === 'none'
                        ? t('uncategorized')
                        : (categories.find((c) => c.id === catId)?.name ?? t('uncategorized'))
                    const tablesInGroup = groupedTables[catId] ?? []

                    return (
                      <section key={catId} className="space-y-2">
                        {/* Kategori başlığı */}
                        <div className="flex items-center gap-2.5 px-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/55">
                            {catName}
                          </span>
                          <div className="h-px flex-1 bg-gradient-to-r from-border/60 via-border/30 to-transparent" />
                          <span className="text-[10px] tabular-nums text-muted-foreground/40">
                            {tablesInGroup.length}
                          </span>
                        </div>

                        {/* Masa kartları */}
                        <div className="space-y-2">
                          {tablesInGroup.map((table) => {
                            const ao = table.activeOrder
                            const hasOrder = ao != null && ao.items_count > 0
                            const isQr = (ao as typeof ao & { is_qr_order?: boolean } | null)?.is_qr_order ?? false
                            const total = Number(ao?.total_amount ?? 0)
                            const paid = Number(ao?.paid_amount ?? 0)
                            const remaining = Math.max(0, total - paid)
                            const payStatus = ao?.payment_status

                            return (
                              <button
                                key={table.id}
                                type="button"
                                onClick={() => setSelectedTable({ id: table.id, name: table.name })}
                                className={cn(
                                  'group w-full text-left rounded-2xl border transition-all duration-200',
                                  'shadow-sm active:scale-[0.975] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                                  hasOrder
                                    ? 'border-amber-300/50 bg-gradient-to-br from-amber-50/90 via-white to-white dark:from-amber-950/25 dark:via-card dark:to-card shadow-amber-100/60 dark:shadow-none'
                                    : 'border-white bg-white dark:border-stone-700 dark:bg-card'
                                )}
                              >
                                <div className="flex items-center gap-3 p-3.5">
                                  {/* Durum indikatörü */}
                                  <div
                                    className={cn(
                                      'shrink-0 h-10 w-10 rounded-xl flex items-center justify-center',
                                      hasOrder
                                        ? 'bg-amber-100 dark:bg-amber-950/40'
                                        : 'bg-emerald-50 dark:bg-emerald-950/30'
                                    )}
                                  >
                                    {hasOrder ? (
                                      <ShoppingBag
                                        className="h-5 w-5 text-amber-600 dark:text-amber-400"
                                        strokeWidth={1.75}
                                      />
                                    ) : (
                                      <span className="block h-3 w-3 rounded-full bg-emerald-400" />
                                    )}
                                  </div>

                                  {/* Masa bilgileri */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-heading text-sm font-bold text-foreground leading-tight truncate">
                                        {table.name}
                                      </p>
                                      {isQr && (
                                        <span className="shrink-0 inline-flex items-center rounded-full bg-teal-100 dark:bg-teal-950/50 border border-teal-300/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                                          📱 QR
                                        </span>
                                      )}
                                    </div>
                                    {hasOrder ? (
                                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] text-muted-foreground">
                                          {ao!.items_count} ürün
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/40">·</span>
                                        <span
                                          className={cn(
                                            'text-[10px] font-semibold',
                                            payStatus === 'paid'
                                              ? 'text-emerald-600 dark:text-emerald-400'
                                              : payStatus === 'partial'
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-amber-700 dark:text-amber-400'
                                          )}
                                        >
                                          {payStatus === 'paid'
                                            ? tOrders('paid')
                                            : payStatus === 'partial'
                                              ? tOrders('paymentPartial')
                                              : tOrders('paymentPending')}
                                        </span>
                                      </div>
                                    ) : (
                                      <p className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                        Boş
                                      </p>
                                    )}
                                  </div>

                                  {/* Kalan tutar */}
                                  {hasOrder && (
                                    <div className="shrink-0 text-right mr-0.5">
                                      <p className="font-heading text-lg font-bold text-foreground leading-none tabular-nums">
                                        {remaining.toFixed(0)}
                                        <span className="text-xs font-medium text-muted-foreground ml-0.5">₺</span>
                                      </p>
                                      {paid > 0 && (
                                        <p className="text-[9px] text-muted-foreground/60 tabular-nums">
                                          /{total.toFixed(0)} ₺
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  <ChevronRight className="shrink-0 h-4 w-4 text-muted-foreground/30 group-active:translate-x-0.5 transition-transform" />
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </section>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── EKRAN 2: SİPARİŞ DETAY (sağdan kayar) ── */}
        {selectedTable && (
          <motion.div
            key={`order-${selectedTable.id}`}
            className="absolute inset-0 z-10 bg-background"
            initial={reduceMotion ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduceMotion ? {} : { x: '100%' }}
            transition={slideTransition}
          >
            <TableOrderScreen
              tableId={selectedTable.id}
              tableName={selectedTable.name}
              locale={locale}
              embedded
              onBack={() => setSelectedTable(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
