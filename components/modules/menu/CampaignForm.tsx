'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, ChevronDown, X } from 'lucide-react'

import { menuCampaignSchema, type MenuCampaignInput } from '@/lib/validations/menu-campaign.schema'
import { campaignKeys } from '@/lib/queries/menu-campaign.queries'
import { menuKeys, fetchCategories, fetchProducts } from '@/lib/queries/menu.queries'
import { createCampaign, updateCampaign } from '@/app/[locale]/admin/menu/campaign-actions'
import type { Category, MenuCampaign, Product } from '@/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface CampaignFormProps {
  locale: string
  defaultValues?: MenuCampaign
}

const DAY_LABELS: Record<number, string> = {
  0: 'Paz', 1: 'Pzt', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cmt',
}
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

type ScopeType = 'all' | 'categories' | 'products'

function getScopeType(campaign?: MenuCampaign): ScopeType {
  if (!campaign) return 'all'
  if (campaign.applies_to_category_ids?.length) return 'categories'
  if (campaign.applies_to_product_ids?.length) return 'products'
  return 'all'
}

function buildDefaultValues(campaign?: MenuCampaign): MenuCampaignInput {
  if (!campaign) {
    return {
      name_tr: '',
      name_en: '',
      description_tr: '',
      description_en: '',
      price_basis: 'effective',
      discount_percent: 10,
      max_discount_amount: null,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
      active_days: ALL_DAYS,
      start_time: null,
      end_time: null,
      is_active: true,
      priority: 0,
      notes: '',
      applies_to_category_ids: null,
      applies_to_product_ids: null,
    }
  }
  return {
    name_tr: campaign.name_tr,
    name_en: campaign.name_en,
    description_tr: campaign.description_tr ?? '',
    description_en: campaign.description_en ?? '',
    price_basis: campaign.price_basis,
    discount_percent: campaign.discount_percent,
    max_discount_amount: campaign.max_discount_amount,
    start_date: campaign.start_date,
    end_date: campaign.end_date,
    active_days: campaign.active_days,
    start_time: campaign.start_time,
    end_time: campaign.end_time,
    is_active: campaign.is_active,
    priority: campaign.priority,
    notes: campaign.notes ?? '',
    applies_to_category_ids: campaign.applies_to_category_ids,
    applies_to_product_ids: campaign.applies_to_product_ids,
  }
}

// ─── Çok Seçimli Dropdown ────────────────────────────────────────────────────

interface MultiSelectProps {
  items: { id: string; label: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
  placeholder: string
}

function MultiSelect({ items, selected, onChange, placeholder }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const tCommon = useTranslations('common')

  const toggleItem = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    )
  }

  const selectedItems = items.filter((i) => selected.includes(i.id))
  const filteredItems = items.filter((i) => 
    i.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearchTerm('') }}
        className="w-full flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[38px] hover:bg-muted/30 transition-colors"
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selectedItems.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium"
              >
                {item.label}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleItem(item.id) }}
                  className="hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md flex flex-col max-h-72">
          <div className="p-2 border-b">
            <Input
              placeholder={tCommon('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-xs"
              // eslint-disable-next-line jsx-a11y/no-autofocus -- dropdown açıldığında search'e direkt yazma UX'i
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Veriler yükleniyor veya bulunamadı...</p>
            ) : filteredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Eşleşen sonuç yok</p>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left"
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                    selected.includes(item.id) ? 'bg-primary border-primary' : 'border-input'
                  }`}>
                    {selected.includes(item.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  {item.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export function CampaignForm({ locale, defaultValues }: CampaignFormProps) {
  const t = useTranslations('menu')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const router = useRouter()

  const [scopeType, setScopeType] = useState<ScopeType>(getScopeType(defaultValues))

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MenuCampaignInput>({
    resolver: zodResolver(menuCampaignSchema) as Resolver<MenuCampaignInput>,
    defaultValues: buildDefaultValues(defaultValues),
  })

  // Kapsam değişince ilgili alanları sıfırla
  const handleScopeChange = (scope: ScopeType) => {
    setScopeType(scope)
    setValue('applies_to_category_ids', null)
    setValue('applies_to_product_ids', null)
  }

  const { data: categories = [] } = useQuery({
    queryKey: menuKeys.categories(),
    queryFn: fetchCategories,
  })

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: menuKeys.productsByCategory(null),
    queryFn: () => fetchProducts(null),
    enabled: scopeType === 'products',
  })

  const mutation = useMutation({
    mutationFn: (data: MenuCampaignInput) =>
      defaultValues ? updateCampaign(defaultValues.id, data) : createCampaign(data),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: campaignKeys.list() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.active() })
      router.push(`/${locale}/admin/menu`)
    },
  })

  const priceBasis = watch('price_basis')
  const activeDays = watch('active_days') ?? []
  const startTime = watch('start_time')
  const endTime = watch('end_time')
  const selectedCategoryIds = watch('applies_to_category_ids') ?? []
  const selectedProductIds = watch('applies_to_product_ids') ?? []

  const toggleDay = (day: number) => {
    const next = activeDays.includes(day)
      ? activeDays.filter((d) => d !== day)
      : [...activeDays, day].sort((a, b) => a - b)
    setValue('active_days', next, { shouldValidate: true })
  }

  const categoryItems = categories.map((c: Category) => ({ id: c.id, label: c.name_tr }))
  const productItems = products.map((p: Product) => ({ id: p.id, label: p.name_tr }))

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {defaultValues ? t('campaign.editCampaign') : t('campaign.addCampaign')}
        </h1>
        <Button variant="outline" onClick={() => router.push(`/${locale}/admin/menu`)}>
          {tCommon('back')}
        </Button>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* Left Column */}
          <div className="space-y-6">
            {/* ── Kimlik ── */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Temel Bilgiler
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t('campaign.nameTr')}</Label>
                    <Input {...register('name_tr')} placeholder="Her Salı İndirimi" />
                    {errors.name_tr && <p className="text-xs text-destructive">{errors.name_tr.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t('campaign.nameEn')}</Label>
                    <Input {...register('name_en')} placeholder="Tuesday Discount" />
                    {errors.name_en && <p className="text-xs text-destructive">{errors.name_en.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">{t('campaign.descriptionTr')}</Label>
                    <Textarea {...register('description_tr')} rows={2} className="resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">{t('campaign.descriptionEn')}</Label>
                    <Textarea {...register('description_en')} rows={2} className="resize-none" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── İndirim ── */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  İndirim
                </h3>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('campaign.priceBasis')}</Label>
                  <div className="flex rounded-lg border overflow-hidden">
                    {(['effective', 'base'] as const).map((basis) => (
                      <button
                        key={basis}
                        type="button"
                        onClick={() => setValue('price_basis', basis)}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
                          priceBasis === basis
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {basis === 'effective' ? t('campaign.priceBasisEffective') : t('campaign.priceBasisBase')}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground px-1">
                    {priceBasis === 'effective'
                      ? 'Ürünün aktif indirimli fiyatı varsa onun üzerinden hesaplanır'
                      : 'Ürünün liste fiyatı üzerinden hesaplanır (indirimler dikkate alınmaz)'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t('campaign.discountPercent')}</Label>
                    <div className="relative">
                      <Controller
                        control={control}
                        name="discount_percent"
                        render={({ field }) => (
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            step={0.5}
                            className="pr-8"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          />
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
                    </div>
                    {errors.discount_percent && <p className="text-xs text-destructive">{errors.discount_percent.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t('campaign.maxDiscountAmount')}</Label>
                    <div className="relative">
                      <Controller
                        control={control}
                        name="max_discount_amount"
                        render={({ field }) => (
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="Limitsiz"
                            className="pl-7"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                          />
                        )}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Zamanlama ── */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Zamanlama
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t('campaign.startDate')}</Label>
                    <Input type="date" {...register('start_date')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t('campaign.endDate')}</Label>
                    <Input type="date" {...register('end_date')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('campaign.activeDays')}</Label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline"
                      onClick={() => setValue('active_days', activeDays.length === 7 ? [] : ALL_DAYS)}
                    >
                      {activeDays.length === 7 ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {ALL_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`flex-1 py-1.5 rounded border text-xs font-medium transition-colors ${
                          activeDays.includes(day)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Saat Ayarları</Label>
                    <Switch
                      checked={!startTime && !endTime}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setValue('start_time', null)
                          setValue('end_time', null)
                        } else {
                          setValue('start_time', '09:00')
                          setValue('end_time', '22:00')
                        }
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="time"
                      disabled={!startTime && !endTime}
                      value={startTime ?? ''}
                      onChange={(e) => setValue('start_time', e.target.value || null)}
                    />
                    <Input
                      type="time"
                      disabled={!startTime && !endTime}
                      value={endTime ?? ''}
                      onChange={(e) => setValue('end_time', e.target.value || null)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* ── Kapsam ── */}
            <Card className="overflow-visible">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  {t('campaign.scope')}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'categories', 'products'] as const).map((scope) => {
                    const labels: Record<ScopeType, string> = {
                      all: t('campaign.scopeAll'),
                      categories: t('campaign.scopeCategories'),
                      products: t('campaign.scopeProducts'),
                    }
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => handleScopeChange(scope)}
                        className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          scopeType === scope
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:bg-muted/30'
                        }`}
                      >
                        {labels[scope]}
                      </button>
                    )
                  })}
                </div>
                {scopeType === 'categories' && (
                  <MultiSelect
                    items={categoryItems}
                    selected={selectedCategoryIds ?? []}
                    onChange={(ids) => setValue('applies_to_category_ids', ids.length ? ids : null)}
                    placeholder={t('campaign.selectCategories')}
                  />
                )}
                {scopeType === 'products' && (
                  <MultiSelect
                    items={productItems}
                    selected={selectedProductIds ?? []}
                    onChange={(ids) => setValue('applies_to_product_ids', ids.length ? ids : null)}
                    placeholder={t('campaign.selectProducts')}
                  />
                )}
              </CardContent>
            </Card>

            {/* ── Ayarlar ── */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  {t('settings')}
                </h3>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="is_active" className="cursor-pointer font-medium">
                    {t('campaign.isActive')}
                  </Label>
                  <Controller
                    control={control}
                    name="is_active"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} id="is_active" />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('campaign.priority')}</Label>
                  <Input type="number" {...register('priority', { valueAsNumber: true })} />
                  <p className="text-[11px] text-muted-foreground">{t('campaign.priorityHint')}</p>
                </div>
              </CardContent>
            </Card>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push(`/${locale}/admin/menu`)}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="min-w-[120px]">
                {mutation.isPending ? tCommon('loading') : tCommon('save')}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
