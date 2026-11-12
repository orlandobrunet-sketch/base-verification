import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';
import { injectGameState } from '../helpers/game';

const CLOCK = Date.UTC(2026, 10, 11, 15);
const authors = Array.from({ length: 12 }, (_, i) => ({
  qid: 'minigame-technical-' + i, t: 'Fluxo técnico',
  q: 'Escolha a opção técnica identificada como correta no cartão ' + i + '. ' + 'Texto fictício para conferir leitura e navegação. '.repeat(4),
  opts: ['Opção correta ' + i, 'Outra opção ' + i, 'Terceira opção ' + i, 'Última opção ' + i],
  ans: 0, exp: 'Explicação técnica sem conteúdo clínico.', cat: 'geral',
  diff: ['easy', 'medium', 'hard'][i % 3], refs: [],
}));
const rapid = Array.from({ length: 10 }, (_, i) => ({
  qid: 'rapid-technical-' + i,
  q: 'Afirmação fictícia número ' + i + '. ' + 'Uma afirmação técnica para verificar o tempo e a leitura. '.repeat(4),
  ans: true, cat: 'geral', exp: 'Explicação fictícia para leitura. '.repeat(18),
}));

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await routeTechnicalQuestionBank(page, authors);
  await page.route('**/data/rapid-quiz.js*', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: 'const RAPID_QUIZ_QUESTIONS = ' + JSON.stringify(rapid) + ';' }));
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async () => { await (window as any)._loadTopics(); await document.fonts.ready; });
  await page.clock.install({ time: CLOCK - 1000 });
  await page.clock.pauseAt(CLOCK);
});

async function openRapid(page: Page) {
  await page.evaluate(() => (window as any).showRapidQuizMinigame(true));
  await expect(page.locator('#mgTrue')).toBeEnabled();
}
async function visibleStart(page: Page, selector: string) {
  const box = await page.locator(selector).evaluate(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: innerHeight }; });
  expect(box.top).toBeGreaterThanOrEqual(-1);
  expect(box.bottom).toBeLessThanOrEqual(box.height + 1);
}

test('Julgamento esgota no prazo de 12000ms, sem um tick extra', async ({ page }) => {
  await openRapid(page);
  await page.clock.runFor(11999);
  await expect(page.locator('#mgTrue')).toBeEnabled();
  await page.clock.runFor(1);
  await expect(page.locator('#mgFeedback')).toContainText('Tempo esgotado.');
  await expect(page.locator('#mgTrue')).toBeDisabled();
});

test('Julgamento aceita resposta antes do limite e conserva a correção', async ({ page }) => {
  await openRapid(page);
  await page.clock.setSystemTime(CLOCK + 11999);
  await page.locator('#mgTrue').click();
  await expect(page.locator('#mgFeedback')).toContainText('Correto.');
  await page.clock.fastForward(60000);
  await expect(page.locator('#mgFeedback')).not.toContainText('Tempo esgotado.');
  await expect(page.locator('#mgQuestao')).toHaveText('Afirmação 1 de 10');
  await expect(page.locator('.nq-exam-marca')).toHaveCount(1);
});

test('Julgamento rejeita clique no limite antes do callback do cronômetro', async ({ page }) => {
  await openRapid(page);
  await page.clock.setSystemTime(CLOCK + 12000);
  await page.locator('#mgTrue').click();
  await expect(page.locator('#mgFeedback')).toContainText('Tempo esgotado.');
  await expect(page.locator('#mgFeedback')).not.toContainText('Correto.');
  await page.clock.fastForward(60000);
  await expect(page.locator('.nq-exam-marca')).toHaveCount(1);
});

test('Julgamento usa tempo decorrido quando callbacks são suspensos', async ({ page }) => {
  await openRapid(page);
  await page.clock.fastForward(60000);
  await expect(page.locator('#mgFeedback')).toContainText('Tempo esgotado.');
  await expect(page.locator('#mgRelogio')).toHaveText('0 s');
  await page.keyboard.press('Enter');
  await expect(page.locator('#mgQuestao')).toHaveText('Afirmação 2 de 10');
  await page.clock.runFor(11999);
  await expect(page.locator('#mgTrue')).toBeEnabled();
  await page.clock.runFor(1);
  await expect(page.locator('#mgFeedback')).toContainText('Tempo esgotado.');
});

for (const event of ['visibilitychange', 'pageshow']) {
  test('Julgamento confere o prazo ao retornar por ' + event, async ({ page }) => {
    await openRapid(page);
    await page.clock.setSystemTime(CLOCK + 30000);
    await page.evaluate(event => (event === 'visibilitychange' ? document : window).dispatchEvent(new Event(event)), event);
    await expect(page.locator('#mgFeedback')).toContainText('Tempo esgotado.');
    await expect(page.locator('#mgFeedback')).toBeFocused();
    await page.keyboard.press('v');
    await expect(page.locator('.nq-exam-marca')).toHaveCount(1);
  });
}

test('Julgamento revela a correção em320px/200% e preserva Tab e Enter', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  await openRapid(page);
  await page.locator('#mgTrue').click();
  await expect(page.locator('#mgFeedback')).toBeFocused();
  await visibleStart(page, '#mgFeedback .nq-exam-veredito');
  await page.keyboard.press('Control+Enter');
  await expect(page.locator('#mgQuestao')).toHaveText('Afirmação 1 de 10');
  await page.keyboard.press('Tab');
  await expect(page.locator('#mgProxima')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mgQuestao')).toHaveText('Afirmação 2 de 10');
  await expect(page.locator('#mgQuestao')).toBeFocused();
  await visibleStart(page, '#mgQuestao');
});

test('Ritual mantém veredito para leitura e conclui oito respostas uma vez', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  const before = await page.evaluate(() => (0, eval)('JSON.stringify([state.gold,state.xp,state.correctTotal,state.score,state.lives])'));
  await page.evaluate(() => (window as any).openRitual());
  await page.locator('#ritualStart').click();
  for (let step = 1; step <= 8; step++) {
    await expect(page.locator('#ritualQuestao')).toHaveText(`Questão ${step} de 8`);
    const correct = await page.evaluate(authors => {
      const text = document.querySelector('#ritualPage .nq-exam-enunciado')!.textContent;
      const author = authors.find(q => q.q === text)!;
      return [...document.querySelectorAll('#ritualOpts button > span:last-child')].findIndex(option => option.textContent === author.opts[0]);
    }, authors);
    expect(correct).toBeGreaterThanOrEqual(0);
    await page.locator('#ritualOpts button').nth(correct).click();
    await expect(page.locator('#ritualVeredito')).toBeFocused();
    await visibleStart(page, '#ritualVeredito');
    await page.clock.fastForward(5000);
    await expect(page.locator('#ritualQuestao')).toHaveText(`Questão ${step} de 8`);
    if (step < 8) {
      expect(await page.evaluate(() => localStorage.getItem('nefroquest-ritual-done'))).toBeNull();
      await page.keyboard.press('Enter');
    } else {
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Ver resultado', exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
    }
  }
  await expect(page.locator('#ritualTitulo')).toHaveText('Ritual concluído');
  await expect(page.locator('#ritualTitulo')).toBeFocused();
  await visibleStart(page, '#ritualTitulo');
  await expect(page.locator('.nql-ritual-result')).toContainText('Você acertou 8 de 8');
  const persisted = await page.evaluate(() => ({ recommendation: localStorage.getItem('nefroquest-recommended-difficulty'), sr: localStorage.getItem('nefroquest-sr-data'), done: localStorage.getItem('nefroquest-ritual-done') }));
  expect(persisted.recommendation).toBe('hardcore');
  expect(Object.keys(JSON.parse(persisted.sr || '{}'))).toHaveLength(8);
  expect(persisted.done).not.toBeNull();
  await page.clock.fastForward(60000);
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-sr-data'))).toBe(persisted.sr);
  expect(await page.evaluate(() => (0, eval)('JSON.stringify([state.gold,state.xp,state.correctTotal,state.score,state.lives])'))).toBe(before);
});

test('Ritual revela título em tela curta e não retoma depois de sair', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 390 });
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  await page.evaluate(() => (window as any).openRitual());
  await page.locator('#ritualStart').click();
  await expect(page.locator('#ritualQuestao')).toBeFocused();
  await visibleStart(page, '#ritualQuestao');
  await page.locator('#ritualOpts button').first().click();
  await expect(page.locator('#ritualVeredito')).toBeFocused();
  await page.keyboard.press('Escape');
  await page.clock.fastForward(60000);
  await expect(page.locator('#ritualPage')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-ritual-done'))).toBeNull();
});

test('Julgamento encerrado não recria correção ao voltar de outra sessão', async ({ page }) => {
  await openRapid(page);
  await page.keyboard.press('Escape');
  await page.evaluate(() => (window as any).clearLocalProgress('logout'));
  await page.clock.setSystemTime(CLOCK + 30000);
  await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pageshow')); });
  await page.clock.fastForward(60000);
  await expect(page.locator('#rapidQuizPage')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-minigame-best'))).toBeNull();
});

test('retirar jornada normal fecha Ritual e desarma continuação e Escape antigos', async ({ page }) => {
  await page.clock.resume();
  await injectGameState(page);
  await page.evaluate(() => (window as any).openRitual());
  await page.locator('#ritualStart').click();
  await page.locator('#ritualOpts button').first().click();
  await expect(page.locator('#ritualVeredito')).toBeFocused();
  const stopped = await page.evaluate(() => {
    const target = window as any;
    target.__retiredRitual = document.getElementById('ritualPage');
    target.__retiredRitualNext = document.getElementById('ritualNext');
    target._stopLocalJourney();
    return { save: localStorage.getItem('nefroquest-save-v7'), sr: localStorage.getItem('nefroquest-sr-data'), recommendation: localStorage.getItem('nefroquest-recommended-difficulty') };
  });
  await expect(page.locator('#ritualPage')).toHaveCount(0);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  const afterStaleActions = await page.evaluate(() => {
    const target = window as any;
    target.__retiredRitualNext.click();
    target.__retiredRitual.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return { save: localStorage.getItem('nefroquest-save-v7'), sr: localStorage.getItem('nefroquest-sr-data'), recommendation: localStorage.getItem('nefroquest-recommended-difficulty') };
  });
  expect(afterStaleActions).toEqual(stopped);
  await expect(page.locator('#ritualPage')).toHaveCount(0);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect(page.locator('#mainApp')).toBeHidden();
  expect(await page.evaluate(() => (0, eval)('state.gameStarted'))).toBe(false);
});
