import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KdsCard } from '@/components/modules/kds/KdsCard'
import type { KdsGroup } from '@/lib/utils/kds.utils'

vi.mock('next-intl', () => ({
  useLocale: () => 'tr',
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      markReady: 'Hazirlandi',
      headerTable: 'Masa',
      waitingTime: `${params?.minutes ?? 0} dk`,
      waitingTimeLessThan: '< 1 dk',
      'platform.getir': 'Getir',
    }
    return map[key] ?? key
  },
}))

function makeGroup(overrides: Partial<KdsGroup> = {}): KdsGroup {
  return {
    id: 'order-1__2024-01-01T10:00:00.000Z',
    orderId: 'order-1',
    orderType: 'table',
    tableId: 'table-3',
    tableName: 'Masa 3',
    customerName: null,
    platform: null,
    orderNotes: null,
    itemIds: ['item-1'],
    items: [
      {
        id: 'item-1',
        order_id: 'order-1',
        product_name_tr: 'Hamburger',
        product_name_en: 'Hamburger',
        quantity: 2,
        notes: null,
        removed_ingredients: [],
        selected_extras: [],
        is_complimentary: false,
        kds_status: 'pending',
        created_at: new Date().toISOString(),
        order_type: 'table',
        order_table_id: 'table-3',
        order_customer_name: null,
        order_platform: null,
        order_notes: null,
        order_created_at: new Date().toISOString(),
        is_qr_order: false,
      },
    ],
    windowStart: new Date().toISOString(),
    elapsedMinutes: 5,
    urgency: 'normal',
    isQrOrder: false,
    ...overrides,
  }
}

describe('KdsCard', () => {
  it('masa adini render eder', () => {
    render(<KdsCard group={makeGroup()} onMarkReady={vi.fn()} onCardClick={vi.fn()} />)
    expect(screen.getByText('Masa 3')).toBeInTheDocument()
  })

  it('bekleme suresini render eder', () => {
    render(<KdsCard group={makeGroup({ elapsedMinutes: 7 })} onMarkReady={vi.fn()} onCardClick={vi.fn()} />)
    expect(screen.getByText('7 dk')).toBeInTheDocument()
  })

  it('<1 dk gosterir', () => {
    render(<KdsCard group={makeGroup({ elapsedMinutes: 0 })} onMarkReady={vi.fn()} onCardClick={vi.fn()} />)
    expect(screen.getByText('< 1 dk')).toBeInTheDocument()
  })

  it('hazirlandi butonunu render eder', () => {
    render(<KdsCard group={makeGroup()} onMarkReady={vi.fn()} onCardClick={vi.fn()} />)
    const buttons = screen.getAllByRole('button', { name: /hazirlandi/i })
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('hazirlandi tiklaninca onMarkReady cagrilir', () => {
    const onMarkReady = vi.fn()
    const group = makeGroup({ itemIds: ['item-1', 'item-2'] })
    render(<KdsCard group={group} onMarkReady={onMarkReady} onCardClick={vi.fn()} />)
    // Footer'daki ana "Hazırlandı" butonu (son buton)
    const buttons = screen.getAllByRole('button', { name: /hazirlandi/i })
    fireEvent.click(buttons[buttons.length - 1])
    expect(onMarkReady).toHaveBeenCalled()
  })

  it('kart tiklaninca onCardClick cagrilir', () => {
    const onCardClick = vi.fn()
    const group = makeGroup()
    render(<KdsCard group={group} onMarkReady={vi.fn()} onCardClick={onCardClick} />)
    fireEvent.click(screen.getByText('Masa 3'))
    expect(onCardClick).toHaveBeenCalledWith(group)
  })

  it('critical olunca kirmizi classlar vardir', () => {
    const { container } = render(
      <KdsCard group={makeGroup({ urgency: 'critical' })} onMarkReady={vi.fn()} onCardClick={vi.fn()} />
    )
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('border-red-200')
    expect(card.className).toContain('bg-red-50/20')
  })

  it('warning olunca turuncu class vardir', () => {
    const { container } = render(
      <KdsCard group={makeGroup({ urgency: 'warning' })} onMarkReady={vi.fn()} onCardClick={vi.fn()} />
    )
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('border-orange-200')
  })

  it('platform siparisinde musteri adini gosterir', () => {
    const group = makeGroup({
      orderType: 'platform',
      tableId: null,
      tableName: null,
      platform: 'getir',
      customerName: 'Ahmet Y.',
    })
    render(<KdsCard group={group} onMarkReady={vi.fn()} onCardClick={vi.fn()} />)
    expect(screen.getByText(/Ahmet Y\./)).toBeInTheDocument()
  })
})
