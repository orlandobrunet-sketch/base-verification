import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
test.beforeEach(async ({ context, baseURL, page }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async () => {
    await (window as any)._loadTopics();
    await (window as any).carregarDadosGrimorio();
  });
});

const openLibrary = async (page: Page) => {
  await page.evaluate(() => (window as any).openDashboard({ tab: 'library' }));
  await expect(page.locator('#nqdPane-library')).toBeVisible();
  await page.locator('[data-library-filter-toggle][aria-expanded="false"]').click();
};
const visibleEntries = (page: Page) => page.locator('[data-library-entry]:visible');
const ledger = (page: Page) => page.evaluate(() => Object.fromEntries(
  ['nq-unlocked-refs', 'unlockedArticles', 'nq-bib-favorites', 'nefroquest-achievements', 'nefroquest-badge-history']
    .map(key => [key, localStorage.getItem(key)])));

test('novo jogador vê todo o catálogo, filtra bloqueios e não acessa resumos bloqueados', async ({ page }) => {
  const data = await page.evaluate(() => {
    const refs = (0, eval)('refsDB'), articles = (0, eval)('nefroArticles');
    const key = Object.keys(refs)[0], index = articles.findIndex((a: any) => a.raridade === 'lendário');
    return { total: Object.keys(refs).length + articles.length, key, index,
      hiddenTexts: [refs[key].resumo, refs[key].conclusao, articles[index].resumo, articles[index].impacto] };
  });
  const before = await ledger(page);
  await openLibrary(page);
  await expect(visibleEntries(page)).toHaveCount(data.total);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  for (const selector of ['#nqDashLibraryDiscovery', '#nqDashLibrarySort', '#nqDashLibraryFilter']) {
    expect(await page.locator(selector).evaluate(e => e.scrollWidth <= e.clientWidth + 1), selector).toBe(true);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '16px'; });
  await expect(page.locator('.nqd-library-summary')).toHaveText(`Referências descobertas até o momento: 0/${data.total}`);
  await expect(page.locator('[data-action="_dashToggleArticle"]')).toHaveCount(0);
  const html = await page.locator('#nqdPane-library').innerHTML();
  for (const text of data.hiddenTexts) { expect(text).toBeTruthy(); expect(html).not.toContain(text); }
  await page.evaluate(({ key, index }) => {
    (window as any)._dashToggleArticle({ dataset: { libraryReadKey: '__art_' + index } });
    (window as any)._dashToggleFavorite({ dataset: { libraryKey: '__art_' + index } });
    (window as any).openRefResumo(key);
    (window as any).openRefResumo({ dataset: { arg: key } });
  }, data);
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  await page.locator('#nqDashLibraryDiscovery').selectOption('unlocked');
  await expect(visibleEntries(page)).toHaveCount(0);
  await expect(page.locator('#nqDashLibraryNoResults')).toBeVisible();
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(visibleEntries(page)).toHaveCount(data.total);
  await page.locator('#nqDashLibrarySearch').fill(data.hiddenTexts[0]);
  await expect(visibleEntries(page)).toHaveCount(0);
  expect(await ledger(page)).toEqual(before);
});

test('descobertas legadas, lendário e conquistas sobrevivem aos filtros, leitor e favoritos', async ({ page }) => {
  const total = await page.evaluate(() => {
    const refs = (0, eval)('refsDB'), articles = (0, eval)('nefroArticles');
    const index = articles.findIndex((a: any) => a.raridade === 'lendário');
    localStorage.setItem('nq-unlocked-refs', JSON.stringify(Object.keys(refs).slice(0, 2)));
    localStorage.setItem('unlockedArticles', JSON.stringify([index]));
    localStorage.setItem('nq-bib-favorites', JSON.stringify(['__art_' + index]));
    localStorage.setItem('nefroquest-achievements', JSON.stringify(['grimoire_master']));
    localStorage.setItem('nefroquest-badge-history', JSON.stringify({ 1: { jornada: 2 } }));
    return Object.keys(refs).length + articles.length;
  });
  const before = await ledger(page);
  await openLibrary(page);
  await expect(visibleEntries(page)).toHaveCount(total);
  await page.locator('#nqDashLibraryDiscovery').selectOption('unlocked');
  await expect(visibleEntries(page)).toHaveCount(3);
  await page.locator('[data-library-rarity-filter="lendário"]').click();
  await expect(visibleEntries(page)).toHaveCount(1);
  await visibleEntries(page).getByRole('button', { name: 'Ler resumo', exact: true }).click();
  await expect(page.locator('.bib-resumo-modal .nqreader-rarity')).toHaveText('Lendário');
  await page.keyboard.press('Escape');
  await expect(page.locator('#nqDashLibraryDiscovery')).toHaveValue('unlocked');
  await visibleEntries(page).locator('.nqd-favorite').click();
  await expect(visibleEntries(page)).toHaveCount(1);
  await expect(page.locator('#nqDashLibraryTab-all')).toHaveAttribute('aria-selected', 'true');
  await visibleEntries(page).locator('.nqd-favorite').click();
  await page.getByRole('tab', { name: 'Favoritos' }).click();
  await expect(visibleEntries(page)).toHaveCount(1);
  await page.getByRole('tab', { name: 'Todos', exact: false }).click();
  await expect(page.locator('#nqDashLibraryDiscovery')).toHaveValue('unlocked');
  await page.locator('[data-library-rarity-filter="lendário"]').click();
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(visibleEntries(page)).toHaveCount(total - 3);
  await page.keyboard.press('Escape'); await openLibrary(page);
  await expect(page.locator('#nqDashLibraryDiscovery')).toHaveValue('locked');
  expect(await ledger(page)).toEqual(before);
});

test('acerto libera fontes citadas, nunca artigos lendários; baú concede lendário e mantém histórico', async ({ page }) => {
  await injectGameState(page, { gold: 5000, correctTotal: 3, chestsOpened: 0, streak: 0, character: 'nephros' });
  await page.evaluate(() => (window as any).carregarDadosGrimorio());
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
  const question = await page.evaluate(() => {
    const s = (window as any).state;
    return { refs: s.current.r, answer: s.current.a };
  });
  expect(question.refs.length).toBeGreaterThan(0);
  const articlesBefore = await page.evaluate(() => localStorage.getItem('unlockedArticles'));
  await page.locator('#options .option').nth(question.answer).click();
  const refsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('nq-unlocked-refs') || '[]'));
  for (const key of question.refs) expect(refsAfter).toContain(key);
  expect(await page.evaluate(() => localStorage.getItem('unlockedArticles'))).toBe(articlesBefore);
  await page.evaluate(() => document.querySelector('#goldMilestonePopup')?.remove());
  const legend = await page.evaluate(() => {
    const articles = (0, eval)('nefroArticles');
    const index = articles.findIndex((a: any) => a.raridade === 'lendário');
    const random = Math.random; let call = 0;
    // First draw selects article reward; second chooses the real legendary entry.
    Math.random = () => call++ === 0 ? 0 : (index + .5) / articles.length;
    try { (window as any).claimChestReward(); } finally { Math.random = random; }
    return { index, title: articles[index].titulo };
  });
  await expect(page.locator('#chestModal')).toHaveClass(/show/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('unlockedArticles') || '[]'))).toEqual([legend.index]);
  for (const key of question.refs) expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-unlocked-refs') || '[]'))).toContain(key);
  await page.locator('#chestModal').getByRole('button', { name: 'Continuar', exact: true }).click();
  await openLibrary(page);
  await page.locator('#nqDashLibraryDiscovery').selectOption('unlocked');
  await page.locator('[data-library-rarity-filter="lendário"]').click();
  await expect(visibleEntries(page)).toHaveCount(1);
  await expect(visibleEntries(page)).toContainText(legend.title);
});

test('baú pago pode conceder lendário, preserva artigo anterior e cobra o custo real', async ({ page }) => {
  const previous = await page.evaluate(() => {
    const index = (0, eval)('nefroArticles').findIndex((a: any) => a.raridade !== 'lendário');
    localStorage.setItem('unlockedArticles', JSON.stringify([index]));
    return index;
  });
  await injectGameState(page, { gold: 5000, correctTotal: 3, chestsOpened: 0 });
  await page.evaluate(() => (window as any).carregarDadosGrimorio());
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
  const result = await page.evaluate(previous => {
    const articles = (0, eval)('nefroArticles');
    const available = articles.map((_: any, i: number) => i).filter((i: number) => i !== previous);
    const legendary = available.find((i: number) => articles[i].raridade === 'lendário');
    const random = Math.random, gold = (window as any).state.gold;
    Math.random = () => (available.indexOf(legendary) + .5) / available.length;
    try { (window as any)._mobileActionCallbacks.chest(); } finally { Math.random = random; }
    return { legendary, gold };
  }, previous);
  await expect(page.locator('#chestModal')).toHaveClass(/show/);
  const after = await page.evaluate(() => ({ articles: JSON.parse(localStorage.getItem('unlockedArticles') || '[]'), gold: (window as any).state.gold, chests: (window as any).state.chestsOpened }));
  expect(after.articles).toEqual([previous, result.legendary]);
  expect(after.gold).toBe(result.gold - 100);
  expect(after.chests).toBe(1);
});

test('prévia administrativa lê sem transformar acesso em descoberta pessoal', async ({ page }) => {
  const total = await page.evaluate(() => {
    const refs = (0, eval)('refsDB'), articles = (0, eval)('nefroArticles');
    localStorage.setItem('nq-unlocked-refs', JSON.stringify(Object.keys(refs).slice(0, 1)));
    localStorage.setItem('unlockedArticles', '[0]');
    (window as any).isAdminUser = () => true;
    return Object.keys(refs).length + articles.length;
  });
  const before = await ledger(page);
  await openLibrary(page);
  await expect(page.locator('.nqd-library-summary')).toHaveText(`Referências descobertas até o momento: 2/${total}`);
  await expect(page.locator('[data-library-item]:visible')).toHaveCount(total);
  await page.locator('#nqDashLibraryDiscovery').selectOption('unlocked');
  await expect(visibleEntries(page)).toHaveCount(2);
  await expect(page.locator('[data-library-discovered="false"]:visible')).toHaveCount(0);
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(visibleEntries(page)).toHaveCount(total - 2);
  await expect(page.locator('[data-library-discovered="true"]:visible')).toHaveCount(0);
  await visibleEntries(page).first().getByRole('button', { name: 'Ler resumo', exact: true }).click();
  await expect(page.locator('.bib-resumo-modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#nqDashLibraryDiscovery')).toHaveValue('locked');
  expect(await ledger(page)).toEqual(before);
});
