'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { platformOrdersKeys } from '@/lib/queries/platform-orders.queries'
import { addPayment } from '@/app/[locale]/admin/orders/actions'
import { deliverPlatformOrder } from '@/app/[locale]/admin/platform-orders/actions'
import type { Order, PaymentMethod } from '@/types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface PaymentModalSimpleProps {
  open: boolean
  order: Order
  onClose: () => void
  onDelivered: () => void
}

/**
 * Kurye siparişleri için tek seferlik ödeme + teslim modal'ı.
 * K-09: Platform siparişlerinde parçalı ödeme yoktur.
 */
export function PaymentModalSimple({
  open,
  order,
  onClose,
  onDelivered,
}: PaymentModalSimpleProps) {
  const t = useTranslations('platformOrders')
  const tOrders = useTranslations('orders')
  const queryClient = useQueryClient()

  const [method, setMethod] = useState<PaymentMethod>('cash')

  const mutation = useMutation({
    mutationFn: async () => {
      const payResult = await addPayment(order.id, method, Number(order.total_amount))
      if (payResult.error) return payResult

      const deliverResult = await deliverPlatformOrder(order.id)
      return deliverResult
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(t('delivered'))
      queryClient.invalidateQueries({ queryKey: platformOrdersKeys.all })
      onDelivered()
      onClose()
    },
  })

  const METHOD_LABELS: Record<'cash' | 'card', string> = {
    cash: tOrders('cash'),
    card: tOrders('card'),
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('payment')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tutar */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-1 text-sm">
            <div className="flex justify-between font-semibold text-base">
              <span>{tOrders('total')}</span>
              <span>₺{Number(order.total_amount).toFixed(2)}</span>
            </div>
            {order.customer_name && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t('customerName')}</span>
                <span>{order.customer_name}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Ödeme yöntemi */}
          <div className="space-y-2">
            <Label>Ödeme Yöntemi</Label>
            <div className="flex gap-2">
              {(['cash', 'card'] as const).map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={method === m ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setMethod(m)}
                >
                  {METHOD_LABELS[m]}
                </Button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {t('payAndDeliver')} — ₺{Number(order.total_amount).toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
