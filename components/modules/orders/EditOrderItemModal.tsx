'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Minus, Plus, Utensils } from 'lucide-react'
import Image from 'next/image'

import { menuKeys, fetchProductForOrder } from '@/lib/queries/menu.queries'
import { ordersKeys } from '@/lib/queries/orders.queries'
import { updateOrderItem } from '@/app/[locale]/admin/orders/actions'
import { applyRadioOptionSelection } from '@/lib/utils/order.utils'
import type { OrderItem, ExtraGroup, RemovedIngredient, SelectedExtra } from '@/types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

interface EditOrderItemModalProps {
  open: boolean
  orderId: string
  item: OrderItem | null
  onClose: () => void
}

export function EditOrderItemModal({ open, orderId, item, onClose }: EditOrderItemModalProps) {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [optionQty, setOptionQty] = useState<Record<string, number>>({})

  // Verileri önceden doldur
  useEffect(() => {
    if (item && open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantity(item.quantity)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes(item.notes || '')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemovedIds(new Set(item.removed_ingredients.map(i => i.id)))

      const qtys: Record<string, number> = {}
      item.selected_extras.forEach(extra => {
        qtys[extra.option_id] = (qtys[extra.option_id] || 0) + 1
      })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptionQty(qtys)
    }
  }, [item, open])

  const { data: details, isLoading } = useQuery({
    queryKey: [...menuKeys.product(item?.product_id ?? ''), 'forOrder'],
    queryFn: () => fetchProductForOrder(item!.product_id!),
    enabled: !!item?.product_id && open,
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!item || !details) return { error: 'Veri eksik' }

      // Zorunlu ekstra kontrolü
      const requiredGroups = details.extraGroups.filter((g) => g.is_required)
      for (const group of requiredGroups) {
        const hasSelection = (group.extra_options ?? []).some(
          (o) => (optionQty[o.id] ?? 0) > 0
        )
        if (!hasSelection) {
          return { error: `"${group.name_tr}" seçimi zorunludur` }
        }
      }

      const removedIngredients: RemovedIngredient[] = (
        details.product.product_ingredients ?? []
      )
        .filter((ing) => ing.is_removable && removedIds.has(ing.id))
        .map((ing) => ({ id: ing.id, name_tr: ing.name_tr, name_en: ing.name_en }))

      const selectedExtras: SelectedExtra[] = []
      for (const [optionId, qty] of Object.entries(optionQty)) {
        if (qty <= 0) continue
        for (const group of details.extraGroups) {
          const option = (group.extra_options ?? []).find((o) => o.id === optionId)
          if (option) {
            for (let i = 0; i < qty; i++) {
              selectedExtras.push({
                group_id: group.id,
                group_name_tr: group.name_tr,
                option_id: option.id,
                option_name_tr: option.name_tr,
                option_name_en: option.name_en,
                price: Number(option.price),
              })
            }
          }
        }
      }

      return updateOrderItem({
        itemId: item.id,
        orderId,
        productId: item.product_id,
        unitPrice: Number(item.unit_price),
        quantity,
        notes: notes || null,
        removedIngredients,
        selectedExtras,
        trackStock: details.product.track_stock,
      })
    },
    onSuccess: (result) => {
      if (result && 'error' in result && result.error) {
        toast.error(result.error)
        return
      }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
      onClose()
    },
  })

  function toggleRemoved(id: string) {
    setRemovedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function setOptionCount(optionId: string, max: number, value: number) {
    setOptionQty((prev) => ({ ...prev, [optionId]: Math.min(max, Math.max(0, value)) }))
  }

  // Zorunlu gruplarda radio semantiği: seçileni işaretle, diğerlerini sıfırla
  function selectRadioOption(group: ExtraGroup, optionId: string) {
    const optionIds = (group.extra_options ?? []).map((o) => o.id)
    setOptionQty((prev) => applyRadioOptionSelection(optionIds, optionId, prev))
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 sm:p-5 border-b bg-card shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight text-left">
            {item.product_name_tr}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8">
          <div className="flex flex-col gap-6">
              {/* Üst: Görsel ve Fiyat */}
              <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden border">
                    {details?.product?.image_url ? (
                      <Image src={details.product.image_url} alt={item.product_name_tr} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Utensils className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3 bg-muted/30 rounded-xl border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{t('unitPrice')}</span>
                    <p className="text-2xl font-black text-primary">₺{Number(item.unit_price).toFixed(2)}</p>
                  </div>
              </div>

              {/* Alt: Ayarlar */}
              <div className="space-y-6">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : details && (
                  <>
                    {/* Malzemeler */}
                    {details.product.product_ingredients?.some(i => i.is_removable) && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('ingredients')}</p>
                        <div className="grid grid-cols-2 gap-2 p-3 border rounded-xl bg-card">
                           {details.product.product_ingredients.filter(i => i.is_removable).map(ing => (
                             <div key={ing.id} className="flex items-center gap-2 cursor-pointer p-1" onClick={() => toggleRemoved(ing.id)}>
                               <Checkbox checked={!removedIds.has(ing.id)} className="h-4 w-4 pointer-events-none" readOnly />
                               <span className={`text-xs select-none ${removedIds.has(ing.id) ? 'line-through text-muted-foreground' : 'font-semibold'}`}>{ing.name_tr}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}

                    {/* Ekstralar */}
                    {details.extraGroups.map(group => (
                      <div key={group.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group.name_tr}</p>
                          {group.is_required && <Badge variant="destructive" className="text-[9px] font-bold px-1.5 py-0 uppercase">{t('required')}</Badge>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.extra_options?.filter(o => o.is_active).map(option => {
                            const count = optionQty[option.id] ?? 0
                            // Tek seçim: zorunlu gruplar VEYA max_bir_secim=true olan isteğe bağlı gruplar
                            const isSingleSelect = group.is_required || group.max_bir_secim
                            const isMulti = !isSingleSelect && option.max_selections > 1
                            return (
                              <div
                                key={option.id}
                                onClick={() => {
                                  if (isSingleSelect) {
                                    selectRadioOption(group, option.id)
                                  } else if (!isMulti) {
                                    setOptionCount(option.id, 1, count > 0 ? 0 : 1)
                                  }
                                }}
                                className={`flex items-center justify-between p-2.5 border rounded-xl transition-all cursor-pointer ${count > 0 ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card hover:border-primary/30'}`}
                              >
                                <div className="flex flex-col">
                                  <span className={`text-xs font-bold ${count > 0 ? 'text-primary' : ''}`}>{option.name_tr}</span>
                                  {option.price > 0 && <span className="text-[10px] font-semibold text-muted-foreground">+₺{Number(option.price).toFixed(2)}</span>}
                                </div>
                                {/* Tekli seçim (zorunlu veya max_bir_secim) → radio dot | çoklu → sayaç | isteğe bağlı tekli → checkbox */}
                                {isSingleSelect ? (
                                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 pointer-events-none transition-colors ${count > 0 ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`}>
                                    {count > 0 && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                  </div>
                                ) : isMulti ? (
                                  <div className="flex items-center gap-1 bg-background border rounded-full p-0.5 shadow-inner" onClick={e => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setOptionCount(option.id, option.max_selections, count - 1)}><Minus className="h-3 w-3" /></Button>
                                    <span className="w-4 text-center text-[10px] font-black">{count}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setOptionCount(option.id, option.max_selections, count + 1)}><Plus className="h-3 w-3" /></Button>
                                  </div>
                                ) : (
                                  <Checkbox checked={count > 0} className="h-4 w-4 rounded-full pointer-events-none" readOnly />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Not (Always visible) */}
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{tCommon('note')}</Label>
                   <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('optional')} className="rounded-xl border shadow-sm text-xs p-3" />
                </div>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-background/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-card border rounded-lg p-1.5 shadow-sm">
                 <Button variant="secondary" size="icon" className="h-10 w-10 rounded-md" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="h-5 w-5" /></Button>
                 <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                 <Button variant="secondary" size="icon" className="h-10 w-10 rounded-md" onClick={() => setQuantity(q => q + 1)}><Plus className="h-5 w-5" /></Button>
              </div>
              <Button
                className="flex-1 h-14 rounded-xl font-black text-sm shadow-xl uppercase tracking-widest"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || isLoading}
              >
                 {updateMutation.isPending ? tCommon('loading') : tCommon('save')}
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
