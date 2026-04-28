'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Plus, CreditCard, CheckCircle2, TableProperties } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { ordersKeys, fetchOrderItems, fetchPayments, fetchOrderById } from '@/lib/queries/orders.queries'
import { reservationsKeys, fetchReservation } from '@/lib/queries/reservations.queries'
import { tablesKeys, fetchTablesWithOrder } from '@/lib/queries/tables.queries'
import { completeReservationOrder } from '@/app/[locale]/admin/reservations/actions'
import { calculateRemaining } from '@/lib/utils/order.utils'
import type { Order, OrderItem, Payment } from '@/types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderItemList } from '@/components/modules/orders/OrderItemList'
import { OrderSummary } from '@/components/modules/orders/OrderSummary'
import { AddProductModal } from '@/components/modules/orders/AddProductModal'
import { PaymentModal } from '@/components/modules/orders/PaymentModal'
import { EditOrderItemModal } from '@/components/modules/orders/EditOrderItemModal'
import { AssignTableModal } from '@/components/modules/reservations/AssignTableModal'
import { cn } from '@/lib/utils'

interface ReservationOrderScreenProps {
  reservationId: string
  customerName: string
  orderId: string
  initialOrder: Order
  onClose: () => void
  embedded?: boolean
  autoOpenAddModal?: boolean
  autoOpenPaymentModal?: boolean
  readOnly?: boolean
}

export function ReservationOrderScreen({
  reservationId,
  customerName,
  orderId,
  initialOrder,
  onClose,
  embedded = false,
  autoOpenAddModal = false,
  autoOpenPaymentModal = false,
  readOnly = false,
}: ReservationOrderScreenProps) {
  const t = useTranslations('reservations')
  const tOrders = useTranslations('orders')
  const queryClient = useQueryClient()
  const supabase = createClient()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [assignTableOpen, setAssignTableOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)

  const { data: currentOrder } = useQuery({
    queryKey: ordersKeys.order(orderId),
    queryFn: () => fetchOrderById(orderId),
    initialData: initialOrder,
  })

  // Rezervasyon detaylarını çek (tip ve tarih için)
  const { data: reservation } = useQuery({
    queryKey: reservationsKeys.detail(reservationId),
    queryFn: () => fetchReservation(reservationId),
  })

  const order = currentOrder ?? initialOrder

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ordersKeys.items(orderId),
    queryFn: () => fetchOrderItems(orderId),
  })

  const { data: payments = [] } = useQuery({
    queryKey: ordersKeys.payments(orderId),
    queryFn: () => fetchPayments(orderId),
  })

  const remaining = calculateRemaining(Number(order.total_amount), payments as Payment[])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`reservation-order-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items', filter: `order_id=eq.${orderId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ordersKeys.items(orderId) })
          queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `order_id=eq.${orderId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ordersKeys.payments(orderId) })
          queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, queryClient, supabase])

  // Yeni oluşturulan siparişte otomatik ürün ekleme ekranı
  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (autoOpenAddModal && !itemsLoading && !autoOpenedRef.current) {
      autoOpenedRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddModalOpen(true)
    }
  }, [autoOpenAddModal, itemsLoading])

  // Ödeme al butonundan gelince direkt ödeme modalı
  const autoPaymentOpenedRef = useRef(false)
  useEffect(() => {
    if (autoOpenPaymentModal && !itemsLoading && !autoPaymentOpenedRef.current && items.length > 0) {
      autoPaymentOpenedRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaymentModalOpen(true)
    }
  }, [autoOpenPaymentModal, itemsLoading, items.length])

  const completeMutation = useMutation({
    mutationFn: () => completeReservationOrder(reservationId),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
      onClose()
    },
  })

  async function handleOrderClosed() {
    await completeReservationOrder(reservationId)
    queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
    onClose()
  }

  async function openAssignTableModal() {
    try {
      await queryClient.prefetchQuery({
        queryKey: tablesKeys.list(),
        queryFn: fetchTablesWithOrder,
      })
    } catch {
      /* Modal açılınca useQuery yine dener */
    }
    setAssignTableOpen(true)
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className={cn('shrink-0 border-b bg-card/95 backdrop-blur', embedded ? 'px-4 py-3 sm:px-4' : 'px-6 py-4')}>
        <div className={cn('mb-3 flex gap-3', embedded ? 'items-start' : 'items-center')}>
          {!embedded && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{customerName}</h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {reservation && (
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-primary/5">
                  {reservation.type === 'takeaway' ? t('typeTakeaway') : t('typePending')}
                  {reservation.reservation_date && (
                    <span className="ml-1 opacity-70">
                      • {format(parseISO(reservation.reservation_date), 'dd MMM', { locale: undefined })}
                      {reservation.reservation_time ? ` ${reservation.reservation_time.slice(0, 5)}` : ''}
                    </span>
                  )}
                </Badge>
              )}
              {order && (
                <Badge
                  variant={order.payment_status === 'paid' ? 'outline' : 'default'}
                  className="text-[10px] font-bold uppercase tracking-tight"
                >
                  {order.payment_status === 'pending' && tOrders('paymentPending')}
                  {order.payment_status === 'partial' && tOrders('paymentPartial')}
                  {order.payment_status === 'paid' && tOrders('paid')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className={cn(embedded ? 'grid grid-cols-1 gap-2 sm:grid-cols-2' : 'flex flex-wrap gap-2')}>
            <Button size="sm" onClick={() => setAddModalOpen(true)} disabled={itemsLoading}>
              <Plus className="h-4 w-4 mr-1.5" />
              {tOrders('addItem')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPaymentModalOpen(true)}
              disabled={items.length === 0}
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              {t('payment')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void openAssignTableModal()}
            >
              <TableProperties className="h-4 w-4 mr-1.5" />
              {t('assignTable')}
            </Button>
            {order.status === 'active' && remaining <= 0.01 && items.length > 0 && (
              <Button
                size="sm"
                className={cn('bg-green-600 hover:bg-green-700 text-white', embedded && 'sm:col-span-2')}
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {tOrders('closeOrder')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {itemsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              {t('viewOrder')}
            </h2>
            <OrderItemList
              items={items}
              orderId={orderId}
              onEdit={(item) => {
                setSelectedItem(item)
                setEditModalOpen(true)
              }}
            />
          </div>
        )}

        {items.length > 0 && (
          <div className="rounded-lg border bg-card p-6 space-y-6">
            <OrderSummary order={order} payments={payments as Payment[]} />

            {!readOnly && order.status === 'active' && remaining <= 0.01 && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-bold transition-all active:scale-[0.98]"
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {tOrders('closeOrder')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {!readOnly && (
        <>
          <AddProductModal
            open={addModalOpen}
            orderId={orderId}
            onClose={() => setAddModalOpen(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ordersKeys.items(orderId) })
              queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
            }}
          />

          <PaymentModal
            open={paymentModalOpen}
            order={order}
            items={items}
            payments={payments as Payment[]}
            onClose={() => setPaymentModalOpen(false)}
            onOrderClosed={handleOrderClosed}
          />

          <EditOrderItemModal
            open={editModalOpen}
            orderId={orderId}
            item={selectedItem}
            onClose={() => {
              setEditModalOpen(false)
              setSelectedItem(null)
            }}
          />

          <AssignTableModal
            open={assignTableOpen}
            onClose={() => setAssignTableOpen(false)}
            reservationId={reservationId}
          />
        </>
      )}
    </div>
  )
}
