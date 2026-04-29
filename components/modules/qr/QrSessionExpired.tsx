'use client'

import { QrIntlProvider } from './QrIntlProvider'
import { useLocale, useTranslations } from 'next-intl'
import { CheckCircle2, QrCode, Star, ExternalLink, Receipt } from 'lucide-react'
import { SITE_LOGO_SRC, GOOGLE_REVIEW_URL } from '@/lib/site-brand'
import { INSTAGRAM_URL } from '@/lib/constants/social'
import { calculatePaid } from '@/lib/utils/order.utils'
import type { FullOrder } from '@/lib/queries/orders.queries'
import Image from 'next/image'

interface QrSessionExpiredProps {
  tableName: string
  fullOrder?: FullOrder | null
}

function QrSessionExpiredInner({ tableName, fullOrder }: QrSessionExpiredProps) {
  const t = useTranslations('qr')
  const locale = useLocale()
  const order = fullOrder?.order
  const paidAmount = calculatePaid(fullOrder?.payments ?? [])
  const complimentaryTotal = (fullOrder?.items ?? [])
    .filter((item) => item.quantity > 0 && item.is_complimentary)
    .reduce((sum, item) => sum + Number(item.total_price), 0)
  const discountAmount = Number(order?.discount_amount ?? 0)
  const hasSummary = !!order

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

        {hasSummary && (
          <div className="mt-5 w-full rounded-2xl border border-white/60 bg-white/85 p-4 shadow-[0_8px_30px_rgba(27,60,42,0.08)] backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#1B3C2A]/55" />
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1B3C2A]/55">
                {t('sessionExpiredOrderSummaryTitle')}
              </p>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-[#1B3C2A]/70">
                <span>{t('sessionExpiredSubtotalLabel')}</span>
                <span className="font-semibold">₺{Number(order.subtotal).toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>{t('sessionExpiredDiscountLabel')}</span>
                  <span className="font-semibold">-₺{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {complimentaryTotal > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>{t('sessionExpiredComplimentaryLabel')}</span>
                  <span className="font-semibold">-₺{complimentaryTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-[#1B3C2A]/10 pt-2 text-[#173322]">
                <span className="font-semibold">{t('sessionExpiredTotalLabel')}</span>
                <span className="text-base font-extrabold">₺{Number(order.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[#1B3C2A]/70">
                <span>{t('sessionExpiredPaidLabel')}</span>
                <span className="font-semibold">₺{paidAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

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

        <div className="mt-4 w-full rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_30px_rgba(27,60,42,0.08)] backdrop-blur-sm">
          <p className="text-sm font-semibold text-[#173322]">
            {t('sessionExpiredInstagramTitle')}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#1B3C2A]/55">
            {t('sessionExpiredInstagramDesc')}
          </p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#1B3C2A]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,248,242,0.9))] px-4 py-3.5 text-sm font-bold text-[#1B3C2A] shadow-[0_8px_20px_rgba(27,60,42,0.12)] transition-transform active:scale-[0.98]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            {t('sessionExpiredInstagramBtn')}
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>

        <a
          href={`/${locale || 'tr'}/menu`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#25523A] to-[#142C1F] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(27,60,42,0.25)] ring-1 ring-white/10 transition-transform active:scale-[0.98]"
        >
          {t('sessionExpiredOrderBtn')}
        </a>

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
export function QrSessionExpired({ tableName, fullOrder }: QrSessionExpiredProps) {
  return (
    <QrIntlProvider>
      <QrSessionExpiredInner tableName={tableName} fullOrder={fullOrder} />
    </QrIntlProvider>
  )
}
