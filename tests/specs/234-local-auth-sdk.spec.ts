import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

const sdkPath = '/assets/vendor/supabase-js-2.106.2/supabase.js';
const sdkIntegrity = 'sha384-m/8UHFJHeU6nrCKP2hBnAseuvAKUmLF+8e5bWos5CJL023vuxX7kiVL5t8yjsJhV';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

test('o SDK oficial local inicializa e libera o visitante com o CDN externo bloqueado', async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const writes: string[] = [];
  const vendorRequests: string[] = [];
  const cdnSDKRequests: string[] = [];
  await context.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === sdkPath) vendorRequests.push(url.pathname);
    if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('supabase')) cdnSDKRequests.push(url.href);
    if (!['GET', 'HEAD'].includes(request.method())) {
      writes.push(request.method() + ' ' + url.pathname);
      return route.abort();
    }
    if (['image', 'media', 'font'].includes(request.resourceType())) return route.abort();
    return url.origin === origin ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await routeTechnicalQuestionBank(page, [{
    qid: 'local-sdk-technical', q: 'Marcador técnico de navegação',
    opts: ['Um', 'Dois', 'Três', 'Quatro'], ans: 0, exp: 'Fixture sem conteúdo clínico.',
  }]);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('script[src*="assets/vendor/supabase-js-2.106.2/supabase.js"]')).toHaveCount(1);
  await expect(page.locator('script[src*="assets/vendor/supabase-js-2.106.2/supabase.js"]')).toHaveAttribute('integrity', sdkIntegrity);
  const bytes = readFileSync(resolve(__dirname, '../../assets/vendor/supabase-js-2.106.2/supabase.js'));
  expect('sha384-' + createHash('sha384').update(bytes).digest('base64')).toBe(sdkIntegrity);
  expect(await page.evaluate(async () => {
    const client = (0, eval)('_supaClient');
    const session = await client.auth.getSession();
    return { realSDKAvailable: typeof (window as any).supabase?.createClient === 'function',
      clientInitialized: !!client, session: session.data.session, error: session.error };
  })).toEqual({ realSDKAvailable: true, clientInitialized: true, session: null, error: null });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect(page.locator('#landingScreen')).toBeHidden();
  expect(vendorRequests).toEqual([sdkPath]);
  expect(cdnSDKRequests).toEqual([]);
  expect(writes).toEqual([]);
});
