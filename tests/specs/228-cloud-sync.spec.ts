import { test, expect, type Browser, type BrowserContext, type Page, devices } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

const OWNER = '00000000-0000-4000-8000-000000002280';
const SAVE_KEY = 'nefroquest-save-v7';
const CLOCK = Date.parse('2026-11-11T12:00:00Z');
const bank = Array.from({ length: 12 }, (_, index) => ({
  qid: 'sync-tech-' + index, t: 'Sincronização técnica', q: 'Marcador técnico ' + index,
  opts: ['Um', 'Dois', 'Três', 'Quatro'], ans: index % 4, exp: 'Marcador de teste.',
}));

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

type Progress = Record<string, any>;
type Query = {
  table: string;
  operation: 'read' | 'update';
  columns: string;
  filters: Record<string, unknown>;
  payload?: Record<string, any>;
};
type Result = { data: any; error: any };

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function journey(values: Record<string, unknown> = {}) {
  return {
    schemaVersion: 7, saveOwner: OWNER, saveRevision: 'sync-initial',
    character: 'nephros', level: 1, xp: 40, xpToNext: 200,
    correctTotal: 2, score: 100, gold: 10, lives: 3, maxLives: 3,
    difficulty: 'hard', gameStarted: true, gameOver: false,
    idx: 0, queueIds: [], recentIds: [], chestsOpened: 0,
    timestamp: CLOCK - 1000, ...values,
  };
}

function progress(save: ReturnType<typeof journey> | null): Progress {
  return {
    save, stats: { questionsAnsweredAllTime: save?.correctTotal || 0 },
    achievements: [], mastered: [], unlockedArticles: [], unlockedRefs: [],
    detailedStats: {}, acidBaseProgress: {}, srData: {}, updatedAt: new Date(CLOCK).toISOString(),
  };
}

class SharedProfile {
  row: { game_progress: Progress | null; game_progress_version: number };
  writes: Query[] = [];
  failNextWrite = false;
  simultaneousWrites: Array<{ query: Query; resolve: (result: Result) => void }> | null = null;

  constructor(initial: Progress | null) {
    this.row = { game_progress: copy(initial), game_progress_version: 0 };
  }

  handle = async (query: Query): Promise<Result> => {
    if (query.table !== 'profiles') return { data: null, error: null };
    if (query.operation === 'read') {
      return { data: query.columns.includes('game_progress') ? copy(this.row) : { is_premium: false }, error: null };
    }
    if (!Object.prototype.hasOwnProperty.call(query.payload || {}, 'game_progress')) {
      return { data: null, error: null };
    }
    this.writes.push(copy(query));
    if (this.failNextWrite) {
      this.failNextWrite = false;
      return { data: null, error: { code: 'NETWORK', message: 'Falha de conexão simulada' } };
    }
    if (this.simultaneousWrites) {
      return new Promise(resolve => {
        this.simultaneousWrites!.push({ query, resolve });
        if (this.simultaneousWrites!.length === 2) {
          const pending = this.simultaneousWrites!;
          this.simultaneousWrites = null;
          for (const entry of pending) entry.resolve(this.apply(entry.query));
        }
      });
    }
    return this.apply(query);
  };

  private apply(query: Query): Result {
    if (query.filters.id !== OWNER) return { data: null, error: { code: '42501', message: 'Conta incorreta' } };
    const expected = query.filters.game_progress_version;
    if (expected !== undefined && expected !== this.row.game_progress_version) return { data: null, error: null };
    if (expected !== undefined && query.payload?.game_progress_version !== Number(expected) + 1) {
      return { data: null, error: { code: '40001', message: 'Revisão inválida' } };
    }
    // Before the fix, an unguarded PATCH was accepted by the real endpoint.
    // Keeping that behavior here makes the stale-overwrite regression fail.
    this.row.game_progress = copy(query.payload!.game_progress);
    this.row.game_progress_version++;
    return { data: copy(this.row), error: null };
  }
}

type Device = { context: BrowserContext; page: Page };

async function openDevice(browser: Browser, baseURL: string, backend: SharedProfile, mobile: boolean,
  local: ReturnType<typeof journey> | null, hydrate = true): Promise<Device> {
  const context = await browser.newContext({
    ...(mobile ? devices['Pixel 7'] : { viewport: { width: 1280, height: 800 } }),
    baseURL, serviceWorkers: 'block', reducedMotion: 'reduce',
  });
  await context.route('**/*', route => {
    const request = route.request();
    if (new URL(request.url()).pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (['image', 'media', 'font'].includes(request.resourceType())) return route.abort();
    return new URL(request.url()).origin === new URL(baseURL).origin && request.method() === 'GET'
      ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await context.exposeBinding('__sharedProfileQuery', (_source, query: Query) => backend.handle(query));
  await context.addInitScript(() => {
    const win = window as any;
    function from(table: string) {
      const query = { table, operation: 'read', columns: '', filters: {}, payload: undefined } as any;
      let pending: Promise<any> | null = null;
      const execute = () => pending ||= win.__sharedProfileQuery(query);
      const chain: any = {
        select(columns: string) { query.columns = columns; return chain; },
        update(payload: any) { query.operation = 'update'; query.payload = payload; return chain; },
        eq(key: string, value: unknown) { query.filters[key] = value; return chain; },
        single: execute, maybeSingle: execute,
        then(resolve: any, reject: any) { return execute().then(resolve, reject); },
      };
      return chain;
    }
    win.supabase = { createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      from,
    }) };
  });
  const page = await context.newPage();
  await routeTechnicalQuestionBank(page, bank);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any)._loadProgressFromCloud === 'function');
  await page.clock.install({ time: CLOCK });
  await page.clock.pauseAt(CLOCK + 1000);
  await page.evaluate(({ owner, local, key }) => {
    (window as any).authUser = { id: owner, email: 'sync@example.test', user_metadata: { nickname: 'Teste' }, app_metadata: {} };
    if (local) {
      localStorage.setItem(key, JSON.stringify(local));
      localStorage.setItem('nefroquest-save', JSON.stringify(local));
    }
    (window as any).updateWelcomeUserBadge();
  }, { owner: OWNER, local, key: SAVE_KEY });
  if (hydrate) await load(page);
  return { context, page };
}

async function load(page: Page) {
  await page.evaluate(async () => { await (0, eval)('_loadProgressFromCloud()'); });
}

async function sync(page: Page) {
  await page.evaluate(async () => { await (0, eval)('_syncProgressToCloud()'); });
}

async function replaceLocal(page: Page, save: ReturnType<typeof journey>) {
  await page.evaluate(({ save, key }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    (window as any).refreshWelcomeSave();
  }, { save, key: SAVE_KEY });
}

async function saved(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), SAVE_KEY);
}

async function withDevices(browser: Browser, baseURL: string, mobile: boolean,
  run: (a: Page, b: Page, backend: SharedProfile) => Promise<void>, emptySecond = false) {
  const initial = journey();
  const backend = new SharedProfile(progress(initial));
  const contexts: BrowserContext[] = [];
  try {
    const a = await openDevice(browser, baseURL, backend, mobile, initial);
    contexts.push(a.context);
    const b = await openDevice(browser, baseURL, backend, mobile, emptySecond ? null : initial, !emptySecond);
    contexts.push(b.context);
    await run(a.page, b.page, backend);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
}

test('um aparelho parado não sobrescreve o avanço já salvo pelo outro', async ({ browser, baseURL, isMobile }) => {
  await withDevices(browser, baseURL!, isMobile, async (a, b, backend) => {
    const newer = journey({ saveRevision: 'advance-a', timestamp: CLOCK + 2000, xp: 177, correctTotal: 5, score: 1477, gold: 77 });
    await replaceLocal(a, newer);
    await sync(a);
    expect(backend.row.game_progress?.save).toMatchObject({ xp: 177, correctTotal: 5, score: 1477, gold: 77 });
    await sync(b);
    expect(backend.row.game_progress?.save).toMatchObject({ xp: 177, correctTotal: 5, score: 1477, gold: 77 });
  });
});

test('um aparelho sem jornada local não apaga a jornada da conta', async ({ browser, baseURL, isMobile }) => {
  await withDevices(browser, baseURL!, isMobile, async (_a, b, backend) => {
    const before = copy(backend.row.game_progress);
    await sync(b);
    expect(backend.row.game_progress?.save).toMatchObject({
      character: before!.save.character, xp: before!.save.xp,
      correctTotal: before!.save.correctTotal, gold: before!.save.gold,
      score: before!.save.score, lives: before!.save.lives,
    });
    expect(backend.writes.some(write => write.payload?.game_progress?.save === null)).toBe(false);
  }, true);
});

test('uma revisão remota sem save aposenta a cópia local inalterada sem ressuscitá-la', async ({ browser, baseURL, isMobile }) => {
  await withDevices(browser, baseURL!, isMobile, async (a, _b, backend) => {
    backend.row = { game_progress: {}, game_progress_version: 1 };
    await load(a);
    expect(await saved(a)).toMatchObject({ save: null });
    await expect(a.getByRole('button', { name: /Retomar jornada/ })).toBeHidden();
    await sync(a);
    expect(backend.writes.some(write => write.payload?.game_progress?.save?.character)).toBe(false);
    expect(backend.row.game_progress?.save?.character).toBeUndefined();
  });
});

test('saves remotos malformados mantêm a jornada local e suspendem o envio', async ({ browser, baseURL, isMobile }) => {
  await withDevices(browser, baseURL!, isMobile, async (a, _b, backend) => {
    const original = await saved(a);
    for (const remote of ['inválido', [], { xp: 177 }, journey({ character: 'inexistente' })]) {
      backend.row = { game_progress: { save: remote }, game_progress_version: 1 };
      await load(a);
      await sync(a);
      expect(await saved(a)).toEqual(original);
      expect(backend.writes).toHaveLength(0);
      await expect(a.locator('#cloudSyncStatus')).toContainText(/pendente|falh|conexão|não foi possível|tentar/i);
    }
  });
});

test('um save local sem checkpoint pede escolha quando a nuvem já foi esvaziada', async ({ browser, baseURL, isMobile }) => {
  await withDevices(browser, baseURL!, isMobile, async (a, _b, backend) => {
    await a.evaluate(owner => localStorage.removeItem('nefroquest-cloud:' + owner), OWNER);
    backend.row = { game_progress: {}, game_progress_version: 1 };
    await load(a);
    const dialog = a.getByRole('dialog', { name: 'Sincronização da jornada' });
    await expect(dialog).toBeVisible();
    expect(await saved(a)).toMatchObject({ xp: 40, correctTotal: 2 });
    expect(backend.writes).toHaveLength(0);
    await dialog.getByRole('button', { name: 'Usar jornada da nuvem', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await saved(a)).toMatchObject({ save: null });
    await sync(a);
    expect(backend.writes.some(write => write.payload?.game_progress?.save?.character)).toBe(false);
  });
});

test('voltar ao app aberto atualiza o cartão com o avanço do outro aparelho', async ({ browser, baseURL, isMobile }) => {
  await withDevices(browser, baseURL!, isMobile, async (a, b) => {
    for (const [event, xp, correctTotal, label] of [
      ['pageshow', 177, 5, 'Evolução: 100/200 XP'],
      ['visibilitychange', 199, 7, 'Evolução: 140/200 XP'],
    ] as const) {
      await replaceLocal(a, journey({ saveRevision: event, timestamp: CLOCK + xp * 1000, xp, correctTotal }));
      await sync(a);
      await b.evaluate(event => {
        if (event === 'pageshow') window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
        else {
          Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
          document.dispatchEvent(new Event('visibilitychange'));
        }
      }, event);
      await b.clock.runFor(250);
      await expect(b.locator('#wsSavedXpText')).toHaveText(label);
      expect(await saved(b)).toMatchObject({ xp, correctTotal });
    }
  });
});

test('gravações concorrentes preservam cada jornada até resolver o conflito', async ({ browser, baseURL, isMobile }) => {
  await withDevices(browser, baseURL!, isMobile, async (a, b, backend) => {
    const first = journey({ saveRevision: 'concurrent-a', timestamp: CLOCK + 2000, xp: 177, correctTotal: 5, gold: 77 });
    const second = journey({ saveRevision: 'concurrent-b', timestamp: CLOCK + 3000, xp: 160, correctTotal: 6, gold: 99 });
    await replaceLocal(a, first);
    await replaceLocal(b, second);
    backend.simultaneousWrites = [];
    await Promise.all([sync(a), sync(b)]);
    expect(backend.row.game_progress_version).toBe(1);
    const winner = backend.row.game_progress!.save;
    expect([first.xp, second.xp]).toContain(winner.xp);
    const losingPage = winner.xp === first.xp ? b : a;
    const loser = winner.xp === first.xp ? second : first;
    expect(await saved(losingPage)).toMatchObject({ xp: loser.xp, gold: loser.gold, correctTotal: loser.correctTotal });
    const dialog = losingPage.getByRole('dialog', { name: 'Sincronização da jornada' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Usar jornada deste aparelho', exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Usar jornada da nuvem', exact: true }).click();
    await expect(dialog).toBeHidden();
    const resume = losingPage.getByRole('button', { name: /Retomar jornada/ });
    await expect(resume).toBeVisible();
    await expect(resume).toBeFocused();
    expect(await saved(losingPage)).toMatchObject({ xp: winner.xp, gold: winner.gold, correctTotal: winner.correctTotal });
    expect(backend.row.game_progress!.save).toEqual(winner);
  });
});

for (const change of ['stop', 'owner'] as const) {
  test(`o conflito fecha ao ${change === 'stop' ? 'encerrar a jornada' : 'trocar de conta'} sem enviar o snapshot antigo`, async ({ browser, baseURL, isMobile }) => {
    await withDevices(browser, baseURL!, isMobile, async (a, b, backend) => {
      const first = journey({ saveRevision: 'lifecycle-a', timestamp: CLOCK + 2000, xp: 177, correctTotal: 5, gold: 77 });
      const second = journey({ saveRevision: 'lifecycle-b', timestamp: CLOCK + 3000, xp: 160, correctTotal: 6, gold: 99 });
      await replaceLocal(a, first);
      await replaceLocal(b, second);
      backend.simultaneousWrites = [];
      await Promise.all([sync(a), sync(b)]);
      const losingPage = backend.row.game_progress!.save.xp === first.xp ? b : a;
      const dialog = losingPage.getByRole('dialog', { name: 'Sincronização da jornada' });
      await expect(dialog).toBeVisible();
      const before = copy(backend.row);
      const attempts = backend.writes.length;
      await losingPage.evaluate(change => {
        if (change === 'stop') (window as any)._stopLocalJourney();
        else (window as any).authUser = {
          id: '00000000-0000-4000-8000-000000002281',
          email: 'other-sync@example.test', user_metadata: { nickname: 'Outra conta' }, app_metadata: {},
        };
      }, change);
      await expect(dialog).toHaveCount(0);
      await losingPage.clock.fastForward(12000);
      expect(backend.row).toEqual(before);
      expect(backend.writes).toHaveLength(attempts);
    });
  });
}

test('falha de envio conserva o save local e uma retentativa confirma o avanço', async ({ browser, baseURL, isMobile }) => {
  await withDevices(browser, baseURL!, isMobile, async (a, _b, backend) => {
    const next = journey({ saveRevision: 'retry-a', timestamp: CLOCK + 2000, xp: 177, correctTotal: 5 });
    await replaceLocal(a, next);
    backend.failNextWrite = true;
    await sync(a);
    expect(backend.row.game_progress?.save).toMatchObject({ xp: 40, correctTotal: 2 });
    expect(await saved(a)).toMatchObject({ xp: 177, correctTotal: 5 });
    const status = a.locator('#cloudSyncStatus');
    await expect(status).toBeVisible();
    await expect(status).toContainText(/pendente|falh|conexão|não foi possível|tentar/i);
    await sync(a);
    expect(backend.row.game_progress?.save).toMatchObject({ xp: 177, correctTotal: 5 });
    await expect(status).toContainText(/salvo|sincronizad/i);
    await expect(status).not.toContainText(/pendente|falh|não foi possível/i);
  });
});

test('escolher a jornada local permite repetir o envio após falha sem perder a alternativa remota', async ({ browser, baseURL, isMobile }) => {
  await withDevices(browser, baseURL!, isMobile, async (a, b, backend) => {
    const remote = journey({ saveRevision: 'remote-choice', timestamp: CLOCK + 2000, xp: 177, correctTotal: 5, gold: 77 });
    const local = journey({ saveRevision: 'local-choice', timestamp: CLOCK + 3000, xp: 160, correctTotal: 6, gold: 99 });
    await replaceLocal(a, remote);
    await sync(a);
    await replaceLocal(b, local);
    await sync(b);
    const dialog = b.getByRole('dialog', { name: 'Sincronização da jornada' });
    await expect(dialog).toBeVisible();
    backend.failNextWrite = true;
    const chooseLocal = dialog.getByRole('button', { name: 'Usar jornada deste aparelho', exact: true });
    await chooseLocal.click();
    await expect(dialog.getByRole('status')).toContainText(/não foi possível|tente novamente/i);
    await expect(chooseLocal).toBeEnabled();
    expect(backend.row.game_progress?.save).toMatchObject({ xp: remote.xp, gold: remote.gold, correctTotal: remote.correctTotal });
    expect(await saved(b)).toMatchObject({ xp: local.xp, gold: local.gold, correctTotal: local.correctTotal });
    await chooseLocal.click();
    await expect(dialog).toBeHidden();
    expect(backend.row.game_progress_version).toBe(2);
    expect(backend.row.game_progress?.save).toMatchObject({ xp: local.xp, gold: local.gold, correctTotal: local.correctTotal });
  });
});
