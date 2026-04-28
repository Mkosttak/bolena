import { describe, it, expect } from 'vitest'
import { menuCampaignSchema } from '@/lib/validations/menu-campaign.schema'

const TODAY = new Date().toISOString().slice(0, 10)
const TOMORROW = (() => {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10)
})()

const validInput = {
  name_tr: 'Her Salı İndirimi',
  name_en: 'Tuesday Discount',
  discount_percent: 10,
  start_date: TODAY,
  end_date: TOMORROW,
  active_days: [1, 2, 3],
}

describe('menuCampaignSchema', () => {
  it('geçerli input başarıyla parse edilir', () => {
    const result = menuCampaignSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('varsayılan değerler doğru atanır', () => {
    const result = menuCampaignSchema.safeParse(validInput)
    if (!result.success) throw new Error('parse failed')
    expect(result.data.price_basis).toBe('effective')
    expect(result.data.is_active).toBe(true)
    expect(result.data.priority).toBe(0)
    expect(result.data.start_time).toBeNull()
    expect(result.data.end_time).toBeNull()
  })

  it('name_tr boş olunca hata verir', () => {
    const result = menuCampaignSchema.safeParse({ ...validInput, name_tr: '' })
    expect(result.success).toBe(false)
  })

  it('name_en boş olunca hata verir', () => {
    const result = menuCampaignSchema.safeParse({ ...validInput, name_en: '' })
    expect(result.success).toBe(false)
  })

  it('discount_percent 0 olunca hata verir', () => {
    const result = menuCampaignSchema.safeParse({ ...validInput, discount_percent: 0 })
    expect(result.success).toBe(false)
  })

  it('discount_percent 100\'ü aşınca hata verir', () => {
    const result = menuCampaignSchema.safeParse({ ...validInput, discount_percent: 101 })
    expect(result.success).toBe(false)
  })

  it('active_days boş diziyse hata verir', () => {
    const result = menuCampaignSchema.safeParse({ ...validInput, active_days: [] })
    expect(result.success).toBe(false)
  })

  it('active_days geçersiz gün değeri içeriyorsa hata verir', () => {
    const result = menuCampaignSchema.safeParse({ ...validInput, active_days: [7] })
    expect(result.success).toBe(false)
  })

  it('end_date start_date\'den önce olunca refine hatası verir', () => {
    const result = menuCampaignSchema.safeParse({
      ...validInput,
      start_date: TOMORROW,
      end_date: TODAY,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('end_date'))).toBe(true)
    }
  })

  it('end_time start_time\'den önce olunca refine hatası verir', () => {
    const result = menuCampaignSchema.safeParse({
      ...validInput,
      start_time: '14:00',
      end_time: '10:00',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('end_time'))).toBe(true)
    }
  })

  it('start_time ve end_time null olduğunda (tüm gün) başarıyla parse edilir', () => {
    const result = menuCampaignSchema.safeParse({
      ...validInput,
      start_time: null,
      end_time: null,
    })
    expect(result.success).toBe(true)
  })

  it('price_basis geçersiz değer verince hata verir', () => {
    const result = menuCampaignSchema.safeParse({ ...validInput, price_basis: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('max_discount_amount null kabul edilir', () => {
    const result = menuCampaignSchema.safeParse({ ...validInput, max_discount_amount: null })
    expect(result.success).toBe(true)
  })

  it('max_discount_amount 0 veya negatif olunca hata verir', () => {
    const result = menuCampaignSchema.safeParse({ ...validInput, max_discount_amount: 0 })
    expect(result.success).toBe(false)
  })
})
