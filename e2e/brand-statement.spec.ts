import { test, expect } from '@playwright/test';

test.describe('Brand statement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('brand statement sections are visible on homepage', async ({ page }) => {
    const sections = page.locator('.brand-statement');
    // index.json has 3 brand-statement instances
    expect(await sections.count()).toBeGreaterThanOrEqual(1);
    await expect(sections.first()).toBeVisible();
  });

  test('brand statement has centered content', async ({ page }) => {
    const inner = page.locator('.brand-statement__inner').first();
    await expect(inner).toBeVisible();

    const textAlign = await inner.evaluate(el => getComputedStyle(el).textAlign);
    expect(textAlign).toBe('center');
  });

  test('brand statement displays heading', async ({ page }) => {
    const heading = page.locator('.brand-statement__heading').first();
    await expect(heading).toBeVisible();
    await expect(heading).not.toBeEmpty();
  });

  test('brand statement displays body text when configured', async ({ page }) => {
    const body = page.locator('.brand-statement__body').first();
    if (await body.count() > 0) {
      await expect(body).toBeVisible();
      await expect(body).not.toBeEmpty();
    }
  });

  test('brand statement button is visible when configured', async ({ page }) => {
    const button = page.locator('.brand-statement__button').first();
    if (await button.count() > 0) {
      await expect(button).toBeVisible();
      const text = await button.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});
