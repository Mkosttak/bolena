'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Receipt,
  ArrowRightLeft,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { closeOrder } from '@/app/[locale]/admin/orders/actions'
import { calculateRemaining } from '@/lib/utils/order.utils'

import { createClient } from '@/lib/supabase/client'
import { ordersKeys, fetchFullOrder } from '@/lib/queries/orders.queries'
import { tablesKeys, fetchTablesWithOrder } from '@/lib/queries/tables.queries'
import { getOrCreateTableOrder, transferTableOrder } from '@/app/[locale]/admin/tables/actions'
import { AddProductModal } from '@/components/modules/orders/AddProductModal'
import { PaymentModal } from '@/components/modules/orders/PaymentModal'
import { OrderItemList } from '@/components/modules/orders/OrderItemList'
import { OrderSummary } from '@/components/modules/orders/OrderSummary'
import { EditOrderItemModal } from '@/components/modules/orders/EditOrderItemModal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import Link from 'next/link'
import type { OrderItem } from '@/types'

interface TableOrderScreenProps {
  tableId: string
  tableName: string
  locale: string
  embedded?: boolean
  /** Server'da önceden oluşturulan/bulunan orderId — varsa client-side init atlanır */
  initialOrderId?: string | null
  /** Server'da orderId alınamadıysa hata mesajı */
  initialOrderError?: string
}

export function TableOrderScreen({
  tableId,
  tableName,
  locale,
  embedded = false,
  initialOrderId = null,
  initialOrderError,
}: TableOrderScreenProps) {
  const t = useTranslations('tables')
  const tOrders = useTranslations('orders')
  const router = useRouter()
  const queryClient = useQueryClient()

  const [orderId, setOrderId] = useState<string | null>(initialOrderId)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)
  // Server'dan orderId geldiyse init gerekmez
  const [isInitializing, setIsInitializing] = useState(initialOrderId == null && !initialOrderError)
  const searchParams = useSearchParams()

  // Server'dan orderId gelmediyse (fallback) client'ta çek
  useEffect(() => {
    if (initialOrderId != null || initialOrderError) return
    let cancelled = false
    async function init() {
      const result = await getOrCreateTableOrder(tableId)
      if (cancelled) return
      if ('error' in result) {
        toast.error(result.error)
        setIsInitializing(false)
        return
      }
      setOrderId(result.orderId)
      setIsInitializing(false)
    }
    init()
    return () => { cancelled = true }
  }, [tableId, initialOrderId, initialOrderError])

  // Server'da hata olduysa göster
  useEffect(() => {
    if (initialOrderError) {
      toast.error(initialOrderError)
    }
  }, [initialOrderError])

  // Realtime aboneliği
  useEffect(() => {
    if (!orderId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`table-order-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          const row = (payload.new ?? payload.old) as { order_id?: string } | null
          if (row?.order_id !== orderId) return
          queryClient.invalidateQueries({ queryKey: ordersKeys.full(orderId) })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const row = (payload.new ?? payload.old) as { id?: string } | null
          if (row?.id !== orderId) return
          queryClient.invalidateQueries({ queryKey: ordersKeys.full(orderId) })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          const row = (payload.new ?? payload.old) as { order_id?: string } | null
          if (row?.order_id !== orderId) return
          queryClient.invalidateQueries({ queryKey: ordersKeys.full(orderId) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, queryClient])

  // Tek round-trip: order + items + payments
  const { data: fullOrder, isLoading: fullOrderLoading } = useQuery({
    queryKey: ordersKeys.full(orderId ?? ''),
    queryFn: () => fetchFullOrder(orderId!),
    enabled: !!orderId,
    refetchOnMount: true,
    refetchInterval: 20_000,
  })

  const order = fullOrder?.order ?? null
  const items = fullOrder?.items ?? []
  const payments = fullOrder?.payments ?? []

  const { data: allTables = [] } = useQuery({
    queryKey: tablesKeys.list(),
    queryFn: fetchTablesWithOrder,
    enabled: transferModalOpen,
  })

  const isLoading = isInitializing || fullOrderLoading

  // URL'den ödeme modalını tetikle
  useEffect(() => {
    if (searchParams.get('payment') === 'true' && !isLoading && order && items.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaymentModalOpen(true)
      // Parametreyi temizle
      router.replace(`/${locale}/admin/tables/${tableId}`, { scroll: false })
    }
  }, [searchParams, isLoading, order, items.length, router, locale, tableId])

  const remaining = order ? calculateRemaining(Number(order.total_amount), payments) : 0

  const closeOrderMutation = useMutation({
    mutationFn: () => closeOrder(orderId!),
    onSuccess: (result) => {
      if ('error' in result && result.error) {
        toast.error(result.error)
        return
      }
      toast.success(tOrders('orderClosed'))
      handleOrderClosed()
    },
  })

  const transferMutation = useMutation({
    mutationFn: (targetId: string) => transferTableOrder(tableId, targetId),
    onSuccess: (result, targetId) => {
      if ('error' in result && result.error) {
        toast.error(result.error)
        return
      }
      toast.success(t('transferSuccess'))
      setTransferModalOpen(false)
      // Yeni masaya yönlendir
      router.push(`/${locale}/admin/tables/${targetId}`)
      queryClient.invalidateQueries({ queryKey: tablesKeys.list() })
    },
  })

  // Boş masada otomatik ürün ekleme penceresini aç
  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (!isLoading && items.length === 0 && !autoOpenedRef.current) {
      autoOpenedRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddModalOpen(true)
    }
  }, [isLoading, items.length])



  function handleOrderClosed() {
    // Masa listesini güncelle ve geri dön
    queryClient.invalidateQueries({ queryKey: tablesKeys.list() })
    router.push(`/${locale}/admin/tables`)
  }


  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header
        className={cn(
          'sticky top-0 z-30 shrink-0 border-b border-border/60 bg-card/80 shadow-sm backdrop-blur-md',
          embedded ? 'px-4 py-3 sm:px-4' : 'px-4 py-3 sm:px-5'
        )}
      >
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
          <div className={cn('flex justify-between gap-3', embedded ? 'flex-col sm:flex-row sm:items-start' : 'items-center')}>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {!embedded && (
                <Link href={`/${locale}/admin/tables`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full hover:bg-muted"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-tight text-foreground sm:text-xl">
                  {tableName}
                </h1>
                {order && (
                  <div className="mt-1">
                    <Badge
                      variant={order.payment_status === 'paid' ? 'outline' : 'default'}
                      className={cn(
                        'h-5 border-none px-2 py-0 text-[10px] font-black uppercase',
                        order.payment_status === 'pending' &&
                          'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
                        order.payment_status === 'partial' &&
                          'bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200',
                        order.payment_status === 'paid' &&
                          'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200'
                      )}
                    >
                      {order.payment_status === 'pending' && tOrders('paymentPending')}
                      {order.payment_status === 'partial' && tOrders('paymentPartial')}
                      {order.payment_status === 'paid' && tOrders('paid')}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className={cn('flex shrink-0 items-center gap-1 self-end sm:self-auto', embedded && 'w-full justify-end sm:w-auto')}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setTransferModalOpen(true)}
                disabled={isLoading || !order || items.length === 0}
                title={t('transferTable')}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
              {order?.status === 'active' && remaining <= 0.01 && items.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  className="hidden h-9 bg-emerald-600 px-3 font-bold hover:bg-emerald-700 sm:inline-flex"
                  onClick={() => closeOrderMutation.mutate()}
                  disabled={closeOrderMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {tOrders('closeTable')}
                </Button>
              )}
            </div>
          </div>

          <div className={cn(embedded ? 'grid grid-cols-1 gap-2 sm:grid-cols-2' : 'flex gap-1.5 sm:gap-2')}>
            <Button
              size="sm"
              className="h-8 flex-1 rounded-lg bg-primary px-2 text-xs font-bold shadow-sm shadow-primary/10 sm:h-9 sm:text-sm"
              onClick={() => setAddModalOpen(true)}
              disabled={isLoading}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
              {tOrders('addItem')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 flex-1 rounded-lg border border-border/80 bg-card px-2 text-xs font-bold hover:bg-muted/80 sm:h-9 sm:text-sm"
              onClick={() => setPaymentModalOpen(true)}
              disabled={isLoading || !order || items.length === 0}
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
              {tOrders('payment')}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-muted/15">
        {/* Sipariş listesi + hesap özeti */}
        <div
          className={cn(
            'mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 pb-28 sm:p-5',
            embedded
              ? 'pb-24'
              : 'xl:grid-cols-12 xl:gap-5 xl:overflow-hidden xl:p-5 xl:pb-24'
          )}
        >
          <section
            className={cn(
              'flex min-h-0 flex-col',
              !embedded && 'xl:col-span-8 2xl:col-span-8'
            )}
          >
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md ring-1 ring-foreground/5">
                <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-muted/40 px-3 py-2.5 sm:px-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                    {t('currentOrders')}
                  </h2>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
                  <OrderItemList
                    items={items}
                    orderId={orderId!}
                    onEdit={(item) => {
                      setSelectedItem(item)
                      setEditModalOpen(true)
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          <section
            className={cn(
              'flex min-h-0 flex-col',
              !embedded && 'xl:col-span-4 2xl:col-span-4'
            )}
          >
            {!isLoading && order && items.length > 0 && (
              <div className="space-y-4 overflow-hidden rounded-2xl border border-primary/15 bg-card p-4 shadow-lg ring-1 ring-primary/10 sm:p-5">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                    {tOrders('orderSummary')}
                  </h2>
                </div>
                <OrderSummary order={order} payments={payments} />
                {order.status === 'active' && remaining <= 0.01 && (
                  <Button
                    className="h-12 w-full rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-sm font-black shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.99] sm:h-14 sm:text-base dark:shadow-emerald-900/40"
                    onClick={() => closeOrderMutation.mutate()}
                    disabled={closeOrderMutation.isPending}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    {tOrders('closeTable')}
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modaller */}
      {orderId && (
        <>
          <AddProductModal
            open={addModalOpen}
            orderId={orderId}
            onClose={() => setAddModalOpen(false)}
          />

          {order && (
            <PaymentModal
              open={paymentModalOpen}
              order={order}
              items={items}
              payments={payments}
              onClose={() => setPaymentModalOpen(false)}
              onOrderClosed={handleOrderClosed}
            />
          )}

          <EditOrderItemModal
            open={editModalOpen}
            orderId={orderId}
            item={selectedItem}
            onClose={() => {
              setEditModalOpen(false)
              setSelectedItem(null)
            }}
          />

          <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle>{t('transferTable')}</DialogTitle>
                <DialogDescription>{t('transferDesc')}</DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Kategorilere göre masaları listele */}
                {allTables.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {allTables
                      .filter(tbl => tbl.id !== tableId)
                      .map(tbl => {
                        const isOccupied = tbl.activeOrder != null
                        return (
                          <Button
                            key={tbl.id}
                            variant={isOccupied ? "secondary" : "outline"}
                            className={`h-auto py-3 flex flex-col items-center gap-1 border-2 transition-all ${isOccupied ? 'border-muted/20 bg-muted/10 opacity-40 cursor-not-allowed' : 'border-muted-foreground/10'}`}
                            onClick={() => transferMutation.mutate(tbl.id)}
                            disabled={transferMutation.isPending || isOccupied}
                          >
                            <span className="font-bold">{tbl.name}</span>
                            {isOccupied ? (
                              <Badge variant="default" className="text-[10px] py-0 px-1 font-bold uppercase bg-amber-500 hover:bg-amber-600 border-none">{t('hasOrder')}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-bold uppercase opacity-60">{t('noOrder')}</Badge>
                            )}
                          </Button>
                        )
                      })
                    }
                  </div>
                ) : (
                  <div className="py-10 text-center text-muted-foreground italic text-sm">
                    {t('noTables')}
                  </div>
                )}
              </div>

              <DialogFooter className="p-6 pt-0">
                <Button variant="outline" onClick={() => setTransferModalOpen(false)} className="w-full">
                  {tOrders('cancel') || 'Vazgeç'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
