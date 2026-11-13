import { test, expect, type Page } from '@playwright/test';
import { saveBase } from '../helpers/fixtures';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

type Sample = { correct: number; wrong: number };
const samples: Sample[] = [{ correct: 2, wrong: 8 }, { correct: 6, wrong: 4 }, { correct: 8, wrong: 2 }, { correct: 1, wrong: 1 }];
const progress = (page: Page) => page.evaluate(() => [
  'nefroquest-save', 'nefroquest-save-v7', 'nefroquest-detailed-stats', 'nefroquest-comp-stats', 'nefroquest-error-reasons',
].map(key => localStorage.getItem(key)));

test.beforeEach(async ({ context, page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => (window as any)._loadTopics());
});

async function openAtlas(page: Page, values: Sample[] = samples) {
  const meta = await page.evaluate(({ save, values }) => {
    const w = window as any;
    const definitions = w.CORE_SKILLS;
    const byCategory = Object.fromEntries(values.map((value, index) => [definitions[index].categories[0], value]));
    const totalCorrect = values.reduce((sum, item) => sum + item.correct, 0);
    const totalWrong = values.reduce((sum, item) => sum + item.wrong, 0);
    const stats = { version: 1, totalQuestions: totalCorrect + totalWrong, totalCorrect, totalWrong,
      byCategory, byTopic: {}, questionHistory: [], dailyActivity: {}, timeStats: {}, mostMissed: {} };
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(stats));
    localStorage.setItem('nefroquest-comp-stats', JSON.stringify({}));
    localStorage.setItem('nefroquest-error-reasons', JSON.stringify({ counts: { knowledge: 2 }, log: [] }));
    localStorage.removeItem('nefroquest-study-state');
    w.isAdminUser = () => false;
    return w.getCoreSkillsStats(stats).map((skill: any) => ({
      id: skill.id, label: skill.label, correct: skill.correct, wrong: skill.wrong,
      total: skill.totalAnswered, accuracy: skill.accuracy,
      categories: skill.subcategories.map((category: any) => ({ cat: category.cat, label: category.label })),
    }));
  }, { save: saveBase(), values });
  await page.evaluate(() => (window as any).openDashboard({ tab: 'skills' }));
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await expect(page.locator('[data-nqs-component]')).toBeVisible();
  return meta;
}

const card = (page: Page, id: string) => page.locator('[data-nqs-card][data-skill-id="' + id + '"]');
const node = (page: Page, id: string) => page.locator('.nqs-orbit-node[data-skill-id="' + id + '"]');
const detail = (page: Page, id: string) => page.locator('[data-nqs-detail][data-skill-id="' + id + '"]');

async function selected(page: Page, id: string) {
  await expect(card(page, id)).toHaveAttribute('aria-pressed', 'true');
  await expect(node(page, id)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-nqs-select][aria-pressed="true"]')).toHaveCount(2);
  await expect(page.locator('[data-nqs-detail]:visible')).toHaveCount(1);
  await expect(detail(page, id)).toBeVisible();
  await expect(page.locator('[data-nqs-component]')).toHaveAttribute('data-nqs-current', id);
}

test('selos, linhas e teclado selecionam a mesma área sem mudar resultados ou registros', async ({ page }) => {
  const meta = await openAtlas(page), before = await progress(page);
  expect(meta.slice(0, 3).map((skill: any) => skill.accuracy)).toEqual([20, 60, 80]);
  await expect(card(page, meta[0].id).locator('.nqs-area-score')).toContainText('20%');
  await expect(card(page, meta[1].id).locator('.nqs-area-score')).toContainText('60%');
  await expect(card(page, meta[2].id).locator('.nqs-area-score')).toContainText('80%');
  const scores = await page.locator('[data-nqs-card] .nqs-area-score').allTextContents();
  await node(page, meta[2].id).click();
  await selected(page, meta[2].id);
  await expect(detail(page, meta[2].id).locator('.nqs-detail-value')).toHaveText('80%');
  await expect(detail(page, meta[2].id).locator('.nqs-detail-count')).toContainText('8 acertos em 10 respostas');
  await card(page, meta[0].id).click();
  await selected(page, meta[0].id);
  await expect(detail(page, meta[0].id).locator('.nqs-detail-value')).toHaveText('20%');
  await node(page, meta[0].id).focus();
  await page.keyboard.press('ArrowRight');
  await expect(node(page, meta[1].id)).toBeFocused();
  await selected(page, meta[1].id);
  await page.keyboard.press('End');
  await expect(node(page, meta[meta.length - 1].id)).toBeFocused();
  await selected(page, meta[meta.length - 1].id);
  await page.keyboard.press('Home');
  await expect(node(page, meta[0].id)).toBeFocused();
  await selected(page, meta[0].id);
  await card(page, meta[1].id).focus();
  await page.keyboard.press('ArrowUp');
  await expect(card(page, meta[0].id)).toBeFocused();
  await selected(page, meta[0].id);
  expect(await page.locator('[data-nqs-card] .nqs-area-score').allTextContents()).toEqual(scores);
  expect(await progress(page)).toEqual(before);
});

test('atlas vazio mantém áreas sem amostra, sem fabricar percentuais de zero', async ({ page }) => {
  const meta = await openAtlas(page, []), before = await progress(page);
  await expect(page.locator('[data-nqs-card]')).toHaveCount(meta.length);
  await expect(page.locator('[data-nqs-card][data-state="unseen"]')).toHaveCount(meta.length);
  await expect(page.locator('[data-nqs-card] .nqs-area-score small')).toHaveCount(0);
  await expect(page.locator('.nqs-detail-value')).toHaveCount(0);
  await expect(page.locator('#nqsProfileTitle')).toHaveText('Unindo seus primeiros pontos');
  for (const skill of [meta[0], meta[meta.length - 1]]) {
    await node(page, skill.id).click();
    await selected(page, skill.id);
    await expect(card(page, skill.id)).toContainText('Sem amostra');
    await expect(card(page, skill.id).locator('.nqs-area-score')).toContainText('—');
    await expect(detail(page, skill.id)).toContainText('Seu primeiro passo começa aqui');
  }
  expect(await progress(page)).toEqual(before);
});

test('perfil parcial conserva percentuais medidos e deixa amostra inicial em aberto', async ({ page }) => {
  const meta = await openAtlas(page), before = await progress(page);
  await expect(page.locator('#nqsProfileTitle')).toHaveText('Seu perfil observado é parcial');
  await expect(page.locator('.nqs-coverage strong')).toHaveText('3 / ' + meta.length);
  await expect(page.locator('[data-nqs-card] .nqs-area-score small')).toHaveCount(3);
  await card(page, meta[3].id).click();
  await selected(page, meta[3].id);
  await expect(card(page, meta[3].id)).toContainText('Amostra inicial');
  await expect(card(page, meta[3].id).locator('.nqs-area-sample')).toHaveText('2 respostas');
  await expect(detail(page, meta[3].id).locator('.nqs-detail-value')).toHaveCount(0);
  await expect(detail(page, meta[3].id)).toContainText('O percentual aparece a partir de cinco respostas');
  await card(page, meta[4].id).click();
  await selected(page, meta[4].id);
  await expect(card(page, meta[4].id)).toContainText('Sem amostra');
  await expect(detail(page, meta[4].id).locator('.nqs-detail-value')).toHaveCount(0);
  expect(await progress(page)).toEqual(before);
});

test('estudar um tema fecha o Painel e abre somente a categoria escolhida', async ({ page }) => {
  const meta = await openAtlas(page), before = await progress(page);
  const area = meta.find((skill: any) => skill.id === 'drc_nefroprotecao');
  const category = area.categories.find((item: any) => item.cat === 'hipertensao');
  expect(category).toBeDefined();
  await card(page, area.id).click();
  await detail(page, area.id).getByRole('button', { name: 'Estudar ' + category.label, exact: true }).click();
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
  await expect(page.locator('#studyModePage')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pausar e voltar', exact: true })).toBeFocused();
  const selection = await page.evaluate(() => {
    const w = window as any, axes = (0, eval)('NEFRO_AXES');
    return {
      categories: axes.filter((axis: any) => w._studySelectedAxes.has(axis.id)).map((axis: any) => axis.cat),
      questions: (0, eval)('studyModeQuestions.map(question => question.cat)'),
    };
  });
  expect(selection.categories).toEqual([category.cat]);
  expect(selection.questions.length).toBeGreaterThan(0);
  expect(selection.questions.every((value: string) => value === category.cat)).toBe(true);
  expect(await progress(page)).toEqual(before);
});

for (const width of [320, 390]) {
test(`${width}px e texto ampliado mantêm seletores alcançáveis e movimento reduzido efetivo`, async ({ page }) => {
  await page.setViewportSize({ width, height: 740 });
  const meta = await openAtlas(page), before = await progress(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.documentElement.style.fontSize = '32px';
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
  });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('32px');
  expect(await page.locator('.nqs-atlas-header').evaluate(element => {
    const clipped: string[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      if (!text.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      if ([...range.getClientRects()].some(bounds => bounds.width && (bounds.left < -1 || bounds.right > innerWidth + 1))) {
        clipped.push(text.textContent.trim());
      }
    }
    return clipped;
  }), 'texto do cabeçalho do Atlas dentro da tela').toEqual([]);
  for (const selector of ['.nqd-main', '[data-nqs-component]', '.nqs-observatory', '.nqs-area-grid', '.nqs-detail-slot']) {
    expect(await page.locator(selector).evaluate(element => element.scrollWidth <= element.clientWidth + 1), selector).toBe(true);
  }
  const control = node(page, meta[0].id);
  await control.scrollIntoViewIfNeeded();
  await control.focus();
  await expect(control).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(node(page, meta[1].id)).toBeFocused();
  await selected(page, meta[1].id);
  expect(await node(page, meta[1].id).evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= innerWidth + 1 && !element.closest('[hidden], [inert]');
  })).toBe(true);
  const animations = await page.locator('[data-nqs-component]').evaluate(element => ({
    active: element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running' || animation.pending).length,
    orbit: getComputedStyle(element.querySelector('.nqs-orbit-light')!).animationName,
  }));
  expect(animations.active).toBe(0);
  expect(animations.orbit).toBe('none');
  expect(await progress(page)).toEqual(before);
});
}
