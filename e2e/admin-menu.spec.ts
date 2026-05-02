import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD)

test.describe('Admin menü yönetimi', () => {
  test.skip(!hasCredentials, 'TEST_EMAIL + TEST_PASSWORD gerekir.')

  test.beforeEach(async ({ page }) => {
    await page.goto('/tr/login')
    await page.fill('#email', TEST_EMAIL!)
    await page.fill('#password', TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await page.waitForURL(/\/tr\/(admin|dashboard|menu)/)
  })

  test('menü sayfası açılır, kategori listesi görünür', async ({ page }) => {
    await page.goto('/tr/admin/menu')
    await expect(page.getByRole('heading', { name: /Menü/i })).toBeVisible()
  })

  // TODO: cascade silme akışı
  // 1. Yeni kategori oluştur "TEST-DEL"
  // 2. İçine 1 ürün ekle
  // 3. Kategoriyi sil
  // 4. Confirm dialog → onayla
  // 5. Kategori ve içindeki ürün listeden kalkmalı
  test.skip('happy path: kategori → ürün → silme cascade', async () => {})
})
