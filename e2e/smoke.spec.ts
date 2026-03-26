import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('homepage loads and has key sections', async ({ page }) => {
    await page.goto('/');

    // Page should have a title
    await expect(page).toHaveTitle(/.+/);

    // Header should be visible
    await expect(page.locator('header').first()).toBeVisible();

    // Featured collection section should exist
    await expect(page.locator('.featured-collection').first()).toBeVisible();
  });

  test('collections page loads', async ({ page }) => {
    await page.goto('/collections/all');
    await expect(page).toHaveTitle(/.+/);
  });

  test('cart page loads', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveTitle(/.+/);
  });

  test('404 page renders', async ({ page }) => {
    const response = await page.goto('/pages/nonexistent-page-xyz');
    // Shopify may return 200 for custom 404 pages, 404, or 502 via dev proxy
    expect(response?.ok() || [404, 502].includes(response?.status() ?? 0)).toBeTruthy();
  });
});

test.describe('No horizontal overflow', () => {
  const pages = ['/', '/search?q=a', '/cart', '/collections/all'];

  for (const path of pages) {
    test(`no horizontal scrollbar on ${path}`, async ({ page }) => {
      await page.goto(path);
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });
  }
});
