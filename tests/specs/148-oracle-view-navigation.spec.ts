import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, context, baseURL }, info) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', r => r.request().method() === 'GET' && new URL(r.request().url()).origin === origin ? r.continue() : r.abort());
  await context.routeWebSocket('**/*', s => s.close());
  const runtime: string[] = []; errors.set(page, runtime);
  page.on('pageerror', e => runtime.push(e.message));
  await page.setViewportSize(info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 800 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 }, { authUser: { id: 'oracle-test', app_metadata: { premium: true } } });
  await page.evaluate(() => { (window as any).getAuthToken = async () => null; });
});
test.afterEach(async ({ page }, info) => {
  await info.attach('oracle-runtime', { contentType: 'application/json', body: JSON.stringify({ errors: errors.get(page) }) });
  if (info.status === info.expectedStatus) expect(errors.get(page)).toEqual([]);
});
async function answer(page: Page) {
  const wrong = await page.evaluate(() => (0, eval)('(state.current.a+1)%state.current.o.length'));
  await page.locator(`#options .option[data-idx="${wrong}"]`).click();
  await expect(page.locator('#nextBtn')).toBeVisible();
}
function trigger(page: Page) { return page.locator('[data-action="openOraculoFromJourney"]:visible').first(); }
async function open(page: Page) {
  await page.evaluate(() => (window as any).openOraculoFromJourney());
  await expect(page.locator('#oraclePage')).toBeVisible();
}
async function campaign(page: Page) {
  return page.evaluate(() => ({
    state: (0, eval)('JSON.stringify({current:state.current,answered:state.answered,answer:state.questionAnswer,gold:state.gold,xp:state.xp,score:state.score,lives:state.lives,start:_questionStartTime})'),
    question: document.getElementById('question')!.outerHTML,
    options: document.getElementById('options')!.outerHTML,
    timer: document.getElementById('timerDisplay')!.textContent,
    scroll: window.scrollY,
  }));
}
test('voltar preserva pergunta, resposta, tempo, posição e foco; reabrir mantém conversa e rascunho', async ({ page }, info) => {
  const bodies: any[] = [];
  await page.route('**/functions/v1/ai-mentor', r => { bodies.push(r.request().postDataJSON()); return r.fulfill({ json: { reply: 'Resposta simulada ' + bodies.length } }); });
  await answer(page);
  await page.evaluate(() => (window as any).timerToggle());
  await expect(page.locator('#timerDisplay')).not.toHaveText('00:00');
  await page.evaluate(() => (window as any).timerToggle());
  await trigger(page).scrollIntoViewIfNeeded();
  await trigger(page).focus();
  const before = await campaign(page);
  await trigger(page).click();
  await expect(page.locator('#oraclePage')).toHaveAttribute('data-question-id', await page.evaluate(() => (0, eval)('String(state.current.id)')));
  await page.locator('#mentorInput').fill('Primeira dúvida');
  await page.locator('#mentorInput').press('Enter');
  await expect(page.locator('#mentorChat')).toContainText('Resposta simulada 1');
  await page.locator('#mentorInput').fill('Meu rascunho');
  await page.locator('#mentorInput').press('Escape');
  await expect(page.locator('#oraclePage')).toBeHidden();
  const returned = await campaign(page);
  expect(returned.state).toBe(before.state); expect(returned.question).toBe(before.question);
  expect(returned.options).toBe(before.options); expect(returned.timer).toBe(before.timer);
  expect(Math.abs(returned.scroll - before.scroll)).toBeLessThanOrEqual(1);
  await expect(trigger(page)).toBeFocused();
  expect(await page.locator('#mainApp').evaluate(el => ({ inert: (el as HTMLElement).inert, aria: el.getAttribute('aria-hidden') }))).toEqual({ inert: false, aria: null });
  await trigger(page).click();
  await expect(page.locator('#mentorInput')).toHaveValue('Meu rascunho');
  await expect(page.locator('#mentorChat')).toContainText('Resposta simulada 1');
  await page.locator('#mentorInput').press('Enter');
  await expect(page.locator('#mentorChat')).toContainText('Resposta simulada 2');
  expect(bodies).toHaveLength(2);
  expect(bodies[1].history).toEqual([{ role: 'user', content: 'Primeira dúvida' }, { role: 'assistant', content: 'Resposta simulada 1' }]);
  await page.screenshot({ path: info.outputPath('oracle-conversation.png'), fullPage: false });
});
test('resposta chega à conversa fechada sem roubar foco e sem duplicar requisição', async ({ page }) => {
  await answer(page); await open(page);
  await page.evaluate(() => {
    const original = window.fetch; (window as any).oracleCalls = 0;
    window.fetch = async (url, init) => {
      if (!String(url).includes('/ai-mentor')) return original(url, init);
      (window as any).oracleCalls++;
      return new Promise(resolve => { (window as any).releaseReply = () => resolve(new Response(JSON.stringify({ reply: 'Resposta guardada' }), { status: 200 })); });
    };
  });
  await page.locator('#mentorInput').fill('Minha dúvida'); await page.locator('#mentorInput').press('Enter');
  await expect(page.locator('.mentor-send-btn')).toBeDisabled();
  await expect(page.locator('#mentorChat')).toContainText('preparando uma resposta');
  await page.evaluate(() => (window as any)._sendMentorMessage());
  await page.locator('#oraclePage [data-action="closeMentorModal"]').click();
  const focus = await page.evaluate(() => document.activeElement?.id);
  await page.evaluate(async () => { (window as any).releaseReply(); await new Promise(r => setTimeout(r, 0)); });
  expect(await page.evaluate(() => document.activeElement?.id)).toBe(focus);
  expect(await page.evaluate(() => (window as any).oracleCalls)).toBe(1);
  await open(page);
  await expect(page.locator('#mentorChat')).toContainText('Resposta guardada');
  await expect(page.locator('#mentorInput')).toBeEnabled();
});
for (const boundary of ['auth', 'reply']) test(`encerrar Jornada durante ${boundary} invalida contexto e resposta tardia`, async ({ page }) => {
  await answer(page); await open(page);
  await page.evaluate(boundary => {
    (window as any).oracleCalls = 0;
    if (boundary === 'auth') (window as any).getAuthToken = () => new Promise(resolve => { (window as any).release = () => resolve(null); });
    const original = window.fetch;
    window.fetch = async (url, init) => {
      if (!String(url).includes('/ai-mentor')) return original(url, init);
      (window as any).oracleCalls++;
      return new Promise(resolve => { (window as any).release = () => resolve(new Response(JSON.stringify({ reply: 'Antiga' }), { status: 200 })); });
    };
  }, boundary);
  await page.locator('#mentorInput').fill('Pergunta pendente'); await page.locator('#mentorInput').press('Enter');
  await expect.poll(() => page.evaluate(() => typeof (window as any).release)).toBe('function');
  await page.evaluate(() => (0, eval)('_stopLocalJourney()'));
  await page.evaluate(async () => { (window as any).release(); await new Promise(r => setTimeout(r, 0)); (window as any).openMentorModal(); });
  await expect(page.locator('#oraclePage')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).oracleCalls)).toBe(boundary === 'auth' ? 0 : 1);
});
test('Study mantém QID e alternativas na ordem apresentada, inclusive gabarito no payload', async ({ page }) => {
  const bodies: any[] = [];
  await page.route('**/functions/v1/ai-mentor', r => { bodies.push(r.request().postDataJSON()); return r.fulfill({ json: { reply: 'Contexto conferido' } }); });
  await page.evaluate(() => (window as any).startFreeStudyMode());
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  const shown = await page.evaluate(() => (0, eval)('({qid:String(_studyQuestionId(studyModeQuestions[studyModeIndex])),q:_studyPresentations[studyModeIndex]})'));
  await page.locator('#studyOptions button').nth((shown.q.a + 1) % shown.q.o.length).click();
  const studyTrigger = page.locator('#studyFeedback [data-action="openMentorModal"]');
  await studyTrigger.scrollIntoViewIfNeeded(); await studyTrigger.focus();
  const studySnapshot = () => page.evaluate(() => ({
    state: (0, eval)('JSON.stringify({index:studyModeIndex,qid:_studyQuestionId(studyModeQuestions[studyModeIndex]),answers:_studyAnswers,correct:studyModeCorrect,wrong:studyModeWrong})'),
    raw: localStorage.getItem('nefroquest-study-state'),
    question: document.getElementById('studyQuestionArea')!.outerHTML, scroll: window.scrollY,
  }));
  const before = await studySnapshot();
  await page.locator('#studyFeedback [data-action="openMentorModal"]').click();
  await expect(page.locator('#oraclePage')).toHaveAttribute('data-question-id', shown.qid);
  await expect(page.locator('.nq-oracle-question')).toHaveText(shown.q.q);
  expect(await page.locator('.nq-oracle-options li > div').evaluateAll(nodes => nodes.map(n => n.firstChild!.textContent))).toEqual(shown.q.o);
  await page.locator('#mentorInput').fill('Conferir ordem'); await page.locator('#mentorInput').press('Enter');
  await expect(page.locator('#mentorChat')).toContainText('Contexto conferido');
  expect(bodies[0].options).toEqual(shown.q.o); expect(bodies[0].correctOption).toBe(shown.q.o[shown.q.a]);
  expect(bodies[0].questionText).toBe(shown.q.q);
  await page.locator('#oraclePage [data-action="closeMentorModal"]').click();
  const returned = await studySnapshot();
  expect(returned.state).toBe(before.state); expect(returned.raw).toBe(before.raw);
  expect(returned.question).toBe(before.question); expect(Math.abs(returned.scroll - before.scroll)).toBeLessThanOrEqual(1);
  await expect(studyTrigger).toBeFocused();
  await page.locator('#studyFeedback [data-action="nextStudyQuestion"]').click();
  await expect(page.locator('#oraclePage')).toHaveCount(0);
});
test('texto a200% e pouca altura mantêm contexto, chat, envio e retorno alcançáveis', async ({ page }, info) => {
  await answer(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  for (const height of info.project.name === 'mobile' ? [640] : [600, 720]) {
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1280, height });
  await open(page);
  if (info.project.name === 'mobile') {
    await expect(page.locator('#oracleCase')).not.toHaveAttribute('open');
    await page.locator('#oracleCase > summary').click();
    await expect(page.locator('.nq-oracle-question')).toBeVisible();
    await page.locator('#oracleCase > summary').click();
  }
  await page.locator('#mentorInput').scrollIntoViewIfNeeded();
  await page.locator('#mentorInput').fill('Uma linha');
  await page.locator('#mentorInput').press('Shift+Enter');
  await page.locator('#mentorInput').press('x');
  await expect(page.locator('#mentorInput')).toHaveValue('Uma linha\nx');
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('#oraclePage'))).toBe(true);
  await page.locator('.mentor-send-btn').scrollIntoViewIfNeeded();
  await expect(page.locator('.mentor-send-btn')).toBeInViewport({ ratio: 1 });
  expect(await page.locator('#oraclePage').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath(`oracle-200-percent-${height}.png`), fullPage: false });
  await page.locator('#oraclePage [data-action="closeMentorModal"]').click();
  await expect(page.locator('#oraclePage')).toBeHidden();
  }
});
test('teclas com foco no body pertencem ao Oráculo, sem avançar Jornada ou Study ao fundo', async ({ page }) => {
  await answer(page); await open(page);
  const before = await campaign(page);
  await page.locator('#mentorInput').evaluate(el => (el as HTMLElement).blur());
  await page.keyboard.press('Enter'); await page.keyboard.press('Space');
  const after = await campaign(page);
  expect(after.state).toBe(before.state); expect(after.question).toBe(before.question);
  expect(after.options).toBe(before.options); expect(after.timer).toBe(before.timer);
  await expect(page.locator('#oraclePage')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('#oraclePage'))).toBe(true);
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await page.keyboard.press('Escape'); await expect(page.locator('#oraclePage')).toBeHidden();
  await page.evaluate(() => (window as any).startFreeStudyMode());
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  const wrong = await page.evaluate(() => (0, eval)('(_studyPresentations[studyModeIndex].a+1)%4'));
  await page.locator('#studyOptions button').nth(wrong).click();
  await page.locator('#studyFeedback [data-action="openMentorModal"]').click();
  const study = () => page.evaluate(() => (0, eval)('JSON.stringify({index:studyModeIndex,questions:studyModeQuestions,answers:_studyAnswers})'));
  const initial = await study();
  await page.locator('#mentorInput').evaluate(el => (el as HTMLElement).blur());
  await page.keyboard.press('Enter'); await page.keyboard.press('Space');
  expect(await study()).toBe(initial);
  await expect(page.locator('#oraclePage')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#oraclePage')).toBeHidden();
});
test('o novo acionamento preserva bloqueio antes da resposta, de revisão histórica e do Confronto Final', async ({ page }) => {
  let requests = 0;
  await page.route('**/functions/v1/ai-mentor', r => { requests++; return r.abort(); });
  await page.evaluate(() => (window as any).openOraculoFromJourney());
  await expect(page.locator('#oracleAnswerFirstPopup')).toBeVisible();
  await expect(page.locator('#oraclePage')).toHaveCount(0);
  await page.locator('#oracleAnswerFirstPopup [data-remove-id]').last().click();
  await answer(page);
  await page.evaluate(() => { (0, eval)('_currentQuestionRevision = {..._currentQuestionRevision,historical:true}'); (window as any).openOraculoFromJourney(); });
  await expect(page.locator('#oraclePage')).toHaveCount(0);
  await page.evaluate(() => { (0, eval)('_currentQuestionRevision = {..._currentQuestionRevision,historical:false};state.correctTotal=90'); (window as any).openOraculoFromJourney(); });
  await expect(page.locator('#oracleBlockedPopup')).toBeVisible();
  await expect(page.locator('#oraclePage')).toHaveCount(0);
  expect(requests).toBe(0);
});
for (const correct of [false, true]) test(`abrir logo após ${correct ? 'acerto' : 'erro'} no celular não deixa a rolagem tardia do feedback mover o fundo`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const result = await page.evaluate(async correct => {
    const calls: any[] = []; const scroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (...args) {
      const view = document.getElementById('oraclePage');
      calls.push({ id: this.id, oracle: !!view && !view.hidden });
      return scroll.apply(this, args);
    };
    const choice = (0, eval)(correct ? 'state.current.a' : '(state.current.a+1)%state.current.o.length');
    (document.querySelector(`#options .option[data-idx="${choice}"]`) as HTMLElement).click();
    const before = {
      state: (0, eval)('JSON.stringify({current:state.current,answered:state.answered,answer:state.questionAnswer,gold:state.gold,xp:state.xp,score:state.score,lives:state.lives,start:_questionStartTime})'),
      question: document.getElementById('question')!.outerHTML,
      options: document.getElementById('options')!.outerHTML,
      timer: document.getElementById('timerDisplay')!.textContent,
      scroll: scrollY,
    };
    (window as any).openOraculoFromJourney();
    const initial = scrollY;
    await new Promise(resolve => setTimeout(resolve, 300));
    Element.prototype.scrollIntoView = scroll;
    return { calls, initial, after: scrollY, before };
  }, correct);
  expect(result.calls.filter(c => c.id === 'feedback' && c.oracle)).toEqual([]);
  expect(result.after).toBe(result.initial);
  await expect(page.locator('.mentor-send-btn')).toBeInViewport({ ratio: 1 });
  await page.locator('#oraclePage [data-action="closeMentorModal"]').click();
  const returned = await campaign(page);
  expect(returned.state).toBe(result.before.state);
  expect(returned.question).toBe(result.before.question);
  expect(returned.options).toBe(result.before.options);
  expect(returned.timer).toBe(result.before.timer);
  expect(Math.abs(returned.scroll - result.before.scroll)).toBeLessThanOrEqual(1);
});
