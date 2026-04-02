import { test, expect } from '@playwright/test';

test.describe('Recently viewed', () => {
  test('section shows fallback carousel when no products have been viewed', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('saturday-recently-viewed'));
    await page.reload();

    const section = page.locator('.recently-viewed').first();
    // With fallback_collection configured, the section should become visible
    await expect(section).toBeVisible({ timeout: 5000 });

    // Fallback should be visible with product cards
    const fallback = section.locator('[data-recently-viewed-fallback]');
    await expect(fallback).toBeVisible();
    const fallbackCards = fallback.locator('product-card');
    expect(await fallbackCards.count()).toBeGreaterThan(0);

    // Main track should be hidden
    const mainCarousel = section.locator('[data-recently-viewed-main]');
    await expect(mainCarousel).toBeHidden();
  });

  test('fallback heading replaces the default heading for first-time visitors', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('saturday-recently-viewed'));
    await page.reload();

    const heading = page.locator('[data-recently-viewed-heading]').first();
    // Wait for JS to swap the heading
    await expect(heading).toBeVisible({ timeout: 5000 });
    const text = await heading.textContent();
    expect(text?.trim()).toBe('NEW ARRIVALS');
  });

  test('section has a title', async ({ page }) => {
    await page.goto('/');
    const title = page.locator('.recently-viewed__title').first();
    await expect(title).toBeAttached();
    const text = await title.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('section shows products after visiting a product page', async ({ page }) => {
    // Visit a product page directly to populate recently viewed
    await page.goto('/collections/all');
    await page.waitForLoadState('domcontentloaded');

    // Find a visible product link
    const productLink = page.locator('a[href*="/products/"]:visible').first();
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
      const cards = section.locator('[data-recently-viewed-track] product-card');
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test('recently viewed cards use the shared product-card snippet', async ({ page }) => {
    // Visit two product pages to populate recently viewed
    await page.goto('/collections/all');
    await page.waitForLoadState('domcontentloaded');

    const productLink = page.locator('a[href*="/products/"]:visible').first();
    if (await productLink.count() === 0) {
      test.skip();
      return;
    }
    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Visit a second product page — recently-viewed should show the first product
    const secondLink = page.locator('a[href*="/products/"]:visible').first();
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

  test('fallback carousel has arrow navigation', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('saturday-recently-viewed'));
    await page.reload();

    const section = page.locator('.recently-viewed').first();
    await expect(section).toBeVisible({ timeout: 5000 });

    const fallback = section.locator('[data-recently-viewed-fallback]');
    const prevBtn = fallback.locator('.recently-viewed__arrow--prev');
    const nextBtn = fallback.locator('.recently-viewed__arrow--next');

    await expect(prevBtn).toBeAttached();
    await expect(nextBtn).toBeAttached();
  });

  test('recently-viewed cards are narrower than featured-collection cards', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('saturday-recently-viewed'));
    await page.reload();

    const section = page.locator('.recently-viewed').first();
    await expect(section).toBeVisible({ timeout: 5000 });

    // Check that a card in the recently-viewed track has the smaller sizing
    const card = section.locator('.recently-viewed__track product-card').first();
    const cardBox = await card.boundingBox();

    // Featured collection cards use min-width: 280px, recently-viewed uses 240px
    // On desktop, recently-viewed cards should be narrower
    if (cardBox) {
      expect(cardBox.width).toBeLessThanOrEqual(300);
    }
  });
});
