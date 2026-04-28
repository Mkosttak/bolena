'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { TableOrderScreen } from '@/components/modules/tables/TableOrderScreen'
import { ReservationOrderScreen } from '@/components/modules/reservations/ReservationOrderScreen'
import { PlatformOrderScreen } from '@/components/modules/platform-orders/PlatformOrderScreen'
import { ordersKeys, fetchOrderById } from '@/lib/queries/orders.queries'
import { reservationsKeys } from '@/lib/queries/reservations.queries'
import { createClient } from '@/lib/supabase/client'
import type { KdsGroup } from '@/lib/utils/kds.utils'
import type { Order, Reservation } from '@/types'

interface KdsDetailSheetProps {
  group: KdsGroup | null
  locale: string
  onClose: () => void
}

function useReservationByOrderId(orderId: string | null, orderType: string) {
  return useQuery({
    queryKey: [...reservationsKeys.all, 'by-order', orderId],
    queryFn: async () => {
      if (!orderId) return null
      const supabase = createClient()
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data as Reservation | null
    },
    enabled: !!orderId && (orderType === 'reservation' || orderType === 'takeaway'),
    staleTime: 30000,
  })
}

export function KdsDetailSheet({ group, locale, onClose }: KdsDetailSheetProps) {
  const t = useTranslations('kds')
  const open = !!group

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ordersKeys.order(group?.orderId ?? ''),
    queryFn: () => fetchOrderById(group!.orderId),
    enabled: !!group && group.orderType !== 'table',
    staleTime: 10000,
  })

  const { data: reservation, isLoading: reservationLoading } = useReservationByOrderId(
    group?.orderId ?? null,
    group?.orderType ?? ''
  )

  const isLoading = orderLoading || reservationLoading

  const detailLabel = (() => {
    if (!group) return t('detailTitle')
    if (group.orderType === 'table') {
      return group.tableName ?? t('headerTable')
    }
    return group.customerName ?? t('detailTitle')
  })()

  const detailMeta = (() => {
    if (!group) return null
    if (group.orderType === 'platform') {
      return group.platform ? t(`platform.${group.platform}`) : t('headerPlatformDefault')
    }
    if (group.orderType === 'takeaway') return t('takeaway')
    if (group.orderType === 'reservation') return t('reservation')
    return t('tableLabel')
  })()

  const renderContent = () => {
    if (!group) return null

    if (group.orderType === 'table') {
      if (!group.tableId) return null
      return (
        <TableOrderScreen
          tableId={group.tableId}
          tableName={group.tableName ?? 'Masa'}
          locale={locale}
          embedded
        />
      )
    }

    if (isLoading) {
      return (
        <div className="p-4 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )
    }

    if (group.orderType === 'reservation' || group.orderType === 'takeaway') {
      if (!order || !reservation) return null
      return (
        <ReservationOrderScreen
          reservationId={reservation.id}
          customerName={reservation.customer_name}
          orderId={group.orderId}
          initialOrder={order as Order}
          onClose={onClose}
          embedded
        />
      )
    }

    if (group.orderType === 'platform') {
      if (!order) return null
      return (
        <PlatformOrderScreen
          orderId={group.orderId}
          initialOrder={order as Order}
          onClose={onClose}
          embedded
        />
      )
    }

    return null
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={
          // Varsayılan Sheet: data-[side=right]:sm:max-w-sm (~384px) — merge edilmediği için ! ile eziyoruz
          'w-full max-w-none gap-0 p-0 sm:!w-[min(97vw,1000px)] sm:!max-w-[1000px] xl:!w-[min(95vw,1280px)] xl:!max-w-[1280px]'
        }
      >
        <SheetHeader className="border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="truncate text-base font-black tracking-tight sm:text-lg">
                {detailLabel}
              </SheetTitle>
              {detailMeta && (
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {detailMeta}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 rounded-full px-3 text-xs font-semibold"
              onClick={onClose}
            >
              {t('close')}
            </Button>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-hidden bg-background">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  )
}
