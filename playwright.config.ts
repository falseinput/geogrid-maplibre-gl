import { defineConfig, devices } from '@playwright/test';

const SEVER_URL = 'http://localhost:8000'
const BASE_URL = `${SEVER_URL}/tests/fixtures/`;
const TEST_DIR = './tests';
const SNAPSHOT_PATH_TEMPLATE = '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}';
const REPORTER_HOST = '0.0.0.0';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: TEST_DIR,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { host: REPORTER_HOST }]],
  timeout: 50000,
  snapshotPathTemplate: SNAPSHOT_PATH_TEMPLATE,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run start',
    url: SEVER_URL,
    reuseExistingServer: !process.env.CI,
  },
});
