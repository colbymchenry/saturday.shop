import { test, expect } from '@playwright/test';

const PRODUCT_PATH =
  '/products/freeze-pearl-wde-maga-comfort-colors-t-shirt-multicolor-unisex';

function parseRgb(rgb: string): [number, number, number] {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) throw new Error(`Unexpected color format: ${rgb}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isNearWhite(rgb: string, tolerance = 3): boolean {
  const [r, g, b] = parseRgb(rgb);
  return r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
}

async function getBackgroundColor(
  page: import('@playwright/test').Page,
  selector: string,
): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);
}

test.describe('Page background color', () => {
  test('homepage body has non-white background', async ({ page }) => {
    await page.goto('/');
    const bg = await getBackgroundColor(page, 'body');
    expect(isNearWhite(bg)).toBe(false);
  });

  test('collection page body has non-white background', async ({ page }) => {
    await page.goto('/collections/alabama');
    const bg = await getBackgroundColor(page, 'body');
    expect(isNearWhite(bg)).toBe(false);
  });

  test('product page body has non-white background', async ({ page }) => {
    await page.goto(PRODUCT_PATH);
    await page.waitForLoadState('domcontentloaded');
    const bg = await getBackgroundColor(page, 'body');
    expect(isNearWhite(bg)).toBe(false);
  });

  test('sticky header background matches body background', async ({ page }) => {
    await page.goto('/');
    const bodyBg = await getBackgroundColor(page, 'body');
    const headerBg = await getBackgroundColor(
      page,
      '.shopify-section-group-header-group',
    );
    expect(headerBg).toBe(bodyBg);
  });

  test('background is consistent across pages', async ({ page }) => {
    await page.goto('/');
    const homeBg = await getBackgroundColor(page, 'body');

    await page.goto('/collections/alabama');
    const collectionBg = await getBackgroundColor(page, 'body');
    expect(collectionBg).toBe(homeBg);

    await page.goto(PRODUCT_PATH);
    await page.waitForLoadState('domcontentloaded');
    const productBg = await getBackgroundColor(page, 'body');
    expect(productBg).toBe(homeBg);
  });

  test('--color-background variable stays white for component contrast', async ({
    page,
  }) => {
    await page.goto('/');
    const raw = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-background')
        .trim(),
    );
    const el = await page.evaluate((val) => {
      const d = document.createElement('div');
      d.style.backgroundColor = val;
      document.body.appendChild(d);
      const bg = getComputedStyle(d).backgroundColor;
      d.remove();
      return bg;
    }, raw);
    expect(isNearWhite(el)).toBe(true);
  });
});
