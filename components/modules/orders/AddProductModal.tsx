'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, Utensils, X, Zap } from 'lucide-react'
import Image from 'next/image'

import {
  menuKeys,
  fetchCategories,
  fetchAvailableProducts,
  fetchProductForOrder,
} from '@/lib/queries/menu.queries'
import { campaignKeys, fetchActiveCampaigns } from '@/lib/queries/menu-campaign.queries'
import { ordersKeys, fetchOrderItems } from '@/lib/queries/orders.queries'
import { addOrderItem, updateOrderItemQuantity } from '@/app/[locale]/admin/orders/actions'
import { calculateFinalPrice, applyRadioOptionSelection } from '@/lib/utils/order.utils'
import type {
  Product,
  ExtraGroup,
  RemovedIngredient,
  SelectedExtra,
  OrderItem,
} from '@/types'

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

interface AddProductModalProps {
  open: boolean
  orderId: string
  onClose: () => void
  onSuccess?: () => void
}

export function AddProductModal({ open, orderId, onClose, onSuccess }: AddProductModalProps) {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const [step, setStep] = useState<'list' | 'configure'>('list')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollCategories = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })
  }
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Konfigürasyon state'i
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  // option_id → miktar (0 = seçili değil)
  const [optionQty, setOptionQty] = useState<Record<string, number>>({})

  // Menü verisi nadiren değişir — 2 dakika stale, 10 dk cache'de tut
  const { data: categories } = useQuery({
    queryKey: menuKeys.categories(),
    queryFn: fetchCategories,
    enabled: open,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  })

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: [...menuKeys.products(), 'available', selectedCategoryId],
    queryFn: () => fetchAvailableProducts(selectedCategoryId),
    enabled: open,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })

  // Ürün detayı (ekstralar, içerikler) değişmez — agresif cache
  const { data: productDetails, isLoading: detailsLoading } = useQuery({
    queryKey: [...menuKeys.product(selectedProduct?.id ?? ''), 'forOrder'],
    queryFn: () => fetchProductForOrder(selectedProduct!.id),
    enabled: !!selectedProduct && step === 'configure',
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  })

  // Sepetteki ürünleri getir — TanStack Query cache'inden alır, ayrı fetch yok
  const { data: orderItems = [], isLoading: orderItemsLoading } = useQuery({
    queryKey: ordersKeys.items(orderId),
    queryFn: () => fetchOrderItems(orderId),
    enabled: open,
    staleTime: 0, // Sipariş listesi her zaman taze olmalı
  })

  // Aktif kampanyalar — 30 sn yeterli
  const { data: activeCampaigns = [] } = useQuery({
    queryKey: campaignKeys.active(),
    queryFn: fetchActiveCampaigns,
    enabled: open,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })

  // Adet güncelleme mutasyonu (kart üzerindeki +/- için)
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ item, newQuantity }: { item: OrderItem; newQuantity: number }) => {
      const p = products?.find((pr) => pr.id === item.product_id)
      return updateOrderItemQuantity(
        item.id,
        orderId,
        newQuantity,
        item.product_id,
        p?.track_stock
      )
    },
    onSuccess: (result) => {
      if (result && 'error' in result && result.error) {
        toast.error(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
    },
  })

  // Hızlı Ekleme (Quick Add) Mutasyonu
  const quickAddMutation = useMutation({
    mutationFn: async (product: Product) => {
      const unitPrice = calculateFinalPrice(product, activeCampaigns)
      return addOrderItem({
        orderId,
        productId: product.id,
        productNameTr: product.name_tr,
        productNameEn: product.name_en,
        unitPrice,
        quantity: 1,
        notes: null,
        removedIngredients: [],
        selectedExtras: [],
        trackStock: product.track_stock,
      })
    },
    onSuccess: (result) => {
      if (!result) return
      if ('error' in result && result.error) {
        toast.error(result.error)
        return
      }
      toast.success(t('addedSuccess'))
      queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
      onSuccess?.()
    },
  })

  // Detaylı Ekleme Mutasyonu
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || !productDetails) return { error: 'Ürün seçilmedi' }

      // Zorunlu ekstra kontrol
      const requiredGroups = productDetails.extraGroups.filter((g) => g.is_required)
      for (const group of requiredGroups) {
        const hasSelection = (group.extra_options ?? []).some(
          (o) => (optionQty[o.id] ?? 0) > 0
        )
        if (!hasSelection) {
          return { error: `"${group.name_tr}" seçimi zorunludur` }
        }
      }

      const unitPrice = calculateFinalPrice(selectedProduct, activeCampaigns)

      const removedIngredients: RemovedIngredient[] = (
        productDetails.product.product_ingredients ?? []
      )
        .filter((ing) => ing.is_removable && removedIds.has(ing.id))
        .map((ing) => ({ id: ing.id, name_tr: ing.name_tr, name_en: ing.name_en }))

      const selectedExtras: SelectedExtra[] = []
      for (const [optionId, qty] of Object.entries(optionQty)) {
        if (qty <= 0) continue
        for (const group of productDetails.extraGroups) {
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

      return addOrderItem({
        orderId,
        productId: selectedProduct.id,
        productNameTr: selectedProduct.name_tr,
        productNameEn: selectedProduct.name_en,
        unitPrice,
        quantity,
        notes: notes || null,
        removedIngredients,
        selectedExtras,
        trackStock: selectedProduct.track_stock,
      })
    },
    onSuccess: (result) => {
      if (!result) return
      if ('error' in result && result.error) {
        toast.error(result.error)
        return
      }
      toast.success(t('addedSuccess'))
      queryClient.invalidateQueries({ queryKey: ordersKeys.order(orderId) })
      onSuccess?.()
    },
  })

  function handleSelectProduct(product: Product) {
    if (product.track_stock && (!product.is_available || product.stock_count === 0)) {
      toast.error(t('outOfStockError'))
      return;
    }
    setSelectedProduct(product)
    setStep('configure')
    setQuantity(1)
    setNotes('')
    setRemovedIds(new Set())
    setOptionQty({})
  }

  function handleClose() {
    setStep('list')
    setSelectedProduct(null)
    setSelectedCategoryId(null)
    onClose()
  }

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

  function selectRadioOption(group: ExtraGroup, optionId: string) {
    const optionIds = (group.extra_options ?? []).map((o) => o.id)
    setOptionQty((prev) => applyRadioOptionSelection(optionIds, optionId, prev))
  }

  const activeOrderItems = orderItems.filter((i) => i.quantity > 0)
  const sidebarSubtotal = activeOrderItems.reduce(
    (sum, i) => sum + Number(i.total_price),
    0
  )

  function sameProductQty(productId: string | null) {
    if (!productId) return 0
    return orderItems
      .filter((i) => i.product_id === productId && i.quantity > 0)
      .reduce((s, i) => s + i.quantity, 0)
  }

  const renderOrderSidebar = () => (
    <aside
      className="flex max-h-[30vh] w-full shrink-0 flex-col border-b border-border bg-card/90 lg:h-full lg:max-h-none lg:w-72 lg:border-b-0 lg:border-l"
      aria-label={t('addModalSidebarTitle')}
    >
      <div className="shrink-0 border-b bg-muted/40 px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          {t('addModalSidebarTitle')}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {orderItemsLoading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : activeOrderItems.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">{t('emptyOrder')}</p>
        ) : (
          activeOrderItems.map((item) => {
            const meta = products?.find((pr) => pr.id === item.product_id)
            const lineTotal = sameProductQty(item.product_id)
            const stockCap =
              meta?.track_stock && meta.stock_count != null
                ? meta.stock_count
                : null
            const atStockCap =
              stockCap != null ? lineTotal >= stockCap : false

            return (
              <div
                key={item.id}
                className="rounded-lg border border-border/80 bg-background/80 p-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="min-w-0 flex-1 text-xs font-semibold leading-snug line-clamp-2"
                    title={item.product_name_tr}
                  >
                    {item.product_name_tr}
                  </p>
                  {item.is_complimentary && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 border-none px-1 py-0 text-[9px] font-bold uppercase"
                    >
                      {t('complimentary')}
                    </Badge>
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-primary">
                    ₺{Number(item.total_price).toFixed(2)}
                  </span>
                  {!item.is_complimentary && (
                    <div
                      className="flex items-center gap-0.5 rounded-md border bg-muted/30 p-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0 rounded-sm"
                        onClick={() =>
                          updateQuantityMutation.mutate({
                            item,
                            newQuantity: item.quantity - 1,
                          })
                        }
                        disabled={updateQuantityMutation.isPending}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-[11px] font-bold">{item.quantity}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0 rounded-sm"
                        onClick={() =>
                          updateQuantityMutation.mutate({
                            item,
                            newQuantity: item.quantity + 1,
                          })
                        }
                        disabled={
                          updateQuantityMutation.isPending ||
                          atStockCap
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      {activeOrderItems.length > 0 && (
        <div className="shrink-0 border-t bg-muted/20 px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wide text-muted-foreground">
              {t('subtotal')}
            </span>
            <span className="font-black text-primary">₺{sidebarSubtotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </aside>
  )

  const renderProductGrid = (productList: Product[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {productList.map((product) => {
        const price = calculateFinalPrice(product, activeCampaigns)
        const hasRequiredExtras = product.extra_groups?.some(g => g.is_required) ?? false;
        const isOutOfStock = product.track_stock && (!product.is_available || product.stock_count === 0);

        // Sepetteki adet miktarını bul
        const addedItems = orderItems.filter(i => i.product_id === product.id)
        const totalAdded = addedItems.reduce((sum, item) => sum + item.quantity, 0)
        const itemToModify = addedItems.length > 0 ? addedItems[addedItems.length - 1] : null

        // Aktif global kampanya bilgisi
        const activeGlobalCampaign = price < product.price && activeCampaigns.length > 0
          ? activeCampaigns.find(c => {
              const prodMatch = c.applies_to_product_ids?.includes(product.id)
              const catMatch = c.applies_to_category_ids?.includes(product.category_id)
              const allMatch = !c.applies_to_product_ids?.length && !c.applies_to_category_ids?.length
              return prodMatch || catMatch || allMatch
            })
          : null

        return (
          <div
            key={product.id}
            className={`relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all cursor-pointer group shadow-sm hover:shadow-md
               ${isOutOfStock ? 'opacity-60 grayscale-[50%]' : 'hover:border-primary/50'}`}
            onClick={() => handleSelectProduct(product)}
          >
            <div className="relative h-24 sm:h-28 w-full bg-muted overflow-hidden shrink-0">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name_tr}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground/30 bg-secondary/30">
                  <Utensils className="h-6 w-6" />
                </div>
              )}
              {/* Out of Stock overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
                  <Badge variant="destructive" className="font-bold text-xs pointer-events-none shadow-sm">{t('outOfStockBadge')}</Badge>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-2.5">
              <div className="flex-1">
                <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2" title={product.name_tr}>
                  {product.name_tr}
                </h3>
                 <div className="mt-1 flex flex-col gap-0.5">
                   <div className="flex items-baseline gap-1.5">
                      <p className="text-[13px] sm:text-[15px] font-bold text-primary">₺{price.toFixed(2)}</p>
                      {price < product.price && (
                         <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground line-through decoration-destructive/50">
                         ₺{product.price.toFixed(2)}
                         </span>
                      )}
                   </div>
                   {activeGlobalCampaign && (
                     <div className="mt-1">
                       <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 leading-none truncate max-w-[110px]" title={activeGlobalCampaign.name_tr}>
                         {activeGlobalCampaign.name_tr}
                       </span>
                     </div>
                   )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t h-8">
                <div>
                  {product.track_stock && !isOutOfStock && totalAdded === 0 ? (
                    <Badge variant="secondary" className="text-[8px] sm:text-[9px] px-1 py-0 bg-secondary/60 text-secondary-foreground font-medium uppercase tracking-tighter">
                      Kalan: {Math.max(0, product.stock_count ?? 0)}
                    </Badge>
                  ) : null}
                </div>

                {!hasRequiredExtras && !isOutOfStock && totalAdded === 0 && (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-6 rounded-md px-2 shadow-none hover:shadow-sm transition-all shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      quickAddMutation.mutate(product);
                    }}
                    disabled={quickAddMutation.isPending}
                  >
                    <Plus className="h-2.5 w-2.5 mr-0.5 shrink-0" /> <span className="text-[10px] font-bold">{t('addItemShort')}</span>
                  </Button>
                )}

                {!hasRequiredExtras && !isOutOfStock && totalAdded > 0 && itemToModify && (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <span className="text-[9px] font-bold text-primary whitespace-nowrap">{totalAdded} eklendi</span>
                    <div className="flex items-center gap-0.5 bg-background border rounded-md p-0.5 shadow-sm shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 rounded-sm hover:bg-secondary text-foreground"
                        onClick={() => updateQuantityMutation.mutate({ item: itemToModify, newQuantity: itemToModify.quantity - 1 })}
                        disabled={updateQuantityMutation.isPending}
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </Button>
                      <span className="w-4 text-center text-[10px] font-bold text-primary">{itemToModify.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 rounded-sm hover:bg-secondary text-foreground"
                        onClick={() => updateQuantityMutation.mutate({ item: itemToModify, newQuantity: itemToModify.quantity + 1 })}
                        disabled={updateQuantityMutation.isPending || (product.track_stock && product.stock_count !== null && totalAdded >= product.stock_count)}
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {hasRequiredExtras && !isOutOfStock && (
                   <div className="h-6 flex items-center justify-center rounded-md px-1.5 text-[9px] font-bold text-muted-foreground bg-muted/40 shrink-0 uppercase tracking-tighter">
                      {t('selectionRequired')}
                   </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(92dvh,900px)] max-h-[92dvh] w-full max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl sm:max-w-6xl lg:max-w-7xl"
      >
        <DialogHeader className="p-4 sm:p-5 border-b shrink-0 bg-card z-10 flex flex-row items-start justify-between gap-3 space-y-0">
          <DialogTitle className="flex items-center text-xl font-black tracking-tight pr-2">
            {step === 'list' ? (
              <>
                <Zap className="w-5 h-5 mr-3 text-primary fill-primary/20 shrink-0" /> {t('addItem')}
              </>
            ) : (
              selectedProduct?.name_tr ?? t('addItem')
            )}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-full hover:bg-muted"
            onClick={handleClose}
            aria-label={tCommon('close')}
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {/* Categories are extracted from scroll container to prevent cut-off */}
        {step === 'list' && (
          <div className="relative w-full border-b bg-card shrink-0 shadow-sm z-10">
            <button
              onClick={() => scrollCategories('left')}
              className="absolute left-0 top-0 z-10 h-full px-1.5 flex items-center bg-gradient-to-r from-card to-transparent"
              aria-label="Sola kaydır"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div ref={scrollRef} className="w-full overflow-x-auto no-scrollbar p-1.5 sm:px-8">
              <div className="flex gap-1.5 w-max px-0.5">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 border
                    ${!selectedCategoryId
                      ? 'bg-foreground border-foreground text-background shadow-xs'
                      : 'bg-background border-border hover:bg-accent hover:text-accent-foreground'}`}
                >
                  {t('allCategories')}
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 border whitespace-nowrap
                      ${selectedCategoryId === cat.id
                        ? 'bg-foreground border-foreground text-background shadow-xs'
                        : 'bg-background border-border hover:bg-accent hover:text-accent-foreground'}`}
                  >
                    {cat.name_tr}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => scrollCategories('right')}
              className="absolute right-0 top-0 z-10 h-full px-1.5 flex items-center bg-gradient-to-l from-card to-transparent"
              aria-label="Sağa kaydır"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/10 lg:flex-row">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-muted/10">
          {/* ── Ürün Listesi ── */}
          {step === 'list' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 p-4 sm:p-6 pb-20">
                 {productsLoading ? (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                     {Array.from({ length: 12 }).map((_, i) => (
                       <Skeleton key={i} className="h-44 w-full rounded-xl" />
                     ))}
                   </div>
                 ) : !products?.length ? (
                   <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Utensils className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-base font-medium">{tCommon('noData')}</p>
                   </div>
                 ) : (
                    selectedCategoryId ? (
                       // Tek kategori seçiliyse
                       renderProductGrid(products)
                    ) : (
                       // Tümü seçiliyse kategorilere göre grupla
                       <div className="space-y-8">
                          {categories?.filter(cat => products.some(p => p.category_id === cat.id)).map(cat => {
                            const catProducts = products.filter(p => p.category_id === cat.id);
                            return (
                              <div key={cat.id} className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <h2 className="text-base font-bold uppercase tracking-tight text-foreground/80">{cat.name_tr}</h2>
                                  <div className="h-px bg-border flex-1"></div>
                                </div>
                                {renderProductGrid(catProducts)}
                              </div>
                            )
                          })}
                       </div>
                    )
                 )}
              </div>
            </div>
          )}

          {step === 'configure' && selectedProduct && (() => {
            const price = calculateFinalPrice(selectedProduct, activeCampaigns)
            const activeGlobalCampaign = price < selectedProduct.price && activeCampaigns.length > 0
              ? activeCampaigns.find(c => {
                  const prodMatch = c.applies_to_product_ids?.includes(selectedProduct.id)
                  const catMatch = c.applies_to_category_ids?.includes(selectedProduct.category_id)
                  const allMatch = !c.applies_to_product_ids?.length && !c.applies_to_category_ids?.length
                  return prodMatch || catMatch || allMatch
                })
              : null

            return (
            <div className="flex flex-col min-h-full bg-background p-3 sm:p-5 pb-8 text-[13px]">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 -ml-2 mb-3 h-8 w-fit text-xs font-bold hover:bg-secondary"
                onClick={() => setStep('list')}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {tCommon('back')}
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 <div className="lg:col-span-4 space-y-4">
                    {/* Left Column: Image and Summary */}
                    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border shadow-sm">
                      {selectedProduct.image_url ? (
                        <Image
                          src={selectedProduct.image_url}
                          alt={selectedProduct.name_tr}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted/50 text-muted-foreground/30">
                          <Utensils className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col p-3 bg-muted/30 rounded-xl border shadow-sm gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('unitPrice')}</span>
                        {activeGlobalCampaign && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                            {activeGlobalCampaign.name_tr}
                          </Badge>
                        )}
                      </div>
                      <span className="font-black text-2xl text-primary">
                        ₺{price.toFixed(2)}
                      </span>
                      {price < selectedProduct.price && (
                        <span className="text-xs line-through text-muted-foreground font-medium">
                          ₺{selectedProduct.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                 </div>

                 <div className="lg:col-span-8 space-y-5">
                    {/* Right Column: Configuration */}
                    {detailsLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full rounded-xl" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Çıkarılabilir içerikler */}
                        {(productDetails?.product?.product_ingredients ?? []).filter(
                          (i) => i.is_removable
                        ).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('ingredients')}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-xl bg-card shadow-sm">
                               {(productDetails!.product.product_ingredients ?? []).map((ing) => {
                                 if (!ing.is_removable) return null
                                 return (
                                   <div 
                                     key={ing.id} 
                                     className="flex items-center gap-2 cursor-pointer p-1"
                                     onClick={() => toggleRemoved(ing.id)}
                                   >
                                     <Checkbox
                                       id={`ing-${ing.id}`}
                                       checked={!removedIds.has(ing.id)}
                                       className="h-4 w-4 pointer-events-none"
                                       readOnly
                                     />
                                     <label
                                       className={`text-xs select-none cursor-pointer ${removedIds.has(ing.id) ? 'line-through text-muted-foreground' : 'font-semibold'}`}
                                     >
                                       {ing.name_tr}
                                     </label>
                                   </div>
                                 )
                               })}
                            </div>
                          </div>
                        )}

                        {/* Ekstra gruplar */}
                        {(productDetails?.extraGroups ?? []).map((group) => (
                          <div key={group.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group.name_tr}</p>
                              {group.is_required && (
                                <Badge variant="destructive" className="font-bold shadow-sm text-[9px] px-1.5 py-0 uppercase">
                                  {t('required')}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(group.extra_options ?? [])
                                .filter((o) => o.is_active)
                                .map((option) => {
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
                                      className={`flex items-center justify-between rounded-xl border p-2.5 transition-all cursor-pointer select-none
                                         ${count > 0 ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card hover:border-primary/30'}`}
                                    >
                                      <div className="flex flex-col">
                                        <span className={`text-xs font-bold ${count > 0 ? 'text-primary' : ''}`}>{option.name_tr}</span>
                                        {option.price > 0 && (
                                          <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                                            +₺{Number(option.price).toFixed(2)}
                                          </span>
                                        )}
                                      </div>

                                      {/* Tekli seçim (zorunlu veya max_bir_secim) → radio; çoklu → sayaç; isteğe bağlı tekli → checkbox */}
                                      {isSingleSelect ? (
                                        <div
                                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 pointer-events-none transition-colors
                                            ${count > 0 ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`}
                                        >
                                          {count > 0 && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                        </div>
                                      ) : isMulti ? (
                                        <div
                                          className="flex items-center gap-1 bg-background border rounded-full p-0.5 shadow-inner h-7"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 rounded-full hover:bg-secondary text-foreground"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setOptionCount(option.id, option.max_selections, count - 1)
                                            }}
                                          >
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <span className="w-4 text-center text-[10px] font-black">{count}</span>
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 rounded-full hover:bg-secondary text-foreground"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setOptionCount(option.id, option.max_selections, count + 1)
                                            }}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Checkbox
                                          checked={count > 0}
                                          className="h-4 w-4 rounded-full border pointer-events-none data-[state=checked]:bg-primary"
                                          readOnly
                                        />
                                      )}
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        ))}

                        {/* Not */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{tCommon('note')}</Label>
                          <Textarea
                            rows={2}
                            className="resize-none rounded-xl border p-3 text-xs"
                            placeholder={t('optional')}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                        
                      </div>
                    )}
                 </div>
              </div>
            </div>
          )})()}
          </div>
          {renderOrderSidebar()}
        </div>

        {/* Footer (sadece configure step'te) */}
        {step === 'configure' && selectedProduct && (
          <div className="border-t bg-background/95 backdrop-blur-xl p-2.5 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
             <div className="flex items-center gap-3 max-w-7xl mx-auto">
               <div className="flex flex-col items-center gap-0.5">
                 <div className="flex items-center gap-2 bg-card border rounded-lg p-1 shadow-sm">
                   <Button
                     type="button"
                     size="icon"
                     variant="secondary"
                     className="h-8 w-8 rounded-md"
                     onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                   >
                     <Minus className="h-4 w-4" />
                   </Button>
                   <span className="w-8 text-center font-bold text-base">{quantity}</span>
                   <Button
                     type="button"
                     size="icon"
                     variant="secondary"
                     className="h-8 w-8 rounded-md"
                     onClick={() => setQuantity((q) => {
                       const max = selectedProduct.track_stock && selectedProduct.stock_count !== null
                         ? selectedProduct.stock_count
                         : Infinity
                       return q < max ? q + 1 : q
                     })}
                     disabled={
                       selectedProduct.track_stock &&
                       selectedProduct.stock_count !== null &&
                       quantity >= selectedProduct.stock_count
                     }
                   >
                     <Plus className="h-4 w-4" />
                   </Button>
                 </div>
                 {selectedProduct.track_stock && selectedProduct.stock_count !== null && (
                   <span className="text-[9px] font-semibold text-muted-foreground">
                     {t('stockRemaining', { count: Math.max(0, selectedProduct.stock_count) })}
                   </span>
                 )}
               </div>
               
               {/* Ekle Butonu */}
               <Button
                 className="h-11 rounded-lg text-xs font-bold shadow-lg flex-1 group"
                 onClick={() => addMutation.mutate()}
                 disabled={addMutation.isPending || detailsLoading}
               >
                 {addMutation.isPending
                   ? tCommon('loading')
                   : (
                      <div className="flex items-center justify-between w-full px-1">
                         <span className="uppercase tracking-tight font-black text-[11px]">{t('addToOrder')}</span>
                         <div className="flex items-center gap-2">
                            <span className="opacity-70 text-[9px] font-black uppercase tracking-tighter">{t('total')}</span>
                            <span className="text-base font-black bg-white/20 px-1.5 py-0.5 rounded-md group-hover:scale-105 transition-transform">
                               ₺{(
                                calculateFinalPrice(selectedProduct!, activeCampaigns) * quantity +
                                Object.entries(optionQty).reduce((sum, [optId, qty]) => {
                                  for (const g of productDetails?.extraGroups ?? []) {
                                    const opt = (g.extra_options ?? []).find((o) => o.id === optId)
                                    if (opt) return sum + Number(opt.price) * qty
                                  }
                                  return sum
                                }, 0) * quantity
                              ).toFixed(2)}
                            </span>
                         </div>
                      </div>
                   )}
               </Button>
             </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
