'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchFullOrder } from '@/lib/queries/orders.queries'
import { qrKeys } from '@/lib/queries/qr.queries'
import { QrOrderItem } from './QrOrderItem'
import { QrBillSummary } from './QrBillSummary'
import type { FullOrder } from '@/lib/queries/orders.queries'

interface QrBillTabProps {
  token: string
  sessionToken: string
  orderId: string
  initialOrder?: FullOrder | null
}

export function QrBillTab({ sessionToken, orderId, initialOrder }: QrBillTabProps) {
  const queryClient = useQueryClient()

  const { data: fullOrder } = useQuery({
    queryKey: qrKeys.order(sessionToken),
    queryFn: () => fetchFullOrder(orderId),
    staleTime: 0,
    initialData: initialOrder ?? undefined,
  })

  // Realtime subscription — hesap sekmesi açıkken aktif
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`qr-bill-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: qrKeys.order(sessionToken) })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: qrKeys.order(sessionToken) })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: qrKeys.order(sessionToken) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, sessionToken, queryClient])

  const activeItems = (fullOrder?.items ?? []).filter((i) => i.quantity > 0)

  if (!fullOrder || activeItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 text-center px-6">
        <Receipt className="w-12 h-12 text-gray-300 mb-4" />
        <p className="font-semibold text-gray-600">Henüz sipariş yok</p>
        <p className="text-sm text-gray-400 mt-1">Menüden ürün ekleyerek sipariş verin</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 space-y-4 pb-24">
        {/* Order items */}
        <div className="bg-white rounded-xl px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C4841A] pt-4 pb-2">
            Sipariş Kalemleri
          </p>
          {activeItems.map((item) => (
            <QrOrderItem key={item.id} item={item} />
          ))}
        </div>

        {/* Bill summary */}
        <QrBillSummary order={fullOrder.order} payments={fullOrder.payments} />

        <p className="text-xs text-center text-gray-400">
          Ödeme için garsonunuzu çağırın
        </p>
      </div>
    </div>
  )
}
