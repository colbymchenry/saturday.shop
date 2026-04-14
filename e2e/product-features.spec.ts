import { test, expect } from '@playwright/test';

const AUBURN_PRODUCT =
  '/products/freeze-pearl-wde-maga-comfort-colors-t-shirt-multicolor-unisex';

test.describe('Product Features section', () => {
  test('renders below the product section', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const features = page.locator('.product-features');
    await expect(features).toBeVisible();

    // Should appear after the product section
    const productBox = await page.locator('product-page').boundingBox();
    const featuresBox = await features.boundingBox();
    expect(productBox).toBeTruthy();
    expect(featuresBox).toBeTruthy();
    expect(featuresBox!.y).toBeGreaterThan(productBox!.y);
  });

  test('has cream/gray background', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const bg = await page
      .locator('.product-features')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    // Should not be white/transparent — it's a cream/gray tone
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('transparent');
  });

  test('heading displays two lines with accent on second line', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);

    const heading = page.locator('.product-features__heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Built Different.');

    const accent = page.locator('.product-features__heading-accent');
    await expect(accent).toBeVisible();
    await expect(accent).toContainText('Worn Proud.');
  });

  test('accent line uses school primary color', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const schoolColor = await page
      .locator('.product-features')
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue('--school-primary').trim()
      );
    expect(schoolColor).toBeTruthy();

    const accentColor = await page
      .locator('.product-features__heading-accent')
      .evaluate((el) => getComputedStyle(el).color);
    // Should not be the default body text color
    expect(accentColor).toBeTruthy();
    expect(accentColor).not.toBe('rgb(0, 0, 0)');
  });

  test('description text is present', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const desc = page.locator('.product-features__description');
    await expect(desc).toBeVisible();
    const text = await desc.textContent();
    expect(text!.length).toBeGreaterThan(20);
  });

  test('header is two-column on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const header = page.locator('.product-features__header');
    const columns = await header.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns
    );
    const colWidths = columns.split(' ').filter((c) => c.endsWith('px'));
    expect(colWidths.length).toBe(2);
  });

  test('shows 3 feature items', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const items = page.locator('.product-features__item');
    await expect(items).toHaveCount(3);
  });

  test('each feature has icon, title, and subtitle', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const items = page.locator('.product-features__item');
    for (let i = 0; i < 3; i++) {
      const item = items.nth(i);
      await expect(item.locator('.product-features__icon svg')).toBeVisible();
      await expect(item.locator('.product-features__item-title')).toBeVisible();
      await expect(item.locator('.product-features__item-text')).toBeVisible();
    }
  });

  test('feature titles match expected values', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const titles = page.locator('.product-features__item-title');
    await expect(titles.nth(0)).toContainText(/pre-washed/i);
    await expect(titles.nth(1)).toContainText(/heavyweight/i);
    await expect(titles.nth(2)).toContainText(/officially licensed/i);
  });

  test('features are laid out in a row on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const grid = page.locator('.product-features__grid');
    const display = await grid.evaluate(
      (el) => getComputedStyle(el).display
    );
    expect(display).toBe('flex');

    const items = page.locator('.product-features__item');
    await expect(items).toHaveCount(3);
  });

  test('feature items are on the same row on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const items = page.locator('.product-features__item');
    const firstBox = await items.nth(0).boundingBox();
    const secondBox = await items.nth(1).boundingBox();
    const thirdBox = await items.nth(2).boundingBox();

    expect(firstBox).toBeTruthy();
    expect(secondBox).toBeTruthy();
    expect(thirdBox).toBeTruthy();
    // All on the same Y line (within 5px tolerance)
    expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThan(5);
    expect(Math.abs(secondBox!.y - thirdBox!.y)).toBeLessThan(5);
  });

  test('icons have rounded border', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const icon = page.locator('.product-features__icon').first();
    const radius = await icon.evaluate(
      (el) => getComputedStyle(el).borderRadius
    );
    expect(radius).not.toBe('0px');
  });

  test('no horizontal overflow', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });
});
