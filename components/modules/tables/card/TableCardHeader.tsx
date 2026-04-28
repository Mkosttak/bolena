'use client'

import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { Smartphone, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableCardHeaderProps {
  name: string
  categoryName?: string
  isQrOrder?: boolean
  orderCreatedAt?: string
  locale: string
}

export function TableCardHeader({
  name,
  categoryName,
  isQrOrder,
  orderCreatedAt,
  locale,
}: TableCardHeaderProps) {
  const t = useTranslations('tables')
  const dateLocale = locale === 'tr' ? tr : enUS

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="font-heading text-base md:text-lg tracking-tight text-foreground truncate group-hover:text-primary transition-colors duration-300">
          {name}
        </h3>
        
        {isQrOrder && (
          <Smartphone size={12} className="text-teal-500/70 shrink-0" strokeWidth={2} />
        )}
      </div>

      <div className="flex items-center gap-2">
        {categoryName && (
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/40">
            {categoryName}
          </span>
        )}
        
        {orderCreatedAt && (
          <span className="text-[9px] text-muted-foreground/30 font-medium">
            {formatDistanceToNow(new Date(orderCreatedAt), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </span>
        )}
      </div>
    </div>
  )
}
