import { format, parseISO } from 'date-fns'

export interface WorkingHours {
  day_of_week: number
  is_open: boolean
  open_time: string | null
  close_time: string | null
}

export interface WorkingHoursException {
  date: string
  is_open: boolean
  open_time: string | null
  close_time: string | null
}

/**
 * Returns working hours for a given date, considering exceptions first.
 */
export function getWorkingHoursForDate(
  date: Date,
  weeklyHours: WorkingHours[],
  exceptions: WorkingHoursException[]
): WorkingHours | WorkingHoursException | null {
  const dateStr = format(date, 'yyyy-MM-dd')

  const exception = exceptions.find((e) => e.date === dateStr)
  if (exception) return exception

  const dayOfWeek = date.getDay()
  return weeklyHours.find((h) => h.day_of_week === dayOfWeek) ?? null
}

/**
 * Returns true if the cafe is open at the given date+time.
 * Uses a "HH:mm" string for current time comparison.
 */
export function isOpen(
  date: Date,
  currentTimeStr: string,
  weeklyHours: WorkingHours[],
  exceptions: WorkingHoursException[]
): boolean {
  const hours = getWorkingHoursForDate(date, weeklyHours, exceptions)
  if (!hours || !hours.is_open) return false
  if (!hours.open_time || !hours.close_time) return false

  return currentTimeStr >= hours.open_time && currentTimeStr <= hours.close_time
}

/**
 * Formats an ISO date string to locale-friendly display format.
 */
export function formatDate(isoString: string, formatStr = 'dd.MM.yyyy'): string {
  try {
    return format(parseISO(isoString), formatStr)
  } catch {
    return isoString
  }
}

/**
 * Formats an ISO datetime string to display format.
 */
export function formatDateTime(isoString: string, formatStr = 'dd.MM.yyyy HH:mm'): string {
  try {
    return format(parseISO(isoString), formatStr)
  } catch {
    return isoString
  }
}
