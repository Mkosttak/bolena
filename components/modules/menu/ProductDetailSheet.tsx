'use client'

import { useEffect, useState } from 'react'
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
import { X } from 'lucide-react'
import { SITE_LOGO_SRC } from '@/lib/site-brand'
import { calculateFinalPrice } from '@/lib/utils/order.utils'
import type { MenuCampaign, Product } from '@/types'

interface ProductDetailSheetProps {
  product: Product | null
  open: boolean
  onClose: () => void
  locale: string
  campaigns?: MenuCampaign[]
  translations: {
    outOfStock: string
    allergens: string
    featured: string
    campaignBadge: string
    productDetailIngredients: string
    productDetailAllergens: string
    productDetailClose: string
  }
}

const DRAG_THRESHOLD = 120

export function ProductDetailSheet({
  product,
  open,
  onClose,
  locale,
  campaigns = [],
  translations,
}: ProductDetailSheetProps) {
  const isEn = locale === 'en'
  const [isMobile, setIsMobile] = useState(false)

  const dragControls = useDragControls()
  const dragY = useMotionValue(0)
  const sheetOpacity = useTransform(dragY, (y) => {
    if (typeof y !== 'number') return 1
    const clamped = Math.max(0, Math.min(y, DRAG_THRESHOLD * 1.5))
    return 1 - (clamped / (DRAG_THRESHOLD * 1.5)) * 0.6
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

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

  const name = isEn ? product.name_en : product.name_tr
  const desc = isEn ? product.description_en : product.description_tr
  const allergens = isEn ? product.allergens_en : product.allergens_tr
  const finalPrice = calculateFinalPrice(product, campaigns)
  const hasDiscount = finalPrice < product.price
  const discountPct = hasDiscount ? Math.round(((product.price - finalPrice) / product.price) * 100) : 0

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
            key="pds-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          <div
            className={`fixed inset-0 z-[1001] pointer-events-none ${
              isMobile ? 'flex flex-col justify-end' : 'flex items-center justify-center p-4'
            }`}
          >
            <motion.div
              key="pds-panel"
              role="dialog"
              aria-modal="true"
              aria-label={name}
              initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 16 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              style={
                isMobile
                  ? { y: dragY, opacity: sheetOpacity, maxHeight: '92dvh' }
                  : { maxHeight: '88dvh', width: '92vw', maxWidth: 560 }
              }
              drag={isMobile ? 'y' : false}
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={handleDragEnd}
              className={`pointer-events-auto bg-[#FAF8F2] overflow-hidden flex flex-col ${
                isMobile
                  ? 'w-full rounded-t-3xl border-t border-gray-200/50'
                  : 'rounded-[24px] shadow-2xl border border-gray-200/50'
              }`}
            >
              {/* Mobile Grabber */}
              {isMobile && (
                <div
                  className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0 touch-none absolute top-0 inset-x-0 z-20"
                  aria-hidden="true"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="w-10 h-1 bg-white/50 backdrop-blur-md rounded-full shadow-sm" />
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className={`absolute z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-white/40 shadow-sm active:scale-90 transition-transform ${
                  isMobile ? 'top-3 right-4' : 'top-4 right-4'
                }`}
                aria-label={translations.productDetailClose}
              >
                <X className="w-4 h-4 text-[#1B3C2A]" />
              </button>

              <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 qr-scrollbar">
                {/* Image Section */}
                <div className="relative aspect-[16/9] w-full bg-[#EDE9DE] shrink-0">
                  <Image
                    src={product.image_url || SITE_LOGO_SRC}
                    alt={name}
                    fill
                    className={
                      product.image_url
                        ? 'object-cover'
                        : 'object-contain p-[14%] bg-gradient-to-br from-[#1B3C2A]/10 to-[#C4841A]/10'
                    }
                    sizes={isMobile ? '100vw' : '560px'}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  
                  {/* Price Tag (Overlay on Image) */}
                  <div className="absolute bottom-3 right-4 rounded-[22px] bg-[#1B3C2A]/90 px-4 py-2.5 text-white shadow-lg backdrop-blur border border-white/10">
                    {hasDiscount ? (
                      <div className="space-y-1 text-right">
                        <p className="text-xs text-white/60 line-through">
                          ₺{product.price.toFixed(2)}
                        </p>
                        <p className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          ₺{finalPrice.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        ₺{finalPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                  
                  {/* Badges Overlay */}
                  <div className="absolute bottom-3 left-4 flex flex-col gap-2 items-start">
                    {!product.is_available && (
                      <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                        {translations.outOfStock}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="bg-[#1B3C2A]/80 backdrop-blur-sm text-[#FAF8F2] text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10">
                        –{discountPct}% {isEn ? 'off' : 'indirim'}
                      </span>
                    )}
                    {product.is_featured && (
                      <span className="bg-[#C4841A]/90 backdrop-blur-sm text-[#FAF8F2] text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10">
                        ⭐ {translations.featured}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="px-5 pt-5 pb-8 space-y-6">
                  <div>
                    <h2 
                      className="text-[1.65rem] font-extrabold text-[#1A1A14] leading-tight"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em' }}
                    >
                      {name}
                    </h2>
                    {desc && (
                      <p 
                        className="text-[15px] text-[#1B3C2A]/60 mt-2.5 leading-relaxed"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {desc}
                      </p>
                    )}
                  </div>

                  {/* Ingredients */}
                  {product.product_ingredients && product.product_ingredients.length > 0 && (
                    <div className="pt-5 border-t border-[#1B3C2A]/10">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C4841A] mb-3">
                        {translations.productDetailIngredients}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.product_ingredients.map((ing) => (
                          <span
                            key={ing.id}
                            className="px-3 py-1.5 rounded-full text-[13px] bg-white border border-[#1B3C2A]/10 text-[#1B3C2A]/70 font-medium"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {isEn ? ing.name_en : ing.name_tr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extras */}
                  {product.extra_groups && product.extra_groups.length > 0 && (
                    <div className="pt-5 border-t border-[#1B3C2A]/10 space-y-5">
                      {product.extra_groups.map((group) => (
                        <div key={group.id}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C4841A]">
                              {isEn ? group.name_en : group.name_tr}
                            </span>
                            {group.is_required && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-[#1B3C2A] px-2 py-0.5 rounded-full">
                                {isEn ? 'required' : 'zorunlu'}
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            {group.extra_options?.map((opt) => (
                              <div
                                key={opt.id}
                                className="flex justify-between items-center px-4 py-3 bg-[#1B3C2A]/[0.03] border border-[#1B3C2A]/5 rounded-xl"
                              >
                                <span className="text-[14px] text-[#1B3C2A]/80 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                  {isEn ? opt.name_en : opt.name_tr}
                                </span>
                                <span className="text-[13px] font-bold text-[#1B3C2A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                  {opt.price > 0 ? `+₺${opt.price.toFixed(2)}` : isEn ? 'free' : 'ücretsiz'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Allergens */}
                  {allergens && (
                    <div className="flex items-start gap-3 p-4 bg-[#C4841A]/[0.06] border border-[#C4841A]/20 rounded-xl">
                      <svg
                        className="w-4 h-4 text-[#C4841A] shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#C4841A] mb-1">
                          {translations.productDetailAllergens}
                        </span>
                        <p className="text-[13px] font-medium text-[#C4841A]/80 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {allergens}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(sheet, document.body)
}
