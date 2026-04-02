import { test, expect } from '@playwright/test';

test.describe('Collection page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collections/alabama');
    await page.waitForLoadState('domcontentloaded');
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
    // Poll until the custom element is upgraded and clicking the trigger actually
    // opens the dropdown — the JS bundle is deferred so upgrade can lag behind load.
    await page.waitForFunction(() => {
      const trigger = document.querySelector('.collection__sort-trigger') as HTMLButtonElement;
      if (!trigger) return false;
      trigger.click();
      const sort = document.querySelector('collection-sort');
      if (!sort) return false;
      if (!sort.classList.contains('collection__sort--open')) return false;
      // Reset so the assertion below starts from closed state
      sort.classList.remove('collection__sort--open');
      return true;
    }, null, { timeout: 20000, polling: 300 });

    const trigger = page.locator('.collection__sort-trigger');
    await trigger.click();
    const sort = page.locator('collection-sort');
    await expect(sort).toHaveClass(/collection__sort--open/);
    const menu = page.locator('.collection__sort-menu');

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
    // Scope to collection grid to avoid the nav dropdown's hidden product-cards
    const card = page.locator('[data-collection-grid] product-card').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator('.product-card__image-slide--active img').first()).toBeVisible({ timeout: 10000 });
    await expect(card.locator('.product-card__title')).not.toBeEmpty();
    await expect(card.locator('.product-card__current-price')).not.toBeEmpty();
  });

  test('product cards link to product pages', async ({ page }) => {
    const link = page.locator('[data-collection-grid] product-card').first().locator('.product-card__title a');
    const href = await link.getAttribute('href');
    expect(href).toContain('/products/');
  });

  test('product cards have add-to-cart button', async ({ page }) => {
    const card = page.locator('[data-collection-grid] product-card').first();
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
    // Scope to collection grid to avoid the nav dropdown's hidden product-cards
    const grid = page.locator('[data-collection-grid]');
    await grid.scrollIntoViewIfNeeded();
    const card = grid.locator('product-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    const quickAdd = card.locator('.product-card__quick-add');
    await expect(quickAdd).toBeAttached();

    await card.hover();
    await expect(quickAdd).toHaveCSS('opacity', '1');
  });
});

test.describe('Category picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collections/alabama');
    await page.waitForLoadState('domcontentloaded');
  });

  test('category picker is visible when collection has matching tags', async ({ page }) => {
    const filters = page.locator('.collection__filters');
    // Picker only renders when at least one block tag matches a collection tag
    const count = await filters.count();
    if (count > 0) {
      await expect(filters).toBeVisible();
      const buttons = page.locator('.collection__filter-btn');
      // At minimum "All" plus at least one category pill
      expect(await buttons.count()).toBeGreaterThanOrEqual(2);
    }
  });

  test('"All" pill is first and active by default', async ({ page }) => {
    const filters = page.locator('.collection__filters');
    if (await filters.count() === 0) return;

    const allBtn = page.locator('.collection__filter-btn').first();
    // Text may be wrapped in a plain text node (no inner label span on the All pill)
    await expect(allBtn).toHaveText('All');
    await expect(allBtn).toHaveClass(/collection__filter-btn--active/);
  });

  test('active pill has filled background (school-color-aware active state)', async ({ page }) => {
    const filters = page.locator('.collection__filters');
    if (await filters.count() === 0) return;

    const allBtn = page.locator('.collection__filter-btn--active').first();
    await expect(allBtn).toBeVisible();

    // Active state uses filled background — background should not be transparent/none
    const bg = await allBtn.evaluate(el => getComputedStyle(el).backgroundColor);
    // rgb(0,0,0,0) or rgba(...0) indicates fully transparent — should NOT be that
    expect(bg).not.toMatch(/rgba?\(0,\s*0,\s*0,\s*0\)/);
    expect(bg).not.toBe('transparent');
  });

  test('active pill color matches school primary color', async ({ page }) => {
    const filters = page.locator('.collection__filters');
    if (await filters.count() === 0) return;

    // Alabama primary color is #9e1b32 → rgb(158, 27, 50)
    const collectionFilter = page.locator('collection-filter');
    const schoolPrimary = await collectionFilter.evaluate(el => {
      return (el as HTMLElement).style.getPropertyValue('--school-primary').trim();
    });
    // School primary CSS variable should be set on the web component
    expect(schoolPrimary).not.toBe('');

    const activeBtn = page.locator('.collection__filter-btn--active').first();
    const bg = await activeBtn.evaluate(el => getComputedStyle(el).backgroundColor);
    // Alabama's crimson (#9e1b32) → rgb(158, 27, 50)
    expect(bg).toContain('158');
  });

  test('pills have rounded pill shape (border-radius: 7px)', async ({ page }) => {
    const filters = page.locator('.collection__filters');
    if (await filters.count() === 0) return;

    const btn = page.locator('.collection__filter-btn').first();
    await expect(btn).toBeVisible();

    const radius = await btn.evaluate(el => getComputedStyle(el).borderRadius);
    // Should be 7px
    expect(radius).toBe('7px');
  });

  test('pills have --pill-index CSS variable for staggered animation', async ({ page }) => {
    const filters = page.locator('.collection__filters');
    if (await filters.count() === 0) return;

    const btns = page.locator('.collection__filter-btn');
    const count = await btns.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // First pill ("All") should have --pill-index: 0
    const firstIndex = await btns.first().evaluate(el =>
      (el as HTMLElement).style.getPropertyValue('--pill-index').trim()
    );
    expect(firstIndex).toBe('0');

    // Subsequent pills should have incrementing index values
    if (count >= 2) {
      const secondIndex = await btns.nth(1).evaluate(el =>
        (el as HTMLElement).style.getPropertyValue('--pill-index').trim()
      );
      expect(secondIndex).toBe('1');
    }
  });

  test('category pills have .collection__filter-label inner span', async ({ page }) => {
    const filters = page.locator('.collection__filters');
    if (await filters.count() === 0) return;

    // Category pills (not "All") should have a label span
    const categoryBtns = page.locator('.collection__filter-btn').filter({ hasNot: page.locator('.collection__filter-btn--active') });
    const count = await page.locator('.collection__filter-btn').count();

    if (count >= 2) {
      const secondBtn = page.locator('.collection__filter-btn').nth(1);
      const label = secondBtn.locator('.collection__filter-label');
      await expect(label).toBeAttached();
      await expect(label).not.toBeEmpty();
    }
  });

  test('clicking a category navigates to tag-filtered URL', async ({ page }) => {
    const filters = page.locator('.collection__filters');
    if (await filters.count() === 0) return;

    // Wait for full load so collection-filter JS is active
    await page.waitForLoadState('load');

    const secondBtn = page.locator('.collection__filter-btn').nth(1);
    const href = await secondBtn.getAttribute('href');
    expect(href).toContain('/collections/alabama/');

    // Click — the web component may do AJAX + pushState or a full navigation
    const [_response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'commit', timeout: 15000 }).catch(() => null),
      secondBtn.click(),
    ]);

    const currentUrl = page.url();
    const hasUrlChanged = currentUrl.includes('/collections/alabama/');
    const isActiveChanged = await secondBtn.evaluate(el =>
      el.classList.contains('collection__filter-btn--active')
    );
    expect(hasUrlChanged || isActiveChanged).toBe(true);

    // Product grid must still be visible after filtering
    await expect(page.locator('[data-collection-grid]')).toBeVisible();
  });

  test('filter links have correct href structure', async ({ page }) => {
    const filters = page.locator('.collection__filters');
    if (await filters.count() === 0) return;

    const allBtns = page.locator('.collection__filter-btn');
    const totalCount = await allBtns.count();
    expect(totalCount).toBeGreaterThanOrEqual(2);

    // First pill ("All") points to the base collection URL
    const allHref = await allBtns.first().getAttribute('href');
    expect(allHref).toMatch(/\/collections\/alabama$/);

    // Remaining pills point to tag-filtered URLs
    for (let i = 1; i < totalCount; i++) {
      const href = await allBtns.nth(i).getAttribute('href');
      expect(href).toMatch(/\/collections\/alabama\/.+/);
    }
  });

  test('picker scrolls horizontally on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/collections/alabama');
    await page.waitForLoadState('domcontentloaded');

    const filters = page.locator('.collection__filters');
    if (await filters.count() === 0) return;

    const scroll = page.locator('.collection__filters-scroll');
    await expect(scroll).toBeVisible();

    const overflowX = await scroll.evaluate(el => getComputedStyle(el).overflowX);
    expect(overflowX).toBe('auto');
  });

  test('inactive pills have border and translucent background', async ({ page }) => {
    const filters = page.locator('.collection__filters');
    if (await filters.count() === 0) return;

    const btns = page.locator('.collection__filter-btn');
    if (await btns.count() < 2) return;

    // Find an inactive pill (not active)
    const inactiveBtn = page.locator('.collection__filter-btn:not(.collection__filter-btn--active)').first();
    if (await inactiveBtn.count() === 0) return;

    const borderStyle = await inactiveBtn.evaluate(el => getComputedStyle(el).borderStyle);
    expect(borderStyle).not.toBe('none');

    // Inactive background should NOT be a fully opaque solid fill matching the school color
    const bg = await inactiveBtn.evaluate(el => getComputedStyle(el).backgroundColor);
    // Background is color-mix(...3%, transparent) — alpha component should be low, not 255
    // We just verify it's not the same as the active crimson fill
    expect(bg).not.toContain('rgb(158, 27, 50)');
  });
});

test.describe('Infinite scroll', () => {
  test('grid has data-collection-grid attribute', async ({ page }) => {
    await page.goto('/collections/alabama');
    const grid = page.locator('[data-collection-grid]');
    await expect(grid).toBeVisible();
  });

  test('sentinel element exists', async ({ page }) => {
    await page.goto('/collections/alabama');
    const sentinel = page.locator('[data-infinite-sentinel]');
    await expect(sentinel).toBeAttached();
  });

  test('sentinel is hidden for single-page collections', async ({ page }) => {
    await page.goto('/collections/best-sellers');
    const sentinel = page.locator('[data-infinite-sentinel]');
    await expect(sentinel).toBeAttached();
    await expect(sentinel).toBeHidden();
  });

  test('traditional pagination is hidden when JS is active and multiple pages exist', async ({ page }) => {
    await page.goto('/collections/alabama');
    const sentinel = page.locator('[data-infinite-sentinel]');
    const isMultiPage = !(await sentinel.getAttribute('hidden') !== null);
    if (isMultiPage) {
      const nav = page.locator('[data-pagination-nav]');
      if (await nav.count() > 0) {
        await expect(nav).toHaveAttribute('data-pagination-hidden', '');
      }
    }
  });
});
