'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { NextIntlClientProvider } from 'next-intl'
import trMessages from '@/i18n/messages/tr.json'
import enMessages from '@/i18n/messages/en.json'

const STORAGE_KEY = 'bolena-qr-locale'

export type QrLocale = 'tr' | 'en'

type QrLocaleContextValue = {
  locale: QrLocale
  setLocale: (next: QrLocale) => void
}

const QrLocaleContext = createContext<QrLocaleContextValue | null>(null)

export function useQrLocale() {
  const ctx = useContext(QrLocaleContext)
  if (!ctx) {
    throw new Error('useQrLocale must be used within QrIntlProvider')
  }
  return ctx
}

function readStoredLocale(): QrLocale {
  if (typeof window === 'undefined') return 'tr'
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === 'en' || raw === 'tr' ? raw : 'tr'
}

export function QrIntlProvider({ children }: { children: ReactNode }) {
  // initializer fonksiyonu: ilk render'da doğru locale → çift render yok
  const [locale, setLocaleState] = useState<QrLocale>(readStoredLocale)

  const setLocale = useCallback((next: QrLocale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const messages = useMemo(() => (locale === 'en' ? enMessages : trMessages), [locale])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QrLocaleContext.Provider value={value}>{children}</QrLocaleContext.Provider>
    </NextIntlClientProvider>
  )
}
