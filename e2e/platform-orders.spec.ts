import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD)

test.describe('Platform siparişleri (Yemeksepeti/Getir/Trendyol/Kurye)', () => {
  test.skip(!hasCredentials, 'TEST_EMAIL + TEST_PASSWORD gerekir.')

  test.beforeEach(async ({ page }) => {
    await page.goto('/tr/login')
    await page.fill('#email', TEST_EMAIL!)
    await page.fill('#password', TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await page.waitForURL(/\/tr\/(admin|dashboard|platform-orders)/)
  })

  test('platform-orders sayfası açılır', async ({ page }) => {
    await page.goto('/tr/admin/platform-orders')
    await expect(page.getByRole('heading', { name: /Platform/i })).toBeVisible()
  })

  // TODO: happy path — platform sipariş oluştur → ürün ekle → ödeme → kapat
  test.skip('happy path: yeni platform sipariş açma → ödeme → kapat', async () => {})
})
