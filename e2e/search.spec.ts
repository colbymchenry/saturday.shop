import { test, expect } from '@playwright/test';

test.describe('Search page', () => {
  test('search page loads with search input', async ({ page }) => {
    await page.goto('/search');
    const input = page.locator('.search-page__input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('type', 'search');
  });

  test('search input has Lucide search icon', async ({ page }) => {
    await page.goto('/search');
    const icon = page.locator('.search-page__icon');
    await expect(icon).toBeVisible();
  });

  test('search returns product results in a grid', async ({ page }) => {
    await page.goto('/search?q=a');
    const grid = page.locator('.search-results__grid');
    await expect(grid).toBeVisible();
    const cards = grid.locator('product-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  test('product cards have image, title, and price', async ({ page }) => {
    await page.goto('/search?q=a');
    const card = page.locator('product-card').first();
    await expect(card.locator('.product-card__media img').first()).toBeVisible();
    await expect(card.locator('.product-card__title')).not.toBeEmpty();
    await expect(card.locator('.product-card__current-price')).not.toBeEmpty();
  });

  test('product cards link to product pages', async ({ page }) => {
    await page.goto('/search?q=a');
    const link = page.locator('product-card').first().locator('.product-card__title a');
    const href = await link.getAttribute('href');
    expect(href).toContain('/products/');
  });

  test('product cards have add-to-cart button', async ({ page }) => {
    await page.goto('/search?q=a');
    const card = page.locator('product-card').first();
    const addToCart = card.locator('.product-card__add-to-cart');
    expect(await addToCart.count()).toBeGreaterThanOrEqual(1);
  });

  test('product cards have variant dropdowns when multiple variants exist', async ({ page }) => {
    await page.goto('/search?q=a');
    const cards = page.locator('product-card');
    const count = await cards.count();
    let foundDropdown = false;
    for (let i = 0; i < count; i++) {
      const dropdowns = cards.nth(i).locator('.product-card__dropdown');
      if (await dropdowns.count() > 0) {
        foundDropdown = true;
        break;
      }
    }
    expect(foundDropdown).toBe(true);
  });

  test('product cards have variant data for JS interaction', async ({ page }) => {
    await page.goto('/search?q=a');
    const card = page.locator('product-card').first();
    const variantScript = card.locator('script[data-variants]');
    expect(await variantScript.count()).toBe(1);
  });

  test('product grid uses 4-column layout on desktop', async ({ page }) => {
    await page.goto('/search?q=a');
    const grid = page.locator('.search-results__grid');
    const columns = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    const colCount = columns.split(' ').length;
    expect(colCount).toBe(4);
  });

  test('non-product results show type badge and title', async ({ page }) => {
    await page.goto('/search?q=a');
    const pageResults = page.locator('.search-page-result');
    if (await pageResults.count() > 0) {
      const first = pageResults.first();
      await expect(first.locator('.search-page-result__type')).not.toBeEmpty();
      await expect(first.locator('.search-page-result__title')).not.toBeEmpty();
    }
  });

  test('no results message shows for nonsense query', async ({ page }) => {
    await page.goto('/search?q=zzzzxqwerty');
    const empty = page.locator('.search-page__empty-message');
    await expect(empty).toBeVisible();
  });

  test('footer is at bottom of page on search with few results', async ({ page }) => {
    await page.goto('/search');
    const footer = page.locator('footer');
    const footerBox = await footer.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 720;
    expect(footerBox).not.toBeNull();
    if (footerBox) {
      expect(footerBox.y + footerBox.height).toBeGreaterThanOrEqual(viewportHeight - 1);
    }
  });
});
