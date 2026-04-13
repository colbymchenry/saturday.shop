import { test, expect, type Page } from '@playwright/test';

const AUBURN_PRODUCT =
  '/products/auburn-pearl-freeze-25-comfort-colors-t-shirt-unisex';

const MOBILE_VIEWPORT = { width: 375, height: 667 };

async function waitForFbt(page: Page) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector('frequently-bought');
      return el && !el.hidden;
    },
    { timeout: 10000 }
  );
}

test.describe('Frequently Bought Together', () => {
  test('section renders with companions', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    await expect(page.locator('frequently-bought')).toBeVisible();
  });

  test('has centered heading', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const title = page.locator('.fbt__title');
    await expect(title).toBeVisible();
    await expect(title).toContainText(/frequently bought together/i);
  });

  test('shows current product plus 2 companions (3 items total)', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const items = page.locator('[data-fbt-item]');
    await expect(items).toHaveCount(3);
  });

  test('each row has a thumbnail image', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const thumbs = page.locator('.fbt__thumb');
    await expect(thumbs).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(thumbs.nth(i)).toBeVisible();
    }
  });

  test('each row shows product title and price', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const items = page.locator('[data-fbt-item]');
    for (let i = 0; i < 3; i++) {
      const item = items.nth(i);
      await expect(item.locator('.fbt__product-title')).toBeVisible();
      const price = await item.locator('[data-fbt-price]').textContent();
      expect(price).toMatch(/\$\d+/);
    }
  });

  test('all checkboxes are checked by default', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const checkboxes = page.locator('.fbt__checkbox--checked');
    await expect(checkboxes).toHaveCount(3);
  });

  test('clicking a checkbox unchecks it and updates total', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const totalBefore = await page
      .locator('[data-fbt-total]')
      .textContent();

    const secondRec = page.locator('[data-fbt-item]').nth(2);
    await secondRec.locator('[data-fbt-checkbox]').click();

    await expect(
      secondRec.locator('.fbt__checkbox--checked')
    ).toHaveCount(0);

    await expect(page.locator('[data-fbt-count]')).toContainText('2');

    const totalAfter = await page
      .locator('[data-fbt-total]')
      .textContent();
    const priceBefore = parseFloat(totalBefore!.replace('$', ''));
    const priceAfter = parseFloat(totalAfter!.replace('$', ''));
    expect(priceAfter).toBeLessThan(priceBefore);
  });

  test('clicking unchecked checkbox re-checks it', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const item = page.locator('[data-fbt-item]').nth(1);
    const cb = item.locator('[data-fbt-checkbox]');

    await cb.click();
    await expect(item.locator('.fbt__checkbox--checked')).toHaveCount(0);

    await cb.click();
    await expect(item.locator('.fbt__checkbox--checked')).toHaveCount(1);
  });

  test('total price and ADD ALL button are visible', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    await expect(page.locator('.fbt__total-label')).toContainText(
      /total price/i
    );
    const total = await page.locator('[data-fbt-total]').textContent();
    expect(total).toMatch(/\$\d+/);

    const btn = page.locator('.fbt__add-all');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText(/ADD ALL.*TO CART/i);
  });

  test('no horizontal overflow', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });
});

test.describe('FBT — compact list layout', () => {
  test('items use vertical column layout, not side-by-side cards', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const direction = await page
      .locator('.fbt__products')
      .evaluate((el) => getComputedStyle(el).flexDirection);
    expect(direction).toBe('column');
  });

  test('no old-layout elements present (plus signs, product-card, rule)', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    await expect(page.locator('.fbt__plus')).toHaveCount(0);
    await expect(page.locator('frequently-bought product-card')).toHaveCount(0);
    await expect(page.locator('.fbt__rule')).toHaveCount(0);
    await expect(page.locator('.fbt__item-label')).toHaveCount(0);
  });

  test('each item has checkbox, thumbnail, and details in a row', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const items = page.locator('[data-fbt-item]');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      await expect(item.locator('[data-fbt-checkbox]')).toBeAttached();
      await expect(item.locator('.fbt__thumb')).toBeAttached();
      await expect(item.locator('.fbt__details')).toBeAttached();
    }
  });

  test('product titles have overflow protection', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const title = page.locator('.fbt__product-title').first();
    const overflow = await title.evaluate((el) => {
      const s = getComputedStyle(el);
      return { overflow: s.overflow, textOverflow: s.textOverflow, whiteSpace: s.whiteSpace };
    });
    expect(overflow.textOverflow).toBe('ellipsis');
    expect(overflow.whiteSpace).toBe('nowrap');
  });
});

test.describe('FBT — mobile viewport', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('section renders at mobile width', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    await expect(page.locator('frequently-bought')).toBeVisible();
    const items = page.locator('[data-fbt-item]');
    await expect(items).toHaveCount(3);
  });

  test('add-all button spans full width on mobile', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const btn = page.locator('.fbt__add-all');
    const btnBox = await btn.boundingBox();
    const viewportWidth = page.viewportSize()!.width;

    expect(btnBox).not.toBeNull();
    expect(btnBox!.width).toBeGreaterThan(viewportWidth * 0.8);
  });

  test('no horizontal overflow at mobile width', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test('checkbox toggle updates total at mobile width', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const totalBefore = await page.locator('[data-fbt-total]').textContent();
    await page.locator('[data-fbt-item]').nth(1).locator('[data-fbt-checkbox]').click();
    const totalAfter = await page.locator('[data-fbt-total]').textContent();

    expect(parseFloat(totalAfter!.replace('$', ''))).toBeLessThan(
      parseFloat(totalBefore!.replace('$', ''))
    );
  });
});
