'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QrCartItem } from '@/types'

interface QrSessionState {
  // Persist edilir — tarayıcı oturumu boyunca sabit kalır
  sessionId: string
  // Persist edilir — aynı QR oturumunda sepeti korumak için saklanır
  tableToken: string | null
  sessionToken: string | null
  orderId: string | null
  hasHydrated: boolean
  items: QrCartItem[]
  // Actions
  initSession: (token: string, sessionToken: string, orderId: string) => void
  addItem: (item: Omit<QrCartItem, 'localId'>) => void
  removeItem: (localId: string) => void
  updateQuantity: (localId: string, quantity: number) => void
  clearCart: () => void
  markHydrated: () => void
  // Computed
  totalAmount: () => number
  itemCount: () => number
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function calculateItemTotal(item: QrCartItem): number {
  const extrasTotal = item.selected_extras.reduce(
    (sum, extra) => sum + extra.price,
    0
  )
  return (item.product.price + extrasTotal) * item.quantity
}

export const useQrSessionStore = create<QrSessionState>()(
  persist(
    (set, get) => ({
      sessionId: generateId(),
      tableToken: null,
      sessionToken: null,
      orderId: null,
      hasHydrated: false,
      items: [],

      initSession: (token, sessionToken, orderId) =>
        set((state) => {
          // Aynı oturum → hiç state değişikliği yapma
          if (
            state.tableToken === token &&
            state.sessionToken === sessionToken &&
            state.orderId === orderId
          ) return state

          // Farklı session geldi → sepeti temizle
          const shouldResetCart =
            (state.sessionToken !== null && state.sessionToken !== sessionToken) ||
            (state.tableToken !== null && state.tableToken !== token)

          return {
            tableToken: token,
            sessionToken,
            orderId,
            items: shouldResetCart ? [] : state.items,
          }
        }),

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, { ...item, localId: generateId() }],
        })),

      removeItem: (localId) =>
        set((state) => ({
          items: state.items.filter((i) => i.localId !== localId),
        })),

      updateQuantity: (localId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.localId !== localId)
              : state.items.map((i) =>
                  i.localId === localId ? { ...i, quantity } : i
                ),
        })),

      clearCart: () => set({ items: [] }),
      markHydrated: () => set({ hasHydrated: true }),

      totalAmount: () =>
        get().items.reduce((sum, item) => sum + calculateItemTotal(item), 0),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'bolena-qr-session',
      partialize: (state) => ({
        sessionId: state.sessionId,
        tableToken: state.tableToken,
        sessionToken: state.sessionToken,
        orderId: state.orderId,
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated()
      },
    }
  )
)
