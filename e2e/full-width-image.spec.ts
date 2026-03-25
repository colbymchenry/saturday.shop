import { test, expect } from '@playwright/test';

test.describe('Full-width image', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('full-width image sections are present', async ({ page }) => {
    const sections = page.locator('.full-width-image');
    expect(await sections.count()).toBeGreaterThanOrEqual(1);
  });

  test('full-width image contains an image or placeholder', async ({ page }) => {
    const section = page.locator('.full-width-image').first();
    const hasImg = await section.locator('img').count() > 0;
    const hasSvg = await section.locator('svg').count() > 0;
    expect(hasImg || hasSvg).toBe(true);
  });

  test('image spans full width of container', async ({ page }) => {
    const section = page.locator('.full-width-image').first();
    const img = section.locator('img').first();

    if (await img.count() > 0) {
      const imgWidth = await img.evaluate(el => getComputedStyle(el).width);
      const sectionWidth = await section.evaluate(el => el.clientWidth);
      // Image should be 100% width
      expect(parseInt(imgWidth)).toBeGreaterThanOrEqual(sectionWidth - 2);
    }
  });

  test('section has zero line-height to avoid spacing gaps', async ({ page }) => {
    const section = page.locator('.full-width-image').first();
    const lineHeight = await section.evaluate(el => getComputedStyle(el).lineHeight);
    expect(lineHeight).toBe('0px');
  });
});
