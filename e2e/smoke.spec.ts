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

  test('cart page loads with styled layout', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveTitle(/.+/);

    // Should show either the cart with items or the empty state
    const hasItems = await page.locator('.cart__layout').isVisible().catch(() => false);
    const isEmpty = await page.locator('.cart--empty').isVisible().catch(() => false);
    expect(hasItems || isEmpty).toBeTruthy();
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

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger menu is visible on mobile', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.locator('[data-menu-toggle]');
    await expect(hamburger).toBeVisible();

    // Desktop nav should be hidden
    const nav = page.locator('.header__nav');
    await expect(nav).not.toBeVisible();
  });

  test('mobile drawer opens and shows nav links', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.locator('[data-menu-toggle]');
    const drawer = page.locator('[data-mobile-drawer]');

    // Drawer should start closed
    await expect(drawer).not.toHaveClass(/mobile-drawer--open/);

    // Click hamburger to open
    await hamburger.click();
    await expect(drawer).toHaveClass(/mobile-drawer--open/);

    // Overlay should be visible
    const overlay = page.locator('[data-menu-overlay]');
    await expect(overlay).toHaveClass(/mobile-drawer__overlay--open/);

    // Should have Schools link
    const schoolsLink = drawer.locator('.mobile-drawer__link', { hasText: 'Schools' });
    await expect(schoolsLink).toBeVisible();
  });

  test('mobile drawer closes on X button', async ({ page }) => {
    await page.goto('/');
    const drawer = page.locator('[data-mobile-drawer]');

    await page.locator('[data-menu-toggle]').click();
    await expect(drawer).toHaveClass(/mobile-drawer--open/);

    await page.locator('[data-menu-close]').click();
    await expect(drawer).not.toHaveClass(/mobile-drawer--open/);
  });

  test('mobile drawer closes on overlay click', async ({ page }) => {
    await page.goto('/');
    const drawer = page.locator('[data-mobile-drawer]');

    await page.locator('[data-menu-toggle]').click();
    await expect(drawer).toHaveClass(/mobile-drawer--open/);

    await page.locator('[data-menu-overlay]').click({ force: true });
    await expect(drawer).not.toHaveClass(/mobile-drawer--open/);
  });

  test('mobile drawer closes on Escape', async ({ page }) => {
    await page.goto('/');
    const drawer = page.locator('[data-mobile-drawer]');

    await page.locator('[data-menu-toggle]').click();
    await expect(drawer).toHaveClass(/mobile-drawer--open/);

    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/mobile-drawer--open/);
  });
});

test.describe('Desktop hides hamburger', () => {
  test('hamburger is hidden on desktop', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.locator('[data-menu-toggle]');
    await expect(hamburger).not.toBeVisible();

    // Desktop nav should be visible
    const nav = page.locator('.header__nav');
    await expect(nav).toBeVisible();
  });
});

test.describe('Megamenu sidebar', () => {
  test('sidebar dropdown renders on hover', async ({ page }) => {
    await page.goto('/');
    const sidebarDropdown = page.locator('.nav-dropdown--sidebar').first();
    // Skip if no sidebar menus exist in current nav config
    if (await sidebarDropdown.count() === 0) {
      test.skip();
      return;
    }

    await sidebarDropdown.hover();
    await expect(sidebarDropdown.locator('.nav-dropdown__sidebar')).toBeVisible();
    await expect(sidebarDropdown.locator('.nav-dropdown__preview')).toBeVisible();
  });

  test('sidebar item hover switches preview pane', async ({ page }) => {
    await page.goto('/');
    const sidebarDropdown = page.locator('.nav-dropdown--sidebar').first();
    if (await sidebarDropdown.count() === 0) {
      test.skip();
      return;
    }

    await sidebarDropdown.hover();
    await expect(sidebarDropdown.locator('.nav-dropdown__sidebar')).toBeVisible();

    const items = sidebarDropdown.locator('.nav-dropdown__sidebar-item');
    const itemCount = await items.count();
    if (itemCount < 2) {
      test.skip();
      return;
    }

    // First pane should be active by default
    const firstPane = sidebarDropdown.locator('[data-pane-index="0"]');
    await expect(firstPane).not.toHaveAttribute('hidden', '');

    // Hover the second item
    await items.nth(1).hover();
    await page.waitForTimeout(150); // Wait for 80ms debounce + render

    const secondPane = sidebarDropdown.locator('[data-pane-index="1"]');
    await expect(secondPane).not.toHaveAttribute('hidden', '');
    await expect(firstPane).toHaveAttribute('hidden', '');
  });

  test('product cards visible in collection pane', async ({ page }) => {
    await page.goto('/');
    const sidebarDropdown = page.locator('.nav-dropdown--sidebar').first();
    if (await sidebarDropdown.count() === 0) {
      test.skip();
      return;
    }

    await sidebarDropdown.hover();

    // Find a pane with product cards (no grandchildren → products track)
    const productTrack = sidebarDropdown.locator('.nav-dropdown__products-track').first();
    if (await productTrack.count() === 0) {
      test.skip();
      return;
    }

    const cards = productTrack.locator('.product-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);

    // "Shop All" link should be present
    const shopAll = sidebarDropdown.locator('.nav-dropdown__products-shopall').first();
    await expect(shopAll).toBeVisible();
  });

  test('collection thumbnails visible for child with sub-collections', async ({ page }) => {
    await page.goto('/');
    const sidebarDropdown = page.locator('.nav-dropdown--sidebar').first();
    if (await sidebarDropdown.count() === 0) {
      test.skip();
      return;
    }

    await sidebarDropdown.hover();

    // Find a sidebar item whose pane has a thumbs grid (child with grandchildren)
    const thumbsGrid = sidebarDropdown.locator('.nav-dropdown__thumbs-grid').first();
    if (await thumbsGrid.count() === 0) {
      test.skip();
      return;
    }

    // Navigate to the pane that has the thumbs grid
    const pane = thumbsGrid.locator('..');
    const paneIndex = await pane.getAttribute('data-pane-index');
    if (paneIndex && paneIndex !== '0') {
      const item = sidebarDropdown.locator(`[data-sidebar-index="${paneIndex}"]`);
      await item.hover();
      await page.waitForTimeout(150);
    }

    const thumbCards = thumbsGrid.locator('.nav-dropdown__thumb-card');
    expect(await thumbCards.count()).toBeGreaterThanOrEqual(1);
  });

  test('product scroll arrows work', async ({ page }) => {
    await page.goto('/');
    const sidebarDropdown = page.locator('.nav-dropdown--sidebar').first();
    if (await sidebarDropdown.count() === 0) {
      test.skip();
      return;
    }

    await sidebarDropdown.hover();

    const track = sidebarDropdown.locator('.nav-dropdown__products-track').first();
    if (await track.count() === 0) {
      test.skip();
      return;
    }

    const scrollBefore = await track.evaluate(el => el.scrollLeft);
    const nextBtn = sidebarDropdown.locator('[data-scroll-dir="next"]').first();
    await nextBtn.click();
    await page.waitForTimeout(400); // Wait for smooth scroll

    const scrollAfter = await track.evaluate(el => el.scrollLeft);
    expect(scrollAfter).toBeGreaterThan(scrollBefore);
  });
});

test.describe('Header icon sizing', () => {
  test('header SVG icons render at reduced size', async ({ page }) => {
    await page.goto('/');
    // Scope to theme-controlled icon areas only (avoids shadow-DOM SVGs from
    // shopify-account, shop-login, etc. which are not styled by the theme)
    const iconsSvgs = page.locator('.header__icons > :not(search-popover):not(shopify-account) svg, .header__icons > search-popover > button svg');
    const count = await iconsSvgs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < count; i++) {
      const box = await iconsSvgs.nth(i).boundingBox();
      if (!box) continue; // hidden elements (e.g. search popover closed)
      expect(box.width).toBeLessThanOrEqual(18);
      expect(box.height).toBeLessThanOrEqual(18);
      expect(box.width).toBeGreaterThan(0);
    }
  });

  test('cart icon links to cart page', async ({ page }) => {
    await page.goto('/');
    const cartLink = page.locator('.header__icons a[aria-label="Cart"]');
    await expect(cartLink).toHaveAttribute('href', /\/cart/);
    await expect(cartLink.locator('svg')).toBeVisible();
  });

  test('search popover icons are visible when open', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => customElements.get('search-popover'));
    await page.locator('[data-search-toggle]').click();

    await expect(page.locator('.search-popover__input-icon svg')).toBeVisible();
    await expect(page.locator('.search-popover__close svg')).toBeVisible();
  });
});

test.describe('Header icon sizing (mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger icon contains SVG and is tappable', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.locator('[data-menu-toggle]');
    await expect(hamburger.locator('svg')).toBeVisible();

    await hamburger.click();
    await expect(page.locator('[data-mobile-drawer]')).toHaveClass(/mobile-drawer--open/);
  });

  test('mobile header SVGs match reduced sizing', async ({ page }) => {
    await page.goto('/');
    // Scope to theme-controlled SVGs only: hamburger + icon bar
    // (avoids shadow-DOM SVGs from shopify-account, shop-login, slidecarthq, etc.)
    const hamburgerSvg = page.locator('.header__hamburger svg');
    const iconsSvgs = page.locator('.header__icons > :not(search-popover):not(shopify-account) svg, .header__icons > search-popover > button svg');

    await expect(hamburgerSvg).toBeVisible();
    const hamburgerBox = await hamburgerSvg.boundingBox();
    expect(hamburgerBox).toBeTruthy();
    expect(hamburgerBox!.width).toBeLessThanOrEqual(18);
    expect(hamburgerBox!.height).toBeLessThanOrEqual(18);

    const count = await iconsSvgs.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const box = await iconsSvgs.nth(i).boundingBox();
      if (!box) continue;
      expect(box.width).toBeLessThanOrEqual(18);
      expect(box.height).toBeLessThanOrEqual(18);
    }
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
