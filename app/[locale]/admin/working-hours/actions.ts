'use server'

import { createClient } from '@/lib/supabase/server'
import {
  workingHoursSchema,
  workingHoursExceptionSchema,
} from '@/lib/validations/working-hours.schema'
import type {
  WorkingHoursInput,
  WorkingHoursExceptionInput,
} from '@/lib/validations/working-hours.schema'

// ─── Haftalık Saat Güncelle ───────────────────────────────────────────────────

export async function updateWorkingHours(id: string, input: WorkingHoursInput) {
  const parsed = workingHoursSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const d = parsed.data

  const { error } = await supabase
    .from('working_hours')
    .update({
      is_open: d.is_open,
      open_time: d.is_open ? (d.open_time ?? null) : null,
      close_time: d.is_open ? (d.close_time ?? null) : null,
      note_tr: d.note_tr ?? null,
      note_en: d.note_en ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}

// ─── İstisna Ekle ─────────────────────────────────────────────────────────────

export async function createWorkingHoursException(input: WorkingHoursExceptionInput) {
  const parsed = workingHoursExceptionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const d = parsed.data

  const { error } = await supabase.from('working_hours_exceptions').insert({
    date: d.date,
    is_open: d.is_open,
    open_time: d.is_open ? (d.open_time ?? null) : null,
    close_time: d.is_open ? (d.close_time ?? null) : null,
    description_tr: d.description_tr ?? null,
    description_en: d.description_en ?? null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Bu tarih için zaten bir istisna var.' }
    return { error: error.message }
  }
  return { success: true }
}

// ─── İstisna Güncelle ─────────────────────────────────────────────────────────

export async function updateWorkingHoursException(
  id: string,
  input: WorkingHoursExceptionInput
) {
  const parsed = workingHoursExceptionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const d = parsed.data

  const { error } = await supabase
    .from('working_hours_exceptions')
    .update({
      date: d.date,
      is_open: d.is_open,
      open_time: d.is_open ? (d.open_time ?? null) : null,
      close_time: d.is_open ? (d.close_time ?? null) : null,
      description_tr: d.description_tr ?? null,
      description_en: d.description_en ?? null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}

// ─── İstisna Sil ──────────────────────────────────────────────────────────────

export async function deleteWorkingHoursException(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('working_hours_exceptions')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
