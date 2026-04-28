'use client'

import { QrIntlProvider } from './QrIntlProvider'
import { useTranslations } from 'next-intl'
import { CheckCircle2, QrCode, Star, ExternalLink } from 'lucide-react'
import { SITE_LOGO_SRC, GOOGLE_REVIEW_URL } from '@/lib/site-brand'
import Image from 'next/image'

interface QrSessionExpiredProps {
  tableName: string
}

function QrSessionExpiredInner({ tableName }: QrSessionExpiredProps) {
  const t = useTranslations('qr')

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#efe4cf] px-6">
      {/* Arka plan glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-8%] h-64 w-64 rounded-full bg-[#c4841a]/16 blur-3xl" />
        <div className="absolute right-[-10%] top-[15%] h-72 w-72 rounded-full bg-[#1b3c2a]/14 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[20%] h-80 w-80 rounded-full bg-white/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        {/* Logo */}
        <div className="relative mb-5 h-14 w-14">
          <Image
            src={SITE_LOGO_SRC}
            alt="Bolena Cafe"
            fill
            className="object-contain"
          />
        </div>

        {/* Tamamlandı ikonu */}
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,248,242,0.85))] shadow-[0_20px_45px_-28px_rgba(27,60,42,0.45)]">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Masa adı */}
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#1B3C2A]/40">
          {tableName}
        </p>

        {/* Teşekkür başlığı */}
        <h1 className="font-heading text-3xl font-bold text-[#173322]">
          {t('sessionExpiredTitle')}
        </h1>

        {/* Alt yazı */}
        <p className="mt-3 max-w-[260px] text-sm leading-6 text-[#1B3C2A]/55">
          {t('sessionExpiredDesc')}
        </p>

        {/* Yıldızlar */}
        <div className="mt-5 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="h-5 w-5 fill-[#C4841A] text-[#C4841A]"
            />
          ))}
        </div>

        {/* Google Yorum kartı */}
        <div className="mt-5 w-full rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_30px_rgba(27,60,42,0.08)] backdrop-blur-sm">
          <p className="text-sm font-semibold text-[#173322]">
            {t('sessionExpiredReviewTitle')}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#1B3C2A]/55">
            {t('sessionExpiredReviewDesc')}
          </p>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#25523A] to-[#142C1F] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(27,60,42,0.25)] ring-1 ring-white/10 transition-transform active:scale-[0.98]"
          >
            <Star className="h-4 w-4 fill-white" />
            {t('sessionExpiredReviewBtn')}
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>

        {/* Yeni sipariş ipucu */}
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1B3C2A]/8 bg-white/50 px-4 py-3 backdrop-blur-sm">
          <QrCode className="h-4 w-4 shrink-0 text-[#C4841A]" />
          <p className="text-xs font-medium text-[#1B3C2A]/55">
            {t('sessionExpiredScanHint')}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * QR oturumu sona erdiğinde gösterilen ekran.
 * QrIntlProvider ile sarılır — sunucu tarafından render edilebilir.
 */
export function QrSessionExpired({ tableName }: QrSessionExpiredProps) {
  return (
    <QrIntlProvider>
      <QrSessionExpiredInner tableName={tableName} />
    </QrIntlProvider>
  )
}
