import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => new URL(route.request().url()).origin === origin && ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  // Rota opcional apenas para o controle negativo local e o candidato isolado.
  // Na suíte integrada, o navegador recebe o JS real servido pelo checkout.
  if (process.env.NQ_DEMO_GAME_JS) await context.route('**/js/game.js*', route => route.fulfill({ contentType: 'text/javascript', body: readFileSync(process.env.NQ_DEMO_GAME_JS!) }));
  if (process.env.NQ_DEMO_BASE_HTML) await context.route('**/jogar/', route => route.fulfill({ contentType: 'text/html', body: readFileSync(process.env.NQ_DEMO_BASE_HTML!) }));
  if (process.env.NQ_DEMO_BASE_CSS) await context.route('**/styles/lumen/boss.css*', route => route.fulfill({ contentType: 'text/css', body: readFileSync(process.env.NQ_DEMO_BASE_CSS!) }));
});

const keys = ['unlockedArticles', 'nefroquest_total_accumulated_knowledge', 'nefroquest-save', 'nefroquest-save-v7', 'nefroquest-achievements', 'nefroquest-badge-history', 'nefroquest-detailed-stats', 'nefroquest-arqui-defeated', 'nefroquest-hardcore-completed'];
const snapshot = (page: Page) => page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), keys);

async function open(page: Page, demo: boolean) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).startBossPreview === 'function');
  await page.evaluate(() => {
    localStorage.setItem('unlockedArticles', '[]');
    localStorage.setItem('nefroquest_total_accumulated_knowledge', '7');
    localStorage.setItem('nefroquest-achievements', '[]');
    localStorage.setItem('nefroquest-badge-history', JSON.stringify({ 1: { jornada: 2 } }));
  });
  if (demo) await page.evaluate(() => (window as any).startBossPreview());
  else {
    await injectGameState(page, { gold: 5000, chestsOpened: 3, correctTotal: 15, character: 'nephros' });
    await page.evaluate(() => (window as any).carregarDadosGrimorio());
  }
  await expect(page.locator('#question')).not.toBeEmpty();
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
}

async function claimFreeArticle(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    w._fixtureChestRandom = Math.random;
    Math.random = () => 0;
    w.triggerChestRewardPopup();
  });
  await page.locator('#autoChestPopup').getByRole('button', { name: 'Abrir baú', exact: true }).click();
  await expect(page.locator('#autoChestPopup')).toHaveCount(0);
  await expect(page.locator('#chestModal')).toHaveClass(/show/);
  await page.evaluate(() => { Math.random = (window as any)._fixtureChestRandom; delete (window as any)._fixtureChestRandom; });
}

test('baú grátis de artigo no Demo preserva bytes do progresso real', async ({ page }, info) => {
  await open(page, true);
  const before = await snapshot(page);
  const initial = await page.evaluate(() => ({ qid: (window as any).state.current.id, gold: (window as any).state.gold, score: (window as any).state.score, chests: (window as any).state.chestsOpened }));
  expect(await page.evaluate(() => (window as any).isProgressSandbox())).toBe(true);
  await claimFreeArticle(page);
  const after = await snapshot(page);
  const memory = await page.evaluate(() => ({ articles: (0, eval)('unlockedArticles'), chests: (window as any).state.chestsOpened, gold: (window as any).state.gold, score: (window as any).state.score }));
  await info.attach('demo-free-chest-byte-ledger', { body: JSON.stringify({ action: 'Abrir baú grátis pela UI', deterministicArticleIndex: 0, initial, before, after, memory }, null, 2), contentType: 'application/json' });
  expect(memory.articles).toEqual([0]);
  expect(memory.chests).toBe(initial.chests + 1);
  expect(memory.gold).toBe(initial.gold);
  expect(memory.score).toBeGreaterThan(initial.score);
  expect(after).toEqual(before);
  await page.locator('#chestModal').getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.waitForTimeout(700);
  expect(await snapshot(page)).toEqual(before);
  await page.getByRole('button', { name: 'Sair da demonstração', exact: true }).click();
  await expect(page.locator('#progressSandboxBanner')).toHaveCount(0);
  await page.waitForFunction(() => typeof (window as any).isProgressSandbox === 'function');
  expect(await page.evaluate(() => (window as any).isProgressSandbox())).toBe(false);
  expect(await snapshot(page)).toEqual(before);
  expect(await page.evaluate(() => (0, eval)('unlockedArticles'))).toEqual([]);
});

test('baú grátis normal mantém desbloqueio e conhecimento sem cobrar ouro', async ({ page }, info) => {
  await open(page, false);
  expect(await page.evaluate(() => (window as any).isProgressSandbox())).toBe(false);
  const before = await snapshot(page);
  const gold = await page.evaluate(() => (window as any).state.gold);
  await claimFreeArticle(page);
  const after = await snapshot(page);
  await info.attach('normal-free-chest-byte-ledger', { body: JSON.stringify({ before, after }, null, 2), contentType: 'application/json' });
  expect(after.unlockedArticles).toBe('[0]');
  expect(after.nefroquest_total_accumulated_knowledge).toBe('11');
  expect(await page.evaluate(() => (window as any).state.chestsOpened)).toBe(4);
  expect(await page.evaluate(() => (window as any).state.gold)).toBe(gold);
});
