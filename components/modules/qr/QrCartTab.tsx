'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import {
  ShoppingBag,
  ChefHat,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
} from 'lucide-react'
import { fetchFullOrder } from '@/lib/queries/orders.queries'
import { qrKeys } from '@/lib/queries/qr.queries'
import { useQrSessionStore } from '@/lib/stores/qr-session.store'

interface QrCartTabProps {
  token: string
  sessionToken: string
  orderId: string
  qrEnabled: boolean
  onOpenDraft?: () => void
}

export function QrCartTab({
  sessionToken,
  orderId,
  qrEnabled: _qrEnabled,
  onOpenDraft,
}: QrCartTabProps) {
  const t = useTranslations('qr')
  const locale = useLocale()

  const { data: fullOrder, isPending: isOrderPending } = useQuery({
    queryKey: qrKeys.order(sessionToken),
    queryFn: () => fetchFullOrder(orderId),
    staleTime: 0,           // Realtime invalidasyon anında yansısın
    refetchInterval: 60_000, // Realtime bağlantısı kesilirse 60s fallback polling
  })

  const placedItems = (fullOrder?.items ?? []).filter((i) => i.quantity > 0)
  const hasPlacedItems = placedItems.length > 0
  const isLoading = isOrderPending && fullOrder === undefined

  const grandTotal = placedItems.reduce((sum, i) => sum + i.total_price, 0)

  const localItems = useQrSessionStore((s) => s.items)
  const hasLocalItems = localItems.length > 0

  /* ── Yükleniyor ── */
  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-0 flex-col px-3 pt-4 sm:px-4 space-y-3">
        {/* Skeleton başlık */}
        <div className="h-9 w-48 rounded-xl bg-white/60 animate-pulse" />
        {/* Skeleton kartlar */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/60 bg-white/80 p-4 animate-pulse space-y-2.5"
          >
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#1B3C2A]/8" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/5 rounded-full bg-[#1B3C2A]/10" />
                <div className="h-3 w-2/5 rounded-full bg-[#1B3C2A]/6" />
              </div>
              <div className="w-14 h-4 rounded-full bg-[#1B3C2A]/10" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  /* ── Boş ── */
  if (!hasPlacedItems) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-[#c4841a]/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,248,242,0.85))] shadow-[0_20px_45px_-28px_rgba(27,60,42,0.45)]">
            <ShoppingBag className="h-8 w-8 text-[#1B3C2A]/40" strokeWidth={1.5} />
          </div>
        </div>
        <p className="font-heading text-3xl text-[#173322]">{t('cartEmpty')}</p>
        <p className="mt-2 max-w-[260px] text-sm leading-6 text-[#1B3C2A]/60">{t('cartEmptyHint')}</p>
      </div>
    )
  }

  /* ── İletilen siparişler ── */
  return (
    <div className="flex flex-col min-h-0 flex-1 h-full relative">
      <div 
        className="qr-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-4 pb-32 touch-pan-y sm:px-4 space-y-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        
        {hasLocalItems && (
          <div className="rounded-2xl border border-amber-500/20 bg-[linear-gradient(180deg,rgba(255,251,235,0.9),rgba(255,248,235,0.95))] p-4 shadow-[0_10px_30px_-15px_rgba(245,158,11,0.3)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-amber-100 p-1.5 shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-amber-900">{t('draftAlertTitle')}</h3>
                <p className="mt-1 text-[13px] text-amber-700/80 leading-relaxed">
                  {t('draftAlertDesc', { count: localItems.length })}
                </p>
                <button
                  type="button"
                  onClick={onOpenDraft}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all active:scale-95 hover:bg-amber-600"
                >
                  <Send className="h-4 w-4" />
                  {t('draftAlertCta')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden border border-[#1B3C2A]/10 bg-white/95 shadow-sm">
          {/* Başlık */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1B3C2A]/6 bg-[#1B3C2A]/3">
            <ChefHat className="w-4 h-4 text-[#1B3C2A]/40 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B3C2A]/40">
              {t('submittedOrders')}
            </span>
          </div>

          {/* Kalemler */}
          <div className="px-4 divide-y divide-[#1B3C2A]/5">
            {placedItems.map((item) => {
              const extras = Array.isArray(item.selected_extras)
                ? (item.selected_extras as { option_name_tr: string; option_name_en: string }[])
                : []
              const removed = Array.isArray(item.removed_ingredients)
                ? (item.removed_ingredients as { name_tr: string; name_en: string }[])
                : []
              const kdsReady = item.kds_status === 'ready'
              const displayName =
                locale === 'en' && item.product_name_en
                  ? item.product_name_en
                  : item.product_name_tr

              return (
                <div key={item.id} className="flex gap-3 py-3.5">
                  {/* Adet balonu */}
                  <div className="w-7 h-7 rounded-full bg-[#1B3C2A]/8 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#1B3C2A]">{item.quantity}</span>
                  </div>

                  {/* Ürün bilgisi */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1B3C2A] leading-snug">{displayName}</p>
                    {extras.length > 0 && (
                      <p className="text-xs text-[#1B3C2A]/50 mt-0.5">
                        +{extras.map((e) =>
                          locale === 'en' && e.option_name_en ? e.option_name_en : e.option_name_tr
                        ).join(', ')}
                      </p>
                    )}
                    {removed.length > 0 && (
                      <p className="text-xs text-red-400/80 mt-0.5">
                        ✕ {removed.map((r) =>
                          locale === 'en' && r.name_en ? r.name_en : r.name_tr
                        ).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-[#1B3C2A]/40 mt-0.5 italic">{item.notes}</p>
                    )}
                  </div>

                  {/* Fiyat + durum */}
                  <div className="flex flex-col items-end justify-between shrink-0 gap-1.5">
                    <span className="text-sm font-bold text-[#1B3C2A] tabular-nums">
                      ₺{item.total_price.toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        kdsReady
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {kdsReady ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        <Clock className="w-2.5 h-2.5 animate-pulse" />
                      )}
                      {kdsReady ? t('kitchenReady') : t('kitchenPending')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Genel toplam — sabit alt bar */}
      <div className="absolute bottom-0 inset-x-0 bg-[#efe4cf]/90 backdrop-blur-2xl border-t border-white/40 px-4 pt-3.5 pb-5 safe-area-padding-bottom">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[#1B3C2A]/40" />
              <span className="text-sm font-semibold text-[#1B3C2A]/60">{t('grandTotalLabel')}</span>
            </div>
            <span className="text-lg font-extrabold text-[#1B3C2A] tabular-nums">
              ₺{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
