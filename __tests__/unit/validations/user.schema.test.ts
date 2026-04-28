import { describe, it, expect } from 'vitest'
import { createUserSchema } from '@/lib/validations/user.schema'

describe('createUserSchema', () => {
  it('geçerli kullanıcı verisini kabul eder', () => {
    const result = createUserSchema.safeParse({
      email: 'test@bolena.com',
      password: 'sifre123',
      fullName: 'Test Kullanıcı',
      role: 'employee',
    })
    expect(result.success).toBe(true)
  })

  it('geçersiz e-posta reddeder', () => {
    const result = createUserSchema.safeParse({
      email: 'gecersiz-email',
      password: 'sifre123',
      fullName: 'Test User',
      role: 'employee',
    })
    expect(result.success).toBe(false)
  })

  it('8 karakterden kısa şifreyi reddeder', () => {
    const result = createUserSchema.safeParse({
      email: 'test@bolena.com',
      password: 'kisa',
      fullName: 'Test User',
      role: 'employee',
    })
    expect(result.success).toBe(false)
  })

  it('2 karakterden kısa adı reddeder', () => {
    const result = createUserSchema.safeParse({
      email: 'test@bolena.com',
      password: 'sifre123',
      fullName: 'X',
      role: 'employee',
    })
    expect(result.success).toBe(false)
  })

  it('geçersiz rolü reddeder', () => {
    const result = createUserSchema.safeParse({
      email: 'test@bolena.com',
      password: 'sifre123',
      fullName: 'Test User',
      role: 'manager',
    })
    expect(result.success).toBe(false)
  })

  it('admin rolünü kabul eder', () => {
    const result = createUserSchema.safeParse({
      email: 'admin@bolena.com',
      password: 'adminpass123',
      fullName: 'Admin Kullanıcı',
      role: 'admin',
    })
    expect(result.success).toBe(true)
  })
})
