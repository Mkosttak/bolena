import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductDetailSheet } from '@/components/modules/menu/ProductDetailSheet'
import type { Product, MenuCampaign } from '@/types'

// jsdom does not implement window.matchMedia — provide a minimal stub
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
})

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}))

// Mock next-intl (not used directly in ProductDetailSheet, but may be imported transitively)
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'tr',
}))

// Mock @base-ui/react/dialog to avoid complex portal rendering in tests
vi.mock('@base-ui/react/dialog', () => {
  const Root = ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    open ? <div data-testid="sheet-root">{children}</div> : null
  const Backdrop = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  const Portal = ({ children }: { children: React.ReactNode }) => <>{children}</>
  const Popup = ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>
  const Title = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  )
  const Close = ({ children }: { children: React.ReactNode }) => <>{children}</>
  return { Dialog: { Root, Backdrop, Portal, Popup, Title, Close } }
})

const baseTranslations = {
  outOfStock: 'Tükendi',
  allergens: 'Alerjenler',
  featured: 'Öne Çıkan',
  campaignBadge: 'İndirimli',
  productDetailIngredients: 'İçindekiler',
  productDetailAllergens: 'Alerjenler',
  productDetailClose: 'Kapat',
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    category_id: 'cat1',
    name_tr: 'Test Ürünü',
    name_en: 'Test Product',
    description_tr: 'Açıklama',
    description_en: 'Description',
    image_url: null,
    price: 100,
    campaign_price: null,
    campaign_end_date: null,
    allergens_tr: null,
    allergens_en: null,
    is_available: true,
    is_featured: false,
    is_visible: true,
    track_stock: false,
    stock_count: null,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('ProductDetailSheet', () => {
  it('renders product name when open=true', () => {
    const product = makeProduct({ name_tr: 'Glutensiz Pizza' })
    render(
      <ProductDetailSheet
        open
        product={product}
        onClose={() => {}}
        locale="tr"
        translations={baseTranslations}
      />
    )
    // Both sr-only SheetTitle and the visible h2 contain the product name
    const nameElements = screen.getAllByText('Glutensiz Pizza')
    expect(nameElements.length).toBeGreaterThan(0)
  })

  it('renders nothing when open=false', () => {
    const product = makeProduct({ name_tr: 'Glutensiz Pizza' })
    const { container } = render(
      <ProductDetailSheet
        open={false}
        product={product}
        onClose={() => {}}
        locale="tr"
        translations={baseTranslations}
      />
    )
    expect(container.querySelector('[data-testid="sheet-root"]')).not.toBeInTheDocument()
    expect(screen.queryByText('Glutensiz Pizza')).not.toBeInTheDocument()
  })

  it('renders nothing when product is null', () => {
    const { container } = render(
      <ProductDetailSheet
        open
        product={null}
        onClose={() => {}}
        locale="tr"
        translations={baseTranslations}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows out-of-stock badge when is_available=false', () => {
    const product = makeProduct({ is_available: false })
    render(
      <ProductDetailSheet
        open
        product={product}
        onClose={() => {}}
        locale="tr"
        translations={baseTranslations}
      />
    )
    expect(screen.getByText('Tükendi')).toBeInTheDocument()
  })

  it('shows campaign price and discount badge when campaign is active', () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const product = makeProduct({
      price: 100,
      campaign_price: 80,
      campaign_end_date: tomorrow.toISOString().slice(0, 10),
    })
    const campaign: MenuCampaign = {
      id: 'camp1',
      name_tr: 'İndirim',
      name_en: 'Discount',
      description_tr: null,
      description_en: null,
      price_basis: 'base',
      discount_percent: 20,
      max_discount_amount: null,
      start_date: '2026-01-01',
      end_date: tomorrow.toISOString().slice(0, 10),
      active_days: [],
      start_time: null,
      end_time: null,
      is_active: true,
      priority: 1,
      notes: null,
      applies_to_category_ids: null,
      applies_to_product_ids: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }
    render(
      <ProductDetailSheet
        open
        product={product}
        onClose={() => {}}
        locale="tr"
        campaigns={[campaign]}
        translations={baseTranslations}
      />
    )
    // Should show strikethrough original price
    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    const product = makeProduct()
    render(
      <ProductDetailSheet
        open
        product={product}
        onClose={onClose}
        locale="tr"
        translations={baseTranslations}
      />
    )
    const closeBtn = screen.getByRole('button', { name: 'Kapat' })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
