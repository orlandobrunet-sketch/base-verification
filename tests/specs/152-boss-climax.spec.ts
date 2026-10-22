import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { saveBase } from '../helpers/fixtures';
import { medirContraste } from '../helpers/contraste';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ context, baseURL }, info) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => {
    const request = route.request();
    return new URL(request.url()).origin === origin && ['GET', 'HEAD'].includes(request.method())
      ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  // Composição local opcional com a correção técnica isolada do sandbox;
  // nenhum JS é copiado para o worktree visual por este teste.
  if (process.env.NQ_DEMO_GAME_JS) {
    const body = readFileSync(process.env.NQ_DEMO_GAME_JS);
    await info.attach('isolated-demo-game-source', { body: JSON.stringify({ source: process.env.NQ_DEMO_GAME_JS, sha256: createHash('sha256').update(body).digest('hex'), delivery: 'local route fixture; visual worktree JavaScript unchanged' }), contentType: 'application/json' });
    await context.route('**/js/game.js*', route => route.fulfill({ contentType: 'text/javascript', body }));
  }
});

const protectedKeys = ['nefroquest-save', 'nefroquest-save-v7', 'nefroquest-detailed-stats',
  'nefroquest-achievements', 'nefroquest-badge-history', 'nefroquest-arqui-defeated',
  'nefroquest-hardcore-completed', 'unlockedArticles', 'nefroquest_total_accumulated_knowledge', 'nefroquest-mastery', 'nefroquest-rated-questions'];
const storage = (page: Page) => page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), protectedKeys);

async function abrir(page: Page, width = 1440) {
  await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).startBossPreview === 'function');
  await page.evaluate(save => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({ totalQuestions: 3, totalCorrect: 1, totalWrong: 2, byTopic: {}, byCategory: {}, questionHistory: [] }));
    localStorage.setItem('nefroquest-achievements', '[]');
    localStorage.setItem('nefroquest-badge-history', JSON.stringify({ 1: { jornada: 1 } }));
    return (window as any).startBossPreview();
  }, saveBase({ correctTotal: 15, gold: 5000 }));
  await expect(page.locator('body')).toHaveAttribute('data-progress-sandbox', 'boss-preview');
  await expect(page.locator('#question')).not.toBeEmpty();
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator('#arquiBossImgEl').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
}

async function fecharNarrativas(page: Page) {
  // A evolução nativa aparece600ms e o baú1200ms após o acerto. Aguarda
  // ambos os prazos e usa
  // exclusivamente os botões reais dos diálogos, sem remover nós ou gates.
  await page.waitForTimeout(1300);
  const selector = '#arquiQ9Popup, #battleFinalPopup, .narrative-popup, .evolution-popup, #chestModal.show';
  for (let attempt = 0; attempt < 8; attempt++) {
    const index = await page.locator(selector).evaluateAll(elements => elements
      .map((element, index) => ({ index, visible: !!element.getClientRects().length && getComputedStyle(element).display !== 'none', z: Number(getComputedStyle(element).zIndex) || 0 }))
      .filter(item => item.visible).sort((left, right) => right.z - left.z || right.index - left.index)[0]?.index ?? -1);
    if (index < 0) return;
    const popup = page.locator(selector).nth(index);
    const chest = await popup.getAttribute('id') === 'autoChestPopup';
    if (chest) await page.evaluate(() => { (window as any)._fixtureRandom = Math.random; Math.random = () => 0; });
    await popup.getByRole('button').last().click();
    if (chest) {
      await expect(page.locator('#autoChestPopup')).toHaveCount(0);
      await page.evaluate(() => { Math.random = (window as any)._fixtureRandom; delete (window as any)._fixtureRandom; });
    }
  }
  throw new Error('Narrativas não encerraram pelos controles nativos.');
}

async function semOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual((await page.viewportSize())!.width + 1);
  const bad = await page.locator('#mainApp .panel.right').evaluate(root => {
    const result: string[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || !node.textContent?.trim() || !parent.getClientRects().length || parent.closest('.hidden,[hidden],[inert],script,style')) continue;
      if (getComputedStyle(parent).visibility === 'hidden') continue;
      const range = document.createRange(); range.selectNodeContents(node);
      if ([...range.getClientRects()].some(box => box.width && (box.left < -1 || box.right > innerWidth + 1))) result.push(node.textContent.trim());
    }
    return result;
  });
  expect(bad).toEqual([]);
}

for (const width of [390, 1440]) test(`dez golpes até a vitória em${width}px preservam progresso real`, async ({ page }, info) => {
  test.setTimeout(120_000);
  await abrir(page, width);
  const saved = await storage(page);
  const ledger: unknown[] = [];
  for (let progress = 0; progress < 10; progress++) {
    const hp = page.getByRole('progressbar', { name: 'Vida do Arqui-Nefromante' });
    await expect(hp).toHaveAttribute('aria-valuenow', String(100 - progress * 10));
    await expect(page.locator('#arquiStarsDesktop')).toHaveAttribute('aria-label', `${progress} de 10 golpes concluídos`);
    await expect(page.locator('#bossQuestionNum')).toHaveText(`FASE FINAL ${progress + 1}/10`);
    const before = await page.evaluate(() => {
      const s = (window as any).state;
      return { answer: s.current.a, correct: s.correctTotal, gold: s.gold, score: s.score, id: s.current.id };
    });
    await page.locator(`#options .option[data-idx="${before.answer}"]`).click();
    await expect.poll(() => page.evaluate(() => (window as any).state.correctTotal)).toBe(91 + progress);
    const after = await page.evaluate(() => ({ hp: (window as any).getBossHP(), gold: (window as any).state.gold, score: (window as any).state.score }));
    expect(after.hp).toBe(90 - progress * 10);
    expect(after.gold).toBeGreaterThan(before.gold);
    expect(after.score).toBeGreaterThan(before.score);
    ledger.push({ progress: progress + 1, id: before.id, before, after });
    await fecharNarrativas(page);
    expect(await storage(page), 'demonstração gravou progresso real').toEqual(saved);
    if (progress < 9) {
      await expect(page.locator('#arquiStarsDesktop .filled')).toHaveCount(progress + 1);
      await page.locator('#nextBtn').click();
      await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion') && !(window as any).state.answered);
    }
  }
  await expect(page.locator('#victoryModal')).toBeVisible();
  await expect(page.locator('#victoryModal').getByRole('heading', { name: 'Jornada concluída' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).state.gameCompleted)).toBe(true);
  expect(await page.evaluate(() => (window as any).isProgressSandbox())).toBe(true);
  expect(await storage(page)).toEqual(saved);
  await info.attach('boss-native-ten-hit-ledger', { body: JSON.stringify(ledger, null, 2), contentType: 'application/json' });
});

test('erro mantém HP e dez etapas, resposta única e derrota continuam nativos', async ({ page }) => {
  await abrir(page, 390);
  const saved = await storage(page);
  // Fixture de combate sem equipamento: remove somente a absorção aleatória
  // da defesa para observar a perda de uma vida, sem mudar a regra do jogo.
  await page.evaluate(() => {
    const w = window as any;
    for (const slot of Object.keys(w.state.equipment)) w.state.equipment[slot] = { n: 'Vazio', rar: 'common', atk: 0, def: 0, kno: 0, luck: 0 };
    w.state.lives = 2;
    w.renderHUD();
  });
  const wrong = await page.evaluate(() => ((window as any).state.current.a + 1) % (window as any).state.current.o.length);
  await page.evaluate(() => { (window as any)._fixtureRandom = Math.random; Math.random = () => .99; });
  await page.locator(`#options .option[data-idx="${wrong}"]`).click();
  await page.evaluate(() => { Math.random = (window as any)._fixtureRandom; delete (window as any)._fixtureRandom; });
  await expect(page.locator('#options .option.wrong')).toBeVisible();
  expect(await page.evaluate(() => (window as any).state.correctTotal)).toBe(90);
  expect(await page.evaluate(() => (window as any).getBossHP())).toBe(100);
  expect(await page.evaluate(() => (window as any).state.lives)).toBe(1);
  expect(await page.evaluate(() => (window as any).state.gameOver)).toBe(false);
  const after = await page.evaluate(() => JSON.stringify({ gold: (window as any).state.gold, lives: (window as any).state.lives, correct: (window as any).state.correctTotal }));
  await page.locator(`#options .option[data-idx="${wrong}"]`).evaluate((button: HTMLButtonElement) => button.click());
  expect(await page.evaluate(() => JSON.stringify({ gold: (window as any).state.gold, lives: (window as any).state.lives, correct: (window as any).state.correctTotal }))).toBe(after);
  await page.locator('#nextBtn').click();
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion') && !(window as any).state.answered);
  const finalWrong = await page.evaluate(() => ((window as any).state.current.a + 1) % (window as any).state.current.o.length);
  await page.evaluate(() => { (window as any)._fixtureRandom = Math.random; Math.random = () => .99; });
  await page.locator(`#options .option[data-idx="${finalWrong}"]`).click();
  await page.evaluate(() => { Math.random = (window as any)._fixtureRandom; delete (window as any)._fixtureRandom; });
  expect(await page.evaluate(() => (window as any).state.lives)).toBe(0);
  expect(await page.evaluate(() => (window as any).state.gameOver)).toBe(true);
  expect(await page.evaluate(() => (window as any).state.correctTotal)).toBe(90);
  expect(await page.evaluate(() => (window as any).getBossHP())).toBe(100);
  await expect(page.locator('#question')).toContainText('Fim da jornada');
  await expect(page.locator('#options .option')).toHaveCount(0);
  await page.waitForTimeout(700);
  expect(await storage(page)).toEqual(saved);
});

for (const width of [320, 390, 1100, 1440]) test(`cena compacta e texto200% cabem em${width}px`, async ({ page }) => {
  await abrir(page, width);
  const saved = await storage(page);
  const encounter = (await page.locator('#nqBossEncounter').boundingBox())!;
  const image = (await page.locator('#arquiBossImageDesktop').boundingBox())!;
  expect(image.width).toBeGreaterThan(encounter.width * .5);
  expect(image.height).toBeGreaterThanOrEqual(encounter.height - 3);
  const question = (await page.locator('#mainApp .qbox').boundingBox())!;
  expect(question.y).toBeLessThan(width < 500 ? 450 : 400);
  await semOverflow(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await semOverflow(page);
  for (const selector of ['#question', '.opt-body', '#bossHpPct', '#bossQuestionNum', '#progressSandboxBanner']) {
    expect(await page.evaluate(medirContraste, selector), selector).toEqual([]);
  }
  for (const button of await page.locator('#options .option').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.locator('#arquiBossTitleDesktop').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.getByRole('button', { name: 'Sair da demonstração' }).click();
  await expect(page.locator('#progressSandboxBanner')).toHaveCount(0);
  expect(await storage(page)).toEqual(saved);
});
