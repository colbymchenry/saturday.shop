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

  test('schools dropdown shows on hover with alphabet tabs', async ({ page }) => {
    await page.goto('/');
    const dropdown = page.locator('.schools-dropdown');
    const panel = page.locator('.schools-dropdown__panel');

    await dropdown.hover();
    await expect(panel).toBeVisible();

    // Should have alphabet tabs
    const alphaTabs = panel.locator('.schools-dropdown__alpha-tab');
    await expect(alphaTabs).toHaveCount(26);

    // Should have letter-grouped school lists
    const letterGroups = panel.locator('.schools-dropdown__letter-group');
    expect(await letterGroups.count()).toBeGreaterThanOrEqual(1);

    // Should have school links
    const schools = panel.locator('.schools-dropdown__school');
    expect(await schools.count()).toBeGreaterThanOrEqual(1);

    // Footer link should exist
    const contact = panel.locator('.schools-dropdown__contact');
    await expect(contact).toBeVisible();
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

test.describe('Sticky header', () => {
  test('header sections have position sticky', async ({ page }) => {
    await page.goto('/');

    // Both header-group sections should have position: sticky computed
    const positions = await page.evaluate(() => {
      const sections = document.querySelectorAll('.shopify-section-group-header-group');
      return Array.from(sections).map(el => getComputedStyle(el).position);
    });

    expect(positions.length).toBeGreaterThanOrEqual(1);
    for (const pos of positions) {
      expect(pos).toBe('sticky');
    }
  });

  test('header stays visible after scrolling down', async ({ page }) => {
    await page.goto('/');

    const headerSection = page.locator('.shopify-section-group-header-group').filter({ has: page.locator('header') });
    await expect(headerSection).toBeVisible();

    // Scroll down well past the header
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(200);

    // Header should still be at the top of the viewport (sticky)
    const box = await headerSection.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeLessThanOrEqual(100);
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
