import { chromium, type FullConfig } from '@playwright/test';

const STORAGE_STATE_PATH = 'e2e/.auth/storageState.json';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Try to load the page; handle store password if needed
  await page.goto(baseURL);

  const isPasswordPage = await page.locator('text=Enter using password').isVisible({ timeout: 5000 }).catch(() => false);

  if (isPasswordPage) {
    const password = process.env.STORE_PASSWORD || 'sheebo';
    await page.locator('summary.details-modal__toggle').click();
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(password);
    const submitBtn = page.locator('form[action="/password"] button, form[action="/password"] input[type="submit"]').first();
    await submitBtn.click();
    await page.waitForURL('**/', { timeout: 15000 });
  }

  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}

export default globalSetup;
