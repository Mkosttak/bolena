'use client'

import { useTranslations } from 'next-intl'

interface TableCardFinancialsProps {
  totalAmount: number
  paidAmount: number
  remainingAmount: number
}

export function TableCardFinancials({
  totalAmount,
  paidAmount,
  remainingAmount,
}: TableCardFinancialsProps) {
  const t = useTranslations('orders')
  const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  return (
    <div className="space-y-2 animate-in fade-in duration-500">
      <div className="flex justify-between items-end gap-2">
        <div className="flex flex-col">
          <span className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-wider">
            {t('remainingAmount')}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-heading font-bold text-foreground tracking-tighter">
              {remainingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground/60">₺</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end text-right">
           <span className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-wider">
            {t('total')}
          </span>
          <span className="text-[10px] font-mono font-medium text-muted-foreground/60">
            {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </span>
        </div>
      </div>
    </div>
  )
}
