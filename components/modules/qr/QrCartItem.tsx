'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useQrSessionStore } from '@/lib/stores/qr-session.store'
import type { QrCartItem } from '@/types'

interface QrCartItemProps {
  item: QrCartItem
}

export function QrCartItemRow({ item }: QrCartItemProps) {
  const t = useTranslations('qr')
  const locale = useLocale()
  const updateQuantity = useQrSessionStore((s) => s.updateQuantity)

  const extrasTotal = item.selected_extras.reduce((s, e) => s + e.price, 0)
  const unitPrice = item.product.price + extrasTotal
  const lineTotal = unitPrice * item.quantity

  const displayName =
    locale === 'en' && item.product.name_en ? item.product.name_en : item.product.name_tr

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 flex gap-3 border border-amber-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/80 rounded-l-2xl" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#1B3C2A] text-sm leading-tight">{displayName}</p>

        {item.removed_ingredients.length > 0 && (
          <p className="text-xs text-red-500 mt-0.5">
            {t('removeLine')}:{' '}
            {item.removed_ingredients
              .map((r) => (locale === 'en' && r.name_en ? r.name_en : r.name_tr))
              .join(', ')}
          </p>
        )}
        {item.selected_extras.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            +{' '}
            {item.selected_extras
              .map((e) =>
                locale === 'en' && e.option_name_en ? e.option_name_en : e.option_name_tr
              )
              .join(', ')}
          </p>
        )}
        {item.notes && (
          <p className="text-xs text-gray-400 mt-0.5 italic">{item.notes}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
            <button
              type="button"
              onClick={() => updateQuantity(item.localId, item.quantity - 1)}
              className="w-5 h-5 flex items-center justify-center text-[#1B3C2A]"
              aria-label={t('decreaseQty')}
            >
              {item.quantity === 1 ? (
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
            </button>
            <span className="text-sm font-bold text-[#1B3C2A] w-4 text-center">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.localId, item.quantity + 1)}
              className="w-5 h-5 flex items-center justify-center text-[#1B3C2A]"
              aria-label={t('increaseQty')}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-sm font-bold text-[#1B3C2A] tabular-nums">
            ₺{lineTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
