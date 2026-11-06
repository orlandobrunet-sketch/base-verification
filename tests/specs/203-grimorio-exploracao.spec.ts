import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
test.beforeEach(async ({ context, baseURL, page }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async () => {
    await (window as any)._loadTopics({ refsOnly: true });
    await (window as any).carregarDadosGrimorio();
    const refs = (0, eval)('refsDB'), articles = (0, eval)('nefroArticles');
    const keys = [...new Set((window as any).questionBank.flatMap((q: any) => q.r || q.refs || []))].filter((k: any) => refs[k]).slice(0, 4);
    const rarities = new Map();
    articles.forEach((article: any, index: number) => { if (!rarities.has(article.raridade)) rarities.set(article.raridade, index); });
    localStorage.setItem('nq-unlocked-refs', JSON.stringify(keys));
    localStorage.setItem('unlockedArticles', JSON.stringify([...rarities.values()]));
    localStorage.setItem('nq-bib-favorites', JSON.stringify([keys[0], '__art_' + [...rarities.values()][0]]));
  });
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
});

test('favoritos suspendem tema oculto, conservam busca e restauram Todos sem gravar acervo', async ({ page }) => {
  const stored = () => page.evaluate(() => ['nq-unlocked-refs', 'unlockedArticles', 'nq-bib-favorites'].map(k => localStorage.getItem(k)));
  const before = await stored();
  await page.getByRole('tab', { name: 'Favoritos' }).click();
  const cards = page.locator('[data-library-entry]:visible');
  await expect(cards).toHaveCount(2);
  const titles = await cards.evaluateAll(els => els.map(el => el.getAttribute('data-library-title')));
  await page.getByRole('tab', { name: 'Todos' }).click();
  await page.locator('#nqDashLibraryFilter').selectOption('theme:UTI / Crítico');
  const filtered = await cards.evaluateAll(els => els.map(el => el.getAttribute('data-library-title')));
  await page.getByRole('tab', { name: 'Favoritos' }).click();
  await expect(cards).toHaveCount(2);
  expect(await cards.evaluateAll(els => els.map(el => el.getAttribute('data-library-title')))).toEqual(titles);
  await page.locator('#nqDashLibrarySearch').fill('zzzz-sem-resultado');
  await expect(cards).toHaveCount(0);
  await page.locator('#nqDashLibrarySearch').fill('');
  await expect(cards).toHaveCount(2);
  await page.getByRole('tab', { name: 'Todos' }).click();
  await expect(page.locator('#nqDashLibraryFilter')).toHaveValue('theme:UTI / Crítico');
  expect(await cards.evaluateAll(els => els.map(el => el.getAttribute('data-library-title')))).toEqual(filtered);
  expect(await stored()).toEqual(before);
});

test('raridade substitui tema e é restaurada após leitura e reabertura', async ({ page }) => {
  await page.locator('#nqDashLibraryFilter').selectOption('theme:UTI / Crítico');
  const epic = page.getByRole('button', { name: 'Épico', exact: true });
  await epic.click();
  await expect(epic).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#nqDashLibraryFilter')).toHaveValue('all');
  await expect(page.locator('[data-library-filter-summary]')).toContainText('Épico');
  const cards = page.locator('[data-library-entry]:visible');
  await expect(cards).toHaveCount(1);
  await expect(cards).toHaveAttribute('data-library-rarity', 'épico');
  await cards.getByRole('button', { name: 'Ler resumo', exact: true }).click();
  await expect(page.locator('.bib-resumo-modal [role="dialog"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Favoritos' }).click();
  await expect(cards).toHaveCount(2);
  await page.getByRole('tab', { name: 'Todos' }).click();
  await expect(epic).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await page.locator('[data-atrium-route="library"]').click();
  await expect(epic).toHaveAttribute('aria-pressed', 'true');
  await expect(cards).toHaveCount(1);
  await page.locator('#nqDashLibrarySort').selectOption('oldest');
  await page.locator('#nqDashLibrarySearch').fill('zzzz-sem-resultado');
  await page.getByRole('button', { name: 'Limpar filtro', exact: true }).click();
  await expect(page.locator('#nqDashLibrarySearch')).toHaveValue('zzzz-sem-resultado');
  await expect(page.locator('#nqDashLibrarySort')).toHaveValue('oldest');
  await expect(page.locator('#nqDashLibraryDiscovery')).toHaveValue('unlocked');
  await expect(epic).toHaveAttribute('aria-pressed', 'false');
  await expect(cards).toHaveCount(0);
});


test('controles refluem com texto ampliado, têm contraste e funcionam sem a ilustração', async ({ page }) => {
  await expect(page.locator('#nqdPane-library h1')).toHaveText('Grimório');
  await expect(page.locator('.nqd-grimoire-subtitle')).toHaveText('Biblioteca Clínica');
  const art = page.locator('.nqd-grimoire-art');
  await expect(art).toHaveAttribute('alt', '');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await expect(art).toHaveCSS('animation-name', 'none');
  const audit = await new AxeBuilder({ page }).include('.nqd-grimoire-header')
    .include('.nqd-library-search-panel').include('.nqd-library-explore')
    .withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(audit.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  for (const selector of ['.nqd-main', '.nqd-library-search-panel', '.nqd-library-explore']) {
    expect(await page.locator(selector).evaluate(el => el.scrollWidth <= el.clientWidth + 1), selector).toBe(true);
  }
  const rare = page.locator('[data-library-rarity-filter="raro"]');
  await rare.focus(); await page.keyboard.press('Space');
  await expect(rare).toHaveAttribute('aria-pressed', 'true');
  expect(await rare.evaluate(el => { const r = el.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })).toBe(true);
  await page.getByRole('button', { name: 'Limpar filtro', exact: true }).click();
  await expect(page.locator('#nqDashLibraryFilter')).toBeFocused();
  await page.keyboard.press('Escape');
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await page.route('**/assets/achievements/grimorio.webp', route => route.abort());
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await expect(art).toBeHidden();
  await page.locator('#nqDashLibraryFilter').selectOption('guideline');
  await expect(page.locator('[data-library-filter-summary]')).toHaveText('Fontes clínicas: Diretrizes');
});
