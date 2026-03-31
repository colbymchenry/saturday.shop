import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/contact');
  });

  test('contact form section is visible', async ({ page }) => {
    const section = page.locator('.contact-page');
    await expect(section).toBeVisible();
  });

  test('displays heading', async ({ page }) => {
    const heading = page.locator('.contact-page__heading');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Contact us');
  });

  test('has name input field', async ({ page }) => {
    const label = page.locator('label[for="ContactForm-name"]');
    const input = page.locator('#ContactForm-name');
    await expect(label).toBeVisible();
    await expect(input).toBeVisible();
  });

  test('has email input field with required attribute', async ({ page }) => {
    const label = page.locator('label[for="ContactForm-email"]');
    const input = page.locator('#ContactForm-email');
    await expect(label).toBeVisible();
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('required', '');
    await expect(input).toHaveAttribute('type', 'email');
  });

  test('has message textarea', async ({ page }) => {
    const label = page.locator('label[for="ContactForm-body"]');
    const textarea = page.locator('#ContactForm-body');
    await expect(label).toBeVisible();
    await expect(textarea).toBeVisible();
  });

  test('has send button', async ({ page }) => {
    const button = page.locator('.contact-page__button');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('SEND');
  });

  test('name and email fields are side by side on desktop', async ({ page }) => {
    const row = page.locator('.contact-page__row');
    await expect(row).toBeVisible();

    const display = await row.evaluate(el => getComputedStyle(el).display);
    expect(display).toBe('grid');

    const columns = await row.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    // Should have two columns (two values separated by space)
    const columnCount = columns.trim().split(/\s+/).length;
    expect(columnCount).toBe(2);
  });

  test('form fields are fillable', async ({ page }) => {
    await page.fill('#ContactForm-name', 'Test User');
    await page.fill('#ContactForm-email', 'test@example.com');
    await page.fill('#ContactForm-body', 'This is a test message.');

    await expect(page.locator('#ContactForm-name')).toHaveValue('Test User');
    await expect(page.locator('#ContactForm-email')).toHaveValue('test@example.com');
    await expect(page.locator('#ContactForm-body')).toHaveValue('This is a test message.');
  });

  test('heading is centered', async ({ page }) => {
    const heading = page.locator('.contact-page__heading');
    const textAlign = await heading.evaluate(el => getComputedStyle(el).textAlign);
    expect(textAlign).toBe('center');
  });
});
