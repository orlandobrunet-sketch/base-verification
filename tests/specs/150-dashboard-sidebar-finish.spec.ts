import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openVisualDashboard, visualProgress } from '../helpers/dashboard-visual-fixture';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page, context, baseURL }) => openVisualDashboard(page, context, baseURL!));

test('sidebar preserves whole personal title, useful width and visible keyboard states', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const before = await visualProgress(page);
  const title = page.locator('.nqd-profile-level');
  const metrics = await title.evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    const rect = el.getBoundingClientRect(), rail = el.closest('.nqd-rail')!.getBoundingClientRect();
    const lines = [...range.getClientRects()].filter(r => r.width > 0);
    return { lines: lines.length, font: parseFloat(getComputedStyle(el).fontSize),
      contained: lines.every(r => r.left >= rect.left - 1 && r.right <= rail.right - 1),
      gap: document.querySelector('.nqd-rail-kicker')!.getBoundingClientRect().top - document.querySelector('.nqd-brand')!.getBoundingClientRect().bottom };
  });
  expect(metrics.lines).toBe(1); expect(metrics.font).toBeGreaterThanOrEqual(12); expect(metrics.contained).toBe(true);
  expect(metrics.gap).toBeGreaterThanOrEqual(-1); expect(metrics.gap).toBeLessThanOrEqual(12);
  const active = page.locator('#nqdTab-overview');
  await active.focus();
  expect(await active.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#nqdTab-skills')).toBeFocused();
  await expect(page.locator('#nqdTab-skills')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#nqdPane-skills')).toBeVisible();
  const contrast = await new AxeBuilder({ page }).include('.nqd-rail').withRules(['color-contrast']).analyze();
  expect(contrast.violations).toEqual([]);
  expect(await visualProgress(page)).toEqual(before);
});

test('mobile navigation reflows without horizontal scrolling or restored icons at 200 percent', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const nav = page.locator('.nqd-nav');
  expect(await nav.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const tabs = nav.locator('[role="tab"]');
  for (const tab of await tabs.all()) {
    const box = await tab.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44);
    await expect(tab.locator('.nqd-nav-icon')).toBeHidden();
  }
  await page.locator('#nqdTab-mapa').click();
  await expect(page.locator('#nqdPane-mapa')).toBeVisible();
  await page.locator('.nqd-brand-close').click();
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
});
