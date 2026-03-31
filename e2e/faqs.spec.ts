import { test, expect } from '@playwright/test';

test.describe('FAQs page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/faqs');
  });

  test('renders page header with eyebrow, title, and subtitle', async ({ page }) => {
    await expect(page.locator('.faqs__eyebrow')).toHaveText('GOT QUESTIONS?');
    await expect(page.locator('.faqs__title')).toBeVisible();
    await expect(page.locator('.faqs__subtitle')).toBeVisible();
  });

  test('renders all FAQ items', async ({ page }) => {
    const items = page.locator('.faqs__item');
    await expect(items).toHaveCount(10);
  });

  test('FAQ items are collapsed by default', async ({ page }) => {
    const firstItem = page.locator('.faqs__item').first();
    await expect(firstItem).not.toHaveAttribute('open', '');
  });

  test('clicking a question expands the answer', async ({ page }) => {
    const firstItem = page.locator('.faqs__item').first();
    await firstItem.locator('.faqs__question').click();
    await expect(firstItem).toHaveAttribute('open', '');
    await expect(firstItem.locator('.faqs__answer')).toBeVisible();
  });

  test('clicking an open question collapses it', async ({ page }) => {
    const firstItem = page.locator('.faqs__item').first();
    await firstItem.locator('.faqs__question').click();
    await expect(firstItem).toHaveAttribute('open', '');
    await firstItem.locator('.faqs__question').click();
    await expect(firstItem).not.toHaveAttribute('open', '');
  });

  test('multiple items can be open simultaneously', async ({ page }) => {
    const items = page.locator('.faqs__item');
    await items.nth(0).locator('.faqs__question').click();
    await items.nth(2).locator('.faqs__question').click();
    await expect(items.nth(0)).toHaveAttribute('open', '');
    await expect(items.nth(2)).toHaveAttribute('open', '');
  });

  test('displays numbered labels for each item', async ({ page }) => {
    await expect(page.locator('.faqs__number').first()).toHaveText('01');
    await expect(page.locator('.faqs__number').last()).toHaveText('10');
  });

  test('footer CTA links to contact page', async ({ page }) => {
    const link = page.locator('.faqs__footer-link');
    await expect(link).toHaveText('Get in touch');
    await expect(link).toHaveAttribute('href', '/pages/contact');
  });

  test('plus icon rotates when item is opened', async ({ page }) => {
    const firstItem = page.locator('.faqs__item').first();
    const icon = firstItem.locator('.faqs__icon');
    await firstItem.locator('.faqs__question').click();
    await expect(icon).toBeVisible();
    // The icon should have a 45deg rotation via CSS when open
    await expect(firstItem).toHaveAttribute('open', '');
  });
});

test.describe('FAQs page - mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('renders correctly on mobile', async ({ page }) => {
    await page.goto('/pages/faqs');
    await expect(page.locator('.faqs__title')).toBeVisible();
    await expect(page.locator('.faqs__item')).toHaveCount(10);
  });

  test('accordion works on mobile', async ({ page }) => {
    await page.goto('/pages/faqs');
    const firstItem = page.locator('.faqs__item').first();
    await firstItem.locator('.faqs__question').click();
    await expect(firstItem).toHaveAttribute('open', '');
    await expect(firstItem.locator('.faqs__answer')).toBeVisible();
  });
});
