import { defineConfig } from '@playwright/test';

/**
 * Shopify theme E2E tests run against a live preview URL.
 *
 * Set BASE_URL to your shopify theme dev URL or the live store:
 *   BASE_URL=http://127.0.0.1:9292 npm run test:e2e
 *
 * Defaults to the dev store's public URL.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 1,
  reporter: 'html',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:9292',
    storageState: 'e2e/.auth/storageState.json',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
