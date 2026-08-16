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
  // Local também tem 1 retentativa, para o runner ROTULAR instabilidade em vez
  // de alguém decidir no olho se "dessa vez não conta". Um teste que passa na
  // segunda aparece como `flaky` no relatório — continua visível, mas separado
  // de falha real. Um teste de fato quebrado segue vermelho nas duas tentativas.
  //
  // Isto NÃO conserta a instabilidade do spec 17 (Portal), que é sensível a
  // tempo sob contenção e segue como investigação aberta. Só impede que ela
  // continue sendo descartada por julgamento humano a cada rodada.
  retries: process.env.CI ? 2 : 1,
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
