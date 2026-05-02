import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaymentModalSimple } from '@/components/modules/orders/PaymentModalSimple'
import type { Order } from '@/types'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      payment: 'Ödeme',
      delivered: 'Teslim edildi',
      cash: 'Nakit',
      card: 'Kart',
      total: 'Toplam',
      paymentMethod: 'Ödeme yöntemi',
      cancel: 'İptal',
      confirm: 'Onayla',
    }
    return map[key] ?? key
  },
}))

vi.mock('@/app/[locale]/admin/orders/actions', () => ({
  addPayment: vi.fn(() => Promise.resolve({ success: true })),
}))
vi.mock('@/app/[locale]/admin/platform-orders/actions', () => ({
  deliverPlatformOrder: vi.fn(() => Promise.resolve({ success: true })),
}))
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    table_id: null,
    type: 'platform',
    customer_name: 'Test Customer',
    customer_phone: null,
    platform: 'getir',
    status: 'active',
    payment_status: 'pending',
    subtotal: 100,
    discount_amount: 0,
    discount_type: null,
    total_amount: 100,
    notes: null,
    completed_at: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  } as Order
}

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('PaymentModalSimple', () => {
  it('open=false ise hiçbir şey render etmez', () => {
    renderWithClient(
      <PaymentModalSimple
        open={false}
        order={makeOrder()}
        onClose={() => {}}
        onDelivered={() => {}}
      />,
    )
    expect(screen.queryByText('Ödeme')).not.toBeInTheDocument()
  })

  it('open=true ise modal açılır, payment başlığı görünür', () => {
    renderWithClient(
      <PaymentModalSimple
        open={true}
        order={makeOrder()}
        onClose={() => {}}
        onDelivered={() => {}}
      />,
    )
    expect(screen.getByText('Ödeme')).toBeInTheDocument()
  })

  it('Cash + Card metod seçenekleri görünür', () => {
    renderWithClient(
      <PaymentModalSimple
        open={true}
        order={makeOrder()}
        onClose={() => {}}
        onDelivered={() => {}}
      />,
    )
    expect(screen.getByText('Nakit')).toBeInTheDocument()
    expect(screen.getByText('Kart')).toBeInTheDocument()
  })

  it('Sipariş toplam tutarı modal\'da görünür (100)', () => {
    renderWithClient(
      <PaymentModalSimple
        open={true}
        order={makeOrder({ total_amount: 4250 })}
        onClose={() => {}}
        onDelivered={() => {}}
      />,
    )
    // Sıra dışı bir tutar kullanarak ID/tarih ile çakışma riskini elemine et
    expect(screen.getAllByText(/4250|4\.250|4,250/).length).toBeGreaterThan(0)
  })
})
