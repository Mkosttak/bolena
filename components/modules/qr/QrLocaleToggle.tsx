'use client'

import { useTranslations } from 'next-intl'
import { useQrLocale } from './QrIntlProvider'

export function QrLocaleToggle() {
  const { locale, setLocale } = useQrLocale()
  const t = useTranslations('qr')

  return (
    <div
      className="flex rounded-full border border-white/70 bg-white/75 p-1 shadow-[0_16px_30px_-24px_rgba(27,60,42,0.55)] backdrop-blur-md"
      role="group"
      aria-label={t('languageToggle')}
    >
      <button
        type="button"
        onClick={() => setLocale('tr')}
        className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
          locale === 'tr'
            ? 'bg-[#1B3C2A] text-white shadow-sm'
            : 'text-[#1B3C2A]/50 hover:text-[#1B3C2A]'
        }`}
      >
        {t('localeTr')}
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
          locale === 'en'
            ? 'bg-[#1B3C2A] text-white shadow-sm'
            : 'text-[#1B3C2A]/50 hover:text-[#1B3C2A]'
        }`}
      >
        {t('localeEn')}
      </button>
    </div>
  )
}
