'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  LayoutGrid,
  LayoutList,
  History,
  ChefHat,
  Table2,
  ShoppingBag,
  Smartphone,
  Inbox,
  Maximize,
  Minimize,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { kdsKeys, fetchKdsActiveItems, fetchKdsCompletedToday } from '@/lib/queries/kds.queries'
import { tablesKeys, fetchTablesWithOrder } from '@/lib/queries/tables.queries'
import {
  findKdsGroupContainingOrderItem,
  groupItemsByTimeWindow,
  isKnownPlatformChannel,
  itemLeadTimeMinutes,
  orderLeadTimeMinutes,
} from '@/lib/utils/kds.utils'
import {
  attachKitchenNotificationAudioUnlock,
  playKitchenNotificationChime,
} from '@/lib/utils/kds-notification-sound'
import { markKdsGroupReady, undoKdsGroupReady } from '@/app/[locale]/admin/kds/actions'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { KdsColumn } from './KdsColumn'
import { KdsCard } from './KdsCard'
import { KdsDetailSheet } from './KdsDetailSheet'
import { KdsProductionSummary } from './KdsProductionSummary'
import { KdsNewOrderPopup } from './KdsNewOrderPopup'

import type { KdsGroup } from '@/lib/utils/kds.utils'
import type { Table } from '@/types'

interface KdsClientProps {
  locale: string
}

const UNDO_WINDOW_MS = 10000

export function KdsClient({ locale }: KdsClientProps) {
  const t = useTranslations('kds')
  const intlLocale = useLocale()
  const queryClient = useQueryClient()
  const timeLocale = intlLocale.startsWith('tr') ? 'tr-TR' : 'en-GB'

  // --- Column visibility state ---
  const [showTables, setShowTables] = useState(true)
  const [showReservations, setShowReservations] = useState(true)
  const [showPlatforms, setShowPlatforms] = useState(true)
  const [unifiedSort, setUnifiedSort] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // --- Detail sheet ---
  const [selectedGroup, setSelectedGroup] = useState<KdsGroup | null>(null)

  // --- Yeni sipariş bildirimi (FIFO kuyruk; aynı anda birden fazla grup) ---
  const [newOrderQueue, setNewOrderQueue] = useState<KdsGroup[]>([])
  // orderId → bu bildirim döngüsünde yeni eklenen item ID'leri
  const pendingNewItemIds = useRef<Map<string, Set<string>>>(new Map())

  // --- Fullscreen state ---
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Sync state with browser fullscreen
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  // --- Queries ---
  const { data: rawItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: kdsKeys.activeItems(),
    queryFn: fetchKdsActiveItems,
    refetchInterval: 30000,
  })

  const { data: tablesData = [] } = useQuery({
    queryKey: tablesKeys.list(),
    queryFn: fetchTablesWithOrder,
    staleTime: 60000,
  })

  const { data: completedToday = [], isLoading: historyLoading } = useQuery({
    queryKey: kdsKeys.completedToday(),
    queryFn: fetchKdsCompletedToday,
    enabled: showHistory,
    refetchInterval: showHistory ? 60000 : false,
  })

  // Build tableNames map
  const tableNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const t of tablesData as Table[]) {
      map[t.id] = t.name
    }
    return map
  }, [tablesData])

  // Group items
  const allGroups = useMemo(
    () => groupItemsByTimeWindow(rawItems, 2 * 60 * 1000, tableNames),
    [rawItems, tableNames]
  )

  const tableGroups = useMemo(
    () => allGroups.filter((g) => g.orderType === 'table' || (!!g.tableId && (g.orderType === 'reservation' || g.orderType === 'takeaway'))),
    [allGroups]
  )
  const reservationGroups = useMemo(
    () => allGroups.filter((g) => !g.tableId && (g.orderType === 'reservation' || g.orderType === 'takeaway')),
    [allGroups]
  )
  const platformGroups = useMemo(
    () => allGroups.filter((g) => g.orderType === 'platform'),
    [allGroups]
  )

  // Unified view: groups filtered by visibility toggles, sorted by windowStart
  const unifiedGroups = useMemo(() => {
    const filtered = allGroups.filter((g) => {
      const isActuallyTable =
        g.orderType === 'table' ||
        (!!g.tableId && (g.orderType === 'reservation' || g.orderType === 'takeaway'))
      const isActuallyRes =
        !g.tableId && (g.orderType === 'reservation' || g.orderType === 'takeaway')

      if (isActuallyTable) return showTables
      if (isActuallyRes) return showReservations
      if (g.orderType === 'platform') return showPlatforms
      return true
    })
    return [...filtered].sort(
      (a, b) => new Date(a.windowStart).getTime() - new Date(b.windowStart).getTime()
    )
  }, [allGroups, showTables, showReservations, showPlatforms])

  const showAllColumns = useCallback(() => {
    setShowTables(true)
    setShowReservations(true)
    setShowPlatforms(true)
  }, [])

  const historyRows = useMemo(
    () => completedToday.filter((o) => o.items.length > 0),
    [completedToday]
  )

  // Mutfak bildirim sesi: tarayıcı autoplay için ilk etkileşimde AudioContext açılır
  useEffect(() => attachKitchenNotificationAudioUnlock(), [])

  const newOrderQueueHeadId = newOrderQueue[0]?.id

  // Kuyruğun başındaki bildirimi otomatik kapat → sıradaki gösterilir (15 sn)
  useEffect(() => {
    if (!newOrderQueueHeadId) return
    const timer = setTimeout(() => {
      setNewOrderQueue((q) => q.slice(1))
    }, 15000)
    return () => clearTimeout(timer)
  }, [newOrderQueueHeadId])

  // --- Global Realtime ---
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('kds-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: kdsKeys.activeItems() })
          
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as { id: string; order_id: string }
            const orderId = newItem.order_id
            const itemId = newItem.id

            // Bu bildirim döngüsüne yeni gelen item'ı kaydet
            if (!pendingNewItemIds.current.has(orderId)) {
              pendingNewItemIds.current.set(orderId, new Set())
            }
            pendingNewItemIds.current.get(orderId)!.add(itemId)

            setTimeout(async () => {
              try {
                // Bu setTimeout daha önce tetiklenen bir döngü tarafından zaten temizlendiyse atla
                const newIds = pendingNewItemIds.current.get(orderId)
                if (!newIds || newIds.size === 0) return

                const data = await fetchKdsActiveItems()
                const currentGroups = groupItemsByTimeWindow(data || [], 2 * 60 * 1000, tableNames)

                let matchedGroup = findKdsGroupContainingOrderItem(currentGroups, orderId, itemId)
                if (!matchedGroup) {
                  matchedGroup = currentGroups.find((g) => g.orderId === orderId)
                }

                if (!matchedGroup) {
                  pendingNewItemIds.current.delete(orderId)
                  return
                }

                // Sadece yeni gelen item'ları popup'a koy
                const newItemsOnly = matchedGroup.items.filter((i) => newIds.has(i.id))
                if (newItemsOnly.length === 0) {
                  pendingNewItemIds.current.delete(orderId)
                  return
                }

                const popupGroup: KdsGroup = {
                  ...matchedGroup,
                  items: newItemsOnly,
                  itemIds: newItemsOnly.map((i) => i.id),
                }

                // Toplanan yeni item'ları temizle; sonraki setTimeout'lar no-op olur
                pendingNewItemIds.current.delete(orderId)

                setNewOrderQueue((prev) => {
                  const idx = prev.findIndex((g) => g.id === matchedGroup!.id)
                  if (idx >= 0) {
                    // Popup zaten kuyrukta: mevcut entry'ye yeni item'ları ekle
                    const next = [...prev]
                    const existingIds = new Set(next[idx]!.items.map((i) => i.id))
                    const merged = [
                      ...next[idx]!.items,
                      ...newItemsOnly.filter((i) => !existingIds.has(i.id)),
                    ]
                    next[idx] = { ...next[idx]!, items: merged, itemIds: merged.map((i) => i.id) }
                    return next
                  }
                  return [...prev, popupGroup]
                })
                playKitchenNotificationChime()
              } catch {
                // Sessiz
              }
            }, 1000)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: kdsKeys.activeItems() })
          if (showHistory) {
            queryClient.invalidateQueries({ queryKey: kdsKeys.completedToday() })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, showHistory, tableNames])

  // --- Mark ready + undo ---
  const handleMarkReady = useCallback(
    async (itemIds: string[]) => {
      // Optimistic: invalidate immediately (server action will remove from pending)
      const result = await markKdsGroupReady(itemIds)
      if ('error' in result) {
        toast.error(result.error)
        return
      }

      // Refresh query
      queryClient.invalidateQueries({ queryKey: kdsKeys.activeItems() })

      // Undo toast
      toast.success(t('readyToast'), {
        duration: UNDO_WINDOW_MS,
        action: {
          label: t('undo'),
          onClick: async () => {
            const undoResult = await undoKdsGroupReady(itemIds)
            if ('error' in undoResult) {
              toast.error(undoResult.error)
              return
            }
            queryClient.invalidateQueries({ queryKey: kdsKeys.activeItems() })
            toast.success(t('readyUndone'))
          },
        },
      })
    },
    [queryClient, t]
  )

  // --- Render ---
  if (itemsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col [--kds-sticky-offset:7.5rem] sm:[--kds-sticky-offset:5.75rem] lg:[--kds-sticky-offset:4.75rem]">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="px-3 sm:px-4 pt-3 pb-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
                aria-hidden
              >
                <ChefHat className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight text-foreground">
                  {t('title')}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <KdsProductionSummary groups={allGroups} />

              <div className="flex items-center gap-1 rounded-xl bg-muted/80 p-1 border border-border/50">
                <Button
                  size="sm"
                  variant={!unifiedSort ? 'default' : 'ghost'}
                  className="h-8 sm:h-8 px-2.5 sm:px-3 text-xs gap-1.5 rounded-lg"
                  onClick={() => setUnifiedSort(false)}
                  aria-pressed={!unifiedSort}
                >
                  <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="hidden min-[400px]:inline">{t('columnView')}</span>
                </Button>
                <Button
                  size="sm"
                  variant={unifiedSort ? 'default' : 'ghost'}
                  className="h-8 sm:h-8 px-2.5 sm:px-3 text-xs gap-1.5 rounded-lg"
                  onClick={() => setUnifiedSort(true)}
                  aria-pressed={unifiedSort}
                >
                  <LayoutList className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="hidden min-[400px]:inline">{t('unifiedView')}</span>
                </Button>
              </div>

              <Button
                size="sm"
                variant={showHistory ? 'secondary' : 'outline'}
                className="h-8 px-2.5 sm:px-3 text-xs gap-1.5"
                onClick={() => setShowHistory((v) => !v)}
                aria-pressed={showHistory}
                title={showHistory ? t('hideHistory') : t('showHistory')}
              >
                <History className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{showHistory ? t('hideHistory') : t('showHistory')}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 sm:px-3 text-xs gap-1.5"
                onClick={toggleFullscreen}
                title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
              >
                {isFullscreen ? (
                  <Minimize className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : (
                  <Maximize className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                <span className="hidden lg:inline">
                  {isFullscreen ? t('exitFullscreen') : t('fullscreen')}
                </span>
              </Button>
            </div>
          </div>

          {/* Column / source filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-lg border transition-colors',
                showTables
                  ? 'bg-primary/12 text-primary border-primary/35 ring-1 ring-primary/15 shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border/80 hover:bg-muted/50 hover:text-foreground'
              )}
              onClick={() => setShowTables((v) => !v)}
              aria-pressed={showTables}
            >
              <Table2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('columns.tables')}
            </button>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-lg border transition-colors',
                showReservations
                  ? 'bg-primary/12 text-primary border-primary/35 ring-1 ring-primary/15 shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border/80 hover:bg-muted/50 hover:text-foreground'
              )}
              onClick={() => setShowReservations((v) => !v)}
              aria-pressed={showReservations}
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('columns.reservations')}
            </button>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-lg border transition-colors',
                showPlatforms
                  ? 'bg-primary/12 text-primary border-primary/35 ring-1 ring-primary/15 shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border/80 hover:bg-muted/50 hover:text-foreground'
              )}
              onClick={() => setShowPlatforms((v) => !v)}
              aria-pressed={showPlatforms}
            >
              <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('columns.platforms')}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div>
        {unifiedSort ? (
          /* Birleşik görünüm */
          <div className="p-4 sm:p-5">
            {unifiedGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 sm:py-28 text-center rounded-2xl border border-dashed border-border/80 bg-muted/15">
                <Inbox className="h-14 w-14 text-muted-foreground/45" strokeWidth={1.15} aria-hidden />
                <div>
                  <p className="text-base font-semibold text-foreground">{t('emptyColumn')}</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{t('emptyHint')}</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {unifiedGroups.map((group) => (
                  <KdsCard
                    key={group.id}
                    group={group}
                    onMarkReady={handleMarkReady}
                    onCardClick={setSelectedGroup}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Sütun görünümü */
          <div className="flex flex-col lg:flex-row gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border min-h-[60vh]">
            {showTables && (
              <div className="flex-1 min-w-0 p-3 sm:p-4">
                <KdsColumn
                  title={t('columns.tables')}
                  icon={<Table2 className="h-4 w-4" strokeWidth={2.25} />}
                  accentClassName="bg-primary/10 text-primary border border-primary/20"
                  groups={tableGroups}
                  onCardClick={setSelectedGroup}
                  onMarkReady={handleMarkReady}
                />
              </div>
            )}
            {showReservations && (
              <div className="flex-1 min-w-0 p-3 sm:p-4">
                <KdsColumn
                  title={t('columns.reservations')}
                  icon={<ShoppingBag className="h-4 w-4" strokeWidth={2.25} />}
                  accentClassName="bg-primary/10 text-primary border border-primary/20"
                  groups={reservationGroups}
                  onCardClick={setSelectedGroup}
                  onMarkReady={handleMarkReady}
                />
              </div>
            )}
            {showPlatforms && (
              <div className="flex-1 min-w-0 p-3 sm:p-4">
                <KdsColumn
                  title={t('columns.platforms')}
                  icon={<Smartphone className="h-4 w-4" strokeWidth={2.25} />}
                  accentClassName="bg-primary/10 text-primary border border-primary/20"
                  groups={platformGroups}
                  onCardClick={setSelectedGroup}
                  onMarkReady={handleMarkReady}
                />
              </div>
            )}
            {!showTables && !showReservations && !showPlatforms && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 px-4 text-center">
                <p className="text-muted-foreground text-sm font-medium">{t('columnsAllHidden')}</p>
                <Button type="button" variant="default" size="sm" onClick={showAllColumns}>
                  {t('showAllColumns')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Geçmiş ekranı */}
        {showHistory && (
          <div className="border-t border-border px-4 pt-6 pb-8">
            <h2 className="font-bold text-base text-foreground mb-4">{t('historyTitle')}</h2>
            {historyLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : historyRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('historyEmpty')}</p>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[640px]">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">{t('history.time')}</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">{t('history.customer')}</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">{t('history.items')}</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">{t('history.prepTime')}</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider text-right">{t('history.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historyRows.map((order) => {
                      const prepM = orderLeadTimeMinutes(order)
                      return (
                        <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap align-top">
                            <span className="font-mono font-bold text-foreground">
                              {new Date(order.completed_at ?? order.created_at).toLocaleTimeString(timeLocale, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground uppercase tracking-tight">
                                {order.table_id
                                  ? tableNames[order.table_id] ?? order.table_id
                                  : order.customer_name
                                    ? order.customer_name
                                    : order.platform
                                      ? isKnownPlatformChannel(order.platform)
                                        ? t(`platform.${order.platform}`)
                                        : order.platform
                                      : t('headerCustomer')}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium uppercase italic">
                                {order.type === 'takeaway'
                                  ? t('takeaway')
                                  : order.type === 'reservation'
                                    ? t('reservation')
                                    : order.type === 'platform'
                                      ? order.platform && isKnownPlatformChannel(order.platform)
                                        ? t(`platform.${order.platform}`)
                                        : t('headerPlatformDefault')
                                      : t('tableLabel')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-col gap-2">
                              {order.items.map((item) => {
                                const label =
                                  intlLocale.startsWith('en')
                                    ? item.product_name_en || item.product_name_tr
                                    : item.product_name_tr || item.product_name_en
                                const lineM = itemLeadTimeMinutes(item, order.completed_at)
                                return (
                                  <div key={item.id} className="flex flex-col gap-0.5">
                                    <Badge variant="secondary" className="text-[10px] font-bold w-fit max-w-full whitespace-normal text-left h-auto py-1 px-2">
                                      {item.quantity}× {label}
                                    </Badge>
                                    {lineM != null && (
                                      <span className="text-[10px] text-muted-foreground pl-0.5">
                                        {t('history.itemLead', { minutes: lineM })}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top whitespace-nowrap text-muted-foreground">
                            {prepM != null ? t('history.prepMinutes', { minutes: prepM }) : '—'}
                          </td>
                          <td className="px-4 py-4 text-right align-top">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/25 text-[10px] font-black uppercase">
                              {t('ready')}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      <KdsDetailSheet
        group={selectedGroup}
        locale={locale}
        onClose={() => setSelectedGroup(null)}
      />

      {/* New Order Popup Overlay */}
      <KdsNewOrderPopup
        order={newOrderQueue[0] ?? null}
        moreInQueue={Math.max(0, newOrderQueue.length - 1)}
        onClose={() => setNewOrderQueue((q) => q.slice(1))}
      />
    </div>
  )
}
