'use server'

import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/auth/guards'

// =====================================================
// KDS (Mutfak/Bar Ekranı) — Server Actions
// =====================================================

/**
 * Bir KDS grubundaki tüm order_items'ı hazır olarak işaretler.
 * Bu işlem kasiyerin ödeme akışını değiştirmez — sadece mutfak görünümünden kaldırır.
 */
export async function markKdsGroupReady(
  itemIds: string[]
): Promise<{ success: true } | { error: string }> {
  const auth = await requireModuleAccess("kds")
  if ("error" in auth) return { error: auth.error }

  if (itemIds.length === 0) return { success: true }

  const supabase = await createClient()
  const { error } = await supabase
    .from('order_items')
    .update({ kds_status: 'ready' })
    .in('id', itemIds)

  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Yanlışlıkla hazır işaretlenen grubu geri alır (10 saniyelik undo penceresi için).
 */
export async function undoKdsGroupReady(
  itemIds: string[]
): Promise<{ success: true } | { error: string }> {
  const auth = await requireModuleAccess("kds")
  if ("error" in auth) return { error: auth.error }

  if (itemIds.length === 0) return { success: true }

  const supabase = await createClient()
  const { error } = await supabase
    .from('order_items')
    .update({ kds_status: 'pending' })
    .in('id', itemIds)

  if (error) return { error: error.message }
  return { success: true }
}
