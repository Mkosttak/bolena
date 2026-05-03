'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, Settings2, ChevronLeft, ChevronRight, Search } from 'lucide-react'

import { menuKeys, fetchCategories, fetchProducts } from '@/lib/queries/menu.queries'
import { CategoryModal } from './CategoryModal'
import { ProductTable } from './ProductTable'
import { CampaignCalendar } from './CampaignCalendar'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface MenuClientProps {
  locale: string
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportToCsv(products: Product[], categories: { id: string; name_tr: string }[]) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name_tr]))

  const rows: string[][] = [
    [
      'ID',
      'Kategori',
      'Türkçe Ad',
      'İngilizce Ad',
      'Türkçe Açıklama',
      'İngilizce Açıklama',
      'Fiyat (₺)',
      'Kampanya Fiyatı (₺)',
      'Kampanya Bitiş',
      'Satışta',
      'Menüde',
      'Öne Çıkar',
      'Stok Takibi',
      'Stok Adedi',
      'Alerjenler (TR)',
      'Alerjenler (EN)',
      'İçindekiler',
      'Ekstra Grupları',
      'Görsel URL',
      'Sıralama',
      'Oluşturulma',
      'Güncellenme',
    ],
    ...products.map((p) => [
      p.id,
      categoryMap.get(p.category_id) ?? '',
      p.name_tr,
      p.name_en,
      p.description_tr ?? '',
      p.description_en ?? '',
      p.price.toFixed(2),
      p.campaign_price != null ? p.campaign_price.toFixed(2) : '',
      p.campaign_end_date ?? '',
      p.is_available ? 'Evet' : 'Hayır',
      p.is_visible ? 'Evet' : 'Hayır',
      p.is_featured ? 'Evet' : 'Hayır',
      p.track_stock ? 'Evet' : 'Hayır',
      p.stock_count != null ? String(p.stock_count) : '',
      p.allergens_tr ?? '',
      p.allergens_en ?? '',
      p.product_ingredients?.map(ing => `${ing.name_tr}${ing.is_removable ? ' (Çıkarılabilir)' : ''}`).join(', ') ?? '',
      p.extra_groups?.map(g => `${g.name_tr}${g.is_required ? ' (Zorunlu)' : ''}`).join(', ') ?? '',
      p.image_url ?? '',
      String(p.sort_order),
      p.created_at,
      p.updated_at,
    ]),
  ]

  const csv =
    '\uFEFF' + // BOM — Excel'de Türkçe karakter desteği
    rows
      .map((row) =>
        row
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(';')
      )
      .join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bolena-menu-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}


// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export function MenuClient({ locale }: MenuClientProps) {
  const t = useTranslations('menu')
  const tCommon = useTranslations('common')
  const router = useRouter()

  const [activeView, setActiveView] = useState<'products' | 'campaigns'>('products')
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const searchActive = searchTerm.trim().length > 0

  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = tabsScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = tabsScrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [updateScrollState])

  // Sol/sağ ok tıklaması — pointer-events-none yerine her zaman tıklanabilir.
  // Smooth scroll bittikten sonra state'i manuel güncelle (scroll event bazen
  // smooth animasyon sırasında throttle olabiliyor → kenarlarda state stuck kalıyordu).
  const handleScrollNav = useCallback((direction: 'left' | 'right') => {
    const el = tabsScrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' })
    // Smooth scroll ~300-400ms sürer; sonrasında force refresh
    setTimeout(updateScrollState, 350)
    // Anlık feedback için de bir kez çalıştır (smooth başlangıcında)
    requestAnimationFrame(updateScrollState)
  }, [updateScrollState])

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: menuKeys.categories(),
    queryFn: fetchCategories,
  })

  // Kategoriler yüklenince sağ ok görünürlüğünü güncelle
  useEffect(() => {
    updateScrollState()
  }, [categories, updateScrollState])

  // CSV için tüm ürünleri çekiyoruz (sadece export tetiklenince kullanılır)
  const { refetch: refetchAllProducts } = useQuery({
    queryKey: menuKeys.productsByCategory(null),
    queryFn: () => fetchProducts(null),
    enabled: false,
  })

  const handleExportCsv = async () => {
    const { data: products } = await refetchAllProducts()
    if (!products?.length) { toast.error(tCommon('noData')); return }
    exportToCsv(products, categories ?? [])
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        {activeView === 'products' && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-1.5" />
              {t('exportCsv')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCategoryModalOpen(true)} className="flex-1 sm:flex-none">
              {t('editCategories')}
            </Button>
            <Button size="sm" onClick={() => router.push(`/${locale}/admin/menu/new`)} className="w-full sm:w-auto">
              {t('addProduct')}
            </Button>
          </div>
        )}
      </div>

      {/* Üst düzey sekme: Ürünler / Kampanya Takvimi */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'products' | 'campaigns')}>
        <TabsList>
          <TabsTrigger value="products">{t('title')}</TabsTrigger>
          <TabsTrigger value="campaigns">{t('campaign.title')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeView === 'campaigns' ? (
        <CampaignCalendar locale={locale} />
      ) : (
        <>
          {categoriesLoading ? (
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="menu-product-search" className="text-sm font-medium">
                  {tCommon('search')}
                </Label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="menu-product-search"
                    placeholder={t('searchPlaceholder')}
                    className="h-11 w-full pl-11 text-base shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label={t('searchPlaceholder')}
                  />
                </div>
                {searchActive ? (
                  <p className="text-xs text-muted-foreground">{t('searchAllCategoriesHint')}</p>
                ) : null}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('categoriesSection')}
                </p>
                <div className="relative flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Sola kaydır"
                    aria-disabled={!canScrollLeft}
                    onClick={() => handleScrollNav('left')}
                    className={cn(
                      'shrink-0 flex h-9 w-9 items-center justify-center rounded-full border bg-background shadow-sm transition-all cursor-pointer',
                      canScrollLeft
                        ? 'border-border text-foreground opacity-100 hover:scale-105 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-md'
                        : 'border-border/40 text-muted-foreground/40 opacity-50 hover:border-border hover:text-muted-foreground hover:opacity-70'
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                  </button>

                  <div className="relative min-w-0 flex-1">
                    {/* Sol fade — scroll edilebiliyorsa belirir */}
                    <div
                      className={cn(
                        'pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent transition-opacity',
                        canScrollLeft ? 'opacity-100' : 'opacity-0'
                      )}
                      aria-hidden
                    />
                    <div ref={tabsScrollRef} className="overflow-x-auto overflow-y-hidden scrollbar-none">
                      <Tabs
                        value={selectedCategoryId ?? 'all'}
                        onValueChange={(v) => setSelectedCategoryId(v === 'all' ? null : v)}
                      >
                        <TabsList className="h-auto w-max justify-start bg-muted/50 p-1">
                          <TabsTrigger value="all" className="px-4 py-2.5">
                            {tCommon('all')}
                          </TabsTrigger>
                          {categories?.map((cat) => (
                            <TabsTrigger key={cat.id} value={cat.id} className="whitespace-nowrap px-4 py-2.5">
                              {cat.name_tr}
                              {!cat.is_active && (
                                <span className="ml-1 text-[10px] text-muted-foreground">(pasif)</span>
                              )}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>
                    {/* Sağ fade — scroll edilebiliyorsa belirir */}
                    <div
                      className={cn(
                        'pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent transition-opacity',
                        canScrollRight ? 'opacity-100' : 'opacity-0'
                      )}
                      aria-hidden
                    />
                  </div>

                  <button
                    type="button"
                    aria-label="Sağa kaydır"
                    aria-disabled={!canScrollRight}
                    onClick={() => handleScrollNav('right')}
                    className={cn(
                      'shrink-0 flex h-9 w-9 items-center justify-center rounded-full border bg-background shadow-sm transition-all cursor-pointer',
                      canScrollRight
                        ? 'border-border text-foreground opacity-100 hover:scale-105 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-md'
                        : 'border-border/40 text-muted-foreground/40 opacity-50 hover:border-border hover:text-muted-foreground hover:opacity-70'
                    )}
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {searchActive ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold px-1">{t('searchResultsTitle')}</h2>
              <ProductTable
                locale={locale}
                categoryId={null}
                searchTerm={searchTerm}
                showCategoryColumn
              />
            </div>
          ) : (
            <div className="space-y-8">
              {selectedCategoryId ? (
                <ProductTable
                  locale={locale}
                  categoryId={selectedCategoryId}
                  searchTerm={searchTerm}
                />
              ) : (
                categories?.map((cat) => (
                  <div key={cat.id} className="space-y-3">
                    <h2 className={`text-lg font-semibold px-1 ${!cat.is_active ? 'text-muted-foreground' : ''}`}>
                      {cat.name_tr}
                      {!cat.is_active && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({tCommon('passive')})
                        </span>
                      )}
                    </h2>
                    <ProductTable
                      locale={locale}
                      categoryId={cat.id}
                      searchTerm={searchTerm}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          <CategoryModal
            open={categoryModalOpen}
            onClose={() => setCategoryModalOpen(false)}
          />
        </>
      )}
    </div>
  )
}
