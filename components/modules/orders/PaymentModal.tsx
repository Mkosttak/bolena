'use client'

import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  CreditCard,
  Banknote,
  ReceiptText,
  Tag,
  Gift,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
  Square,
  CheckSquare,
} from 'lucide-react'

import { ordersKeys } from '@/lib/queries/orders.queries'
import { addPayment, closeOrder, applyOrderDiscount, toggleItemComplimentary } from '@/app/[locale]/admin/orders/actions'
import { calculateRemaining } from '@/lib/utils/order.utils'
import type { Order, Payment, PaymentMethod, OrderItem, DiscountType } from '@/types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaymentModalProps {
  open: boolean
  order: Order
  items: OrderItem[]
  payments: Payment[]
  onClose: () => void
  onOrderClosed: () => void
}

export function PaymentModal({
  open,
  order,
  items,
  payments,
  onClose,
  onOrderClosed,
}: PaymentModalProps) {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const amountRef = useRef<HTMLInputElement>(null)

  const remaining = calculateRemaining(Number(order.total_amount), payments)

  // ── Normal ödeme state'i ────────────────────────────────────────────────
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [discountValue, setDiscountValue] = useState(
    order.discount_amount > 0 ? String(order.discount_amount) : ''
  )
  const [discountType, setDiscountType] = useState<DiscountType>(
    (order.discount_type as DiscountType) ?? 'amount'
  )
  const [showDiscount, setShowDiscount] = useState(false)

  // ── Split bill state'i ──────────────────────────────────────────────────
  const [splitMode, setSplitMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [localPaidItemIds, setLocalPaidItemIds] = useState<Set<string>>(new Set())

  // ── İndirim yüzde hesabı ────────────────────────────────────────────────
  // Siparişin gerçek indirimini yüzdeye çevirir.
  // amount tipi → subtotal'a oranla yüzde; percent tipi → direkt yüzde.
  const effectiveDiscountPct: number = (() => {
    if (!order.discount_amount || order.discount_amount <= 0) return 0
    if (order.discount_type === 'percent') return Number(order.discount_amount)
    const subtotal = Number(order.subtotal)
    if (subtotal <= 0) return 0
    return (Number(order.discount_amount) / subtotal) * 100
  })()

  // Split modda seçili kalemlerin tutarı — indirim her kaleme eşit oranla uygulanır
  const splitAmount = items
    .filter(item => selectedItemIds.has(item.id) && !item.is_complimentary)
    .reduce((sum, item) => {
      const discounted = Number(item.total_price) * (1 - effectiveDiscountPct / 100)
      return sum + discounted
    }, 0)

  const unpaidItems = items.filter(item => !localPaidItemIds.has(item.id))
  const allItemsLocallyPaid = unpaidItems.length === 0 && items.length > 0

  // Normal mod: modal açılınca tutarı sıfırla
  useEffect(() => {
    if (open && !splitMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(remaining > 0 ? remaining.toFixed(2) : '0')
      setTimeout(() => amountRef.current?.focus(), 100)
    }
  }, [open, remaining, splitMode])

  // Modal kapanınca split state'i temizle
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSplitMode(false)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedItemIds(new Set())
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalPaidItemIds(new Set())
    }
  }, [open])

  // ── Split yardımcılar ───────────────────────────────────────────────────
  function toggleItem(itemId: string) {
    if (localPaidItemIds.has(itemId)) return
    setSelectedItemIds(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function selectAllUnpaid() {
    setSelectedItemIds(new Set(unpaidItems.map(i => i.id)))
  }

  function clearSelection() {
    setSelectedItemIds(new Set())
  }

  // ── Mutations ───────────────────────────────────────────────────────────
  const discountMutation = useMutation({
    mutationFn: () => {
      // Split modda tür her zaman "percent"
      const type: DiscountType = splitMode ? 'percent' : discountType
      return applyOrderDiscount(
        order.id,
        discountValue ? parseFloat(discountValue) : 0,
        discountValue ? type : null
      )
    },
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      queryClient.invalidateQueries({ queryKey: ordersKeys.order(order.id) })
      toast.success('İndirim uygulandı')
    },
  })

  const complimentaryMutation = useMutation({
    mutationFn: ({ itemId, isComplimentary }: { itemId: string; isComplimentary: boolean }) =>
      toggleItemComplimentary(itemId, order.id, isComplimentary),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      queryClient.invalidateQueries({ queryKey: ordersKeys.order(order.id) })
      queryClient.invalidateQueries({ queryKey: ['tables', 'list'] })
    },
  })

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const payAmt = splitMode
        ? Math.min(splitAmount, remaining)
        : parseFloat(amount) || 0

      if (payAmt <= 0) throw new Error('Tutar sıfır olamaz')

      const res = await addPayment(order.id, method, payAmt, note || undefined)
      if (res.error) throw new Error(res.error)

      const newRemaining = remaining - payAmt
      if (newRemaining <= 0.01) {
        await closeOrder(order.id)
        return { closed: true }
      }
      return { closed: false }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.order(order.id) })
      setNote('')

      if (splitMode) {
        setLocalPaidItemIds(prev => {
          const next = new Set(prev)
          selectedItemIds.forEach(id => next.add(id))
          return next
        })
        setSelectedItemIds(new Set())
      }

      if (res.closed) {
        toast.success(t('orderPaidAndClosed'))
        queryClient.invalidateQueries({ queryKey: ordersKeys.all })
        onOrderClosed()
        onClose()
      } else {
        toast.success(tCommon('success'))
      }
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Hata'),
  })

  const METHOD_LABELS: Record<PaymentMethod, string> = {
    cash: t('cash'),
    card: t('card'),
    platform: t('platform'),
  }

  const effectiveSplitAmount = Math.min(splitAmount, remaining)
  const canPay = splitMode
    ? effectiveSplitAmount > 0
    : !!(parseFloat(amount))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 border bg-background">

        {/* ── Header ── */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/40 shrink-0">
          {/*
            pr-12 → Dialog'un sağ üst köşesindeki kapatma butonuyla üst üste gelmesini önler.
            Kapatma butonu shadcn tarafından absolute right-4 top-4 olarak eklenir.
          */}
          <div className="flex items-center gap-3 pr-12">
            <DialogTitle className="flex items-center gap-2 text-lg font-medium flex-1 min-w-0">
              <ReceiptText className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="truncate">{t('payment')}</span>
            </DialogTitle>

            {/* Split bill toggle */}
            <button
              type="button"
              onClick={() => {
                setSplitMode(v => !v)
                setSelectedItemIds(new Set())
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors shrink-0 ${
                splitMode
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              {t('splitBill')}
              {splitMode && (
                <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-primary-foreground/20 text-primary-foreground border-0">
                  {t('splitBillActive')}
                </Badge>
              )}
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 h-full">

          {/* ── LEFT COLUMN: Sipariş Detayları ──────────────────────────── */}
          <div className="md:col-span-6 lg:col-span-5 h-[calc(92vh-65px)] flex flex-col border-r bg-muted/10">
            <div className="p-4 border-b shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t('orderSummary')}
              </h3>

              {splitMode && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={selectAllUnpaid}
                    disabled={unpaidItems.length === 0}
                    className="text-[11px] text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    {t('splitSelectAll')}
                  </button>
                  {selectedItemIds.size > 0 && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-[11px] text-muted-foreground hover:text-foreground hover:underline font-medium"
                      >
                        {t('splitClearSelection')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {items.map((item) => {
                const isLocallyPaid = localPaidItemIds.has(item.id)
                const isSelected = selectedItemIds.has(item.id)
                const isCancelled = item.quantity === 0

                return (
                  <div
                    key={item.id}
                    onClick={() => splitMode && !isCancelled && toggleItem(item.id)}
                    className={`
                      flex justify-between items-center py-2.5 px-2 rounded-md transition-all
                      border border-transparent
                      ${splitMode && !isLocallyPaid && !isCancelled ? 'cursor-pointer' : ''}
                      ${isLocallyPaid
                        ? 'opacity-40 bg-muted/20'
                        : isCancelled
                          ? 'opacity-30 bg-muted/10'
                          : isSelected && splitMode
                            ? 'bg-primary/8 border-primary/30 shadow-sm'
                            : splitMode
                              ? 'hover:bg-muted/30 hover:border-border/50'
                              : 'hover:bg-muted/20 border-b border-border/30 last:border-0'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      {splitMode && (
                        <span className={`shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/40'}`}>
                          {isLocallyPaid
                            ? <CheckSquare className="h-4 w-4 text-green-600" />
                            : isCancelled
                              ? <Square className="h-4 w-4 opacity-20" />
                              : isSelected
                                ? <CheckSquare className="h-4 w-4" />
                                : <Square className="h-4 w-4" />
                          }
                        </span>
                      )}

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isCancelled && (
                            <span className="font-semibold tabular-nums text-xs text-muted-foreground min-w-[20px]">
                              {item.quantity}x
                            </span>
                          )}
                          <span className={`text-sm font-medium ${isLocallyPaid || isCancelled ? 'line-through' : ''}`}>
                            {item.product_name_tr}
                          </span>
                          {item.is_complimentary && !isCancelled && (
                            <span className="text-[10px] text-green-600 font-bold uppercase">
                              {t('complimentary')}
                            </span>
                          )}
                          {isCancelled && (
                            <Badge variant="destructive" className="h-4 px-1.5 py-0 text-[8px] font-bold uppercase border-none shadow-none">
                              İptal
                            </Badge>
                          )}
                          {isLocallyPaid && (
                            <span className="text-[10px] text-green-700 font-bold uppercase flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('splitItemPaid')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!splitMode && !isCancelled && (
                        <Button
                          size="icon"
                          variant={item.is_complimentary ? 'default' : 'ghost'}
                          className={`h-7 w-7 rounded-full transition-colors ${item.is_complimentary ? 'bg-green-600 hover:bg-green-700' : 'text-muted-foreground hover:bg-muted'}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            complimentaryMutation.mutate({ itemId: item.id, isComplimentary: !item.is_complimentary })
                          }}
                          disabled={complimentaryMutation.isPending}
                          title={item.is_complimentary ? 'İkramı İptal Et' : 'İkram Yap'}
                        >
                          <Gift className="h-3 w-3" />
                        </Button>
                      )}

                      <div className="flex flex-col items-end">
                        <span className={`text-sm tracking-tight tabular-nums font-semibold ${
                          item.is_complimentary || isLocallyPaid || isCancelled
                            ? 'line-through text-muted-foreground'
                            : isSelected && splitMode
                              ? 'text-primary'
                              : 'text-foreground'
                        }`}>
                          ₺{Number(item.total_price).toFixed(2)}
                        </span>
                        {/* Split modda indirimli tutar göster */}
                        {splitMode && isSelected && !item.is_complimentary && !isLocallyPaid && !isCancelled && effectiveDiscountPct > 0 && (
                          <span className="text-[11px] text-primary font-semibold tabular-nums">
                            ₺{(Number(item.total_price) * (1 - effectiveDiscountPct / 100)).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Left Footer Summary */}
            <div className="p-5 bg-background border-t shrink-0">
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span className="font-semibold tabular-nums">₺{Number(order.subtotal).toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between items-center text-[13px] text-amber-600">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      {t('discount')} (
                        {order.discount_type === 'percent'
                          ? `%${order.discount_amount}`
                          : `%${effectiveDiscountPct.toFixed(1)} ≈ ₺${order.discount_amount}`
                        }
                      )
                    </span>
                    <span className="font-semibold tabular-nums">
                      -₺{Number(order.discount_type === 'percent'
                        ? Number(order.subtotal) * (Number(order.discount_amount) / 100)
                        : order.discount_amount
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                {payments.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center text-[13px] text-green-600">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3" />
                      {t('payment')} ({METHOD_LABELS[payment.method as PaymentMethod] || payment.method})
                    </span>
                    <span className="font-semibold tabular-nums">-₺{Number(payment.amount).toFixed(2)}</span>
                  </div>
                ))}

                {/* Split mod: seçili kalemlerin ara toplam + indirimli toplam */}
                {splitMode && selectedItemIds.size > 0 && (
                  <div className="flex justify-between items-center text-[13px] text-primary pt-1 border-t border-border/30">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="h-3 w-3" />
                      {t('itemsSelected', { count: selectedItemIds.size })}
                    </span>
                    <span className="font-bold tabular-nums">₺{effectiveSplitAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border/50">
                <span className="text-base font-bold">{t('remaining')}</span>
                <span className={`text-xl font-bold tabular-nums ${remaining <= 0.01 ? 'text-green-600' : 'text-primary'}`}>
                  ₺{remaining.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Ödeme Akışı ───────────────────────────────── */}
          <div className="md:col-span-6 lg:col-span-7 h-[calc(92vh-65px)] flex flex-col p-6 space-y-5 bg-background overflow-y-auto">

            {/* Header Stats */}
            <div className="flex justify-between items-center p-4 rounded-xl bg-muted/30 border border-border/50 shrink-0">
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold mb-0.5">{t('total')}</span>
                <span className="text-xl font-bold tabular-nums">₺{Number(order.total_amount).toFixed(2)}</span>
              </div>
              <div className="mx-4 w-px h-8 bg-border/50" />
              <div className="flex flex-col text-right">
                <span className="text-[11px] text-primary font-semibold uppercase mb-0.5">{t('remaining')}</span>
                <span className={`text-xl font-bold tabular-nums ${remaining <= 0.01 ? 'text-green-600' : 'text-primary'}`}>
                  ₺{remaining.toFixed(2)}
                </span>
              </div>
            </div>

            {/* ── İndirim Bölümü — her iki modda da görünür ── */}
            <div className="space-y-3 border border-border/50 rounded-xl p-3 bg-muted/10 shrink-0">
              <button
                className="w-full flex items-center justify-between outline-none group"
                onClick={() => setShowDiscount(!showDiscount)}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-background border border-border/50 group-hover:border-primary/30 transition-colors">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                      İndirim Uygula
                    </span>
                    {/* Split modda mevcut indirim yüzdesini göster */}
                    {splitMode && effectiveDiscountPct > 0 && (
                      <span className="text-[11px] text-amber-600 font-medium">
                        %{effectiveDiscountPct.toFixed(1)} her kaleme yansıtılıyor
                      </span>
                    )}
                  </div>
                </div>
                {showDiscount ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {showDiscount && (
                <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="flex gap-2 w-full">
                    <div className={`flex gap-2 flex-1 ${splitMode ? '' : 'grid grid-cols-2'}`}>
                      {/* Normal modda tip seçici, split modda sadece yüzde göstergesi */}
                      {splitMode ? (
                        <div className="flex items-center h-10 px-3 rounded-md border border-border/50 bg-muted/20 text-sm text-muted-foreground shrink-0 gap-1.5 min-w-[80px]">
                          <span className="font-semibold text-foreground">%</span>
                          <span>Yüzde</span>
                        </div>
                      ) : (
                        <Select value={discountType} onValueChange={(v) => {
                          setDiscountType(v as DiscountType)
                          if (v === 'percent' && parseFloat(discountValue) > 100) setDiscountValue('100')
                        }}>
                          <SelectTrigger className="h-10 rounded-md bg-background border-border/50 text-sm w-full">
                            <SelectValue>{discountType === 'amount' ? '₺ Tutar' : '% Yüzde'}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="amount">₺ Tutar</SelectItem>
                            <SelectItem value="percent">% Yüzde</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      <Input
                        placeholder={splitMode ? 'Yüzde (0-100)' : '0.00'}
                        className={`h-10 rounded-md bg-background border-border/50 text-sm flex-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${(splitMode || discountType === 'percent') && parseFloat(discountValue) > 100 ? 'border-red-500 ring-2 ring-red-500/20 text-red-600 bg-red-50' : ''}`}
                        type="number"
                        min={0}
                        value={discountValue}
                        onChange={(e) => {
                          setDiscountValue(e.target.value)
                        }}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      className="h-10 px-4 rounded-md font-semibold text-sm shrink-0"
                      onClick={() => discountMutation.mutate()}
                      disabled={discountMutation.isPending || ((splitMode || discountType === 'percent') && parseFloat(discountValue) > 100)}
                    >
                      {tCommon('apply')}
                    </Button>
                  </div>

                  {/* Split modda açıklama notu */}
                  {splitMode && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {t('splitDiscountNotice')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Split mod bilgi banner */}
            {splitMode && remaining > 0 && !allItemsLocallyPaid && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 shrink-0">
                <p className="text-xs text-primary font-medium flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  {t('splitHelp')}
                  {effectiveDiscountPct > 0 ? ` (%${effectiveDiscountPct.toFixed(1)} indirim dahil)` : ''} otomatik hesaplar.
                </p>
              </div>
            )}

            {remaining > 0 ? (
              <div className="flex-1 flex flex-col space-y-5">

                {/* Tutar alanı */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {t('paymentAmount')}
                  </Label>

                  {splitMode ? (
                    <div className={`h-10 flex items-center px-3 rounded-md border font-semibold tabular-nums text-lg transition-colors ${
                      effectiveSplitAmount > 0
                        ? 'border-primary/40 bg-primary/5 text-primary'
                        : 'border-border/40 bg-muted/20 text-muted-foreground'
                    }`}>
                      <span className="text-sm font-medium mr-1.5 opacity-60">₺</span>
                      {selectedItemIds.size === 0 ? (
                        <span className="text-sm font-normal text-muted-foreground">{t('splitNoSelection')}</span>
                      ) : (
                        <span>{effectiveSplitAmount.toFixed(2)}</span>
                      )}
                    </div>
                  ) : (
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">₺</span>
                      <Input
                        ref={amountRef}
                        type="number"
                        step="0.01"
                        className="h-10 pl-8 text-lg font-semibold tabular-nums rounded-md bg-background border-muted-foreground/20 focus-visible:ring-primary/20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={amount}
                        onChange={(e) => {
                          let val = e.target.value
                          if (val && parseFloat(val) > remaining) val = String(remaining)
                          setAmount(val)
                        }}
                        onWheel={(e) => (e.target as HTMLElement).blur()}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  {/* Ödeme Kısayolları */}
                  {!splitMode && remaining > 0 && (
                    <div className="flex gap-1.5 mt-2">
                       {[0.25, 0.5, 0.75].map(ratio => {
                         const isActive = amount === (remaining * ratio).toFixed(2)
                         return (
                           <Button
                             key={ratio}
                             variant={isActive ? 'default' : 'outline'}
                             size="sm"
                             className={`flex-1 h-7 text-[10px] font-bold transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'border-muted-foreground/10 hover:bg-primary/5 hover:text-primary'}`}
                             onClick={() => setAmount((remaining * ratio).toFixed(2))}
                           >
                             %{ratio * 100}
                           </Button>
                         )
                       })}
                       {(() => {
                         const isActive = amount === remaining.toFixed(2)
                         return (
                           <Button
                             variant={isActive ? 'default' : 'outline'}
                             size="sm"
                             className={`flex-1 h-7 text-[10px] font-bold transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'border-muted-foreground/10 hover:bg-primary/5 hover:text-primary'}`}
                             onClick={() => setAmount(remaining.toFixed(2))}
                           >
                             {t('fullPaymentShort') || 'Tümü'}
                           </Button>
                         )
                       })()}
                    </div>
                  )}
                </div>

                {/* Ödeme yöntemi */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {t('paymentMethod')}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={method === 'cash' ? 'default' : 'outline'}
                      className={`h-10 rounded-md font-semibold text-sm transition-all ${method === 'cash' ? 'bg-primary shadow-sm' : 'text-muted-foreground bg-muted/10 border-border/50'}`}
                      onClick={() => setMethod('cash')}
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      {t('cash')}
                    </Button>
                    <Button
                      variant={method === 'card' ? 'default' : 'outline'}
                      className={`h-10 rounded-md font-semibold text-sm transition-all ${method === 'card' ? 'bg-primary shadow-sm' : 'text-muted-foreground bg-muted/10 border-border/50'}`}
                      onClick={() => setMethod('card')}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t('card')}
                    </Button>
                  </div>
                </div>

                {/* Ödeme butonu */}
                <Button
                  className="w-full h-10 rounded-md text-sm font-semibold shadow-sm active:scale-[0.98] transition-transform"
                  onClick={() => paymentMutation.mutate()}
                  disabled={paymentMutation.isPending || !canPay}
                >
                  {splitMode
                    ? selectedItemIds.size > 0
                      ? `${t('splitPayFor')} (₺${effectiveSplitAmount.toFixed(2)})`
                      : t('splitNoSelection')
                    : parseFloat(amount) >= remaining
                      ? `${t('fullPayment')} (₺${Number(amount || 0).toFixed(2)})`
                      : t('partialPaymentAction', { amount: Number(amount || 0).toFixed(2) })
                  }
                </Button>

                {splitMode && allItemsLocallyPaid && remaining > 0.01 && (
                  <p className="text-xs text-amber-600 text-center">
                    {t('adjustmentNeeded', { amount: remaining.toFixed(2) })}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-5">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-bold mb-1">{t('paymentCompleted')}</h4>
                  <p className="text-muted-foreground">{t('paymentSuccess')}</p>
                </div>
                <div className="flex gap-3 mt-4">
                  {order.status === 'active' && (
                    <Button 
                      className="h-12 px-8 rounded-xl font-bold bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        await closeOrder(order.id)
                        queryClient.invalidateQueries({ queryKey: ordersKeys.all })
                        onOrderClosed()
                        onClose()
                      }}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      {t('closeTable')}
                    </Button>
                  )}
                  <Button variant="outline" className="h-12 px-8 rounded-xl font-semibold text-muted-foreground" onClick={onClose}>
                    {tCommon('close')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
