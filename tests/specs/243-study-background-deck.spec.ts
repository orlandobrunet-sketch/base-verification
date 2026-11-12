import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

// Separate reproduction: this starts at the END of a campaign deck, unlike191.
// No production function, timer, journey binding, question rule or CSS is replaced.
// Long, nonclinical text only makes scrolling to the correction observable.
const authors = Array.from({ length: 3 }, (_, index) => ({
  qid: 'finish-deck-technical-' + index, t: 'Fluxo técnico', cat: 'geral', diff: 'medium',
  q: 'Questão técnica ' + index + '. ' +
    'Este bloco verifica navegação, foco e rolagem entre superfícies do aplicativo. '.repeat(9),
  opts: ['A', 'B', 'C', 'D'].map(letter =>
    'Alternativa técnica ' + letter + ': texto de interface para conferir a posição do controle.'),
  ans: index % 4,
  exp: 'Explicação exclusivamente técnica para verificar a correção focada e visível após um timer da campanha.',
}));
const lastId = authors[authors.length - 1].qid;
type Motion = 'reduce' | 'no-preference';

test.use({ serviceWorkers: 'block' });

async function campaign(page: Page) {
  return page.evaluate(() => (0, eval)(`JSON.parse(JSON.stringify({
    current:state.current?.id, index:state.idx, answered:state.answered,
    character:state.character, level:state.level, xp:state.xp, score:state.score,
    gold:state.gold, lives:state.lives, correct:state.correctTotal
  }))`));
}

async function prepareLastCard(page: Page, baseURL: string, motion: Motion) {
  const origin = new URL(baseURL).origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(baseURL).hostname);
  await page.route('**/*', route => {
    const request = route.request();
    return request.method() === 'GET' && new URL(request.url()).origin === origin &&
      !['image', 'media', 'font'].includes(request.resourceType())
      ? route.continue() : route.abort();
  });
  await page.routeWebSocket('**/*', socket => socket.close());
  await routeTechnicalQuestionBank(page, authors);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await injectGameState(page, {
    schemaVersion: 6, queueIds: authors.map(q => q.qid), idx: authors.length - 1,
    recentIds: [], gold: 0, streak: 0, lives: 10, correctTotal: 10, narrativeShown: 1,
  }, { replaceSnapshot: true });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches))
    .toBe(motion === 'reduce');
  expect((await campaign(page)).current).toBe(lastId);
  expect((await campaign(page)).index).toBe(authors.length);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.evaluate(() => document.fonts.ready);

  // Finish initial render unlock400/continue cleanup520 before the scenario.
  // Subsequent UI actions run at one frozen instant, with no wall-clock race.
  const now = Date.now();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now + 1000);
  await page.evaluate(() => {
    const timeline: unknown[] = [];
    (window as any).__finishDeckTimeline = timeline;
    const scroll = window.scrollTo;
    window.scrollTo = function (...args: any[]) {
      timeline.push({ kind: 'scrollTo', at: Date.now(), args,
        studying: document.body.classList.contains('nq-studying'),
        mainHidden: document.getElementById('mainApp')?.classList.contains('hidden'),
        active: document.activeElement?.id, stack: new Error().stack });
      return Reflect.apply(scroll, this, args);
    } as typeof window.scrollTo;
  });
}

async function exhaustDeck(page: Page) {
  const wrong = await page.evaluate(() => (0, eval)('(state.current.a + 1) % 4'));
  // Native click + existing data-action dispatcher, not a direct finishDeck call.
  await page.locator('#options .option').nth(wrong).evaluate((button: HTMLButtonElement) => button.click());
  expect((await campaign(page)).answered).toBe(true);
  await page.clock.runFor(100); // Complete the campaign's existing reveal80.
  await expect(page.locator('#nextBtn')).toBeVisible();
  await page.locator('#nextBtn').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('#feedback')).toContainText('Baralho completo!');
  expect((await campaign(page)).index).toBe(0); // Actual shuffleQueue ran.
}

async function enterAndAnswerStudy(page: Page) {
  await page.evaluate(() => {
    (window as any).openGameModesPopup();
    (document.querySelector('[data-mode-route="study"]') as HTMLButtonElement).click();
  });
  await expect(page.locator('[data-action="startFreeStudyMode"]')).toBeVisible();
  await page.locator('[data-action="startFreeStudyMode"]').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  const wrong = await page.evaluate(() => (0, eval)('(_studyPresentations[studyModeIndex].a + 1) % 4'));
  await page.locator('#studyOptions button').nth(wrong).focus();
  await page.keyboard.press(String(wrong + 1));
  await expect(page.locator('#mainApp')).toBeHidden();
  await expect(page.locator('#studyFeedback')).toBeFocused();
  await expect(page.locator('#studyFeedback')).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(740);
}

for (const motion of ['reduce', 'no-preference'] as const) {
  test.describe(`movimento ${motion}`, () => {
    test.use({ contextOptions: { reducedMotion: motion } });

    test.afterEach(async ({ page }, info) => {
      if (page.isClosed()) return;
      const observation = await page.evaluate(requestedMotion => ({
        requestedMotion,
        effectiveReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        separateFrom191: true,
        scenario: 'campaign deck exhausted, then Study answered before finishDeck1800',
        timeline: (window as any).__finishDeckTimeline,
        campaign: (0, eval)('({id:state.current?.id,index:state.idx,answered:state.answered})'),
        active: document.activeElement?.id,
        scrollY: window.scrollY, viewportHeight: innerHeight,
        feedback: document.getElementById('studyFeedback')?.getBoundingClientRect().toJSON(),
        mainHidden: document.getElementById('mainApp')?.classList.contains('hidden'),
      }), motion);
      await info.attach('finish-deck-evidence', {
        body: JSON.stringify(observation, null, 2), contentType: 'application/json',
      });
    });

    test('fim do baralho não tira da janela a correção focada do Estudo', async ({ page, baseURL }) => {
      await prepareLastCard(page, baseURL!, motion);
      await exhaustDeck(page);
      await enterAndAnswerStudy(page);
      if (motion === 'reduce') await page.clock.runFor(1799);
      expect((await campaign(page)).index).toBe(0); // Callback is still pending.
      await expect(page.locator('#studyFeedback')).toBeFocused();
      await expect(page.locator('#studyFeedback')).toBeInViewport();
      if (motion === 'reduce') {
        await page.clock.runFor(2); // Cross exactly the actual finishDeck1800 boundary.
      } else {
        // Timers and native smooth scrolling must advance together in real time.
        await page.clock.resume();
        await expect.poll(async () => (await campaign(page)).index).toBe(1);
      }
      expect((await campaign(page)).index).toBe(1); // Callback really rendered a card.
      await expect(page.locator('#mainApp')).toBeHidden();
      await expect(page.locator('#studyFeedback')).toBeFocused();
      await expect(page.locator('#studyFeedback')).toBeInViewport();
    });

    test('retornar do Estudo preserva a nova carta da campanha e permite responder', async ({ page, baseURL }) => {
      await prepareLastCard(page, baseURL!, motion);
      await exhaustDeck(page);
      await enterAndAnswerStudy(page);
      if (motion === 'reduce') {
        await page.clock.runFor(1801);
      } else {
        expect((await campaign(page)).index).toBe(0);
        await page.clock.resume();
        await expect.poll(async () => (await campaign(page)).index).toBe(1);
      }
      const newCard = await campaign(page);
      expect(newCard.index).toBe(1);
      expect(newCard.current).not.toBe(lastId);
      expect(newCard.answered).toBe(false);
      await page.getByRole('button', { name: 'Pausar e voltar', exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(page.locator('#studyModePage')).toHaveCount(0);
      await expect(page.locator('#mainApp')).toBeVisible();
      expect(await campaign(page)).toEqual(newCard);
      expect(await page.locator('#question').textContent()).toBe(await page.evaluate(() => (0, eval)('state.current.q')));
      if (motion === 'reduce') {
        await page.clock.runFor(2500);
      } else {
        await expect.poll(() => page.evaluate(() => (0, eval)('_loadingNextQuestion'))).toBe(false);
      }
      expect(await campaign(page)).toEqual(newCard);
      const wrong = await page.evaluate(() => (0, eval)('(state.current.a + 1) % 4'));
      await page.locator('#options .option').nth(wrong).evaluate((button: HTMLButtonElement) => button.click());
      expect((await campaign(page)).answered).toBe(true);
    });
  });
}
