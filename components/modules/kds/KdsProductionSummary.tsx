'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChefHat, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { KdsGroup } from '@/lib/utils/kds.utils'
import { buildProductionSummary } from '@/lib/utils/kds.utils'

interface KdsProductionSummaryProps {
  groups: KdsGroup[]
}

export function KdsProductionSummary({ groups }: KdsProductionSummaryProps) {
  const t = useTranslations('kds')
  const [open, setOpen] = useState(false)
  const summary = buildProductionSummary(groups)
  const totalUnits = summary.reduce((s, i) => s + i.totalQuantity, 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(triggerProps) => (
          <Button
            {...triggerProps}
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              'h-8 gap-2 px-2.5 sm:px-3 text-xs font-semibold border-primary/25 bg-primary/5 hover:bg-primary/10',
              triggerProps.className
            )}
          >
            <ChefHat className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span className="hidden min-[380px]:inline">{t('productionSummary')}</span>
            {totalUnits > 0 && (
              <span className="bg-primary text-primary-foreground text-[11px] rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center font-bold tabular-nums">
                {totalUnits}
              </span>
            )}
          </Button>
        )}
      />
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0 max-h-[min(22rem,50vh)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="font-semibold text-sm text-foreground">{t('productionSummary')}</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1"
            aria-label={t('closeSummary')}
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {summary.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">{t('productionSummaryEmpty')}</p>
        ) : (
          <ul className="divide-y divide-border overflow-y-auto">
            {summary.map((item) => (
              <li
                key={item.productNameTr}
                className="flex items-center justify-between px-4 py-2.5 gap-2"
              >
                <span className="text-sm font-medium text-foreground leading-snug">{item.productNameTr}</span>
                <span className="text-sm font-bold tabular-nums bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                  {item.totalQuantity}×
                </span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
