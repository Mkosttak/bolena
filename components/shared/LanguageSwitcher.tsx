'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import type { Route } from 'next'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  /**
   * Tema arka planına göre kontrastı ayarlar.
   * - "auto" (default): Light arka plan için koyu pill renkleri.
   * - "inverted": Koyu/hero arka plan için açık pill renkleri.
   */
  inverted?: boolean
}

export function LanguageSwitcher({ inverted = false }: LanguageSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: string) {
    if (newLocale === locale) return
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/') as Route)
  }

  const locales: Array<'tr' | 'en'> = ['tr', 'en']

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border p-0.5 backdrop-blur-md',
        inverted
          ? 'border-white/25 bg-white/[0.08]'
          : 'border-[#1B3C2A]/15 bg-white/70',
      )}
      role="group"
      aria-label="Dil seçici"
    >
      {locales.map((l) => {
        const isActive = locale === l
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchLocale(l)}
            aria-pressed={isActive}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.12em] uppercase transition-all',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              isActive
                ? // Aktif state — her iki temada da koyu yeşil pill üstünde krem
                  'bg-[#1B3C2A] text-[#FAF8F2] shadow-[0_2px_8px_rgba(27,60,42,0.25)] focus-visible:outline-[#C4841A]'
                : inverted
                  ? // Pasif (dark): krem opacity, hover'da krem yoğun
                    'text-[#FAF8F2]/75 hover:text-[#FAF8F2] focus-visible:outline-[#FAF8F2]/60'
                  : // Pasif (light): koyu yeşil opacity, hover'da yoğun
                    'text-[#1B3C2A]/65 hover:text-[#1B3C2A] focus-visible:outline-[#1B3C2A]/40',
            )}
          >
            {l.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
