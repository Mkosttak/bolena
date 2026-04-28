'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Trash2, Gift, Edit2, Minus, Plus, RotateCcw, AlertTriangle, MessageSquareMore } from 'lucide-react'

import { ordersKeys } from '@/lib/queries/orders.queries'
import {
  removeOrderItem,
  toggleItemComplimentary,
  updateOrderItemQuantity,
} from '@/app/[locale]/admin/orders/actions'
import type { OrderItem } from '@/types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function formatDenseModifiers(item: OrderItem): string | null {
  const parts: string[] = []
  for (const e of item.selected_extras) {
    parts.push(
      e.price > 0
        ? `${e.option_name_tr} +₺${Number(e.price).toFixed(2)}`
        : e.option_name_tr
    )
  }
  for (const ing of item.removed_ingredients) {
    parts.push(`−${ing.name_tr}`)
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

interface OrderItemListProps {
  items: OrderItem[]
  orderId: string
  onEdit?: (item: OrderItem) => void
  /** Masa ekranı: daha fazla ürünü aynı anda göstermek için kompakt ızgara */
  variant?: 'default' | 'dense'
}

export function OrderItemList({ items, orderId, onEdit, variant = 'default' }: OrderItemListProps) {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const [itemToDelete, setItemToDelete] = useState<OrderItem | null>(null)

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeOrderItem(itemId, orderId),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
      setItemToDelete(null)
    },
  })

  const complimentaryMutation = useMutation({
    mutationFn: ({ itemId, value }: { itemId: string; value: boolean }) =>
      toggleItemComplimentary(itemId, orderId, value),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
    },
  })

  const quantityMutation = useMutation({
    mutationFn: ({ itemId, quantity, productId }: { itemId: string; quantity: number; productId: string | null }) =>
      updateOrderItemQuantity(itemId, orderId, quantity, productId),
    onSuccess: (result) => {
      if (result && 'error' in result && result.error) {
        toast.error(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
    },
  })

  if (!items.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {t('emptyOrder')}
      </div>
    )
  }

  const removalDialog = (
    <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Sipariş İptali
          </DialogTitle>
          <DialogDescription className="pt-2 font-medium">
            <strong className="text-foreground">&quot;{itemToDelete?.product_name_tr}&quot;</strong> ürününü iptal etmek istediğinize emin misiniz?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setItemToDelete(null)} className="flex-1 sm:flex-none">
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            onClick={() => itemToDelete && removeMutation.mutate(itemToDelete.id)}
            disabled={removeMutation.isPending}
            className="flex-1 sm:flex-none font-bold"
          >
            {removeMutation.isPending ? 'İşleniyor...' : 'Evet, İptal Et'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (variant === 'dense') {
    return (
      <>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => {
            const isCancelled = item.quantity === 0
            const modLine = !isCancelled ? formatDenseModifiers(item) : null

            if (isCancelled) {
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 p-2.5 opacity-60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold leading-tight text-muted-foreground line-through">
                      {item.product_name_tr}
                    </span>
                    <Badge variant="destructive" className="h-5 shrink-0 px-1.5 py-0 text-[9px] font-bold uppercase">
                      İptal
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-[11px] font-bold border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() =>
                      quantityMutation.mutate({ itemId: item.id, quantity: 1, productId: item.product_id })
                    }
                    disabled={quantityMutation.isPending}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Geri Al
                  </Button>
                </div>
              )
            }

            return (
              <div
                key={item.id}
                className={cn(
                  'flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card/80 p-2.5 shadow-sm ring-1 ring-foreground/[0.04]',
                  item.is_complimentary ? 'bg-amber-50/40 dark:bg-amber-950/15' : ''
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-xs font-bold leading-snug text-foreground line-clamp-2">
                        {item.product_name_tr}
                      </span>
                      {item.is_complimentary && (
                        <Badge
                          variant="secondary"
                          className="h-4 border-none px-1 py-0 text-[8px] font-bold uppercase leading-none"
                        >
                          {t('complimentary')}
                        </Badge>
                      )}
                      <Badge
                        className={cn(
                          'h-4 border-0 px-1.5 py-0 text-[8px] font-bold uppercase leading-none shadow-sm',
                          (item.kds_status ?? 'pending') === 'ready'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:text-white'
                            : 'bg-orange-500 text-white hover:bg-orange-500 dark:bg-orange-600 dark:text-white'
                        )}
                      >
                        {(item.kds_status ?? 'pending') === 'ready' ? t('itemKdsReady') : t('itemKdsPreparing')}
                      </Badge>
                    </div>
                    {modLine && (
                      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground line-clamp-2">{modLine}</p>
                    )}
                    {item.notes && (
                      <div className="mt-1.5 rounded-lg border border-amber-200/80 bg-amber-50/85 px-2 py-1.5 shadow-sm">
                        <div className="flex items-start gap-1.5">
                          <MessageSquareMore className="mt-0.5 h-3 w-3 shrink-0 text-amber-700" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-amber-700">
                              {tCommon('note')}
                            </p>
                            <p className="mt-0.5 text-[10px] leading-snug text-amber-950 line-clamp-2">
                              {item.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-xs font-bold tabular-nums',
                      item.is_complimentary ? 'text-muted-foreground line-through opacity-60' : 'text-primary'
                    )}
                  >
                    ₺{Number(item.total_price).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 border-t border-border/50 pt-1.5">
                  <div className="flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-sm">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-sm hover:bg-muted"
                      onClick={() =>
                        quantityMutation.mutate({
                          itemId: item.id,
                          quantity: item.quantity - 1,
                          productId: item.product_id,
                        })
                      }
                      disabled={quantityMutation.isPending}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center text-[11px] font-bold tabular-nums">{item.quantity}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-sm hover:bg-muted"
                      onClick={() =>
                        quantityMutation.mutate({
                          itemId: item.id,
                          quantity: item.quantity + 1,
                          productId: item.product_id,
                        })
                      }
                      disabled={quantityMutation.isPending}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-6 w-6 border-blue-100 text-blue-600 shadow-none hover:bg-blue-50"
                      onClick={() => onEdit?.(item)}
                      title={tCommon('edit')}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className={cn(
                        'h-6 w-6 shadow-none',
                        item.is_complimentary
                          ? 'border-amber-200 bg-amber-100 text-amber-800'
                          : 'border-amber-100 text-amber-600 hover:bg-amber-50'
                      )}
                      title={t('complimentary')}
                      onClick={() =>
                        complimentaryMutation.mutate({
                          itemId: item.id,
                          value: !item.is_complimentary,
                        })
                      }
                      disabled={complimentaryMutation.isPending}
                    >
                      <Gift className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-6 w-6 border-red-100 text-destructive shadow-none hover:bg-red-50"
                      onClick={() => setItemToDelete(item)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {removalDialog}
      </>
    )
  }

  return (
    <>
    <div className="relative divide-y">
      {items.map((item) => {
        const isCancelled = item.quantity === 0
        return (
          <div 
            key={item.id} 
            className={`py-4 transition-all duration-300 ${
              isCancelled 
                ? 'opacity-40 bg-muted/5' 
                : item.is_complimentary 
                  ? 'opacity-70' 
                  : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold text-sm sm:text-base transition-all ${isCancelled ? 'line-through decoration-destructive/50 text-muted-foreground' : ''}`}>
                    {item.product_name_tr}
                  </span>
                  {item.is_complimentary && !isCancelled && (
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 hover:bg-amber-100 border-none shadow-none">
                      {t('complimentary')}
                    </Badge>
                  )}
                  {!isCancelled && (
                    <Badge
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider border-0 shadow-sm px-2.5 py-0.5',
                        (item.kds_status ?? 'pending') === 'ready'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:text-white'
                          : 'bg-orange-500 text-white hover:bg-orange-500 dark:bg-orange-600 dark:text-white'
                      )}
                    >
                      {(item.kds_status ?? 'pending') === 'ready' ? t('itemKdsReady') : t('itemKdsPreparing')}
                    </Badge>
                  )}
                  {isCancelled && (
                    <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider h-5 flex items-center gap-1 shadow-none">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      İptal Edildi
                    </Badge>
                  )}
                </div>

                {/* Modifikasyonlar UI */}
                {!isCancelled && (
                  <div className="mt-1.5 space-y-1 ml-1 border-l-2 border-muted/30 pl-3">
                    {/* Seçilen ekstralar */}
                    {item.selected_extras.map((extra, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground/80 leading-none">
                        <span className="text-primary/40 font-bold">+</span>
                        <span>{extra.option_name_tr}</span>
                        {extra.price > 0 && (
                          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/50 px-1 rounded">
                            +₺{Number(extra.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                    {/* Çıkarılan içerikler */}
                    {item.removed_ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] sm:text-xs text-destructive/60 leading-none italic">
                        <span className="text-destructive/30 font-bold">−</span>
                        <span>{ing.name_tr}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Not */}
                {item.notes && !isCancelled && (
                  <div className="mt-2 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-100/70 px-3 py-2.5 shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-amber-700">
                        <MessageSquareMore className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                          {tCommon('note')}
                        </p>
                        <p className="mt-1 break-words text-xs leading-5 text-amber-950 sm:text-sm">
                          {item.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0">
                <span className={`text-sm font-bold ${isCancelled ? 'text-muted-foreground/50 line-through' : 'text-primary'}`}>
                  {item.is_complimentary ? (
                    <span className="text-muted-foreground line-through opacity-50">
                      ₺{Number(item.total_price).toFixed(2)}
                    </span>
                  ) : (
                    `₺${Number(item.total_price).toFixed(2)}`
                  )}
                </span>

                <div className="flex items-center gap-1.5">
                  {!isCancelled ? (
                    <>
                      {/* Adet Kontrolü */}
                      <div className="flex items-center gap-1 bg-background rounded-lg p-0.5 border shadow-sm mr-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-md hover:bg-muted"
                          onClick={() => quantityMutation.mutate({ itemId: item.id, quantity: item.quantity - 1, productId: item.product_id })}
                          disabled={quantityMutation.isPending}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-xs font-bold leading-none">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-md hover:bg-muted"
                          onClick={() => quantityMutation.mutate({ itemId: item.id, quantity: item.quantity + 1, productId: item.product_id })}
                          disabled={quantityMutation.isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-blue-600 border-blue-100 hover:bg-blue-50 transition-colors shadow-none"
                        onClick={() => onEdit?.(item)}
                        title={tCommon('edit')}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="icon"
                        variant="outline"
                        className={`h-8 w-8 transition-colors shadow-none ${
                          item.is_complimentary 
                            ? 'bg-amber-100 text-amber-700 border-amber-200' 
                            : 'text-amber-600 border-amber-100 hover:bg-amber-50'
                        }`}
                        title={t('complimentary')}
                        onClick={() =>
                          complimentaryMutation.mutate({
                            itemId: item.id,
                            value: !item.is_complimentary,
                          })
                        }
                        disabled={complimentaryMutation.isPending}
                      >
                        <Gift className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-destructive border-red-100 hover:bg-red-50 transition-colors shadow-none"
                        onClick={() => setItemToDelete(item)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    /* Geri Al / Geri Yükle */
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-2 text-[11px] font-bold border-green-200 text-green-700 hover:bg-green-50 shadow-none px-3"
                      onClick={() => quantityMutation.mutate({ itemId: item.id, quantity: 1, productId: item.product_id })}
                      disabled={quantityMutation.isPending}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Geri Al
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
    {removalDialog}
    </>
  )
}
