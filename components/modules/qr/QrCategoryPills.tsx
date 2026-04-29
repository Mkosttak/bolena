'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

interface QrCategoryPillsProps {
  categories: Category[]
  activeId: string | null
  onSelect: (id: string) => void
}

export function QrCategoryPills({ categories, activeId, onSelect }: QrCategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const locale = useLocale()

  const label = useCallback(
    (c: { name_tr: string; name_en: string }) =>
      locale === 'en' && c.name_en ? c.name_en : c.name_tr,
    [locale]
  )

  const allItems = useMemo(
    () => categories.map((c) => ({ id: c.id, label: label(c) })),
    [categories, label]
  )

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const activeElement = el.querySelector<HTMLElement>(`[data-category-id="${activeId ?? ''}"]`)
    if (!activeElement) return

    const elementLeft = activeElement.offsetLeft
    const elementWidth = activeElement.offsetWidth
    const containerWidth = el.clientWidth
    const targetLeft = Math.max(0, elementLeft - (containerWidth - elementWidth) / 2)

    el.scrollTo({
      left: targetLeft,
      behavior: 'smooth',
    })
  }, [activeId])

  return (
    <div
      ref={scrollRef}
      className="scrollbar-none flex max-w-full gap-1.5 overflow-x-auto pb-0.5 pt-0.5"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {allItems.map((cat) => {
        const isActive = activeId === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            data-category-id={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'relative shrink-0 overflow-hidden rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all',
              isActive
                ? 'border-[#1B3C2A]/10 text-[#faf7ef] shadow-[0_10px_20px_-16px_rgba(27,60,42,0.9)]'
                : 'border-[#1B3C2A]/8 bg-white/65 text-[#1B3C2A]/60 hover:border-[#1B3C2A]/16 hover:bg-white'
            )}
          >
            {isActive && (
              <motion.span
                layoutId="category-pill-bg"
                className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#204432,#173322)]"
                style={{ zIndex: -1 }}
                transition={{ type: 'spring', damping: 32, stiffness: 240 }}
              />
            )}
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
