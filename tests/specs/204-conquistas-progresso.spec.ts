import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { injectGameState } from '../helpers/game';
import { installGameSaveObserver, waitForPendingGameSave } from '../helpers/game-persistence';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const keys = ['nefroquest-save', 'nefroquest-save-v7', 'nefroquest-detailed-stats', 'nefroquest-achievements', 'nefroquest-badge-history', 'nq-unlocked-refs', 'unlockedArticles'];
const snapshot = (page: Page) => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), keys);

async function openCollection(page: Page, earned: 'some' | 'none' | 'all' = 'some') {
  await installGameSaveObserver(page);
  await page.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { correctTotal: 18 });
  await waitForPendingGameSave(page);
  await page.evaluate(earned => {
    const list = (0, eval)('ACHIEVEMENTS_LIST');
    localStorage.setItem('nefroquest-achievements', JSON.stringify(earned === 'all' ? list.map((a: any) => a.id) : earned === 'none' ? [] : ['hd_master', 'arqui_nefromante_slayer', 'accuracy_master']));
    localStorage.setItem('nefroquest-badge-history', JSON.stringify({ 1: { jornada: 1 }, 2: { jornada: 1 }, 3: { jornada: 1 }, 4: { jornada: 1 }, 5: { jornada: 1 } }));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({ totalQuestions: 100, totalCorrect: 35, totalWrong: 65, byTopic: { Hemodiálise: { total: 40, correct: 35, wrong: 5 } }, byCategory: {}, questionHistory: [], dailyActivity: {} }));
    void (window as any).openDashboard({ tab: 'achievements' });
  }, earned);
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  return page.locator('#nqdPane-achievements');
}

test('aquisição registrada conserva barra completa sem inventar contadores e mantém popup e storage coerentes', async ({ page }) => {
  const pane = await openCollection(page), before = await snapshot(page);
  for (const id of ['hd_master', 'arqui_nefromante_slayer', 'accuracy_master']) {
    const card = pane.locator(`[data-achievement-id="${id}"]`);
    await expect(card).toHaveAttribute('data-achievement-status', 'unlocked');
    await expect(card.locator('.nqd-achievement-progress')).toHaveText('Requisito cumprido · 100%');
    await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
    await card.locator('.nqd-achievement-mark').click();
    const dialog = page.locator('.nq-ach-detail[open]');
    await expect(dialog.locator('.nq-ach-detail-progress')).toHaveText('Requisito cumprido · 100%');
    await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    await page.keyboard.press('Escape');
    await expect(card.locator('.nqd-achievement-mark')).toBeFocused();
  }
  // Aquisição passada de selo não pode falsear os18/20acertos da jornada atual.
  const remembered = pane.locator('.nqd-badge-path [data-badge-preview="1"]');
  await remembered.click();
  await expect(page.locator('.nq-ach-detail[open] [role="progressbar"]')).toHaveAttribute('aria-valuenow', '18');
  await expect(page.locator('.nq-ach-detail[open] [role="progressbar"]')).toHaveAttribute('aria-valuemax', '20');
  await page.keyboard.press('Escape');
  expect(await snapshot(page)).toEqual(before);
});

test('progresso parcial e meta completa sem aquisição mantêm valores reais e não concedem conquistas', async ({ page }) => {
  const pane = await openCollection(page, 'none'), before = await snapshot(page);
  await expect(pane.locator('[data-achievement-id="hd_master"] [role="progressbar"]')).toHaveAttribute('aria-valuenow', '35');
  await expect(pane.locator('[data-achievement-id="hd_master"] [role="progressbar"]')).toHaveAttribute('aria-valuemax', '50');
  const century = pane.locator('[data-achievement-id="century_club"]');
  await expect(century.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await expect(century).toHaveClass(/is-locked/);
  await expect(century.locator('.nqd-achievement-progress')).not.toContainText('Requisito cumprido');
  await expect(pane.locator('[data-achievement-id="arqui_nefromante_slayer"] [role="progressbar"]')).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
});

test('todas as conquistas completas exibem medidor legível e contraste adequado', async ({ page }) => {
  const pane = await openCollection(page, 'all');
  const count = await pane.locator('.nqd-achievement').count();
  await expect(pane.locator('.nqd-achievement-progress')).toHaveCount(count);
  expect(await pane.locator('.nqd-achievement [role="progressbar"]').evaluateAll(els => els.every(el => el.getAttribute('aria-valuenow') === '100' && el.getAttribute('aria-valuemax') === '100'))).toBe(true);
  const audit = await new AxeBuilder({ page }).include('.nqd-achievement-progress').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(audit.violations).toEqual([]);
});

test('trilha com vitrine máxima deixa os cinco quadros inteiros na janela desktop de referência', async ({ page }) => {
  await page.setViewportSize({ width: 1918, height: 1074 });
  const pane = await openCollection(page, 'all');
  const expected = await page.evaluate(() => 5 + (0, eval)('ACHIEVEMENTS_LIST.length'));
  await expect(pane.locator('.nqd-trophy-showcase li')).toHaveCount(expected);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll<HTMLImageElement>('.nqd-badge-path img')].map(img => img.decode())); });
  const bounds = await pane.locator('.nqd-badge-path').evaluate(el => { const r = el.getBoundingClientRect(); return { bottom: r.bottom, right: r.right, viewport: innerHeight, overflow: el.scrollWidth > el.clientWidth + 1 }; });
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewport - 16);
  expect(bounds.overflow).toBe(false);
  expect(await pane.locator('.nqd-badge-art').first().evaluate(el => el.getBoundingClientRect().width)).toBe(128);
});

for (const cfg of [{ width: 390, font: 16 }, { width: 320, font: 32 }]) test(`trilha e barras refluem em ${cfg.width}px com fonte ${cfg.font}px e preservam Tab natural`, async ({ page }) => {
  await page.setViewportSize({ width: cfg.width, height: 844 });
  const pane = await openCollection(page, 'all'), before = await snapshot(page);
  await page.evaluate(font => { document.documentElement.style.fontSize = font + 'px'; }, cfg.font);
  const path = pane.locator('.nqd-badge-path');
  expect(await path.evaluate(el => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  expect(await page.locator('.nqd-main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await path.focus();
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press('Tab');
    const button = path.locator('.nqd-badge-art').nth(index);
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter'); await expect(page.locator('.nq-ach-detail[open]')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(button).toBeFocused();
  }
  expect(await pane.locator('.nqd-achievement-progress').evaluateAll(els => els.every(el => el.scrollWidth <= el.clientWidth + 1))).toBe(true);
  expect(await snapshot(page)).toEqual(before);
});
