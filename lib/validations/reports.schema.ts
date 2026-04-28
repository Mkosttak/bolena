import { z } from 'zod'

export const dateRangeKeySchema = z.enum(['today', 'week', 'month', 'custom'])

export const dateRangeSchema = z
  .object({
    key: dateRangeKeySchema,
    start: z.string().date('Geçerli bir tarih girin (YYYY-MM-DD)'),
    end: z.string().date('Geçerli bir tarih girin (YYYY-MM-DD)'),
  })
  .refine((d) => d.start <= d.end, {
    message: 'Başlangıç tarihi bitiş tarihinden sonra olamaz',
    path: ['start'],
  })

export type DateRangeInput = z.infer<typeof dateRangeSchema>
