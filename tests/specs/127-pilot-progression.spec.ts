import { test, expect } from '@playwright/test';
import {
  advanceTechnical, answerTechnical, attachPilotFailureDiagnostics, changeState, openPilotChoice,
  pilotEnvelope, pilotState, setupPilotPage, startNormal, startPilot, type PilotClass,
} from '../helpers/pilot';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => setupPilotPage(page));
test.afterEach(async ({ page }, testInfo) => attachPilotFailureDiagnostics(page, testInfo));

for (const character of ['nephros', 'glomerulus', 'aquaria'] as PilotClass[]) {
  for (const correct of [true, false]) {
    test(`${character}: primeira resposta ${correct ? 'certa' : 'errada'} consome uma posição e concede somente seu bônus`, async ({ page }) => {
      await startPilot(page, character);
      await changeState(page, { score: 100, streak: 3 });
      const before = await pilotState(page);
      const after = await answerTechnical(page, correct, correct);
      expect(after.classBenefits).toMatchObject({ lockedClass: character, windowAnswers: 1 });
      expect(after.classBenefits.creditedEvents).toHaveLength(1);
      expect(after.classBenefits.seenQids).toEqual([before.currentId]);
      expect(after.pilotLastAnswer).toMatchObject({
        correct, xp: correct && character === 'nephros' ? 1 : 0,
        gold: correct && character === 'glomerulus' ? 2 : 0,
        shield: !correct && character === 'aquaria', domain: 'pilot', windowAnswers: 1,
      });
      expect(after.correctTotal).toBe(correct ? before.correctTotal + 1 : before.correctTotal);
      expect(after.streak).toBe(correct ? before.streak + 1 : 0);
      if (!correct) {
        expect(after.score).toBeLessThan(before.score);
        expect(after.lives).toBe(before.lives - (character === 'aquaria' ? 0 : 1));
      }
      const saved = await pilotEnvelope(page);
      expect(saved.classBenefits).toEqual(after.classBenefits);
      expect(saved.save.pilotLastAnswer).toEqual(after.pilotLastAnswer);
      expect(saved.save).toMatchObject({ gold: after.gold, xp: after.xp, lives: after.lives, answered: true });
      await expect(page.locator('#feedback')).toContainText('Fora do ranking');
    });
  }

  test(`${character}: respostas 20 e 21 respeitam os limites permanentes do piloto`, async ({ page }) => {
    test.setTimeout(45_000);
    await startPilot(page, character, 'easy');
    const results: any[] = [];
    for (let ordinal = 1; ordinal <= 21; ordinal++) {
      if (ordinal > 1) await advanceTechnical(page);
      // Wrong answers also consume the window. Keep the normal damage real.
      await changeState(page, { lives: 50, maxLives: 50 });
      results.push(await answerTechnical(page, character !== 'aquaria'));
    }
    const twentieth = results[19];
    const twentyFirst = results[20];
    expect(twentieth.classBenefits.windowAnswers).toBe(20);
    expect(twentyFirst.classBenefits.windowAnswers).toBe(20);
    expect(twentyFirst.classBenefits.creditedEvents).toHaveLength(20);
    expect(twentyFirst.classBenefits.seenQids).toHaveLength(20);
    expect(twentyFirst.classBenefits.xpGranted).toBeLessThanOrEqual(20);
    expect(twentyFirst.classBenefits.goldGranted).toBe(character === 'glomerulus' ? 40 : 0);
    expect(twentyFirst.pilotLastAnswer).toMatchObject({ xp: 0, gold: 0, shield: false });
    if (character === 'aquaria') {
      expect(results.filter(result => result.pilotLastAnswer.shield)).toHaveLength(1);
      expect(results[1].lives).toBe(49);
      expect(twentyFirst.classBenefits.shieldSpent).toBe(true);
    }
    expect(twentyFirst.gameOver).toBe(false); // 21 is not the 100-correct victory.
    await expect(page.locator('#feedback')).toContainText('20/20');
    expect((await pilotEnvelope(page)).classBenefits).toEqual(twentyFirst.classBenefits);
    await test.info().attach(`measured-bounds-${character}`, {
      contentType: 'application/json',
      body: JSON.stringify({ character, scenario: character === 'aquaria' ? '21 wrong answers' : '21 correct answers',
        approvedBounds: { windowAnswers: 20, xp: 20, gold: 40, preventedLifeLosses: 1 },
        equivalenceClaim: false,
        answers: results.map((result, index) => ({ ordinal: index + 1,
          baseXP: result.pilotLastAnswer.baseXP, baseGold: result.pilotLastAnswer.baseGold,
          actualExtraXP: result.pilotLastAnswer.xp, actualExtraGold: result.pilotLastAnswer.gold,
          preventedLifeLoss: result.pilotLastAnswer.shield, score: result.score,
          level: result.level, xp: result.xp, gold: result.gold,
          beforeLives: 50, lives: result.lives,
          windowAnswers: result.classBenefits.windowAnswers,
        })), finalLedger: twentyFirst.classBenefits,
      }, null, 2),
    });
  });

  test(`${character}: qid repetido consome a janela sem repetir o benefício`, async ({ page }) => {
    await startPilot(page, character);
    const first = await answerTechnical(page, character !== 'aquaria');
    await advanceTechnical(page, first.currentId);
    await changeState(page, { lives: 5 });
    const repeated = await answerTechnical(page, character !== 'aquaria');
    expect(repeated.currentId).toBe(first.currentId);
    expect(repeated.classBenefits.windowAnswers).toBe(2);
    expect(repeated.classBenefits.seenQids).toHaveLength(1);
    expect(repeated.classBenefits.creditedEvents).toHaveLength(2);
    expect(repeated.pilotLastAnswer).toMatchObject({ xp: 0, gold: 0, shield: false });
    expect(repeated.classBenefits.xpGranted).toBe(first.classBenefits.xpGranted);
    expect(repeated.classBenefits.goldGranted).toBe(first.classBenefits.goldGranted);
    if (character === 'aquaria') expect(repeated.lives).toBe(4);
  });
}

for (const character of ['nephros', 'glomerulus', 'aquaria'] as PilotClass[]) {
  test(`${character}: piloto desligado conserva score, erro, streak e resultado IRT de base`, async ({ page, browser }) => {
    const normalContext = await browser.newContext({ serviceWorkers: 'block' });
    const normalPage = await normalContext.newPage();
    try {
      await setupPilotPage(normalPage);
      await startNormal(normalPage, character);
      await startPilot(page, character);
      for (const target of [normalPage, page]) {
        await advanceTechnical(target, 'pilot-tech-001');
        await changeState(target, { score: 100, streak: 3, lives: 4 });
      }
      const correct = character !== 'aquaria';
      const base = await answerTechnical(normalPage, correct);
      const assisted = await answerTechnical(page, correct);
      expect(assisted.score).toBe(base.score);
      expect(assisted.streak).toBe(base.streak);
      expect(assisted.correctTotal).toBe(base.correctTotal);
      expect(assisted.theta).toBe(base.theta);
      expect(assisted.gold - base.gold).toBe(character === 'glomerulus' ? 2 : 0);
      expect(assisted.xp - base.xp).toBe(character === 'nephros' ? 1 : 0);
      expect(assisted.lives - base.lives).toBe(character === 'aquaria' ? 1 : 0);
      expect(base.classBenefits).toBeNull();
      expect(await pilotEnvelope(normalPage)).toBeNull();
      const measured = (result: any) => ({
        currentId: result.currentId, score: result.score, streak: result.streak,
        correctTotal: result.correctTotal, theta: result.theta, lives: result.lives,
        level: result.level, xp: result.xp, gold: result.gold, classBenefits: result.classBenefits,
      });
      await test.info().attach(`measured-off-${character}`, {
        contentType: 'application/json',
        body: JSON.stringify({ character, correct,
          controlledInput: { qid: 'pilot-tech-001', score: 100, streak: 3, lives: 4 },
          equivalenceClaim: false, base: measured(base), assisted: measured(assisted),
          delta: { score: assisted.score - base.score, streak: assisted.streak - base.streak,
            correctTotal: assisted.correctTotal - base.correctTotal,
            theta: typeof assisted.theta === 'number' && typeof base.theta === 'number'
              ? assisted.theta - base.theta : null,
            lives: assisted.lives - base.lives, level: assisted.level - base.level,
            xp: assisted.xp - base.xp, gold: assisted.gold - base.gold },
          pilotLastAnswer: assisted.pilotLastAnswer,
        }, null, 2),
      });
    } finally { await normalContext.close(); }
  });
}

for (const difficulty of ['easy', 'normal', 'hard'] as const) {
  test(`${difficulty}: adesão inicia uma jornada nova elegível`, async ({ page }) => {
    await startPilot(page, 'glomerulus', difficulty);
    expect((await answerTechnical(page)).pilotLastAnswer.gold).toBe(2);
  });
}

test('Hardcore desmarca e desabilita a adesão sem criar piloto', async ({ page }) => {
  await openPilotChoice(page, 'normal');
  await page.locator('#characterPilotOptIn').check();
  await page.locator('.difficulty-card[data-diff-key="hardcore"]').click();
  await expect(page.locator('#characterPilotOptIn')).not.toBeChecked();
  await expect(page.locator('#characterPilotOptIn')).toBeDisabled();
  expect(await pilotEnvelope(page)).toBeNull();
});

test('Nephros: XP no teto não produz crédito fictício nem compensação na resposta seguinte', async ({ page }) => {
  await startPilot(page, 'nephros');
  await changeState(page, { level: 1, xp: 200, xpToNext: 200, correctTotal: 0 });
  const capped = await answerTechnical(page);
  expect(capped).toMatchObject({ level: 1, xp: 200 });
  expect(capped.classBenefits.xpGranted).toBe(0);
  expect(capped.pilotLastAnswer.xp).toBe(0);
  await expect(page.locator('#feedback')).not.toContainText('+1 XP do piloto');
  await advanceTechnical(page);
  await changeState(page, { correctTotal: 9, xp: 0 });
  const next = await answerTechnical(page);
  expect(next.classBenefits.xpGranted).toBe(1);
  expect(next.pilotLastAnswer.xp).toBe(1);
});

test('Nephros: o extra que cruza nível é contabilizado como um XP efetivamente retido', async ({ page }) => {
  await startPilot(page, 'nephros');
  await page.evaluate(() => {
    const state = (0, eval)('state');
    const base = 5 + state.current.d * 2 + 1 + Math.floor((0, eval)('total().kno') / 3);
    Object.assign(state, { correctTotal: 9, streak: 0, xp: 200 - base - 1, level: 1, xpToNext: 200 });
  });
  const result = await answerTechnical(page);
  expect(result).toMatchObject({ level: 2, xp: 0, correctTotal: 10 });
  expect(result.classBenefits.xpGranted).toBe(1);
  expect(result.pilotLastAnswer.xp).toBe(1);
  expect((await pilotEnvelope(page)).save).toMatchObject({ level: 2, xp: 0 });
});

for (const [slot, item] of [
  ['weapon', 'Excalibur do Néfron'], ['armor', 'Armadura Primeva'], ['helmet', 'Máscara N95'],
] as const) {
  test(`Aquaria: ${item} bloqueia primeiro e preserva a carga do piloto`, async ({ page }) => {
    await startPilot(page, 'aquaria');
    await changeState(page, { lives: 1 });
    await page.evaluate(({ slot, item }) => { (0, eval)('state').equipment[slot].n = item; }, { slot, item });
    const blocked = await answerTechnical(page, false);
    expect(blocked.lives).toBe(1);
    expect(blocked.classBenefits.shieldSpent).toBe(false);
    expect(blocked.pilotLastAnswer).toMatchObject({ blocked: true, shield: false });
    expect(blocked.legendaryAbilityUsed[item]).toBe(true);
    await advanceTechnical(page);
    const pilot = await answerTechnical(page, false);
    expect(pilot.lives).toBe(1);
    expect(pilot.classBenefits.shieldSpent).toBe(true);
    expect(pilot.pilotLastAnswer.shield).toBe(true);
  });
}

test('Aquaria: bloqueio aleatório da defesa preserva o escudo', async ({ page }) => {
  await startPilot(page, 'aquaria');
  await page.evaluate(() => {
    const random = Math.random;
    try {
      Math.random = () => 0;
      (0, eval)('answer(1, document.querySelectorAll("#options .option")[1])');
    } finally { Math.random = random; }
  });
  const result = await pilotState(page);
  expect(result.classBenefits).toMatchObject({ windowAnswers: 1, shieldSpent: false });
  expect(result.pilotLastAnswer).toMatchObject({ blocked: true, shield: false });
});

for (const relic of ['Ressurreição Plena', 'Amuleto do Rim Imortal']) {
  test(`Aquaria: evitar perda fatal preserva ${relic}; o erro seguinte usa sua proteção real`, async ({ page }) => {
    await startPilot(page, 'aquaria');
    await changeState(page, { lives: 1 });
    await page.evaluate(name => { (0, eval)('state').equipment.relic.n = name; }, relic);
    const first = await answerTechnical(page, false);
    expect(first.lives).toBe(1);
    expect(first.classBenefits.shieldSpent).toBe(true);
    expect(first.legendaryAbilityUsed[relic]).not.toBe(true);
    await advanceTechnical(page);
    const second = await answerTechnical(page, false);
    expect(second.legendaryAbilityUsed[relic]).toBe(true);
    expect(second.lives).toBe(relic === 'Ressurreição Plena' ? 4 : 1);
    expect(second.pilotLastAnswer.shield).toBe(false);
    expect((await pilotEnvelope(page)).save.lives).toBe(second.lives);
  });
}

for (const excluded of ['bonus', 'boss', 'study']) {
  test(`Nephros: origem ${excluded} não consome janela nem concede extra`, async ({ page }) => {
    await startPilot(page, 'nephros');
    if (excluded === 'bonus') await changeState(page, { questionOrigin: 'bonus' });
    if (excluded === 'boss') await changeState(page, { correctTotal: 90, bossIntroShown: true });
    if (excluded === 'study') await page.evaluate(() => document.body.classList.add('nq-studying'));
    const result = await answerTechnical(page);
    expect(result.classBenefits).toMatchObject({ windowAnswers: 0, xpGranted: 0 });
    expect(result.pilotLastAnswer.xp).toBe(0);
    expect(result.correctTotal).toBe(excluded === 'boss' ? 91 : 1);
  });
}

test('adesão e feedback permanecem utilizáveis por teclado em 320px e texto a 200%', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await openPilotChoice(page);
  const optIn = page.locator('#characterPilotOptIn');
  await optIn.focus(); await page.keyboard.press('Space');
  await expect(optIn).toBeChecked();
  await page.locator('#diffConfirmBtn').focus(); await page.keyboard.press('Enter');
  await page.locator('#charSelectModal [data-action="selectCharacter"][data-arg="nephros"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('#charIntroOverlay [data-action="closeIntroAndStart"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
  // The engine starts before dismissWelcome finishes revealing the main UI.
  await expect(page.locator('#welcomeScreen')).toBeHidden();
  await expect(page.locator('#mainApp')).toBeVisible();
  const firstOption = page.locator('#options .option').first();
  await expect(firstOption).toBeVisible();
  await expect(firstOption).toBeEnabled();
  await firstOption.focus();
  await expect(firstOption).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#feedback')).toContainText('+1 XP do piloto');
  expect((await pilotState(page)).classBenefits).toMatchObject({ windowAnswers: 1, xpGranted: 1 });
  expect((await pilotEnvelope(page)).classBenefits).toMatchObject({ windowAnswers: 1, xpGranted: 1 });
  await expect(page.locator('#characterPilotBanner')).toBeVisible();
  for (const selector of ['#characterPilotBanner', '#characterPilotProgress', '#leavePilotBtn']) {
    expect(await page.locator(selector).evaluate(el => el.scrollWidth <= el.clientWidth + 1), selector).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
