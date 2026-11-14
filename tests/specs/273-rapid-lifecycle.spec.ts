import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

const CLOCK = Date.UTC(2026, 10, 14, 15);
const authors = Array.from({ length: 3 }, (_, index) => ({
  qid: 'rapid-lifecycle-author-' + index, t: 'Interface', cat: 'geral',
  q: 'Questão técnica ' + index, opts: ['A', 'B', 'C', 'D'], ans: 0,
  exp: 'Explicação de interface, sem conteúdo clínico.',
}));
const rapid = Array.from({ length: 12 }, (_, index) => ({
  qid: 'rapid-lifecycle-' + index, q: 'Afirmação técnica ' + index + '. ' +
    'Este texto verifica o ciclo da interface sem conteúdo clínico. '.repeat(4),
  ans: true, cat: 'geral', exp: 'Explicação técnica para conferir a leitura e a navegação. '.repeat(12),
}));
type Audit = { errors: string[]; nonGET: string[]; sockets: number };
const audits = new WeakMap<Page, Audit>();

async function prepare(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(origin).hostname);
  const audit: Audit = { errors: [], nonGET: [], sockets: 0 }; audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await page.context().route('**/*', route => {
    const request = route.request();
    if (request.method() !== 'GET') { audit.nonGET.push(request.method()); return route.abort(); }
    return new URL(request.url()).origin === origin && !['image', 'media', 'font'].includes(request.resourceType())
      ? route.continue() : route.abort();
  });
  await page.context().routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, authors);
  await page.route('**/data/rapid-quiz.js*', route => route.fulfill({ status: 200,
    contentType: 'application/javascript', body: 'const RAPID_QUIZ_QUESTIONS = ' + JSON.stringify(rapid) + ';' }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async () => { await (window as any)._loadTopics(); await document.fonts.ready; });
  await page.clock.install({ time: CLOCK - 1000 });
  await page.clock.pauseAt(CLOCK);
}

async function openRapid(page: Page) {
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="rapid"]:visible').click();
  await expect(page.locator('#mgQuestao')).toBeFocused();
  await expect(page.locator('#mgRelogio')).toHaveText('12 s');
  await expect(page.locator('#welcomeScreen')).toBeHidden();
}

test.afterEach(async ({ page }, info) => {
  const audit = audits.get(page);
  if (!audit) return;
  await info.attach('rapid-native-guards', { contentType: 'application/json', body: JSON.stringify(audit) });
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
});

for (const motion of ['reduce', 'no-preference'] as const) test.describe('movimento ' + motion, () => {
  test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: motion } });

  test('sair após responder retira o efeito da página anterior', async ({ page, baseURL }, info) => {
    await prepare(page, baseURL!); await openRapid(page);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion === 'reduce');
    await page.keyboard.press('v');
    await expect(page.locator('#mgFeedback')).toBeFocused();
    await expect(page.locator('.floating-text')).toHaveCount(1);
    const closed = await page.evaluate(() => {
      (document.getElementById('mgSair') as HTMLButtonElement).click();
      return { pageExists: !!document.getElementById('rapidQuizPage'),
        effects: [...document.querySelectorAll('.floating-text')].map(node => ({ text: node.textContent,
          opacity: getComputedStyle(node).opacity, animation: getComputedStyle(node).animationName })) };
    });
    await info.attach('rapid-effects-after-exit', { contentType: 'application/json', body: JSON.stringify(closed) });
    expect(closed.pageExists).toBe(false); expect(closed.effects).toEqual([]);
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    await expect(page.locator('[data-atrium-route="modes"]')).toBeFocused();
    await page.clock.fastForward(60000);
    await expect(page.locator('#rapidQuizPage')).toHaveCount(0);
    await expect(page.locator('.floating-text')).toHaveCount(0);
  });

  test('uma segunda entrada conserva a rodada e o contexto de navegação', async ({ page, baseURL }, info) => {
    await prepare(page, baseURL!); await openRapid(page);
    await page.clock.runFor(1000);
    await expect(page.locator('#mgRelogio')).toHaveText('11 s');
    await page.evaluate(() => {
      (window as any).__originalRapidPage = document.getElementById('rapidQuizPage');
      (window as any).showStandaloneMinigame();
    });
    await page.clock.runFor(100);
    const active = await page.evaluate(() => {
      const audio = document.querySelector('#mobileSoundControls .nq-audio-button');
      const audioBox = audio?.getBoundingClientRect(), clockBox = document.getElementById('mgRelogio')!.getBoundingClientRect();
      return {
      samePage: document.getElementById('rapidQuizPage') === (window as any).__originalRapidPage,
      studying: document.body.classList.contains('nq-studying'),
      welcomeHidden: document.getElementById('welcomeScreen')!.classList.contains('hidden'),
      welcomeInert: (document.getElementById('welcomeScreen') as HTMLElement).inert,
      clock: document.getElementById('mgRelogio')!.textContent,
      audioOverlapsClock: !!audioBox?.width && audioBox.right > clockBox.left && audioBox.left < clockBox.right &&
        audioBox.bottom > clockBox.top && audioBox.top < clockBox.bottom,
      };
    });
    await info.attach('rapid-second-entry', { contentType: 'application/json', body: JSON.stringify(active) });
    expect(active).toEqual({ samePage: true, studying: true, welcomeHidden: true, welcomeInert: true,
      clock: '11 s', audioOverlapsClock: false });
    await page.locator('#mgSair').click();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    await expect(page.locator('[data-atrium-route="modes"]')).toBeFocused();
    await openRapid(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#welcomeScreen')).toBeVisible();
  });
});

for (const motion of ['reduce', 'no-preference'] as const) test.describe('prazo, teclado e controles aposentados: ' + motion, () => {
  test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: motion } });

  test('sair e reabrir desarma o relógio antigo e ignora controles da página fechada', async ({ page, baseURL }) => {
    await prepare(page, baseURL!); await openRapid(page);
    await page.evaluate(() => {
      (window as any).__oldRapidTrue = document.getElementById('mgTrue');
      (window as any).__oldRapidExit = document.getElementById('mgSair');
      (window as any).__oldRapidPage = document.getElementById('rapidQuizPage');
    });
    await page.clock.runFor(5000); await page.locator('#mgSair').click();
    await openRapid(page);
    await page.evaluate(() => {
      (window as any).__oldRapidTrue.click(); (window as any).__oldRapidExit.click();
      (window as any).__oldRapidPage.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }));
    });
    await page.clock.runFor(7000);
    await expect(page.locator('#mgRelogio')).toHaveText('5 s');
    await expect(page.locator('#mgFeedback')).toBeHidden();
    await expect(page.locator('#welcomeScreen')).toBeHidden();
    await page.keyboard.press('v');
    await expect(page.locator('#mgFeedback')).toContainText('Correto.');
    await expect(page.locator('.floating-text')).toHaveCount(1);
    await page.evaluate(() => (window as any).__oldRapidExit.click());
    await expect(page.locator('.floating-text')).toHaveCount(1);
    await page.locator('#mgSair').click();
    await expect(page.locator('.floating-text')).toHaveCount(0);
  });

  test('resposta antes do prazo é única, preserva a correção e mantém os atalhos modificados', async ({ page, baseURL }) => {
    await prepare(page, baseURL!); await openRapid(page);
    for (const shortcut of ['Control+v', 'Alt+f', 'Meta+v']) await page.keyboard.press(shortcut);
    await expect(page.locator('#mgFeedback')).toBeHidden();
    await expect(page.locator('#mgTrue')).toBeEnabled();
    await page.clock.setSystemTime(CLOCK + 11999);
    await page.keyboard.press('v'); await page.keyboard.press('f');
    await expect(page.locator('#mgFeedback')).toBeFocused();
    await expect(page.locator('#mgFeedback')).toContainText('Correto.');
    await expect(page.locator('.nq-exam-marca')).toHaveCount(1);
    const stopped = await page.locator('#mgRelogio').textContent();
    await page.clock.fastForward(60000);
    await expect(page.locator('#mgRelogio')).toHaveText(stopped!);
    await expect(page.locator('#mgQuestao')).toHaveText('Afirmação 1 de 10');
    await page.keyboard.press('Control+Enter');
    await expect(page.locator('#mgQuestao')).toHaveText('Afirmação 1 de 10');
    await page.keyboard.press('Enter');
    await expect(page.locator('#mgQuestao')).toHaveText('Afirmação 2 de 10');
    await expect(page.locator('#mgQuestao')).toBeFocused();
    await expect(page.locator('#mgRelogio')).toHaveText('12 s');
    await expect(page.locator('.floating-text')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.clock.fastForward(60000);
    await expect(page.locator('#rapidQuizPage')).toHaveCount(0);
    await expect(page.locator('#welcomeScreen')).toBeVisible();
  });
});
