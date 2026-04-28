import { z } from 'zod'

export const categorySchema = z.object({
  name_tr: z.string().min(1, 'Türkçe isim zorunludur'),
  name_en: z.string().min(1, 'İngilizce isim zorunludur'),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
})

export const ingredientSchema = z.object({
  id: z.string().optional(),
  name_tr: z.string().min(1, 'Türkçe isim zorunludur'),
  name_en: z.string().min(1, 'İngilizce isim zorunludur'),
  is_removable: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
})

export const productSchema = z
  .object({
    category_id: z.string().min(1, 'Kategori seçimi zorunludur'),
    name_tr: z.string().min(1, 'Türkçe isim zorunludur'),
    name_en: z.string().min(1, 'İngilizce isim zorunludur'),
    description_tr: z.string().nullish(),
    description_en: z.string().nullish(),
    image_url: z.string().nullish(),
    price: z
      .number()
      .positive('Fiyat 0\'dan büyük olmalı'),
    campaign_price: z.number().positive().nullish(),
    campaign_end_date: z.string().nullish(),
    allergens_tr: z.string().nullish(),
    allergens_en: z.string().nullish(),
    is_available: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    is_visible: z.boolean().default(true),
    track_stock: z.boolean().default(false),
    stock_count: z.number().int().min(0).nullish(),
    ingredients: z.array(ingredientSchema).default([]),
  })
  .refine(
    (data) => (data.campaign_price == null) === (data.campaign_end_date == null),
    {
      message: 'Kampanya fiyatı ve bitiş tarihi birlikte girilmelidir',
      path: ['campaign_end_date'],
    }
  )
  .refine(
    (data) => {
      if (data.campaign_price != null && data.campaign_price >= data.price) return false
      return true
    },
    {
      message: 'Kampanya fiyatı normal fiyattan küçük olmalı',
      path: ['campaign_price'],
    }
  )
  .refine(
    (data) => {
      if (!data.campaign_end_date) return true
      const date = new Date(data.campaign_end_date)
      if (isNaN(date.getTime())) return false
      // Bitiş tarihi bugün veya gelecekte olmalı
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date >= today
    },
    {
      message: 'Kampanya bitiş tarihi bugün veya sonrası olmalıdır',
      path: ['campaign_end_date'],
    }
  )

// z.input<> = form values (optional fields with defaults)
// z.infer<> = parsed output (required fields after defaults applied)
export type CategoryInput = z.input<typeof categorySchema>
export type ProductInput = z.input<typeof productSchema>
export type IngredientInput = z.input<typeof ingredientSchema>
export type CategoryOutput = z.infer<typeof categorySchema>
export type ProductOutput = z.infer<typeof productSchema>
