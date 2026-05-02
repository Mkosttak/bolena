'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { SITE_LOGO_SRC } from '@/lib/site-brand'
import { calculateFinalPrice } from '@/lib/utils/order.utils'
import type { Category, MenuCampaign, Product, ProductIngredient } from '@/types'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ProductDetailSheet } from './ProductDetailSheet'

interface MenuDisplayProps {
  categories: Category[]
  products: Product[]
  locale: string
  uncategorizedLabel?: string
  campaigns?: MenuCampaign[]
  translations: {
    outOfStock: string
    allergens: string
    featured: string
    campaignBadge: string
    productDetailIngredients: string
    productDetailAllergens: string
    productDetailClose: string
    emptyState: string
  }
}

interface CategorizedSection {
  id: string
  label: string
  items: Product[]
}

export function MenuDisplay({
  categories,
  products,
  locale,
  uncategorizedLabel,
  campaigns = [],
  translations,
}: MenuDisplayProps) {
  const isEn = locale === 'en'
  const sections: CategorizedSection[] = categories
    .map((cat) => ({
      id: cat.id,
      label: isEn ? cat.name_en : cat.name_tr,
      items: products.filter((p) => p.category_id === cat.id),
    }))
    .filter((s) => s.items.length > 0)

  const uncategorized = products.filter((p) => !p.category_id)
  if (uncategorized.length > 0) {
    sections.push({
      id: 'uncategorized',
      label: uncategorizedLabel ?? (isEn ? 'Other' : 'Diğer'),
      items: uncategorized,
    })
  }

  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const observerRef = useRef<IntersectionObserver | null>(null)
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const navScrollRef = useRef<HTMLDivElement>(null)

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = 300
      navScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const topVisible = visible[0]
        if (topVisible) {
          const id = topVisible.target.id
          setActiveId(id)
          pillRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 }
    )
    sections.forEach((s) => {
      const el = sectionRefs.current[s.id]
      if (el) observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.map((s) => s.id).join(',')])

  const scrollTo = useCallback((id: string) => {
    const el = sectionRefs.current[id]
    if (!el) return
    setActiveId(id)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (sections.length === 0) {
    return (
      <div
        style={{
          background: '#FAF8F2',
          marginTop: '-2rem',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          boxShadow: '0 -8px 32px rgba(17,38,27,0.08)',
          padding: '5rem 1.5rem 6rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 4,
          color: 'rgba(27,60,42,0.6)',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: '1rem',
        }}
      >
        {translations.emptyState}
      </div>
    )
  }

  return (
    <>
      <style>{`
        .md-root {
          position: relative;
          background: #FAF8F2;
          color: #1A1A14;
          padding-bottom: 6rem;
          min-height: 60vh;
          margin-top: -2rem;
          z-index: 4;
          border-top-left-radius: 32px;
          border-top-right-radius: 32px;
          box-shadow: 0 -8px 32px rgba(17,38,27,0.08);
        }

        /* ─ Cat nav ─ */
        .md-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          padding: 0 clamp(1rem, 4vw, 2rem) 0.25rem;
          background: rgba(250,248,242,0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(27,60,42,0.08);
          margin-bottom: 0.75rem;
        }
        .md-nav-shell {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .md-nav-arrow {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 1px solid rgba(27,60,42,0.1);
          color: #1B3C2A;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(27,60,42,0.05);
          transition: all 0.2s;
        }
        .md-nav-arrow:hover {
          background: #1B3C2A;
          color: #FFFFFF;
          border-color: #1B3C2A;
        }
        @media (min-width: 768px) {
          .md-nav-arrow { display: flex; }
        }
        .md-nav-inner {
          flex: 1;
          display: flex;
          overflow-x: auto;
          gap: 0.75rem;
          padding: 0.75rem 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .md-nav-inner::-webkit-scrollbar { display: none; }

        .md-cat-btn {
          flex: 0 0 auto;
          min-width: 110px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 1.25rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: rgba(27,60,42,0.6);
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(27,60,42,0.1);
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(27,60,42,0.02);
        }
        .md-cat-btn:hover {
          color: #1B3C2A;
          background: rgba(255,255,255,1);
          border-color: rgba(27,60,42,0.2);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(27,60,42,0.06);
        }
        .md-cat-btn.active {
          color: #FAF8F2;
          font-weight: 700;
          background: linear-gradient(135deg, #214732 0%, #11261B 100%);
          border-color: transparent;
          box-shadow: 0 8px 16px rgba(27,60,42,0.2);
          transform: translateY(-2px);
        }

        @media (max-width: 740px) {
          .md-root {
            margin-top: -1.25rem;
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
          }
          .md-nav {
            top: 0;
            padding: 0 1rem 0;
            margin-bottom: 0.5rem;
          }
          .md-cat-btn {
            flex: 0 0 120px;
            height: 44px;
            font-size: 12px;
          }
        }

        /* ─ Section ─ */
        .md-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
          scroll-margin-top: 80px;
        }
        .md-section-head {
          display: grid;
          gap: 0;
          padding: 1.25rem 0 0.75rem;
          margin-bottom: 0.75rem;
          text-align: center;
        }
        .md-section-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.2rem, 4vw, 1.8rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #1A1A14;
          line-height: 1.05;
        }

        /* ─ Product grid ─ */
        .md-product-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        @media (min-width: 600px) { .md-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 900px) { .md-product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (min-width: 1200px) { .md-product-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        /* ─ Product card ─ */
        .md-card {
          position: relative;
          background: #FFFFFF;
          border: 1px solid rgba(27,60,42,0.06);
          border-radius: 24px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          text-align: left;
          padding: 0;
          overflow: hidden;
          width: 100%;
          height: 100%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .md-card:hover {
          border-color: rgba(27,60,42,0.15);
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(27,60,42,0.08);
        }
        .md-card:active { transform: translateY(-1px); }

        .md-card-img {
          position: relative;
          aspect-ratio: 4/3;
          overflow: hidden;
          background: #F4EFE4;
          flex-shrink: 0;
        }
        .md-card-img img { transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
        .md-card:hover .md-card-img img { transform: scale(1.05); }

        .md-card-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          background: linear-gradient(180deg, #FFFFFF 0%, #FAFCFB 100%);
        }

        .md-badge {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .md-badge-disc { background: rgba(220,38,38,0.9); color: #FFFFFF; box-shadow: 0 4px 12px rgba(220,38,38,0.3); }
        .md-badge-oos { background: rgba(27,60,42,0.7); color: #FFFFFF; }

        .md-card-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.1rem, 4vw, 1.25rem);
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.25;
          color: #11261B;
        }

        .md-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(27,60,42,0.06);
        }
        .md-card-price-wrap {
          display: flex;
          flex-direction: column;
        }
        .md-card-price {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: 1.2rem;
          color: #11261B;
          letter-spacing: -0.02em;
        }
        .md-card-price-old {
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(220,38,38,0.8);
          text-decoration: line-through;
        }
        .md-card-add-btn {
          height: 36px;
          width: 36px;
          border-radius: 12px;
          background: rgba(27,60,42,0.05);
          color: #1B3C2A;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .md-card:hover .md-card-add-btn {
          background: #1B3C2A;
          color: #FFFFFF;
          transform: scale(1.05);
        }
      `}</style>

      <div className="md-root">
        {/* Category Nav */}
        {sections.length > 1 && (
          <nav className="md-nav" aria-label={isEn ? 'Category navigation' : 'Kategori navigasyonu'}>
            <div className="md-nav-shell">
              <button className="md-nav-arrow" onClick={() => scrollNav('left')} aria-label="Scroll left">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="md-nav-inner" ref={navScrollRef}>
                {sections.map((s) => (
                  <button
                    key={s.id}
                    ref={(el) => { pillRefs.current[s.id] = el }}
                    className={cn('md-cat-btn', activeId === s.id && 'active')}
                    onClick={() => scrollTo(s.id)}
                    aria-current={activeId === s.id ? 'true' : undefined}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button className="md-nav-arrow" onClick={() => scrollNav('right')} aria-label="Scroll right">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </nav>
        )}

        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            ref={(el) => { sectionRefs.current[section.id] = el }}
            className="md-section"
          >
            <div className="md-section-head">
              <h2 className="md-section-name">{section.label}</h2>
            </div>
            <div className="md-product-grid">
              {section.items.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '60px' }}
                  transition={{ duration: 0.75, delay: (idx % 4) * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: '100%' }}
                >
                  <ProductCard product={product} isEn={isEn} campaigns={campaigns} translations={translations} onClick={() => setSelectedProduct(product)} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ProductDetailSheet
        open={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        locale={locale}
        campaigns={campaigns}
        translations={translations}
      />
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PRODUCT CARD
══════════════════════════════════════════════════════════════════ */
interface ProductCardProps {
  product: Product
  isEn: boolean
  campaigns: MenuCampaign[]
  translations: MenuDisplayProps['translations']
  onClick: () => void
}

function ingredientDisplayName(ing: ProductIngredient, isEn: boolean) {
  if (isEn && ing.name_en?.trim()) return ing.name_en
  return ing.name_tr
}

function ProductCard({ product, isEn, campaigns, translations, onClick }: ProductCardProps) {
  const name = isEn ? product.name_en : product.name_tr
  const desc = isEn ? product.description_en : product.description_tr
  const price = calculateFinalPrice(product, campaigns)
  const hasCampaign = price < product.price
  const discountPct = hasCampaign ? Math.round(((product.price - price) / product.price) * 100) : 0
  const unavailable = !product.is_available
  const ingredientsSorted = [...(product.product_ingredients ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const ingredientsLine = ingredientsSorted.map((ing) => ingredientDisplayName(ing, isEn)).join(', ')

  return (
    <button className="md-card" onClick={onClick} style={{ opacity: unavailable ? 0.6 : 1 }} aria-label={name}>
      <div className="md-card-img">
        <Image
          src={product.image_url || SITE_LOGO_SRC}
          alt={name}
          fill
          className={product.image_url ? 'object-cover' : 'object-contain p-[14%]'}
          sizes="(max-width: 500px) 100vw, (max-width: 900px) 50vw, 33vw"
        />
        {hasCampaign && (
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
            <span className="md-badge md-badge-disc">–{discountPct}%</span>
          </div>
        )}
        {unavailable && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,248,242,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="md-badge md-badge-oos">{translations.outOfStock}</span>
          </div>
        )}
      </div>
      <div className="md-card-body">
        <div className="md-card-name">{name}</div>
        <div className="md-card-footer">
          <div className="md-card-price-wrap">
            {hasCampaign && <span className="md-card-price-old">₺{product.price.toFixed(2)}</span>}
            <span className="md-card-price">₺{price.toFixed(2)}</span>
          </div>
          <div className="md-card-add-btn">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  )
}

