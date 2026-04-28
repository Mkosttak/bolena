import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD)

test.describe('Auth — smoke (her ortamda çalışır)', () => {
  test('login sayfası yüklenir ve form alanları görünür', async ({ page }) => {
    await page.goto('/tr/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Giriş Yap' })).toBeVisible()
  })

  test('admin root /tr/admin — kimlik doğrulanmamış istek login\'e yönlendirir', async ({ page }) => {
    await page.goto('/tr/admin')
    await expect(page).toHaveURL(/\/tr\/login/)
  })
})

test.describe('Auth — tam akış (TEST_EMAIL + TEST_PASSWORD gerekir)', () => {
  test.skip(!hasCredentials, 'E2E tam akış için .env.local içinde TEST_EMAIL ve TEST_PASSWORD set edilmelidir.')

  test('yanlış şifre -> hata, doğru giriş -> dashboard, oturum temizle -> login', async ({ page }) => {
    await page.goto('/tr/login?redirect=/tr/dashboard')

    await expect(page.locator('#email')).toBeVisible()
    await page.fill('#email', TEST_EMAIL!)
    await page.fill('#password', 'WrongPassword1')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()

    await expect(page.getByText('E-posta veya şifre hatalı')).toBeVisible()

    await page.fill('#password', TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Giriş Yap' }).click()

    await expect(page).toHaveURL(/\/tr\/dashboard(?:\?.*)?$/)

    await page.evaluate(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
    await page.context().clearCookies()

    await page.goto('/tr/login')
    await expect(page.locator('#email')).toBeVisible()
  })
})
