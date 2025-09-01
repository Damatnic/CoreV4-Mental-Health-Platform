import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing of mental health platform
 * Optimized for crisis intervention testing and accessibility compliance
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Timeouts optimized for crisis response testing
    actionTimeout: 5000, // 5 seconds for user actions
    navigationTimeout: 10000, // 10 seconds for page navigation
    
    // Accessibility testing defaults
    contextOptions: {
      reducedMotion: 'reduce',
      forcedColors: 'active',
    },
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    
    // Mobile devices
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'mobile-safari-se',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'samsung-galaxy',
      use: { ...devices['Galaxy S9+'] },
    },
    
    // Tablets
    {
      name: 'ipad',
      use: { ...devices['iPad (gen 7)'] },
    },
    {
      name: 'ipad-pro',
      use: { ...devices['iPad Pro 11'] },
    },
    
    // Accessibility testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Force high contrast mode for accessibility testing
        colorScheme: 'dark',
        forcedColors: 'active',
        extraHTTPHeaders: {
          'prefers-reduced-motion': 'reduce',
        },
      },
    },
    {
      name: 'screen-reader',
      use: {
        ...devices['Desktop Chrome'],
        // Force screen reader mode
        launchOptions: {
          args: ['--force-renderer-accessibility'],
        },
      },
    },
    
    // Crisis mode testing
    {
      name: 'crisis-response',
      use: {
        ...devices['Desktop Chrome'],
        // Optimized for crisis response testing
        offline: false,
        hasTouch: true,
        isMobile: false,
      },
      testMatch: /crisis.*\.spec\.ts$/,
    },
    {
      name: 'crisis-slow-network',
      use: {
        ...devices['Desktop Chrome'],
        // Simulate slow 3G
        offline: false,
        launchOptions: {
          args: ['--throttle-cpu=4'],
        },
      },
      testMatch: /crisis.*\.spec\.ts$/,
    },
    {
      name: 'crisis-offline',
      use: {
        ...devices['Desktop Chrome'],
        offline: true,
      },
      testMatch: /crisis.*\.spec\.ts$/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120000,
  },

  // Global test timeout - shorter for crisis response validation
  timeout: 30000,

  expect: {
    // Crisis response must be fast
    timeout: 200, // 200ms for assertions in crisis scenarios
  },
});