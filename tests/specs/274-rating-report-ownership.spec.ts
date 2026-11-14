import { test, expect, type Page, type Route } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const ownerA = '00000000-0000-4000-8000-0000000000a1';
const ownerB = '00000000-0000-4000-8000-0000000000b2';
const qid = 'rating-continuity-technical';
const audits = new WeakMap<Page, { errors: string[]; unexpected: string[]; sockets: number }>();
test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const audit = { errors: [] as string[], unexpected: [] as string[], sockets: 0 };
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.route('**/*', route => {
    const req = route.request(), url = new URL(req.url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (req.method() !== 'GET') audit.unexpected.push(req.method() + ' ' + url.pathname);
    return req.method() === 'GET' && url.origin === origin ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, [{ qid, q: 'Exercício técnico de avaliação', opts: ['A', 'B', 'C', 'D'], ans: 0, exp: 'Explicação técnica.', cat: 'geral', diff: 'medium' }]);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 }, { authUser: { id: ownerA, email: 'rating-a@example.invalid', app_metadata: {} } });
});
test.afterEach(async ({ page }, info) => {
  await info.attach('rating-report-audit', { contentType: 'application/json', body: JSON.stringify(audits.get(page)) });
  if (info.status === info.expectedStatus) expect(audits.get(page)).toEqual({ errors: [], unexpected: [], sockets: 0 });
});
async function answer(page: Page) {
  const correct = await page.evaluate(() => (0, eval)('state.current.a'));
  await expect(page.locator(`#options .option[data-idx="${correct}"]`)).toBeEnabled();
  await page.locator(`#options .option[data-idx="${correct}"]`).click();
  await expect(page.locator('#nqlQuestionRatingToggle')).toBeVisible();
}
async function revisit(page: Page) {
  await page.locator('#nextBtn').click();
  await expect.poll(() => page.evaluate(() => (0, eval)('state.answered'))).toBe(false);
  await answer(page);
  await page.locator('#nqlQuestionRatingToggle').click();
}
async function stubRatings(page: Page, failFirst: boolean) {
  await page.evaluate(failFirst => {
    const w = window as any; w.__ratingWrites = [];
    w.__ratingClient = { from: (table: string) => ({
      insert: (rows: any[]) => {
        if (table === 'question_ratings') {
          w.__ratingWrites.push(structuredClone(rows));
          return Promise.resolve({ error: failFirst && w.__ratingWrites.length === 1 ? { message: 'Falha controlada' } : null });
        }
        return Promise.resolve({ error: null });
      }
    }) };
    (0, eval)('_supaClient = window.__ratingClient');
  }, failFirst);
}
for (const failFirst of [false, true]) test(`avaliação ${failFirst ? 'recusada' : 'confirmada'} preserva a escolha e ${failFirst ? 'oferece nova tentativa explícita' : 'não duplica o envio'} ao revisitar`, async ({ page }, info) => {
  await stubRatings(page, failFirst);
  await answer(page);
  await page.locator('#nqlQuestionRatingToggle').click();
  await page.getByRole('button', { name: 'Qualidade: 4 de 5', exact: true }).click();
  await page.getByRole('button', { name: 'Aprendizado: 5 de 5', exact: true }).click();
  await revisit(page);
  await expect.poll(() => page.evaluate(() => (window as any).__ratingWrites.length)).toBe(1);
  await expect(page.getByRole('button', { name: 'Qualidade: 4 de 5', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Aprendizado: 5 de 5', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const retry = page.getByRole('button', { name: 'Tentar enviar novamente', exact: true });
  if (failFirst) {
    await expect(page.locator('#nqlRatingDeliveryStatus')).toHaveText('Não foi possível confirmar o envio. Sua avaliação foi mantida.');
    await page.setViewportSize({ width: 320, height: 740 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await info.attach('rating-small-layout', { contentType: 'application/json', body: JSON.stringify(await page.evaluate(() => {
      const selectors = ['#mainApp', '#nqlQuestionRating', '#qRatingContainer', '.qr-left', '.qr-right', '#nqlRatingDeliveryStatus', '[data-action="_retryQuestionRating"]'];
      return selectors.map(selector => {
        const el = document.querySelector(selector) as HTMLElement, r = el.getBoundingClientRect(), s = getComputedStyle(el);
        return { selector, x: r.x, width: r.width, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, display: s.display, minWidth: s.minWidth, maxWidth: s.maxWidth, fontSize: s.fontSize };
      });
    })) });
    expect(await page.locator('#qRatingContainer').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await retry.scrollIntoViewIfNeeded();
    const hit = await retry.boundingBox();
    expect(hit!.height).toBeGreaterThanOrEqual(44);
    expect(hit!.x).toBeGreaterThanOrEqual(0);
    expect(hit!.x + hit!.width).toBeLessThanOrEqual(321);
    await retry.click();
    await expect.poll(() => page.evaluate(() => (window as any).__ratingWrites.length)).toBe(2);
    await expect(page.locator('#nqlRatingDeliveryStatus')).toHaveText('Avaliação enviada.');
    await expect(page.locator('#nqlRatingDeliveryStatus')).toBeFocused();
    await expect(page.locator('#nqlRatingDeliveryStatus')).toBeInViewport({ ratio: 1 });
  } else await expect(retry).toHaveCount(0);
  await page.locator('#nextBtn').click();
  await expect.poll(() => page.evaluate(() => (0, eval)('state.answered'))).toBe(false);
  expect(await page.evaluate(() => (window as any).__ratingWrites.length)).toBe(failFirst ? 2 : 1);
});
test('pendência da conta A não envia nem se confirma em B; A pode tentar novamente ao retornar', async ({ page }) => {
  await stubRatings(page, true);
  await answer(page);
  await page.locator('#nqlQuestionRatingToggle').click();
  await page.getByRole('button', { name: 'Qualidade: 4 de 5', exact: true }).click();
  await page.getByRole('button', { name: 'Aprendizado: 5 de 5', exact: true }).click();
  await revisit(page);
  await expect(page.getByRole('button', { name: 'Tentar enviar novamente', exact: true })).toBeVisible();
  for (const [id, ownsPending] of [[ownerB, false], [ownerA, true]] as const) {
    await injectGameState(page, { gold: 0 }, { authUser: { id, app_metadata: {} }, replaceSnapshot: true });
    await stubRatings(page, false);
    await answer(page);
    await page.locator('#nqlQuestionRatingToggle').click();
    const retry = page.getByRole('button', { name: 'Tentar enviar novamente', exact: true });
    if (ownsPending) {
      await retry.click();
      await expect.poll(() => page.evaluate(() => (window as any).__ratingWrites.length)).toBe(1);
      const notes = await page.evaluate(() => (window as any).__ratingWrites[0][0]);
      expect(notes).toMatchObject({ rating_quality: 4, rating_learning: 5 });
      await expect(page.locator('#nqlRatingDeliveryStatus')).toHaveText('Avaliação enviada.');
    } else {
      await expect(retry).toHaveCount(0);
      await page.locator('#nextBtn').click();
      await expect.poll(() => page.evaluate(() => (0, eval)('state.answered'))).toBe(false);
      expect(await page.evaluate(() => (window as any).__ratingWrites.length)).toBe(0);
      const record = await page.evaluate(({ qid, owner }) => JSON.parse(localStorage.getItem('nefroquest-rated-questions') || '{}')['scope:' + JSON.stringify(owner) + ':' + qid], { qid, owner: ownerA });
      expect(record.owner).toBe(ownerA);
      expect(record.delivery).toBe('pending');
    }
  }
});
test('confirmação antiga não marca a escolha nova; o reenvio depende de novo clique', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any; w.__ratingWrites = [];
    w.__ratingClient = { from: (table: string) => ({ insert: (rows: any[]) => {
      if (table !== 'question_ratings') return Promise.resolve({ error: null });
      w.__ratingWrites.push(structuredClone(rows));
      if (w.__ratingWrites.length === 1) return new Promise(resolve => { w.__releaseOldRating = () => resolve({ error: null }); });
      return Promise.resolve({ error: null });
    } }) };
    (0, eval)('_supaClient = window.__ratingClient');
  });
  await answer(page);
  await page.locator('#nqlQuestionRatingToggle').click();
  await page.getByRole('button', { name: 'Qualidade: 4 de 5', exact: true }).click();
  await page.getByRole('button', { name: 'Aprendizado: 5 de 5', exact: true }).click();
  await revisit(page);
  await page.getByRole('button', { name: 'Qualidade: 2 de 5', exact: true }).click();
  await page.getByRole('button', { name: 'Aprendizado: 1 de 5', exact: true }).click();
  await revisit(page);
  expect(await page.evaluate(() => (window as any).__ratingWrites.length)).toBe(1);
  await page.evaluate(async () => { (window as any).__releaseOldRating(); await new Promise(resolve => setTimeout(resolve, 0)); });
  const retry = page.getByRole('button', { name: 'Tentar enviar novamente', exact: true });
  await expect(retry).toBeEnabled();
  await expect(page.locator('#nqlRatingDeliveryStatus')).not.toContainText('Avaliação enviada');
  await expect(page.getByRole('button', { name: 'Qualidade: 2 de 5', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await retry.click();
  await expect.poll(() => page.evaluate(() => (window as any).__ratingWrites.length)).toBe(2);
  expect(await page.evaluate(() => (window as any).__ratingWrites[1][0])).toMatchObject({ rating_quality: 2, rating_learning: 1 });
  await expect(page.locator('#nqlRatingDeliveryStatus')).toHaveText('Avaliação enviada.');
});
test('avaliação legada sem estado de envio não é reenviada sem nova escolha', async ({ page }) => {
  await page.evaluate(qid => localStorage.setItem('nefroquest-rated-questions', JSON.stringify({ [qid]: { quality: 3, learning: 2 } })), qid);
  await stubRatings(page, false);
  await answer(page);
  await page.locator('#nqlQuestionRatingToggle').click();
  await expect(page.getByRole('button', { name: 'Qualidade: 3 de 5', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Aprendizado: 2 de 5', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#nextBtn').click();
  await expect.poll(() => page.evaluate(() => (0, eval)('state.answered'))).toBe(false);
  expect(await page.evaluate(() => (window as any).__ratingWrites.length)).toBe(0);
});
async function openFlag(page: Page) {
  await answer(page);
  await page.locator('.nql-review-report').click();
  await expect(page.locator('#flagComment')).toBeFocused();
}
async function startFlag(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    w.__flagAttempt = w.submitFlag(document.getElementById('flagSendBtn')!.getAttribute('data-arg'));
  });
}
async function retireOwner(page: Page) {
  await page.evaluate(ownerB => {
    (window as any).authUser = { id: ownerB, app_metadata: {} };
    (window as any)._stopLocalJourney();
  }, ownerB);
}
test('troca de conta enquanto autenticação do relato aguarda não envia o formulário antigo', async ({ page }) => {
  let calls = 0;
  await page.route('**/functions/v1/send-flag', route => { calls++; return route.fulfill({ json: { success: true } }); });
  await openFlag(page);
  await page.evaluate(() => {
    const w = window as any;
    const session = new Promise(resolve => { w.__releaseFlagSession = () => resolve({ data: { session: { access_token: 'controlled-token' } } }); });
    w.__flagClient = { auth: { getSession: () => session } };
    (0, eval)('_supaClient = window.__flagClient');
  });
  await startFlag(page);
  await expect(page.locator('#flagSendBtn')).toBeDisabled();
  await retireOwner(page);
  await expect(page.locator('#flagPopup')).toHaveCount(0);
  await page.evaluate(() => { (window as any).__releaseFlagSession(); });
  await page.evaluate(() => (window as any).__flagAttempt);
  expect(calls).toBe(0);
});
test('resposta de relato da conta antiga não publica sucesso no quadro após troca', async ({ page }) => {
  let pending: Route | undefined;
  await page.route('**/functions/v1/send-flag', route => { pending = route; });
  await openFlag(page);
  await startFlag(page);
  await expect.poll(() => !!pending).toBe(true);
  await retireOwner(page);
  await expect(page.locator('#flagPopup')).toHaveCount(0);
  await pending!.fulfill({ json: { success: true } });
  await page.evaluate(() => (window as any).__flagAttempt);
  await expect(page.locator('#flagPopup')).toHaveCount(0);
});
test('foco atrasado de um relato fechado não rouba o controle escolhido no relato novo', async ({ page }) => {
  await answer(page);
  const clock = new Date('2030-01-01T00:00:00Z');
  await page.clock.install({ time: clock.getTime() - 1000 });
  await page.clock.pauseAt(clock);
  await page.locator('.nql-review-report').press('Enter');
  await page.clock.runFor(60);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).press('Enter');
  await page.locator('.nql-review-report').press('Enter');
  const radio = page.getByRole('radio', { name: 'Outra', exact: true });
  await radio.focus();
  await page.clock.runFor(40);
  await expect(radio).toBeFocused();
});
