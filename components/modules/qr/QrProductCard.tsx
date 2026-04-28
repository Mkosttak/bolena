'use client'

import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import type { MenuCampaign, Product } from '@/types'
import { SITE_LOGO_SRC } from '@/lib/site-brand'
import { calculateFinalPrice } from '@/lib/utils/order.utils'

interface QrProductCardProps {
  product: Product
  campaigns: MenuCampaign[]
  qrEnabled: boolean
  priority?: boolean
  onClick: () => void
}

export function QrProductCard({
  product,
  campaigns,
  qrEnabled,
  priority = false,
  onClick,
}: QrProductCardProps) {
  const t = useTranslations('qr')
  const locale = useLocale()
  const finalPrice = calculateFinalPrice(product, campaigns)
  const hasDiscount = finalPrice < product.price

  const displayName =
    locale === 'en' && product.name_en ? product.name_en : product.name_tr

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(251,247,239,0.94))] text-left shadow-[0_28px_60px_-42px_rgba(27,60,42,0.5)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_36px_90px_-46px_rgba(27,60,42,0.55)] active:scale-[0.99]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f3ede2]">
        <Image
          src={product.image_url || SITE_LOGO_SRC}
          alt={displayName}
          fill
          className={
            product.image_url
              ? 'object-cover transition duration-500 group-hover:scale-105'
              : 'object-contain p-[18%] bg-gradient-to-br from-[#1B3C2A]/8 via-[#FAF8F2] to-[#C4841A]/12'
          }
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />

        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-1 p-2.5">
          {!product.is_available && (
            <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {t('outOfStock')}
            </span>
          )}
          {hasDiscount && product.is_available && (
            <span className="rounded-full bg-[#C4841A] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              {t('discount')}
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-3 pt-10">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-bold leading-tight text-white sm:text-base">
                {displayName}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-white">
                  ₺{finalPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-[11px] text-white/60 line-through">
                    ₺{product.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {!qrEnabled && <div className="absolute inset-0 bg-[#f7f1e6]/20 backdrop-blur-[1px]" />}
      </div>
    </button>
  )
}
