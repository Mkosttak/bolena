'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { OrderItem, SelectedExtra } from '@/types'

interface QrOrderItemProps {
  item: OrderItem
}

export function QrOrderItem({ item }: QrOrderItemProps) {
  const t = useTranslations('qr')
  const locale = useLocale()

  if (item.quantity === 0) return null

  const displayName =
    locale === 'en' && item.product_name_en ? item.product_name_en : item.product_name_tr

  const extras: SelectedExtra[] = Array.isArray(item.selected_extras)
    ? (item.selected_extras as SelectedExtra[])
    : []
  const removed = Array.isArray(item.removed_ingredients) ? item.removed_ingredients : []

  const kdsReady = item.kds_status === 'ready'

  return (
    <div className="flex items-start gap-3 py-3">
      <span className="shrink-0 w-6 h-6 bg-[#1B3C2A]/10 text-[#1B3C2A] text-xs font-bold rounded-full flex items-center justify-center">
        {item.quantity}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[#1B3C2A] leading-tight">{displayName}</p>
          <span
            className={`shrink-0 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm border ${
              kdsReady 
                ? 'bg-emerald-500 text-white border-emerald-600' 
                : 'bg-amber-500 text-white border-amber-600 animate-pulse'
            }`}
          >
            {kdsReady ? t('kitchenReady') : t('kitchenPending')}
          </span>
        </div>
        {extras.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            +{' '}
            {extras
              .map((e) =>
                locale === 'en' && e.option_name_en ? e.option_name_en : e.option_name_tr
              )
              .join(', ')}
          </p>
        )}
        {removed.length > 0 && (
          <p className="text-xs text-red-400 mt-0.5">
            {t('removeLine')}:{' '}
            {(removed as { name_tr: string; name_en: string }[])
              .map((r) => (locale === 'en' && r.name_en ? r.name_en : r.name_tr))
              .join(', ')}
          </p>
        )}
        {item.notes && (
          <p className="text-xs text-gray-400 mt-0.5 italic">{item.notes}</p>
        )}
      </div>
      <span className="shrink-0 text-sm font-bold text-[#1B3C2A] tabular-nums">
        ₺{item.total_price.toFixed(2)}
      </span>
    </div>
  )
}
