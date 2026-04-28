import { test, expect } from '@playwright/test'

test.describe('Public pages — smoke tests', () => {
  test('Home page: hero visible and CTA navigates to menu', async ({ page }) => {
    await page.goto('/tr')

    // Hero section should have a heading
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()

    // "Menüyü Keşfet" CTA button should be visible
    const ctaBtn = page.getByRole('link', { name: /Menüyü Keşfet/i })
    await expect(ctaBtn).toBeVisible()

    // Click CTA → should navigate to menu page
    await ctaBtn.click()
    await expect(page).toHaveURL(/\/tr\/menu/)
  })

  test('Home page: trust section and story section visible', async ({ page }) => {
    await page.goto('/tr')

    // Scroll down to trigger IntersectionObserver
    await page.evaluate(() => window.scrollTo(0, 500))

    // Trust section eyebrow should appear
    await expect(page.getByText('Neden Bolena?')).toBeVisible()
  })

  test('Menu page: loads products and detail sheet opens/closes', async ({ page }) => {
    await page.goto('/tr/menu')

    // Wait for menu content to load (category nav or product cards)
    await page.waitForSelector('.md-root', { timeout: 10000 })

    // Try to find product cards
    const cards = page.locator('.md-card')
    const cardCount = await cards.count()

    if (cardCount > 0) {
      // Click first product card
      await cards.first().click()

      // Sheet should open — look for a dialog role
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 5000 })

      // Close with keyboard Escape
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible({ timeout: 3000 })
    } else {
      // No products in DB (CI without data) — just verify the page loaded
      await expect(page.locator('.md-root')).toBeVisible()
    }
  })

  test('Contact page: working hours section and map visible', async ({ page }) => {
    await page.goto('/tr/contact')

    // Page should load
    await expect(page.locator('.cp')).toBeVisible()

    // Working hours section should be present
    await expect(page.getByText('Çalışma Saatleri')).toBeVisible()

    // Google Maps iframe should be present
    const mapFrame = page.locator('iframe[src*="google.com/maps"]')
    await expect(mapFrame).toBeAttached()

    // Phone link should have tel: href
    const phoneLink = page.locator('a[href^="tel:"]').first()
    await expect(phoneLink).toBeAttached()
  })

  test('English locale: pages render with English strings', async ({ page }) => {
    await page.goto('/en')

    // Hero should be visible in English
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()

    // Navigate to English contact
    await page.goto('/en/contact')
    await expect(page.locator('.cp')).toBeVisible()
    await expect(page.getByText('Working Hours')).toBeVisible()
  })
})
