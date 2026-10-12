import { test, expect, type Page } from '@playwright/test';

// Conteúdo sintético: os testes verificam identidade, persistência e pontuação,
// sem alterar nem emitir parecer sobre uma questão clínica.
const TOPICS = Array.from({ length: 8 }, (_, i) => ({
  qid: `face000${i}`, t: 'Identidade de alternativa',
  q: `Questão técnica ${i}: escolha a resposta indicada.`,
  opts: Array.from({ length: 4 }, (_, j) => `Texto original ${i}-${j}`),
  ans: i % 4, exp: `Feedback técnico ${i}.`, refs: [],
  cat: 'nefrologia_geral', diff: ['easy', 'medium', 'hard'][i % 3]
}));

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function ready(page: Page) {
  await page.waitForFunction(() => !!(window as any).NQAnswers && typeof (window as any).startFreeStudyMode === 'function');
  const guest = page.locator('[data-portal-route="guest"]');
  if (await guest.isVisible()) await guest.click();
  await page.evaluate(async () => {
    await (window as any)._loadTopics();
    const api = (window as any).NQAnswers;
    (window as any).NQAnswers = {
      ...api,
      present: (q: any, options: any = {}) => api.present(q, { ...options, random: () => 0 })
    };
  });
}

async function boot(page: Page, instrumentAcidBase = false) {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/data/topics.js')) {
      return route.fulfill({ contentType: 'text/javascript', body: `const topics = ${JSON.stringify(TOPICS)};` });
    }
    return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
  });
  if (instrumentAcidBase) {
    // Hooks somente na resposta HTTP da fixture, sem exports novos no produto.
    await page.route('**/js/minigame-acidbase.js*', async route => {
      const response = await route.fetch();
      let source = await response.text();
      const build = 'const instance = meta.build();';
      const session = 'const sess = { actIdx: 0, grimoireUses: 0, wrongAttempts: 0 };';
      const entry = 'window.showAcidBaseMinigame = showAcidBaseMinigame;';
      expect(source.split(build)).toHaveLength(2);
      expect(source.split(session)).toHaveLength(2);
      expect(source.split(entry)).toHaveLength(2);
      source = source.replace(build, `${build}\nwindow.__abAuthoredActs = JSON.parse(JSON.stringify(instance.acts));`)
        .replace(session, `${session}\nwindow.__abRuntime = { kase, sess };`)
        .replace(entry, `window.__abMappingTest = { CASES, _startCase, _renderAct };\n${entry}`);
      await route.fulfill({ response, body: source });
    });
  }
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await ready(page);
}

const studySave = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-study-state')!));
const examSave = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-exam-state')!));
const progressBytes = (page: Page) => page.evaluate(() => ({
  stats: localStorage.getItem('nefroquest-detailed-stats'),
  sr: localStorage.getItem('nefroquest-sr-data')
}));

test('estudo salva a escolha original e recarrega a correção sem contar de novo', async ({ page }) => {
  await boot(page);
  const sourceBefore = await page.evaluate(() => JSON.stringify((0, eval)('topics')));
  await page.evaluate(() => (window as any).startFreeStudyMode());
  const first = (await studySave(page)).presentations[0].question;
  expect(first._answerPresentation.order).toEqual([1, 2, 3, 0]);
  const orderBefore = await page.locator('#studyOptions button').allTextContents();
  const bytesBeforeInvalid = await page.evaluate(() => localStorage.getItem('nefroquest-study-state'));
  await page.evaluate(() => {
    for (const index of [-1, 4, NaN]) (window as any).answerStudyQuestion(index);
  });
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-study-state'))).toBe(bytesBeforeInvalid);
  await page.locator('#studyOptions button').nth(first.a).click();
  const answered = await studySave(page);
  expect(answered.correct).toBe(1);
  expect(answered.wrong).toBe(0);
  expect(answered.presentations[0].answer.authoredChoice).toBe(first._answerPresentation.sourceQuestion.a);
  expect(answered.presentations[0].answer.optionId).toBe(first._answerPresentation.optionIds[first._answerPresentation.sourceQuestion.a]);
  const progress = await progressBytes(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready(page);
  expect(await page.evaluate(() => (window as any).resumeSavedStudyMode())).toBe(true);
  await expect(page.locator('#studyFeedback')).toBeVisible();
  await expect(page.locator('#studyCorrect')).toHaveText('1');
  await expect(page.locator('#studyWrong')).toHaveText('0');
  expect(await page.locator('#studyOptions button').allTextContents()).toEqual(orderBefore);
  await expect(page.locator('#studyOptions button').nth(first.a)).toBeDisabled();
  expect(await progressBytes(page)).toEqual(progress);
  expect(await page.evaluate(() => JSON.stringify((0, eval)('topics')))).toBe(sourceBefore);
});

test('estudo mantém o distrator escolhido no reload e os contadores ao pausar', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as any).startFreeStudyMode());
  const first = (await studySave(page)).presentations[0].question;
  const wrong = (first.a + 1) % first.o.length;
  await page.locator('#studyOptions button').nth(wrong).click();
  const progress = await progressBytes(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready(page);
  await page.evaluate(() => (window as any).resumeSavedStudyMode());
  await expect(page.locator('#studyOptions button').nth(wrong)).toContainText(first.o[wrong]);
  await expect(page.locator('#studyOptions button').nth(wrong)).toHaveCSS('border-color', 'rgb(251, 113, 133)');
  await expect(page.locator('#studyOptions button').nth(first.a)).toHaveCSS('border-color', 'rgb(52, 211, 153)');
  expect(await progressBytes(page)).toEqual(progress);
  await page.getByRole('button', { name: 'Pausar e voltar' }).click();
  const paused = await studySave(page);
  expect(paused.index).toBe(1);
  expect(paused.correct).toBe(0);
  expect(paused.wrong).toBe(1);
  await page.evaluate(() => (window as any).resumeSavedStudyMode());
  await expect(page.locator('#studyProgress')).toHaveText('2');
  await expect(page.locator('#studyWrong')).toHaveText('1');
});

test('estudo antigo mantém a ordem da questão corrente e os resultados históricos', async ({ page }) => {
  await boot(page);
  await page.evaluate(ids => {
    localStorage.setItem('nefroquest-study-state', JSON.stringify({ questions: ids, index: 0, correct: 7, wrong: 3, axisStats: {}, savedAt: Date.now() }));
  }, TOPICS.map(q => q.qid));
  expect(await page.evaluate(() => (window as any).resumeSavedStudyMode())).toBe(true);
  const restored = await studySave(page);
  expect(restored.presentations[0].question._answerPresentation.order).toEqual([0, 1, 2, 3]);
  expect(restored.presentations[1].question._answerPresentation.order).toEqual([1, 2, 3, 0]);
  await expect(page.locator('#studyCorrect')).toHaveText('7');
  await expect(page.locator('#studyWrong')).toHaveText('3');
  for (let i = 0; i < 4; i++) await expect(page.locator('#studyOptions button').nth(i)).toContainText(TOPICS[0].opts[i]);
  await page.locator('#studyOptions button').nth(TOPICS[0].ans).click();
  expect((await studySave(page)).correct).toBe(8);
});

test('simulado liga teclado, reload e revisão de erros à mesma alternativa original', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as any).startExamMode());
  await page.getByRole('button', { name: 'Começar prova' }).click();
  let saved = await examSave(page);
  const first = saved.questions[0];
  expect(first._answerPresentation.order).toEqual([1, 2, 3, 0]);
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press(String(first.a + 1));
  saved = await examSave(page);
  expect(saved.answers[0].correct).toBe(true);
  expect(saved.answers[0].authoredChoice).toBe(first._answerPresentation.sourceQuestion.a);
  const questionsBeforeReload = JSON.stringify(saved.questions);
  const answerBeforeReload = saved.answers[0];
  const progress = await progressBytes(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready(page);
  await page.evaluate(() => (window as any).startExamMode());
  await page.getByRole('button', { name: 'Retomar prova' }).click();
  await expect(page.locator('.nq-exam-veredito')).toHaveText('Correto.');
  expect(await page.evaluate(() => JSON.stringify((0, eval)('_examState.questions')))).toBe(questionsBeforeReload);
  expect(await page.evaluate(() => (0, eval)('_examState.answers[0]'))).toEqual(answerBeforeReload);
  expect(await progressBytes(page)).toEqual(progress);
  await page.getByRole('button', { name: 'Próxima questão' }).click();
  saved = await examSave(page);
  const wrongQuestion = saved.questions[1], wrong = (wrongQuestion.a + 1) % 4;
  await page.locator('#examOpts button').nth(wrong).click();
  await expect(page.locator('#examOpts .nq-exam-opcao-errada')).toContainText(wrongQuestion.o[wrong]);
  expect((await examSave(page)).answers[1].authoredChoice).toBe(wrongQuestion._answerPresentation.order[wrong]);
  for (let i = 2; i < TOPICS.length; i++) {
    await page.getByRole('button', { name: 'Próxima questão' }).click();
    saved = await examSave(page);
    await page.locator('#examOpts button').nth(saved.questions[i].a).click();
  }
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.locator('#examResultado')).toContainText('7 de 8');
  await page.locator('.nq-exam-erros summary').click();
  await expect(page.locator('.nq-exam-erros .nq-exam-opcao-errada')).toContainText(wrongQuestion.o[wrong]);
  await expect(page.locator('.nq-exam-erros .nq-exam-opcao-certa')).toContainText(wrongQuestion.o[wrongQuestion.a]);
});

test('prova antiga preserva snapshot próprio, escolha errada e ordem sem reinterpretar o banco', async ({ page }) => {
  await boot(page);
  const oldQuestions = [
    { id: 'old-exam-one', q: 'Snapshot antigo um', o: ['Antiga zero', 'Antiga um', 'Antiga dois', 'Antiga três'], a: 2, e: 'Explicação antiga.', c: 'geral' },
    { id: 'old-exam-two', q: 'Snapshot antigo dois', o: ['Outra zero', 'Outra um', 'Outra dois', 'Outra três'], a: 1, e: 'Outra explicação.', c: 'geral' }
  ];
  const oldAnswer = { qId: oldQuestions[0].id, correct: false, cat: 'geral', chosen: 0, answered: true };
  await page.evaluate(({ questions, answer }) => {
    localStorage.setItem('nefroquest-exam-state', JSON.stringify({ questions, idx: 0, answers: [answer], startTime: Date.now(), savedAt: Date.now() }));
    (window as any).startExamMode();
  }, { questions: oldQuestions, answer: oldAnswer });
  await page.getByRole('button', { name: 'Retomar prova' }).click();
  await expect(page.locator('.nq-exam-veredito')).toHaveText('Incorreto. A resposta certa é a C.');
  await expect(page.locator('#examOpts .nq-exam-opcao-errada')).toContainText('Antiga zero');
  await page.getByRole('button', { name: 'Sair e continuar depois' }).click();
  const saved = await examSave(page);
  expect(saved.questions).toEqual(oldQuestions);
  expect(saved.answers[0]).toEqual(oldAnswer);
  expect(saved.questions.every((q: any) => q._answerPresentation === undefined)).toBe(true);
});

test('Ritual corrige pela opção original e mantém o diagnóstico de oito respostas', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as any).openRitual());
  await page.locator('#ritualStart').click();
  for (let step = 1; step <= 8; step++) {
    await expect(page.getByRole('heading', { name: `Questão ${step} de 8` })).toBeVisible();
    const displayed = await page.evaluate(() => {
      const stem = document.querySelector('#ritualPage .nq-exam-enunciado')!.textContent;
      const authored = ((0, eval)('questionBank') as any[]).find(q => q.q === stem);
      const texts = [...document.querySelectorAll('#ritualOpts button > span:last-child')].map(el => el.textContent);
      return { correct: texts.indexOf(authored.o[authored.a]), authored: authored.a, texts };
    });
    expect(displayed.correct).toBeGreaterThanOrEqual(0);
    expect(displayed.correct).toBe((displayed.authored + 3) % 4);
    const chosen = step === 1 ? (displayed.correct + 1) % 4 : displayed.correct;
    await page.locator('#ritualOpts button').nth(chosen).click();
    await expect(page.locator('#ritualVeredito')).toHaveText(step === 1 ? `Incorreto. A resposta certa é a ${'ABCD'[displayed.correct]}.` : 'Correto.');
    await expect(page.locator('#ritualOpts button').nth(chosen)).toBeDisabled();
  }
  await expect(page.getByRole('heading', { name: 'Ritual concluído' })).toBeVisible();
  await expect(page.locator('#ritualPage')).toContainText('Você acertou 7 de 8');
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-ritual-done'))).toBeTruthy();
});

test('offline conserva apresentação e resposta após reload sem duplicar histórico', async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/data/topics.js')) return route.fulfill({ contentType: 'text/javascript', body: `const topics = ${JSON.stringify(TOPICS)};` });
    return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
  });
  await page.goto('/offline.html');
  await page.waitForFunction(() => !!(window as any).NQAnswers && !!document.querySelector('.nq-off-btn'));
  // A página já sorteou naturalmente; o teste usa o snapshot que ela salvou.
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-offline-study-state')!));
  const initial = await read();
  const texts = await page.locator('.nq-off-btn').allTextContents();
  await page.reload();
  await expect(page.locator('.nq-off-btn')).toHaveCount(initial.question.o.length);
  expect((await read()).question).toEqual(initial.question);
  expect(await page.locator('.nq-off-btn').allTextContents()).toEqual(texts);
  await page.locator('.nq-off-btn').nth(initial.question.a).click();
  const answered = await read();
  expect(answered.correctCount).toBe(1);
  expect(answered.answer.correct).toBe(true);
  expect(answered.answer.authoredChoice).toBe(initial.question._answerPresentation.sourceQuestion.a);
  const stats = await page.evaluate(() => localStorage.getItem('nefroquest-detailed-stats'));
  await page.reload();
  await expect(page.locator('.nq-off-btn.correct')).toContainText(initial.question.o[initial.question.a]);
  await expect(page.locator('.nq-off-btn').first()).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-detailed-stats'))).toBe(stats);
  expect((await read()).correctCount).toBe(1);
  await page.getByRole('button', { name: 'Próxima Questão' }).click();
  const next = await read();
  const wrong = (next.question.a + 1) % 4;
  await page.locator('.nq-off-btn').nth(wrong).click();
  const wrongStats = await page.evaluate(() => localStorage.getItem('nefroquest-detailed-stats'));
  await page.reload();
  await expect(page.locator('.nq-off-btn.wrong')).toContainText(next.question.o[wrong]);
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-detailed-stats'))).toBe(wrongStats);
});

test('Câmara liga as 51 MC a identidade original e revisão; num e cartas permanecem intactos', async ({ page }) => {
  await boot(page, true);
  const result = await page.evaluate(() => {
    const w = window as any;
    w.showAcidBaseMinigame();
    const overlay = document.getElementById('acidBaseOverlay')!;
    const api = w.__abMappingTest;
    let mc = 0, numeric = 0, cards = 0, shuffled = 0;
    for (const meta of api.CASES) {
      api._startCase(overlay, meta);
      const { kase, sess } = w.__abRuntime;
      const authored = w.__abAuthoredActs;
      for (let i = 0; i < kase.acts.length; i++) {
        const act = kase.acts[i];
        if (act.kind !== 'mc') {
          if (JSON.stringify(act) !== JSON.stringify(authored[i])) throw new Error(`Formato alterado: ${meta.id}/${i}`);
          if (act.kind === 'num') numeric++;
          if (act.kind === 'cards') cards++;
          continue;
        }
        mc++;
        const p = act._mcPresentation;
        if (!w.NQAnswers.restore(p)) throw new Error(`Snapshot MC inválido: ${meta.id}/${i}`);
        const order = p._answerPresentation.order;
        if (order.some((index: number, display: number) => index !== display)) shuffled++;
        if (JSON.stringify(order.map((index: number) => authored[i].options[index].label)) !== JSON.stringify(act.options.map((o: any) => o.label))) throw new Error('Texto/identidade trocados.');
        if (act.options.filter((o: any) => o.correct).length !== 1 || !act.options[p.a].correct) throw new Error('Gabarito não corresponde à apresentação.');
        sess.actIdx = i;
        api._renderAct(overlay, kase, sess);
        const before = [...overlay.querySelectorAll('[data-ab-pick]')].map(el => el.textContent);
        const shouldCorrect = mc % 2 === 0;
        const chosen = shouldCorrect ? p.a : (p.a + 1) % act.options.length;
        const previousWrong = sess.wrongAttempts;
        (overlay.querySelectorAll('[data-ab-pick]')[chosen] as HTMLButtonElement).click();
        const answer = sess.actResults[i];
        if (answer.correct !== shouldCorrect || answer.authoredChoice !== order[chosen] || answer.optionId !== w.NQAnswers.optionId(p, chosen)) throw new Error('Escolha MC não preservada.');
        if (sess.wrongAttempts !== previousWrong + (shouldCorrect ? 0 : 1)) throw new Error('Contagem MC incorreta.');
        const counted = sess.wrongAttempts;
        api._renderAct(overlay, kase, sess);
        if (sess.wrongAttempts !== counted || [...overlay.querySelectorAll('[data-ab-pick]')].some(el => !(el as HTMLButtonElement).disabled)) throw new Error('Revisão recontou ou liberou resposta.');
        if (JSON.stringify(before) !== JSON.stringify([...overlay.querySelectorAll('[data-ab-pick]')].map(el => el.textContent))) throw new Error('Revisão mudou ordem/texto.');
        if ((!shouldCorrect && !overlay.querySelectorAll('[data-ab-pick]')[chosen].classList.contains('wrong')) || !overlay.querySelectorAll('[data-ab-pick]')[p.a].classList.contains('correct')) throw new Error('Marcadores trocados.');
      }
    }
    return { mc, numeric, cards, shuffled };
  });
  expect(result.mc).toBe(51);
  expect(result.shuffled).toBe(51);
  expect(result.numeric).toBeGreaterThan(0);
  expect(result.cards).toBeGreaterThan(0);
});
