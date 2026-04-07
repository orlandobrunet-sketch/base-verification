import { defineConfig, devices } from '@playwright/test';

/**
 * NefroQuest Playwright Config
 *
 * Para rodar localmente:
 *   cd tests && npm install && npm test
 *
 * Para rodar contra produção:
 *   BASE_URL=https://nefroquest.com npm test
 *
 * Para rodar em modo visual:
 *   npm run test:headed
 */
export default defineConfig({
  testDir: './specs',
  fullyParallel: false,      // jogo tem estado global — evitar race conditions
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'report' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5500',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // Ignorar erros de HTTPS em ambiente local
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
