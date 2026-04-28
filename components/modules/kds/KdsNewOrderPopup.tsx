'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { ChefHat, X, MinusCircle, Sparkles, StickyNote } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isKnownPlatformChannel } from '@/lib/utils/kds.utils'
import type { KdsGroup, KdsOrderItem } from '@/lib/utils/kds.utils'

interface KdsNewOrderPopupProps {
  order: KdsGroup | null
  /** Kuyrukta bekleyen ek bildirim sayısı (görünen hariç) */
  moreInQueue?: number
  onClose: () => void
}

function productLabel(item: KdsOrderItem, locale: string) {
  return locale.startsWith('en')
    ? item.product_name_en || item.product_name_tr
    : item.product_name_tr || item.product_name_en
}

function orderSourceLabel(order: KdsGroup, t: ReturnType<typeof useTranslations<'kds'>>) {
  if (order.tableName) {
    return order.tableName
  }
  if (order.tableId && (order.orderType === 'table' || order.orderType === 'reservation' || order.orderType === 'takeaway')) {
    return t('headerTable')
  }
  if (order.orderType === 'platform' && order.platform) {
    const p = order.platform
    return isKnownPlatformChannel(p) ? t(`platform.${p}`) : p
  }
  if (order.customerName) {
    return order.customerName
  }
  return t('headerCustomer')
}

export function KdsNewOrderPopup({ order, moreInQueue = 0, onClose }: KdsNewOrderPopupProps) {
  const t = useTranslations('kds')
  const locale = useLocale()

  return (
    <AnimatePresence mode="wait">
      {order ? (
        <div
          key={order.id}
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 pointer-events-none"
        >
          <motion.button
            type="button"
            aria-label={t('closeSummary')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto absolute inset-0 bg-zinc-950/55 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="kds-new-order-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={cn(
              'pointer-events-auto relative w-[min(96vw,72rem)] max-w-[min(96vw,72rem)] max-h-[min(92vh,56rem)] overflow-hidden flex flex-col rounded-[2rem] sm:rounded-[2.25rem]',
              'border border-primary/20 bg-gradient-to-b from-[oklch(0.94_0.03_145)] via-card to-card',
              'shadow-[0_40px_100px_-28px_rgba(15,45,25,0.4)]'
            )}
          >
            {/* Üst şerit */}
            <div className="relative flex shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5 border-b border-primary/10 bg-primary/[0.08]">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 sm:h-14 sm:w-14">
                  <ChefHat className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <Badge className="animate-pulse border-0 bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary sm:text-xs">
                      {t('newOrderAlert')}
                    </Badge>
                    {order.isQrOrder && (
                      <Badge className="border border-teal-400/40 bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-teal-700 dark:bg-teal-950 dark:text-teal-300 sm:text-xs">
                        📱 Müşteri Siparişi
                      </Badge>
                    )}
                  </div>
                  <p
                    id="kds-new-order-title"
                    className="truncate font-heading text-lg font-semibold text-foreground sm:text-2xl md:text-3xl tracking-tight"
                  >
                    {orderSourceLabel(order, t)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm ring-1 ring-border/60 transition hover:bg-muted hover:text-foreground sm:h-12 sm:w-12"
              >
                <X className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80 sm:text-sm">
                    {t('productionSummary')}
                  </span>
                  {moreInQueue > 0 ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-[10px] font-bold uppercase tracking-wide text-amber-950 dark:text-amber-100 sm:text-xs"
                    >
                      {t('popupQueueMore', { count: moreInQueue })}
                    </Badge>
                  ) : null}
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground sm:text-sm">
                  {t('popupItemCount', { count: order.items.length })}
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                {order.items.map((item, idx) => (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}
                    className={cn(
                      'rounded-2xl border border-primary/12 bg-background/90 p-5 sm:p-7 md:p-8',
                      'shadow-[inset_0_1px_0_0_oklch(1_0_0_/0.6)]'
                    )}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6 md:gap-8">
                      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-center sm:gap-1">
                        <div
                          className={cn(
                            'flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground',
                            'shadow-lg shadow-primary/20 sm:h-20 sm:w-20 sm:rounded-3xl sm:text-3xl md:h-24 md:w-24 md:text-4xl'
                          )}
                        >
                          {item.quantity}×
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 space-y-3 sm:space-y-4">
                        <h3 className="font-heading text-3xl font-semibold leading-snug tracking-tight text-foreground sm:text-4xl md:text-[2.5rem] lg:text-[2.75rem]">
                          {productLabel(item, locale)}
                        </h3>

                        {item.is_complimentary && (
                          <Badge
                            variant="secondary"
                            className="w-fit border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
                          >
                            <Sparkles className="mr-1 h-3 w-3" aria-hidden />
                            {t('complimentary')}
                          </Badge>
                        )}

                        {item.notes ? (
                          <div className="flex gap-3 rounded-xl bg-muted/50 px-4 py-3 text-base text-foreground/90 sm:text-lg">
                            <StickyNote className="mt-0.5 h-5 w-5 shrink-0 text-primary/70" aria-hidden />
                            <span className="leading-relaxed">{item.notes}</span>
                          </div>
                        ) : null}

                        {item.removed_ingredients?.length ? (
                          <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {t('removedIngredients')}
                            </p>
                            <ul className="flex flex-wrap gap-1.5">
                              {item.removed_ingredients.map((ing) => (
                                <li
                                  key={ing.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/8 px-2.5 py-1.5 text-sm font-medium text-destructive"
                                >
                                  <MinusCircle className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                                  {locale.startsWith('en') ? ing.name_en || ing.name_tr : ing.name_tr || ing.name_en}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {item.selected_extras?.length ? (
                          <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {t('extras')}
                            </p>
                            <ul className="flex flex-col gap-2">
                              {item.selected_extras.map((ex) => {
                                const opt =
                                  locale.startsWith('en')
                                    ? ex.option_name_en || ex.option_name_tr
                                    : ex.option_name_tr || ex.option_name_en
                                const line = ex.group_name_tr ? `${ex.group_name_tr}: ${opt}` : opt
                                return (
                                  <li
                                    key={`${ex.group_id}-${ex.option_id}`}
                                    className="rounded-xl border border-primary/15 bg-primary/[0.06] px-3 py-2.5 text-sm font-medium text-foreground sm:text-base"
                                  >
                                    {line}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>

              {order.orderNotes ? (
                <div className="mt-4 rounded-xl border border-dashed border-border/80 bg-muted/25 px-4 py-3 text-base text-muted-foreground sm:text-lg">
                  <span className="font-semibold text-foreground/80">{t('orderNote')}: </span>
                  {order.orderNotes}
                </div>
              ) : null}

              <div className="mt-5 shrink-0 space-y-3 border-t border-border/60 pt-5 sm:mt-6 sm:pt-6">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/60 sm:h-2.5">
                  <motion.div
                    key={`${order.id}-progress`}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 15, ease: 'linear' }}
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-emerald-400/90"
                  />
                </div>
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/70 sm:text-xs">
                  {t('autoCloseHint')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
