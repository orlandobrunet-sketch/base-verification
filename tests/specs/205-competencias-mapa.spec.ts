import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { saveBase } from '../helpers/fixtures';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const progress = (page: Page) => page.evaluate(() => ['nefroquest-save', 'nefroquest-detailed-stats', 'nefroquest-comp-stats', 'nefroquest-error-reasons'].map(k => localStorage.getItem(k)));
async function openSkills(page: Page, count = 3) {
  const origin = new URL(test.info().project.use.baseURL as string || process.env.BASE_URL || 'http://localhost:5500').origin;
  await page.route('**/*', r => r.request().method() === 'GET' && new URL(r.request().url()).origin === origin ? r.continue() : r.abort());
  await page.routeWebSocket('**/*', s => s.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => (window as any)._loadTopics());
  await page.evaluate(({ save, count }) => {
    localStorage.clear();
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    const values = [2, 4, 6, 8, 10, 0, 5];
    const byCategory = Object.fromEntries((window as any).CORE_SKILLS.slice(0, count).map((s: any, i: number) => [s.categories[0], { correct: values[i], wrong: 10 - values[i] }]));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({ version: 1, totalQuestions: count * 10, totalCorrect: values.slice(0, count).reduce((a, b) => a + b, 0), byCategory, byTopic: {}, questionHistory: [], dailyActivity: {}, timeStats: {}, mostMissed: {} }));
    const comps = (0, eval)('NQ_COMPETENCIES');
    localStorage.setItem('nefroquest-comp-stats', JSON.stringify(count ? { [comps[0].id]: { c: 1, t: 8 } } : {}));
    localStorage.setItem('nefroquest-error-reasons', JSON.stringify({ counts: { knowledge: 7, misread: 4, confusion: 2 } }));
    (window as any).isAdminUser = () => false;
    return (window as any).openDashboard({ tab: 'skills' });
  }, { save: saveBase(), count });
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  return page.locator('#nqdPane-skills');
}

test('panels separate results from reflection while keeping counts and contrast', async ({ page }) => {
  const pane = await openSkills(page), before = await progress(page);
  const metrics = await pane.evaluate(el => {
    const top = el.querySelector('.nqs-component')!, bottom = el.querySelector('.nqd-error-patterns')!;
    return { gap: bottom.getBoundingClientRect().top - top.getBoundingClientRect().bottom, top: getComputedStyle(top).backgroundColor, bottom: getComputedStyle(bottom).backgroundColor };
  });
  expect(metrics.gap).toBeGreaterThanOrEqual(20);
  expect(metrics.top).not.toBe(metrics.bottom);
  await expect(pane.locator('.nqd-error-ledger strong')).toHaveText(['7', '4', '2']);
  await expect(pane.locator('.nqd-error-count')).toHaveCount(3);
  await expect(pane.locator('.nqd-error-count small')).toHaveText(['registros', 'registros', 'registros']);
  const separation = await pane.locator('.nqd-error-ledger > div').evaluateAll(rows => rows.map(row => {
    const label = row.querySelector(':scope > span')!.getBoundingClientRect(), count = row.querySelector('.nqd-error-count')!.getBoundingClientRect();
    return Math.max(count.top - label.bottom, count.left - label.right);
  }));
  expect(separation.every(gap => gap >= 8)).toBe(true);
  await expect(pane.locator('.nqd-error-ledger')).toContainText('Lacuna de conhecimento');
  const audit = await new AxeBuilder({ page }).include('#nqdPane-skills').withRules(['color-contrast']).analyze();
  expect(audit.violations).toEqual([]);
  expect(await progress(page)).toEqual(before);
});

for (const count of [0, 2, 3, 7]) test(`profile preserves ${count} measured areas and actual values`, async ({ page }) => {
  const pane = await openSkills(page, count), before = await progress(page);
  await expect(pane.locator('.nqs-area:is([data-state="attention"], [data-state="consolidating"], [data-state="consistent"])')).toHaveCount(count);
  await expect(pane.locator('.nqs-vertex-point')).toHaveCount(count < 3 ? 0 : count);
  await expect(pane.locator('.nqs-profile-fill')).toHaveCount(count === 7 ? 1 : 0);
  await expect(pane.locator('.nqs-area:is([data-state="unseen"], [data-state="sample"])')).toHaveCount(7 - count);
  if (count >= 3) {
    const nodes = pane.locator('.nqs-orbit-node');
    await expect(nodes.first()).toHaveAttribute('aria-label', /20% de acertos, 10 respostas/);
    const labels = (await nodes.evaluateAll(items => items.map(item => item.getAttribute('aria-label')))).join('; ');
    expect(labels.includes('Sem amostra')).toBe(count < 7);
    if (count === 7) await expect(nodes.nth(5)).toHaveAttribute('aria-label', /Diálise, 0% de acertos, 10 respostas/);
  } else if (!count) {
    for (const score of await pane.locator('.nqs-area-score').all()) await expect(score).not.toContainText('%');
    await expect(pane.locator('#nqsProfileContext')).toHaveText('O perfil visual aparece quando três áreas tiverem pelo menos cinco respostas.');
  }
  expect(await progress(page)).toEqual(before);
});

test('narrow profile keeps readable values at 200 percent text without clipping', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const pane = await openSkills(page), before = await progress(page);
  const labels = await pane.locator('.nqs-orbit-node').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const selector = pane.locator('.nqs-orbit-node').first();
  await selector.focus(); await page.keyboard.press('Enter');
  await expect(selector).toHaveAttribute('aria-pressed', 'true');
  const values = pane.locator('.nqs-area-grid');
  await expect(values).toBeVisible();
  await expect(values.locator('.nqs-area')).toHaveCount(7);
  await expect(values).toContainText('20%');
  await expect(values).toContainText('Sem amostra');
  const metrics = await values.evaluate(el => ({ minFont: Math.min(...[...el.querySelectorAll('.nqs-area-name,.nqs-area-sample,.nqs-area-state,.nqs-area-score,.nqs-area-score > small')].map(e => parseFloat(getComputedStyle(e).fontSize))), overflow: el.scrollWidth > el.clientWidth + 1 }));
  expect(metrics.minFont).toBeGreaterThanOrEqual(24);
  expect(metrics.overflow).toBe(false);
  expect(await pane.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await pane.locator('.nqs-orbit-node').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')))).toEqual(labels);
  const audit = await new AxeBuilder({ page }).include('#nqdPane-skills').withRules(['color-contrast']).analyze();
  expect(audit.violations).toEqual([]);
  expect(await progress(page)).toEqual(before);
});

test('map suggestion uses a distinct background and preserves its study action', async ({ page }) => {
  await openSkills(page); await page.locator('#nqdTab-mapa').click();
  const before = await progress(page), suggestion = page.locator('.nqd-map-suggestion');
  await expect(suggestion).toContainText('Uma área para retomar');
  const colors = await suggestion.evaluate(el => ({ suggestion: getComputedStyle(el).backgroundColor, browse: getComputedStyle(document.querySelector('.nqd-map-browse')!).backgroundColor }));
  expect(colors.suggestion).not.toBe(colors.browse);
  const button = suggestion.locator('[data-action="_dashTrainCategories"]'), cat = await button.getAttribute('data-arg');
  const audit = await new AxeBuilder({ page }).include('.nqd-map-suggestion').withRules(['color-contrast']).analyze();
  expect(audit.violations).toEqual([]);
  expect(await progress(page)).toEqual(before);
  await button.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  expect(await page.evaluate(() => [...new Set((0, eval)('studyModeQuestions').map((q: any) => q.cat))])).toEqual([cat]);
});
