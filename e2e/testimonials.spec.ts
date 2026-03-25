import { test, expect } from '@playwright/test';

test.describe('Testimonials', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('testimonials section is visible', async ({ page }) => {
    const section = page.locator('.testimonials').first();
    await expect(section).toBeVisible();
  });

  test('displays star rating summary', async ({ page }) => {
    const stars = page.locator('.testimonials__stars--large').first();
    await expect(stars).toBeVisible();

    const starIcons = stars.locator('svg');
    expect(await starIcons.count()).toBe(5);
  });

  test('displays review count', async ({ page }) => {
    const count = page.locator('.testimonials__count').first();
    if (await count.count() > 0) {
      await expect(count).toBeVisible();
      const text = await count.textContent();
      expect(text).toContain('reviews');
    }
  });

  test('renders testimonial cards', async ({ page }) => {
    const cards = page.locator('.testimonial-card');
    expect(await cards.count()).toBeGreaterThan(0);

    const first = cards.first();
    await expect(first).toBeVisible();
  });

  test('testimonial cards have quotes and authors', async ({ page }) => {
    const card = page.locator('.testimonial-card').first();

    const quote = card.locator('.testimonial-card__quote');
    await expect(quote).toBeVisible();
    await expect(quote).not.toBeEmpty();

    const name = card.locator('.testimonial-card__name');
    await expect(name).toBeVisible();
  });

  test('testimonial cards have star ratings', async ({ page }) => {
    const card = page.locator('.testimonial-card').first();
    const stars = card.locator('.testimonials__stars svg');
    expect(await stars.count()).toBeGreaterThanOrEqual(1);
  });

  test('pagination dots are present', async ({ page }) => {
    const dots = page.locator('.testimonials__dot');
    expect(await dots.count()).toBeGreaterThanOrEqual(1);

    // First dot should be active
    await expect(dots.first()).toHaveClass(/testimonials__dot--active/);
  });

  test('clicking a dot scrolls the carousel', async ({ page }) => {
    const dots = page.locator('.testimonials__dot');
    if (await dots.count() < 2) {
      test.skip();
      return;
    }

    const track = page.locator('.testimonials__track').first();
    const scrollBefore = await track.evaluate(el => el.scrollLeft);

    await dots.nth(1).click();
    await page.waitForTimeout(500);

    const scrollAfter = await track.evaluate(el => el.scrollLeft);
    expect(scrollAfter).toBeGreaterThan(scrollBefore);
  });
});
