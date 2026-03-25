import { test, expect } from '@playwright/test';

test.describe('Collection cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('collection cards section is visible', async ({ page }) => {
    const section = page.locator('.collection-cards').first();
    await expect(section).toBeVisible();
  });

  test('renders cards in a grid', async ({ page }) => {
    const grid = page.locator('.collection-cards__grid').first();
    await expect(grid).toBeVisible();

    const display = await grid.evaluate(el => getComputedStyle(el).display);
    expect(display).toBe('grid');
  });

  test('cards have title and shop button', async ({ page }) => {
    const cards = page.locator('.collection-card');
    expect(await cards.count()).toBeGreaterThan(0);

    const first = cards.first();
    const title = first.locator('.collection-card__title');
    if (await title.count() > 0) {
      await expect(title).toBeVisible();
    }

    const button = first.locator('.collection-card__button');
    await expect(button).toBeVisible();
  });

  test('cards have background images or placeholders', async ({ page }) => {
    const card = page.locator('.collection-card').first();
    const imageContainer = card.locator('.collection-card__image');
    await expect(imageContainer).toBeAttached();

    const hasImg = await imageContainer.locator('img').count() > 0;
    const hasSvg = await imageContainer.locator('svg').count() > 0;
    expect(hasImg || hasSvg).toBe(true);
  });

  test('cards have gradient overlay', async ({ page }) => {
    const overlay = page.locator('.collection-card__overlay').first();
    await expect(overlay).toBeAttached();
  });

  test('cards are clickable links', async ({ page }) => {
    const card = page.locator('.collection-card').first();
    const tagName = await card.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('a');
  });
});
