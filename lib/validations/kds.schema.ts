import { z } from 'zod'

export const markKdsItemReadySchema = z.object({
  itemId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID'),
})
export type MarkKdsItemReadyInput = z.infer<typeof markKdsItemReadySchema>

export const markKdsItemsReadyBatchSchema = z.object({
  itemIds: z.array(z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID')).min(1).max(100),
})
export type MarkKdsItemsReadyBatchInput = z.infer<typeof markKdsItemsReadyBatchSchema>

export const kdsFilterSchema = z.object({
  status: z.enum(['pending', 'ready', 'all']).default('pending'),
  orderType: z.enum(['table', 'reservation', 'takeaway', 'platform', 'all']).default('all'),
  platform: z.enum(['yemeksepeti', 'getir', 'trendyol', 'courier', 'all']).default('all'),
})
export type KdsFilter = z.infer<typeof kdsFilterSchema>
