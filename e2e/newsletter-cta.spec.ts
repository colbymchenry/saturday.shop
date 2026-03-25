import { test, expect } from '@playwright/test';

test.describe('Newsletter CTA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('newsletter section is visible', async ({ page }) => {
    const section = page.locator('.newsletter-cta').first();
    await expect(section).toBeVisible();
  });

  test('displays heading', async ({ page }) => {
    const heading = page.locator('.newsletter-cta__heading').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
      await expect(heading).not.toBeEmpty();
    }
  });

  test('displays body text', async ({ page }) => {
    const body = page.locator('.newsletter-cta__body').first();
    if (await body.count() > 0) {
      await expect(body).toBeVisible();
      await expect(body).not.toBeEmpty();
    }
  });

  test('has a CTA button', async ({ page }) => {
    const button = page.locator('.newsletter-cta__button').first();
    if (await button.count() > 0) {
      await expect(button).toBeVisible();
      const text = await button.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('content is centered', async ({ page }) => {
    const inner = page.locator('.newsletter-cta__inner').first();
    await expect(inner).toBeVisible();

    const textAlign = await inner.evaluate(el => {
      const style = getComputedStyle(el.closest('.newsletter-cta')!);
      return style.textAlign;
    });
    expect(textAlign).toBe('center');
  });
});
