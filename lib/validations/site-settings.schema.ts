import { z } from 'zod'

const phoneSchema = z
  .string()
  .refine((v) => {
    const digits = v.replace(/\s/g, '')
    if (digits.length === 0) return true
    return digits.length === 11 && /^0[0-9]{10}$/.test(digits)
  }, '0XXX XXX XX XX formatında 11 haneli telefon girin')
  .optional()

export const siteSettingsSchema = z.object({
  brand_name: z.string().min(1).max(100),
  contact_phone: phoneSchema,
  contact_email: z.string().email().optional(),
  contact_address: z.string().max(500).optional(),
  google_maps_url: z.string().url().max(2000).optional(),
  instagram_url: z.string().url().max(2000).optional(),
  whatsapp_phone: phoneSchema,
  meta_title_tr: z.string().max(60).optional(),
  meta_title_en: z.string().max(60).optional(),
  meta_description_tr: z.string().max(160).optional(),
  meta_description_en: z.string().max(160).optional(),
})
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>
