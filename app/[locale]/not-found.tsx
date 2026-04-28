'use client'

import { useLocale } from 'next-intl'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import enMessages from '@/i18n/messages/en.json'
import trMessages from '@/i18n/messages/tr.json'

export default function LocaleNotFound() {
  const activeLocale = useLocale() === 'en' ? 'en' : 'tr'
  const copy = activeLocale === 'en' ? enMessages.notFound : trMessages.notFound

  return (
    <NotFoundPage
      copy={copy}
      homeHref={`/${activeLocale}`}
      menuHref={`/${activeLocale}/menu`}
    />
  )
}
