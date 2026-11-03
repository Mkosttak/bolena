import Link from 'next/link'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { INSTAGRAM_URL, WHATSAPP_URL } from '@/lib/constants/social'

// Menü/ana sayfa bileşenleriyle aynı gövde yazı tipi (globals.css'teki --font-sans kendine referans veriyor).
const BODY_FONT = { fontFamily: "'Plus Jakarta Sans', sans-serif" } as const
const HEADING_FONT = { fontFamily: "'Playfair Display', Georgia, serif" } as const

interface MenuClosureNoticeProps {
  locale: string
}

/**
 * Geçici ara süresince public menü sayfasında ürün listesinin yerini alır.
 * Sunucu bileşeni — DB sorgusu yapmaz.
 */
export function MenuClosureNotice({ locale }: MenuClosureNoticeProps) {
  const t = useTranslations('closure')

  return (
    <section
      aria-labelledby="menu-closure-title"
      className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20"
      style={BODY_FONT}
    >
      <div className="rounded-3xl border border-[#1B3C2A]/10 bg-white px-6 py-10 text-center shadow-[0_24px_60px_-32px_rgba(17,38,27,0.25)] sm:px-12 sm:py-14">
        <span
          className="mx-auto mb-6 block h-0.5 w-12 rounded-full bg-[#C4841A]"
          aria-hidden
        />
        <h2
          id="menu-closure-title"
          style={HEADING_FONT}
          className="text-2xl font-bold leading-tight text-[#1B3C2A] sm:text-3xl"
        >
          {t('menuNoticeTitle')}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#1A1A14]/75">
          {t('menuNoticeBody')}
        </p>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[#1A1A14]/75">
          {t('menuNoticeThanks')}
        </p>
        <p className="mt-3 text-sm font-medium text-[#1B3C2A]">{t('popupFollow')}</p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#1B3C2A] px-6 py-3 text-sm font-semibold text-white outline-none transition hover:bg-[#11261B] focus-visible:ring-2 focus-visible:ring-[#C4841A] focus-visible:ring-offset-2"
          >
            {t('instagramCta')}
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-[#1B3C2A]/20 px-6 py-3 text-sm font-semibold text-[#1B3C2A] outline-none transition hover:bg-[#1B3C2A]/5 focus-visible:ring-2 focus-visible:ring-[#C4841A] focus-visible:ring-offset-2"
          >
            {t('whatsappCta')}
          </a>
          <Link
            href={`/${locale}` as Route}
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-[#1B3C2A]/70 outline-none transition hover:text-[#1B3C2A] focus-visible:ring-2 focus-visible:ring-[#C4841A] focus-visible:ring-offset-2"
          >
            {t('menuNoticeBackHome')}
          </Link>
        </div>
      </div>
    </section>
  )
}
