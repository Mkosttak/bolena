'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import type { Route } from 'next'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: string) {
    // pathname starts with /tr/... or /en/..., replace the locale segment
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/') as Route)
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={locale === 'tr' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => switchLocale('tr')}
      >
        TR
      </Button>
      <Button
        variant={locale === 'en' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => switchLocale('en')}
      >
        EN
      </Button>
    </div>
  )
}
