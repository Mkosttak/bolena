import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD)

// Geçerli bir QR token bulmak için admin DB'den alınabilir.
// Bu test ortamında TEST_QR_TOKEN env değişkeniyle sağlanır.
const TEST_QR_TOKEN = process.env.TEST_QR_TOKEN

test.describe('QR Sipariş Sistemi — genel', () => {
  test('geçersiz UUID token → 404 veya hata sayfası', async ({ page }) => {
    const response = await page.goto('/qr/00000000-0000-0000-0000-000000000000')
    // Either 404 or our error component
    const body = await page.content()
    const isNotFound = response?.status() === 404 || body.includes('Geçersiz') || body.includes('bulunamadı')
    expect(isNotFound).toBe(true)
  })

  test('UUID formatında olmayan token → 404', async ({ page }) => {
    const response = await page.goto('/qr/gecersiz-token')
    expect(response?.status()).toBe(404)
  })
})

test.describe('QR Sipariş — geçerli token ile (TEST_QR_TOKEN gerekir)', () => {
  test.skip(!TEST_QR_TOKEN, 'Bu test için .env.local içinde TEST_QR_TOKEN set edilmelidir.')

  test('QR sayfası yüklenir ve menü görüntülenir', async ({ page }) => {
    await page.goto(`/qr/${TEST_QR_TOKEN}`)

    // Ana bileşenler yüklenmeli
    await expect(page.locator('text=Bolena Cafe')).toBeVisible()

    // Menü sekmesi aktif
    await expect(page.locator('text=Menü')).toBeVisible()
    await expect(page.locator('text=Sepetim')).toBeVisible()
    await expect(page.locator('text=Hesap')).toBeVisible()
  })

  test('ürün sepete eklenir ve Sipariş Ver çalışır', async ({ page }) => {
    await page.goto(`/qr/${TEST_QR_TOKEN}`)

    // İlk ürün kartına tıkla
    const firstCard = page.locator('button').filter({ hasText: '₺' }).first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })
    await firstCard.click()

    // Bottom sheet açılmalı
    const addToCartBtn = page.locator('button', { hasText: 'Sepete Ekle' })
    await expect(addToCartBtn).toBeVisible()
    await addToCartBtn.click()

    // Sepet sekmesine geç
    await page.locator('text=Sepetim').click()
    await expect(page.locator('text=Sipariş Ver')).toBeVisible()

    // Sipariş ver butonuna tıkla
    await page.locator('button', { hasText: 'Sipariş Ver' }).click()

    // Başarı toastı görünmeli
    await expect(page.locator('text=Siparişiniz iletildi')).toBeVisible({ timeout: 10_000 })

    // Hesap sekmesine otomatik geçiş
    const billTab = page.locator('[aria-label*="Hesap"], button:has-text("Hesap")').first()
    await expect(billTab).toBeVisible()
  })

  test('hesap sekmesinde tüm masa siparişleri görünür', async ({ page }) => {
    await page.goto(`/qr/${TEST_QR_TOKEN}`)

    await page.locator('text=Hesap').click()

    // Ya boş durum ya da sipariş listesi görünmeli
    const hasOrder = await page.locator('text=Sipariş Kalemleri').isVisible()
    const isEmpty = await page.locator('text=Henüz sipariş yok').isVisible()
    expect(hasOrder || isEmpty).toBe(true)
  })
})

test.describe('QR Admin — Site Ayarları (giriş gerekir)', () => {
  test.skip(!hasCredentials, 'E2E için .env.local içinde TEST_EMAIL ve TEST_PASSWORD set edilmelidir.')

  test('Site Ayarları sayfası yüklenir', async ({ page }) => {
    // Admin girişi
    await page.goto('/tr/login?redirect=/tr/admin/site-settings')
    await page.fill('#email', TEST_EMAIL!)
    await page.fill('#password', TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Giriş Yap' }).click()

    await expect(page).toHaveURL(/site-settings/)
    await expect(page.locator('text=Site Ayarları')).toBeVisible()
    await expect(page.locator('text=QR Sipariş Sistemi')).toBeVisible()
    await expect(page.locator('text=Masa QR Kodları')).toBeVisible()
  })
})
