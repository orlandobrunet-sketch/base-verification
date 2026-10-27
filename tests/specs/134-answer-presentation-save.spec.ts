import { characterIntro } from '../helpers/cinema';
import { test, expect, type Page } from '@playwright/test';
import { attachPilotFailureDiagnostics, seedLegacyPilot } from '../helpers/pilot';
import { routeTechnicalQuestionBank, technicalQuestionBundle } from '../helpers/technical-question-bank';

const SAVE = 'nefroquest-save-v7';
const topics = Array.from({ length: 120 }, (_, n) => ({
  qid: `shuffle-tech-${String(n + 1).padStart(3, '0')}`,
  t: 'Fixture de identidade da resposta', q: `Escolha o marcador esperado neste caso técnico ${n + 1}.`,
  opts: ['Marcador correto', 'Distrator neutro um', 'Distrator neutro dois', 'Distrator neutro três'],
  ans: 0, exp: 'O marcador correto é a resposta esperada neste caso técnico.',
  diff: ['easy', 'medium', 'hard'][n % 3], cat: 'geral', refs: [],
}));
technicalQuestionBundle(topics);

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
    ? route.continue() : route.abort());
  await routeTechnicalQuestionBank(page, topics);
  await page.addInitScript(() => {
    localStorage.setItem('pwa-dismissed', '1');
    // Test-only crypto input forces a non-identity Fisher-Yates permutation.
    // Production still uses fresh browser entropy; no production test hook.
    Object.defineProperty(crypto, 'getRandomValues', { configurable: true,
      value: (view: Uint32Array) => { view.fill(0); return view; } });
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function' && !!(window as any).NQAnswers);
  await guest(page);
});
test.afterEach(async ({ page }, info) => attachPilotFailureDiagnostics(page, info));

async function guest(page: Page) {
  const control = page.locator('#landingScreen [data-action="playAsGuest"]:visible').first();
  if (await control.isVisible()) await control.click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
}
async function begin(page: Page, character = 'nephros', difficulty = 'normal') {
  await page.locator('#welcomeScreen [data-action="startNewFromWelcome"]').click();
  await page.locator(`.difficulty-card[data-diff-key="${difficulty}"]`).click();
  await page.locator('#diffConfirmBtn').click();
  await page.locator(`#charSelectModal [data-action="selectCharacter"][data-arg="${character}"]`).click();
  await (await characterIntro(page)).start.click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await ready(page);
}
async function ready(page: Page) {
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
}
async function observed(page: Page): Promise<any> {
  return page.evaluate(() => JSON.parse((0, eval)(`JSON.stringify({current:state.current,
    answered:state.answered,xp:state.xp,gold:state.gold,lives:state.lives,score:state.score,
    correctTotal:state.correctTotal,character:state.character,difficulty:state.difficulty,
    classBenefits:state.classBenefits,characterLastAnswer:state.characterLastAnswer,
    pilotLastAnswer:state.pilotLastAnswer,errors:_sessionWrongAnswers})`)));
}
async function saved(page: Page): Promise<any> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), SAVE);
}
async function reload(page: Page, pilot = false) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).continueGame === 'function');
  await guest(page);
  await page.locator(pilot ? '#resumePilotBtn' : '#welcomeScreen [data-action="continueGame"]').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await ready(page);
}
async function choose(page: Page, correct: boolean, pilot = false) {
  const before = await observed(page);
  const index = correct ? before.current.a : (before.current.a + 1) % before.current.o.length;
  await page.locator('#options .option').nth(index).click();
  await expect(page.locator('#options .option.correct')).toHaveCount(1);
  await page.waitForFunction(({key,pilot}) => {
    const record = JSON.parse(localStorage.getItem(key) || 'null');
    return (pilot ? record?.save : record)?.answered === true;
  }, { key: pilot ? 'nefroquest-pilot-v1' : SAVE, pilot });
  const save = pilot ? await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-pilot-v1') || 'null').save) : await saved(page);
  return { before, after: await observed(page), index, save };
}
async function next(page: Page) {
  await page.locator('#nextBtn:visible, #dockNextBtn:visible').first().click();
  await page.waitForFunction(() => (0, eval)('!!state.current && !state.answered && !_loadingNextQuestion'));
}

for (const difficulty of ['easy', 'normal', 'hard', 'hardcore']) {
  for (const character of ['nephros', 'aquaria', 'glomerulus']) {
    test(`${character}/${difficulty}: pending and answered presentation survives reload without a second reward`, async ({ page }) => {
      await begin(page, character, difficulty);
      const pending = await observed(page), persisted = await saved(page);
      expect(pending.current._answerPresentation.order).toEqual([1,2,3,0]);
      expect(pending.current.a).toBe(3);
      expect(pending.current.o[3]).toBe('Marcador correto');
      expect(persisted.questionPresentation).toEqual(pending.current);
      await reload(page);
      expect((await observed(page)).current).toEqual(pending.current);
      const answer = await choose(page, true);
      expect(answer.save.questionAnswer).toMatchObject({ questionId:pending.current.id,
        choice:3, originalChoice:0, correct:true });
      expect(answer.save.questionAnswer.optionId).toBe(pending.current._answerPresentation.optionIds[0]);
      if (difficulty === 'hardcore') {
        expect(answer.after.classBenefits).toBeNull();
        expect(answer.after.characterLastAnswer).toBeNull();
      } else {
        expect(answer.after.classBenefits.windowAnswers).toBe(1);
        expect(answer.after.characterLastAnswer.choice).toBe(3);
        expect(answer.after.characterLastAnswer.originalChoice).toBe(0);
      }
      await reload(page);
      const replay = await observed(page);
      expect(replay).toEqual(answer.after);
      await expect(page.locator('#options .option').nth(3)).toHaveClass(/correct/);
      for (const option of await page.locator('#options .option').all()) await expect(option).toBeDisabled();
      if (difficulty === 'hardcore') {
        await expect(page.locator('#feedback')).not.toContainText('Fora do ranking');
        await expect(page.locator('#feedback')).not.toContainText('Bônus inicial');
      }
      await next(page);
      expect((await observed(page)).current.id).not.toBe(pending.current.id);
    });
  }
}

test('wrong answer and its original identity survive reload and error review without rescoring', async ({ page }) => {
  await begin(page, 'aquaria');
  const answered = await choose(page, false);
  expect(answered.index).toBe(0);
  expect(answered.save.questionAnswer).toMatchObject({ choice:0, originalChoice:1, correct:false });
  expect(answered.save.wrongAnswerSnapshots).toHaveLength(1);
  expect(answered.save.wrongAnswerSnapshots[0]).toMatchObject({ choice:0, originalChoice:1,
    questionPresentation:answered.before.current });
  await reload(page);
  expect(await observed(page)).toEqual(answered.after);
  await page.evaluate(() => (window as any).showSessionWrongAnswers());
  const dialog = page.getByRole('dialog', { name:'Erros da Jornada' });
  await expect(dialog.locator('.nqreview-option.is-chosen .nqreview-option-text')).toHaveText('Distrator neutro um');
  await expect(dialog.locator('.nqreview-option.is-correct .nqreview-option-text')).toHaveText('Marcador correto');
  await dialog.getByRole('button', { name:'Fechar', exact:true }).click();
  expect(await observed(page)).toEqual(answered.after);
});

for (const answered of [false,true]) {
  test(`legacy schema9 answered=${answered}: authored choice survives with unchanged ledger and resources`, async ({ page }) => {
    await begin(page);
    if (answered) await choose(page,true);
    const old = await page.evaluate(({key,answered}) => {
      const save=JSON.parse(localStorage.getItem(key) || 'null');
      delete save.questionPresentation; delete save.questionAnswer; delete save.wrongAnswerSnapshots;
      if (answered) {
        save.characterLastAnswer.choice=0;
        delete save.characterLastAnswer.originalChoice; delete save.characterLastAnswer.optionId;
      }
      const raw=JSON.stringify(save);
      localStorage.setItem(key,raw);localStorage.setItem('nefroquest-save',raw);
      return save;
    },{key:SAVE,answered});
    await reload(page);
    const restored=await observed(page);
    expect(restored.current.o).toEqual(topics[0].opts);
    expect(restored.current.a).toBe(0);
    expect(restored.answered).toBe(answered);
    for (const field of ['xp','gold','lives','score','correctTotal','classBenefits']) expect(restored[field]).toEqual(old[field]);
    if (answered) {
      await expect(page.locator('#options .option').first()).toHaveClass(/correct/);
      expect(restored.characterLastAnswer.correct).toBe(true);
    }
  });
}

test('legacy schema7 without selection metadata keeps resources and receives no retroactive benefit', async ({page})=>{
  await begin(page,'nephros','hardcore');
  const old=await page.evaluate(key=>{
    const save=JSON.parse(localStorage.getItem(key)||'null');
    delete save.questionPresentation;delete save.questionAnswer;delete save.wrongAnswerSnapshots;
    delete save.currentQuestionId;delete save.answered;
    save.lives=save.maxLives=1;save.xp=17;save.gold=29;save.score=43;save.correctTotal=3;
    const raw=JSON.stringify(save);localStorage.setItem(key,raw);localStorage.setItem('nefroquest-save',raw);
    return save;
  },SAVE);
  await reload(page);
  const restored=await observed(page);
  for(const key of ['xp','gold','lives','score','correctTotal'])expect(restored[key]).toBe(old[key]);
  expect(restored.classBenefits).toBeNull();expect(restored.characterLastAnswer).toBeNull();
});

test('invalid persisted option map is refused while both save bytes remain untouched', async ({page})=>{
  await begin(page);
  const raw=await page.evaluate(key=>{
    const save=JSON.parse(localStorage.getItem(key)||'null');
    save.questionPresentation._answerPresentation.order=[0,0,2,3];
    const raw=JSON.stringify(save);localStorage.setItem(key,raw);localStorage.setItem('nefroquest-save',raw);
    return raw;
  },SAVE);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof (window as any).continueGame==='function');
  await guest(page);
  await page.locator('#welcomeScreen [data-action="continueGame"]').click();
  await page.waitForFunction(()=>!(0,eval)('_continueGamePending'));
  await expect(page.locator('#mainApp')).toBeHidden();
  expect(await page.evaluate(key=>localStorage.getItem(key),SAVE)).toBe(raw);
  expect(await page.evaluate(()=>localStorage.getItem('nefroquest-save'))).toBe(raw);
});

test('refused mapped wrong answer preserves durable save and does not append an error or earn credit',async({page})=>{
  await begin(page,'aquaria');
  const before=await page.evaluate(key=>({raw:localStorage.getItem(key),mirror:localStorage.getItem('nefroquest-save'),
    resources:Object.fromEntries(['nefroquest-stats','nefroquest-detailed-stats','nefroquest-sr-data',
      'nefroquest-mastered','unlockedArticles'].map(k=>[k,localStorage.getItem(k)]))}),SAVE);
  await page.evaluate(key=>{
    const native=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){if(this===localStorage&&k===key)throw new DOMException('Test refusal','QuotaExceededError');return native.call(this,k,v);};
  },SAVE);
  const q=(await observed(page)).current;
  await page.locator('#options .option').nth((q.a+1)%4).click();
  await expect(page.locator('#mainApp')).toBeHidden();
  const after=await page.evaluate(key=>({raw:localStorage.getItem(key),mirror:localStorage.getItem('nefroquest-save'),
    resources:Object.fromEntries(['nefroquest-stats','nefroquest-detailed-stats','nefroquest-sr-data',
      'nefroquest-mastered','unlockedArticles'].map(k=>[k,localStorage.getItem(k)]))}),SAVE);
  expect(after).toEqual(before);
});

test('legacy pilot starts in authored order, then a new mapped question and result replay once',async({page})=>{
  const normalBefore=await page.evaluate(()=>[localStorage.getItem('nefroquest-save-v7'),localStorage.getItem('nefroquest-save')]);
  await seedLegacyPilot(page,'aquaria');
  await page.evaluate(ids=>{
    const api=(window as any).NQPilot;
    const envelope=JSON.parse(localStorage.getItem(api.KEY)||'null');
    envelope.save.queueIds=ids;envelope.save.currentQuestionId=ids[0];envelope.save.idx=1;
    localStorage.setItem(api.KEY,JSON.stringify(envelope));
    (window as any).refreshCharacterPilotUI();
  },topics.map(q=>q.qid));
  await page.locator('#resumePilotBtn').click();await ready(page);
  let current=(await observed(page)).current;
  expect(current.o).toEqual(topics[0].opts);expect(current.a).toBe(0);
  await choose(page,true,true);await next(page);
  current=(await observed(page)).current;
  expect(current._answerPresentation.order).toEqual([1,2,3,0]);
  const answer=await choose(page,false,true);
  expect(answer.save.questionAnswer).toMatchObject({choice:0,originalChoice:1,correct:false});
  expect(answer.save.wrongAnswerSnapshots).toHaveLength(1);
  await reload(page,true);
  expect(await observed(page)).toEqual(answer.after);
  await expect(page.locator('#options .option').nth(0)).toHaveClass(/wrong/);
  expect(await page.evaluate(()=>[localStorage.getItem('nefroquest-save-v7'),localStorage.getItem('nefroquest-save')])).toEqual(normalBefore);
});

test('legacy answered pilot index retains its authored alternative and ledger on restore',async({page})=>{
  await seedLegacyPilot(page,'nephros');
  await page.evaluate(ids=>{
    const api=(window as any).NQPilot,record=JSON.parse(localStorage.getItem(api.KEY)||'null');
    record.save.queueIds=ids;record.save.currentQuestionId=ids[0];record.save.idx=1;
    localStorage.setItem(api.KEY,JSON.stringify(record));(window as any).refreshCharacterPilotUI();
  },topics.map(q=>q.qid));
  await page.locator('#resumePilotBtn').click();await ready(page);
  const answer=await choose(page,true,true);
  await page.evaluate(()=>{
    const api=(window as any).NQPilot,record=JSON.parse(localStorage.getItem(api.KEY)||'null');
    delete record.save.questionPresentation;delete record.save.questionAnswer;delete record.save.wrongAnswerSnapshots;
    delete record.save.pilotLastAnswer.originalChoice;delete record.save.pilotLastAnswer.optionId;
    localStorage.setItem(api.KEY,JSON.stringify(record));
  });
  await reload(page,true);
  const after=await observed(page);
  expect(after.current.o).toEqual(topics[0].opts);expect(after.current.a).toBe(0);
  expect(after.answered).toBe(true);expect(after.classBenefits).toEqual(answer.after.classBenefits);
  for(const field of ['xp','gold','lives','score','correctTotal'])expect(after[field]).toBe(answer.after[field]);
  await expect(page.locator('#options .option').first()).toHaveClass(/correct/);
});
