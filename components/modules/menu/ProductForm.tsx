'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  Camera,
  ListPlus,
  Package,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react'
import Image from 'next/image'

import { productSchema, type ProductInput } from '@/lib/validations/menu.schema'
import { menuKeys, fetchCategories } from '@/lib/queries/menu.queries'
import { createProduct, updateProduct, deleteProduct } from '@/app/[locale]/admin/menu/actions'
import { createExtraGroup, createExtraOption } from '@/app/[locale]/admin/menu/actions'
import { campaignKeys, fetchActiveCampaigns } from '@/lib/queries/menu-campaign.queries'
import { calculateFinalPrice } from '@/lib/utils/order.utils'
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductIngredient } from '@/types'
import { ProductExtrasDraft, type DraftExtraGroup } from '@/components/modules/menu/ProductExtrasDraft'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductExtrasPanel } from '@/components/modules/menu/ProductExtrasPanel'

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon
  title: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </div>
      <CardTitle className="pt-1 text-base font-semibold leading-tight">{title}</CardTitle>
    </div>
  )
}

// ─── Client-side görüntü sıkıştırma ─────────────────────────────────────────

async function compressImage(file: File, maxSizeBytes: number): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      // Maksimum 1200px genişlik
      if (width > 1200) {
        height = Math.round((height * 1200) / width)
        width = 1200
      }

      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      // İlk deneme kalitesi 0.85
      let quality = 0.85
      const tryExport = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return }
            if (blob.size <= maxSizeBytes || quality <= 0.3) {
              resolve(new File([blob], file.name, { type: 'image/webp' }))
            } else {
              quality -= 0.1
              tryExport()
            }
          },
          'image/webp',
          quality
        )
      }
      tryExport()
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

// ─── Storage yardımcısı ───────────────────────────────────────────────────────

function extractStoragePath(publicUrl: string): string | null {
  const match = publicUrl.match(/\/bolena-cafe\/(.+)$/)
  return match ? match[1] : null
}

// ─── Bileşen ─────────────────────────────────────────────────────────────────

interface ProductFormProps {
  locale: string
  product?: Product & { product_ingredients?: ProductIngredient[] }
}

export function ProductForm({ locale, product }: ProductFormProps) {
  const t = useTranslations('menu')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const queryClient = useQueryClient()

  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingImagePath = useRef<string | null>(null)
  const [draftExtras, setDraftExtras] = useState<DraftExtraGroup[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUnsavedLeaveOpen, setIsUnsavedLeaveOpen] = useState(false)
  const handleDraftChange = useCallback((groups: DraftExtraGroup[]) => setDraftExtras(groups), [])
 
  const { data: activeCampaigns = [] } = useQuery({
    queryKey: campaignKeys.active(),
    queryFn: fetchActiveCampaigns,
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as Resolver<ProductInput>,
    defaultValues: {
      category_id: product?.category_id ?? '',
      name_tr: product?.name_tr ?? '',
      name_en: product?.name_en ?? '',
      description_tr: product?.description_tr ?? '',
      description_en: product?.description_en ?? '',
      image_url: product?.image_url ?? '',
      price: product?.price ?? 0,
      campaign_price: product?.campaign_price ?? undefined,
      campaign_end_date: product?.campaign_end_date ?? '',
      allergens_tr: product?.allergens_tr ?? '',
      allergens_en: product?.allergens_en ?? '',
      is_available: product?.is_available ?? true,
      is_featured: product?.is_featured ?? false,
      is_visible: product?.is_visible ?? true,
      track_stock: product?.track_stock ?? false,
      stock_count: product?.stock_count ?? undefined,
      ingredients: product?.product_ingredients?.map((ing: ProductIngredient) => ({
        id: ing.id,
        name_tr: ing.name_tr,
        name_en: ing.name_en,
        is_removable: ing.is_removable,
        sort_order: ing.sort_order,
      })) ?? [],
    },
  })

  const { fields: ingredients, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  })

  const { data: categories } = useQuery({
    queryKey: menuKeys.categories(),
    queryFn: fetchCategories,
  })

  const saveMutation = useMutation({
    mutationFn: async (data: ProductInput) => {
      if (product) return updateProduct(product.id, data)

      const result = await createProduct(data)
      if (result.error || !('productId' in result)) return result

      const productId = result.productId!
      for (const group of draftExtras) {
        const groupResult = await createExtraGroup(productId, {
          name_tr: group.name_tr,
          name_en: group.name_en,
          is_required: group.is_required,
        })
        if (groupResult.error || !('groupId' in groupResult)) continue
        const groupId = groupResult.groupId!
        for (const option of group.options) {
          await createExtraOption(groupId, {
            name_tr: option.name_tr,
            name_en: option.name_en,
            price: option.price,
            max_selections: option.max_selections,
            is_active: option.is_active,
            sort_order: option.sort_order,
          })
        }
      }
      return result
    },
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(tCommon('success'))
      const productId = 'productId' in result ? result.productId : undefined
      if (!product && productId) {
        router.push(`/${locale}/admin/menu/${productId}/edit`)
      } else {
        router.push(`/${locale}/admin/menu`)
      }
    },
    onError: () => toast.error(tCommon('error')),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(product!.id),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
      router.push(`/${locale}/admin/menu`)
    },
    onError: () => toast.error(tCommon('error')),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 2 * 1024 * 1024

    setIsUploading(true)
    try {
      // Client-side sıkıştırma
      const compressed = file.size > MAX_SIZE
        ? await compressImage(file, MAX_SIZE)
        : file

      if (compressed.size > MAX_SIZE) {
        toast.error(t('photoTooLarge'))
        return
      }

      const supabase = createClient()

      // Önceki bu oturumda yüklenen geçici dosyayı sil
      if (pendingImagePath.current) {
        await supabase.storage.from('bolena-cafe').remove([pendingImagePath.current])
      }

      // K-08: products/{productId veya uuid}/{ts}.webp
      const prefix = product?.id ?? crypto.randomUUID()
      const path = `products/${prefix}/${Date.now()}.webp`

      const { error: uploadError } = await supabase.storage
        .from('bolena-cafe')
        .upload(path, compressed, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('bolena-cafe')
        .getPublicUrl(path)

      pendingImagePath.current = path
      setValue('image_url', urlData.publicUrl, { shouldDirty: true })
      setImagePreview(urlData.publicUrl)
    } catch {
      toast.error(t('photoUploadError'))
    } finally {
      setIsUploading(false)
      // input sıfırla (aynı dosyayı tekrar seçmeye izin ver)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = async () => {
    const supabase = createClient()
    const currentUrl = imagePreview
    if (currentUrl) {
      const path = extractStoragePath(currentUrl)
      if (path) {
        await supabase.storage.from('bolena-cafe').remove([path])
      }
    }
    pendingImagePath.current = null
    setValue('image_url', '', { shouldDirty: true })
    setImagePreview(null)
  }

  const trackStock = watch('track_stock')

  const hasUnsavedDraftExtras = !product && draftExtras.length > 0
  const shouldBlockLeave = isDirty || hasUnsavedDraftExtras
  const menuPath = `/${locale}/admin/menu`

  useEffect(() => {
    if (!shouldBlockLeave) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [shouldBlockLeave])

  const requestLeave = () => {
    if (!shouldBlockLeave) {
      router.push(menuPath as Route)
      return
    }
    setIsUnsavedLeaveOpen(true)
  }

  const confirmLeave = () => {
    setIsUnsavedLeaveOpen(false)
    router.push(menuPath as Route)
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {product ? t('editProduct') : t('addProduct')}
        </h1>
        <Button type="button" variant="outline" onClick={requestLeave}>
          {tCommon('back')}
        </Button>
      </div>

      <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))}>
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
          <div className="space-y-6">
        {/* Temel Bilgiler */}
        <Card className="shadow-sm ring-border/40 transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/15 pb-4">
            <SectionHeader icon={Package} title={t('basicInfo')} />
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1.5">
              <Label htmlFor="product-category">{t('category')}</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="product-category" className="w-full">
                      <SelectValue>
                        {field.value
                          ? (categories?.find(c => c.id === field.value)?.name_tr ?? <span className="text-muted-foreground">{t('category')}</span>)
                          : <span className="text-muted-foreground">{t('category')}</span>
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_tr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && (
                <p className="text-xs text-destructive">{errors.category_id.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="product-name-tr">{t('nameTr')}</Label>
                <Input id="product-name-tr" {...register('name_tr')} />
                {errors.name_tr && (
                  <p className="text-xs text-destructive">{errors.name_tr.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-name-en">{t('nameEn')}</Label>
                <Input id="product-name-en" {...register('name_en')} />
                {errors.name_en && (
                  <p className="text-xs text-destructive">{errors.name_en.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="product-desc-tr">{t('descriptionTr')}</Label>
                <Textarea id="product-desc-tr" rows={3} className="min-h-[5.5rem] resize-y" {...register('description_tr')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-desc-en">{t('descriptionEn')}</Label>
                <Textarea id="product-desc-en" rows={3} className="min-h-[5.5rem] resize-y" {...register('description_en')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fotoğraf */}
        <Card className="shadow-sm ring-border/40 transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/15 pb-4">
            <SectionHeader icon={Camera} title={t('photo')} />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <button
                type="button"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                aria-label={imagePreview ? t('changePhoto') : t('uploadPhoto')}
                className="group relative mx-auto flex h-36 w-36 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-muted/30 text-center transition-[border-color,box-shadow] hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none sm:mx-0"
              >
                {imagePreview ? (
                  <>
                    <Image
                      src={imagePreview}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="144px"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent py-2 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {t('changePhoto')}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
                    <span className="px-2 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                      {t('uploadPhoto')}
                    </span>
                  </>
                )}
              </button>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      tCommon('loading')
                    ) : imagePreview ? (
                      t('changePhoto')
                    ) : (
                      t('uploadPhoto')
                    )}
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleRemoveImage}
                      disabled={isUploading}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {tCommon('delete')}
                    </Button>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{t('photoFormatHint')}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/webp,image/png"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* İçindekiler */}
        <Card className="shadow-sm ring-border/40 transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/15 pb-4">
            <SectionHeader icon={ListPlus} title={t('ingredients')} />
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {ingredients.map((field, index) => (
              <div
                key={field.id}
                className="rounded-xl border border-border/50 bg-muted/10 p-3 sm:p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground" htmlFor={`ing-tr-${field.id}`}>
                      {t('nameTr')}
                    </Label>
                    <Input
                      id={`ing-tr-${field.id}`}
                      placeholder={t('nameTr')}
                      {...register(`ingredients.${index}.name_tr`)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground" htmlFor={`ing-en-${field.id}`}>
                      {t('nameEn')}
                    </Label>
                    <Input
                      id={`ing-en-${field.id}`}
                      placeholder={t('nameEn')}
                      {...register(`ingredients.${index}.name_en`)}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
                  <div className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name={`ingredients.${index}.is_removable`}
                      render={({ field: f }) => (
                        <Checkbox
                          id={`removable-${index}`}
                          checked={f.value}
                          onCheckedChange={(checked) => f.onChange(!!checked)}
                        />
                      )}
                    />
                    <label htmlFor={`removable-${index}`} className="text-sm text-muted-foreground">
                      {t('isRemovable')}
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {tCommon('delete')}
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                append({
                  name_tr: '',
                  name_en: '',
                  is_removable: false,
                  sort_order: ingredients.length,
                })
              }
            >
              <Plus className="h-4 w-4" />
              {t('addIngredient')}
            </Button>
          </CardContent>
        </Card>
          </div>

          <div className="space-y-6">
        {/* Fiyatlandırma */}
        <Card className="shadow-sm ring-border/40 transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/15 pb-4">
            <SectionHeader icon={Banknote} title={t('pricing')} />
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
                {product && (() => {
                  const currentPrice = calculateFinalPrice(product, activeCampaigns)
                  const activeGlobalCampaign = currentPrice < product.price && activeCampaigns.length > 0
                    ? activeCampaigns.find(c => {
                        const prodMatch = c.applies_to_product_ids?.includes(product.id)
                        const catMatch = c.applies_to_category_ids?.includes(product.category_id)
                        const allMatch = !c.applies_to_product_ids?.length && !c.applies_to_category_ids?.length
                        return prodMatch || catMatch || allMatch
                      })
                    : null
                  
                  if (!activeGlobalCampaign) return null
                  
                  return (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-primary uppercase tracking-tight">Aktif Kampanya</span>
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                          {activeGlobalCampaign.name_tr}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Bu ürün şu an <span className="font-bold text-foreground">₺{currentPrice.toFixed(2)}</span> fiyatıyla satılmaktadır.
                      </p>
                    </div>
                  )
                })()}

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="product-price">{t('salePrice')} (₺)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min={0}
                  {...register('price', { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-xs text-destructive">{errors.price.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-campaign-price">{t('campaignPrice')} (₺)</Label>
                <Input
                  id="product-campaign-price"
                  type="number"
                  step="0.01"
                  min={0}
                  {...register('campaign_price', {
                    setValueAs: (v) => (v === '' || v == null ? null : parseFloat(v)),
                  })}
                />
                {errors.campaign_price && (
                  <p className="text-xs text-destructive">{errors.campaign_price.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-campaign-end">{t('campaignEndDate')}</Label>
                <Input
                  id="product-campaign-end"
                  type="date"
                  {...register('campaign_end_date', {
                    setValueAs: (v) => (v === '' ? null : v),
                  })}
                />
                {errors.campaign_end_date && (
                  <p className="text-xs text-destructive">{errors.campaign_end_date.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerjenler */}
        <Card className="shadow-sm ring-border/40 transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/15 pb-4">
            <SectionHeader icon={ShieldAlert} title={t('allergens')} />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="allergens-tr">{t('allergensTr')}</Label>
                <Input id="allergens-tr" {...register('allergens_tr')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="allergens-en">{t('allergensEn')}</Label>
                <Input id="allergens-en" {...register('allergens_en')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ayarlar */}
        <Card className="shadow-sm ring-border/40 transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/15 pb-4">
            <SectionHeader icon={SlidersHorizontal} title={t('settings')} />
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background px-3 py-2.5">
                <Label htmlFor="sw-available" className="cursor-pointer font-normal">
                  {t('isAvailable')}
                </Label>
                <Controller
                  control={control}
                  name="is_available"
                  render={({ field }) => (
                    <Switch id="sw-available" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background px-3 py-2.5">
                <Label htmlFor="sw-visible" className="cursor-pointer font-normal">
                  {t('isVisible')}
                </Label>
                <Controller
                  control={control}
                  name="is_visible"
                  render={({ field }) => (
                    <Switch id="sw-visible" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background px-3 py-2.5">
                <Label htmlFor="sw-featured" className="cursor-pointer font-normal">
                  {t('isFeatured')}
                </Label>
                <Controller
                  control={control}
                  name="is_featured"
                  render={({ field }) => (
                    <Switch id="sw-featured" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background px-3 py-2.5">
                <Label htmlFor="sw-stock" className="cursor-pointer font-normal">
                  {t('trackStock')}
                </Label>
                <Controller
                  control={control}
                  name="track_stock"
                  render={({ field }) => (
                    <Switch id="sw-stock" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            {trackStock && (
              <>
                <Separator className="bg-border/60" />
                <div className="space-y-1.5">
                  <Label htmlFor="product-stock-count">{t('stockCount')}</Label>
                  <Input
                    id="product-stock-count"
                    type="number"
                    min={0}
                    className="w-full max-w-[10rem]"
                    {...register('stock_count', {
                      setValueAs: (v) => (v === '' || v == null ? null : parseInt(v)),
                    })}
                  />
                  {errors.stock_count && (
                    <p className="text-xs text-destructive">{errors.stock_count.message}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
          </div>
        </div>

        {/* Extras: full width below columns */}
        <div className="mt-6 space-y-6">
          {product
            ? <ProductExtrasPanel productId={product.id} />
            : <ProductExtrasDraft value={draftExtras} onChange={handleDraftChange} />
          }
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:p-5">
          <div>
            {product && (
              <Button
                type="button"
                variant="destructive"
                className="w-full gap-2 sm:w-auto"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                {t('deleteProduct')}
              </Button>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={requestLeave}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={saveMutation.isPending}>
              {tCommon('save')}
            </Button>
          </div>
        </div>
      </form>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteProductTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteProductConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? tCommon('loading') : t('confirmDeleteYes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUnsavedLeaveOpen} onOpenChange={setIsUnsavedLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('unsavedChangesTitle')}</DialogTitle>
            <DialogDescription>{t('unsavedChangesDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsUnsavedLeaveOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmLeave}>
              {t('discardChangesLeave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
