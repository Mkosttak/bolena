'use client'

import { useTranslations } from 'next-intl'
import type { Order, Payment } from '@/types'
import { Separator } from '@/components/ui/separator'

interface OrderSummaryProps {
  order: Order
  payments?: Payment[]
}

export function OrderSummary({ order, payments = [] }: OrderSummaryProps) {
  const t = useTranslations('orders')

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = Math.max(0, Number(order.total_amount) - totalPaid)
  const hasDiscount = Number(order.discount_amount) > 0

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-sm">
        {/* Ara Toplam */}
        <div className="flex justify-between text-muted-foreground">
          <span>{t('subtotal')}</span>
          <span>₺{Number(order.subtotal).toFixed(2)}</span>
        </div>

        {/* İndirim */}
        {hasDiscount && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>
              {t('discountApplied')}
              {order.discount_type === 'percent' ? ` (%${order.discount_amount})` : ''}
            </span>
            <span>
              −₺
              {order.discount_type === 'percent'
                ? ((Number(order.subtotal) * Number(order.discount_amount)) / 100).toFixed(2)
                : Number(order.discount_amount).toFixed(2)}
            </span>
          </div>
        )}

        {/* Genel Toplam */}
        <div className="flex justify-between font-bold text-base pt-1">
          <span>{t('total')}</span>
          <span className="text-primary text-lg">₺{Number(order.total_amount).toFixed(2)}</span>
        </div>

        <Separator />

        {/* Ödenen ve Kalan */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-muted-foreground">
            <span>{t('paidAmount')}</span>
            <span className="font-medium text-foreground">₺{totalPaid.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-semibold">{t('remainingAmount')}</span>
            <span className={`font-bold text-lg ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              ₺{remaining.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

