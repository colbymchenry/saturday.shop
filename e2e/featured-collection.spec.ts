import { test, expect } from '@playwright/test';

test.describe('Featured collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('product cards are visible in the carousel', async ({ page }) => {
    const carousel = page.locator('product-carousel').first();
    await expect(carousel).toBeVisible();

    const cards = carousel.locator('.product-card');
    await expect(cards.first()).toBeVisible();
  });

  test('carousel arrows navigate between cards', async ({ page }) => {
    const carousel = page.locator('product-carousel').first();
    const track = carousel.locator('.featured-collection__track');

    const scrollBefore = await track.evaluate(el => el.scrollLeft);
    await carousel.locator('.featured-collection__arrow--next').click();

    // Wait for smooth scroll
    await page.waitForTimeout(500);
    const scrollAfter = await track.evaluate(el => el.scrollLeft);
    expect(scrollAfter).toBeGreaterThan(scrollBefore);
  });

  test('product card shows quick-add on hover', async ({ page }) => {
    const card = page.locator('product-card').first();
    const quickAdd = card.locator('.product-card__quick-add');

    // Quick-add should be hidden initially (opacity 0)
    await expect(quickAdd).toBeAttached();

    // Hover to reveal
    await card.hover();
    await expect(quickAdd).toHaveCSS('opacity', '1');
  });

  test('custom dropdown opens upward on click', async ({ page }) => {
    const card = page.locator('product-card').first();
    await card.hover();

    const dropdown = card.locator('.product-card__dropdown').first();
    const trigger = dropdown.locator('.product-card__dropdown-trigger');
    const menu = dropdown.locator('.product-card__dropdown-menu');

    // Menu should be hidden
    await expect(menu).toBeHidden();

    // Click trigger to open
    await trigger.click();
    await expect(menu).toBeVisible();
    await expect(dropdown).toHaveClass(/product-card__dropdown--open/);

    // Menu should be positioned above the trigger (bottom: 100%)
    const menuBox = await menu.boundingBox();
    const triggerBox = await trigger.boundingBox();
    if (menuBox && triggerBox) {
      expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(triggerBox.y + 2);
    }
  });

  test('custom dropdown selects a value and closes', async ({ page }) => {
    const card = page.locator('product-card').first();
    await card.hover();

    const dropdown = card.locator('.product-card__dropdown').first();
    const trigger = dropdown.locator('.product-card__dropdown-trigger');

    const initialValue = await trigger.locator('span').textContent();

    // Open dropdown
    await trigger.click();

    // Click a different option
    const items = dropdown.locator('.product-card__dropdown-item');
    const secondItem = items.nth(1);
    const secondValue = await secondItem.getAttribute('data-value');
    await secondItem.click();

    // Menu should close
    await expect(dropdown.locator('.product-card__dropdown-menu')).toBeHidden();

    // Trigger should show new value
    const newValue = await trigger.locator('span').textContent();
    expect(newValue?.trim()).toBe(secondValue);
  });

  test('dropdown items highlight on hover', async ({ page }) => {
    const card = page.locator('product-card').first();
    await card.hover();

    const dropdown = card.locator('.product-card__dropdown').first();
    await dropdown.locator('.product-card__dropdown-trigger').click();

    const item = dropdown.locator('.product-card__dropdown-item').first();
    await item.hover();

    // Should have a non-transparent background on hover
    const bg = await item.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('clicking outside closes dropdown', async ({ page }) => {
    const card = page.locator('product-card').first();
    await card.hover();

    const dropdown = card.locator('.product-card__dropdown').first();
    await dropdown.locator('.product-card__dropdown-trigger').click();
    await expect(dropdown.locator('.product-card__dropdown-menu')).toBeVisible();

    // Click outside
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(dropdown.locator('.product-card__dropdown-menu')).toBeHidden();
  });

  test('image arrows cycle through product images', async ({ page }) => {
    // Find a card with image arrows (needs multiple images)
    const card = page.locator('product-card').filter({
      has: page.locator('.product-card__img-arrow'),
    }).first();

    // Skip if no cards have multiple images
    if (await card.count() === 0) {
      test.skip();
      return;
    }

    await card.hover();

    const firstSlide = card.locator('.product-card__image-slide').first();
    await expect(firstSlide).toHaveClass(/product-card__image-slide--active/);

    await card.locator('.product-card__img-arrow--next').click();

    // First slide should no longer be active
    await expect(firstSlide).not.toHaveClass(/product-card__image-slide--active/);
  });
});
