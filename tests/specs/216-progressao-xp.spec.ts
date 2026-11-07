import { test, expect } from '@playwright/test';
import { injectGameState, enterGame } from '../helpers/game';
import { setupPilotPage, startNormalCharacter, changeState, pilotState, normalBytes, answerTechnical, resumeNormalCharacter } from '../helpers/pilot';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ context, baseURL, page }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET' && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
});

test('L1 com sete acertos aplica70% do limiar, sem prometer nível com barra cheia', async ({ page }) => {
  await injectGameState(page, { level: 1, xp: 200, correctTotal: 7, streak: 0 });
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
  await page.evaluate(() => (window as any).renderHUD());
  await test.info().attach('progress-before-assertion', { body: await page.screenshot(), contentType: 'image/png' });
  await expect(page.locator('#guardianXpAmount')).toHaveText('140/200');
  expect(await page.locator('#xpFill').evaluate(e => (e as HTMLElement).style.width)).toBe('70%');
  await expect(page.locator('#guardianXpHint')).toContainText('3 acertos');
  expect(await page.evaluate(() => (0, eval)('state.xp'))).toBe(200);
});

test('XP excedente permanece guardado quando o teto por acertos impede evolução', async ({ page }) => {
  await injectGameState(page, { level: 1, xp: 200, correctTotal: 7, streak: 0 });
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
  await page.evaluate(() => { (window as any).gainXP(50); (window as any).renderHUD(); });
  const result = await page.evaluate(() => (0, eval)('({level:state.level,xp:state.xp,correct:state.correctTotal})'));
  expect(result).toEqual({ level: 1, xp: 250, correct: 7 });
  await expect(page.locator('#guardianXpAmount')).toHaveText('140/200');
  await expect(page.locator('#guardianXpReserve')).toHaveText('110 XP guardados');
});

for (const [level, correctTotal] of [[1, 9], [2, 19], [9, 89]]) {
  test(`limiar${correctTotal}/${correctTotal + 1} sobe somente após o acerto e conserva o saldo`, async ({ page }) => {
    const xp = await page.evaluate(level => (window as any).xpForLevel(level), level);
    await injectGameState(page, { level, xp, correctTotal, streak: 0, gold: 0, lives: 5, maxLives: 5, bossIntroShown: true, battleFinalShown: true });
    await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
    expect(await page.locator('#xpFill').evaluate(e => parseFloat((e as HTMLElement).style.width))).toBeLessThan(100);
    const answer = await page.evaluate(() => (0, eval)('state.current.a'));
    await page.locator('#options .option').nth(answer).click();
    const after = await page.evaluate(() => (0, eval)('({level:state.level,xp:state.xp,correct:state.correctTotal})'));
    expect(after.level).toBe(level + 1); expect(after.correct).toBe(correctTotal + 1); expect(after.xp).toBeGreaterThan(0);
    await expect(page.locator('#guardianLevelLabel')).toHaveText(`Nível ${level + 1}`);
    await expect(page.locator('#guardianEvolutionProgress')).toHaveAttribute('aria-valuenow', level === 9 ? '100' : '0');
  });
}

test('save legado reconcilia níveis já conquistados e não consome XP ou vidas duas vezes', async ({ page }) => {
  await injectGameState(page, { schemaVersion: 6, level: 4, xp: 658, xpToNext: 1, correctTotal: 60, gold: 500, score: 9876, lives: 1, maxLives: 5, extraLifeGiven: false });
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
  const read = () => page.evaluate(() => (0, eval)('({level:state.level,xp:state.xp,cost:state.xpToNext,lives:state.lives,gold:state.gold,score:state.score,correct:state.correctTotal})'));
  const before = await read();
  expect(before).toEqual({ level: 6, xp: 5, cost: 402, lives: 2, gold: 500, score: 9876, correct: 60 });
  await page.evaluate(() => (window as any).saveGame());
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save') || 'null')?.level === 6);
  await page.reload({ waitUntil: 'domcontentloaded' }); await enterGame(page);
  expect(await read()).toEqual(before);
});

test('prévias projetam o nível ganho sem reescrever o save', async ({ page }) => {
  const raw = await page.evaluate(() => {
    const raw = JSON.stringify({ schemaVersion: 6, level: 1, xp: 250, xpToNext: 1, correctTotal: 10, gold: 100, score: 123, lives: 3, maxLives: 3, character: 'nephros', gameStarted: true, gameOver: false, timestamp: Date.now(), queueIds: [], recentIds: [] });
    localStorage.setItem('nefroquest-save', raw); return raw;
  });
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#wsSavedLevel')).toHaveText('02');
  await expect(page.locator('#wsSavedMilestone')).toContainText('Evolução conquistada: nível 2');
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save'))).toBe(raw);
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save'))).toBe(raw);
});

test('vidas e Sequência usam valores reais, quatro campos no rodapé e refluem sem sobreposição', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await injectGameState(page, { level: 1, xp: 200, correctTotal: 7, lives: 1, maxLives: 5, streak: 12 });
  await expect(page.locator('.hud .tile')).toHaveCount(4);
  await expect(page.locator('.hud .tile').nth(2)).toContainText('Sequência');
  await expect(page.locator('#streak')).toHaveText('12');
  await expect(page.locator('#guardianStreakMultiplier')).toHaveText('×2');
  await expect(page.locator('#record')).toHaveCount(0);
  await expect(page.locator('#guardianVitality')).toHaveAccessibleName('Vidas: 1 de 5');
  await expect(page.locator('#lives .nql-life')).toHaveCount(5);
  await expect(page.locator('#lives .nql-life:not(.is-empty)')).toHaveCount(1);
  for (const font of [16, 32]) {
    await page.evaluate(font => { document.documentElement.style.fontSize = font + 'px'; }, font);
    const geometry = await page.locator('#guardianVitality').evaluate(el => {
      const lives = el.getBoundingClientRect(), progress = document.querySelector('.nql-hero-progress')!.getBoundingClientRect();
      return { fits: el.scrollWidth <= el.clientWidth + 1, gap: progress.top - lives.bottom };
    });
    expect(geometry.fits).toBe(true); expect(geometry.gap).toBeGreaterThanOrEqual(0); expect(geometry.gap).toBeLessThanOrEqual(font * 2);
  }
});

test('acertos consecutivos avançam valor e barra juntos e guardam todos os bônus', async ({ page }) => {
  test.setTimeout(45000); // Four real question transitions and one evolution dialog.
  await injectGameState(page, { level: 1, xp: 2000, correctTotal: 7, gold: 0, streak: 0, narrativeShown: 100 });
  const percentages = ['80', '90', '0', '9'];
  for (let index = 0; index < percentages.length; index++) {
    await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
    const before = await page.evaluate(() => (0, eval)('({level:state.level,xp:state.xp,answer:state.current.a})'));
    await page.locator('#options .option').nth(before.answer).click();
    const after = await page.evaluate(() => (0, eval)('({level:state.level,xp:state.xp,correct:state.correctTotal})'));
    expect(after.correct).toBe(8 + index);
    expect(after.level).toBe(index < 2 ? 1 : 2);
    expect(after.xp + (after.level === 2 ? 200 : 0)).toBeGreaterThan(before.xp + (before.level === 2 ? 200 : 0));
    await expect(page.locator('#guardianEvolutionProgress')).toHaveAttribute('aria-valuenow', percentages[index]);
    if (index === 2) {
      const dialog = page.locator('.evolution-popup');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
    }
    const gold = page.locator('#goldMilestonePopup');
    if (await gold.isVisible()) await gold.getByRole('button', { name: 'Entendido!' }).click();
    if (index < percentages.length - 1) await page.locator('#nextBtn').click();
  }
});

test('vida máxima inclui equipamento e zero vidas continua legível sem inventar preenchimento', async ({ page }) => {
  await injectGameState(page, { level: 1, xp: 20, correctTotal: 3, lives: 1, maxLives: 5 });
  const max = await page.evaluate(() => (0, eval)(`(() => {
    const [slot, equipment] = Object.entries(items).flatMap(([slot, list]) => list.map(item => [slot,item])).find(([, item]) => _LIFE_BONUS_ITEMS.has(item.n));
    state.equipment[slot] = {...equipment}; state.lives=0; renderHUD(); return effectiveMaxLives();
  })()`));
  expect(max).toBe(6);
  await expect(page.locator('#guardianVitality')).toHaveAccessibleName('Vidas: 0 de 6');
  await expect(page.locator('#lives .nql-life:not(.is-empty)')).toHaveCount(0);
  await page.evaluate(max => { (0, eval)('state').lives = max; (window as any).renderHUD(); }, max);
  await expect(page.locator('#lives .nql-life:not(.is-empty)')).toHaveCount(6);
  expect(await page.evaluate(() => (0, eval)('state.maxLives'))).toBe(5);
});

test('painel do personagem continua alcançável no celular com texto200% e foco restaurado', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 744 });
  await injectGameState(page, { level: 1, xp: 200, correctTotal: 7, lives: 1, maxLives: 5 });
  const dock = page.locator('#mobileBottomDock > .mdock-btn.personagem[data-action="openMobileDrawer"]');
  const trigger = await dock.isVisible() ? dock : page.locator('#mobileHeroBtn');
  await trigger.click();
  const panel = page.locator('.panel.left');
  await expect(panel).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await expect(page.locator('#guardianVitality')).toHaveAccessibleName('Vidas: 1 de 5');
  await expect(page.locator('#guardianEvolutionProgress')).toHaveAttribute('aria-valuenow', '70');
  await expect(panel.locator('.hud .tile:visible')).toHaveCount(4);
  await expect(panel.locator('.hud .tile').nth(2)).toContainText('Sequência');
  await panel.locator('#streak').scrollIntoViewIfNeeded();
  await expect(panel.locator('#streak')).toBeInViewport();
  await panel.locator('#gold').scrollIntoViewIfNeeded();
  await expect(panel.locator('#gold')).toBeInViewport();
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const close = panel.getByRole('button', { name: 'Fechar painel do herói' });
  await close.focus(); await page.keyboard.press('Tab');
  expect(await panel.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
});

test('prévia de legado mostra a mesma vida extra que será restaurada, sem escrever', async ({ page }) => {
  const raw = await page.evaluate(() => {
    const raw = JSON.stringify({ schemaVersion: 6, level: 4, xp: 658, xpToNext: 1, correctTotal: 60, lives: 1, maxLives: 5, extraLifeGiven: false, character: 'nephros', gameStarted: true, gameOver: false, queueIds: [], recentIds: [], timestamp: Date.now() });
    localStorage.setItem('nefroquest-save', raw); return raw;
  });
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#wsSavedLevel')).toHaveText('06');
  await expect(page.locator('#wsSavedLives')).toHaveText('2');
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save'))).toBe(raw);
  await enterGame(page);
  expect(await page.evaluate(() => (0, eval)('state.lives'))).toBe(2);
});

test('Nephros guarda o XP no cap e uma falha de persistência não duplica o bônus no reload', async ({ page }) => {
  test.setTimeout(45000);
  await setupPilotPage(page, true);
  await startNormalCharacter(page, 'nephros');
  await changeState(page, { level: 1, xp: 200, xpToNext: 200, correctTotal: 0, streak: 0, gold: 0 });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null')?.xp === 200 && (0, eval)('_saveTimer === null'));
  const before = await pilotState(page), bytes = await normalBytes(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as any).__xpOriginalSetItem = original;
    (window as any).__xpRefusedWrites = 0;
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && key === 'nefroquest-save-v7') { (window as any).__xpRefusedWrites++; throw new DOMException('Synthetic XP transaction refusal', 'QuotaExceededError'); }
      return original.call(this, key, value);
    };
  });
  try {
    await answerTechnical(page);
    expect(await page.evaluate(() => (window as any).__xpRefusedWrites)).toBeGreaterThan(0);
    expect(await normalBytes(page)).toEqual(bytes);
  } finally {
    await page.evaluate(() => { Storage.prototype.setItem = (window as any).__xpOriginalSetItem; });
  }
  await resumeNormalCharacter(page);
  const restored = await pilotState(page);
  expect(restored.xp).toBe(200); expect(restored.classBenefits).toEqual(before.classBenefits);
  const after = await answerTechnical(page, true, true);
  expect(after.level).toBe(1); expect(after.correctTotal).toBe(1);
  expect(after.classBenefits.xpGranted).toBe(1);
  expect(after.characterLastAnswer.xp).toBe(1);
  expect(after.xp).toBe(200 + after.characterLastAnswer.baseXP + 1);
  await resumeNormalCharacter(page);
  const final = await pilotState(page);
  expect(final.xp).toBe(after.xp); expect(final.classBenefits).toEqual(after.classBenefits);
  expect(final.characterLastAnswer).toEqual(after.characterLastAnswer);
});

test('save mais novo da nuvem conserva o XP guardado, progresso e conquistas anteriores', async ({ page }) => {
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async () => {
    await (window as any)._loadTopics();
    const save = { schemaVersion: 6, level: 1, xp: 250, xpToNext: 200, correctTotal: 7, lives: 3, maxLives: 3, gold: 347, score: 925, character: 'nephros', difficulty: 'normal', gameStarted: true, gameOver: false, queueIds: [], recentIds: [], timestamp: Date.now() };
    localStorage.removeItem('nefroquest-save-v7');
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-achievements', JSON.stringify(['arqui_nefromante_slayer']));
    (window as any)._mergeCloudProgress({ save: { ...save, xp: 777, timestamp: save.timestamp + 3000 }, achievements: ['grimoire_master'] });
  });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null')?.xp === 777);
  await enterGame(page);
  expect(await page.evaluate(() => (0, eval)('({level:state.level,xp:state.xp,correct:state.correctTotal,gold:state.gold,score:state.score})'))).toEqual({ level: 1, xp: 777, correct: 7, gold: 347, score: 925 });
  await expect(page.locator('#guardianXpAmount')).toHaveText('140/200');
  await expect(page.locator('#guardianXpReserve')).toHaveText('637 XP guardados');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-achievements') || '[]'))).toEqual(expect.arrayContaining(['arqui_nefromante_slayer', 'grimoire_master']));
});
