import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';
import { bossPresentation, finishBossCinema } from '../helpers/cinema';
import { saveBase } from '../helpers/fixtures';
import { attachFailureEvidence } from '../helpers/failure-evidence';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const audits = new WeakMap<Page, { errors: string[]; nonGET: string[]; sockets: number }>();
const protectedKeys = ['nefroquest-save', 'nefroquest-save-v7', 'nefroquest-detailed-stats',
  'nefroquest-achievements', 'nefroquest-badge-history', 'nefroquest-arqui-defeated',
  'nefroquest-hardcore-completed', 'unlockedArticles', 'nefroquest_total_accumulated_knowledge',
  'nefroquest-mastery', 'nefroquest-rated-questions'];
const storage = (page: Page) => page.evaluate(keys =>
  Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), protectedKeys);

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const audit = { errors: [] as string[], nonGET: [] as string[], sockets: 0 };
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') {
      audit.nonGET.push(request.method() + ' ' + url.pathname);
      return route.abort();
    }
    if (url.origin !== origin || ['media', 'font'].includes(request.resourceType())) return route.abort();
    if (request.resourceType() === 'image') return route.fulfill({ contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#18242d"/></svg>' });
    return route.continue();
  });
  await page.context().routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, [{ qid: 'final-chest-286', t: 'Interface técnica', cat: 'geral',
    q: 'Marcador técnico do último estágio.', opts: ['Marcador A', 'Marcador B', 'Marcador C', 'Marcador D'],
    ans: 0, exp: 'Correção exclusivamente técnica.', refs: [], diff: 'hard' }]);
  // Both the question and the awarded article are authored technical inputs.
  // Reward calculation, ownership and native result presentation remain real.
  await page.route('**/data/refs.js*', route => route.fulfill({ contentType: 'application/javascript', body: 'const refsDB = {};' }));
  await page.route('**/data/articles.js*', route => route.fulfill({ contentType: 'application/javascript',
    body: 'const nefroArticles = ' + JSON.stringify([{ titulo: 'Pergaminho técnico da vitória',
      autores: 'Fixture de interface', jornal: 'Registro técnico', ano: 2026, raridade: 'comum',
      resumo: 'Texto técnico de teste.', conclusao: 'Verificação da interface.',
      curiosidade: 'Sem conteúdo clínico.', impacto: 'Confere a entrega nativa do prêmio.' }]) + ';' }));
  await page.addInitScript(() => localStorage.setItem('pwa-dismissed', '1'));
  await page.goto('/jogar/', { waitUntil: 'load' });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  expect(await page.evaluate(() => (0, eval)('authUser === null'))).toBe(true);
});

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) await attachFailureEvidence(page, info);
  const audit = audits.get(page);
  await info.attach('final-chest-victory-audit', { contentType: 'application/json', body: JSON.stringify(audit) });
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
});

test('the final earned chest claims once and preserves victory and normal progress', async ({ page }, info) => {
  // This new native-ending contract has its own planned30s limit. Existing
  // dialog/chest contracts retain their20s deadlines.
  test.setTimeout(30_000);
  await page.evaluate(save => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
      totalQuestions: 3, totalCorrect: 1, totalWrong: 2, byTopic: {}, byCategory: {}, questionHistory: [] }));
    localStorage.setItem('nefroquest-achievements', '[]');
    localStorage.setItem('nefroquest-badge-history', JSON.stringify({ 1: { jornada: 1 } }));
  }, saveBase({ correctTotal: 15, gold: 5000 }));
  const saved = await storage(page);
  await page.evaluate(() => (window as any).startBossPreview());
  await expect(page.locator('body')).toHaveAttribute('data-progress-sandbox', 'boss-preview');
  await page.waitForFunction(() => (0, eval)('!!state.current && !_loadingNextQuestion'));
  await page.evaluate(() => {
    (0, eval)('Object.assign(state, { correctTotal: 99, chestCorrectCount: 0, chestTarget: 1 }); renderHUD(); updateBossUI();');
  });
  // The original last-stage announcements use their actual exposed controls.
  await expect(page.locator('#battleFinalPopup')).toBeVisible();
  await page.locator('#battleFinalPopup').getByRole('button', { name: 'Enfrentar o destino', exact: true }).click();
  const finalWarning = page.locator('#arquiQ9Popup');
  if (await finalWarning.isVisible()) await finalWarning.getByRole('button').last().click();
  const view = await bossPresentation(page);
  await expect(view.stage).toHaveText(view.stageText(9));
  const before = await page.evaluate(() => (0, eval)(
    '({ answer: state.current.a, correct: state.correctTotal, hp: getBossHP(), chests: state.chestsOpened, score: state.score })'));
  expect(before.correct).toBe(99);
  expect(before.hp).toBe(10);
  await page.locator(`#options .option[data-idx="${before.answer}"]`).click();
  await expect(page.locator('#autoChestPopup')).toBeVisible();
  await expect(page.locator('#autoChestPopup .nqch-trigger')).toBeFocused();
  if (view.cinematic) {
    await expect.poll(() => page.evaluate(() =>
      (window as any).NQVictoryBridge.inspection.records.at(-1)?.status)).toBe('waiting-native-overlay');
    await expect(page.locator('#victoryModal')).toHaveCount(0);
  } else await expect(page.locator('#victoryModal')).toHaveCount(0);
  // Explicitly choose the article branch only at its RNG boundary, just as
  // spec152 does; no product function, counter, lease or reward is stubbed.
  await page.evaluate(() => {
    (window as any).__finalChest286Random = Math.random;
    Math.random = () => 0;
  });
  try {
    await page.locator('#autoChestPopup').getByRole('button', { name: 'Abrir baú', exact: true }).click();
    await expect(page.locator('#autoChestPopup')).toHaveCount(0);
    await expect(page.locator('#chestModal.show')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (0, eval)('state.chestsOpened'))).toBe(before.chests + 1);
    expect(await page.evaluate(() => (0, eval)('state.score'))).toBeGreaterThan(before.score);
  } finally {
    await page.evaluate(() => {
      Math.random = (window as any).__finalChest286Random;
      delete (window as any).__finalChest286Random;
    });
  }
  await page.locator('#chestModal.show').getByRole('button', { name: 'Continuar', exact: true }).click();
  await finishBossCinema(page);
  await expect(page.locator('#victoryModal').getByRole('heading', { name: 'Jornada concluída' })).toBeVisible();
  expect(await page.evaluate(() => (0, eval)(
    '({ correct: state.correctTotal, hp: getBossHP(), completed: state.gameCompleted, sandbox: isProgressSandbox(), chests: state.chestsOpened })')))
    .toEqual({ correct: 100, hp: 0, completed: true, sandbox: true, chests: before.chests + 1 });
  // Observe the existing500ms autosave window without dismissing results.
  await page.waitForTimeout(700);
  await expect(page.locator('#autoChestPopup')).toHaveCount(0);
  expect(await page.evaluate(() => (0, eval)('state.chestsOpened'))).toBe(before.chests + 1);
  expect(await storage(page)).toEqual(saved);
  await info.attach('final-chest-victory-endpoint', { contentType: 'application/json',
    body: JSON.stringify({ cinematic: view.cinematic, before, finalCorrect: 100, finalHP: 0,
      chestClaims: 1, normalProgressBytesPreserved: true }) });
});
