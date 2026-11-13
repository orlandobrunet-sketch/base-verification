import {test, expect, type Page} from '@playwright/test';

const SAVE = 'nefroquest-exam-state';
const audits = new WeakMap<Page, {errors: string[]; nonGET: string[]; sockets: number}>();
test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: 'reduce'}});
test.setTimeout(60000);

test.beforeEach(async ({page, context, baseURL}) => {
  const origin = new URL(baseURL || 'http://localhost:5639').origin;
  expect(['localhost', '127.0.0.1', 'nefroquest.com']).toContain(new URL(origin).hostname);
  const audit = {errors: [] as string[], nonGET: [] as string[], sockets: 0};
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.routeWebSocket('**/*', socket => {audit.sockets++; socket.close();});
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') {audit.nonGET.push(request.method() + ' ' + url.pathname); return route.abort();}
    if (url.origin === origin && request.resourceType() !== 'media') return route.continue();
    if (url.hostname === 'fonts.googleapis.com' && request.resourceType() === 'stylesheet' ||
        url.hostname === 'fonts.gstatic.com' && request.resourceType() === 'font') return route.continue();
    return route.abort();
  });
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.evaluate(() => (window as any)._loadTopics());
  await page.waitForFunction(() => (window as any).questionBank?.length === 741);
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
});

test.afterEach(async ({page}, info) => {
  const audit = audits.get(page)!;
  await info.attach('exam-orientation-audit', {contentType: 'application/json', body: JSON.stringify({
    ...audit, viewport: page.viewportSize(), authNull: await page.evaluate(() => (window as any).authUser === null),
  })});
  expect(audit.errors).toEqual([]);
  expect(audit.nonGET).toEqual([]);
  expect(audit.sockets).toBe(0);
});

async function seedCurrentExam(page: Page) {
  return page.evaluate(key => {
    const w = window as any;
    // Only the local save is synthetic. Published authors, cards and all runtime
    // functions stay intact. Short options keep each keyboard target readable.
    const authors = [...w.questionBank].filter((q: any) => q.o.length === 4 && q.o.every((o: string) => o.length <= 80))
      .sort((a: any, b: any) => b.q.length - a.q.length).slice(0, 2);
    if (authors.length !== 2) throw Error('Expected two published layout cases');
    const questions = authors.map((q: any) => w.NQAnswers.present(q, {preserveOrder: true}));
    const state = {questions, idx: 0, answers: [], questionCount: 2, durationSec: 180,
      questionRevisionBindings: authors.map((q: any) => w.questionRevisionCatalog.current(String(q.id), 'exam').binding),
      startTime: Date.now(), savedAt: Date.now()};
    localStorage.setItem(key, JSON.stringify(state));
    return {startTime: state.startTime, ids: authors.map((q: any) => String(q.id))};
  }, SAVE);
}

async function visibleBelowBand(page: Page, selector: string) {
  await expect.poll(() => page.locator(selector).first().evaluate(element => {
    const rect = element.getBoundingClientRect();
    const band = document.querySelector('.nq-exam-cabecalho')!.getBoundingClientRect();
    return rect.top >= band.bottom - 1 && rect.top < innerHeight - 32;
  })).toBe(true);
}

const views: {width: number; height: number; font: number; safeTop?: number}[] = [
  {width: 320, height: 740, font: 16}, {width: 390, height: 844, font: 16},
  {width: 1440, height: 900, font: 16}, {width: 320, height: 740, font: 32},
  {width: 390, height: 844, font: 16, safeTop: 32},
];
for (const view of views) {
  test(`question and clock stay visible through scroll, focus and resume at ${view.width}px/${view.font}font${view.safeTop ? '/32safe' : ''}`, async ({page}, info) => {
    await page.setViewportSize({width: view.width, height: view.height});
    await page.evaluate(font => {document.documentElement.style.fontSize = font + 'px';}, view.font);
    if (view.safeTop) await page.evaluate(inset => document.documentElement.style.setProperty('--nq-exam-safe-top', inset + 'px'), view.safeTop);
    const fixture = await seedCurrentExam(page);
    await page.evaluate(() => (window as any).startExamMode());
    await page.getByRole('button', {name: 'Retomar prova', exact: true}).click();
    await expect(page.locator('#examQuestaoTitulo')).toHaveText('Questão 1 de 2');
    const raw = await page.evaluate(key => localStorage.getItem(key), SAVE);
    await page.locator('#examOpts button').last().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await info.attach('exam-orientation-geometry', {contentType: 'application/json', body: JSON.stringify(await page.evaluate(() => {
      const rows = [];
      let element: Element | null = document.querySelector('.nq-exam-cabecalho');
      while (element) {
        const style = getComputedStyle(element), rect = element.getBoundingClientRect();
        rows.push({element: element.id || element.className || element.tagName, position: style.position,
          overflowX: style.overflowX, overflowY: style.overflowY, top: rect.top, bottom: rect.bottom,
          height: rect.height, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight});
        element = element.parentElement;
      }
      return {scrollY, viewportHeight: innerHeight, rows};
    }))});
    await expect(page.locator('#examTimer')).toBeInViewport({ratio: 1});
    await expect(page.locator('#examQuestaoTitulo')).toBeInViewport({ratio: 1});
    if (view.safeTop) expect(await page.locator('.nq-exam-cabecalho').evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(view.safeTop, 1);
    expect(await page.evaluate(key => localStorage.getItem(key), SAVE)).toBe(raw);
    expect(await page.locator('#examPage').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await page.locator('.nq-exam-cabecalho').evaluate(el => el.getBoundingClientRect().height < innerHeight * .4)).toBe(true);

    await page.clock.setFixedTime(new Date(fixture.startTime + 30000));
    await page.evaluate(() => (window as any)._updateExamTimer());
    await expect(page.locator('#examTimer')).toHaveText('2:30 restantes');
    await page.locator('#examOpts button').first().focus();
    await visibleBelowBand(page, '#examOpts button');
    await page.keyboard.press('Tab');
    await expect(page.locator('#examOpts button').nth(1)).toBeFocused();
    await visibleBelowBand(page, '#examOpts button:nth-of-type(2)');
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#examOpts button').first()).toBeFocused();
    await visibleBelowBand(page, '#examOpts button');
    await page.locator('#examOpts button').first().press('Enter');
    await expect(page.locator('#examCorrecao')).toBeFocused();
    await visibleBelowBand(page, '#examCorrecao');
    await expect(page.locator('#examCorrecao')).toContainText('Resposta registrada');
    await expect(page.locator('#examPage .nq-exam-explicacao')).toHaveCount(0);
    await page.getByRole('button', {name: 'Próxima questão', exact: true}).click();
    await expect(page.locator('#examQuestaoTitulo')).toBeFocused();
    await expect(page.locator('#examQuestaoTitulo')).toHaveText('Questão 2 de 2');
    await expect(page.locator('#examQuestaoTitulo')).toBeInViewport({ratio: 1});
    await visibleBelowBand(page, '#examPage .nq-exam-enunciado');
    await page.getByRole('button', {name: 'Sair e continuar depois', exact: true}).click();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    await expect(page.locator('#examTimer')).toHaveCount(0);
    await page.evaluate(() => (window as any).startExamMode());
    await page.getByRole('button', {name: 'Retomar prova', exact: true}).click();
    await expect(page.locator('#examQuestaoTitulo')).toHaveText('Questão 2 de 2');
    await expect(page.locator('#examTimer')).toHaveText('2:30 restantes');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).startTime, SAVE)).toBe(fixture.startTime);
    await page.evaluate(() => document.fonts.ready);
    await info.attach('exam-orientation', {contentType: 'image/png', body: await page.locator('#examPage').screenshot()});
    await page.locator('#examOpts button').first().click();
    await page.getByRole('button', {name: 'Ver resultado', exact: true}).click();
    await expect(page.locator('#examResultado')).toBeVisible();
    await expect(page.locator('.nq-exam-cabecalho,#examTimer')).toHaveCount(0);
    expect(await page.locator('#examPage').evaluate(el => (el as HTMLElement).style.getPropertyValue('--nq-exam-header-height'))).toBe('');
  });
}

test('text enlargement preserves the focused answer below the resized context band', async ({page}, info) => {
  await page.setViewportSize({width: 390, height: 844});
  await seedCurrentExam(page);
  await page.evaluate(() => (window as any).startExamMode());
  await page.getByRole('button', {name: 'Retomar prova', exact: true}).click();
  const raw = await page.evaluate(key => localStorage.getItem(key), SAVE);
  await page.locator('#examOpts button').first().focus();
  await visibleBelowBand(page, '#examOpts button');
  await page.evaluate(() => {document.documentElement.style.fontSize = '32px';});
  await expect(page.locator('#examOpts button').first()).toBeFocused();
  await info.attach('exam-enlargement', {contentType: 'image/png', body: await page.screenshot()});
  await visibleBelowBand(page, '#examOpts button');
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE)).toBe(raw);
});
