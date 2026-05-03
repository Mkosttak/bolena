'use client'

import { Menu, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MobileMenuToggleProps {
  open: boolean
  onClick: () => void
  /** Koyu hero arka plan üstü için açık ikon — true ise krem, false ise koyu yeşil */
  inverted?: boolean
  /** Erişilebilirlik etiketi (TR / EN locale-aware caller'da yapılır) */
  ariaLabel: string
  /** Sadece mobilde görünür (sm:hidden default) */
  className?: string
}

/**
 * Mobil menü hamburger / kapatma butonu.
 *
 * Tasarım kararları (modüler, telefon-uyumlu):
 * - Lucide SVG icon (CSS span çizgi yerine — tüm tarayıcılarda garanti render)
 * - 44x44px tap area (Apple HIG min önerisi — küçük telefonlarda da rahat)
 * - Animasyonlu Menu ↔ X geçişi (framer-motion rotate + fade)
 * - Tema-aware (light scrolled vs dark hero)
 * - Focus-visible altın outline
 * - aria-label + aria-expanded
 */
export function MobileMenuToggle({
  open,
  onClick,
  inverted = false,
  ariaLabel,
  className,
}: MobileMenuToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={open}
      className={cn(
        'sm:hidden inline-flex items-center justify-center h-11 w-11 rounded-full',
        'transition-colors duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4841A]',
        inverted
          ? 'text-[#FAF8F2] hover:bg-[#FAF8F2]/10 active:bg-[#FAF8F2]/15'
          : 'text-[#1B3C2A] hover:bg-[#1B3C2A]/8 active:bg-[#1B3C2A]/12',
        className,
      )}
    >
      <motion.span
        key={open ? 'x' : 'menu'}
        initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex"
      >
        {open ? (
          <X className="h-5 w-5" strokeWidth={2.25} />
        ) : (
          <Menu className="h-5 w-5" strokeWidth={2.25} />
        )}
      </motion.span>
    </button>
  )
}
