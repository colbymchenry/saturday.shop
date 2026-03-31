import { test, expect } from '@playwright/test';

const policyPages = [
  { path: '/policies/privacy-policy', title: 'Privacy policy' },
  { path: '/policies/refund-policy', title: 'Refund policy' },
  { path: '/policies/shipping-policy', title: 'Shipping policy' },
  { path: '/policies/terms-of-service', title: 'Terms of service' },
];

for (const policy of policyPages) {
  test.describe(`Policy page: ${policy.title}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(policy.path);
    });

    test('policy container is visible', async ({ page }) => {
      const container = page.locator('.shopify-policy__container');
      await expect(container).toBeVisible();
    });

    test('title section displays policy name', async ({ page }) => {
      const title = page.locator('.shopify-policy__title h1');
      await expect(title).toBeVisible();
      await expect(title).not.toBeEmpty();
    });

    test('content is narrower than viewport', async ({ page }) => {
      const container = page.locator('.shopify-policy__container');
      const box = await container.boundingBox();
      expect(box).not.toBeNull();
      const viewport = page.viewportSize();
      expect(box!.width).toBeLessThan(viewport!.width);
    });

    test('policy body exists', async ({ page }) => {
      const body = page.locator('.shopify-policy__body');
      await expect(body).toBeAttached();
    });

    test('body text uses muted color', async ({ page }) => {
      const body = page.locator('.shopify-policy__body');
      const color = await body.evaluate(el => getComputedStyle(el).color);
      // --color-muted: #666666 = rgb(102, 102, 102)
      expect(color).toBe('rgb(102, 102, 102)');
    });
  });
}
