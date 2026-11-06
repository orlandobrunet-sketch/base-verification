import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { saveBase } from '../helpers/fixtures';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
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
    const top = el.querySelector('.nqd-skill-list-section')!, bottom = el.querySelector('.nqd-error-patterns')!;
    return { gap: bottom.getBoundingClientRect().top - top.getBoundingClientRect().bottom, top: getComputedStyle(top).backgroundColor, bottom: getComputedStyle(bottom).backgroundColor };
  });
  expect(metrics.gap).toBeGreaterThanOrEqual(20);
  expect(metrics.top).not.toBe(metrics.bottom);
  await expect(pane.locator('.nqd-error-ledger strong')).toHaveText(['7', '4', '2']);
  await expect(pane.locator('.nqd-error-ledger')).toContainText('Lacuna de conhecimento');
  const audit = await new AxeBuilder({ page }).include('#nqdPane-skills').withRules(['color-contrast']).analyze();
  expect(audit.violations).toEqual([]);
  expect(await progress(page)).toEqual(before);
});

for (const count of [0, 2, 3, 7]) test(`profile preserves ${count} measured areas and actual values`, async ({ page }) => {
  const pane = await openSkills(page, count), before = await progress(page);
  await expect(pane.locator('.nqd-skill-row')).toHaveCount(count);
  await expect(pane.locator('.nqd-radar')).toHaveCount(count < 3 ? 0 : 2);
  if (count >= 3) {
    const radar = pane.locator('#nqDashRadarContainer');
    const label = await radar.getAttribute('aria-label');
    expect(label).toContain('20% em 10 respostas');
    expect(label?.includes('sem amostra')).toBe(count < 7);
    if (count === 7) expect(label).toContain('0% em 10 respostas');
  } else if (!count) await expect(pane.locator('.nqd-skill-empty')).toContainText('Nenhuma área é tratada como desempenho zero');
  expect(await progress(page)).toEqual(before);
});

test('narrow profile keeps readable values at 200 percent text without clipping', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const pane = await openSkills(page), before = await progress(page);
  const label = await pane.locator('#nqDashRadarMobileContainer').getAttribute('aria-label');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const toggle = pane.locator('.nqd-skill-radar-mobile > summary');
  await toggle.focus(); await page.keyboard.press('Enter');
  const values = pane.locator('#nqDashRadarMobileContainer .nqd-radar-values');
  await expect(values).toBeVisible();
  await expect(values.locator('li')).toHaveCount(7);
  await expect(values).toContainText('20%');
  await expect(values).toContainText('Sem amostra');
  const metrics = await values.evaluate(el => ({ minFont: Math.min(...[...el.querySelectorAll('span,strong,small')].map(e => parseFloat(getComputedStyle(e).fontSize))), overflow: el.scrollWidth > el.clientWidth + 1 }));
  expect(metrics.minFont).toBeGreaterThanOrEqual(24);
  expect(metrics.overflow).toBe(false);
  expect(await pane.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await expect(pane.locator('#nqDashRadarMobileContainer')).toHaveAttribute('aria-label', label!);
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
