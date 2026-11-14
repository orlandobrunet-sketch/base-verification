import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

// A deterministic reflow after answering is distinct from the unresolved
// historical first-answer visibility reports in191. No clinical content here.
const authors = Array.from({ length: 3 }, (_, index) => ({
  qid: 'study-1717-reflow-' + index, t: 'Interface', cat: 'geral', diff: 'medium',
  q: 'Questão técnica. ' + 'Este texto confere a posição de leitura e o foco da interface. '.repeat(12),
  opts: ['A', 'B', 'C', 'D'].map(letter => 'Alternativa técnica ' + letter + '. ' +
    'Texto extenso para conferir os controles sem conteúdo clínico. '.repeat(8)),
  ans: index,
  exp: 'Explicação técnica. ' + 'Este conteúdo confere a continuação da leitura. '.repeat(10),
}));

type Audit = { errors: string[]; nonGET: string[]; sockets: number };

async function prepare(page: Page, baseURL: string): Promise<Audit> {
  const origin = new URL(baseURL).origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(origin).hostname);
  const audit: Audit = { errors: [], nonGET: [], sockets: 0 };
  await page.setViewportSize({ width: 320, height: 740 });
  page.on('pageerror', error => audit.errors.push(error.message));
  await page.context().route('**/*', route => {
    const request = route.request();
    if (request.method() !== 'GET') { audit.nonGET.push(request.method()); return route.abort(); }
    return new URL(request.url()).origin === origin && !['image', 'media', 'font'].includes(request.resourceType())
      ? route.continue() : route.abort();
  });
  await page.context().routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, authors);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => (window as any)._loadTopics());
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="study"]:visible').click();
  await page.locator('[data-action="startFreeStudyMode"]').click();
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  await page.locator('#studyOptions button').last().focus();
  await page.keyboard.press('4');
  await expect(page.locator('#studyFeedback')).toBeFocused();
  await expect(page.locator('#studyFeedback')).toBeInViewport();
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  return audit;
}

async function settledScale(page: Page) {
  await page.waitForFunction(() => parseFloat(getComputedStyle(document.documentElement).fontSize) === 32 &&
    !document.getAnimations().some(animation => animation instanceof CSSTransition &&
      (animation.pending || animation.playState === 'running')));
  await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

async function progress(page: Page) {
  return page.evaluate(() => ({
    save: localStorage.getItem('nefroquest-study-state'),
    stats: localStorage.getItem('nefroquest-detailed-stats'),
    count: (0, eval)('studyModeCorrect + studyModeWrong'),
  }));
}

for (const motion of ['reduce', 'no-preference'] as const) test.describe('movimento ' + motion, () => {
  test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: motion } });

  test('a correção focada permanece na janela ao ampliar o texto depois da resposta', async ({ page, baseURL }, info) => {
    const audit = await prepare(page, baseURL!);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion === 'reduce');
    const before = await progress(page);
    expect(before.save).not.toBeNull(); expect(before.stats).not.toBeNull(); expect(before.count).toBe(1);
    const titleSize = await page.locator('.nq-study-question-title').evaluate(title => parseFloat(getComputedStyle(title).fontSize));
    try {
      await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
      await settledScale(page);
      await expect(page.locator('.nq-study-question-title')).toHaveCSS('font-size', titleSize * 2 + 'px');
      await expect(page.locator('#studyFeedback')).toBeFocused();
      await expect(page.locator('#studyFeedback')).toBeInViewport();
      expect(await progress(page)).toEqual(before);
      await page.locator('[data-action="nextStudyQuestion"]').click();
      await expect(page.locator('#studyQuestionArea')).toBeFocused();
      await expect(page.locator('#studyProgress')).toHaveText('2');
      await expect(page.locator('#studyOptions button:disabled')).toHaveCount(0);
      expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
    } finally {
      await info.attach('study-reflow', { contentType: 'application/json', body: JSON.stringify(await page.evaluate(audit => {
        const feedback = document.getElementById('studyFeedback')!, rect = feedback.getBoundingClientRect();
        return { audit, active: document.activeElement?.id, rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
          scroll: { x: scrollX, y: scrollY }, viewport: { width: innerWidth, height: innerHeight },
          font: getComputedStyle(document.documentElement).fontSize, count: (0, eval)('studyModeCorrect + studyModeWrong'),
          authNull: (window as any).authUser === null };
      }, audit)) });
    }
  });
});

test.describe('limites do reposicionamento', () => {
  test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

  test('um controle escolhido fora da correção conserva foco e leitura após reflow', async ({ page, baseURL }) => {
    const audit = await prepare(page, baseURL!);
    const before = await progress(page);
    const pause = page.getByRole('button', { name: 'Pausar e voltar', exact: true });
    await pause.focus();
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await settledScale(page);
    await expect(pause).toBeFocused(); await expect(pause).toBeInViewport();
    expect(await progress(page)).toEqual(before);
    expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
  });

  for (const action of ['avançar', 'sair', 'trocar conta'] as const) {
    test(action + ' durante o reflow impede o callback antigo de reposicionar a nova tela', async ({ page, baseURL }) => {
      const audit = await prepare(page, baseURL!);
      const before = await progress(page);
      await page.evaluate(action => {
        document.documentElement.style.fontSize = '32px';
        if (action === 'avançar') (document.querySelector('[data-action="nextStudyQuestion"]') as HTMLButtonElement).click();
        else if (action === 'sair') {
          (document.querySelector('#studyModePage [data-action="exitStudyMode"]') as HTMLButtonElement).click();
          (document.querySelector('#welcomeScreen [data-action="startNewFromWelcome"]') as HTMLElement).focus();
        } else {
          (window as any).authUser = { id: '00000000-0000-4000-8000-000000002680', app_metadata: {} };
          const marker = document.createElement('button'); marker.id = 'studyNewOwnerFocus';
          marker.textContent = 'Controle da sessão atual'; marker.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647';
          document.body.append(marker); marker.focus();
        }
      }, action);
      await settledScale(page);
      if (action === 'avançar') {
        await expect(page.locator('#studyQuestionArea')).toBeFocused();
        await expect(page.locator('#studyProgress')).toHaveText('2');
        await expect(page.locator('#studyFeedback')).toBeHidden();
        expect((await progress(page)).count).toBe(1);
      } else if (action === 'sair') {
        await expect(page.locator('#studyModePage')).toHaveCount(0);
        await expect(page.locator('#welcomeScreen [data-action="startNewFromWelcome"]')).toBeFocused();
        await expect(page.locator('#welcomeScreen [data-action="startNewFromWelcome"]')).toBeInViewport();
      } else {
        await expect(page.locator('#studyNewOwnerFocus')).toBeFocused();
        await expect(page.locator('#studyNewOwnerFocus')).toBeInViewport();
        expect(await progress(page)).toEqual(before);
      }
      expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
    });
  }
});
