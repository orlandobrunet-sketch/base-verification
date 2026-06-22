import { test, chromium, type Browser } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

/**
 * Auditoria de performance/qualidade via Lighthouse (playwright-lighthouse).
 *
 * Lighthouse precisa de um Chromium com porta de depuração remota dedicada,
 * então lançamos um browser próprio (não o fixture do teste). Thresholds são
 * deliberadamente FOLGADOS — o score de performance varia muito por máquina/CI
 * e contra o servidor estático local (sem gzip/CDN); o valor aqui é pegar
 * regressões grandes e o sinal de a11y/best-practices, não cravar um número.
 *
 * Roda só quando LIGHTHOUSE=1 (é lento, ~30-40s) para não pesar o E2E padrão:
 *   LIGHTHOUSE=1 BASE_URL=http://localhost:5500 npm test -- specs/12-performance.spec.ts
 */

const RUN = process.env.LIGHTHOUSE === '1';
const PORT = 9222;
const BASE = process.env.BASE_URL || 'http://localhost:5500';

test.describe('Performance — Lighthouse', () => {
  test.skip(!RUN, 'defina LIGHTHOUSE=1 para rodar (lento)');

  let browser: Browser;
  test.beforeAll(async () => {
    browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
  });
  test.afterAll(async () => { await browser?.close(); });

  test('landing screen — budget Lighthouse', async () => {
    test.setTimeout(120_000);
    const page = await browser.newPage();
    await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });

    await playAudit({
      page,
      port: PORT,
      thresholds: {
        // Floor folgado — contra o servidor estático local (sem gzip/CDN) o
        // score fica ~49; em produção (GitHub Pages/Vercel com compressão) é
        // 90+. 40 pega regressão catastrófica sem flakar. O sinal estável está
        // em accessibility/best-practices/seo, que não dependem do servidor.
        performance: 40,
        accessibility: 90,
        'best-practices': 80,
        seo: 80,
      },
      reports: {
        formats: { html: true },
        directory: 'lighthouse-report',
        name: 'landing',
      },
    });

    await page.close();
  });
});
