import { describe, it, expect } from 'vitest'
import {
  getWorkingHoursForDate,
  isOpen,
  formatDate,
  formatDateTime,
  type WorkingHours,
  type WorkingHoursException,
} from '@/lib/utils/date.utils'

const WEEKLY_HOURS: WorkingHours[] = [
  { day_of_week: 0, is_open: true, open_time: '09:00', close_time: '22:00' },
  { day_of_week: 1, is_open: true, open_time: '09:00', close_time: '22:00' },
  { day_of_week: 2, is_open: true, open_time: '09:00', close_time: '22:00' },
  { day_of_week: 3, is_open: false, open_time: null, close_time: null },
  { day_of_week: 4, is_open: true, open_time: '10:00', close_time: '20:00' },
  { day_of_week: 5, is_open: true, open_time: '09:00', close_time: '23:00' },
  { day_of_week: 6, is_open: true, open_time: '10:00', close_time: '23:00' },
]

const EXCEPTIONS: WorkingHoursException[] = [
  { date: '2026-01-01', is_open: false, open_time: null, close_time: null },
  { date: '2026-12-25', is_open: true, open_time: '12:00', close_time: '18:00' },
]

describe('getWorkingHoursForDate', () => {
  it('returns weekly hours for a normal day', () => {
    const monday = new Date('2026-03-30') // Monday
    const result = getWorkingHoursForDate(monday, WEEKLY_HOURS, EXCEPTIONS)
    expect(result).toMatchObject({ day_of_week: 1, is_open: true, open_time: '09:00' })
  })

  it('returns exception over weekly hours when date matches', () => {
    const newYear = new Date('2026-01-01')
    const result = getWorkingHoursForDate(newYear, WEEKLY_HOURS, EXCEPTIONS)
    expect(result).toMatchObject({ date: '2026-01-01', is_open: false })
  })

  it('returns exception with custom hours on a holiday', () => {
    const christmas = new Date('2026-12-25')
    const result = getWorkingHoursForDate(christmas, WEEKLY_HOURS, EXCEPTIONS)
    expect(result).toMatchObject({ date: '2026-12-25', is_open: true, open_time: '12:00' })
  })

  it('returns null if no weekly hours found for day', () => {
    const result = getWorkingHoursForDate(new Date('2026-03-30'), [], EXCEPTIONS)
    expect(result).toBeNull()
  })
})

describe('isOpen', () => {
  it('returns true during open hours', () => {
    const monday = new Date('2026-03-30')
    expect(isOpen(monday, '12:00', WEEKLY_HOURS, EXCEPTIONS)).toBe(true)
  })

  it('returns false before opening', () => {
    const monday = new Date('2026-03-30')
    expect(isOpen(monday, '08:00', WEEKLY_HOURS, EXCEPTIONS)).toBe(false)
  })

  it('returns false after closing', () => {
    const monday = new Date('2026-03-30')
    expect(isOpen(monday, '23:00', WEEKLY_HOURS, EXCEPTIONS)).toBe(false)
  })

  it('returns false on a closed weekday', () => {
    const wednesday = new Date('2026-04-01') // Wednesday = day 3 = closed
    expect(isOpen(wednesday, '12:00', WEEKLY_HOURS, EXCEPTIONS)).toBe(false)
  })

  it('returns false on a closed exception date', () => {
    const newYear = new Date('2026-01-01')
    expect(isOpen(newYear, '12:00', WEEKLY_HOURS, EXCEPTIONS)).toBe(false)
  })

  it('uses exception hours on holiday that is open', () => {
    const christmas = new Date('2026-12-25')
    expect(isOpen(christmas, '13:00', WEEKLY_HOURS, EXCEPTIONS)).toBe(true)
    expect(isOpen(christmas, '11:00', WEEKLY_HOURS, EXCEPTIONS)).toBe(false)
  })

  it('returns false when no hours data available', () => {
    const monday = new Date('2026-03-30')
    expect(isOpen(monday, '12:00', [], [])).toBe(false)
  })

  it('returns true when current time equals close_time exactly', () => {
    const monday = new Date('2026-03-30')
    expect(isOpen(monday, '22:00', WEEKLY_HOURS, EXCEPTIONS)).toBe(true)
  })

  it('returns true when current time equals open_time exactly', () => {
    const monday = new Date('2026-03-30')
    expect(isOpen(monday, '09:00', WEEKLY_HOURS, EXCEPTIONS)).toBe(true)
  })
})

describe('formatDate', () => {
  it('formats ISO date string', () => {
    expect(formatDate('2026-03-29')).toBe('29.03.2026')
  })

  it('returns original string on parse error', () => {
    expect(formatDate('invalid-date')).toBe('invalid-date')
  })

  it('supports custom format', () => {
    expect(formatDate('2026-03-29', 'MM/dd/yyyy')).toBe('03/29/2026')
  })
})

describe('formatDateTime', () => {
  it('formats ISO datetime string', () => {
    expect(formatDateTime('2026-03-29T14:30:00.000Z')).toMatch(/29\.03\.2026/)
  })

  it('returns original string on parse error', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date')
  })
})
