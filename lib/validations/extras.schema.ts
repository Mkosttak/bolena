import { z } from 'zod'

export const extraGroupSchema = z.object({
  name_tr: z.string().min(1, 'Türkçe isim zorunludur'),
  name_en: z.string().min(1, 'İngilizce isim zorunludur'),
  is_required: z.boolean().default(false),
  max_bir_secim: z.boolean().default(false),
})

export const extraOptionSchema = z.object({
  name_tr: z.string().min(1, 'Türkçe isim zorunludur'),
  name_en: z.string().min(1, 'İngilizce isim zorunludur'),
  price: z.number().min(0, 'Fiyat 0 veya daha büyük olmalı').default(0),
  max_selections: z
    .number()
    .int()
    .min(1, 'En az 1 seçim gerekli')
    .default(1),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
})

export type ExtraGroupInput = z.input<typeof extraGroupSchema>
export type ExtraGroupOutput = z.infer<typeof extraGroupSchema>
export type ExtraOptionInput = z.input<typeof extraOptionSchema>
export type ExtraOptionOutput = z.infer<typeof extraOptionSchema>
