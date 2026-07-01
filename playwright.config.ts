import { defineConfig, devices } from '@playwright/test';

const databaseUrl = 'file:./playwright.sqlite';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node tests/e2e/setup-db.cjs && npm run start -w server',
      url: 'http://localhost:3100',
      timeout: 60_000,
      reuseExistingServer: false,
      env: {
        PORT: '3100',
        DATABASE_URL: databaseUrl,
        JWT_SECRET: 'test-jwt-secret',
      },
    },
    {
      command: 'npm run dev -w client -- --host 127.0.0.1 --port 5174',
      url: 'http://127.0.0.1:5174',
      timeout: 60_000,
      reuseExistingServer: false,
      env: {
        VITE_API_URL: 'http://localhost:3100',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
