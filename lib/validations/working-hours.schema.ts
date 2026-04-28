import { z } from 'zod'

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/

export const workingHoursSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    is_open: z.boolean(),
    open_time: z.string().regex(TIME_REGEX, 'Geçerli bir saat girin (HH:mm)').nullable().optional(),
    close_time: z
      .string()
      .regex(TIME_REGEX, 'Geçerli bir saat girin (HH:mm)')
      .nullable()
      .optional(),
    note_tr: z.string().nullable().optional(),
    note_en: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.is_open) {
        return !!data.open_time && !!data.close_time
      }
      return true
    },
    {
      message: 'Açık günler için açılış ve kapanış saati zorunludur',
      path: ['open_time'],
    }
  )
  .refine(
    (data) => {
      if (data.is_open && data.open_time && data.close_time) {
        return data.open_time < data.close_time
      }
      return true
    },
    {
      message: 'Kapanış saati açılış saatinden sonra olmalıdır',
      path: ['close_time'],
    }
  )

export const workingHoursExceptionSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih girin (YYYY-MM-DD)'),
    is_open: z.boolean(),
    open_time: z.string().regex(TIME_REGEX, 'Geçerli bir saat girin (HH:mm)').nullable().optional(),
    close_time: z
      .string()
      .regex(TIME_REGEX, 'Geçerli bir saat girin (HH:mm)')
      .nullable()
      .optional(),
    description_tr: z.string().nullable().optional(),
    description_en: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.is_open) {
        return !!data.open_time && !!data.close_time
      }
      return true
    },
    {
      message: 'Açık istisnalar için açılış ve kapanış saati zorunludur',
      path: ['open_time'],
    }
  )
  .refine(
    (data) => {
      if (data.is_open && data.open_time && data.close_time) {
        return data.open_time < data.close_time
      }
      return true
    },
    {
      message: 'Kapanış saati açılış saatinden sonra olmalıdır',
      path: ['close_time'],
    }
  )

export type WorkingHoursInput = z.input<typeof workingHoursSchema>
export type WorkingHoursData = z.output<typeof workingHoursSchema>
export type WorkingHoursExceptionInput = z.input<typeof workingHoursExceptionSchema>
export type WorkingHoursExceptionData = z.output<typeof workingHoursExceptionSchema>
