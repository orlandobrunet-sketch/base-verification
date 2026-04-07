import { test, expect } from '@playwright/test';

/**
 * Testes de segurança.
 * - Em CI local (serve): valida apenas estrutura do vercel.json e SW registration.
 * - Em produção (BASE_URL=https://nefroquest.com): valida cabeçalhos HTTP reais.
 */
const isProd = (process.env.BASE_URL || '').includes('nefroquest.com');

test.describe('Segurança — vercel.json e Service Worker', () => {
  test('vercel.json contém os 4 cabeçalhos obrigatórios', async ({ page }) => {
    // Validação estática — não depende do servidor
    const res = await page.request.get('/vercel.json');
    if (res.status() !== 200) { test.skip(); return; }
    const json = await res.json();
    const allHeaders: string[] = (json.headers || [])
      .flatMap((h: any) => (h.headers || []).map((hh: any) => hh.key));

    expect(allHeaders).toContain('X-Content-Type-Options');
    expect(allHeaders).toContain('X-Frame-Options');
    expect(allHeaders).toContain('Referrer-Policy');
    expect(allHeaders).toContain('Permissions-Policy');
  });

  test('service worker está registrado', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration('/');
      return !!reg;
    });
    expect(swRegistered).toBe(true);
  });

  test('sw.js é acessível', async ({ page }) => {
    const res = await page.request.get('/sw.js');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('nefroquest-v');
  });

  test('cabeçalhos HTTP de segurança — apenas em produção', async ({ page }) => {
    if (!isProd) {
      test.skip(); // serve local não aplica regras do vercel.json
      return;
    }
    const res = await page.request.get('/');
    const h = res.headers();
    expect(h['x-content-type-options']).toMatch(/nosniff/i);
    expect(h['x-frame-options']).toMatch(/SAMEORIGIN|DENY/i);
    expect(h['referrer-policy']).toBeTruthy();
  });

  test('cache sw.js e version.json — apenas em produção', async ({ page }) => {
    if (!isProd) { test.skip(); return; }
    for (const path of ['/sw.js', '/version.json']) {
      const res = await page.request.get(path);
      expect(res.headers()['cache-control'] || '').toMatch(/no-cache|no-store/i);
    }
  });
});
