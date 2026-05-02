'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { INSTAGRAM_URL } from '@/lib/constants/social'
import { cn } from '@/lib/utils'

interface SiteFooterProps {
  locale: string
}

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
    <footer className="relative border-t border-[#1B3C2A]/30 bg-[#0F2218] text-[#FAF8F2]/70">
      {/* Üst altın gradient çizgi — markanın imza aksantı */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C4841A]/30 to-transparent"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
        {/* Üst sıra: Marka (sol) + Linkler & Sosyal (sağ) */}
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Marka */}
          <Link
            href={`/${locale}` as Route}
            className="group inline-flex items-center gap-2.5"
            aria-label="Bolena"
          >
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-[#FAF8F2]/15 bg-[#FAF8F2]/[0.05] transition group-hover:border-[#C4841A]/40">
              <Image
                src="/images/bolena_logo.png"
                alt=""
                width={28}
                height={28}
                sizes="28px"
                className="object-contain p-px"
              />
            </div>
            <span className="font-heading text-lg font-extrabold tracking-tight text-[#FAF8F2]">
              Bolena
            </span>
            <span className="ml-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#C4841A]">
              {t('footerTagline')}
            </span>
          </Link>

          {/* Linkler + sosyal */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <nav aria-label={t('footerPages')} className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'group relative text-[#FAF8F2]/70 transition hover:text-[#FAF8F2]',
                  )}
                >
                  {link.label}
                  <span
                    className="absolute -bottom-1 left-0 h-px w-0 bg-[#C4841A] transition-all duration-300 group-hover:w-full"
                    aria-hidden
                  />
                </Link>
              ))}
            </nav>

            {/* Ayraç (sadece desktop) */}
            <span className="hidden h-4 w-px bg-[#FAF8F2]/15 sm:inline-block" aria-hidden />

            {/* Instagram */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('footerInstagramLinkLabel')}
              className={cn(
                'group inline-flex items-center gap-1.5 text-[#FAF8F2]/70 transition hover:text-[#C4841A]',
              )}
            >
              <InstagramGlyph className="h-4 w-4" />
              <span className="text-sm">Instagram</span>
              <ArrowUpRight
                className="h-3 w-3 opacity-0 transition group-hover:opacity-100"
                strokeWidth={2.5}
              />
            </a>
          </div>
        </div>

        {/* Alt bar — copyright + tagline */}
        <div className="mt-6 flex flex-col items-start justify-between gap-2 border-t border-[#FAF8F2]/[0.07] pt-5 sm:flex-row sm:items-center">
          <p className="text-[11px] tracking-wide text-[#FAF8F2]/35">
            {t('footerCopyright', { year })}
          </p>
          <p className="inline-flex items-center gap-1.5 text-[11px] tracking-wide text-[#FAF8F2]/35">
            {t('footerCraftedIn')}
            <span className="text-[#C4841A]/60" aria-hidden>
              ✦
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}
