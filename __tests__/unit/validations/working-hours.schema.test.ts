import { describe, it, expect } from 'vitest'
import {
  workingHoursSchema,
  workingHoursExceptionSchema,
} from '@/lib/validations/working-hours.schema'

describe('workingHoursSchema', () => {
  it('açık gün için geçerli veriyi kabul eder', () => {
    const result = workingHoursSchema.safeParse({
      day_of_week: 1,
      is_open: true,
      open_time: '09:00',
      close_time: '22:00',
    })
    expect(result.success).toBe(true)
  })

  it('kapalı gün için saat gerektirmez', () => {
    const result = workingHoursSchema.safeParse({
      day_of_week: 3,
      is_open: false,
    })
    expect(result.success).toBe(true)
  })

  it('açık gün için saat eksikse hata verir', () => {
    const result = workingHoursSchema.safeParse({
      day_of_week: 1,
      is_open: true,
      open_time: null,
      close_time: null,
    })
    expect(result.success).toBe(false)
  })

  it('kapanış saati açılıştan önce ise hata verir', () => {
    const result = workingHoursSchema.safeParse({
      day_of_week: 1,
      is_open: true,
      open_time: '22:00',
      close_time: '09:00',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('close_time'))).toBe(true)
    }
  })

  it('geçersiz saat formatını reddeder', () => {
    const result = workingHoursSchema.safeParse({
      day_of_week: 1,
      is_open: true,
      open_time: '9:00',
      close_time: '22:00',
    })
    expect(result.success).toBe(false)
  })

  it('not alanları opsiyoneldir', () => {
    const result = workingHoursSchema.safeParse({
      day_of_week: 5,
      is_open: true,
      open_time: '10:00',
      close_time: '23:00',
      note_tr: 'Özel gün',
      note_en: 'Special day',
    })
    expect(result.success).toBe(true)
  })

  it('gün 0-6 arasında olmalıdır', () => {
    const result = workingHoursSchema.safeParse({
      day_of_week: 7,
      is_open: false,
    })
    expect(result.success).toBe(false)
  })

  it('eşit saatler (açılış = kapanış) için hata verir', () => {
    const result = workingHoursSchema.safeParse({
      day_of_week: 1,
      is_open: true,
      open_time: '09:00',
      close_time: '09:00',
    })
    expect(result.success).toBe(false)
  })
})

describe('workingHoursExceptionSchema', () => {
  it('kapalı istisna için geçerli veriyi kabul eder', () => {
    const result = workingHoursExceptionSchema.safeParse({
      date: '2026-01-01',
      is_open: false,
    })
    expect(result.success).toBe(true)
  })

  it('açık istisna için saat gerektirir', () => {
    const result = workingHoursExceptionSchema.safeParse({
      date: '2026-12-25',
      is_open: true,
      open_time: '12:00',
      close_time: '18:00',
    })
    expect(result.success).toBe(true)
  })

  it('açık istisna için saat eksikse hata verir', () => {
    const result = workingHoursExceptionSchema.safeParse({
      date: '2026-12-25',
      is_open: true,
      open_time: null,
      close_time: null,
    })
    expect(result.success).toBe(false)
  })

  it('geçersiz tarih formatını reddeder', () => {
    const result = workingHoursExceptionSchema.safeParse({
      date: '25-12-2026',
      is_open: false,
    })
    expect(result.success).toBe(false)
  })

  it('açıklama alanları opsiyoneldir', () => {
    const result = workingHoursExceptionSchema.safeParse({
      date: '2026-06-15',
      is_open: false,
      description_tr: 'Tatil',
      description_en: 'Holiday',
    })
    expect(result.success).toBe(true)
  })

  it('kapanış saati açılıştan önce ise hata verir', () => {
    const result = workingHoursExceptionSchema.safeParse({
      date: '2026-12-25',
      is_open: true,
      open_time: '20:00',
      close_time: '10:00',
    })
    expect(result.success).toBe(false)
  })
})
