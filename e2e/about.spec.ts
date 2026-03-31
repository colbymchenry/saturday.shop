import { test, expect } from '@playwright/test';

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/about');
  });

  test.describe('About hero', () => {
    test('hero section is visible', async ({ page }) => {
      const hero = page.locator('.about-hero');
      await expect(hero).toBeVisible();
    });

    test('hero displays eyebrow text', async ({ page }) => {
      const eyebrow = page.locator('.about-hero__eyebrow');
      await expect(eyebrow).toBeVisible();
      await expect(eyebrow).not.toBeEmpty();
    });

    test('hero displays heading with bold and script parts', async ({ page }) => {
      const heading = page.locator('.about-hero__heading');
      await expect(heading).toBeVisible();

      const bold = page.locator('.about-hero__heading-bold');
      if (await bold.count() > 0) {
        await expect(bold).toBeVisible();
      }

      const script = page.locator('.about-hero__heading-script');
      if (await script.count() > 0) {
        await expect(script).toBeVisible();
      }
    });

    test('hero displays body text', async ({ page }) => {
      const body = page.locator('.about-hero__body');
      await expect(body).toBeVisible();
      await expect(body).not.toBeEmpty();
    });

    test('hero uses split layout on desktop', async ({ page }) => {
      const inner = page.locator('.about-hero__inner');
      const display = await inner.evaluate(el => getComputedStyle(el).display);
      expect(display).toBe('grid');
    });
  });

  test.describe('About narrative', () => {
    test('narrative section is visible', async ({ page }) => {
      const narrative = page.locator('.about-narrative');
      await expect(narrative).toBeVisible();
    });

    test('narrative has at least one chapter', async ({ page }) => {
      const chapters = page.locator('.about-narrative__chapter');
      expect(await chapters.count()).toBeGreaterThanOrEqual(1);
    });

    test('each chapter has heading and body text', async ({ page }) => {
      const chapters = page.locator('.about-narrative__chapter');
      const count = await chapters.count();

      for (let i = 0; i < count; i++) {
        const chapter = chapters.nth(i);
        const heading = chapter.locator('.about-narrative__heading');
        await expect(heading).toBeVisible();
        await expect(heading).not.toBeEmpty();

        const body = chapter.locator('.about-narrative__body');
        await expect(body).toBeVisible();
        await expect(body).not.toBeEmpty();
      }
    });

    test('chapters use alternating grid layout', async ({ page }) => {
      const chapters = page.locator('.about-narrative__chapter');
      const count = await chapters.count();
      if (count < 2) return;

      for (let i = 0; i < count; i++) {
        const chapter = chapters.nth(i);
        const display = await chapter.evaluate(el => getComputedStyle(el).display);
        expect(display).toBe('grid');
      }
    });
  });

  test.describe('About values', () => {
    test('values section is visible', async ({ page }) => {
      const values = page.locator('.about-values');
      await expect(values).toBeVisible();
    });

    test('values section has dark background', async ({ page }) => {
      const values = page.locator('.about-values');
      const bg = await values.evaluate(el => getComputedStyle(el).backgroundColor);
      // Should be dark (black or near-black)
      expect(bg).toMatch(/rgb\(0, 0, 0\)/);
    });

    test('values heading and eyebrow are visible', async ({ page }) => {
      const eyebrow = page.locator('.about-values__eyebrow');
      await expect(eyebrow).toBeVisible();

      const heading = page.locator('.about-values__heading');
      await expect(heading).toBeVisible();
    });

    test('values grid has at least 3 items', async ({ page }) => {
      const items = page.locator('.about-values__item');
      expect(await items.count()).toBeGreaterThanOrEqual(3);
    });

    test('each value has a number and heading', async ({ page }) => {
      const items = page.locator('.about-values__item');
      const count = await items.count();

      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        const number = item.locator('.about-values__number');
        await expect(number).toBeVisible();

        const heading = item.locator('.about-values__item-heading');
        await expect(heading).toBeVisible();
        await expect(heading).not.toBeEmpty();
      }
    });

    test('value numbers are sequential', async ({ page }) => {
      const numbers = page.locator('.about-values__number');
      const count = await numbers.count();

      for (let i = 0; i < count; i++) {
        const text = await numbers.nth(i).textContent();
        const expected = String(i + 1).padStart(2, '0');
        expect(text?.trim()).toBe(expected);
      }
    });
  });

  test.describe('CTA section', () => {
    test('brand statement CTA is visible at bottom', async ({ page }) => {
      const cta = page.locator('.brand-statement').last();
      await expect(cta).toBeVisible();
    });

    test('CTA has a button', async ({ page }) => {
      const button = page.locator('.brand-statement__button').last();
      if (await button.count() > 0) {
        await expect(button).toBeVisible();
        const text = await button.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });
  });
});
