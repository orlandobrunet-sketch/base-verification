import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

const CLOCK = Date.UTC(2026, 10, 15, 15);
const authors = Array.from({ length: 3 }, (_, index) => ({
  qid: 'rapid-urgency-author-' + index, t: 'Interface técnica', cat: 'geral',
  q: 'Questão técnica ' + index, opts: ['A', 'B', 'C', 'D'], ans: 0,
  exp: 'Explicação técnica, sem conteúdo clínico.',
}));
const rapid = Array.from({ length: 12 }, (_, index) => ({
  qid: 'rapid-urgency-' + index, q: 'Afirmação técnica ' + index,
  ans: true, cat: 'geral', exp: 'Explicação técnica que permanece aberta para leitura.',
}));
type Audit = { errors: string[]; nonGET: string[]; sockets: number };
const audits = new WeakMap<Page, Audit>();

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'no-preference' } });

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(origin).hostname);
  const audit: Audit = { errors: [], nonGET: [], sockets: 0 };
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await page.context().route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') {
      audit.nonGET.push(request.method() + ' ' + url.pathname);
      return route.abort();
    }
    return url.origin === origin && !['image', 'media', 'font'].includes(request.resourceType())
      ? route.continue() : route.abort();
  });
  await page.context().routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, authors);
  await page.route('**/data/refs.js*', route => route.fulfill({
    contentType: 'application/javascript', body: 'const refsDB = {};',
  }));
  await page.route('**/data/articles.js*', route => route.fulfill({
    contentType: 'application/javascript', body: 'const nefroArticles = [];',
  }));
  await page.route('**/data/rapid-quiz.js*', route => route.fulfill({
    contentType: 'application/javascript', body: 'const RAPID_QUIZ_QUESTIONS = ' + JSON.stringify(rapid) + ';',
  }));
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async () => { await (window as any)._loadTopics(); await document.fonts.ready; });
  await page.clock.install({ time: CLOCK - 1000 });
  await page.clock.pauseAt(CLOCK);
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="rapid"]:visible').click();
  await expect(page.locator('#mgQuestao')).toBeFocused();
  await expect(page.locator('#mgRelogio')).toHaveText('12 s');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
});

test.afterEach(async ({ page }, info) => {
  const audit = audits.get(page);
  await info.attach('rapid-urgency-audit', { contentType: 'application/json', body: JSON.stringify(audit) });
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
});

async function runningClockAnimations(page: Page) {
  return page.locator('#mgRelogio').evaluate(element => element.getAnimations()
    .filter(animation => animation.playState === 'running').length);
}

async function enterUrgency(page: Page) {
  await page.clock.runFor(8900);
  await expect(page.locator('#mgRelogio')).toHaveText('4 s');
  expect(await runningClockAnimations(page)).toBe(0);
  await page.clock.runFor(100);
  await expect(page.locator('#mgRelogio')).toHaveText('3 s');
  await expect.poll(() => runningClockAnimations(page)).toBeGreaterThan(0);
  await expect(page.locator('#mgFeedback')).toBeHidden();
}

for (const outcome of ['correct', 'wrong', 'timeout'] as const) {
  test('urgency stops during readable feedback after ' + outcome, async ({ page }) => {
    await enterUrgency(page);
    if (outcome === 'timeout') {
      await page.clock.runFor(2999);
      await expect(page.locator('#mgTrue')).toBeEnabled();
      await page.clock.runFor(1);
    } else {
      await page.keyboard.press(outcome === 'correct' ? 'v' : 'f');
    }
    await expect(page.locator('#mgFeedback')).toBeFocused();
    await expect(page.locator('#mgFeedback')).toContainText(
      outcome === 'correct' ? 'Correto.' : outcome === 'wrong' ? 'Incorreto.' : 'Tempo esgotado.');
    await expect(page.locator('#mgTrue')).toBeDisabled();
    await expect(page.locator('#mgFalse')).toBeDisabled();
    await expect.poll(() => runningClockAnimations(page)).toBe(0);
    const stopped = await page.locator('#mgRelogio').textContent();
    if (outcome === 'timeout') expect(stopped).toBe('0 s');
    await page.clock.runFor(1500);
    await expect(page.locator('#mgRelogio')).toHaveText(stopped!);
    expect(await runningClockAnimations(page)).toBe(0);
    await expect(page.locator('#mgQuestao')).toHaveText('Afirmação 1 de 10');
    await page.locator('#mgProxima').click();
    await expect(page.locator('#mgQuestao')).toHaveText('Afirmação 2 de 10');
    await expect(page.locator('#mgRelogio')).toHaveText('12 s');
    await enterUrgency(page);
    await page.locator('#mgSair').click();
    await expect(page.locator('#rapidQuizPage')).toHaveCount(0);
  });
}

test('leaving an unanswered urgent question retires its animation and timer', async ({ page }) => {
  await enterUrgency(page);
  const clock = await page.locator('#mgRelogio').elementHandle();
  expect(clock).not.toBeNull();
  await page.locator('#mgSair').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect(page.locator('[data-atrium-route="modes"]')).toBeFocused();
  expect(await clock!.evaluate(element => ({ connected: element.isConnected,
    running: element.getAnimations().filter(animation => animation.playState === 'running').length,
  }))).toEqual({ connected: false, running: 0 });
  await page.clock.runFor(15000);
  await expect(page.locator('#rapidQuizPage')).toHaveCount(0);
  await expect(page.locator('#mgFeedback')).toHaveCount(0);
});
