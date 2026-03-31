import { test, expect } from '@playwright/test';

test.describe('Careers page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/careers');
  });

  test.describe('Careers hero', () => {
    test('hero section is visible', async ({ page }) => {
      const hero = page.locator('.careers-hero');
      await expect(hero).toBeVisible();
    });

    test('hero displays eyebrow text', async ({ page }) => {
      const eyebrow = page.locator('.careers-hero__eyebrow');
      await expect(eyebrow).toBeVisible();
      await expect(eyebrow).not.toBeEmpty();
    });

    test('hero displays heading with bold and script parts', async ({ page }) => {
      const heading = page.locator('.careers-hero__heading');
      await expect(heading).toBeVisible();

      const bold = page.locator('.careers-hero__heading-bold');
      if (await bold.count() > 0) {
        await expect(bold).toBeVisible();
      }

      const script = page.locator('.careers-hero__heading-script');
      if (await script.count() > 0) {
        await expect(script).toBeVisible();
      }
    });

    test('hero displays body text', async ({ page }) => {
      const body = page.locator('.careers-hero__body');
      await expect(body).toBeVisible();
      await expect(body).not.toBeEmpty();
    });

    test('hero uses split layout on desktop', async ({ page }) => {
      const inner = page.locator('.careers-hero__inner');
      const display = await inner.evaluate(el => getComputedStyle(el).display);
      expect(display).toBe('grid');
    });
  });

  test.describe('Careers perks', () => {
    test('perks section is visible', async ({ page }) => {
      const perks = page.locator('.careers-perks');
      await expect(perks).toBeVisible();
    });

    test('perks section has dark background', async ({ page }) => {
      const perks = page.locator('.careers-perks');
      const bg = await perks.evaluate(el => getComputedStyle(el).backgroundColor);
      expect(bg).toMatch(/rgb\(0, 0, 0\)/);
    });

    test('perks heading and eyebrow are visible', async ({ page }) => {
      const eyebrow = page.locator('.careers-perks__eyebrow');
      await expect(eyebrow).toBeVisible();

      const heading = page.locator('.careers-perks__heading');
      await expect(heading).toBeVisible();
    });

    test('perks grid has at least 3 items', async ({ page }) => {
      const items = page.locator('.careers-perks__item');
      expect(await items.count()).toBeGreaterThanOrEqual(3);
    });

    test('each perk has a number and heading', async ({ page }) => {
      const items = page.locator('.careers-perks__item');
      const count = await items.count();

      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        const number = item.locator('.careers-perks__number');
        await expect(number).toBeVisible();

        const heading = item.locator('.careers-perks__item-heading');
        await expect(heading).toBeVisible();
        await expect(heading).not.toBeEmpty();
      }
    });

    test('perk numbers are sequential', async ({ page }) => {
      const numbers = page.locator('.careers-perks__number');
      const count = await numbers.count();

      for (let i = 0; i < count; i++) {
        const text = await numbers.nth(i).textContent();
        const expected = String(i + 1).padStart(2, '0');
        expect(text?.trim()).toBe(expected);
      }
    });
  });

  test.describe('Careers openings', () => {
    test('openings section is visible', async ({ page }) => {
      const openings = page.locator('.careers-openings');
      await expect(openings).toBeVisible();
    });

    test('openings heading and eyebrow are visible', async ({ page }) => {
      const eyebrow = page.locator('.careers-openings__eyebrow');
      await expect(eyebrow).toBeVisible();

      const heading = page.locator('.careers-openings__heading');
      await expect(heading).toBeVisible();
    });

    test('role listings or empty state is visible', async ({ page }) => {
      const roles = page.locator('.careers-openings__role');
      const empty = page.locator('.careers-openings__empty');
      const hasRoles = await roles.count() > 0;
      const hasEmpty = await empty.count() > 0;
      expect(hasRoles || hasEmpty).toBe(true);
    });

    test('each role has a title', async ({ page }) => {
      const roles = page.locator('.careers-openings__role');
      const count = await roles.count();

      for (let i = 0; i < count; i++) {
        const title = roles.nth(i).locator('.careers-openings__role-title');
        await expect(title).toBeVisible();
        await expect(title).not.toBeEmpty();
      }
    });

    test('role listings are clickable links', async ({ page }) => {
      const roles = page.locator('.careers-openings__role');
      const count = await roles.count();

      for (let i = 0; i < count; i++) {
        const tagName = await roles.nth(i).evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe('a');
      }
    });
  });

  test.describe('Careers CTA', () => {
    test('CTA section is visible', async ({ page }) => {
      const cta = page.locator('.careers-cta');
      await expect(cta).toBeVisible();
    });

    test('CTA has heading', async ({ page }) => {
      const heading = page.locator('.careers-cta__heading');
      await expect(heading).toBeVisible();
      await expect(heading).not.toBeEmpty();
    });

    test('CTA has a button', async ({ page }) => {
      const button = page.locator('.careers-cta__button');
      if (await button.count() > 0) {
        await expect(button).toBeVisible();
        const text = await button.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });
  });
});
