import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD)

test.describe('KDS (Kitchen Display)', () => {
  test.skip(!hasCredentials, 'TEST_EMAIL + TEST_PASSWORD gerekir.')

  test.beforeEach(async ({ page }) => {
    await page.goto('/tr/login')
    await page.fill('#email', TEST_EMAIL!)
    await page.fill('#password', TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await page.waitForURL(/\/tr\/(admin|dashboard|kds)/)
  })

  test('KDS sayfası açılır', async ({ page }) => {
    await page.goto('/tr/admin/kds')
    await expect(page.getByRole('heading', { name: /KDS|Mutfak/i })).toBeVisible()
  })

  // TODO: realtime test — başka bir tab'da sipariş aç, KDS'te 1 sn içinde görünmeli.
  test.skip('realtime: yeni sipariş kalemi KDS\'te anında görünür', async () => {
    // implement: iki context aç, birinde sipariş ekle, diğerinde KDS'te kart belirsin.
  })
})
