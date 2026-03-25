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

  test('section has a height variant class', async ({ page }) => {
    const section = page.locator('.full-width-image').first();
    const classList = await section.evaluate(el => Array.from(el.classList));
    const hasHeightClass = classList.some(c =>
      ['full-width-image--auto', 'full-width-image--small', 'full-width-image--medium', 'full-width-image--large'].includes(c)
    );
    expect(hasHeightClass).toBe(true);
  });

  test('section has overflow hidden for height cropping', async ({ page }) => {
    const section = page.locator('.full-width-image').first();
    const overflow = await section.evaluate(el => getComputedStyle(el).overflow);
    expect(overflow).toBe('hidden');
  });

  test('constrained height sections use object-fit cover on images', async ({ page }) => {
    const section = page.locator('.full-width-image').first();
    const classList = await section.evaluate(el => Array.from(el.classList));
    const isConstrained = classList.some(c =>
      ['full-width-image--small', 'full-width-image--medium', 'full-width-image--large'].includes(c)
    );

    if (isConstrained) {
      const img = section.locator('img').first();
      if (await img.count() > 0) {
        const objectFit = await img.evaluate(el => getComputedStyle(el).objectFit);
        expect(objectFit).toBe('cover');
      }
    }
  });
});
