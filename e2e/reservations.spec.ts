import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD)

test.describe('Rezervasyon akışı (admin)', () => {
  test.skip(!hasCredentials, 'TEST_EMAIL + TEST_PASSWORD gerekir.')

  test.beforeEach(async ({ page }) => {
    await page.goto('/tr/login')
    await page.fill('#email', TEST_EMAIL!)
    await page.fill('#password', TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await page.waitForURL(/\/tr\/(admin|dashboard|reservations|tables)/)
  })

  test('rezervasyon sayfası açılır, listeleme görünür', async ({ page }) => {
    await page.goto('/tr/admin/reservations')
    await expect(page.getByRole('heading', { name: /Rezervasyon/i })).toBeVisible()
  })

  // TODO: Aşağıdaki happy path'i kullanıcı kendi PC'sinde tamamlamalı.
  // Adımlar (manuel):
  //   1. "Yeni Rezervasyon" butonuna bas
  //   2. müşteri adı, telefon, tarih, saat, kişi sayısı doldur
  //   3. Kaydet → liste'de görün
  //   4. Masaya ata → status "seated"
  //   5. Sipariş aç → ürün ekle → ödeme al → kapat
  //   6. Rezervasyon "completed" olmalı
  test.skip('happy path: oluştur → ata → sipariş aç → ödeme → kapat', async () => {
    // implement
  })
})
