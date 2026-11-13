import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openVisualDashboard, visualProgress } from '../helpers/dashboard-visual-fixture';

// Stable current-only authored cases: this layout/keyboard contract must not depend on archive additions.
const STUDY_ACTION_IDS = ['1e5e88e9', 'e56795a6', '70129a64', 'cc3248a3'];

async function openActions(page: Page, context: BrowserContext, baseURL: string, kinds = ['study', 'review', 'gap']) {
  await openVisualDashboard(page, context, baseURL);
  const fixture = await page.evaluate(ids => ids.map(id => {
    const w = window as any, q = w.questionBank.find((q: any) => String(q.id) === id);
    const checked = w.questionRevisionCatalog.inspectLegacy(id, { profile: 'study' });
    return { id: q ? String(q.id) : null, status: checked.status, historical: checked.value?.historical, options: q?.o.length };
  }), STUDY_ACTION_IDS);
  expect(fixture).toEqual(STUDY_ACTION_IDS.map(id => ({ id, status: 'known', historical: false, options: 4 })));
  await page.evaluate(({ kinds, ids }) => {
    const w = window as any;
    if (kinds.includes('study')) localStorage.setItem('nefroquest-study-state', JSON.stringify({ questions: ids, index: 1, correct: 1, wrong: 0, axisStats: {}, savedAt: Date.now() }));
    if (kinds.includes('review')) localStorage.setItem('nefroquest-sr-data', JSON.stringify({ [ids[0]]: { S: 3, D: 4.9, interval: 3, due: new Date().setHours(0, 0, 0, 0) - 86400000, last: Date.now() - 4 * 86400000, reps: 2, lapses: 0 } }));
    if (!kinds.includes('gap')) localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({ version: 1, totalQuestions: 0, totalCorrect: 0, byCategory: {}, byTopic: {}, questionHistory: [], dailyActivity: {}, timeStats: {}, mostMissed: {} }));
    w.closeDashboard();
    return w.openDashboard({ tab: 'overview' });
  }, { kinds, ids: STUDY_ACTION_IDS });
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  return page.locator('.nqd-next-actions-list');
}

test('three purposes have distinct surfaces, readable text and unchanged progress', async ({ page, context, baseURL }) => {
  const list = await openActions(page, context, baseURL!), before = await visualProgress(page);
  await expect(list.locator('.nqd-next-action')).toHaveCount(3);
  await expect(list.locator('[data-action-kind="study"]')).toContainText('Retomar 3 questões restantes');
  await expect(list.locator('[data-action-kind="review"]')).toContainText('1 revisão agendada vencida');
  await expect(list.locator('[data-action-kind="gap"]')).toContainText('20% em 10 respostas');
  const colors = await list.locator('.nqd-next-action').evaluateAll(cards => cards.map(c => getComputedStyle(c).backgroundColor));
  expect(new Set(colors).size).toBe(3);
  expect(colors.every(c => c !== 'rgba(0, 0, 0, 0)')).toBe(true);
  const audit = await new AxeBuilder({ page }).include('.nqd-next-actions-list').withRules(['color-contrast']).analyze();
  expect(audit.violations).toEqual([]);
  expect(await visualProgress(page)).toEqual(before);
});

for (const kinds of [['review', 'gap'], ['gap'], []]) test(`missing actions preserve priority and fallbacks: ${kinds.join(',') || 'none'}`, async ({ page, context, baseURL }) => {
  const list = await openActions(page, context, baseURL!, kinds), before = await visualProgress(page);
  const expected = [...kinds, 'journey', ...(kinds.includes('gap') ? ['practice'] : [])].slice(0, 3);
  expect(await list.locator('.nqd-next-action').evaluateAll(cards => cards.map(c => c.getAttribute('data-action-kind')))).toEqual(expected);
  await expect(list.locator('.is-primary')).toHaveCount(1);
  await expect(list.locator('.nqd-next-action').first()).toHaveClass(/is-primary/);
  const priority = await list.locator('.is-primary').evaluate(el => ({ border: getComputedStyle(el).borderTopColor, gold: getComputedStyle(el).getPropertyValue('--nqh-ouro-rgb'), button: !!el.querySelector('.nqd-primary-action') }));
  expect(priority.button).toBe(true);
  // Primary gold is shared across all positions/types, including journey fallback.
  expect(priority.border.replace(/\s/g, '')).toBe(`rgba(${priority.gold.replace(/\s/g, '')},0.55)`);
  if (kinds.length) {
    const surface = await list.locator('.is-primary').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(surface).toBe(kinds[0] === 'review' ? 'rgb(37, 32, 53)' : 'rgb(43, 33, 29)');
  }
  const audit = await new AxeBuilder({ page }).include('.nqd-next-actions-list').withRules(['color-contrast']).analyze();
  expect(audit.violations).toEqual([]);
  expect(await visualProgress(page)).toEqual(before);
});

test('320px with 200 percent text preserves all action text and buttons without overflow', async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const list = await openActions(page, context, baseURL!), text = await list.innerText(), before = await visualProgress(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  expect(await list.innerText()).toBe(text);
  expect(await list.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  for (const button of await list.locator('button').all()) {
    await button.focus(); await expect(button).toBeFocused();
    const geometry = await button.evaluate(el => ({ textFits: el.scrollWidth <= el.clientWidth + 1, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }));
    expect(geometry.textFits).toBe(true); expect(geometry.width).toBeGreaterThanOrEqual(44); expect(geometry.height).toBeGreaterThanOrEqual(44);
  }
  expect(await visualProgress(page)).toEqual(before);
});

for (const kind of ['study', 'review', 'gap']) test(`keyboard opens the real ${kind} flow`, async ({ page, context, baseURL }) => {
  const list = await openActions(page, context, baseURL!), before = await visualProgress(page);
  const ids = [...STUDY_ACTION_IDS];
  const button = list.locator(`[data-action-kind="${kind}"] button`);
  await button.focus(); await page.keyboard.press('Enter');
  if (kind === 'gap') {
    const replace = page.getByRole('button', { name: 'Iniciar nova sessão', exact: true });
    await expect(replace).toBeVisible(); await replace.focus(); await page.keyboard.press('Enter');
  }
  await expect(page.locator('#studyModePage')).toBeVisible();
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  const questions = await page.evaluate(() => (0, eval)('studyModeQuestions').map((q: any) => ({ id: String(q.qid || q.id), cat: q.cat })));
  if (kind === 'study') expect(questions.map((q: any) => q.id)).toEqual(ids);
  if (kind === 'review') expect(questions.map((q: any) => q.id)).toEqual([ids[0]]);
  if (kind === 'gap') expect([...new Set(questions.map((q: any) => q.cat))]).toEqual(['glomerular']);
  expect(await visualProgress(page)).toEqual(before);
});
