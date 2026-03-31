import { test, expect } from '@playwright/test';

test.describe('Marquee', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('marquee is visible', async ({ page }) => {
    const marquee = page.locator('.marquee').first();
    await expect(marquee).toBeVisible();
  });

  test('marquee track contains content items', async ({ page }) => {
    const track = page.locator('.marquee__track').first();
    await expect(track).toBeVisible();

    const items = track.locator('.marquee__item');
    expect(await items.count()).toBeGreaterThan(0);
  });

  test('marquee items display text', async ({ page }) => {
    const item = page.locator('.marquee__item').first();
    await expect(item).toBeVisible();

    const text = await item.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('marquee has separators between items', async ({ page }) => {
    const separators = page.locator('.marquee__separator');
    expect(await separators.count()).toBeGreaterThan(0);
  });

  test('marquee track has scroll animation', async ({ page }) => {
    const track = page.locator('.marquee__track').first();
    const animation = await track.evaluate(el => getComputedStyle(el).animationName);
    expect(animation).toBe('marquee-scroll');
  });

  test('marquee duplicates content for seamless loop', async ({ page }) => {
    // JS dynamically clones copies to fill viewport — should have at least 2
    const contents = page.locator('.marquee__content');
    expect(await contents.count()).toBeGreaterThanOrEqual(2);

    // All clones should be aria-hidden (only the first is accessible)
    const hidden = page.locator('.marquee__content[aria-hidden="true"]');
    expect(await hidden.count()).toBe(await contents.count() - 1);
  });
});
