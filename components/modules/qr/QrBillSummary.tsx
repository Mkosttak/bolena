import type { Order, Payment } from '@/types'
import { calculatePaid, calculateRemaining } from '@/lib/utils/order.utils'

interface QrBillSummaryProps {
  order: Order
  payments: Payment[]
}

const statusConfig = {
  pending: { label: 'Ödeme Bekleniyor', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  partial: { label: 'Kısmi Ödendi', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Ödendi ✓', className: 'bg-green-50 text-green-700 border-green-200' },
}

export function QrBillSummary({ order, payments }: QrBillSummaryProps) {
  const paid = calculatePaid(payments)
  const remaining = calculateRemaining(order.total_amount, payments)
  const config = statusConfig[order.payment_status]

  return (
    <div className="bg-white rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Ara Toplam</span>
        <span className="font-medium text-[#1B3C2A]">₺{order.subtotal.toFixed(2)}</span>
      </div>
      {order.discount_amount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">İndirim</span>
          <span className="font-medium text-green-600">-₺{order.discount_amount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="font-bold text-[#1B3C2A]">Toplam</span>
        <span className="text-xl font-bold text-[#1B3C2A]">₺{order.total_amount.toFixed(2)}</span>
      </div>
      {paid > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Ödenen</span>
          <span className="font-medium text-green-600">₺{paid.toFixed(2)}</span>
        </div>
      )}
      {remaining > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Kalan</span>
          <span className="font-medium text-[#C4841A]">₺{remaining.toFixed(2)}</span>
        </div>
      )}
      <div className={`mt-1 px-3 py-2 rounded-lg border text-sm font-medium text-center ${config.className}`}>
        {config.label}
      </div>
    </div>
  )
}
