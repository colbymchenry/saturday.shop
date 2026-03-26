import { test, expect } from '@playwright/test';

test.describe('Collection page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collections/alabama');
  });

  test('school header is visible with name and slogan', async ({ page }) => {
    const header = page.locator('.school-header');
    await expect(header).toBeVisible();

    const name = header.locator('.school-header__name');
    await expect(name).toBeVisible();
    await expect(name).not.toBeEmpty();

    const slogan = header.locator('.school-header__slogan');
    await expect(slogan).toBeVisible();
    await expect(slogan).not.toBeEmpty();
  });

  test('school header has logo in ring', async ({ page }) => {
    const logoRing = page.locator('.school-header__logo-ring');
    await expect(logoRing).toBeVisible();

    const logo = logoRing.locator('.school-header__logo');
    await expect(logo).toBeVisible();
  });

  test('school header has diagonal stripe pattern', async ({ page }) => {
    const stripes = page.locator('.school-header__stripes');
    await expect(stripes).toBeAttached();
  });

  test('school header uses school primary color', async ({ page }) => {
    const header = page.locator('.school-header');
    const borderColor = await header.evaluate(el => getComputedStyle(el).borderTopColor);
    // Alabama's #9e1b32 → rgb(158, 27, 50)
    expect(borderColor).toContain('158');
  });

  test('breadcrumbs show Home / Conference / School', async ({ page }) => {
    const breadcrumbs = page.locator('.collection__breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    const text = await breadcrumbs.textContent();
    expect(text).toContain('Home');
    expect(text).toContain('SEC');
    expect(text).toContain('Alabama');
  });

  test('product count is displayed', async ({ page }) => {
    const count = page.locator('.collection__count');
    await expect(count).toBeVisible();
    const text = await count.textContent();
    expect(text).toMatch(/\d+ products?/);
  });

  test('sort dropdown opens and shows options', async ({ page }) => {
    const trigger = page.locator('.collection__sort-trigger');
    await expect(trigger).toBeVisible();

    await trigger.click();
    const menu = page.locator('.collection__sort-menu');
    await expect(menu).toBeVisible();

    const items = menu.locator('.collection__sort-item');
    expect(await items.count()).toBe(5);
  });

  test('product cards are visible in grid', async ({ page }) => {
    const grid = page.locator('.collection__grid');
    await expect(grid).toBeVisible();

    const cards = grid.locator('product-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  test('product cards have image, title, and price', async ({ page }) => {
    const card = page.locator('product-card').first();
    await expect(card.locator('.product-card__media img').first()).toBeVisible();
    await expect(card.locator('.product-card__title')).not.toBeEmpty();
    await expect(card.locator('.product-card__current-price')).not.toBeEmpty();
  });

  test('product cards link to product pages', async ({ page }) => {
    const link = page.locator('product-card').first().locator('.product-card__title a');
    const href = await link.getAttribute('href');
    expect(href).toContain('/products/');
  });

  test('product cards have add-to-cart button', async ({ page }) => {
    const card = page.locator('product-card').first();
    const addToCart = card.locator('.product-card__add-to-cart');
    expect(await addToCart.count()).toBeGreaterThanOrEqual(1);
  });

  test('grid uses 4-column layout on desktop', async ({ page }) => {
    const grid = page.locator('.collection__grid');
    const columns = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    const colCount = columns.split(' ').length;
    expect(colCount).toBe(4);
  });

  test('product card shows quick-add on hover', async ({ page }) => {
    const card = page.locator('product-card').first();
    const quickAdd = card.locator('.product-card__quick-add');
    await expect(quickAdd).toBeAttached();

    await card.hover();
    await expect(quickAdd).toHaveCSS('opacity', '1');
  });
});
