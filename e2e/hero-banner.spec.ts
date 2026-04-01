import { test, expect } from '@playwright/test';

test.describe('Hero carousel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('carousel is visible with correct structure', async ({ page }) => {
    const hero = page.locator('.hero-banner').first();
    await expect(hero).toBeVisible();

    // Should have at least one slide
    const slides = hero.locator('.hero-banner__slide');
    expect(await slides.count()).toBeGreaterThanOrEqual(1);

    // First slide should have an image
    const image = slides.first().locator('.hero-banner__image');
    await expect(image).toBeAttached();

    // First slide should have the gradient overlay
    const overlay = slides.first().locator('.hero-banner__overlay');
    await expect(overlay).toBeAttached();
  });

  test('slides display content text', async ({ page }) => {
    const firstSlide = page.locator('.hero-banner__slide').first();
    const content = firstSlide.locator('.hero-banner__content');
    await expect(content).toBeVisible();

    const heading = content.locator('.hero-banner__heading');
    await expect(heading).toBeVisible();
    await expect(heading).not.toBeEmpty();
  });

  test('slide heading has bold and/or script parts', async ({ page }) => {
    const heading = page.locator('.hero-banner__heading').first();

    const hasBold = await heading.locator('.hero-banner__heading-bold').count() > 0;
    const hasScript = await heading.locator('.hero-banner__heading-script').count() > 0;
    expect(hasBold || hasScript).toBe(true);
  });

  test('slide has a CTA button that links somewhere', async ({ page }) => {
    const button = page.locator('.hero-banner__button').first();

    if (await button.count() === 0) {
      test.skip();
      return;
    }

    await expect(button).toBeVisible();
    const text = await button.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);

    const href = await button.getAttribute('href');
    expect(href).not.toBeNull();
  });

  test('carousel respects minimum height', async ({ page }) => {
    const hero = page.locator('.hero-banner').first();
    const box = await hero.boundingBox();

    const viewportHeight = page.viewportSize()?.height ?? 720;
    const minExpected = viewportHeight * 0.4;
    expect(box?.height).toBeGreaterThanOrEqual(minExpected);
  });

  test('slide image covers full section', async ({ page }) => {
    const hero = page.locator('.hero-banner').first();
    const slide = hero.locator('.hero-banner__slide').first();
    const image = slide.locator('.hero-banner__image');

    const slideBox = await slide.boundingBox();
    const imageBox = await image.boundingBox();

    if (slideBox && imageBox) {
      expect(imageBox.width).toBeGreaterThanOrEqual(slideBox.width - 2);
      expect(imageBox.height).toBeGreaterThanOrEqual(slideBox.height - 2);
    }
  });

  test('content is positioned above overlay (z-index)', async ({ page }) => {
    const content = page.locator('.hero-banner__content').first();
    const zIndex = await content.evaluate(el => getComputedStyle(el).zIndex);
    expect(Number(zIndex)).toBeGreaterThanOrEqual(2);
  });

  test('navigation controls are present when multiple slides exist', async ({ page }) => {
    const slides = page.locator('.hero-banner__slide');
    const count = await slides.count();

    if (count <= 1) {
      test.skip();
      return;
    }

    // Arrow buttons
    await expect(page.locator('.hero-banner__arrow--prev')).toBeVisible();
    await expect(page.locator('.hero-banner__arrow--next')).toBeVisible();

    // Dot indicators — one per slide
    const dots = page.locator('.hero-banner__dot');
    expect(await dots.count()).toBe(count);

    // First dot should be active
    await expect(dots.first()).toHaveClass(/hero-banner__dot--active/);
  });

  test('clicking next arrow advances the slide', async ({ page }) => {
    const slides = page.locator('.hero-banner__slide');
    if (await slides.count() <= 1) {
      test.skip();
      return;
    }

    // Wait for auto-advance to prove JS is loaded
    await expect(slides.nth(1)).toHaveClass(/hero-banner__slide--active/, { timeout: 15000 });

    // Click prev to go back, then next to advance again
    const prevBtn = page.locator('.hero-banner__arrow--prev');
    await prevBtn.click();
    await expect(slides.nth(0)).toHaveClass(/hero-banner__slide--active/);

    const nextBtn = page.locator('.hero-banner__arrow--next');
    await nextBtn.click();
    await expect(slides.nth(1)).toHaveClass(/hero-banner__slide--active/);

    const dots = page.locator('.hero-banner__dot');
    await expect(dots.nth(1)).toHaveClass(/hero-banner__dot--active/);
  });

  test('clicking a dot navigates to that slide', async ({ page }) => {
    const slides = page.locator('.hero-banner__slide');
    if (await slides.count() <= 2) {
      test.skip();
      return;
    }

    // Wait for auto-advance to prove JS is loaded
    await expect(slides.nth(1)).toHaveClass(/hero-banner__slide--active/, { timeout: 15000 });

    const dots = page.locator('.hero-banner__dot');
    await dots.nth(0).click();
    await expect(slides.nth(0)).toHaveClass(/hero-banner__slide--active/);

    await dots.nth(2).click();
    await expect(slides.nth(2)).toHaveClass(/hero-banner__slide--active/);
    await expect(dots.nth(2)).toHaveClass(/hero-banner__dot--active/);
  });

  test('carousel has proper ARIA attributes', async ({ page }) => {
    const hero = page.locator('.hero-banner').first();
    await expect(hero).toHaveAttribute('aria-roledescription', 'carousel');

    const firstSlide = page.locator('.hero-banner__slide').first();
    await expect(firstSlide).toHaveAttribute('aria-roledescription', 'slide');
  });
});
