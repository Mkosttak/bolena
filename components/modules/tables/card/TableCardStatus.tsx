'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface TableCardStatusProps {
  hasActiveOrder: boolean
}

export function TableCardStatus({ hasActiveOrder }: TableCardStatusProps) {
  const t = useTranslations('tables')

  return (
    <div className="flex items-center">
      <div
        className={cn(
          'text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border transition-all duration-500 flex items-center gap-1.5 backdrop-blur-sm',
          hasActiveOrder
            ? 'bg-amber-500/5 text-amber-600/70 border-amber-500/10'
            : 'bg-emerald-500/5 text-emerald-600/70 border-emerald-500/10'
        )}
      >
        <span
          className={cn(
            'h-1 w-1 rounded-full',
            hasActiveOrder ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
          )}
        />
        {hasActiveOrder ? t('hasOrder') : t('noOrder')}
      </div>
    </div>
  )
}
