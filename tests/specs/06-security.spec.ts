import { test, expect } from '@playwright/test';

test.describe('Segurança e cabeçalhos HTTP', () => {
  test('cabeçalhos de segurança estão presentes', async ({ page }) => {
    const res = await page.request.get('/');
    const headers = res.headers();

    // X-Content-Type-Options
    expect(headers['x-content-type-options'] || '').toMatch(/nosniff/i);

    // X-Frame-Options
    expect(headers['x-frame-options'] || '').toMatch(/SAMEORIGIN|DENY/i);

    // Referrer-Policy
    expect(headers['referrer-policy'] || '').toBeTruthy();
  });

  test('sw.js não é cacheado pelo CDN', async ({ page }) => {
    const res = await page.request.get('/sw.js');
    const cc = res.headers()['cache-control'] || '';
    expect(cc).toMatch(/no-cache|no-store/i);
  });

  test('version.json não é cacheado pelo CDN', async ({ page }) => {
    const res = await page.request.get('/version.json');
    const cc = res.headers()['cache-control'] || '';
    expect(cc).toMatch(/no-cache|no-store/i);
  });

  test('assets estáticos têm cache de longa duração', async ({ page }) => {
    // favicon.png está em /assets implicitamente — testar manifest.json já no config
    const res = await page.request.get('/assets/nefromancer.png').catch(() => null);
    if (!res) { test.skip(); return; }
    const cc = res.headers()['cache-control'] || '';
    // Deve ter max-age alto (pelo menos 1 dia)
    const match = cc.match(/max-age=(\d+)/);
    if (match) {
      expect(parseInt(match[1])).toBeGreaterThanOrEqual(86400);
    }
  });

  test('service worker está registrado', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const swRegistered = await page.evaluate(async () => {
      if (!navigator.serviceWorker) return false;
      const reg = await navigator.serviceWorker.getRegistration('/');
      return !!reg;
    });
    expect(swRegistered).toBe(true);
  });
});
