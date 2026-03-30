import { test, expect } from '@playwright/test';

const SCHOOLS_PAGE = '/pages/schools';

test.describe('Schools page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SCHOOLS_PAGE);
  });

  test('page renders heading and search', async ({ page }) => {
    const heading = page.locator('[data-default-header] .schools-page__heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Find Your School');

    const search = page.locator('.schools-page__search-input');
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute('placeholder', /school/i);
  });

  test('tab toggle is visible with both options', async ({ page }) => {
    const tabs = page.locator('.schools-page__tab');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(0)).toContainText('BY CONFERENCE');
    await expect(tabs.nth(1)).toContainText('ALL SCHOOLS');
  });

  test('ALL SCHOOLS is the default active tab', async ({ page }) => {
    const allTab = page.locator('[data-tab="all"]');
    await expect(allTab).toHaveClass(/schools-page__tab--active/);

    const allView = page.locator('[data-view="all"]');
    await expect(allView).not.toHaveAttribute('hidden', '');

    const confView = page.locator('[data-view="conference"]');
    await expect(confView).toHaveAttribute('hidden', '');
  });

  test('switching to BY CONFERENCE tab shows conference cards', async ({ page }) => {
    const confTab = page.locator('[data-tab="conference"]');
    await confTab.click();

    await expect(confTab).toHaveClass(/schools-page__tab--active/);

    const confView = page.locator('[data-view="conference"]');
    await expect(confView).not.toHaveAttribute('hidden', '');
  });

  test('school items have logo or dot and names', async ({ page }) => {
    const schools = page.locator('.schools-page__school');
    const count = await schools.count();
    if (count === 0) {
      test.skip();
      return;
    }

    const first = schools.first();
    const hasLogo = await first.locator('.schools-page__school-logo').count() > 0;
    const hasDot = await first.locator('.schools-page__school-dot').count() > 0;
    expect(hasLogo || hasDot).toBe(true);
    await expect(first.locator('.schools-page__school-name')).toBeVisible();
  });

  test('school items are links to collections', async ({ page }) => {
    const schools = page.locator('.schools-page__school');
    const count = await schools.count();
    if (count === 0) {
      test.skip();
      return;
    }

    const href = await schools.first().getAttribute('href');
    expect(href).toContain('/collections/');
  });

  test('search filters schools list', async ({ page }) => {
    const schools = page.locator('.schools-page__school');
    const count = await schools.count();
    if (count === 0) {
      test.skip();
      return;
    }

    const searchInput = page.locator('[data-schools-search]');
    const firstName = await schools.first().locator('.schools-page__school-name').textContent();
    await searchInput.fill(firstName!.trim());

    const visible = page.locator('.schools-page__school:not([hidden])');
    const visibleCount = await visible.count();
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThanOrEqual(count);
  });

  test('search with no matches shows no-results message', async ({ page }) => {
    const schools = page.locator('.schools-page__school');
    if (await schools.count() === 0) {
      test.skip();
      return;
    }

    await page.locator('[data-schools-search]').fill('zzzzxqwerty');
    const noResults = page.locator('[data-schools-no-results]');
    await expect(noResults).not.toHaveAttribute('hidden', '');
  });

  test('conference cards have circles and names', async ({ page }) => {
    await page.locator('[data-tab="conference"]').click();

    const cards = page.locator('.schools-page__conference-card');
    const count = await cards.count();
    if (count === 0) {
      test.skip();
      return;
    }

    const first = cards.first();
    await expect(first.locator('.schools-page__conference-circle')).toBeVisible();
    await expect(first.locator('.schools-page__conference-name')).toBeVisible();
  });

  test('clicking conference card shows filtered schools', async ({ page }) => {
    await page.locator('[data-tab="conference"]').click();

    const cards = page.locator('.schools-page__conference-card');
    const count = await cards.count();
    if (count === 0) {
      test.skip();
      return;
    }

    // Get the conference name from the first card
    const confName = await cards.first().locator('.schools-page__conference-name').textContent();
    await cards.first().click();

    // Conference detail header should be visible
    const confHeader = page.locator('[data-conf-header]');
    await expect(confHeader).not.toHaveAttribute('hidden', '');

    // Title should match the conference name
    const confTitle = page.locator('[data-conf-title]');
    await expect(confTitle).toContainText(confName!.trim());

    // Default header and tabs should be hidden
    await expect(page.locator('[data-default-header]')).toHaveAttribute('hidden', '');
    await expect(page.locator('[data-tabs]')).toHaveAttribute('hidden', '');

    // All visible schools should belong to this conference
    const visibleSchools = page.locator('.schools-page__school:not([hidden])');
    const visibleCount = await visibleSchools.count();
    expect(visibleCount).toBeGreaterThan(0);

    for (let i = 0; i < visibleCount; i++) {
      const schoolConf = await visibleSchools.nth(i).getAttribute('data-school-conference');
      expect(schoolConf).toBe(confName!.trim());
    }
  });

  test('back button returns to conference grid', async ({ page }) => {
    await page.locator('[data-tab="conference"]').click();

    const cards = page.locator('.schools-page__conference-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    await cards.first().click();
    await expect(page.locator('[data-conf-header]')).not.toHaveAttribute('hidden', '');

    // Click back
    await page.locator('[data-back-btn]').click();

    // Should return to conference grid view
    await expect(page.locator('[data-default-header]')).not.toHaveAttribute('hidden', '');
    await expect(page.locator('[data-conf-header]')).toHaveAttribute('hidden', '');
    await expect(page.locator('[data-tabs]')).not.toHaveAttribute('hidden', '');
    await expect(page.locator('[data-view="conference"]')).not.toHaveAttribute('hidden', '');
  });

  test('search works within conference filter', async ({ page }) => {
    await page.locator('[data-tab="conference"]').click();

    const cards = page.locator('.schools-page__conference-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    const visibleBefore = await page.locator('.schools-page__school:not([hidden])').count();
    if (visibleBefore === 0) {
      test.skip();
      return;
    }

    await page.locator('[data-schools-search]').fill('zzzzxqwerty');
    const noResults = page.locator('[data-schools-no-results]');
    await expect(noResults).not.toHaveAttribute('hidden', '');
  });

  test('footer has contact link', async ({ page }) => {
    const footer = page.locator('.schools-page__footer');
    await expect(footer).toBeVisible();

    const link = footer.locator('a');
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toContain('contact');
  });
});
