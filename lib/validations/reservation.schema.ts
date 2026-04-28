import { z } from 'zod'
import type { Resolver } from 'react-hook-form'

export const reservationSchema = z.object({
  type: z.enum(['reservation', 'takeaway']),
  customer_name: z.string().min(2, 'Müşteri adı en az 2 karakter olmalıdır'),
  customer_phone: z.string().refine(
    (v) => {
      const digits = v.replace(/\s/g, '')
      if (digits.length === 0) return true
      return digits.length === 11 && /^0[0-9]{10}$/.test(digits)
    },
    '0XXX XXX XX XX formatında 11 haneli telefon girin'
  ),
  reservation_date: z.string().nullable().optional(),
  reservation_time: z.string().nullable().optional(),
  party_size: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined
      if (typeof val === 'number' && Number.isNaN(val)) return undefined
      return val
    },
    z.number().int().min(1, 'En az 1 kişi olmalıdır').optional()
  ),
  notes: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'reservation') {
    if (!data.reservation_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rezervasyon için tarih zorunludur',
        path: ['reservation_date'],
      })
    }
    if (!data.reservation_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rezervasyon için saat zorunludur',
        path: ['reservation_time'],
      })
    }
  }
})

export type ReservationInput = z.input<typeof reservationSchema>
export type ReservationData = z.output<typeof reservationSchema>
export { type Resolver }
