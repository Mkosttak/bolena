import { z } from 'zod'

export const tableCategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı zorunludur'),
  sort_order: z.number().int().min(0).default(0),
})

export const tableSchema = z.object({
  name: z.string().min(1, 'Masa adı zorunludur'),
  category_id: z.string().nullish(),
  is_active: z.boolean().default(true),
})

export type TableCategoryInput = z.input<typeof tableCategorySchema>
export type TableInput = z.input<typeof tableSchema>
export type TableCategoryOutput = z.infer<typeof tableCategorySchema>
export type TableOutput = z.infer<typeof tableSchema>
