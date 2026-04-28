import { useLocale, useTranslations } from 'next-intl'
import { Plus, MinusCircle, StickyNote, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getElapsedMinutes, getUrgencyLevel } from '@/lib/utils/kds.utils'
import type { KdsOrderItem } from '@/lib/utils/kds.utils'

interface KdsItemRowProps {
  item: KdsOrderItem
  onMarkReady?: (itemIds: string[]) => void
}

export function KdsItemRow({ item, onMarkReady }: KdsItemRowProps) {
  const t = useTranslations('kds')
  const locale = useLocale()
  const isEn = locale.startsWith('en')
  const productLabel = isEn ? item.product_name_en : item.product_name_tr

  const isReservation = item.order_type === 'reservation' || item.order_type === 'takeaway'
  const [elapsedMinutes, setElapsedMinutes] = useState(() => getElapsedMinutes(item.created_at))

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMinutes(getElapsedMinutes(item.created_at))
    }, 30000)
    return () => clearInterval(interval)
  }, [item.created_at])

  const urgency = getUrgencyLevel(elapsedMinutes)
  const timerLabel = elapsedMinutes < 1 ? t('waitingTimeLessThan') : t('waitingTime', { minutes: elapsedMinutes })

  const urgencyBadge = {
    normal: 'bg-muted/50 text-muted-foreground border-transparent',
    warning: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
  }

  function extraLine(extra: (typeof item.selected_extras)[0]): string {
    const opt = isEn ? extra.option_name_en || extra.option_name_tr : extra.option_name_tr || extra.option_name_en
    return extra.group_name_tr ? `${extra.group_name_tr}: ${opt}` : opt
  }

  function ingredientLabel(ing: (typeof item.removed_ingredients)[0]): string {
    return isEn ? ing.name_en || ing.name_tr : ing.name_tr || ing.name_en
  }

  return (
    <div className="py-3 border-b border-border/40 last:border-0 group/row">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="inline-flex items-center justify-center min-w-[2.5rem] h-9 rounded-lg bg-primary/15 text-primary text-xl font-black tabular-nums border border-primary/25 shadow-sm shrink-0">
            {item.quantity}×
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-base font-bold text-foreground leading-tight tracking-tight uppercase">
                {productLabel}
              </span>
              {!isReservation && (
                <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border', urgencyBadge[urgency])}>
                  <Clock className="h-3 w-3" />
                  {timerLabel}
                </span>
              )}
              {item.is_complimentary && (
                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                  {t('complimentary') || 'İkram'}
                </span>
              )}
            </div>
          </div>
        </div>

        {onMarkReady && (
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0 rounded-xl border-border/60 hover:border-green-500/50 hover:bg-green-50 hover:text-green-700 transition-all duration-200 shadow-sm"
            onClick={(e) => {
              e.stopPropagation()
              onMarkReady([item.id])
            }}
            title={t('markReady')}
          >
            <Check className="h-5 w-5 stroke-[2.5]" />
          </Button>
        )}
      </div>

      {/* Eklenen seçenekler */}
      {item.selected_extras.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <Plus className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            {t('extras')}
          </p>
          <ul className="flex flex-col gap-1.5">
            {item.selected_extras.map((extra) => (
              <li
                key={extra.option_id}
                className="rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1.5 text-sm font-medium leading-snug text-emerald-950 shadow-sm"
              >
                {extraLine(extra)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Çıkarılan malzemeler */}
      {item.removed_ingredients.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <MinusCircle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
            {t('removedIngredients')}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {item.removed_ingredients.map((ing) => (
              <li
                key={ing.id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-sm font-medium text-destructive"
              >
                <MinusCircle className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                <span className="break-words">{ingredientLabel(ing)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ürün notu */}
      {item.notes && (
        <div className="mt-2 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-100/80 px-3 py-2.5 shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800">
              <StickyNote className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800/90">
                {t('itemNote')}
              </p>
              <p className="mt-1 break-words text-sm font-semibold leading-relaxed text-amber-950">
                {item.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
