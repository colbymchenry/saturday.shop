import { test, expect, type Page } from '@playwright/test';

const AUBURN_PRODUCT =
  '/products/freeze-pearl-wde-maga-comfort-colors-t-shirt-multicolor-unisex';

/** Wait for the FBT section to load recommendations and become visible */
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
  test('section renders with recommendations', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    await expect(page.locator('frequently-bought')).toBeVisible();
  });

  test('has centered heading with underline rule', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const title = page.locator('.fbt__title');
    await expect(title).toBeVisible();
    await expect(title).toContainText(/frequently bought together/i);

    const rule = page.locator('.fbt__rule');
    await expect(rule).toBeVisible();
  });

  test('shows current product plus 2 recommendations (3 items total)', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const items = page.locator('[data-fbt-item]');
    await expect(items).toHaveCount(3);
  });

  test('current product has "This item" label', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const currentItem = page.locator('.fbt__item--current');
    await expect(currentItem).toBeVisible();
    await expect(currentItem.locator('.fbt__item-label')).toContainText(
      /this item/i
    );
  });

  test('plus signs appear between cards', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const plusSigns = page.locator('.fbt__plus');
    await expect(plusSigns).toHaveCount(2);
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

    // Uncheck the second recommendation
    const secondRec = page.locator('[data-fbt-item]').nth(2);
    await secondRec.locator('[data-fbt-checkbox]').click();

    // Checkbox should be unchecked
    await expect(
      secondRec.locator('.fbt__checkbox--checked')
    ).toHaveCount(0);

    // Count should update
    await expect(page.locator('[data-fbt-count]')).toContainText('2');

    // Total should decrease
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

    // Uncheck
    await cb.click();
    await expect(item.locator('.fbt__checkbox--checked')).toHaveCount(0);

    // Re-check
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

  test('each item uses the shared product-card snippet', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForFbt(page);

    const items = page.locator('[data-fbt-item]');
    for (let i = 0; i < 3; i++) {
      const item = items.nth(i);
      // Each item should contain a product-card element with standard classes
      await expect(item.locator('product-card')).toBeAttached();
      await expect(item.locator('.product-card__media')).toBeVisible();
      await expect(item.locator('.product-card__title')).toBeVisible();
      await expect(item.locator('.product-card__current-price')).toBeVisible();
    }
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
