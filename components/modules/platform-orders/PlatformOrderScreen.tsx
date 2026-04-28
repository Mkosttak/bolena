'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ArrowLeft, Plus, CheckCircle, X } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { ordersKeys, fetchOrderItems, fetchOrderById } from '@/lib/queries/orders.queries'
import { platformOrdersKeys } from '@/lib/queries/platform-orders.queries'
import {
  deliverPlatformOrder,
  cancelPlatformOrder,
} from '@/app/[locale]/admin/platform-orders/actions'
import type { Order } from '@/types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderItemList } from '@/components/modules/orders/OrderItemList'
import { OrderSummary } from '@/components/modules/orders/OrderSummary'
import { AddProductModal } from '@/components/modules/orders/AddProductModal'
import { PaymentModalSimple } from '@/components/modules/orders/PaymentModalSimple'
import { EditOrderItemModal } from '@/components/modules/orders/EditOrderItemModal'
import type { OrderItem } from '@/types'
import { cn } from '@/lib/utils'

const PLATFORM_LABELS: Record<string, string> = {
  yemeksepeti: '🍽️ Yemeksepeti',
  getir: '🟣 Getir',
  trendyol: '🟠 Trendyol',
  courier: '🛵 Kurye',
}

interface PlatformOrderScreenProps {
  orderId: string
  initialOrder: Order
  onClose: () => void
  embedded?: boolean
  autoOpenAddModal?: boolean
  readOnly?: boolean
}

export function PlatformOrderScreen({
  orderId,
  initialOrder,
  onClose,
  embedded = false,
  autoOpenAddModal = false,
  readOnly = false,
}: PlatformOrderScreenProps) {
  const t = useTranslations('platformOrders')
  const tOrders = useTranslations('orders')
  const queryClient = useQueryClient()
  const supabase = createClient()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)

  // Yeni oluşturulan siparişte otomatik ürün ekleme ekranı
  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (autoOpenAddModal && !autoOpenedRef.current) {
      autoOpenedRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddModalOpen(true)
    }
  }, [autoOpenAddModal])

  const { data: currentOrder } = useQuery({
    queryKey: ordersKeys.order(orderId),
    queryFn: () => fetchOrderById(orderId),
    initialData: initialOrder,
  })

  const order = currentOrder ?? initialOrder
  const isCourier = order.platform === 'courier'

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ordersKeys.items(orderId),
    queryFn: () => fetchOrderItems(orderId),
  })

  // Realtime — K-05: sadece platform siparişleri sayfasında
  useEffect(() => {
    const channel = supabase
      .channel(`platform-order-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items', filter: `order_id=eq.${orderId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ordersKeys.items(orderId) })
          queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, queryClient, supabase])

  const deliverMutation = useMutation({
    mutationFn: () => deliverPlatformOrder(orderId),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(t('delivered'))
      queryClient.invalidateQueries({ queryKey: platformOrdersKeys.all })
      onClose()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelPlatformOrder(orderId),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: platformOrdersKeys.all })
      onClose()
    },
  })

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className={cn('shrink-0 border-b bg-card/95 backdrop-blur', embedded ? 'px-4 py-3 sm:px-4' : 'px-6 py-4')}>
        <div className={cn('flex gap-3', embedded ? 'flex-col' : 'items-center justify-between')}>
          <div className="flex items-center gap-3">
            {!embedded && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{order.customer_name}</h2>
                <Badge variant="outline" className="text-xs">
                  {PLATFORM_LABELS[order.platform ?? ''] ?? order.platform}
                </Badge>
              </div>
              {order.customer_address && (
                <p className="text-xs text-muted-foreground truncate max-w-64">
                  {order.customer_address}
                </p>
              )}
            </div>
          </div>

          {!readOnly && (
            <div className={cn(embedded ? 'grid grid-cols-1 gap-2 sm:grid-cols-2' : 'flex gap-2')}>
              <Button onClick={() => setAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {tOrders('addItem')}
              </Button>

              {isCourier && (
                <Button
                  variant="outline"
                  onClick={() => setPaymentModalOpen(true)}
                  disabled={items.length === 0 || deliverMutation.isPending}
                >
                  {t('payment')}
                </Button>
              )}

              <Button
                variant="default"
                className={cn(embedded && isCourier && 'sm:col-span-1', embedded && !isCourier && 'sm:col-span-1')}
                onClick={() => deliverMutation.mutate()}
                disabled={deliverMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('delivered')}
              </Button>

              <Button
                variant="ghost"
                size={embedded ? 'sm' : 'icon'}
                className={cn(
                  embedded ? 'h-10 justify-center rounded-lg border border-red-100 text-destructive hover:bg-red-50 hover:text-destructive' : 'h-9 w-9 text-destructive hover:text-destructive'
                )}
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                <X className="h-4 w-4" />
                {embedded && <span className="ml-2">{t('cancel')}</span>}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {order.notes && (
          <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm text-amber-800">
            <span className="font-medium">Not: </span>
            {order.notes}
          </div>
        )}

        {itemsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-4">
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
          <div className="rounded-lg border bg-card p-4">
            <OrderSummary order={order} />
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

          {isCourier && (
            <PaymentModalSimple
              open={paymentModalOpen}
              order={order}
              onClose={() => setPaymentModalOpen(false)}
              onDelivered={onClose}
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
        </>
      )}
    </div>
  )
}
