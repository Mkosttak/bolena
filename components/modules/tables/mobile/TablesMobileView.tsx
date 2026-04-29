'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
  LayoutGrid,
  RefreshCw,
  Settings,
  ChevronRight,
  ShoppingBag,
  CircleDollarSign,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableOrderScreen } from '../TableOrderScreen'
import type { Table, TableCategory } from '@/types'

interface TablesMobileViewProps {
  tables: Table[]
  categories: TableCategory[]
  isLoading: boolean
  locale: string
  flashingTableIds?: Set<string>
  onEditTables: () => void
  onRefresh: () => void
}

export function TablesMobileView({
  tables,
  categories,
  isLoading,
  locale,
  flashingTableIds,
  onEditTables,
  onRefresh,
}: TablesMobileViewProps) {
  const t = useTranslations('tables')
  const tOrders = useTranslations('orders')
  const reduceMotion = useReducedMotion()

  const [selectedTable, setSelectedTable] = useState<{ id: string; name: string } | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all')

  const activeCount = tables.filter((tbl) => (tbl.activeOrder?.items_count ?? 0) > 0).length
  const totalRevenue = tables
    .filter((tbl) => (tbl.activeOrder?.items_count ?? 0) > 0)
    .reduce((sum, tbl) => {
      const total = Number(tbl.activeOrder?.total_amount ?? 0)
      const paid = Number(tbl.activeOrder?.paid_amount ?? 0)
      return sum + Math.max(0, total - paid)
    }, 0)

  const categoryPills = useMemo(() => {
    const pills = categories
      .map((category) => ({
        id: category.id,
        label: category.name,
        count: tables.filter((table) => table.category_id === category.id).length,
      }))
      .filter((pill) => pill.count > 0)
      .sort((a, b) => a.label.localeCompare(b.label, 'tr', { numeric: true, sensitivity: 'base' }))
    return [{ id: 'all', label: t('allCategoriesLabel'), count: tables.length }, ...pills]
  }, [categories, tables, t])

  const filteredTables = useMemo(() => {
    if (activeCategoryId === 'all') return tables
    return tables.filter((table) => table.category_id === activeCategoryId)
  }, [activeCategoryId, tables])

  const slideTransition = {
    type: 'spring' as const,
    stiffness: 420,
    damping: 42,
  }

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] overflow-hidden bg-[#efe4cf]">
      {/* Arka plan blob'ları — QR menüden ilham */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-8%] h-64 w-64" style={{ background: 'radial-gradient(circle, rgba(196,132,26,0.16) 0%, transparent 70%)' }} />
        <div className="absolute right-[-10%] top-[15%] h-72 w-72" style={{ background: 'radial-gradient(circle, rgba(27,60,42,0.14) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-12%] left-[20%] h-80 w-80" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.20) 0%, transparent 70%)' }} />
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
            <header className="sticky top-0 z-20 shrink-0 px-2 pb-2 pt-2">
              <div className="rounded-[28px] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,245,233,0.84))] px-3.5 py-3 shadow-[0_20px_55px_-28px_rgba(27,60,42,0.45)] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#1B3C2A]/10 bg-[#1B3C2A]/5 text-[#1B3C2A]">
                    <LayoutGrid className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-[1.2rem] leading-none text-[#173322]">{t('title')}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1B3C2A]/55">
                      {activeCount} {t('hasOrder').toLowerCase()} · ₺{totalRevenue.toFixed(0)} {tOrders('remaining').toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={onRefresh}
                      aria-label={t('refreshAriaLabel')}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-[#1B3C2A]/65 shadow-sm active:scale-95 transition-transform"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onEditTables}
                      aria-label={t('editTables')}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-[#1B3C2A]/65 shadow-sm active:scale-95 transition-transform"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {categoryPills.length > 1 && (
                  <div className="scrollbar-none mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
                    {categoryPills.map((pill) => {
                      const isActive = activeCategoryId === pill.id
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => setActiveCategoryId(pill.id)}
                          className={cn(
                            'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all',
                            isActive
                              ? 'border-[#1B3C2A]/10 bg-[linear-gradient(135deg,#234a36,#13281d)] text-[#faf7ef] shadow-[0_10px_20px_-16px_rgba(27,60,42,0.9)]'
                              : 'border-[#1B3C2A]/10 bg-white/70 text-[#1B3C2A]/70'
                          )}
                        >
                          {pill.label} ({pill.count})
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </header>

            {/* Kaydırılabilir masa listesi */}
            <div className="qr-scrollbar flex-1 overflow-y-auto overscroll-y-contain px-2 pb-4">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[128px] w-full animate-pulse rounded-2xl bg-white/65"
                    />
                  ))}
                </div>
              ) : tables.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#1B3C2A]/10 text-[#1B3C2A] shadow-inner ring-1 ring-[#1B3C2A]/20">
                    <LayoutGrid className="h-10 w-10" strokeWidth={1} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-heading text-base font-semibold text-[#173322]">{t('noTables')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onEditTables}
                    className="rounded-xl bg-[linear-gradient(135deg,#234a36,#13281d)] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#1B3C2A]/20 active:scale-95 transition-transform"
                  >
                    {t('addTable')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pb-6 pt-1">
                  {filteredTables
                    .sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' }))
                    .map((table) => {
                      const ao = table.activeOrder
                      const hasOrder = ao != null && ao.items_count > 0
                      const isQr = (ao as typeof ao & { is_qr_order?: boolean } | null)?.is_qr_order ?? false
                      const remaining = Math.max(0, Number(ao?.total_amount ?? 0) - Number(ao?.paid_amount ?? 0))
                      const payStatus = ao?.payment_status

                      return (
                        <button
                          key={table.id}
                          type="button"
                          onClick={() => setSelectedTable({ id: table.id, name: table.name })}
                          className={cn(
                            'group relative overflow-hidden rounded-2xl border text-left transition-all duration-200 active:scale-[0.98]',
                            hasOrder
                              ? 'border-amber-300/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(252,247,233,0.9))] shadow-[0_20px_45px_-32px_rgba(185,120,22,0.5)]'
                              : 'border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,245,236,0.9))] shadow-[0_20px_45px_-34px_rgba(27,60,42,0.35)]',
                            flashingTableIds?.has(table.id) && 'animate-qr-flash'
                          )}
                        >
                          <div className="p-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-heading text-[1.02rem] leading-none text-[#173322]">
                                  {table.name}
                                </p>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1B3C2A]/55">
                                  {hasOrder ? t('hasOrder') : t('noOrder')}
                                </p>
                              </div>
                              {isQr && (
                                <span className="inline-flex items-center rounded-full border border-teal-300/50 bg-teal-100/85 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-teal-700">
                                  QR
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-end justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <div className={cn(
                                  'flex h-7 w-7 items-center justify-center rounded-lg',
                                  hasOrder ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                )}>
                                  {hasOrder ? <ShoppingBag className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                                </div>
                                <span className="text-[11px] font-semibold text-[#1B3C2A]/70">
                                  {hasOrder ? `${ao!.items_count}` : '0'}
                                </span>
                              </div>

                              <div className="text-right">
                                <p className="text-[15px] font-extrabold leading-none text-[#173322] tabular-nums">
                                  ₺{remaining.toFixed(0)}
                                </p>
                                {hasOrder && (
                                  <p className={cn(
                                    'mt-1 text-[9px] font-semibold uppercase tracking-[0.12em]',
                                    payStatus === 'paid'
                                      ? 'text-emerald-600'
                                      : payStatus === 'partial'
                                        ? 'text-blue-600'
                                        : 'text-amber-700'
                                  )}>
                                    {payStatus === 'paid'
                                      ? tOrders('paid')
                                      : payStatus === 'partial'
                                        ? tOrders('paymentPartial')
                                        : tOrders('paymentPending')}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-2.5 flex items-center justify-end text-[#1B3C2A]/35">
                              <CircleDollarSign className="h-3.5 w-3.5" />
                              <ChevronRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </button>
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
