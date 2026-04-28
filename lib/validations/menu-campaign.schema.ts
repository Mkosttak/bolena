import { z } from 'zod'

export const menuCampaignSchema = z
  .object({
    name_tr: z.string().min(1, 'Türkçe isim zorunludur'),
    name_en: z.string().min(1, 'İngilizce isim zorunludur'),
    description_tr: z.string().nullish(),
    description_en: z.string().nullish(),
    price_basis: z.enum(['base', 'effective']).default('effective'),
    discount_percent: z
      .number()
      .positive('İndirim yüzdesi 0\'dan büyük olmalı')
      .max(100, 'İndirim yüzdesi en fazla 100 olabilir'),
    max_discount_amount: z.number().positive('Tavan tutar 0\'dan büyük olmalı').nullish(),
    start_date: z.string().min(1, 'Başlangıç tarihi zorunludur'),
    end_date: z.string().min(1, 'Bitiş tarihi zorunludur'),
    active_days: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'En az bir gün seçilmelidir'),
    start_time: z.string().nullable().default(null),  // 'HH:MM' | null
    end_time: z.string().nullable().default(null),    // 'HH:MM' | null
    is_active: z.boolean().default(true),
    priority: z.number().int().min(0).default(0),
    notes: z.string().nullish(),
    /** null = tüm menü, dolu UUID dizisi = yalnızca bu kategoriler */
    applies_to_category_ids: z.array(z.string().uuid()).nullable().default(null),
    /** null = tüm ürünler/kategoriler, dolu UUID dizisi = yalnızca bu ürünler */
    applies_to_product_ids: z.array(z.string().uuid()).nullable().default(null),
  })
  .refine(
    (d) => {
      if (!d.start_date || !d.end_date) return true
      return new Date(d.end_date) >= new Date(d.start_date)
    },
    { message: 'Bitiş tarihi başlangıç tarihinden önce olamaz', path: ['end_date'] }
  )
  .refine(
    (d) => {
      if (!d.start_time || !d.end_time) return true
      return d.end_time > d.start_time
    },
    { message: 'Bitiş saati başlangıç saatinden sonra olmalı', path: ['end_time'] }
  )

export type MenuCampaignInput = z.input<typeof menuCampaignSchema>
export type MenuCampaignOutput = z.infer<typeof menuCampaignSchema>
