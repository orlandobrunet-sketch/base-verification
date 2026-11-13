import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { saveBase } from '../helpers/fixtures';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
test.beforeEach(async ({ context, baseURL, page }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => (window as any)._loadTopics());
  await page.evaluate(save => {
    localStorage.clear();
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({ version: 1,
      totalQuestions: 40, totalCorrect: 23, totalWrong: 17, byTopic: {}, questionHistory: [], dailyActivity: {},
      timeStats: {}, mostMissed: {}, byCategory: { drc: { correct: 9, wrong: 1 },
        glomerular: { correct: 2, wrong: 8 }, dialise: { correct: 6, wrong: 4 }, transplante: { correct: 6, wrong: 4 } } }));
    (window as any).isAdminUser = () => false;
    return (window as any).openDashboard();
  }, saveBase());
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await page.locator('[role="tab"][aria-controls="nqdPane-skills"]').click();
  await expect(page.locator('#nqdPane-skills')).toBeVisible();
});

test('neutral labels preserve the three performance states, values and category accents', async ({ page }) => {
  const before = await page.evaluate(() => [localStorage.getItem('nefroquest-save'), localStorage.getItem('nefroquest-detailed-stats')]);
  const rows = page.locator('#nqdPane-skills .nqs-area:is([data-state="attention"], [data-state="consolidating"], [data-state="consistent"])');
  await expect(rows).toHaveCount(4);
  const samples = await rows.locator('.nqs-area-sample').evaluateAll(els => els.map(el => getComputedStyle(el).color));
  expect(new Set(samples).size).toBe(1);
  for (const state of ['attention', 'consolidating', 'consistent']) expect(await page.locator(`#nqdPane-skills .nqs-area[data-state="${state}"]`).count()).toBeGreaterThan(0);
  const drc = page.locator('#nqdPane-skills .nqs-area[data-skill-id="drc_nefroprotecao"]');
  await expect(drc.locator('.nqs-area-score')).toHaveText('90% de acertos na amostra');
  await expect(drc).toHaveAttribute('data-state', 'consistent');
  const styles = await drc.evaluate(el => ({ name: getComputedStyle(el.querySelector('.nqs-area-name')!).color,
    sample: getComputedStyle(el.querySelector('.nqs-area-sample')!).color,
    value: getComputedStyle(el.querySelector('.nqs-area-score')!).color,
    neutral: getComputedStyle(el).getPropertyValue('--nql-text').trim() }));
  expect(styles.name).not.toBe(styles.value); expect(styles.name).toBe('rgb(152, 207, 168)'); expect(styles.sample).not.toBe(styles.value);
  await expect(page.locator('#nqdPane-skills .nqs-area[data-skill-id="glomerulopatias"] .nqs-area-name')).toHaveCSS('color', 'rgb(201, 181, 255)');
  await expect(drc.locator('.nqs-area-score')).toHaveCSS('color', 'rgb(239, 230, 210)');
  const contrast = await new AxeBuilder({ page }).include('.nqs-area-grid').withRules(['color-contrast']).analyze();
  expect(contrast.violations).toEqual([]);
  expect(await page.evaluate(() => [localStorage.getItem('nefroquest-save'), localStorage.getItem('nefroquest-detailed-stats')])).toEqual(before);
});

test('skill rows keep values and text accessible at 320px and 200 percent text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const pane = page.locator('#nqdPane-skills');
  expect(await pane.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await expect(pane.locator('.nqs-area')).toHaveCount(7);
  await expect(pane.locator('.nqs-area:is([data-state="attention"], [data-state="consolidating"], [data-state="consistent"])')).toHaveCount(4);
  await expect(pane.locator('.nqs-area[data-skill-id="drc_nefroprotecao"] .nqs-area-score')).toHaveText('90% de acertos na amostra');
  const contrast = await new AxeBuilder({ page }).include('.nqs-area-grid').withRules(['color-contrast']).analyze();
  expect(contrast.violations).toEqual([]);
});

test('SVG selectors stay unclipped while accessible observed values and absent samples remain exact', async ({ page }, info) => {
  const instrument = page.locator('#nqdPane-skills .nqs-instrument');
  await expect(instrument.locator('svg.nqs-chart')).toBeVisible();
  await expect(instrument.locator('.nqs-vertex-point')).toHaveCount(4);
  await expect(instrument.locator('.nqs-profile-fill')).toHaveCount(0);
  await expect(instrument.locator('.nqs-orbit-node[data-skill-id="drc_nefroprotecao"]')).toHaveAttribute('aria-label', 'DRC, nefroproteção e HAS, 90% de acertos, 10 respostas. Ver área');
  await expect(instrument.locator('.nqs-orbit-node[data-skill-id="hidroeletrolitico_acidobase"]')).toHaveAttribute('aria-label', 'Hidroeletrolítico e ácido-base, Sem amostra. Ver área');
  const metrics = await instrument.evaluate(el => {
    const chart = el.querySelector('.nqs-astrolabe')!.getBoundingClientRect();
    return [...el.querySelectorAll('.nqs-orbit-node')].map(node => {
      const box = node.getBoundingClientRect();
      return { label: node.getAttribute('aria-label'), width: box.width, height: box.height,
        left: box.left - chart.left, right: chart.right - box.right, top: box.top - chart.top, bottom: chart.bottom - box.bottom };
    });
  });
  await info.attach('atlas-selector-metrics', { body: Buffer.from(JSON.stringify(metrics, null, 2)), contentType: 'application/json' });
  expect(metrics).toHaveLength(7);
  for (const item of metrics) {
    expect(item.label).not.toBe(''); expect(item.width).toBeGreaterThanOrEqual(44); expect(item.height).toBeGreaterThanOrEqual(44);
    for (const gap of [item.left, item.right, item.top, item.bottom]) expect(gap).toBeGreaterThanOrEqual(-1);
  }
  const drc = page.locator('#nqdPane-skills [data-nqs-vertex="2"] .nqs-vertex-point');
  const radius = await drc.evaluate(el => Math.hypot(Number(el.getAttribute('cx')) - 280, Number(el.getAttribute('cy')) - 280));
  expect(radius).toBeCloseTo(170 * .9, 1);
  await expect(instrument.locator('[data-nqs-vertex="1"]')).toHaveCount(0);
});
