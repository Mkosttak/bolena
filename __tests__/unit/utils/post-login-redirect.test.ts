import { describe, expect, it } from 'vitest'
import {
  defaultPathAfterLogin,
  isSafeLocaleAdminRedirect,
} from '@/lib/utils/post-login-redirect'

describe('isSafeLocaleAdminRedirect', () => {
  it('allows same-locale admin paths', () => {
    expect(isSafeLocaleAdminRedirect('/tr/admin/tables', 'tr')).toBe(true)
    expect(isSafeLocaleAdminRedirect('/en/admin/dashboard', 'en')).toBe(true)
  })

  it('rejects other locales and open redirects', () => {
    expect(isSafeLocaleAdminRedirect('/en/admin/tables', 'tr')).toBe(false)
    expect(isSafeLocaleAdminRedirect('//evil.com', 'tr')).toBe(false)
    expect(isSafeLocaleAdminRedirect(undefined, 'tr')).toBe(false)
  })
})

describe('defaultPathAfterLogin', () => {
  it('sends admin to dashboard', () => {
    expect(defaultPathAfterLogin('tr', 'admin', [])).toBe('/tr/admin/dashboard')
  })

  it('picks first allowed module for employee', () => {
    expect(
      defaultPathAfterLogin('tr', 'employee', ['tables', 'menu'])
    ).toBe('/tr/admin/tables')
  })
})
