import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('homepage loads and has key sections', async ({ page }) => {
    await page.goto('/');

    // Page should have a title
    await expect(page).toHaveTitle(/.+/);

    // Header should be visible
    await expect(page.locator('header').first()).toBeVisible();

    // Featured collection section should exist
    await expect(page.locator('.featured-collection').first()).toBeVisible();
  });

  test('header has search, account, and cart icons', async ({ page }) => {
    await page.goto('/');
    const icons = page.locator('.header__icons');
    await expect(icons).toBeVisible();

    // Search icon button
    const searchBtn = icons.locator('[data-search-toggle]');
    await expect(searchBtn).toBeVisible();

    // Cart icon
    const cartLink = icons.locator('a[aria-label="Cart"]');
    await expect(cartLink).toBeVisible();
  });

  test('search popover opens when clicking search icon', async ({ page }) => {
    await page.goto('/');
    const searchBtn = page.locator('[data-search-toggle]');
    // Wait for custom element JS to register
    await page.waitForFunction(() => customElements.get('search-popover'));
    await searchBtn.click();

    const panel = page.locator('.search-popover__panel');
    await expect(panel).toBeVisible();

    const input = page.locator('[data-search-input]');
    await expect(input).toBeFocused();
  });

  test('search popover shows live results when typing', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => customElements.get('search-popover'));
    await page.locator('[data-search-toggle]').click();
    await page.locator('[data-search-input]').fill('auburn');

    const results = page.locator('[data-search-results] .search-result-item');
    await expect(results.first()).toBeVisible({ timeout: 15000 });
    expect(await results.count()).toBeGreaterThanOrEqual(1);
  });

  test('search popover closes on Escape', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => customElements.get('search-popover'));
    await page.locator('[data-search-toggle]').click();
    await expect(page.locator('.search-popover__panel')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.search-popover__panel')).not.toBeVisible();
  });

  test('schools dropdown is present in header nav', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('.schools-dropdown__trigger');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText(/schools/i);

    // Panel should be hidden by default
    const panel = page.locator('.schools-dropdown__panel');
    await expect(panel).not.toBeVisible();
  });

  test('schools dropdown shows on hover with alphabetical columns', async ({ page }) => {
    await page.goto('/');
    const dropdown = page.locator('.schools-dropdown');
    const panel = page.locator('.schools-dropdown__panel');

    await dropdown.hover();
    await expect(panel).toBeVisible();

    // Should have 5 alphabetical column headings
    const headings = panel.locator('.schools-dropdown__heading');
    await expect(headings).toHaveCount(5);
    await expect(headings.nth(0)).toHaveText('A – D');
    await expect(headings.nth(4)).toHaveText('V – Z');

    // Should have school links with colored dots
    const schools = panel.locator('.schools-dropdown__school');
    expect(await schools.count()).toBeGreaterThanOrEqual(1);
    const logo = schools.first().locator('.schools-dropdown__logo');
    await expect(logo).toBeVisible();

    // School links should be left-aligned (not centered by header a rule)
    const firstSchool = schools.first();
    const schoolBox = await firstSchool.boundingBox();
    const columnBox = await panel.locator('.schools-dropdown__column').first().boundingBox();
    if (schoolBox && columnBox) {
      // School link should start near the left edge of its column (within 5px)
      expect(schoolBox.x - columnBox.x).toBeLessThan(5);
    }

    // Footer link should exist
    const contact = panel.locator('.schools-dropdown__contact');
    await expect(contact).toBeVisible();
    await expect(contact).toHaveText(/can.*t find your school/i);
  });

  test('schools dropdown closes on Escape while hovering', async ({ page }) => {
    await page.goto('/');
    const dropdown = page.locator('.schools-dropdown');
    const panel = page.locator('.schools-dropdown__panel');
    const trigger = page.locator('.schools-dropdown__trigger');

    // Hover to open
    await dropdown.hover();
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Escape should close even while still hovering
    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('collections page loads', async ({ page }) => {
    await page.goto('/collections/all');
    await expect(page).toHaveTitle(/.+/);
  });

  test('cart page loads', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveTitle(/.+/);
  });

  test('404 page renders', async ({ page }) => {
    const response = await page.goto('/pages/nonexistent-page-xyz');
    // Shopify may return 200 for custom 404 pages, 404, or 502 via dev proxy
    expect(response?.ok() || [404, 502].includes(response?.status() ?? 0)).toBeTruthy();
  });
});

test.describe('No horizontal overflow', () => {
  const pages = ['/', '/search?q=a', '/cart', '/collections/all'];

  for (const path of pages) {
    test(`no horizontal scrollbar on ${path}`, async ({ page }) => {
      await page.goto(path);
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });
  }
});
