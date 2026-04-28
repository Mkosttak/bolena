import { describe, it, expect, beforeEach } from 'vitest'
import { useQrSessionStore } from '@/lib/stores/qr-session.store'
import type { Product } from '@/types'

const mockProduct: Product = {
  id: 'prod-1',
  category_id: 'cat-1',
  name_tr: 'Test Ürün',
  name_en: 'Test Product',
  description_tr: null,
  description_en: null,
  image_url: null,
  price: 50,
  campaign_price: null,
  campaign_end_date: null,
  allergens_tr: null,
  allergens_en: null,
  is_available: true,
  is_featured: false,
  is_visible: true,
  track_stock: false,
  stock_count: null,
  sort_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('useQrSessionStore', () => {
  beforeEach(() => {
    useQrSessionStore.getState().clearCart()
    useQrSessionStore.setState({ tableToken: null, orderId: null })
  })

  describe('initSession', () => {
    it('token, sessionToken ve orderId set edilir', () => {
      useQrSessionStore.getState().initSession('token-abc', 'session-xyz', 'order-123')
      const { tableToken, sessionToken, orderId } = useQrSessionStore.getState()
      expect(tableToken).toBe('token-abc')
      expect(sessionToken).toBe('session-xyz')
      expect(orderId).toBe('order-123')
    })
  })

  describe('addItem', () => {
    it('yeni kalem localId ile eklenir', () => {
      useQrSessionStore.getState().addItem({
        product: mockProduct,
        quantity: 2,
        notes: '',
        removed_ingredients: [],
        selected_extras: [],
      })
      const { items } = useQrSessionStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0].product.id).toBe('prod-1')
      expect(items[0].quantity).toBe(2)
      expect(items[0].localId).toBeTruthy()
    })

    it('birden fazla kalem eklenebilir', () => {
      useQrSessionStore.getState().addItem({
        product: mockProduct,
        quantity: 1,
        notes: '',
        removed_ingredients: [],
        selected_extras: [],
      })
      useQrSessionStore.getState().addItem({
        product: { ...mockProduct, id: 'prod-2' },
        quantity: 3,
        notes: 'az tuzlu',
        removed_ingredients: [],
        selected_extras: [],
      })
      expect(useQrSessionStore.getState().items).toHaveLength(2)
    })
  })

  describe('removeItem', () => {
    it('localId ile kalem kaldırılır', () => {
      useQrSessionStore.getState().addItem({
        product: mockProduct,
        quantity: 1,
        notes: '',
        removed_ingredients: [],
        selected_extras: [],
      })
      const localId = useQrSessionStore.getState().items[0].localId
      useQrSessionStore.getState().removeItem(localId)
      expect(useQrSessionStore.getState().items).toHaveLength(0)
    })
  })

  describe('updateQuantity', () => {
    it('miktar güncellenir', () => {
      useQrSessionStore.getState().addItem({
        product: mockProduct,
        quantity: 1,
        notes: '',
        removed_ingredients: [],
        selected_extras: [],
      })
      const localId = useQrSessionStore.getState().items[0].localId
      useQrSessionStore.getState().updateQuantity(localId, 5)
      expect(useQrSessionStore.getState().items[0].quantity).toBe(5)
    })

    it('miktar 0 veya altı olunca kalem silinir', () => {
      useQrSessionStore.getState().addItem({
        product: mockProduct,
        quantity: 1,
        notes: '',
        removed_ingredients: [],
        selected_extras: [],
      })
      const localId = useQrSessionStore.getState().items[0].localId
      useQrSessionStore.getState().updateQuantity(localId, 0)
      expect(useQrSessionStore.getState().items).toHaveLength(0)
    })
  })

  describe('clearCart', () => {
    it('tüm kalemler temizlenir', () => {
      useQrSessionStore.getState().addItem({
        product: mockProduct,
        quantity: 2,
        notes: '',
        removed_ingredients: [],
        selected_extras: [],
      })
      useQrSessionStore.getState().clearCart()
      expect(useQrSessionStore.getState().items).toHaveLength(0)
    })
  })

  describe('computed values', () => {
    it('itemCount doğru hesaplanır', () => {
      useQrSessionStore.getState().addItem({
        product: mockProduct,
        quantity: 3,
        notes: '',
        removed_ingredients: [],
        selected_extras: [],
      })
      useQrSessionStore.getState().addItem({
        product: { ...mockProduct, id: 'prod-2' },
        quantity: 2,
        notes: '',
        removed_ingredients: [],
        selected_extras: [],
      })
      expect(useQrSessionStore.getState().itemCount()).toBe(5)
    })

    it('totalAmount doğru hesaplanır', () => {
      useQrSessionStore.getState().addItem({
        product: mockProduct, // price: 50
        quantity: 2,
        notes: '',
        removed_ingredients: [],
        selected_extras: [
          {
            group_id: 'g1',
            group_name_tr: 'Sos',
            option_id: 'o1',
            option_name_tr: 'Acı Sos',
            option_name_en: 'Hot Sauce',
            price: 5,
          },
        ],
      })
      // (50 + 5) * 2 = 110
      expect(useQrSessionStore.getState().totalAmount()).toBe(110)
    })

    it('boş sepette totalAmount 0', () => {
      expect(useQrSessionStore.getState().totalAmount()).toBe(0)
    })

    it('sessionId persist edilir ve boş değildir', () => {
      const { sessionId } = useQrSessionStore.getState()
      expect(sessionId).toBeTruthy()
      expect(typeof sessionId).toBe('string')
    })
  })
})
