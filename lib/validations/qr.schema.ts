import { z } from 'zod'

export const QrOrderItemSchema = z.object({
  productId: z.string().uuid(),
  productNameTr: z.string().min(1),
  productNameEn: z.string().min(1),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(20),
  notes: z.string().max(200),
  removedIngredients: z.array(
    z.object({
      id: z.string().uuid(),
      name_tr: z.string(),
      name_en: z.string(),
    })
  ),
  selectedExtras: z.array(
    z.object({
      group_id: z.string().uuid(),
      group_name_tr: z.string(),
      option_id: z.string().uuid(),
      option_name_tr: z.string(),
      option_name_en: z.string(),
      price: z.number().nonnegative(),
    })
  ),
  totalPrice: z.number().nonnegative(),
  trackStock: z.boolean(),
})

export const SubmitQrOrderSchema = z.object({
  qrToken: z.string().uuid(),
  orderId: z.string().uuid(),
  items: z.array(QrOrderItemSchema).min(1).max(50),
})

export type QrOrderItem = z.infer<typeof QrOrderItemSchema>
export type SubmitQrOrderInput = z.infer<typeof SubmitQrOrderSchema>
