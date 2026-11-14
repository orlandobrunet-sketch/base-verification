import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block' });

for (const delivery of ['promise', 'event']) {
  test(`preparo visitante conserva a questão após sessão inicial tardia por ${delivery}`, async ({page, context}, info) => {
    const audit = { errors: [] as string[], nonGET: [] as string[], sockets: 0 };
    page.on('pageerror', error => audit.errors.push(error.message));
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET') { audit.nonGET.push(request.method() + ' ' + url.pathname); return route.abort(); }
      if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
      return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    });
    await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
    // Only the remote SDK boundary is controlled; app authentication and the
    // real question identity, catalog, continuation and answer handlers run.
    await page.addInitScript(() => {
      const win = window as any;
      let resolveInitial: any, listener: any;
      const pending = new Promise(resolve => { resolveInitial = resolve; });
      win.__initialSessionGate = {
        deliver: async (kind: string) => {
          if (kind === 'promise') resolveInitial({ data: { session: null }, error: null });
          else listener('INITIAL_SESSION', null);
          await new Promise(resolve => requestAnimationFrame(resolve));
        },
      };
      const response = async () => ({ data: null, error: null });
      const chain: any = { then: (yes: any, no: any) => response().then(yes, no),
        select: () => chain, eq: () => chain, order: () => chain, limit: () => chain,
        maybeSingle: response, single: response };
      win.supabase = { createClient: () => ({ auth: {
        getSession: () => pending,
        onAuthStateChange: (callback: any) => { listener = callback;
          return { data: { subscription: { unsubscribe() {} } } }; },
      }, from: () => chain }) };
    });
    await routeTechnicalQuestionBank(page, [{qid: 'guest-entry-269', cat: 'geral',
      q: 'Teste técnico de continuidade da entrada.', opts: ['Primeira opção', 'Segunda opção'],
      ans: 0, exp: 'Correção técnica da navegação.'}]);
    await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
    await injectGameState(page, { gold: 0, score: 0, correctTotal: 0, level: 1, xp: 0 }, {asGuest: true});
    const question = page.locator('#question');
    const before = await question.textContent();
    const resources = await page.evaluate(() => (0, eval)('JSON.stringify([state.gold,state.lives,state.xp,state.correctTotal])'));
    await page.evaluate(kind => (window as any).__initialSessionGate.deliver(kind), delivery);
    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('#landingScreen')).toBeHidden();
    await expect(question).toHaveText(before!);
    expect(await page.evaluate(() => (0, eval)('JSON.stringify([state.gold,state.lives,state.xp,state.correctTotal])'))).toBe(resources);
    expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('nq_guest_mode'))).toBe('1');
    await page.locator('#options .option').first().click();
    await expect(page.locator('#nextBtn')).toBeVisible();
    await info.attach('guest-entry-audit', {contentType: 'application/json', body: JSON.stringify(audit)});
    expect(audit).toEqual({errors: [], nonGET: [], sockets: 0});
  });
}
