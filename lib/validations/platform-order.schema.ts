import { z } from 'zod'

export const platformOrderSchema = z.object({
  platform: z.enum(['yemeksepeti', 'getir', 'trendyol', 'courier'], {
    error: 'Platform seçimi zorunludur',
  }),
  customer_name: z.string().min(2, 'Müşteri adı en az 2 karakter olmalı'),
  customer_phone: z.string().refine(
    (v) => {
      const digits = v.replace(/\s/g, '')
      if (digits.length === 0) return true
      return digits.length === 11 && /^0[0-9]{10}$/.test(digits)
    },
    '0XXX XXX XX XX formatında 11 haneli telefon girin'
  ),
  customer_address: z
    .string()
    .refine(
      (v) => {
        const trimmed = v.trim()
        return trimmed.length === 0 || trimmed.length >= 5
      },
      'Adres en az 5 karakter olmalı'
    ),
  delivery_date: z.string().optional(),
  delivery_time: z.string().optional(),
  notes: z.string().optional(),
})

export type PlatformOrderInput = z.input<typeof platformOrderSchema>
export type PlatformOrderData = z.output<typeof platformOrderSchema>
