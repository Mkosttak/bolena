'use client'

import { create } from 'zustand'
import type { CartItem, Product, RemovedIngredient, SelectedExtra } from '@/types'

interface CartState {
  items: CartItem[]
  // Actions
  addItem: (item: CartItem) => void
  updateItem: (index: number, item: Partial<CartItem>) => void
  removeItem: (index: number) => void
  clearCart: () => void
  // Computed
  totalAmount: () => number
  itemCount: () => number
}

function calculateItemTotal(item: CartItem): number {
  const basePrice = item.product.price
  const extrasTotal = item.selected_extras.reduce(
    (sum, extra) => sum + extra.price,
    0
  )
  return (basePrice + extrasTotal) * item.quantity
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),

  updateItem: (index, updates) =>
    set((state) => ({
      items: state.items.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      ),
    })),

  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),

  clearCart: () => set({ items: [] }),

  totalAmount: () => {
    const { items } = get()
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  },

  itemCount: () => {
    const { items } = get()
    return items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))
