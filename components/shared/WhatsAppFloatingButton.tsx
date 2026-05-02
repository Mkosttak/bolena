'use client'

import type { SVGProps } from 'react'
import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '@/lib/constants/social'

type WidgetPageKey = 'home' | 'menu' | 'contact' | 'blog'

const SCROLL_THRESHOLD = 380

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .16 5.33.16 11.9c0 2.1.55 4.15 1.59 5.97L0 24l6.3-1.65a11.86 11.86 0 0 0 5.77 1.47h.01c6.57 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.46-8.44Zm-8.45 18.33h-.01a9.9 9.9 0 0 1-5.04-1.37l-.36-.21-3.74.98 1-3.65-.23-.38a9.88 9.88 0 0 1-1.52-5.27c0-5.46 4.44-9.9 9.91-9.9 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 7 9.9 9.9 0 0 1-9.89 9.9Zm5.43-7.42c-.3-.15-1.77-.87-2.04-.98-.27-.1-.46-.15-.66.15s-.76.98-.93 1.18c-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.65-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.51.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.51-.08-.15-.67-1.62-.92-2.22-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.51.08-.78.37-.27.3-1.03 1-1.03 2.42 0 1.42 1.05 2.79 1.19 2.98.15.2 2.05 3.13 4.97 4.4.7.3 1.25.49 1.67.62.7.22 1.33.19 1.83.12.56-.08 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.2-.56-.34Z" />
    </svg>
  )
}

function getPageKey(pathname: string): WidgetPageKey {
  if (pathname.includes('/menu')) return 'menu'
  if (pathname.includes('/contact')) return 'contact'
  if (pathname.includes('/blog')) return 'blog'
  return 'home'
}

export function WhatsAppFloatingButton() {
  const pathname = usePathname()
  const t = useTranslations('whatsappWidget')
  const pageKey = getPageKey(pathname)
  const isHiddenRoute = pageKey === 'blog'

  const [showScrollTop, setShowScrollTop] = useState(false)

  const prefill = t(`${pageKey}.prefill`)
  const href = `${WHATSAPP_URL}?text=${encodeURIComponent(prefill)}`

  // Scroll listener — scroll-top butonun görünürlüğünü kontrol eder
  useEffect(() => {
    if (isHiddenRoute) return

    let rafId = 0
    const onScroll = () => {
      // requestAnimationFrame ile throttle
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        setShowScrollTop(window.scrollY > SCROLL_THRESHOLD)
        rafId = 0
      })
    }
    onScroll() // initial check
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isHiddenRoute])

  const scrollToTop = useCallback(() => {
    if (typeof window === 'undefined') return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [])

  if (isHiddenRoute) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* ── Scroll to Top — WhatsApp ikonun ÜSTÜNDE ─────────────── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            aria-label={t('scrollTopAriaLabel') ?? 'Sayfanın en üstüne çık'}
            initial={{ opacity: 0, scale: 0.5, y: 24, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 16, rotate: 90 }}
            transition={{
              type: 'spring',
              stiffness: 360,
              damping: 22,
              mass: 0.8,
            }}
            whileHover={{
              scale: 1.06,
              y: -2,
              transition: { type: 'spring', stiffness: 400, damping: 18 },
            }}
            whileTap={{ scale: 0.92 }}
            className={cn(
              'pointer-events-auto group relative inline-flex h-12 w-12 items-center justify-center rounded-full sm:h-13 sm:w-13',
              // Marka palette — krem arka plan + koyu yeşil ikon, altın aksent
              'bg-[#FAF8F2] text-[#1B3C2A]',
              'shadow-[0_8px_24px_-6px_rgba(27,60,42,0.28),0_2px_8px_-2px_rgba(27,60,42,0.18)]',
              'border border-[#1B3C2A]/10',
              'transition-shadow duration-300 hover:shadow-[0_14px_32px_-8px_rgba(27,60,42,0.4),0_4px_12px_-2px_rgba(27,60,42,0.22)]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4841A]',
            )}
            style={{ width: 48, height: 48 }}
          >
            {/* Subtle altın halka — hover'da görünür */}
            <span
              className="pointer-events-none absolute inset-[-3px] rounded-full border border-[#C4841A]/0 transition-all duration-300 group-hover:border-[#C4841A]/35 group-hover:inset-[-5px]"
              aria-hidden
            />
            {/* İç hover glow */}
            <span
              className="pointer-events-none absolute inset-0 rounded-full bg-[#C4841A]/0 transition-colors duration-300 group-hover:bg-[#C4841A]/[0.06]"
              aria-hidden
            />
            <ChevronUp
              className="relative h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5"
              strokeWidth={2.5}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── WhatsApp Floating Button ──────────────────────────── */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('ariaLabel')}
        className={cn(
          'pointer-events-auto group relative inline-flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16',
          'bg-[linear-gradient(135deg,#25d366_0%,#1ea952_100%)] text-white shadow-[0_15px_35px_-12px_rgba(37,211,102,0.6)]',
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-18px_rgba(37,211,102,0.8)]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25d366]',
        )}
      >
        <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute inset-[-6px] rounded-full border border-[#25d366]/20" />
        <WhatsAppIcon className="relative h-7 w-7 sm:h-8 sm:w-8" />
        <span className="sr-only">{WHATSAPP_NUMBER}</span>
      </a>
    </div>
  )
}
