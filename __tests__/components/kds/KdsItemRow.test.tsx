import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KdsItemRow } from '@/components/modules/kds/KdsItemRow'
import type { KdsOrderItem } from '@/lib/utils/kds.utils'

vi.mock('next-intl', () => ({
  useLocale: () => 'tr',
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      markReady: 'Hazirlandi',
      'columns.tables': 'Masalar',
      complimentary: 'Ikram',
    }
    return map[key] ?? key
  },
}))

function makeItem(overrides: Partial<KdsOrderItem> = {}): KdsOrderItem {
  return {
    id: 'item-1',
    order_id: 'order-1',
    product_name_tr: 'Hamburger',
    product_name_en: 'Hamburger',
    quantity: 1,
    notes: null,
    removed_ingredients: [],
    selected_extras: [],
    is_complimentary: false,
    kds_status: 'pending',
    created_at: new Date().toISOString(),
    order_type: 'table',
    order_table_id: 'table-1',
    order_customer_name: null,
    order_platform: null,
    order_notes: null,
    order_created_at: new Date().toISOString(),
    is_qr_order: false,
    ...overrides,
  }
}

describe('KdsItemRow', () => {
  it('urunu ve adedi render eder', () => {
    render(<KdsItemRow item={makeItem({ product_name_tr: 'Pizza', quantity: 2 })} />)
    expect(screen.getByText((text) => text.includes('2') && text.length <= 3)).toBeInTheDocument()
    expect(screen.getByText('Pizza')).toBeInTheDocument()
  })

  it('cikarilan malzemeleri render eder', () => {
    const item = makeItem({
      removed_ingredients: [{ id: 'ing-1', name_tr: 'Domates', name_en: 'Tomato' }],
    })
    render(<KdsItemRow item={item} />)
    const el = screen.getByText('Domates').closest('li')
    expect(el).toBeInTheDocument()
    expect(el?.className).toContain('text-destructive')
  })

  it('secilen ekstralari render eder', () => {
    const item = makeItem({
      selected_extras: [
        {
          group_id: 'g-1',
          group_name_tr: 'Sos',
          option_id: 'opt-1',
          option_name_tr: 'Ekstra Sos',
          option_name_en: 'Extra Sauce',
          price: 5,
        },
      ],
    })
    render(<KdsItemRow item={item} />)
    const el = screen.getByText(/Ekstra Sos/).closest('li')
    expect(el).toBeInTheDocument()
    expect(el?.className).toContain('emerald')
  })

  it('notu amber kutuda render eder', () => {
    const item = makeItem({ notes: 'Az pismis olsun' })
    render(<KdsItemRow item={item} />)
    const el = screen.getByText('Az pismis olsun')
    expect(el).toBeInTheDocument()
    // Not kutusu amber border içinde
    const container = el.closest('div[class*="amber"]')
    expect(container).toBeInTheDocument()
  })

  it('ikram badge render eder', () => {
    render(<KdsItemRow item={makeItem({ is_complimentary: true })} />)
    expect(screen.getByText('Ikram')).toBeInTheDocument()
  })
})
