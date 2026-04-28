'use server'

import { createClient } from '@/lib/supabase/server'
import { menuCampaignSchema } from '@/lib/validations/menu-campaign.schema'
import type { MenuCampaignInput } from '@/lib/validations/menu-campaign.schema'

export async function createCampaign(input: MenuCampaignInput) {
  const parsed = menuCampaignSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('menu_campaigns').insert({
    name_tr: parsed.data.name_tr,
    name_en: parsed.data.name_en,
    description_tr: parsed.data.description_tr ?? null,
    description_en: parsed.data.description_en ?? null,
    price_basis: parsed.data.price_basis,
    discount_percent: parsed.data.discount_percent,
    max_discount_amount: parsed.data.max_discount_amount ?? null,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    active_days: parsed.data.active_days,
    start_time: parsed.data.start_time ?? null,
    end_time: parsed.data.end_time ?? null,
    is_active: parsed.data.is_active,
    priority: parsed.data.priority,
    notes: parsed.data.notes ?? null,
    applies_to_category_ids:
      parsed.data.applies_to_category_ids?.length ? parsed.data.applies_to_category_ids : null,
    applies_to_product_ids:
      parsed.data.applies_to_product_ids?.length ? parsed.data.applies_to_product_ids : null,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateCampaign(id: string, input: MenuCampaignInput) {
  const parsed = menuCampaignSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('menu_campaigns')
    .update({
      name_tr: parsed.data.name_tr,
      name_en: parsed.data.name_en,
      description_tr: parsed.data.description_tr ?? null,
      description_en: parsed.data.description_en ?? null,
      price_basis: parsed.data.price_basis,
      discount_percent: parsed.data.discount_percent,
      max_discount_amount: parsed.data.max_discount_amount ?? null,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      active_days: parsed.data.active_days,
      start_time: parsed.data.start_time ?? null,
      end_time: parsed.data.end_time ?? null,
      is_active: parsed.data.is_active,
      priority: parsed.data.priority,
      notes: parsed.data.notes ?? null,
      applies_to_category_ids:
        parsed.data.applies_to_category_ids?.length ? parsed.data.applies_to_category_ids : null,
      applies_to_product_ids:
        parsed.data.applies_to_product_ids?.length ? parsed.data.applies_to_product_ids : null,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleCampaignActive(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('menu_campaigns')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('menu_campaigns').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
