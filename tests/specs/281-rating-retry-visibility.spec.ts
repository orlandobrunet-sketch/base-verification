import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const qid = 'rating-visibility-technical';
const audits = new WeakMap<Page, { errors: string[]; nonGET: string[]; sockets: number }>();

test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(origin).hostname);
  const audit = { errors: [] as string[], nonGET: [] as string[], sockets: 0 }; audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.route('**/*', route => {
    const req = route.request(), url = new URL(req.url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (req.method() !== 'GET') { audit.nonGET.push(req.method() + ' ' + url.pathname); return route.abort(); }
    return url.origin === origin ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, [{ qid, q: 'Exercício técnico de visibilidade',
    opts: ['A', 'B', 'C', 'D'], ans: 0, exp: 'Explicação técnica.', cat: 'geral', diff: 'medium' }]);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 }, { asGuest: true });
});

test.afterEach(async ({ page }, info) => {
  const audit = audits.get(page);
  await info.attach('rating-visibility-boundaries', { contentType: 'application/json', body: JSON.stringify(audit) });
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
});

async function controlledService(page: Page, failFirst = false) {
  await page.evaluate(fail => {
    const w = window as any; w.__visibilityRatingWrites = [];
    w.__visibilityRatingService = { from: (table: string) => ({ insert: (rows: unknown[]) => {
      if (table === 'question_ratings') {
        w.__visibilityRatingWrites.push(structuredClone(rows));
        return Promise.resolve({ error: fail && w.__visibilityRatingWrites.length === 1 ? { message: 'Recusa controlada' } : null });
      }
      return Promise.resolve({ error: null });
    } }) };
    (0, eval)('_supaClient = window.__visibilityRatingService');
  }, failFirst);
}

async function answer(page: Page) {
  const correct = await page.evaluate(() => (0, eval)('state.current.a'));
  await page.locator(`#options .option[data-idx="${correct}"]`).click();
  await page.locator('#nqlQuestionRatingToggle').click();
}
const quality = (page: Page, value: number) => page.getByRole('button', { name: `Qualidade: ${value} de 5`, exact: true });
const learning = (page: Page, value: number) => page.getByRole('button', { name: `Aprendizado: ${value} de 5`, exact: true });
const retry = (page: Page) => page.getByRole('button', { name: 'Tentar enviar novamente', exact: true });
const count = (page: Page) => page.evaluate(() => (window as any).__visibilityRatingWrites.length);

async function next(page: Page) {
  await page.locator('#nextBtn').click();
  await expect.poll(() => page.evaluate(() => (0, eval)('state.answered'))).toBe(false);
  await expect(page.locator('#qRatingContainer')).toHaveCount(0);
  expect(await page.evaluate(() => (0, eval)('_pendingRating'))).toBeNull();
}

async function visibility(page: Page, hidden: boolean, pagehide = false) {
  // Controlled browser-state boundary. Product handlers/model/transport logic
  // are not replaced, and this does not claim a physical-tab lifecycle test.
  await page.evaluate(({ hidden, pagehide }) => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: hidden ? 'hidden' : 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    if (pagehide) window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
  }, { hidden, pagehide });
}

test('pendência revisitada continua tentando enviar após ocultar e voltar', async ({ page }, info) => {
  await controlledService(page, true); await answer(page);
  await quality(page, 4).click(); await learning(page, 5).click();
  await next(page); await answer(page);
  await expect(retry(page)).toBeEnabled(); expect(await count(page)).toBe(1);
  await visibility(page, true); await visibility(page, false);
  await info.attach('rating-model-after-visibility', { contentType: 'application/json',
    body: JSON.stringify(await page.evaluate(() => ({ pending: (0, eval)('_pendingRating'), hidden: document.hidden }))) });
  await retry(page).click();
  await expect.poll(() => count(page)).toBe(2);
  await expect(page.locator('#nqlRatingDeliveryStatus')).toHaveText('Avaliação enviada.');
  await expect(page.locator('#nqlRatingDeliveryStatus')).toBeFocused();
  await next(page); expect(await count(page)).toBe(2);
});

test('notas novas enviam uma vez em visibilitychange e pagehide e aceitam nova escolha ao retornar', async ({ page }) => {
  await controlledService(page); await answer(page);
  await quality(page, 4).click(); await learning(page, 5).click();
  await visibility(page, true, true);
  await expect.poll(() => count(page)).toBe(1); await visibility(page, false);
  await expect(page.locator('#nqlRatingDeliveryStatus')).toHaveText('Avaliação enviada.');
  await quality(page, 2).click(); await learning(page, 1).click();
  await next(page); await expect.poll(() => count(page)).toBe(2);
  expect(await page.evaluate(() => (window as any).__visibilityRatingWrites[1][0])).toMatchObject({ rating_quality: 2, rating_learning: 1 });
});

test('falha no primeiro envio em background oferece retry efetivo sem navegar', async ({ page }) => {
  await controlledService(page, true); await answer(page);
  await quality(page, 4).click(); await learning(page, 5).click();
  await visibility(page, true, true);
  await expect.poll(() => count(page)).toBe(1); await visibility(page, false);
  await expect(retry(page)).toBeVisible(); await expect(retry(page)).toBeEnabled();
  await expect(quality(page, 4)).toHaveAttribute('aria-pressed', 'true');
  await expect(learning(page, 5)).toHaveAttribute('aria-pressed', 'true');
  await retry(page).click(); await expect.poll(() => count(page)).toBe(2);
  await expect(page.locator('#nqlRatingDeliveryStatus')).toHaveText('Avaliação enviada.');
  await next(page); expect(await count(page)).toBe(2);
});

test('nota parcial fica editável no mesmo painel e só envia quando as duas existem', async ({ page }) => {
  await controlledService(page); await answer(page);
  await quality(page, 3).click(); await visibility(page, true, true); await visibility(page, false);
  expect(await count(page)).toBe(0); await learning(page, 2).click();
  await next(page); await expect.poll(() => count(page)).toBe(1);
  expect(await page.evaluate(() => (window as any).__visibilityRatingWrites[0][0])).toMatchObject({ rating_quality: 3, rating_learning: 2 });
});
