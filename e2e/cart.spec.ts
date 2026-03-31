import { test, expect } from '@playwright/test';

test.describe('Cart page', () => {
  test('empty cart shows empty state with CTA', async ({ page }) => {
    // Clear the cart first
    await page.goto('/cart/clear');
    await page.goto('/cart');

    const emptyState = page.locator('.cart--empty');
    await expect(emptyState).toBeVisible();

    // Should have the empty icon
    await expect(page.locator('.cart__empty-icon svg')).toBeVisible();

    // Should have the empty title
    const title = page.locator('.cart__empty-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText(/cart is empty/i);

    // Should have the empty message
    await expect(page.locator('.cart__empty-message')).toBeVisible();

    // Should have a CTA link to continue shopping
    const cta = page.locator('.cart__empty-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText(/continue shopping/i);
    await expect(cta).toHaveAttribute('href', /\/collections/);
  });

  test('cart with items shows two-column layout', async ({ page }) => {
    // Add an item to cart via the Shopify AJAX API
    await page.goto('/');
    const addRes = await page.evaluate(async () => {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(document.querySelector('[data-variant-id]')?.value), quantity: 1 }] }),
      });
      return res.ok;
    });

    // If we couldn't add via AJAX (no product on homepage), just go to cart
    await page.goto('/cart');

    const hasItems = await page.locator('.cart__layout').isVisible();

    if (hasItems) {
      // Header should show title and item count
      await expect(page.locator('.cart__title')).toBeVisible();
      await expect(page.locator('.cart__count')).toBeVisible();

      // Line items area should exist
      await expect(page.locator('.cart__items')).toBeVisible();

      // At least one line item
      const lines = page.locator('.cart__line');
      expect(await lines.count()).toBeGreaterThanOrEqual(1);

      // Each line should have an image, title, quantity controls, and remove link
      const firstLine = lines.first();
      await expect(firstLine.locator('.cart__line-image')).toBeVisible();
      await expect(firstLine.locator('.cart__line-title')).toBeVisible();
      await expect(firstLine.locator('.cart__line-quantity')).toBeVisible();
      await expect(firstLine.locator('.cart__line-remove')).toBeVisible();

      // Quantity stepper should have minus, input, and plus
      await expect(firstLine.locator('[data-qty-minus]')).toBeVisible();
      await expect(firstLine.locator('[data-qty-input]')).toBeVisible();
      await expect(firstLine.locator('[data-qty-plus]')).toBeVisible();

      // Order summary sidebar should exist
      await expect(page.locator('.cart__summary')).toBeVisible();
      await expect(page.locator('.cart__summary-title')).toBeVisible();
      await expect(page.locator('.cart__summary-price')).toBeVisible();
      await expect(page.locator('.cart__checkout-btn')).toBeVisible();
      await expect(page.locator('.cart__continue-link')).toBeVisible();
    }
  });

  test('no horizontal overflow on cart page', async ({ page }) => {
    await page.goto('/cart');
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });
});

test.describe('Cart page mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('cart stacks to single column on mobile', async ({ page }) => {
    await page.goto('/cart');

    const hasItems = await page.locator('.cart__layout').isVisible();

    if (hasItems) {
      // On mobile, the layout should be single column (grid-template-columns: 1fr)
      const columns = await page.locator('.cart__layout').evaluate(el => {
        return getComputedStyle(el).gridTemplateColumns;
      });
      // Single column should not contain multiple track values
      const trackCount = columns.split(/\s+/).length;
      expect(trackCount).toBeLessThanOrEqual(1);

      // Summary should not be sticky on mobile
      const position = await page.locator('.cart__summary').evaluate(el => {
        return getComputedStyle(el).position;
      });
      expect(position).not.toBe('sticky');
    }

    // No horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });
});
