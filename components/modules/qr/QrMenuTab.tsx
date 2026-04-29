'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { Category, MenuCampaign, Product } from '@/types'
import { QrCategoryPills } from './QrCategoryPills'
import { QrProductCard } from './QrProductCard'
import { QrProductSheet } from './QrProductSheet'
import { QrLocaleToggle } from './QrLocaleToggle'

interface QrMenuTabProps {
  categories: Category[]
  products: Product[]
  campaigns: MenuCampaign[]
  tableName: string
  qrEnabled: boolean
  token: string
  sessionToken: string
  orderId: string
  onDirectOrderSuccess?: () => void
}

export function QrMenuTab({
  categories,
  products,
  campaigns,
  tableName,
  qrEnabled,
  token,
  sessionToken,
  orderId,
  onDirectOrderSuccess,
}: QrMenuTabProps) {
  const t = useTranslations('qr')
  const locale = useLocale()
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const rafIdRef = useRef(0)
  const activeCategoryRef = useRef<string | null>(null)
  const [sheetInstanceKey, setSheetInstanceKey] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const labelCategory = useCallback(
    (category: Pick<Category, 'name_tr' | 'name_en'>) =>
      locale === 'en' && category.name_en ? category.name_en : category.name_tr,
    [locale]
  )

  const groupedProducts = useMemo(
    () =>
      categories
      .map((category) => ({
        id: category.id,
        label: labelCategory(category),
        products: products.filter((product) => product.category_id === category.id),
      }))
      .filter((group) => group.products.length > 0),
    [categories, labelCategory, products]
  )

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    groupedProducts[0]?.id ?? null
  )
  const resolvedActiveCategoryId =
    activeCategoryId && groupedProducts.some((group) => group.id === activeCategoryId)
      ? activeCategoryId
      : groupedProducts[0]?.id ?? null

  // Ref her render'dan sonra güncellenir; handleScroll closure'ının dep listesine girmez
  useEffect(() => {
    activeCategoryRef.current = resolvedActiveCategoryId
  })

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(() => {
      const container = scrollRef.current
      if (!container) return

      setIsScrolled(container.scrollTop > 12)

      const currentScrollTop = container.scrollTop
      let currentCategoryId = groupedProducts[0]?.id ?? null

      for (const group of groupedProducts) {
        const section = sectionRefs.current[group.id]
        if (!section) continue

        const sectionTop = section.offsetTop - 130
        if (currentScrollTop >= sectionTop) {
          currentCategoryId = group.id
        } else {
          break
        }
      }

      if (currentCategoryId && currentCategoryId !== activeCategoryRef.current) {
        setActiveCategoryId(currentCategoryId)
      }
    })
  }, [groupedProducts])

  useEffect(() => () => cancelAnimationFrame(rafIdRef.current), [])

  const handleCategorySelect = useCallback((categoryId: string) => {
    const container = scrollRef.current
    const section = sectionRefs.current[categoryId]
    if (!container || !section) return

    container.scrollTo({
      top: Math.max(0, section.offsetTop - 110),
      behavior: 'smooth',
    })
    setActiveCategoryId(categoryId)
  }, [])

  const filteredCategoriesForPills = useMemo(
    () => categories.filter((c) => groupedProducts.some((g) => g.id === c.id)),
    [categories, groupedProducts]
  )

  const handleProductOpen = useCallback((product: Product) => {
    setSheetInstanceKey((value) => value + 1)
    setSelectedProduct(product)
    setSheetOpen(true)
  }, [])

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-30 shrink-0 px-1.5 pb-1.5 pt-1.5 transition-all duration-300">
        <div
          className={`transition-all duration-300 ${
            isScrolled
              ? 'rounded-[24px] border border-white/60 bg-[rgba(255,255,255,0.88)] px-3 py-2 shadow-[0_20px_55px_-28px_rgba(27,60,42,0.45)] backdrop-blur-xl'
              : 'rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,248,235,0.82))] px-3.5 py-3 shadow-[0_28px_70px_-38px_rgba(27,60,42,0.55)]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center rounded-[22px] border border-[#1B3C2A]/10 bg-[#1B3C2A]/5 transition-all duration-300 ${
                  isScrolled ? 'h-10 w-10' : 'h-12 w-12'
                }`}
              >
                <Image
                  src="/images/bolena_logo.png"
                  alt={t('brand')}
                  width={42}
                  height={42}
                  className="object-contain"
                  priority
                />
              </div>

              <div className="min-w-0">
                <p className="font-heading text-[1.35rem] leading-none text-[#173322]">
                  {t('brand')}
                </p>
                <p className="mt-0.5 truncate text-[13px] font-medium text-[#1B3C2A]/65">{tableName}</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <QrLocaleToggle />
              {!qrEnabled && (
                <span className="rounded-full border border-amber-300/70 bg-amber-100/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-amber-900 shadow-sm">
                  {t('orderClosed')}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2.5">
            <QrCategoryPills
              categories={filteredCategoriesForPills}
              activeId={resolvedActiveCategoryId}
              onSelect={handleCategorySelect}
            />
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="qr-scrollbar flex-1 overflow-y-auto overscroll-contain px-1.5 pb-6 pt-2 touch-pan-y sm:px-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <section className="space-y-3.5">
          {groupedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[30px] border border-dashed border-[#1B3C2A]/15 bg-white/55 px-6 py-20 text-center shadow-[0_25px_55px_-42px_rgba(27,60,42,0.55)]">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1B3C2A]/6 text-[#1B3C2A]/60">
                <Search className="h-6 w-6" />
              </div>
              <p className="font-heading text-2xl text-[#173322]">{t('emptyCategory')}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedProducts.map((group) => (
                <section
                  key={group.id}
                  ref={(element) => {
                    sectionRefs.current[group.id] = element
                  }}
                  className="space-y-3"
                >
                  <div className="px-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1B3C2A]/42">
                      {group.label}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.products.map((product, idx) => (
                      <QrProductCard
                        key={product.id}
                        product={product}
                        campaigns={campaigns}
                        qrEnabled={qrEnabled}
                        priority={idx < 2}
                        onOpen={handleProductOpen}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>

      <QrProductSheet
        key={sheetInstanceKey}
        product={selectedProduct}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        campaigns={campaigns}
        qrEnabled={qrEnabled}
        token={token}
        sessionToken={sessionToken}
        orderId={orderId}
        onDirectOrderSuccess={onDirectOrderSuccess}
      />
    </div>
  )
}
