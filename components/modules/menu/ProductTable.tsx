'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { menuKeys, fetchProducts } from '@/lib/queries/menu.queries'
import { campaignKeys, fetchActiveCampaigns } from '@/lib/queries/menu-campaign.queries'
import { toggleProductField, updateProductsOrder } from '@/app/[locale]/admin/menu/actions'
import { calculateFinalPrice, calculateEffectivePrice } from '@/lib/utils/order.utils'
import type { Product, MenuCampaign } from '@/types'
import { Pencil, GripVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProductTableProps {
  locale: string
  categoryId: string | null
  searchTerm?: string
  /** Tüm kategorilerden arama sonuçları tablosu (Kategori sütunu + sürükle-bırak kapalı) */
  showCategoryColumn?: boolean
}

// ─── Sortable Row ─────────────────────────────────────────────────────────────

interface SortableRowProps {
  product: Product
  locale: string
  onToggle: (product: Product, field: 'is_available' | 'is_visible' | 'is_featured') => void
  isPending: boolean
  activeCampaigns: MenuCampaign[]
  t: ReturnType<typeof useTranslations>
  tCommon: ReturnType<typeof useTranslations>
  showCategoryColumn: boolean
}

function SortableRow({
  product,
  locale,
  onToggle,
  isPending,
  activeCampaigns,
  t,
  tCommon,
  showCategoryColumn,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  })
  const router = useRouter()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  // En yüksek öncelikli global kampanyayı bul
  const finalPrice = calculateFinalPrice(product, activeCampaigns)
  const isGlobalCampaignActive = finalPrice !== calculateEffectivePrice(product)
  
  // Eğer global kampanya yoksa ürünün kendi statik kampanyası var mı?
  const hasStaticCampaign = product.campaign_price != null &&
    (product.campaign_end_date == null || new Date(product.campaign_end_date) >= new Date())

  // Gösterilecek kampanya adı (eğer global ise)
  const activeGlobalCampaign = isGlobalCampaignActive 
    ? activeCampaigns.find(c => {
        const prodMatch = c.applies_to_product_ids?.includes(product.id)
        const catMatch = c.applies_to_category_ids?.includes(product.category_id)
        const allMatch = !c.applies_to_product_ids?.length && !c.applies_to_category_ids?.length
        return prodMatch || catMatch || allMatch
      })
    : null


  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={[
        !product.is_visible ? 'opacity-50' : '',
        isDragging ? 'bg-muted shadow-md' : '',
      ].join(' ')}
    >
      {/* Drag handle */}
      <TableCell className="align-middle w-8 px-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>

      {/* Resim */}
      <TableCell className="align-middle">
        {product.image_url ? (
          <div className="relative h-12 w-12 rounded-lg overflow-hidden border shadow-sm">
            <Image
              src={product.image_url}
              alt={product.name_tr}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-dashed text-muted-foreground text-[10px]">
            —
          </div>
        )}
      </TableCell>

      {showCategoryColumn ? (
        <TableCell className="align-middle max-w-[140px]">
          <span className="text-sm text-muted-foreground line-clamp-2">
            {product.categories?.name_tr ?? t('uncategorized')}
          </span>
        </TableCell>
      ) : null}

      {/* Ad */}
      <TableCell className="align-middle">
        <div className="flex flex-col">
          <p className="font-semibold text-sm leading-tight">{product.name_tr}</p>
          <p className="text-[11px] text-muted-foreground">{product.name_en}</p>
        </div>
      </TableCell>

      {/* Stok */}
      <TableCell className="align-middle text-center">
        {product.track_stock && product.stock_count != null ? (
          product.stock_count > 0 ? (
            <span className="text-sm font-medium">
              {product.stock_count}
            </span>
          ) : (
            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-bold">
              {t('outOfStock')}
            </Badge>
          )
        ) : (
          <span className="text-muted-foreground/30">—</span>
        )}
      </TableCell>

      {/* Fiyat */}
      <TableCell className="align-middle min-w-[120px]">
        <div className="flex flex-col">
          {finalPrice < product.price ? (
            <>
              <p className="text-[10px] line-through text-muted-foreground/60 leading-none mb-0.5">
                ₺{product.price.toFixed(2)}
              </p>
              <p className="font-bold text-primary text-sm">
                ₺{finalPrice.toFixed(2)}
              </p>
              {activeGlobalCampaign ? (
                <div className="mt-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 leading-none truncate max-w-[100px]" title={activeGlobalCampaign.name_tr}>
                    {activeGlobalCampaign.name_tr}
                  </span>
                </div>
              ) : hasStaticCampaign ? (
                <div className="mt-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground border border-border leading-none">
                    Statik İndirim
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <p className="font-bold text-sm">₺{product.price.toFixed(2)}</p>
          )}
        </div>
      </TableCell>

      {/* Satışta */}
      <TableCell className="align-middle text-center">
        <div className="flex justify-center">
          <Switch
            checked={product.is_available}
            onCheckedChange={() => onToggle(product, 'is_available')}
            disabled={isPending}
          />
        </div>
      </TableCell>

      {/* Menüde Göster */}
      <TableCell className="align-middle text-center">
        <div className="flex justify-center">
          <Switch
            checked={product.is_visible}
            onCheckedChange={() => onToggle(product, 'is_visible')}
            disabled={isPending}
          />
        </div>
      </TableCell>

      {/* Öne Çıkar */}
      <TableCell className="align-middle text-center">
        <div className="flex justify-center">
          <Switch
            checked={product.is_featured}
            onCheckedChange={() => onToggle(product, 'is_featured')}
            disabled={isPending}
          />
        </div>
      </TableCell>

      {/* İşlemler */}
      <TableCell className="align-middle text-right">
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 h-8 px-2 hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium"
          onClick={() => router.push(`/${locale}/admin/menu/${product.id}/edit`)}
        >
          <Pencil className="h-3.5 w-3.5" />
          {tCommon('edit')}
        </Button>
      </TableCell>
    </TableRow>
  )
}

// ─── Ana Tablo ────────────────────────────────────────────────────────────────

export function ProductTable({
  locale,
  categoryId,
  searchTerm,
  showCategoryColumn = false,
}: ProductTableProps) {
  const t = useTranslations('menu')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: menuKeys.productsByCategory(categoryId),
    queryFn: () => fetchProducts(categoryId),
  })

  const { data: activeCampaigns = [] } = useQuery({
    queryKey: campaignKeys.active(),
    queryFn: fetchActiveCampaigns,
  })

  const filteredProducts = products?.filter((p) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      p.name_tr.toLowerCase().includes(search) ||
      (p.name_en?.toLowerCase().includes(search) ?? false)
    )
  })

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      field,
      value,
    }: {
      id: string
      field: 'is_available' | 'is_visible' | 'is_featured'
      value: boolean
    }) => toggleProductField(id, field, value),
    onSuccess: (result, variables) => {
      if (result.error) { toast.error(result.error); return }
      queryClient.setQueryData<Product[]>(
        menuKeys.productsByCategory(categoryId),
        (old) =>
          old?.map((p) =>
            p.id === variables.id ? { ...p, [variables.field]: variables.value } : p
          )
      )
    },
    onError: () => toast.error(tCommon('error')),
  })

  const orderMutation = useMutation({
    mutationFn: (orders: { id: string; sort_order: number }[]) => updateProductsOrder(orders),
    onSuccess: (result) => {
      if (result.error) toast.error(result.error)
    },
    onError: () => toast.error(tCommon('error')),
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !products) return

    const currentList = filteredProducts ?? products
    const oldIndex = currentList.findIndex((p) => p.id === active.id)
    const newIndex = currentList.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(currentList, oldIndex, newIndex)

    // Optimistic update
    queryClient.setQueryData<Product[]>(menuKeys.productsByCategory(categoryId), (old) => {
      if (!old) return old
      const reorderedIds = new Set(reordered.map((p) => p.id))
      const unchanged = old.filter((p) => !reorderedIds.has(p.id))
      return [...reordered, ...unchanged]
    })

    orderMutation.mutate(
      reordered.map((p, idx) => ({ id: p.id, sort_order: idx }))
    )
  }

  const handleToggle = (
    product: Product,
    field: 'is_available' | 'is_visible' | 'is_featured'
  ) => {
    toggleMutation.mutate({ id: product.id, field, value: !product[field] })
  }

  const colCount = showCategoryColumn ? 10 : 9

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: colCount }).map((_, i) => (
                <TableHead key={i}><Skeleton className="h-4 w-full" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: colCount }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Arama veya çoklu kategori görünümünde DnD devre dışı
  const isDndEnabled = !searchTerm && !showCategoryColumn

  // DndContext, @dnd-kit/core accessibility div'lerini render ettiği için
  // <table>/<tbody> dışında olması gerekiyor (invalid HTML önlemek için)
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={isDndEnabled ? handleDragEnd : undefined}
    >
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 px-2"></TableHead>
              <TableHead className="w-14"></TableHead>
              {showCategoryColumn ? (
                <TableHead className="min-w-[120px] max-w-[160px]">{t('category')}</TableHead>
              ) : null}
              <TableHead className="min-w-[200px]">{tCommon('name')}</TableHead>
              <TableHead className="w-[120px] text-center">{t('stock')}</TableHead>
              <TableHead className="w-[100px]">{tCommon('price')}</TableHead>
              <TableHead className="w-[100px] text-center">{t('isAvailable')}</TableHead>
              <TableHead className="w-[100px] text-center">{t('isVisible')}</TableHead>
              <TableHead className="w-[100px] text-center">{t('isFeatured')}</TableHead>
              <TableHead className="w-[80px] text-right">{tCommon('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredProducts?.length ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center text-muted-foreground py-8">
                  {tCommon('noData')}
                </TableCell>
              </TableRow>
            ) : isDndEnabled ? (
              <SortableContext
                items={filteredProducts.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredProducts.map((product) => (
                  <SortableRow
                    key={product.id}
                    product={product}
                    locale={locale}
                    onToggle={handleToggle}
                    isPending={toggleMutation.isPending}
                    activeCampaigns={activeCampaigns}
                    t={t}
                    tCommon={tCommon}
                    showCategoryColumn={showCategoryColumn}
                  />
                ))}
              </SortableContext>
            ) : (
              filteredProducts.map((product) => (
                <SortableRow
                  key={product.id}
                  product={product}
                  locale={locale}
                  onToggle={handleToggle}
                  isPending={toggleMutation.isPending}
                  activeCampaigns={activeCampaigns}
                  t={t}
                  tCommon={tCommon}
                  showCategoryColumn={showCategoryColumn}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DndContext>
  )
}
