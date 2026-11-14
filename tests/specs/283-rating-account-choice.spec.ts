import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const ownerA = '00000000-0000-4000-8000-0000000000a1';
const ownerB = '00000000-0000-4000-8000-0000000000b2';
const qid = 'rating-account-choice-283';
test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const audit = { errors: [] as string[], sends: [] as string[], sockets: 0 };
  (page as any).__ratingAccountAudit = audit;
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.route('**/*', route => {
    const req = route.request(), url = new URL(req.url());
    if (req.method() !== 'GET') audit.sends.push(req.method() + ' ' + url.pathname);
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    return req.method() === 'GET' && url.origin === origin ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, [{ qid, cat: 'geral', q: 'Exercício técnico de avaliação por conta.',
    opts: ['Primeira opção', 'Segunda opção'], ans: 0, exp: 'Correção técnica.' }]);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
});
test.afterEach(async ({ page }, info) => {
  const audit = (page as any).__ratingAccountAudit;
  await info.attach('rating-account-audit', { contentType: 'application/json', body: JSON.stringify(audit) });
  expect(audit).toEqual({ errors: [], sends: [], sockets: 0 });
});
async function enter(page: Page, owner: string | null, failure = true) {
  await injectGameState(page, { gold: 0, score: 0, correctTotal: 0 }, {
    authUser: owner ? { id: owner, app_metadata: {} } : null,
    asGuest: owner === null, replaceSnapshot: true,
  });
  await page.evaluate(failure => {
    const w = window as any;
    w.__choiceWrites = [];
    w.__choiceClient = { from: (table: string) => ({ insert: (rows: any[]) => {
      if (table === 'question_ratings') w.__choiceWrites.push(structuredClone(rows));
      return Promise.resolve({ error: failure ? { message: 'Falha técnica controlada' } : null });
    } }) };
    (0, eval)('_supaClient = window.__choiceClient');
  }, failure);
}
async function openRating(page: Page) {
  const correct = await page.evaluate(() => (0, eval)('state.current.a'));
  await page.locator(`#options .option[data-idx="${correct}"]`).click();
  await page.locator('#nqlQuestionRatingToggle').click();
}
async function chooseAndFlush(page: Page, quality: number, learning: number) {
  await openRating(page);
  await page.getByRole('button', { name: `Qualidade: ${quality} de 5`, exact: true }).click();
  await page.getByRole('button', { name: `Aprendizado: ${learning} de 5`, exact: true }).click();
  await page.locator('#nextBtn').click();
  await expect.poll(() => page.evaluate(() => (window as any).__choiceWrites.length)).toBe(1);
}

for (const secondOwner of [ownerB, null]) {
  test(`outra escolha de ${secondOwner ? 'B' : 'visitante'} não apaga a pendência da conta A`, async ({ page }) => {
    await enter(page, ownerA);
    await chooseAndFlush(page, 4, 5);
    await enter(page, secondOwner);
    await chooseAndFlush(page, 2, 1);
    for (const [owner, quality, learning] of [[ownerA, 4, 5], [secondOwner, 2, 1]] as const) {
      await enter(page, owner, false);
      await openRating(page);
      await expect(page.getByRole('button', { name: `Qualidade: ${quality} de 5`, exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('button', { name: `Aprendizado: ${learning} de 5`, exact: true })).toHaveAttribute('aria-pressed', 'true');
      await page.getByRole('button', { name: 'Tentar enviar novamente', exact: true }).click();
      await expect.poll(() => page.evaluate(() => (window as any).__choiceWrites.length)).toBe(1);
      expect(await page.evaluate(() => (window as any).__choiceWrites[0][0])).toMatchObject({ rating_quality: quality, rating_learning: learning });
      await expect(page.locator('#nqlRatingDeliveryStatus')).toHaveText('Avaliação enviada.');
    }
  });
}
