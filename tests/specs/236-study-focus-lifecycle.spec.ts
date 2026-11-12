import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

// This deterministic initial-focus race is separate from the unresolved
// historical report of a focused correction outside the viewport.
const authors = Array.from({ length: 3 }, (_, index) => ({
  qid: 'study-focus-lifecycle-' + index, t: 'Fluxo técnico', cat: 'geral',
  q: 'Questão técnica ' + index + ': confira a alternativa indicada.',
  opts: ['Alternativa técnica A', 'Alternativa técnica B', 'Alternativa técnica C', 'Alternativa técnica D'],
  ans: index, exp: 'Explicação técnica para conferir o fluxo de foco.',
}));

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

async function prepare(page: Page, openStudyHub = true) {
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
  if (!openStudyHub) return;
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="study"]:visible').click();
  await expect(page.locator('[data-action="startFreeStudyMode"]')).toBeVisible();
}

async function twoFrames(page: Page) {
  await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

test('responder antes do primeiro quadro mantém o foco na correção', async ({ page }) => {
  await prepare(page);
  await page.evaluate(async () => {
    await (window as any).startFreeStudyMode();
    (document.querySelector('#studyOptions button') as HTMLButtonElement).click();
  });
  await twoFrames(page);
  await expect(page.locator('#studyFeedback')).toBeFocused();
  await expect(page.locator('#studyModePage [data-action="nextStudyQuestion"]')).toBeVisible();
});

test('entrada normal continua oferecendo foco inicial útil', async ({ page }) => {
  await prepare(page);
  await page.locator('[data-action="startFreeStudyMode"]').click();
  await twoFrames(page);
  await expect(page.getByRole('button', { name: 'Pausar e voltar', exact: true })).toBeFocused();
});

test('fechar antes do primeiro quadro não devolve foco à página removida', async ({ page }) => {
  await prepare(page);
  await page.evaluate(async () => {
    await (window as any).startFreeStudyMode();
    (window as any).exitStudyMode();
    (document.querySelector('#welcomeScreen [data-action="startNewFromWelcome"]') as HTMLElement).focus();
  });
  await twoFrames(page);
  await expect(page.locator('#studyModePage')).toHaveCount(0);
  await expect(page.locator('#welcomeScreen [data-action="startNewFromWelcome"]')).toBeFocused();
});

test('substituir a sessão preserva o foco já escolhido na nova superfície', async ({ page }) => {
  await prepare(page);
  await page.evaluate(async () => {
    await (window as any).startFreeStudyMode();
    (window as any).restartStudyMode();
    const options = document.querySelectorAll<HTMLButtonElement>('#studyOptions button');
    options[options.length - 1].focus();
  });
  await twoFrames(page);
  await expect(page.locator('#studyModePage')).toHaveCount(1);
  await expect(page.locator('#studyOptions button').last()).toBeFocused();
});

test('uma montagem de outro dono não recupera o foco após mudar a conta', async ({ page }) => {
  await prepare(page);
  await page.evaluate(async () => {
    await (window as any).startFreeStudyMode();
    (window as any).authUser = { id: '00000000-0000-4000-8000-000000002360', app_metadata: {} };
    const marker = document.createElement('button');
    marker.id = 'studyOwnerFocus'; marker.textContent = 'Controle da sessão atual';
    document.body.appendChild(marker); marker.focus();
  });
  await twoFrames(page);
  await expect(page.locator('#studyOwnerFocus')).toBeFocused();
});

for (const closeAt of [200, 700]) test(`retomada preserva Estudo e retorno à jornada ao sair após ${closeAt}ms`, async ({ page }) => {
  await prepare(page, false);
  const now = Date.now();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now + 1000);
  await page.evaluate(() => {
    localStorage.setItem('nefroquest-save', JSON.stringify({ schemaVersion: 2, character: 'glomerulus',
      level: 5, xp: 150, xpToNext: 400, score: 2500, lives: 3, streak: 2, gold: 80,
      correctTotal: 15, gameStarted: true, gameOver: false, difficulty: 'normal',
      narrativeShown: 0, bossIntroShown: false, idx: 0, queueIds: [], recentIds: [], chestsOpened: 2, timestamp: Date.now() }));
    (window as any).refreshWelcomeSave();
    (document.getElementById('welcomeContinueBtn') as HTMLButtonElement).click();
  });
  await expect.poll(() => page.evaluate(() => (0, eval)('state.gameStarted && !!state.current'))).toBe(true);
  const journey = await page.evaluate(() => (0, eval)('({character:state.character,level:state.level,xp:state.xp,score:state.score,gold:state.gold,lives:state.lives,correctTotal:state.correctTotal})'));
  await page.evaluate(() => {
    (window as any).openGameModesPopup();
    (document.querySelector('[data-mode-route="study"]') as HTMLButtonElement).click();
  });
  await expect(page.locator('[data-action="startFreeStudyMode"]')).toHaveCount(1);
  await page.evaluate(() => (document.querySelector('[data-action="startFreeStudyMode"]') as HTMLButtonElement).click());
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const wrong = await page.evaluate(() => (0, eval)('(_studyPresentations[studyModeIndex].a + 1) % 4'));
  await page.locator('#studyOptions button').nth(wrong).focus();
  await page.keyboard.press(String(wrong + 1));
  await page.clock.runFor(closeAt);
  await expect(page.locator('#studyFeedback')).toBeFocused();
  await expect(page.locator('#studyFeedback')).toBeInViewport();
  await expect(page.locator('#mainApp')).toBeHidden();
  expect(await page.locator('#mainApp').evaluate(element => (element as HTMLElement).inert)).toBe(true);
  await page.evaluate(() => (window as any).exitStudyMode());
  await page.clock.runFor(1000);
  await expect(page.locator('#studyModePage')).toHaveCount(0);
  await expect(page.locator('#mainApp')).toBeVisible();
  await expect(page.locator('#welcomeScreen')).toBeHidden();
  expect(await page.locator('#mainApp').evaluate(element => (element as HTMLElement).inert)).toBe(false);
  expect(await page.evaluate(() => (0, eval)('({character:state.character,level:state.level,xp:state.xp,score:state.score,gold:state.gold,lives:state.lives,correctTotal:state.correctTotal})'))).toEqual(journey);
  expect(await page.evaluate(() => (0, eval)('_continueGamePending'))).toBe(false);
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null'));
  expect(save).toMatchObject(journey);
  expect(await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    return !!active && active.getClientRects().length > 0 && !active.closest('[hidden],[inert],.hidden') &&
      (active.id === 'mainApp' || active.matches('button,a[href],[role="button"],input'));
  })).toBe(true);
});
