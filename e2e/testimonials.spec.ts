import { test, expect } from '@playwright/test';

test.describe('Testimonials', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the carousel JS to initialize (it adds --center class to center card)
    await page.waitForSelector('.testimonial-card--center', { timeout: 15000 });
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

  test('center card is elevated on desktop', async ({ page }) => {
    const cards = page.locator('.testimonial-card');
    if (await cards.count() < 3) {
      test.skip();
      return;
    }

    // Second card (center of first group) should have the --center modifier
    const centerCard = cards.nth(1);
    await expect(centerCard).toHaveClass(/testimonial-card--center/, { timeout: 10000 });
  });

  test('clicking a dot transitions the carousel', async ({ page }) => {
    const dots = page.locator('.testimonials__dot');
    if (await dots.count() < 2) {
      test.skip();
      return;
    }

    // Click second dot and verify active state changes
    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveClass(/testimonials__dot--active/, { timeout: 5000 });

    // Verify track has a non-zero translateX
    const track = page.locator('.testimonials__track').first();
    await expect(track).not.toHaveCSS('transform', 'none', { timeout: 5000 });
  });

  test('auto-rotates after interval', async ({ page }) => {
    test.setTimeout(30000);
    const dots = page.locator('.testimonials__dot');
    if (await dots.count() < 2) {
      test.skip();
      return;
    }

    await expect(dots.first()).toHaveClass(/testimonials__dot--active/);

    // Wait for auto-rotation (9s interval + buffer)
    await expect(dots.nth(1)).toHaveClass(/testimonials__dot--active/, { timeout: 15000 });
  });

  test('pauses auto-rotation on hover', async ({ page }) => {
    test.setTimeout(30000);
    const carousel = page.locator('review-carousel').first();
    const dots = page.locator('.testimonials__dot');
    if (await dots.count() < 2) {
      test.skip();
      return;
    }

    // Hover over carousel to pause
    await carousel.hover();
    await expect(dots.first()).toHaveClass(/testimonials__dot--active/);

    // Wait longer than rotation interval while hovering
    await page.waitForTimeout(10000);

    // Should still be on first page
    await expect(dots.first()).toHaveClass(/testimonials__dot--active/);
  });

  test('mobile shows single card layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // On mobile, no --center class is added, wait for dots to be rebuilt
    // The JS rebuilds dots for mobile: 1 per card instead of 1 per 3-card group
    const cards = page.locator('.testimonial-card');
    const cardCount = await cards.count();
    if (cardCount < 2) {
      test.skip();
      return;
    }

    // Wait for dots to be rebuilt by JS (more dots on mobile than server-rendered)
    const dots = page.locator('.testimonials__dot');
    await expect(dots).toHaveCount(cardCount, { timeout: 15000 });

    // Cards should be full-width on mobile
    const card = cards.first();
    const cardBox = await card.boundingBox();
    expect(cardBox).toBeTruthy();
    if (cardBox) {
      expect(cardBox.width).toBeGreaterThan(300);
    }
  });
});
