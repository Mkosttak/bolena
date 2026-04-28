import { createClient } from '@/lib/supabase/client'

export interface WorkingHoursRow {
  id: string
  day_of_week: number
  is_open: boolean
  open_time: string | null
  close_time: string | null
  note_tr: string | null
  note_en: string | null
  updated_at: string
}

export interface WorkingHoursExceptionRow {
  id: string
  date: string
  is_open: boolean
  open_time: string | null
  close_time: string | null
  description_tr: string | null
  description_en: string | null
  created_at: string
}

export const workingHoursKeys = {
  all: ['working-hours'] as const,
  weekly: () => [...workingHoursKeys.all, 'weekly'] as const,
  exceptions: () => [...workingHoursKeys.all, 'exceptions'] as const,
}

export async function fetchWeeklyHours(): Promise<WorkingHoursRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('working_hours')
    .select('*')
    .order('day_of_week', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as WorkingHoursRow[]
}

export async function fetchWorkingHoursExceptions(): Promise<WorkingHoursExceptionRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('working_hours_exceptions')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as WorkingHoursExceptionRow[]
}
