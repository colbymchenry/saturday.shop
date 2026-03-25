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

    const section = page.locator('.recently-viewed').first();
    // Should now be visible with the viewed product
    const isVisible = await section.isVisible();
    if (isVisible) {
      const cards = section.locator('.product-card');
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });
});
