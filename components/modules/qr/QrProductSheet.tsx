'use client'

import { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  useDragControls,
} from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Minus, Plus, X, ShoppingBagIcon, Send, AlertCircle, Loader2 } from 'lucide-react'
import { SITE_LOGO_SRC } from '@/lib/site-brand'
import { calculateFinalPrice, applyRadioOptionSelection } from '@/lib/utils/order.utils'
import { useQrSessionStore } from '@/lib/stores/qr-session.store'
import { submitQrOrder } from '@/app/qr/[token]/[session]/actions'
import { qrKeys } from '@/lib/queries/qr.queries'
import type { MenuCampaign, Product, RemovedIngredient, SelectedExtra, QrCartItem } from '@/types'

interface QrProductSheetProps {
  product: Product | null
  open: boolean
  onClose: () => void
  campaigns: MenuCampaign[]
  qrEnabled: boolean
  token: string
  sessionToken: string
  orderId: string
  onDirectOrderSuccess?: () => void
}

const DRAG_THRESHOLD = 120

function randomLocalId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function QrProductSheet({
  product,
  open,
  onClose,
  campaigns,
  qrEnabled,
  token,
  sessionToken,
  orderId,
  onDirectOrderSuccess,
}: QrProductSheetProps) {
  const t = useTranslations('qr')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const addItem = useQrSessionStore((s) => s.addItem)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [removedIngredients, setRemovedIngredients] = useState<Set<string>>(new Set())
  const [optionQty, setOptionQty] = useState<Record<string, number>>({})
  const [requiredError, setRequiredError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const dragControls = useDragControls()
  const dragY = useMotionValue(0)
  const sheetOpacity = useTransform(dragY, (y) => {
    if (typeof y !== 'number') return 1
    const clamped = Math.max(0, Math.min(y, DRAG_THRESHOLD * 1.5))
    return 1 - (clamped / (DRAG_THRESHOLD * 1.5)) * 0.6
  })

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!product) return null

  const displayName =
    locale === 'en' && product.name_en ? product.name_en : product.name_tr
  const displayDescription =
    locale === 'en' && product.description_en ? product.description_en : product.description_tr
  const displayAllergens =
    locale === 'en' && product.allergens_en ? product.allergens_en : product.allergens_tr

  const finalPrice = calculateFinalPrice(product, campaigns)
  const hasDiscount = finalPrice < product.price

  const selectedExtras: SelectedExtra[] = []
  if (product.extra_groups) {
    for (const group of product.extra_groups) {
      for (const opt of group.extra_options ?? []) {
        if ((optionQty[opt.id] ?? 0) > 0) {
          selectedExtras.push({
            group_id: group.id,
            group_name_tr: group.name_tr,
            option_id: opt.id,
            option_name_tr: opt.name_tr,
            option_name_en: opt.name_en,
            price: opt.price,
          })
        }
      }
    }
  }

  const handleToggleIngredient = (id: string) => {
    setRemovedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleOptionToggle = (
    group: Product['extra_groups'] extends (infer G)[] | undefined ? NonNullable<G> : never,
    optionId: string
  ) => {
    if (group.is_required || group.max_bir_secim) {
      const optionIds = (group.extra_options ?? []).map((o) => o.id)
      setOptionQty((prev) => applyRadioOptionSelection(optionIds, optionId, prev))
    } else {
      setOptionQty((prev) => ({
        ...prev,
        [optionId]: (prev[optionId] ?? 0) > 0 ? 0 : 1,
      }))
    }
    setRequiredError(null)
  }

  const validateAndBuildLine = (): Omit<QrCartItem, 'localId'> | null => {
    if (product.extra_groups) {
      for (const group of product.extra_groups) {
        if (group.is_required) {
          const hasSelection = (group.extra_options ?? []).some(
            (opt) => (optionQty[opt.id] ?? 0) > 0
          )
          if (!hasSelection) {
            const gName =
              locale === 'en' && group.name_en ? group.name_en : group.name_tr
            setRequiredError(t('requiredGroup', { name: gName }))
            return null
          }
        }
      }
    }
    setRequiredError(null)

    const removed: RemovedIngredient[] = (product.product_ingredients ?? [])
      .filter((ing) => removedIngredients.has(ing.id))
      .map((ing) => ({ id: ing.id, name_tr: ing.name_tr, name_en: ing.name_en }))

    return {
      product,
      quantity,
      notes,
      removed_ingredients: removed,
      selected_extras: selectedExtras,
    }
  }

  const buildQrCartItem = (line: Omit<QrCartItem, 'localId'>): QrCartItem => ({
    ...line,
    localId: randomLocalId(),
  })

  const handleAddToCart = () => {
    if (!qrEnabled || !product.is_available) return
    const line = validateAndBuildLine()
    if (!line) return

    addItem(line)
    toast(t('toastCartPendingTitle'), {
      description: t('toastCartPendingDesc'),
      duration: 3500,
      position: 'top-center',
      icon: <ShoppingBagIcon className="w-4 h-4 text-emerald-400" />,
      className: 'bg-black/90 text-white border-0 backdrop-blur-xl shadow-2xl rounded-2xl mx-auto top-4 flex p-4',
      descriptionClassName: 'text-gray-300',
      action: {
        label: t('navCart'),
        onClick: () => document.getElementById('cart-tab-btn')?.click()
      }
    })
    onClose()
  }

  const handleDirectOrder = () => {
    if (!qrEnabled || !product.is_available) return
    const line = validateAndBuildLine()
    if (!line) return

    const payload: QrCartItem = buildQrCartItem(line)
    startTransition(async () => {
      const result = await submitQrOrder(token, sessionToken, orderId, [payload])
      if (result.success) {
        onDirectOrderSuccess?.()
        await queryClient.invalidateQueries({ queryKey: qrKeys.order(sessionToken) })
        toast(t('toastDirectSentTitle'), {
          description: t('toastDirectSentDesc'),
          duration: 4000,
          position: 'top-center',
          className: 'bg-black/90 text-white border-0 backdrop-blur-xl shadow-2xl rounded-2xl flex p-4',
          descriptionClassName: 'text-gray-300',
          icon: <Send className="w-4 h-4 text-emerald-400" />,
        })
        onClose()
      } else {
        toast(t('orderFailedTitle'), {
          description: result.error ?? t('orderFailedDesc'),
          duration: 5000,
          position: 'top-center',
          className: 'bg-red-950/90 text-white border border-red-900/50 backdrop-blur-xl shadow-2xl rounded-2xl flex p-4',
          descriptionClassName: 'text-red-200',
          icon: <AlertCircle className="w-4 h-4 text-red-400" />,
        })
      }
    })
  }

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    const shouldClose = info.offset.y > DRAG_THRESHOLD || info.velocity.y > 500
    if (shouldClose) {
      onClose()
    } else {
      animate(dragY, 0, { type: 'spring', damping: 28, stiffness: 300 })
    }
  }

  const sheet = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="qr-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, pointerEvents: 'auto' }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            key="qr-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={displayName}
            initial={{ y: '100%' }}
            animate={{ y: 0, pointerEvents: 'auto' }}
            exit={{ y: '100%', pointerEvents: 'none' }}
            style={{ y: dragY, opacity: sheetOpacity, maxHeight: '92dvh' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 inset-x-0 z-[61] bg-[#FAF8F2] rounded-t-3xl overflow-hidden flex flex-col"
          >
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0 touch-none"
              aria-hidden="true"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm active:scale-90 transition-transform"
              aria-label={t('close')}
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <div 
              className="overflow-y-auto overscroll-contain flex-1 min-h-0 pb-28 qr-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="relative aspect-[16/9] w-full bg-gray-100">
                <Image
                  src={product.image_url || SITE_LOGO_SRC}
                  alt={displayName}
                  fill
                  className={
                    product.image_url
                      ? 'object-cover'
                      : 'object-contain p-[14%] bg-gradient-to-br from-[#1B3C2A]/10 to-[#C4841A]/10'
                  }
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-3 right-4 rounded-[22px] bg-[#1B3C2A]/88 px-4 py-2.5 text-white shadow-lg backdrop-blur">
                  {hasDiscount ? (
                    <div className="space-y-1 text-right">
                      <p className="text-xs text-white/55 line-through">
                        ₺{product.price.toFixed(2)}
                      </p>
                      <p className="text-lg font-extrabold tracking-tight">
                        ₺{finalPrice.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-extrabold tracking-tight">
                      ₺{finalPrice.toFixed(2)}
                    </p>
                  )}
                </div>
                {!product.is_available && (
                  <div className="absolute bottom-3 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {t('outOfStock')}
                  </div>
                )}
              </div>

              <div className="px-5 pt-4 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#1B3C2A] leading-tight">{displayName}</h2>
                  {displayDescription && (
                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{displayDescription}</p>
                  )}
                  {displayAllergens && (
                    <p className="mt-2 text-[11px] italic text-gray-400">
                      {t('allergensLabel')}: {displayAllergens}
                    </p>
                  )}
                </div>

                {product.product_ingredients && product.product_ingredients.some((i) => i.is_removable) && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#C4841A] mb-2.5">
                      {t('sheetRemoveIngredients')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.product_ingredients
                        .filter((i) => i.is_removable)
                        .map((ing) => {
                          const ingLabel =
                            locale === 'en' && ing.name_en ? ing.name_en : ing.name_tr
                          return (
                            <button
                              key={ing.id}
                              type="button"
                              onClick={() => handleToggleIngredient(ing.id)}
                              className={`px-3.5 py-1.5 rounded-full text-[13px] border transition-all ${
                                removedIngredients.has(ing.id)
                                  ? 'bg-red-50 border-red-200 text-red-500 line-through'
                                  : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              {ingLabel}
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}

                {product.extra_groups &&
                  product.extra_groups.map((group) => {
                    const gTitle = locale === 'en' && group.name_en ? group.name_en : group.name_tr
                    return (
                      <div key={group.id}>
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-[#C4841A]">
                            {gTitle}
                          </p>
                          {group.is_required && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#1B3C2A] px-2.5 py-0.5 rounded-full">
                              {t('sheetRequired')}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {group.extra_options?.map((opt) => {
                            const isSelected = (optionQty[opt.id] ?? 0) > 0
                            const optLabel = locale === 'en' && opt.name_en ? opt.name_en : opt.name_tr
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  handleOptionToggle(
                                    group as Parameters<typeof handleOptionToggle>[0],
                                    opt.id
                                  )
                                }
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-[13px] transition-all ${
                                  isSelected
                                    ? 'bg-[#1B3C2A]/6 border-[#1B3C2A]/25 text-[#1B3C2A]'
                                    : 'bg-white border-gray-200 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      isSelected ? 'border-[#1B3C2A] bg-[#1B3C2A]' : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <span className="font-medium">{optLabel}</span>
                                </div>
                                <span
                                  className={`font-semibold text-[12px] ${isSelected ? 'text-[#1B3C2A]' : 'text-gray-400'}`}
                                >
                                  {opt.price > 0 ? `+₺${opt.price.toFixed(2)}` : t('sheetFree')}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#C4841A] mb-2.5">
                    {t('sheetNotes')}
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('sheetNotesPlaceholder')}
                    rows={2}
                    maxLength={200}
                    className="w-full px-4 py-3 rounded-xl border border-[#1B3C2A]/15 text-[14px] font-medium bg-[#FAF8F2] text-[#173322] resize-none focus:outline-none focus:border-[#1B3C2A]/40 placeholder:text-gray-500 placeholder:font-normal shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-[#FAF8F2]/95 backdrop-blur-md border-t border-gray-200/80 px-5 py-4 safe-area-padding-bottom">
              {requiredError && (
                <div className="flex items-center gap-2 mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 max-w-[390px] mx-auto">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[12px] text-red-600 font-medium">{requiredError}</p>
                </div>
              )}
              <div className="flex items-center gap-3 max-w-[390px] mx-auto">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-6 h-6 flex items-center justify-center text-[#1B3C2A] active:scale-90 transition-transform"
                    aria-label={t('decreaseQty')}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-[#1B3C2A] w-5 text-center tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    className="w-6 h-6 flex items-center justify-center text-[#1B3C2A] active:scale-90 transition-transform"
                    aria-label={t('increaseQty')}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {qrEnabled && product.is_available ? (
                  <div className="flex-1 flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isPending}
                      className="w-[120px] bg-white border border-[#1B3C2A]/15 text-[#1B3C2A] py-3.5 rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_2px_10px_rgba(27,60,42,0.04)] disabled:opacity-70 hover:bg-[#FAF8F2]"
                    >
                      <ShoppingBagIcon className="w-4 h-4" />
                      {t('sheetAddToCart')}
                    </button>
                    <button
                      type="button"
                      onClick={handleDirectOrder}
                      disabled={isPending}
                      className="flex-1 bg-gradient-to-br from-[#25523A] to-[#142C1F] text-white py-3.5 rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_8px_20px_rgba(27,60,42,0.25)] ring-1 ring-white/10 disabled:opacity-70 overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin relative z-10" /> : <Send className="w-4 h-4 relative z-10" />}
                      <span className="relative z-10">{isPending ? t('sending') : t('sheetQuickOrder')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 bg-gray-200 text-gray-500 py-3 rounded-xl font-bold text-[13px] flex items-center justify-center px-4 cursor-not-allowed">
                    {!product.is_available ? t('outOfStock') : t('orderClosed')}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(sheet, document.body)
}
