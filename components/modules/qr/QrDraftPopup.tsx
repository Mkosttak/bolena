'use client'

import { useTransition } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Send, Loader2, X, AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react'
import { useQrSessionStore } from '@/lib/stores/qr-session.store'
import { submitQrOrder } from '@/app/qr/[token]/[session]/actions'
import type { QrCartItem, SelectedExtra, RemovedIngredient } from '@/types'

interface QrDraftPopupProps {
  open: boolean
  token: string
  sessionToken: string
  orderId: string
  qrEnabled: boolean
  onSent: () => void
  onDismiss: () => void
}

function DraftRow({ item }: { item: QrCartItem }) {
  const locale = useLocale()
  const updateQuantity = useQrSessionStore((s) => s.updateQuantity)

  const extras = item.selected_extras as SelectedExtra[]
  const removed = item.removed_ingredients as RemovedIngredient[]
  const extrasTotal = extras.reduce((s, e) => s + e.price, 0)
  const unitPrice = item.product.price + extrasTotal
  const lineTotal = unitPrice * item.quantity
  const displayName =
    locale === 'en' && item.product.name_en ? item.product.name_en : item.product.name_tr

  return (
    <div className="flex gap-3 py-3 border-b border-black/5 last:border-0">
      {/* Adet stepper */}
      <div className="flex items-center gap-1.5 shrink-0 bg-gray-100 rounded-xl px-1.5 py-1">
        <button
          type="button"
          onClick={() => updateQuantity(item.localId, item.quantity - 1)}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-600 active:scale-90 transition-transform"
          aria-label="Azalt"
        >
          {item.quantity === 1 ? (
            <Trash2 className="w-3 h-3 text-red-400" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
        </button>
        <span className="text-sm font-bold text-gray-800 w-4 text-center tabular-nums">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => updateQuantity(item.localId, item.quantity + 1)}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-600 active:scale-90 transition-transform"
          aria-label="Artır"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Bilgi */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-snug">{displayName}</p>
        {extras.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">
            +{extras.map((e) => (locale === 'en' && e.option_name_en ? e.option_name_en : e.option_name_tr)).join(', ')}
          </p>
        )}
        {removed.length > 0 && (
          <p className="text-xs text-red-400 mt-0.5">
            ✕ {removed.map((r) => (locale === 'en' && r.name_en ? r.name_en : r.name_tr)).join(', ')}
          </p>
        )}
      </div>

      {/* Fiyat */}
      <div className="flex flex-col items-end justify-center shrink-0">
        <span className="text-sm font-bold text-gray-800 tabular-nums">₺{lineTotal.toFixed(2)}</span>
      </div>
    </div>
  )
}

export function QrDraftPopup({
  open,
  token,
  sessionToken,
  orderId,
  qrEnabled,
  onSent,
  onDismiss,
}: QrDraftPopupProps) {
  const t = useTranslations('qr')
  const items = useQrSessionStore((s) => s.items)
  const clearCart = useQrSessionStore((s) => s.clearCart)
  const [isPending, startTransition] = useTransition()

  const localTotal = items.reduce((sum, item) => {
    const extrasTotal = item.selected_extras.reduce((s, e) => s + e.price, 0)
    return sum + (item.product.price + extrasTotal) * item.quantity
  }, 0)

  const handleSend = () => {
    if (!qrEnabled) return
    startTransition(async () => {
      const result = await submitQrOrder(token, sessionToken, orderId, items)
      if (result.success) {
        clearCart()
        toast.success(t('orderSentTitle'), { description: t('orderSentDesc') })
        onSent()
      } else {
        toast.error(t('orderFailedTitle'), {
          description: result.error ?? t('orderFailedDesc'),
        })
      }
    })
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="draft-popup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onDismiss}
          />

          {/* Panel */}
          <motion.div
            key="draft-popup-panel"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 inset-x-0 z-[71] bg-white rounded-t-3xl overflow-hidden max-h-[85dvh] flex flex-col shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.25)]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Kapat butonu */}
            <button
              type="button"
              onClick={onDismiss}
              disabled={isPending}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:scale-90 transition-transform disabled:opacity-40"
              aria-label={t('close')}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Başlık */}
            <div className="px-5 pt-2 pb-4 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">
                    {t('draftPopupTitle')}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {t('draftPopupDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Ürün listesi */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 qr-scrollbar">
              {items.map((item) => (
                <DraftRow key={item.localId} item={item} />
              ))}
            </div>

            {/* Alt bar */}
            <div className="shrink-0 px-5 pt-3 pb-6 border-t border-gray-100 bg-white space-y-3 safe-area-padding-bottom">
              {/* Toplam */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">{t('cartTotalLabel')}</span>
                <span className="text-base font-extrabold text-gray-900 tabular-nums">
                  ₺{localTotal.toFixed(2)}
                </span>
              </div>

              {/* İlet butonu */}
              {qrEnabled && (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isPending || items.length === 0}
                  className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#25523A] to-[#142C1F] py-4 text-[14px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60 shadow-[0_12px_30px_-16px_rgba(27,60,42,0.7)]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('sending')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t('placeOrder')}
                    </>
                  )}
                </button>
              )}

              {/* İptal */}
              <button
                type="button"
                onClick={onDismiss}
                disabled={isPending}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-gray-500 bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-40"
              >
                {t('draftPopupCancel')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
