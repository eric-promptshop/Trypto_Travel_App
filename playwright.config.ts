import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'tests/reports/playwright-results.json' }],
    ['junit', { outputFile: 'tests/reports/playwright-results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Global timeout for each action */
    actionTimeout: 10000,
    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        hasTouch: true,
      },
    },
    
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        hasTouch: true,
      },
    },

    {
      name: 'tablet',
      use: { 
        ...devices['iPad Pro'],
        hasTouch: true,
      },
    },

    /* Accessibility testing project */
    {
      name: 'accessibility',
      testDir: './tests/accessibility',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    /* Mobile optimization testing project */
    {
      name: 'mobile',
      testDir: './tests/mobile',
      use: { 
        ...devices['Pixel 5'],
        hasTouch: true,
      },
    },

    /* Performance testing project */
    {
      name: 'performance',
      testDir: './tests/performance',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    /* Cross-browser compatibility testing */
    {
      name: 'compatibility',
      testDir: './tests/compatibility',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    /* Edge cases and error handling */
    {
      name: 'edge-cases',
      testDir: './tests/edge-cases',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
  ],

  /* Global setup */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  
  /* Global teardown */
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* Test timeout */
  timeout: 30000,
  
  /* Global test timeout */
  globalTimeout: 600000,

  /* Expect timeout */
  expect: {
    timeout: 5000,
  },
}); 