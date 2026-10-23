import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openVisualDashboard, visualProgress } from '../helpers/dashboard-visual-fixture';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page, context, baseURL }) => {
  await openVisualDashboard(page, context, baseURL!);
  await page.locator('#nqdTab-mapa').click();
  await expect(page.locator('#nqDashMapResult')).not.toBeEmpty();
});

test('black surfaces distinguish areas without changing recommendation, counts or filtering', async ({ page }) => {
  const before = await visualProgress(page);
  await expect(page.locator('.nqd-map-suggestion')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(page.locator('.nqd-map-browse')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const areas = page.locator('[data-map-area]:visible');
  expect(await areas.count()).toBeGreaterThan(1);
  for (const area of await areas.all()) await expect(area).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  const palette = await areas.evaluateAll(els => els.map(el => getComputedStyle(el).borderLeftColor));
  expect(new Set(palette).size).toBeGreaterThan(1);
  const first = areas.first(), title = await first.locator('h3').innerText();
  const action = first.locator('[data-action="_dashTrainCategories"]');
  const cat = await action.getAttribute('data-arg');
  const summaryBefore = await first.locator('.nqd-map-summary-state').innerText();
  await page.locator('#nqDashMapSearch').fill(title);
  await expect(first).toBeVisible();
  const count = await first.locator('.nqd-map-node').count();
  await expect(first.locator('.nqd-map-summary-state')).toHaveText(`${count} temas nesta busca`);
  await expect(first.locator('.nqd-map-summary-state')).toHaveAttribute('data-default', summaryBefore);
  await page.locator('#nqDashMapSearch').fill('no-match-local-fixture-zz');
  await expect(page.locator('#nqDashMapEmpty')).toBeVisible();
  await page.locator('[data-action="_dashClearMapSearch"]').click();
  await expect(first.locator('.nqd-map-summary-state')).toHaveText(summaryBefore);
  const details = first.locator('[data-map-group]');
  if (await details.getAttribute('open') !== null) {
    await details.locator(':scope > summary').focus(); await page.keyboard.press('Space');
    await expect(details).not.toHaveAttribute('open', '');
  }
  await details.locator(':scope > summary').focus(); await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(first.locator('.nqd-map-node').first()).toBeVisible();
  const contrast = await new AxeBuilder({ page }).include('#nqdPane-mapa').withRules(['color-contrast']).analyze();
  expect(contrast.violations).toEqual([]);
  expect(await visualProgress(page)).toEqual(before);
  await action.click();
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  expect(await page.evaluate(() => [...new Set((0, eval)('studyModeQuestions').map((q: any) => q.cat))])).toEqual([cat]);
});

test('area blocks keep full text and controls available at 320px with enlarged text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const pane = page.locator('#nqdPane-mapa');
  expect(await pane.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const first = pane.locator('[data-map-area]:visible').first();
  const action = first.locator('[data-action="_dashTrainCategories"]');
  await action.scrollIntoViewIfNeeded();
  const target = await action.evaluate(el => {
    const r = el.getBoundingClientRect(); return { width: r.width, height: r.height,
      hit: el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
  });
  expect(target.width).toBeGreaterThanOrEqual(44); expect(target.height).toBeGreaterThanOrEqual(44); expect(target.hit).toBe(true);
  const contrast = await new AxeBuilder({ page }).include('#nqdPane-mapa').withRules(['color-contrast']).analyze();
  expect(contrast.violations).toEqual([]);
});
