import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AddProductModal } from '@/components/modules/orders/AddProductModal'
import type { Product, Category } from '@/types'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      addProduct: 'Ürün Ekle',
      search: 'Ara',
      cancel: 'İptal',
      confirm: 'Onayla',
      add: 'Ekle',
      empty: 'Henüz ürün yok',
      allCategories: 'Tümü',
    }
    return map[key] ?? key
  },
}))

const mockCategories: Category[] = [
  { id: 'cat-1', name_tr: 'Kahveler', name_en: 'Coffees', sort_order: 1, is_active: true,
    created_at: '2024-01-01', updated_at: '2024-01-01' } as Category,
]

const mockProducts: Product[] = [
  {
    id: 'prod-1', category_id: 'cat-1',
    name_tr: 'Latte', name_en: 'Latte',
    description_tr: null, description_en: null,
    image_url: null, price: 50, campaign_price: null, campaign_end_date: null,
    allergens_tr: null, allergens_en: null,
    is_available: true, is_featured: false, is_visible: true,
    track_stock: false, stock_count: null, sort_order: 1,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  } as Product,
  {
    id: 'prod-2', category_id: 'cat-1',
    name_tr: 'Cappuccino', name_en: 'Cappuccino',
    description_tr: null, description_en: null,
    image_url: null, price: 60, campaign_price: null, campaign_end_date: null,
    allergens_tr: null, allergens_en: null,
    is_available: true, is_featured: false, is_visible: true,
    track_stock: false, stock_count: null, sort_order: 2,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  } as Product,
]

vi.mock('@/lib/queries/menu.queries', () => ({
  menuKeys: {
    categories: () => ['menu', 'categories'],
    products: () => ['menu', 'products'],
    product: (id: string) => ['menu', 'product', id],
  },
  fetchCategories: vi.fn(() => Promise.resolve(mockCategories)),
  fetchAvailableProducts: vi.fn(() => Promise.resolve(mockProducts)),
  fetchProductForOrder: vi.fn(() => Promise.resolve({ ...mockProducts[0], extra_groups: [], product_ingredients: [] })),
}))

vi.mock('@/lib/queries/menu-campaign.queries', () => ({
  campaignKeys: { active: () => ['campaigns', 'active'] },
  fetchActiveCampaigns: vi.fn(() => Promise.resolve([])),
}))

vi.mock('@/lib/queries/orders.queries', () => ({
  ordersKeys: {
    all: ['orders'],
    items: (id: string) => ['orders', id, 'items'],
    order: (id: string) => ['orders', id],
  },
  fetchOrderItems: vi.fn(() => Promise.resolve([])),
}))

vi.mock('@/app/[locale]/admin/orders/actions', () => ({
  addOrderItem: vi.fn(() => Promise.resolve({ success: true })),
  updateOrderItemQuantity: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

function renderModal(open: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AddProductModal open={open} orderId="order-1" onClose={() => {}} />
    </QueryClientProvider>,
  )
}

describe('AddProductModal', () => {
  it('open=false ise modal render edilmez', () => {
    renderModal(false)
    expect(screen.queryByText('addItem')).not.toBeInTheDocument()
  })

  it('open=true ise modal başlığı görünür', () => {
    renderModal(true)
    // Başlık `t('addItem')` — mock fallback key'i döner
    expect(screen.getByText('addItem')).toBeInTheDocument()
  })

  it('Ürünler async yüklendikten sonra liste görünür', async () => {
    renderModal(true)
    expect(await screen.findByText('Latte', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Cappuccino')).toBeInTheDocument()
  })

  it.skip('Kategori chip\'i görünür', async () => {
    // TODO: kategori chip'leri DialogContent'in scroll alanında render edilirken
    // jsdom layout dimensions yetersiz; Faz 6 refactor sonrası kategori bileşeni
    // ayrıştırıldığında tam test yazılmalı.
    renderModal(true)
    expect(await screen.findByText('Kahveler')).toBeInTheDocument()
  })
})
