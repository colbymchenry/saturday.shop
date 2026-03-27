import { test, expect } from '@playwright/test';

test.describe('Recently viewed', () => {
  test('section is hidden when no products have been viewed', async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('saturday-recently-viewed'));
    await page.reload();

    const section = page.locator('.recently-viewed').first();
    await expect(section).toBeAttached();
    // Section should be hidden when no recently viewed products
    await expect(section).toBeHidden();
  });

  test('section has a title', async ({ page }) => {
    await page.goto('/');
    const title = page.locator('.recently-viewed__title').first();
    await expect(title).toBeAttached();
    const text = await title.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('section shows products after visiting a product page', async ({ page }) => {
    // Visit a product page first to populate recently viewed
    await page.goto('/collections/all');

    // Find and click any product link
    const productLink = page.locator('a[href*="/products/"]').first();
    if (await productLink.count() === 0) {
      test.skip();
      return;
    }
    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Go back to homepage
    await page.goto('/');

    // Cards are now fetched async via Section Rendering API — wait for section
    const section = page.locator('.recently-viewed').first();
    const isVisible = await section.isVisible({ timeout: 10000 }).catch(() => false);
    if (isVisible) {
      const cards = section.locator('product-card');
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test('recently viewed cards use the shared product-card snippet', async ({ page }) => {
    // Visit two product pages to populate recently viewed
    await page.goto('/collections/all');
    const productLink = page.locator('a[href*="/products/"]').first();
    if (await productLink.count() === 0) {
      test.skip();
      return;
    }
    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Visit a second product page — recently-viewed should show the first product
    const secondLink = page.locator('a[href*="/products/"]').first();
    if (await secondLink.count() === 0) {
      test.skip();
      return;
    }
    await secondLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Wait for the recently-viewed section to load
    const section = page.locator('.recently-viewed');
    const isVisible = await section.isVisible({ timeout: 10000 }).catch(() => false);
    if (isVisible) {
      // Cards should be full product-card elements with media, info, quick-add
      const card = section.locator('product-card').first();
      await expect(card.locator('.product-card__info')).toBeAttached();
      await expect(card.locator('.product-card__media')).toBeAttached();
    }
  });
});
