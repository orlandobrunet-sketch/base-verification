import { bossPresentation, finishBossCinema } from '../helpers/cinema';
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
  const view = await bossPresentation(page);
  await expect(view.image).toBeVisible();
  const image = view.cinematic ? view.image : page.locator('#arquiBossImgEl');
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
}

async function fecharNarrativas(page: Page) {
  // O 100º acerto encerra este cenário na vitória. Um baú simultâneo pode
  // continuar atrás dela; não se tenta acionar um controle encoberto.
  if (await page.evaluate(() => (window as any).state.gameCompleted)) {
    await finishBossCinema(page);
    await expect(page.locator('#victoryModal')).toBeVisible();
    return;
  }
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
    const view = await bossPresentation(page);
    await expect(hp).toHaveAttribute('aria-valuetext', `HP ${100 - progress * 10}%, ${progress} de 10 golpes concluídos`);
    await expect(view.stage).toHaveText(view.stageText(progress));
    if (view.cinematic) await expect(page.locator('#arquiStarsDesktop')).toBeHidden();
    else await expect(page.locator('#arquiStarsDesktop')).toHaveAttribute('aria-label', `${progress} de 10 golpes concluídos`);
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
      const view = await bossPresentation(page);
      await expect(hp).toHaveAttribute('aria-valuenow', String(90 - progress * 10));
      if (!view.cinematic) await expect(page.locator('#arquiStarsDesktop .filled')).toHaveCount(progress + 1);
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

test('baú no décimo estágio mantém a vitória como endpoint sem gravar progresso real', async ({ page }, info) => {
  await abrir(page, 1440);
  const saved = await storage(page);
  // Fixture no último estágio: as quatro jornadas completas acima continuam
  // percorrendo os dez acertos nativos. Aqui isolamos a colisão baú/vitória.
  await page.evaluate(() => {
    const w = window as any;
    Object.assign(w.state, { correctTotal: 99, chestCorrectCount: 0, chestTarget: 1 });
    w.renderHUD();
    w.updateBossUI();
  });
  await fecharNarrativas(page);
  const view = await bossPresentation(page);
  await expect(view.stage).toHaveText(view.stageText(9));
  const before = await page.evaluate(() => {
    const w = window as any;
    w._fixtureRandom = Math.random;
    Math.random = () => 0; // O baú nativo entrega um artigo, sem alterar o sorteio do produto.
    return { answer: w.state.current.a, correct: w.state.correctTotal, hp: w.getBossHP(), chests: w.state.chestsOpened, score: w.state.score };
  });
  try {
    expect(before.correct).toBe(99);
    expect(before.hp).toBe(10);
    await page.locator(`#options .option[data-idx="${before.answer}"]`).click();
    await expect(page.locator('#autoChestPopup')).toBeVisible();
    if (view.cinematic) {
      await expect.poll(() => page.evaluate(() => (window as any).NQVictoryBridge.inspection.records.at(-1)?.status)).toBe('waiting-native-overlay');
      await expect(page.locator('#victoryModal')).toHaveCount(0);
      expect(await page.evaluate(() => (window as any).state.gameCompleted)).toBe(true);
      await info.attach('native-reward-before-results', { body: await page.screenshot(), contentType: 'image/png' });
    } else await expect(page.locator('#victoryModal')).toBeVisible();
    await page.locator('#autoChestPopup').getByRole('button', { name: 'Abrir baú', exact: true }).click();
    await expect(page.locator('#autoChestPopup')).toHaveCount(0);
    await expect(page.locator('#chestModal.show')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).state.chestsOpened)).toBe(before.chests + 1);
    expect(await page.evaluate(() => (window as any).state.score)).toBeGreaterThan(before.score);
    if (view.cinematic) await page.locator('#chestModal.show').getByRole('button').last().click();
    await fecharNarrativas(page);
  } finally {
    await page.evaluate(() => { Math.random = (window as any)._fixtureRandom; delete (window as any)._fixtureRandom; });
  }
  await expect(page.locator('#victoryModal').getByRole('heading', { name: 'Jornada concluída' })).toBeVisible();
  expect(await page.evaluate(() => ({ correct: (window as any).state.correctTotal, hp: (window as any).getBossHP(), completed: (window as any).state.gameCompleted, sandbox: (window as any).isProgressSandbox() })))
    .toEqual({ correct: 100, hp: 0, completed: true, sandbox: true });
  await info.attach('native-results-after-reward', { body: await page.screenshot(), contentType: 'image/png' });
  // O save tem debounce de 500 ms; aguarda sua janela sem fechar a vitória nem
  // limpar manualmente DOM, armazenamento ou gates.
  await page.waitForTimeout(700);
  expect(await storage(page)).toEqual(saved);
  await info.attach('boss-last-chest-native-endpoint', { body: JSON.stringify({ fixture: 'final stage99; native answer100; native article chest', before, persistedBytesPreserved: true }), contentType: 'application/json' });
});

for (const withChest of [false, true]) test(`evolução do último acerto aguarda filme e resultados ${withChest ? 'com' : 'sem'} baú, sem repetir recompensa`, async ({ page }, info) => {
  test.setTimeout(45000);
  await abrir(page, 1440);
  const saved = await storage(page);
  await page.evaluate(withChest => {
    const w = window as any;
    Object.assign(w.state, { correctTotal: 99, narrativeShown: 99, bossIntroShown: true,
      battleFinalShown: true, level: 9, xpToNext: w.xpForLevel(9), xp: w.xpForLevel(9) - 1,
      lives: w.effectiveMaxLives(), chestCorrectCount: 0, chestTarget: withChest ? 1 : 999 });
    w.renderHUD(); w.updateBossUI();
    w.__finalEvolutionCalls = 0;
    const native = w.showEvolutionPopup;
    w.showEvolutionPopup = function(...args: unknown[]) { w.__finalEvolutionCalls++; return native.apply(this, args); };
    const append = document.body.appendChild;
    (document.body as any).appendChild = function(node: Node) {
      if (node instanceof HTMLElement && node.matches('.evolution-popup')) w.__finalEvolutionNode ||= node;
      return append.call(this, node);
    };
  }, withChest);
  await fecharNarrativas(page);
  const before = await page.evaluate(() => ({ level: (window as any).state.level,
    answer: (window as any).state.current.a }));
  await page.locator(`#options .option[data-idx="${before.answer}"]`).click();
  await expect.poll(() => page.evaluate(() => (window as any).__finalEvolutionCalls)).toBe(1);
  const view = await bossPresentation(page);
  let resolved = await page.evaluate(() => JSON.stringify({ level: (window as any).state.level,
    gold: (window as any).state.gold, score: (window as any).state.score, xp: (window as any).state.xp,
    lives: (window as any).state.lives, correct: (window as any).state.correctTotal }));
  expect(JSON.parse(resolved).level).toBeGreaterThan(before.level);
  if (view.cinematic) {
    await expect.poll(() => page.evaluate(() => (window as any).NQVictoryBridge.inspection.evolution?.held)).toBe(1);
    await expect(page.locator('.evolution-popup')).toHaveCount(0);
    if (withChest) {
      const chest = page.locator('#autoChestPopup');
      await expect(chest).toBeVisible();
      await expect.poll(() => page.evaluate(() => (window as any).NQVictoryBridge.inspection.active?.status)).toBe('waiting-native-overlay');
      await finishBossCinema(page, true);
      resolved = await page.evaluate(() => JSON.stringify({ level: (window as any).state.level,
        gold: (window as any).state.gold, score: (window as any).state.score, xp: (window as any).state.xp,
        lives: (window as any).state.lives, correct: (window as any).state.correctTotal }));
    }
    await expect(page.locator('#nqVictoryCinema[open]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).NQVictoryCinema.inspection.stage)).toBe('playing');
    await expect(page.locator('#nqVictoryCinema video')).toHaveCount(1);
    await expect(page.locator('#nqVictoryCinema video')).toHaveJSProperty('muted', true);
    await page.locator('#nqVictoryCinema .nq-victory-cinema__skip').click();
    await expect(page.locator('#victoryModal')).toBeVisible();
    await expect(page.locator('.evolution-popup')).toHaveCount(0);
    await info.attach('results-before-final-evolution', { body: await page.screenshot(), contentType: 'image/png' });
    await page.locator('#victoryModal').getByRole('button', { name: 'Continuar jogando', exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as any).NQVictoryBridge.inspection.evolution.released)).toBe(1);
  } else {
    await expect(page.locator('#nqVictoryCinema[open]')).toHaveCount(0);
  }
  await expect(page.locator('.evolution-popup')).toBeVisible();
  expect(await page.evaluate(() => document.querySelector('.evolution-popup') === (window as any).__finalEvolutionNode)).toBe(true);
  expect(await page.evaluate(() => (window as any).__finalEvolutionCalls)).toBe(1);
  expect(await page.evaluate(() => JSON.stringify({ level: (window as any).state.level,
    gold: (window as any).state.gold, score: (window as any).state.score, xp: (window as any).state.xp,
    lives: (window as any).state.lives, correct: (window as any).state.correctTotal }))).toBe(resolved);
  expect(await storage(page)).toEqual(saved);
});

test('pulo aceito não reinicia filme quando recompensa aparece durante o fade', async ({ page }) => {
  await abrir(page, 1440);
  const view = await bossPresentation(page);
  test.skip(!view.cinematic, 'The cinematic exit fade exists only on desktop.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => {
    const w = window as any;
    Object.assign(w.state, { correctTotal: 99, narrativeShown: 99, battleFinalShown: true,
      bossIntroShown: true, chestCorrectCount: 0, chestTarget: 999 });
    w.updateBossUI(); w.renderHUD();
  });
  await fecharNarrativas(page);
  await page.locator(`#options .option[data-idx="${await page.evaluate(() => (window as any).state.current.a)}"]`).click();
  await expect.poll(() => page.evaluate(() => (window as any).NQVictoryCinema.inspection.stage)).toBe('playing');
  await page.evaluate(() => {
    const w = window as any;
    document.querySelector('#nqVictoryCinema .nq-victory-cinema__skip')!.addEventListener('click', () => {
      queueMicrotask(() => {
        w.__skipRaceWasClosing = w.NQVictoryCinema.inspection.stage === 'closing';
        w.showExtraLifeModal();
      });
    }, { once: true });
  });
  await page.locator('#nqVictoryCinema .nq-victory-cinema__skip').click();
  expect(await page.evaluate(() => (window as any).__skipRaceWasClosing)).toBe(true);
  await expect(page.locator('.extra-life-popup')).toBeVisible();
  await page.locator('.extra-life-popup').getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('#victoryModal')).toBeVisible();
  await expect(page.locator('#nqVictoryCinema[open]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).NQVictoryBridge.inspection.records.at(-1).reason)).toBe('skipped');
  expect(await page.evaluate(() => (window as any).NQVictoryBridge.inspection.deliveredCount)).toBe(1);
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

for (const width of [320, 390, 1100, 1440]) test(`cena do dispositivo e texto200% cabem em${width}px`, async ({ page }) => {
  await abrir(page, width);
  const saved = await storage(page);
  const view = await bossPresentation(page);
  await expect(view.root).toBeVisible();
  const encounter = (await view.root.boundingBox())!;
  const image = (await view.image.boundingBox())!;
  expect(image.width).toBeGreaterThan(encounter.width * .5);
  if (view.cinematic) {
    const scene = (await page.locator('#nqBossStatic .nq-static-scene').boundingBox())!;
    expect(image.height).toBeGreaterThanOrEqual(scene.height - 3);
    await expect(page.locator('#nqBossArena')).toBeHidden();
  } else expect(image.height).toBeGreaterThanOrEqual(encounter.height - 3);
  const question = (await page.locator('#mainApp .qbox').boundingBox())!;
  if (view.cinematic) {
    expect(question.y).toBeGreaterThanOrEqual(encounter.y + encounter.height - 1);
    expect(question.y).toBeLessThanOrEqual(encounter.y + encounter.height + 32);
  } else expect(question.y).toBeLessThan(width < 500 ? 450 : 400);
  await semOverflow(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await semOverflow(page);
  for (const selector of ['#question', '.opt-body', view.cinematic ? '#nqStaticHpText' : '#bossHpPct', view.cinematic ? '#nqStaticStage' : '#bossQuestionNum', '#progressSandboxBanner']) {
    expect(await page.evaluate(medirContraste, selector), selector).toEqual([]);
  }
  for (const button of await page.locator('#options .option').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.locator(view.cinematic ? '#nqStaticTitle' : '#arquiBossTitleDesktop').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.getByRole('button', { name: 'Sair da demonstração' }).click();
  await expect(page.locator('#progressSandboxBanner')).toHaveCount(0);
  expect(await storage(page)).toEqual(saved);
});
