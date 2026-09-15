import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/');
});

test('pergunta → Grimório → mesma pergunta, com foco e rascunho preservados', async ({ page }) => {
  await injectGameState(page);
  await expect(page.locator('#question')).not.toHaveText('');
  const question = await page.locator('#question').innerText();
  const snapshot = () => page.evaluate(() => {
    const s = (0, eval)('state');
    return JSON.stringify({ idx: s.idx, lives: s.lives, score: s.score, correctTotal: s.correctTotal });
  });
  const before = await snapshot();
  const opener = page.locator('[data-action="openBibliotecaModal"]:visible').first();
  await opener.click();
  await expect(page.locator('#nqdPane-library')).toBeVisible();
  await expect(page.locator('#bibliotecaModal')).toBeHidden();
  await expect(page.locator('.nqd-brand-close')).toHaveAccessibleName('Voltar à questão');
  await expect(page.locator('.nqd-back')).toHaveText('Voltar à questão');
  await page.locator('.bib-suggest-toggle').click();
  await page.locator('#bibSuggestReason').fill('Rascunho local de teste');
  await page.keyboard.press('Escape');
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator('#question')).toHaveText(question);
  expect(await snapshot()).toBe(before);
  await opener.click();
  await expect(page.locator('#nqdPane-library')).toBeVisible();
  await expect(page.locator('#bibSuggestReason')).toHaveValue('Rascunho local de teste');
  await expect(page.locator('#bibSuggestForm')).toHaveCount(1);
});

test('visitante mantém bloqueios; visão administrativa não grava descobertas', async ({ page }) => {
  await page.locator('[data-portal-route="guest"]').click();
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqdPane-library')).toBeVisible();
  await expect(page.locator('.nqd-library-locked')).toBeVisible();
  await expect(page.locator('[data-library-item]')).toHaveCount(0);
  const before = await page.evaluate(() => [localStorage.getItem('unlockedArticles'), localStorage.getItem('nq-unlocked-refs')]);
  await page.keyboard.press('Escape');
  await page.evaluate(() => { (window as any).isAdminUser = () => true; void (window as any).openBibliotecaModal(); });
  await expect(page.locator('#nqdPane-library')).toBeVisible();
  await expect(page.locator('.nqd-library-summary')).toContainText('Visão administrativa');
  await expect(page.locator('.nqd-library-locked')).toHaveCount(0);
  const total = await page.evaluate(() => (0, eval)('nefroArticles.length + Object.keys(refsDB).length'));
  await expect(page.locator('[data-library-item]')).toHaveCount(total);
  await page.getByRole('tab', { name: 'Fontes clínicas' }).click();
  await page.locator('#nqDashLibraryFilter').selectOption('guideline');
  const guidelines = await page.evaluate(() => (0, eval)(`Object.values(refsDB).filter(r => r.badge === 'GUIDELINE' || /kdigo/i.test((r.label || '') + ' ' + (r.journal || ''))).length`));
  expect(guidelines).toBeGreaterThan(0);
  await expect(page.locator('[data-library-item]:visible')).toHaveCount(guidelines);
  expect(await page.evaluate(() => [localStorage.getItem('unlockedArticles'), localStorage.getItem('nq-unlocked-refs')])).toEqual(before);
});

test('retorno fica desobstruído com texto a 200% em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator('[data-portal-route="guest"]').click();
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqdPane-library')).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const back = page.locator('.nqd-brand-close');
  await expect(back).toHaveAccessibleName('Voltar ao Átrio');
  const unobstructed = await back.evaluate(el => {
    const r = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  });
  expect(unobstructed).toBe(true);
  await back.click();
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
  await expect(page.locator('#atriumMain')).toBeVisible();
});
