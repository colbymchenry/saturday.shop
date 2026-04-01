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

  test('arrow and dot navigation changes active slide', async ({ page }) => {
    const slides = page.locator('.hero-banner__slide');
    if (await slides.count() <= 1) {
      test.skip();
      return;
    }

    // Wait for the deferred carousel script to attach event listeners.
    // We poll until clicking next actually changes the active slide.
    await page.waitForFunction(() => {
      const btn = document.querySelector('.hero-banner__arrow--next') as HTMLButtonElement;
      if (!btn) return false;
      btn.click();
      const active = document.querySelector('.hero-banner__slide--active');
      const isSecond = active === document.querySelectorAll('.hero-banner__slide')[1];
      if (!isSecond) return false;
      // Reset back to first slide via prev
      (document.querySelector('.hero-banner__arrow--prev') as HTMLButtonElement)?.click();
      return true;
    }, null, { timeout: 20000, polling: 500 });

    // Now test all controls
    const result = await page.evaluate(() => {
      const next = document.querySelector('.hero-banner__arrow--next') as HTMLButtonElement;
      const prev = document.querySelector('.hero-banner__arrow--prev') as HTMLButtonElement;
      const dots = Array.from(document.querySelectorAll('.hero-banner__dot')) as HTMLButtonElement[];

      // Click next
      next.click();
      const afterNext = document.querySelector('.hero-banner__slide:nth-child(2)')?.classList.contains('hero-banner__slide--active');
      const dotAfterNext = dots[1]?.classList.contains('hero-banner__dot--active');

      // Click prev back to first
      prev.click();
      const afterPrev = document.querySelector('.hero-banner__slide:nth-child(1)')?.classList.contains('hero-banner__slide--active');

      // Click last dot
      const lastIdx = dots.length - 1;
      dots[lastIdx]?.click();
      const afterDot = document.querySelector(`.hero-banner__slide:nth-child(${lastIdx + 1})`)?.classList.contains('hero-banner__slide--active');
      const dotActive = dots[lastIdx]?.classList.contains('hero-banner__dot--active');

      return { afterNext, dotAfterNext, afterPrev, afterDot, dotActive };
    });

    expect(result.afterNext).toBe(true);
    expect(result.dotAfterNext).toBe(true);
    expect(result.afterPrev).toBe(true);
    expect(result.afterDot).toBe(true);
    expect(result.dotActive).toBe(true);
  });

  test('carousel has proper ARIA attributes', async ({ page }) => {
    const hero = page.locator('.hero-banner').first();
    await expect(hero).toHaveAttribute('aria-roledescription', 'carousel');

    const firstSlide = page.locator('.hero-banner__slide').first();
    await expect(firstSlide).toHaveAttribute('aria-roledescription', 'slide');
  });
});
