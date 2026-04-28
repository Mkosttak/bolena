'use client'

import Image from 'next/image'
import { MapPin } from 'lucide-react'
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
      strokeWidth={1.75}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SiteFooter({ locale: _locale }: SiteFooterProps) {
  const t = useTranslations('home')
  const tContact = useTranslations('contact')

  return (
    <footer className="relative border-t border-[#1B3C2A]/25 bg-[#0F2218] text-[#FAF8F2]/70">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C4841A]/28 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-center md:gap-8 lg:gap-10">
          {/* Marka — hero / menü ile aynı yeşil + krem + #C4841A */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-[#FAF8F2]/12 bg-[#FAF8F2]/[0.05]">
                <Image
                  src="/images/bolena_logo.png"
                  alt=""
                  width={24}
                  height={24}
                  sizes="24px"
                  className="object-contain p-px"
                />
              </div>
              <span className="font-heading text-lg font-extrabold tracking-tight text-[#FAF8F2]">
                Bolena
              </span>
            </div>
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#C4841A]">
              {t('footerTagline')}
            </p>
            <p className="max-w-md text-xs leading-snug text-[#FAF8F2]/58">
              {t('footerDesc')}
            </p>
          </div>

          {/* İletişim & Instagram */}
          <div
            className={cn(
              'flex flex-col rounded-xl border border-[#FAF8F2]/[0.08] bg-[#0a1610]/90 p-3.5',
              'shadow-[inset_0_1px_0_0_rgba(27,60,42,0.35)] backdrop-blur-sm',
            )}
          >
            <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.18em] text-[#FAF8F2]">
              {t('footerContact')}
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${tContact('instagram')}: ${t('footerInstagramLinkLabel')}`}
                className={cn(
                  'group flex w-full items-center gap-2 rounded-lg border border-[#C4841A]/20',
                  'bg-gradient-to-br from-[#FAF8F2]/[0.06] to-transparent',
                  'px-2.5 py-2 text-left transition',
                  'hover:border-[#C4841A]/40 hover:from-[#C4841A]/10 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.45)]',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF8F2]/30',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#C4841A]/28',
                    'bg-[#1B3C2A]/45 text-[#C4841A]',
                    'transition group-hover:border-[#C4841A]/45 group-hover:bg-[#1B3C2A]/65 group-hover:text-[#C4841A]',
                  )}
                >
                  <InstagramGlyph className="h-[15px] w-[15px]" />
                </span>
                <span className="min-w-0 flex-1 text-xs font-semibold leading-tight text-[#FAF8F2]">
                  {t('footerInstagramLinkLabel')}
                </span>
                <span
                  className="shrink-0 text-[10px] font-semibold text-[#C4841A]/60 transition group-hover:text-[#C4841A]"
                  aria-hidden
                >
                  ↗
                </span>
              </a>

              <div className="flex items-start gap-2 rounded-lg border border-[#FAF8F2]/[0.07] bg-black/[0.12] px-2.5 py-1.5">
                <MapPin
                  className="mt-px h-3.5 w-3.5 shrink-0 text-[#C4841A]/80"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="text-xs leading-snug text-[#FAF8F2]/62">
                  {t('footerLocationShort')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
