import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD)

test.describe('Masa siparişi — tam akış (TEST_EMAIL + TEST_PASSWORD gerekir)', () => {
  test.skip(!hasCredentials, 'E2E tam akış için .env.local içinde TEST_EMAIL ve TEST_PASSWORD set edilmelidir.')

  test('ürün ekle -> ödeme al -> sipariş tamamlandı', async ({ page }) => {
    await page.goto('/tr/login?redirect=/tr/tables')

    await expect(page.locator('#email')).toBeVisible()
    await page.fill('#email', TEST_EMAIL!)
    await page.fill('#password', TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Giriş Yap' }).click()

    await expect(page).toHaveURL(/\/tr\/tables(?:\?.*)?$/)

    const tableLink = page.locator('a[href^="/tr/tables/"]').first()
    await expect(tableLink).toBeVisible()

    const tableName = await tableLink.locator('div.font-semibold').first().innerText()
    await tableLink.click()

    await expect(page.getByRole('button', { name: 'Ürün Ekle' })).toBeVisible()
    await page.getByRole('button', { name: 'Ürün Ekle' }).click()

    const dialogContent = page.locator('[data-slot="dialog-content"]').first()
    await expect(dialogContent).toBeVisible()

    const firstProductButton = dialogContent.locator('button').filter({ hasText: '₺' }).first()
    await expect(firstProductButton).toBeVisible()

    const productName = await firstProductButton
      .locator('p.font-medium')
      .first()
      .innerText()

    await firstProductButton.click()

    const requiredLabel = dialogContent.getByText('Zorunlu')
    if (await requiredLabel.isVisible()) {
      const firstCheckbox = dialogContent.getByRole('checkbox').first()
      await firstCheckbox.check()
    }

    await dialogContent
      .getByRole('button', { name: /^Ekle/ })
      .click()

    await expect(page.getByText(productName)).toBeVisible()

    await page.getByRole('button', { name: 'Ödeme' }).click()

    const paymentDialog = page.locator('[data-slot="dialog-title"]').first()
    await expect(paymentDialog).toHaveText('Ödeme')

    await page.getByRole('button', { name: /Kısmi Ödeme/ }).click()
    await page.getByRole('button', { name: 'Siparişi Kapat' }).click()

    await expect(page).toHaveURL(/\/tr\/tables(?:\?.*)?$/)

    const reopenedTableCard = page
      .locator('a[href^="/tr/tables/"]')
      .filter({ hasText: tableName })
      .first()
    await expect(reopenedTableCard).toBeVisible()
    await expect(reopenedTableCard.getByText('Boş')).toBeVisible()
  })
})
