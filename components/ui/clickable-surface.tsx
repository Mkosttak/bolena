'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Erişilebilir tıklanabilir yüzey.
 *
 * Kullanım amacı: <button> kullanmak istemediğin (cards, list items, modal toggles)
 * yerlerde, tüm a11y gereksinimlerini (role, tabIndex, keyboard handler) tek bir
 * sözleşme ile karşılar.
 *
 * Faz 6 refactor sırasında modal'lar bunu kullanmak için güncellenmeli.
 *
 * @example
 *   <ClickableSurface onClick={() => setActive(id)} aria-label="Ürün seç">
 *     <ProductCard ... />
 *   </ClickableSurface>
 */
interface ClickableSurfaceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role' | 'tabIndex'> {
  onClick: () => void
  ariaLabel?: string
  ariaPressed?: boolean
  disabled?: boolean
  children: React.ReactNode
}

export function ClickableSurface({
  onClick,
  ariaLabel,
  ariaPressed,
  disabled = false,
  className,
  children,
  ...rest
}: ClickableSurfaceProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      {...rest}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-primary',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {children}
    </div>
  )
}
