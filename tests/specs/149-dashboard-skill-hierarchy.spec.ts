import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { saveBase } from '../helpers/fixtures';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ context, baseURL, page }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    (window as any).__radarText = [];
    CanvasRenderingContext2D.prototype.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
      if (this.canvas.closest('#nqDashRadarContainer, #nqDashRadarMobileContainer')) {
        const metrics = this.measureText(text), size = parseFloat(this.font.match(/([\d.]+)px/)?.[1] || '0');
        const left = x - (this.textAlign === 'right' ? metrics.width : this.textAlign === 'center' ? metrics.width / 2 : 0);
        (window as any).__radarText.push({ text, x, y, size, left, right: left + metrics.width });
      }
      return maxWidth === undefined ? original.call(this, text, x, y) : original.call(this, text, x, y, maxWidth);
    };
  });
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
  const rows = page.locator('#nqdPane-skills .nqd-skill-row');
  await expect(rows).toHaveCount(4);
  const samples = await rows.locator('.nqd-skill-sample').evaluateAll(els => els.map(el => getComputedStyle(el).color));
  expect(new Set(samples).size).toBe(1);
  for (const state of ['attention', 'consolidating', 'consistent']) expect(await page.locator(`#nqdPane-skills .nqd-skill-row[data-state="${state}"]`).count()).toBeGreaterThan(0);
  const drc = page.locator('#nqdPane-skills [data-skill-id="drc_nefroprotecao"]');
  await expect(drc.locator('.nqd-skill-value')).toHaveText('90%');
  await expect(drc).toHaveAttribute('data-state', 'consistent');
  const styles = await drc.evaluate(el => ({ name: getComputedStyle(el.querySelector('.nqd-skill-name')!).color,
    sample: getComputedStyle(el.querySelector('.nqd-skill-sample')!).color,
    value: getComputedStyle(el.querySelector('.nqd-skill-value')!).color,
    neutral: getComputedStyle(el).getPropertyValue('--nql-text').trim() }));
  expect(styles.name).not.toBe(styles.value); expect(styles.name).not.toBe('rgb(152, 207, 168)'); expect(styles.sample).not.toBe(styles.value);
  await expect(page.locator('#nqdPane-skills [data-skill-id="glomerulopatias"] .nqd-skill-name')).toHaveCSS('color', 'rgb(201, 181, 255)');
  await expect(drc.locator('.nqd-skill-value')).toHaveCSS('color', 'rgb(131, 216, 173)');
  const contrast = await new AxeBuilder({ page }).include('.nqd-skill-list').withRules(['color-contrast']).analyze();
  expect(contrast.violations).toEqual([]);
  expect(await page.evaluate(() => [localStorage.getItem('nefroquest-save'), localStorage.getItem('nefroquest-detailed-stats')])).toEqual(before);
});

test('skill rows keep values and text accessible at 320px and 200 percent text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const pane = page.locator('#nqdPane-skills');
  expect(await pane.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await expect(pane.locator('.nqd-skill-row')).toHaveCount(4);
  const contrast = await new AxeBuilder({ page }).include('.nqd-skill-list').withRules(['color-contrast']).analyze();
  expect(contrast.violations).toEqual([]);
});

test('radar labels are larger and unclipped while the accessible values stay identical', async ({ page }, info) => {
  if (info.project.name === 'mobile') await page.locator('.nqd-skill-radar-mobile > summary').click();
  const container = page.locator(info.project.name === 'mobile' ? '#nqDashRadarMobileContainer' : '#nqDashRadarContainer');
  await expect(container.locator('canvas')).toBeVisible();
  await expect(container).toHaveAttribute('aria-label', /90% em 10 respostas/);
  const labels = await page.evaluate(() => (window as any).__radarText);
  await info.attach('radar-label-metrics', { body: Buffer.from(JSON.stringify(labels.slice(0, 28), null, 2)), contentType: 'application/json' });
  expect(labels.length).toBeGreaterThanOrEqual(28);
  for (const label of labels) { expect(label.size).toBe(18); expect(label.left).toBeGreaterThanOrEqual(7.9); expect(label.right).toBeLessThanOrEqual(372.1); expect(label.y).toBeGreaterThanOrEqual(20); expect(label.y).toBeLessThanOrEqual(350); }
  const firstFrame = labels.slice(0, 14);
  expect(firstFrame[4].text).toBe('DRC'); expect(firstFrame[5].text).toBe('90%');
  expect(firstFrame[2].text).toBe('DHE'); expect(firstFrame[3].text).toBe('\u2014');
});
