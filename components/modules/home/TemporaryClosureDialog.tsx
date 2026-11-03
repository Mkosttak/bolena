'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { INSTAGRAM_URL } from '@/lib/constants/social'
import { SITE_LOGO_SRC } from '@/lib/site-brand'
import { CLOSURE_POPUP_STORAGE_KEY } from '@/lib/site-closure'

/** Sayfa yüklendikten kısa süre sonra açılır; ani bir pop-up hissi vermez. */
const OPEN_DELAY_MS = 600

// Portal içinde gövde yazı tipi miras alınmaz; sitenin diğer bileşenleriyle aynı değer.
const BODY_FONT = { fontFamily: "'Plus Jakarta Sans', sans-serif" } as const
const HEADING_FONT = { fontFamily: "'Playfair Display', Georgia, serif" } as const

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(CLOSURE_POPUP_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed(): void {
  try {
    window.sessionStorage.setItem(CLOSURE_POPUP_STORAGE_KEY, '1')
  } catch {
    // Depolama kapalıysa (gizli mod vb.) pop-up sayfa yenilenince tekrar görünür — sorun değil.
  }
}

/**
 * Geçici ara duyurusu. Ana sayfada, oturum başına bir kez açılır.
 * Kapatma (X, "Anladım", Esc, dışarı tıklama) o oturum için tekrar göstermez.
 */
export function TemporaryClosureDialog() {
  const t = useTranslations('closure')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (readDismissed()) return
    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) writeDismissed()
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        style={BODY_FONT}
        className="gap-0 overflow-hidden rounded-3xl border-0 bg-[#FAF8F2] p-0 text-[#1A1A14] shadow-2xl ring-1 ring-[#1B3C2A]/10 sm:max-w-md"
      >
        {/* ── Marka bandı ─────────────────────────────────────── */}
        <div className="relative bg-[#11261B] px-7 pb-7 pt-8 text-center">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E5B25D]/50 to-transparent"
            aria-hidden
          />
          <DialogClose
            aria-label={t('closeAriaLabel')}
            className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-white/70 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#E5B25D]"
          >
            <X className="size-4" aria-hidden />
          </DialogClose>

          <div className="mx-auto mb-4 flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-[#FAF8F2]/95 p-2 ring-1 ring-white/10">
            <Image
              src={SITE_LOGO_SRC}
              alt="Bolena"
              width={48}
              height={48}
              className="size-full object-contain"
              priority
            />
          </div>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#E5B25D]">
            {t('popupEyebrow')}
          </p>
          <DialogTitle style={HEADING_FONT} className="text-2xl font-bold leading-tight text-white sm:text-[1.75rem]">
            {t('popupTitle')}
          </DialogTitle>
        </div>

        {/* ── Mesaj ───────────────────────────────────────────── */}
        <div className="space-y-4 px-7 pb-7 pt-6">
          <DialogDescription className="text-[0.95rem] leading-relaxed text-[#1A1A14]/80">
            {t('popupBody')}
          </DialogDescription>
          <p className="text-[0.95rem] leading-relaxed text-[#1A1A14]/80">{t('popupThanks')}</p>
          <p className="text-sm font-medium text-[#1B3C2A]">{t('popupFollow')}</p>

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[#1B3C2A] px-5 py-3 text-sm font-semibold text-white outline-none transition hover:bg-[#11261B] focus-visible:ring-2 focus-visible:ring-[#C4841A] focus-visible:ring-offset-2"
            >
              {t('instagramCta')}
            </a>
            <DialogClose className="inline-flex flex-1 items-center justify-center rounded-full border border-[#1B3C2A]/20 bg-transparent px-5 py-3 text-sm font-semibold text-[#1B3C2A] outline-none transition hover:bg-[#1B3C2A]/5 focus-visible:ring-2 focus-visible:ring-[#C4841A] focus-visible:ring-offset-2">
              {t('dismiss')}
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
