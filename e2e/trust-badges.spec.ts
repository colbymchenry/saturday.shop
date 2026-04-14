import { test, expect } from '@playwright/test';

const AUBURN_PRODUCT =
  '/products/freeze-pearl-wde-maga-comfort-colors-t-shirt-multicolor-unisex';

// ─── Product Page Trust Badges ──────────────────────────────────────────────

test.describe('Product page — Trust Badges', () => {
  test('badges container renders below ATC button', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const badges = page.locator('.product__trust-badges');
    await expect(badges).toBeVisible();

    const atcBox = await page.locator('.product__add-to-cart').boundingBox();
    const badgesBox = await badges.boundingBox();
    expect(atcBox).toBeTruthy();
    expect(badgesBox).toBeTruthy();
    expect(badgesBox!.y).toBeGreaterThan(atcBox!.y);
  });

  test('renders 4 trust badge blocks', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const items = page.locator('.product__trust-badge');
    await expect(items).toHaveCount(4);
  });

  test('each badge has an icon and non-empty label', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const items = page.locator('.product__trust-badge');
    for (let i = 0; i < 4; i++) {
      const item = items.nth(i);
      await expect(item.locator('.product__trust-badge-icon')).toBeVisible();
      const label = item.locator('.product__trust-badge-label');
      await expect(label).toBeVisible();
      const text = await label.textContent();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });

  test('badges are horizontal on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const container = page.locator('.product__trust-badges');
    const direction = await container.evaluate(
      (el) => getComputedStyle(el).flexDirection
    );
    expect(direction).toBe('row');

    const items = page.locator('.product__trust-badge');
    const firstBox = await items.nth(0).boundingBox();
    const lastBox = await items.nth(3).boundingBox();
    expect(firstBox).toBeTruthy();
    expect(lastBox).toBeTruthy();
    expect(Math.abs(firstBox!.y - lastBox!.y)).toBeLessThan(5);
  });

  test('badges stack vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(AUBURN_PRODUCT);

    const container = page.locator('.product__trust-badges');
    const direction = await container.evaluate(
      (el) => getComputedStyle(el).flexDirection
    );
    expect(direction).toBe('column');
  });

  test('badges appear between ATC and accordions in DOM order', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);

    const order = await page.evaluate(() => {
      const info = document.querySelector('.product__info');
      if (!info) return [];
      const nodes: string[] = [];
      for (const child of info.children) {
        if (child.matches('form')) nodes.push('form');
        else if (child.matches('.product__trust-badges'))
          nodes.push('trust-badges');
        else if (child.matches('.product__accordions'))
          nodes.push('accordions');
      }
      return nodes;
    });

    const formIdx = order.indexOf('form');
    const badgesIdx = order.indexOf('trust-badges');
    const accordionsIdx = order.indexOf('accordions');

    expect(formIdx).toBeGreaterThanOrEqual(0);
    expect(badgesIdx).toBeGreaterThanOrEqual(0);
    expect(accordionsIdx).toBeGreaterThanOrEqual(0);
    expect(badgesIdx).toBeGreaterThan(formIdx);
    expect(badgesIdx).toBeLessThan(accordionsIdx);
  });
});

// ─── Cart Page Trust Badges ─────────────────────────────────────────────────

test.describe('Cart page — Trust Badges', () => {
  test('badges render on cart page', async ({ page }) => {
    await page.goto('/cart');

    const badges = page.locator('.trust-badges');
    await expect(badges).toBeVisible();
  });

  test('renders 4 badges on cart page', async ({ page }) => {
    await page.goto('/cart');

    const items = page.locator('.trust-badges__item');
    await expect(items).toHaveCount(4);
  });

  test('each cart badge has icon and non-empty label', async ({ page }) => {
    await page.goto('/cart');

    const items = page.locator('.trust-badges__item');
    for (let i = 0; i < 4; i++) {
      const item = items.nth(i);
      await expect(item.locator('.trust-badges__icon')).toBeVisible();
      const label = item.locator('.trust-badges__label');
      await expect(label).toBeVisible();
      const text = await label.textContent();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });
});
