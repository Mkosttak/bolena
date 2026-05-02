import { z } from 'zod'

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID')

// types/index.ts'deki RemovedIngredient ve SelectedExtra ile uyumlu
const removedIngredientSchema = z.object({
  id: uuid,
  name_tr: z.string().min(1),
  name_en: z.string().min(1),
})

const selectedExtraSchema = z.object({
  group_id: uuid,
  group_name_tr: z.string().min(1),
  option_id: uuid,
  option_name_tr: z.string().min(1),
  option_name_en: z.string().min(1),
  price: z.number().nonnegative(),
})

export const addOrderItemSchema = z.object({
  orderId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID'),
  productId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID').nullable(),
  productNameTr: z.string().min(1).max(200),
  productNameEn: z.string().min(1).max(200),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(999),
  notes: z.string().max(500).nullable().optional(),
  removedIngredients: z.array(removedIngredientSchema),
  selectedExtras: z.array(selectedExtraSchema),
  trackStock: z.boolean(),
})
export type AddOrderItemInput = z.infer<typeof addOrderItemSchema>

// Update sırasında ürün adı/değişmez bilgileri yeniden gönderilmez — sadece değişebilenler.
export const updateOrderItemSchema = z.object({
  itemId: uuid,
  orderId: uuid,
  productId: uuid.nullable(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(999),
  notes: z.string().max(500).nullable().optional(),
  removedIngredients: z.array(removedIngredientSchema),
  selectedExtras: z.array(selectedExtraSchema),
  trackStock: z.boolean(),
})
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>

export const updateOrderItemQuantitySchema = z.object({
  itemId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID'),
  orderId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID'),
  newQuantity: z.number().int().min(0).max(999),
  productId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID').nullable(),
  trackStock: z.boolean().optional(),
})
export type UpdateOrderItemQuantityInput = z.infer<typeof updateOrderItemQuantitySchema>

export const applyOrderDiscountSchema = z.object({
  orderId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID'),
  discountAmount: z.number().nonnegative().max(100000),
  discountType: z.enum(['percent', 'amount']).nullable(),
})
export type ApplyOrderDiscountInput = z.infer<typeof applyOrderDiscountSchema>

export const addPaymentSchema = z.object({
  orderId: uuid,
  method: z.enum(['cash', 'card', 'transfer', 'other']),
  amount: z.number().positive().max(1000000),
  note: z.string().max(500).optional(),
  /** Client-side üretilen UUID. Aynı key ile gelen ikinci istek dedupe edilir (DB UNIQUE constraint). */
  idempotencyKey: uuid.optional(),
})
export type AddPaymentInput = z.infer<typeof addPaymentSchema>

export const removeOrderItemSchema = z.object({
  itemId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID'),
  orderId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID'),
})
export type RemoveOrderItemInput = z.infer<typeof removeOrderItemSchema>

export const closeOrderSchema = z.object({
  orderId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Geçersiz UUID'),
})
export type CloseOrderInput = z.infer<typeof closeOrderSchema>
