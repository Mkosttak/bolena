'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { MapPin, Phone, Clock, ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from '@/lib/constants/social'
import { cn } from '@/lib/utils'



interface SiteFooterProps {
  locale: string
}

const MAP_LINK =
  'https://maps.google.com/?q=Yaşamkent,+3058.+Sk+3/1,+06810+Çankaya/Ankara'

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SiteFooter({ locale }: SiteFooterProps) {
  const t = useTranslations('home')
  const year = new Date().getFullYear()

  const navLinks: Array<{ href: Route; label: string }> = [
    { href: `/${locale}` as Route, label: t('footerHome') },
    { href: `/${locale}/menu` as Route, label: t('footerMenu') },
    { href: `/${locale}/blog` as Route, label: t('footerBlog') },
    { href: `/${locale}/contact` as Route, label: t('footerContact') },
  ]

  return (
    <footer className="relative overflow-hidden border-t border-[#1B3C2A]/30 bg-[#0F2218] text-[#FAF8F2]/75">
      {/* Üst altın gradient çizgi — markanın aksent rengi */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C4841A]/35 to-transparent"
        aria-hidden
      />

      {/* Subtle dekoratif arka plan — sağ alt köşede çok hafif altın glow */}
      <div
        className="pointer-events-none absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-[#C4841A]/[0.04] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        {/* Ana 3 sütun grid */}
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1.2fr] md:gap-14 lg:gap-20">
          {/* ── Sütun 1: Brand ───────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <Link
              href={`/${locale}` as Route}
              className="group inline-flex items-center gap-2.5 w-fit"
              aria-label="Bolena"
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#FAF8F2]/15 bg-[#FAF8F2]/[0.06] transition group-hover:border-[#C4841A]/40 group-hover:bg-[#FAF8F2]/[0.1]">
                <Image
                  src="/images/bolena_logo.png"
                  alt=""
                  width={36}
                  height={36}
                  sizes="36px"
                  className="object-contain p-0.5"
                />
              </div>
              <span className="font-heading text-2xl font-extrabold tracking-tight text-[#FAF8F2]">
                Bolena
              </span>
            </Link>

            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C4841A]">
              {t('footerTagline')}
            </p>

            <p className="max-w-xs text-sm leading-relaxed text-[#FAF8F2]/55">
              {t('footerDesc')}
            </p>

            {/* Sosyal — sadece Instagram (markanın tek aktif kanalı) */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('footerInstagramLinkLabel')}
              className={cn(
                'mt-2 inline-flex items-center gap-2 rounded-full border border-[#FAF8F2]/15 bg-[#FAF8F2]/[0.04] px-3.5 py-2 w-fit',
                'text-xs font-semibold text-[#FAF8F2]/85',
                'transition hover:border-[#C4841A]/50 hover:bg-[#C4841A]/10 hover:text-[#FAF8F2]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4841A]/60',
              )}
            >
              <InstagramGlyph className="h-4 w-4 text-[#C4841A]" />
              <span>@bolenaglutensizcafe</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" strokeWidth={2.5} />
            </a>
          </div>

          {/* ── Sütun 2: Hızlı Linkler ──────────────────────────── */}
          <nav aria-labelledby="footer-pages-title" className="flex flex-col gap-4">
            <h3
              id="footer-pages-title"
              className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C4841A]"
            >
              {t('footerPages')}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'group inline-flex items-center gap-1.5 text-sm text-[#FAF8F2]/70',
                      'transition hover:text-[#C4841A]',
                    )}
                  >
                    <span className="relative">
                      {link.label}
                      <span
                        className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#C4841A] transition-all duration-300 group-hover:w-full"
                        aria-hidden
                      />
                    </span>
                    <ArrowUpRight
                      className="h-3 w-3 -translate-x-1 -translate-y-px opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                      strokeWidth={2.5}
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[#FAF8F2]/35">
              {t('footerLanguageLabel')}
            </p>
            <div className="flex gap-1.5">
              <Link
                href={'/tr' as Route}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] transition',
                  locale === 'tr'
                    ? 'border-[#C4841A]/50 bg-[#C4841A]/10 text-[#C4841A]'
                    : 'border-[#FAF8F2]/15 text-[#FAF8F2]/55 hover:border-[#FAF8F2]/30 hover:text-[#FAF8F2]/80',
                )}
              >
                TR
              </Link>
              <Link
                href={'/en' as Route}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] transition',
                  locale === 'en'
                    ? 'border-[#C4841A]/50 bg-[#C4841A]/10 text-[#C4841A]'
                    : 'border-[#FAF8F2]/15 text-[#FAF8F2]/55 hover:border-[#FAF8F2]/30 hover:text-[#FAF8F2]/80',
                )}
              >
                EN
              </Link>
            </div>
          </nav>

          {/* ── Sütun 3: İletişim ───────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C4841A]">
              {t('footerReachUs')}
            </h3>

            <ul className="flex flex-col gap-3">
              {/* Adres */}
              <li>
                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 text-sm text-[#FAF8F2]/70 transition hover:text-[#FAF8F2]"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#C4841A]/20 bg-[#1B3C2A]/40 text-[#C4841A] transition group-hover:border-[#C4841A]/45 group-hover:bg-[#C4841A]/10">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col leading-snug">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FAF8F2]/40">
                      {t('footerLocationLabel')}
                    </span>
                    <span className="mt-0.5">{t('footerLocationFull')}</span>
                    <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C4841A]/70 transition group-hover:text-[#C4841A]">
                      {t('footerGetDirections')}
                      <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2.5} />
                    </span>
                  </span>
                </a>
              </li>

              {/* Telefon */}
              <li>
                <a
                  href={`tel:+${WHATSAPP_NUMBER}`}
                  className="group flex items-center gap-3 text-sm text-[#FAF8F2]/70 transition hover:text-[#FAF8F2]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#C4841A]/20 bg-[#1B3C2A]/40 text-[#C4841A] transition group-hover:border-[#C4841A]/45 group-hover:bg-[#C4841A]/10">
                    <Phone className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col leading-snug">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FAF8F2]/40">
                      {t('footerPhoneLabel')}
                    </span>
                    <span className="mt-0.5 font-medium tabular-nums">
                      {t('footerPhoneValue')}
                    </span>
                  </span>
                </a>
              </li>

              {/* Çalışma saatleri linki */}
              <li>
                <Link
                  href={`/${locale}/contact` as Route}
                  className="group flex items-center gap-3 text-sm text-[#FAF8F2]/70 transition hover:text-[#FAF8F2]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#C4841A]/20 bg-[#1B3C2A]/40 text-[#C4841A] transition group-hover:border-[#C4841A]/45 group-hover:bg-[#C4841A]/10">
                    <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {t('footerHoursLink')}
                    <ArrowUpRight
                      className="h-3 w-3 opacity-50 transition group-hover:opacity-100"
                      strokeWidth={2.5}
                    />
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Alt bar ────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-4 border-t border-[#FAF8F2]/[0.08] pt-6 sm:flex-row">
          <p className="text-[11px] tracking-wide text-[#FAF8F2]/40">
            {t('footerCopyright', { year })}
          </p>
          <p className="inline-flex items-center gap-1.5 text-[11px] tracking-wide text-[#FAF8F2]/40">
            {t('footerCraftedIn')}
            <span className="text-[#C4841A]/70" aria-hidden>
              ✦
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}
