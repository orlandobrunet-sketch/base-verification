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


test('retoma busca, filtro, resumo e leitura sem transferir contexto para outra conta', async ({ page }) => {
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => { (window as any).isAdminUser = () => true; });
  const opener = page.locator('[data-atrium-route="library"]');
  await opener.click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await page.getByRole('tab', { name: 'Fontes clínicas' }).click();
  await page.locator('#nqDashLibrarySearch').fill('kdigo');
  await page.locator('#nqDashLibraryFilter').selectOption('guideline');
  await page.locator('#nqDashLibrarySort').selectOption('oldest');
  const first = page.locator('[data-library-item]:visible').first();
  const key = await first.locator('[data-library-key]').getAttribute('data-library-key');
  await first.locator('[data-action="_dashToggleArticle"]').click();
  const scroll = await page.locator('.nqd-main').evaluate(el => { el.scrollTop = 240; return el.scrollTop; });
  expect(scroll).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await opener.click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await expect(page.getByRole('tab', { name: 'Fontes clínicas' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#nqDashLibrarySearch')).toHaveValue('kdigo');
  await expect(page.locator('#nqDashLibraryFilter')).toHaveValue('guideline');
  await expect(page.locator('#nqDashLibrarySort')).toHaveValue('oldest');
  await expect(page.locator('[data-library-item]:visible').first().locator('[data-library-key]')).toHaveAttribute('data-library-key', key!);
  await expect(page.locator('[data-library-item]:visible').first().locator('[data-action="_dashToggleArticle"]')).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => page.locator('.nqd-main').evaluate(el => el.scrollTop)).toBe(scroll);
  await page.keyboard.press('Escape');
  await page.evaluate(() => { (window as any).authUser = { id: 'outra-conta-local' }; });
  await opener.click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await expect(page.locator('#nqDashLibrarySearch')).toHaveValue('');
  await expect(page.locator('#nqDashLibraryFilter')).toHaveValue('all');
  await expect(page.locator('[data-library-item].is-expanded')).toHaveCount(0);
});


test('lista compacta mantém um estudo por linha e permite comparar vários estudos', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => { (window as any).isAdminUser = () => true; });
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  const cards = page.locator('[data-library-item]:visible');
  await expect(cards.first()).toBeVisible();
  const boxes = await cards.evaluateAll(elements => elements.slice(0, 3).map(el => {
    const r = el.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height };
  }));
  expect(boxes).toHaveLength(3);
  for (const [i, box] of boxes.entries()) {
    expect(box.height).toBeLessThan(220);
    expect(box.width).toBeGreaterThan(900);
    if (i) expect(box.y).toBeGreaterThanOrEqual(boxes[i-1].y + boxes[i-1].height - 1);
  }
  await cards.first().getByRole('button', {name:'Ler resumo',exact:true}).click();
  await expect(cards.first().getByRole('region')).toBeVisible();
  expect((await cards.first().boundingBox())!.height).toBeGreaterThan(boxes[0].height);
});

test('ações do estudo exibem link e copiam o título sem abrir o resumo', async ({ page }) => {
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => {
    (window as any).isAdminUser = () => true;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text: string) => { (window as any).__copiedTitle = text; }
    }});
  });
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  const card = page.locator('[data-library-item]:visible').first();
  const copy = card.locator('[data-action="_dashCopyTitle"]');
  await expect(copy).toHaveAccessibleName('Copiar título');
  const title = await copy.getAttribute('data-copy-title');
  const search = card.getByRole('link', { name: 'Buscar artigo' });
  await expect(search).toHaveAttribute('href', `https://scholar.google.com/scholar?q=${encodeURIComponent(title!)}`);
  await expect(search).toHaveAttribute('target', '_blank');
  await expect(search).toHaveAttribute('rel', 'noopener noreferrer');
  await copy.click();
  await expect(copy).toHaveText('Copiado');
  expect(await page.evaluate(() => (window as any).__copiedTitle)).toBe(title);
  await expect(card.locator('[data-action="_dashToggleArticle"]')).toHaveAttribute('aria-expanded', 'false');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('permission denied'); }; });
  await copy.click();
  await expect(copy).toHaveText('Tentar copiar');
  await page.getByRole('tab', { name: 'Fontes clínicas' }).click();
  const direct = page.locator('[data-library-item]:visible .nqd-library-actions a').filter({ hasText: 'Abrir artigo' }).first();
  await expect(direct).toBeVisible();
  const sourceUrl = await direct.getAttribute('href');
  expect(await page.evaluate(url => (0, eval)('Object.values(refsDB)').some((ref: any) => ref.url === url), sourceUrl)).toBe(true);
});
