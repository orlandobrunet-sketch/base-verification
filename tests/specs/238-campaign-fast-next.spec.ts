import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

const authors = Array.from({ length: 3 }, (_, index) => ({
  qid: 'campaign-fast-next-' + index, cat: 'geral', diff: 'easy',
  q: 'Questão técnica ' + index + ': escolha a alternativa indicada.',
  opts: ['Alternativa técnica A', 'Alternativa técnica B', 'Alternativa técnica C', 'Alternativa técnica D'],
  ans: index, exp: 'Explicação técnica para conferir o avanço da jornada.',
}));

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function snapshot(page: Page) {
  return page.evaluate(() => (0, eval)(`({
    now:Date.now(), currentId:state.current?.id, index:state.idx, answered:state.answered,
    loading:_loadingNextQuestion, continuePending:_continueGamePending,
    saveTimer:_saveTimer, autoSaveTimer:_autoSaveTimer,
    level:state.level, xp:state.xp, gold:state.gold, correct:state.correctTotal,
    clicks:window.__fastNextClicks || 0
  })`));
}

async function prepare(page: Page) {
  await page.route('**/*', route => {
    const request = route.request();
    if (['image', 'media', 'font'].includes(request.resourceType())) return route.abort();
    return ['localhost', '127.0.0.1'].includes(new URL(request.url()).hostname) && request.method() === 'GET'
      ? route.continue() : route.abort();
  });
  await page.routeWebSocket('**/*', socket => socket.close());
  await routeTechnicalQuestionBank(page, authors);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => (window as any)._loadTopics());
  const now = Date.now();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now + 1000);
  await page.evaluate(ids => {
    localStorage.setItem('nefroquest-save', JSON.stringify({
      schemaVersion: 2, character: 'glomerulus', difficulty: 'normal',
      level: 1, xp: 0, xpToNext: 200, score: 0, lives: 4, maxLives: 4, streak: 0, gold: 0,
      correctTotal: 0, gameStarted: true, gameOver: false, narrativeShown: 1,
      bossIntroShown: false, idx: 0, queueIds: ids, recentIds: [], chestsOpened: 0,
      chestCorrectCount: 0, chestTarget: 5, timestamp: Date.now(),
    }));
    return (window as any).continueGame();
  }, authors.map(author => author.qid));
  await expect(page.locator('#mainApp')).toBeVisible();
  await expect(page.locator('#options .option')).toHaveCount(4);
  await page.evaluate(() => {
    (window as any).__fastNextClicks = 0;
    document.getElementById('nextBtn')!.addEventListener('click', () => { (window as any).__fastNextClicks++; });
  });
  const initial = await snapshot(page);
  expect(initial).toMatchObject({ level: 1, xp: 0, gold: 0, correct: 0, answered: false, loading: true });
  return initial;
}

async function answerAndNext(page: Page, clicks = 1) {
  return page.evaluate(clicks => {
    const correct = (0, eval)('state.current.a');
    document.querySelectorAll<HTMLButtonElement>('#options .option')[correct].click();
    const next = document.getElementById('nextBtn') as HTMLButtonElement;
    const enabled = !next.disabled && !next.classList.contains('hidden');
    for (let index = 0; index < clicks; index++) next.click();
    return enabled;
  }, clicks);
}

test('Próxima aceita a resposta rápida sem perder o clique dentro dos primeiros 400ms', async ({ page }, info) => {
  const initial = await prepare(page);
  const enabled = await answerAndNext(page);
  const immediate = await snapshot(page);
  await page.clock.runFor(401);
  const after401 = await snapshot(page);
  await info.attach('avanço-rapido', { body: JSON.stringify({ initial, enabled, immediate, after401 }, null, 2), contentType: 'application/json' });
  expect(enabled).toBe(true);
  expect(immediate.clicks).toBe(1);
  expect(immediate.now).toBe(initial.now);
  expect(immediate.currentId, 'o clique habilitado deve avançar antes de soltar o relógio').not.toBe(initial.currentId);
  expect(immediate).toMatchObject({ answered: false, correct: 1, index: initial.index + 1 });
  expect(after401).toMatchObject({ currentId: immediate.currentId, answered: false, correct: 1, index: immediate.index });
});

test('cliques repetidos não pulam pergunta sem resposta nem liberam a trava de outro render', async ({ page }, info) => {
  const initial = await prepare(page);
  await page.clock.runFor(200);
  const enabled = await answerAndNext(page, 2);
  const immediate = await snapshot(page);
  await page.clock.runFor(201);
  const after401 = await snapshot(page);
  await page.evaluate(() => (document.getElementById('nextBtn') as HTMLButtonElement).click());
  const queuedClick = await snapshot(page);
  await page.clock.runFor(200);
  await page.evaluate(() => (document.getElementById('nextBtn') as HTMLButtonElement).click());
  const after601 = await snapshot(page);
  await info.attach('avanço-repetido', { body: JSON.stringify({ initial, enabled, immediate, after401, queuedClick, after601 }, null, 2), contentType: 'application/json' });
  expect(enabled).toBe(true);
  expect(immediate.clicks).toBe(2);
  expect(immediate.currentId).not.toBe(initial.currentId);
  expect(immediate).toMatchObject({ answered: false, correct: 1, index: initial.index + 1 });
  expect(after401, 'a liberação do render anterior não libera a trava de 400ms do novo').toMatchObject({ currentId: immediate.currentId, answered: false, loading: true });
  for (const step of [queuedClick, after601]) {
    expect(step).toMatchObject({ currentId: immediate.currentId, answered: false, correct: 1, index: immediate.index });
  }
  expect(after601.loading).toBe(false);
});
