import { describe, it, expect } from 'vitest'
import { reservationSchema } from '@/lib/validations/reservation.schema'

describe('reservationSchema', () => {
  // ─── Gel-Al ──────────────────────────────────────────────────────────────────

  it('geçerli gel-al verisini kabul eder', () => {
    const result = reservationSchema.safeParse({
      type: 'takeaway',
      customer_name: 'Ali Veli',
      customer_phone: '05321234567',
    })
    expect(result.success).toBe(true)
  })

  it('gel-al için tarih ve saat zorunlu değil', () => {
    const result = reservationSchema.safeParse({
      type: 'takeaway',
      customer_name: 'Ali Veli',
      customer_phone: '05321234567',
      reservation_date: null,
      reservation_time: null,
    })
    expect(result.success).toBe(true)
  })

  it('gel-al için telefon olmadan kabul eder', () => {
    const result = reservationSchema.safeParse({
      type: 'takeaway',
      customer_name: 'Ali Veli',
      customer_phone: '',
    })
    expect(result.success).toBe(true)
  })

  // ─── Rezervasyon ─────────────────────────────────────────────────────────────

  it('geçerli rezervasyon verisini (tarih+saat ile) kabul eder', () => {
    const result = reservationSchema.safeParse({
      type: 'reservation',
      customer_name: 'Ali Veli',
      customer_phone: '05321234567',
      reservation_date: '2026-04-01',
      reservation_time: '19:00',
      party_size: 4,
    })
    expect(result.success).toBe(true)
  })

  it('rezervasyon tipinde telefon olmadan tarih ve saat yeterlidir', () => {
    const result = reservationSchema.safeParse({
      type: 'reservation',
      customer_name: 'Ali Veli',
      customer_phone: '',
      reservation_date: '2026-04-01',
      reservation_time: '19:00',
    })
    expect(result.success).toBe(true)
  })

  it('rezervasyon tipi için tarih eksikse hata verir', () => {
    const result = reservationSchema.safeParse({
      type: 'reservation',
      customer_name: 'Ali Veli',
      customer_phone: '05321234567',
      reservation_time: '19:00',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((e) => e.path[0])
      expect(paths).toContain('reservation_date')
    }
  })

  it('rezervasyon tipi için saat eksikse hata verir', () => {
    const result = reservationSchema.safeParse({
      type: 'reservation',
      customer_name: 'Ali Veli',
      customer_phone: '05321234567',
      reservation_date: '2026-04-01',
    })
    expect(result.success).toBe(false)
  })

  // ─── Validasyon Hataları ─────────────────────────────────────────────────────

  it('boş müşteri adını reddeder', () => {
    const result = reservationSchema.safeParse({
      type: 'takeaway',
      customer_name: 'A',
      customer_phone: '05321234567',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('customer_name')
    }
  })

  it('doldurulmuş geçersiz telefon numarasını reddeder', () => {
    const result = reservationSchema.safeParse({
      type: 'takeaway',
      customer_name: 'Ali Veli',
      customer_phone: '123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('customer_phone')
    }
  })

  it('geçersiz tipi reddeder', () => {
    const result = reservationSchema.safeParse({
      type: 'invalid',
      customer_name: 'Ali Veli',
      customer_phone: '05321234567',
    })
    expect(result.success).toBe(false)
  })

  it('opsiyonel alanlar (notes, party_size, telefon) olmadan çalışır', () => {
    const result = reservationSchema.safeParse({
      type: 'takeaway',
      customer_name: 'Ali Veli',
      customer_phone: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBeUndefined()
      expect(result.data.party_size).toBeUndefined()
    }
  })

  it('kişi sayısı boş veya NaN iken kabul eder', () => {
    const empty = reservationSchema.safeParse({
      type: 'takeaway',
      customer_name: 'Ali Veli',
      customer_phone: '',
      party_size: Number.NaN,
    })
    expect(empty.success).toBe(true)
  })

  it('kişi sayısı pozitif tam sayı olmalıdır', () => {
    const result = reservationSchema.safeParse({
      type: 'takeaway',
      customer_name: 'Ali Veli',
      customer_phone: '05321234567',
      party_size: 0,
    })
    expect(result.success).toBe(false)
  })

  it('notlar ve kişi sayısı ile geçerli rezervasyon', () => {
    const result = reservationSchema.safeParse({
      type: 'reservation',
      customer_name: 'Ayşe Kaya',
      customer_phone: '05551234567',
      reservation_date: '2026-05-10',
      reservation_time: '20:30',
      party_size: 6,
      notes: 'Vejetaryen menü tercih edilir',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.party_size).toBe(6)
      expect(result.data.notes).toBe('Vejetaryen menü tercih edilir')
    }
  })
})
