import { test, expect } from '@playwright/test';

test.describe('Hero banner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('hero banner is visible with correct structure', async ({ page }) => {
    const hero = page.locator('.hero-banner').first();
    await expect(hero).toBeVisible();

    // Should have an image (either uploaded or placeholder SVG)
    const image = hero.locator('.hero-banner__image');
    await expect(image).toBeVisible();

    // Should have the gradient overlay
    const overlay = hero.locator('.hero-banner__overlay');
    await expect(overlay).toBeAttached();
  });

  test('hero banner displays content text', async ({ page }) => {
    const content = page.locator('.hero-banner__content').first();
    await expect(content).toBeVisible();

    // Should have a heading
    const heading = content.locator('.hero-banner__heading');
    await expect(heading).toBeVisible();
    await expect(heading).not.toBeEmpty();
  });

  test('hero banner heading has bold and/or script parts', async ({ page }) => {
    const heading = page.locator('.hero-banner__heading').first();

    // At least one heading style should be present (bold or script)
    const boldPart = heading.locator('.hero-banner__heading-bold');
    const scriptPart = heading.locator('.hero-banner__heading-script');

    const hasBold = await boldPart.count() > 0;
    const hasScript = await scriptPart.count() > 0;
    expect(hasBold || hasScript).toBe(true);
  });

  test('hero banner has a CTA button that links somewhere', async ({ page }) => {
    const button = page.locator('.hero-banner__button').first();

    // Button may not be present if no button_text is set
    if (await button.count() === 0) {
      test.skip();
      return;
    }

    await expect(button).toBeVisible();

    // Should have non-empty text
    const text = await button.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);

    // Should be a link (href may be empty if no URL configured in settings)
    const href = await button.getAttribute('href');
    expect(href).not.toBeNull();
  });

  test('hero banner respects minimum height', async ({ page }) => {
    const hero = page.locator('.hero-banner').first();
    const box = await hero.boundingBox();

    // Should be at least 40vh tall (the schema minimum)
    const viewportHeight = page.viewportSize()?.height ?? 720;
    const minExpected = viewportHeight * 0.4;
    expect(box?.height).toBeGreaterThanOrEqual(minExpected);
  });

  test('hero banner image covers full section', async ({ page }) => {
    const hero = page.locator('.hero-banner').first();
    const image = hero.locator('.hero-banner__image');

    const heroBox = await hero.boundingBox();
    const imageBox = await image.boundingBox();

    if (heroBox && imageBox) {
      // Image container should span the full hero area
      expect(imageBox.width).toBeGreaterThanOrEqual(heroBox.width - 2);
      expect(imageBox.height).toBeGreaterThanOrEqual(heroBox.height - 2);
    }
  });

  test('hero content is positioned above overlay (z-index)', async ({ page }) => {
    const content = page.locator('.hero-banner__content').first();
    const zIndex = await content.evaluate(el => getComputedStyle(el).zIndex);
    expect(Number(zIndex)).toBeGreaterThanOrEqual(2);
  });
});
