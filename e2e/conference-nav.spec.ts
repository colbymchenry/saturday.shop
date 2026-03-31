import { test, expect } from '@playwright/test';

test.describe('Conference nav', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('section is visible with heading', async ({ page }) => {
    const section = page.locator('.conference-nav').first();
    await expect(section).toBeVisible();

    const heading = section.locator('.conference-nav__heading');
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
      await expect(heading).not.toBeEmpty();
    }
  });

  test('conference list renders items', async ({ page }) => {
    const list = page.locator('.conference-nav__list').first();
    await expect(list).toBeVisible();

    const items = list.locator('.conference-nav__item');
    // May have 0 items if no conference metaobjects exist
    const count = await items.count();
    if (count > 0) {
      await expect(items.first()).toBeVisible();
    }
  });

  test('conference items have circles and names', async ({ page }) => {
    const items = page.locator('.conference-nav__item');
    if (await items.count() === 0) {
      test.skip();
      return;
    }

    const first = items.first();
    await expect(first.locator('.conference-nav__circle')).toBeVisible();
    await expect(first.locator('.conference-nav__name')).toBeVisible();
  });

  test('conference items link to schools page with conference hash', async ({ page }) => {
    const items = page.locator('.conference-nav__item');
    if (await items.count() === 0) {
      test.skip();
      return;
    }

    const href = await items.first().getAttribute('href');
    expect(href).toContain('/pages/schools#conference=');
  });

  test('list is horizontally scrollable', async ({ page }) => {
    const list = page.locator('.conference-nav__list').first();
    const overflowX = await list.evaluate(el => getComputedStyle(el).overflowX);
    expect(overflowX).toBe('auto');
  });

  test('coming soon conferences have reduced opacity and label', async ({ page }) => {
    const comingSoon = page.locator('.conference-nav__item--coming-soon');
    if (await comingSoon.count() === 0) {
      test.skip();
      return;
    }

    const first = comingSoon.first();
    const img = first.locator('.conference-nav__circle img');
    if (await img.count() > 0) {
      const imgOpacity = await img.evaluate(el => getComputedStyle(el).opacity);
      expect(parseFloat(imgOpacity)).toBeLessThan(1);
    }

    const label = first.locator('.conference-nav__coming-soon');
    await expect(label).toBeVisible();
    await expect(label).toContainText('COMING');
    await expect(label).toContainText('SOON');
  });

  test('active conferences do not have coming soon styling', async ({ page }) => {
    const active = page.locator('.conference-nav__item:not(.conference-nav__item--coming-soon)');
    if (await active.count() === 0) {
      test.skip();
      return;
    }

    const first = active.first();
    const opacity = await first.evaluate(el => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBe(1);
    await expect(first.locator('.conference-nav__coming-soon')).toHaveCount(0);
  });
});
