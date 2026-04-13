import { test, expect, Page } from '@playwright/test';

async function clearRecentlyViewed(page: Page) {
  await page.evaluate(() => localStorage.removeItem('saturday-recently-viewed'));
  await page.reload();
}

async function waitForFallbackAnimation(page: Page) {
  const section = page.locator('.recently-viewed').first();
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveClass(/carousel--visible/, { timeout: 5000 });
  const firstCard = section.locator('.recently-viewed__track .product-card').first();
  await expect(firstCard).toHaveCSS('opacity', '1', { timeout: 2000 });
}

test.describe('Recently viewed', () => {
  test('section shows fallback carousel when no products have been viewed', async ({ page }) => {
    await page.goto('/');
    await clearRecentlyViewed(page);

    const section = page.locator('.recently-viewed').first();
    await expect(section).toBeVisible({ timeout: 5000 });

    const fallback = section.locator('[data-recently-viewed-fallback]');
    await expect(fallback).toBeVisible();
    const fallbackCards = fallback.locator('product-card');
    expect(await fallbackCards.count()).toBeGreaterThan(0);

    const mainCarousel = section.locator('[data-recently-viewed-main]');
    await expect(mainCarousel).toBeHidden();
  });

  test('fallback heading replaces the default heading for first-time visitors', async ({ page }) => {
    await page.goto('/');
    await clearRecentlyViewed(page);

    const heading = page.locator('[data-recently-viewed-heading]').first();
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
    await page.goto('/collections/all');
    await page.waitForLoadState('domcontentloaded');

    const productLink = page.locator('a[href*="/products/"]:visible').first();
    if (await productLink.count() === 0) {
      test.skip();
      return;
    }
    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/');

    const section = page.locator('.recently-viewed').first();
    const isVisible = await section.isVisible({ timeout: 10000 }).catch(() => false);
    if (isVisible) {
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveClass(/carousel--visible/, { timeout: 5000 });

      const cards = section.locator('[data-recently-viewed-track] product-card');
      expect(await cards.count()).toBeGreaterThan(0);
      await expect(cards.first()).toHaveCSS('opacity', '1', { timeout: 2000 });
    }
  });

  test('recently viewed cards use the shared product-card snippet', async ({ page }) => {
    await page.goto('/collections/all');
    await page.waitForLoadState('domcontentloaded');

    const productLink = page.locator('a[href*="/products/"]:visible').first();
    if (await productLink.count() === 0) {
      test.skip();
      return;
    }
    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    const secondLink = page.locator('a[href*="/products/"]:visible').first();
    if (await secondLink.count() === 0) {
      test.skip();
      return;
    }
    await secondLink.click();
    await page.waitForLoadState('domcontentloaded');

    const section = page.locator('.recently-viewed');
    const isVisible = await section.isVisible({ timeout: 10000 }).catch(() => false);
    if (isVisible) {
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveClass(/carousel--visible/, { timeout: 5000 });

      const card = section.locator('product-card').first();
      await expect(card.locator('.product-card__info')).toBeAttached();
      await expect(card.locator('.product-card__media')).toBeAttached();
    }
  });

  test('fallback carousel has arrow navigation', async ({ page }) => {
    await page.goto('/');
    await clearRecentlyViewed(page);

    const section = page.locator('.recently-viewed').first();
    await expect(section).toBeVisible({ timeout: 5000 });

    const fallback = section.locator('[data-recently-viewed-fallback]');
    const prevBtn = fallback.locator('.recently-viewed__arrow--prev');
    const nextBtn = fallback.locator('.recently-viewed__arrow--next');

    await expect(prevBtn).toBeAttached();
    await expect(nextBtn).toBeAttached();
  });

  test('fallback carousel cards are properly sized at desktop', async ({ page }) => {
    await page.goto('/');
    await clearRecentlyViewed(page);

    const section = page.locator('.recently-viewed').first();
    await expect(section).toBeVisible({ timeout: 5000 });
    await waitForFallbackAnimation(page);

    const card = section.locator('.recently-viewed__track product-card').first();
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    if (cardBox) {
      expect(cardBox.width).toBeGreaterThanOrEqual(140);
      expect(cardBox.width).toBeLessThanOrEqual(260);
    }
  });

  test('cards are properly sized at tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await clearRecentlyViewed(page);

    const section = page.locator('.recently-viewed').first();
    await expect(section).toBeVisible({ timeout: 5000 });
    await waitForFallbackAnimation(page);

    const card = section.locator('.recently-viewed__track product-card').first();
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    if (cardBox) {
      expect(cardBox.width).toBeGreaterThanOrEqual(140);
    }
  });

  test('cards are properly sized at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await clearRecentlyViewed(page);

    const section = page.locator('.recently-viewed').first();
    await expect(section).toBeVisible({ timeout: 5000 });
    await waitForFallbackAnimation(page);

    const card = section.locator('.recently-viewed__track product-card').first();
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    if (cardBox) {
      expect(cardBox.width).toBeGreaterThanOrEqual(140);
    }
  });

  test('scroll-triggered entrance animation reveals fallback cards', async ({ page }) => {
    await page.goto('/');
    await clearRecentlyViewed(page);

    const section = page.locator('.recently-viewed').first();
    await expect(section).toBeVisible({ timeout: 5000 });

    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveClass(/carousel--visible/, { timeout: 5000 });

    const firstCard = section.locator('.recently-viewed__track .product-card').first();
    await expect(firstCard).toHaveCSS('opacity', '1', { timeout: 2000 });
  });
});
