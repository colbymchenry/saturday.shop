import { test, expect, Page } from '@playwright/test';

async function ensureCarouselVisible(page: Page) {
  const section = page.locator('.featured-collection').first();
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveClass(/carousel--visible/, { timeout: 5000 });
  const firstCard = section.locator('.product-card').first();
  await expect(firstCard).toHaveCSS('opacity', '1', { timeout: 2000 });
}

test.describe('Featured collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('scroll-triggered entrance animation reveals cards', async ({ page }) => {
    const section = page.locator('.featured-collection').first();
    const firstCard = section.locator('.product-card').first();

    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveClass(/carousel--visible/, { timeout: 5000 });
    await expect(firstCard).toHaveCSS('opacity', '1', { timeout: 2000 });
  });

  test('product cards are visible in the carousel', async ({ page }) => {
    const carousel = page.locator('product-carousel').first();
    await expect(carousel).toBeVisible();

    await ensureCarouselVisible(page);

    const cards = carousel.locator('.product-card');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toHaveCSS('opacity', '1');
  });

  test('carousel arrows navigate between cards', async ({ page }) => {
    await ensureCarouselVisible(page);

    const carousel = page.locator('product-carousel').first();
    const track = carousel.locator('.featured-collection__track');

    const scrollBefore = await track.evaluate(el => el.scrollLeft);
    await carousel.locator('.featured-collection__arrow--next').click();

    await page.waitForTimeout(500);
    const scrollAfter = await track.evaluate(el => el.scrollLeft);
    expect(scrollAfter).toBeGreaterThan(scrollBefore);
  });

  test('product card shows quick-add on hover', async ({ page }) => {
    await ensureCarouselVisible(page);

    const carousel = page.locator('product-carousel').first();
    const card = carousel.locator('product-card').first();
    const quickAdd = card.locator('.product-card__quick-add');

    await expect(quickAdd).toBeAttached();
    await card.hover();
    await expect(quickAdd).toHaveCSS('opacity', '1');
  });

  test('custom dropdown opens upward on click', async ({ page }) => {
    await ensureCarouselVisible(page);

    const carousel = page.locator('product-carousel').first();
    const card = carousel.locator('product-card').first();
    await card.hover();

    const dropdown = card.locator('.product-card__dropdown').first();
    const trigger = dropdown.locator('.product-card__dropdown-trigger');
    const menu = dropdown.locator('.product-card__dropdown-menu');

    await expect(menu).toBeHidden();
    await trigger.click();
    await expect(menu).toBeVisible();
    await expect(dropdown).toHaveClass(/product-card__dropdown--open/);

    const menuBox = await menu.boundingBox();
    const triggerBox = await trigger.boundingBox();
    if (menuBox && triggerBox) {
      expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(triggerBox.y + 2);
    }
  });

  test('custom dropdown selects a value and closes', async ({ page }) => {
    await ensureCarouselVisible(page);

    const carousel = page.locator('product-carousel').first();
    const card = carousel.locator('product-card').first();
    await card.hover();

    const dropdown = card.locator('.product-card__dropdown').first();
    const trigger = dropdown.locator('.product-card__dropdown-trigger');

    await trigger.click();

    const items = dropdown.locator('.product-card__dropdown-item');
    const secondItem = items.nth(1);
    const secondValue = await secondItem.getAttribute('data-value');
    await secondItem.click();

    await expect(dropdown.locator('.product-card__dropdown-menu')).toBeHidden();

    const newValue = await trigger.locator('span').textContent();
    expect(newValue?.trim()).toBe(secondValue);
  });

  test('dropdown items highlight on hover', async ({ page }) => {
    await ensureCarouselVisible(page);

    const carousel = page.locator('product-carousel').first();
    const card = carousel.locator('product-card').first();
    await card.hover();

    const dropdown = card.locator('.product-card__dropdown').first();
    await dropdown.locator('.product-card__dropdown-trigger').click();

    const item = dropdown.locator('.product-card__dropdown-item').first();
    await item.hover();

    const bg = await item.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('clicking outside closes dropdown', async ({ page }) => {
    await ensureCarouselVisible(page);

    const carousel = page.locator('product-carousel').first();
    const card = carousel.locator('product-card').first();
    await card.hover();

    const dropdown = card.locator('.product-card__dropdown').first();
    await dropdown.locator('.product-card__dropdown-trigger').click();
    await expect(dropdown.locator('.product-card__dropdown-menu')).toBeVisible();

    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(dropdown.locator('.product-card__dropdown-menu')).toBeHidden();
  });

  test('image arrows cycle through product images', async ({ page }) => {
    await ensureCarouselVisible(page);

    const carousel = page.locator('product-carousel').first();
    const card = carousel.locator('product-card').filter({
      has: page.locator('.product-card__img-arrow'),
    }).first();

    if (await card.count() === 0) {
      test.skip();
      return;
    }

    await card.hover();

    const firstSlide = card.locator('.product-card__image-slide').first();
    await expect(firstSlide).toHaveClass(/product-card__image-slide--active/);

    await card.locator('.product-card__img-arrow--next').click();
    await expect(firstSlide).not.toHaveClass(/product-card__image-slide--active/);
  });

  test('cards are properly sized at desktop viewport', async ({ page }) => {
    await ensureCarouselVisible(page);

    const card = page.locator('.featured-collection__track .product-card').first();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(140);
      expect(box.width).toBeLessThanOrEqual(300);
    }
  });

  test('cards are properly sized at tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await ensureCarouselVisible(page);

    const card = page.locator('.featured-collection__track .product-card').first();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(140);
    }
  });

  test('cards are properly sized at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await ensureCarouselVisible(page);

    const card = page.locator('.featured-collection__track .product-card').first();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(140);
    }
  });
});
