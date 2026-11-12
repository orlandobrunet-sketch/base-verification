import { test, expect, type Page } from '@playwright/test';
import { openChamberCase } from '../helpers/chamber';
import { chamberCatalog } from '../helpers/chamber-catalog';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function open(page: Page, id = 'aldric') {
  await page.route('**/*', route => route.request().method() === 'GET' && new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.addInitScript(() => Math.random = () => 0.5);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  const previous = chamberCatalog.slice(0, chamberCatalog.findIndex(c => c.id === id)).map(c => c.id);
  await page.evaluate(ids => localStorage.setItem('nq-acidbase-progress', JSON.stringify({ completed: ids })), previous);
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="balance"]:visible').click();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (await page.locator('#nqEntryCinema[open]').count()) await page.keyboard.press('Escape');
  await openChamberCase(page, id);
  await page.locator('[data-ab-start-acts]').click();
}

async function finish(page: Page, id = 'aldric', refuseSave = false) {
  const acts = chamberCatalog.find(c => c.id === id).acts;
  for (const [index, act] of acts.entries()) {
    if (act.kind === 'mc') await page.locator('.ab-option').filter({ hasText: act.options.find((o: any) => o.correct).label }).click();
    else if (act.kind === 'num') { await page.locator('#abNumInput').fill(String(act.target)); await page.locator('[data-ab-num-submit]').click(); }
    else { for (const card of act.cards.filter((c: any) => c.correct)) await page.locator(`[data-ab-card-id="${card.id}"]`).click(); await page.locator('[data-ab-cards-submit]').click(); }
    if (refuseSave && index === acts.length - 1) await page.evaluate(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) { if (key === 'nq-acidbase-progress') throw Error('Technical refusal'); return set.call(this, key, value); };
    });
    await page.locator('.ab-next').click();
  }
}

test('resultado segue ao próximo caso salvo sem voltar ao catálogo nem pular com clique duplicado', async ({ page }) => {
  await open(page); await finish(page);
  const next = page.locator('[data-ab-continue-case="mara"]');
  await expect(next).toBeVisible();
  const saved = await page.evaluate(() => localStorage.getItem('nq-acidbase-progress'));
  expect(JSON.parse(saved!).completed).toContain('aldric');
  await next.evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.locator('.ab-context .ab-title')).toHaveText('Curandeira Mara');
  await expect(page.locator('.ab-context .ab-title')).toBeFocused();
  await expect(page.locator('[data-ab-start-acts]')).toBeEnabled();
  await expect(page.locator('.ab-grid')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('nq-acidbase-progress'))).toBe(saved);
});

test('próximo caso revalida a conclusão persistida e não recria progresso removido', async ({ page }) => {
  await open(page); await finish(page);
  await page.evaluate(() => localStorage.setItem('nq-acidbase-progress', JSON.stringify({ completed: [] })));
  const raw = await page.evaluate(() => localStorage.getItem('nq-acidbase-progress'));
  await page.locator('[data-ab-continue-case="mara"]').click();
  await expect(page.locator('.ab-summary-title')).toBeVisible();
  await expect(page.locator('.ab-context .ab-title')).toHaveText('Ferreiro Aldric');
  expect(await page.evaluate(() => localStorage.getItem('nq-acidbase-progress'))).toBe(raw);
});

test('falha ao confirmar conclusão não libera próximo caso', async ({ page }) => {
  await open(page); await finish(page, 'aldric', true);
  await expect(page.locator('.ab-summary-title, [data-ab-continue-case]')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-acidbase-progress')!).completed)).not.toContain('aldric');
});

test('último caso encerra o percurso e mantém replay e catálogo disponíveis', async ({ page }) => {
  await open(page, 'mireth'); await finish(page, 'mireth');
  await expect(page.locator('.ab-summary-title')).toBeVisible();
  await expect(page.locator('[data-ab-continue-case]')).toHaveCount(0);
  await expect(page.locator('[data-ab-replay]')).toBeEnabled();
  await expect(page.locator('[data-ab-back]')).toBeEnabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-acidbase-progress')!).completed.length)).toBe(20);
});
