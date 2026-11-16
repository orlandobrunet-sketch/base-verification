import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';
import { injectGameState } from '../helpers/game';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { resolve } from 'node:path';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const source = createContext({});
runInContext(readFileSync(resolve(__dirname, '../../data/refs.js'), 'utf8') + ';globalThis.refs = refsDB;', source);
runInContext(readFileSync(resolve(__dirname, '../../data/articles.js'), 'utf8') + ';globalThis.articles = nefroArticles;', source);
runInContext(readFileSync(resolve(__dirname, '../../data/question-revision-history.js'), 'utf8'), source);
const references = JSON.parse(JSON.stringify((source as any).refs));
const articles = JSON.parse(JSON.stringify((source as any).articles));
const retiredCmvSnapshot = JSON.parse(JSON.stringify((source as any).NQQuestionRevisionHistory
  .find((entry: any) => entry.qid === '2c86b3a0' && entry.release === '17.27').references.cmv_kdigo_tx));
const errors = new WeakMap<Page, string[]>();
const ledger = (page: Page) => page.evaluate(() => ['nq-unlocked-refs', 'unlockedArticles', 'nq-bib-favorites']
  .map(key => localStorage.getItem(key)));

test.beforeEach(async ({ page, context, baseURL }) => {
  const failures: string[] = []; errors.set(page, failures);
  page.on('pageerror', error => failures.push(error.message));
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => {
    const request = route.request();
    return new URL(request.url()).origin === origin && ['GET', 'HEAD'].includes(request.method()) ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await routeTechnicalQuestionBank(page, [{ qid: 'catalogue-306-technical', cat: 'geral', diff: 'medium',
    q: 'Marcador técnico de navegação.', opts: ['Marcador A', 'Marcador B', 'Marcador C', 'Marcador D'],
    ans: 0, exp: 'Conteúdo técnico de teste.', refs: ['dapa'] }], references);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async () => {
    await (window as any)._loadTopics({ refsOnly: true });
    await (window as any).carregarDadosGrimorio();
    (window as any).isAdminUser = () => false;
  });
});

test.afterEach(async ({ page }, info) => {
  await info.attach('catalogue-page-errors', { body: JSON.stringify(errors.get(page)), contentType: 'application/json' });
  expect(errors.get(page)).toEqual([]);
});

async function seed(page: Page, refs: string[], unlocked: number[], favorites: string[]) {
  await page.evaluate(({ refs, unlocked, favorites }) => {
    localStorage.setItem('nq-unlocked-refs', JSON.stringify(refs));
    localStorage.setItem('unlockedArticles', JSON.stringify(unlocked));
    localStorage.setItem('nq-bib-favorites', JSON.stringify(favorites));
  }, { refs, unlocked, favorites });
}
async function library(page: Page) {
  await page.evaluate(() => (window as any).openDashboard({ tab: 'library' }));
  await expect(page.locator('#nqdPane-library')).toBeVisible();
}

test('legacy scroll alias is one content, preserves its favorite, and never grants the source variant', async ({ page }) => {
  await seed(page, [], [22], ['__art_22', 'unrelated-legacy-key']);
  await library(page);
  const before = await ledger(page), work = page.locator('[data-library-work="work:dapa_ckd"]');
  await expect(work).toHaveCount(1);
  await expect(work.locator('[data-library-entry]')).toHaveCount(2);
  const scroll = work.locator('[data-library-read-key="__art_14"]');
  await expect(scroll).toBeEnabled();
  await page.evaluate(() => (window as any)._dashToggleArticle({ dataset: { libraryReadKey: 'dapa' } }));
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  await scroll.click();
  await expect(page.locator('.bib-resumo-modal')).toContainText(articles[22].resumo);
  await page.keyboard.press('Escape');
  const favorite = work.locator('[data-library-key="__art_14"]');
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await favorite.click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites')!))).toEqual(['unrelated-legacy-key']);
  expect((await ledger(page)).slice(0, 2)).toEqual(before.slice(0, 2));
  await page.locator('#nqDashLibrarySearch').fill('DAPA-CKD Trial');
  await expect(work).toBeVisible();
  await page.locator('[data-library-filter-toggle]').click();
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(work.locator('[data-library-entry]:visible')).toHaveCount(1);
  await expect(work.locator('.nqd-library-work-heading')).toContainText('1 de 2 conteúdos nesta seleção');
  await expect(work.locator('[data-library-entry]:visible')).toContainText('Fonte clínica');
  await page.evaluate(() => (window as any)._dashToggleArticle({ dataset: { libraryReadKey: 'dapa' } }));
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
});

test('source and scroll keep separate readers, locks and favorites on desktop and mobile', async ({ page }, info) => {
  await seed(page, ['dapa'], [], ['dapa']);
  await library(page);
  const before = await ledger(page), work = page.locator('[data-library-work="work:dapa_ckd"]');
  await info.attach('publication-with-separate-variants', { body: await work.screenshot(), contentType: 'image/png' });
  await work.locator('[data-library-read-key="dapa"]').click();
  await expect(page.locator('.bib-resumo-modal')).toContainText(references.dapa.resumo);
  await page.keyboard.press('Escape');
  await page.evaluate(() => (window as any)._dashToggleArticle({ dataset: { libraryReadKey: '__art_22' } }));
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Favoritos', exact: false }).click();
  await expect(work.locator('[data-library-entry]:visible')).toHaveCount(1);
  await expect(work.locator('[data-library-entry]:visible')).toContainText(references.dapa.label);
  expect(await ledger(page)).toEqual(before);
  const overflow = await work.evaluate(node => node.getBoundingClientRect().right > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test('filter and ordering describe the visible variant while preserving online and print dates', async ({ page }) => {
  await seed(page, ['bproad'], [31], []);
  await library(page);
  const before = await ledger(page), work = page.locator('[data-library-work="work:bproad"]');
  await expect(work.locator('[data-library-entry]:visible')).toHaveCount(2);
  await page.locator('#nqDashLibrarySort').selectOption('oldest');
  await expect(work).toHaveAttribute('data-library-year', '2024');
  await page.locator('[data-library-filter-toggle]').click();
  const rarity = page.locator('[data-library-rarity-filter="' + articles[31].raridade + '"]');
  await rarity.click();
  await page.locator('#nqDashLibrarySort').selectOption('recent');
  await expect(work.locator('[data-library-entry]:visible')).toHaveCount(1);
  await expect(work.locator('.nqd-library-work-heading')).toContainText('1 de 2 conteúdos nesta seleção');
  await expect(work).toHaveAttribute('data-library-year', '2024');
  await rarity.click();
  await expect(work.locator('[data-library-entry]:visible')).toHaveCount(2);
  await expect(work).toHaveAttribute('data-library-year', '2025');
  expect(await ledger(page)).toEqual(before);
});

test('legacy library groups the publication and resolves an old favorite without unlocking the different body', async ({ page }) => {
  await seed(page, [], [22], ['__art_22', 'unrelated-legacy-key']);
  const before = await ledger(page);
  await page.evaluate(() => { (window as any).openDashboard = undefined; (window as any).openBibliotecaModal(); });
  const work = page.locator('[data-bib-work="work:dapa_ckd"]');
  await expect(work).toHaveCount(1);
  await expect(work).toContainText('Fonte clínica bloqueada');
  await expect(work.locator('[data-action="openBibResumo"]')).toHaveCount(1);
  await work.locator('[data-action="openBibResumo"]').click();
  await expect(page.locator('.bib-resumo-modal')).toContainText(articles[22].resumo);
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const index = (0, eval)('_bibVisibleItems.findIndex(item => item._bibKey === "dapa")');
    (window as any).openBibResumo({ dataset: { itemIdx: String(index) } });
  });
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  await expect(work.locator('.bib-fav-btn')).toHaveClass(/active/);
  await work.locator('.bib-fav-btn').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites')!))).toEqual(['unrelated-legacy-key']);
  expect((await ledger(page)).slice(0, 2)).toEqual(before.slice(0, 2));
});

test('all three real chest paths award the remaining unique scroll and retain the legacy index without extra credit', async ({ page }) => {
  await injectGameState(page, { gold: 1000, score: 1000, correctTotal: 15, chestsOpened: 2 }, { asGuest: true });
  await page.evaluate(() => (window as any).carregarDadosGrimorio());
  for (const method of ['_openChestDirect', 'openChest', 'claimChestReward']) {
    const result = await page.evaluate(method => {
      const w = window as any;
      const unlocked = (0, eval)('nefroArticles.map((_, index) => index).filter(index => ![14, 15, 22, 23].includes(index))');
      unlocked.push(22);
      (0, eval)('unlockedArticles = ' + JSON.stringify(unlocked) + '; chestCost = 100;');
      localStorage.setItem('unlockedArticles', JSON.stringify(unlocked));
      localStorage.setItem('nq-unlocked-refs', '["dapa"]');
      w.state.gold = 1000; w.state.score = 1000; w.state.chestsOpened = 2; w.state.gameOver = false;
      const random = Math.random;
      try { Math.random = () => 0; (0, eval)(method + '()'); } finally { Math.random = random; }
      return { unlocked: (0, eval)('unlockedArticles.slice()'), gold: w.state.gold, score: w.state.score,
        chests: w.state.chestsOpened, remaining: w.NQLibraryCatalog.availableArticleIndices((0, eval)('nefroArticles'), (0, eval)('unlockedArticles')),
        achievement: w.getGrimoireAchievementProgress() };
    }, method);
    expect(result.unlocked.at(-1)).toBe(15);
    expect(result.unlocked.filter((index: number) => index === 22)).toHaveLength(1);
    expect(result.unlocked.includes(14) || result.unlocked.includes(23)).toBe(false);
    expect(result.remaining).toEqual([]);
    expect(result.gold).toBe(method === 'claimChestReward' ? 1000 : 900);
    expect(result.score).toBe(1060);
    expect(result.chests).toBe(3);
    expect(result.achievement.complete).toBe(true);
    await expect(page.locator('#chestModal')).toHaveClass(/show/);
    await page.locator('#chestModal').getByRole('button', { name: 'Continuar', exact: true }).click();
  }
});

test('repaired MDRD work retains three independent scroll bodies and historical favorites', async ({ page }, info) => {
  await seed(page, [], [7], ['__art_122', '__art_132']);
  await library(page);
  const before = await ledger(page), work = page.locator('[data-library-work="work:mdrd_intervention_1994"]');
  await expect(work.locator('[data-library-entry]')).toHaveCount(3);
  await info.attach('mdrd-with-independent-scrolls', { body: await work.screenshot(), contentType: 'image/png' });
  await work.locator('[data-library-read-key="__art_7"]').click();
  await expect(page.locator('.bib-resumo-modal')).toContainText(articles[7].resumo);
  await page.keyboard.press('Escape');
  for (const index of [122, 132]) {
    await expect(work.locator('[data-library-read-key="__art_' + index + '"]')).toBeDisabled();
    await page.evaluate(index => (window as any)._dashToggleArticle({ dataset: { libraryReadKey: '__art_' + index } }), index);
    await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
    await expect(work.locator('[data-library-key="__art_' + index + '"]')).toHaveAttribute('aria-pressed', 'true');
  }
  await page.locator('[data-library-filter-toggle]').click();
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(work.locator('[data-library-entry]:visible')).toHaveCount(2);
  await expect(work.locator('.nqd-library-work-heading')).toContainText('2 de 3 conteúdos nesta seleção');
  expect(await ledger(page)).toEqual(before);
  expect(await work.evaluate(node => node.getBoundingClientRect().right > window.innerWidth + 1)).toBe(false);
  await page.getByRole('tab', { name: 'Favoritos', exact: false }).click();
  await expect(work.locator('[data-library-entry]:visible')).toHaveCount(2);
  await work.locator('[data-library-key="__art_122"]').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites')!))).toEqual(['__art_132']);
  await page.evaluate(() => (window as any)._dashToggleFavorite({ dataset: { libraryKey: '__art_122' } }));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites')!))).toEqual(['__art_132']);
  expect((await ledger(page)).slice(0, 2)).toEqual(before.slice(0, 2));
});

test('repaired Captopril and FIDELIO metadata preserve independent source and scroll access', async ({ page }) => {
  await seed(page, ['fidelio_dkd'], [6], ['lewis_ieca_dn_1993', '__art_23']);
  await library(page);
  const before = await ledger(page), captopril = page.locator('[data-library-work="work:captopril_diabetic_nephropathy_1993"]');
  await expect(captopril.locator('[data-library-entry]')).toHaveCount(2);
  await expect(captopril.locator('[data-library-read-key="lewis_ieca_dn_1993"]')).toBeDisabled();
  await captopril.locator('[data-library-read-key="__art_6"]').click();
  await expect(page.locator('.bib-resumo-modal')).toContainText(articles[6].resumo);
  await page.keyboard.press('Escape');
  const fidelio = page.locator('[data-library-work="work:fidelio_dkd"]');
  await expect(fidelio.locator('[data-library-entry]')).toHaveCount(2);
  await fidelio.locator('[data-library-read-key="fidelio_dkd"]').click();
  await expect(page.locator('.bib-resumo-modal')).toContainText(references.fidelio_dkd.resumo);
  await page.keyboard.press('Escape');
  await expect(fidelio.locator('[data-library-read-key="__art_15"]')).toBeDisabled();
  await expect(fidelio.locator('[data-library-key="__art_15"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await ledger(page)).toEqual(before);
  await page.evaluate(() => { (window as any).closeDashboard(); (window as any).openDashboard = undefined; (window as any).openBibliotecaModal(); });
  await page.evaluate(() => (window as any)._setBibFilter('favorites'));
  const legacy = page.locator('[data-bib-work="work:captopril_diabetic_nephropathy_1993"]');
  await expect(legacy).toContainText(references.lewis_ieca_dn_1993.label);
  await expect(legacy.locator('.bib-resumo-btn')).toBeDisabled();
  await page.evaluate(() => {
    const index = (0, eval)('_bibVisibleItems.findIndex(item => item._bibKey === "lewis_ieca_dn_1993")');
    (window as any).openBibResumo({ dataset: { itemIdx: String(index) } });
  });
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  expect(await ledger(page)).toEqual(before);
  await legacy.locator('.bib-fav-btn').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites')!))).toEqual(['__art_23']);
  expect((await ledger(page)).slice(0, 2)).toEqual(before.slice(0, 2));
});

test('retired CMV historical discovery and favorite never unlock TTS and stay separate from active works', async ({ page }, info) => {
  await seed(page, ['cmv_kdigo_tx'], [], ['cmv_kdigo_tx']);
  await library(page);
  const before = await ledger(page), allCount = await page.locator('#nqDashLibraryTab-all [data-library-count]').textContent();
  const notice = page.locator('[data-library-entry][data-library-retired="true"]');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('Referência retirada');
  await expect(notice).toContainText('Sua descoberta anterior continua registrada');
  await expect(notice.locator('[data-library-read-key]')).toBeDisabled();
  await page.evaluate(() => {
    for (const key of ['cmv_kdigo_tx', 'cmv_consensus_tts_2025']) (window as any)._dashToggleArticle({ dataset: { libraryReadKey: key } });
    (window as any).openRefResumo('cmv_kdigo_tx');
  });
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  expect(await ledger(page)).toEqual(before);
  await page.locator('#nqDashLibrarySearch').fill('CMV');
  await expect(notice).toBeVisible();
  await expect(page.locator('#nqDashLibraryCollectionCount')).toContainText('1 registro histórico');
  await page.locator('[data-library-filter-toggle]').click();
  await page.locator('#nqDashLibraryDiscovery').selectOption('unlocked');
  await expect(notice).toBeVisible();
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(notice).toBeHidden();
  await page.getByRole('tab', { name: 'Favoritos', exact: false }).click();
  await expect(notice).toBeVisible();
  await expect(page.locator('#nqDashLibraryCollectionCount')).toContainText('0 obras favoritas');
  await info.attach('retired-cmv-historical-favorite', { body: await notice.screenshot(), contentType: 'image/png' });
  await notice.locator('[data-action="_dashToggleFavorite"]').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites')!))).toEqual([]);
  await page.evaluate(() => (window as any)._dashToggleFavorite({ dataset: { libraryKey: 'cmv_kdigo_tx' } }));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites')!))).toEqual([]);
  expect((await ledger(page)).slice(0, 2)).toEqual(before.slice(0, 2));
  await page.getByRole('tab', { name: 'Todos', exact: false }).click();
  await expect(page.locator('#nqDashLibraryTab-all [data-library-count]')).toHaveText(allCount!);
  await page.evaluate(() => {
    (window as any).closeDashboard(); (window as any).isAdminUser = () => true;
    (window as any).openDashboard({ tab: 'library' });
  });
  await expect(page.locator('[data-library-entry][data-library-retired="true"] [data-library-read-key]')).toBeDisabled();
  await page.evaluate(() => { (window as any)._dashToggleArticle({ dataset: { libraryReadKey: 'cmv_kdigo_tx' } }); (window as any).openRefResumo('cmv_kdigo_tx'); });
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  expect((await ledger(page)).slice(0, 2)).toEqual(before.slice(0, 2));
});

test('retired CMV saved-question snapshot and legacy catalog block the invalid reader for guest and admin', async ({ page }, info) => {
  await seed(page, ['cmv_kdigo_tx'], [], ['cmv_kdigo_tx']);
  const before = await ledger(page);
  await injectGameState(page, { gold: 0 }, { asGuest: true });
  await page.evaluate(() => (window as any).carregarDadosGrimorio());
  await page.locator('#options .option').first().click();
  await expect(page.locator('#nextBtn')).toBeVisible();
  await seed(page, ['cmv_kdigo_tx'], [], ['cmv_kdigo_tx']);
  for (const admin of [false, true]) {
    await page.evaluate(({ admin, snapshot }) => {
      (window as any).isAdminUser = () => admin;
      (window as any).renderRefs(['cmv_kdigo_tx'], { cmv_kdigo_tx: snapshot });
      (window as any).openRefResumo('cmv_kdigo_tx');
    }, { admin, snapshot: retiredCmvSnapshot });
    const retired = page.locator('[data-ref-retired="true"]');
    await expect(retired).toBeVisible();
    await expect(retired).toContainText('Referência retirada');
    await expect(retired.locator('.ref-resumo-btn')).toBeDisabled();
    await expect(retired.locator('a, [data-action="_copyRefBtn"]')).toHaveCount(0);
    await expect(retired).not.toContainText(retiredCmvSnapshot.resumo);
    await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
    expect(await retired.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThan(60);
  }
  await info.attach('retired-source-in-saved-question', { body: await page.locator('[data-ref-retired="true"]').screenshot(), contentType: 'image/png' });
  await page.evaluate(() => { (window as any).isAdminUser = () => false; (window as any).openDashboard = undefined; (window as any).openBibliotecaModal(); });
  await page.evaluate(() => (window as any)._setBibFilter('favorites'));
  await page.locator('#bibSearch').fill('CMV');
  const historical = page.locator('[data-bib-work="content:cmv_kdigo_tx"]');
  await expect(historical).toBeVisible();
  await expect(historical).toContainText('HISTÓRICO');
  await expect(historical.locator('.bib-resumo-btn')).toBeDisabled();
  await page.evaluate(() => {
    const index = (0, eval)('_bibVisibleItems.findIndex(item => item._bibKey === "cmv_kdigo_tx")');
    (window as any).openBibResumo({ dataset: { itemIdx: String(index) } });
  });
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  expect(await ledger(page)).toEqual(before);
  await historical.locator('.bib-fav-btn').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites')!))).toEqual([]);
  await page.evaluate(() => (window as any)._toggleBibFav('cmv_kdigo_tx'));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites')!))).toEqual([]);
  expect((await ledger(page)).slice(0, 2)).toEqual(before.slice(0, 2));
});

test('missing mandatory catalog blocks cached readers and chest claims, then recovers without losing the pending reward', async ({ page }, info) => {
  await injectGameState(page, { gold: 0 }, { asGuest: true });
  await page.evaluate(() => (window as any).carregarDadosGrimorio());
  await page.locator('#options .option').first().click();
  await expect(page.locator('#nextBtn')).toBeVisible();
  await seed(page, ['cmv_kdigo_tx', 'dapa'], [22], ['cmv_kdigo_tx', 'dapa']);
  await library(page);
  await expect(page.locator('[data-library-entry]').first()).toBeVisible();
  await page.route('**/js/library-catalog.js*', route => route.abort());
  await page.evaluate(() => {
    const w = window as any; w.closeDashboard(); w.__catalog306 = w.NQLibraryCatalog;
    w.NQLibraryCatalog = undefined; w.state.gold = 1000; w.state.correctTotal = 15; w.state.chestsOpened = 2;
    (0, eval)('_queueChestReward(_captureChestRewardBinding(), performance.now())');
  });
  const before = await ledger(page);
  const resources = () => page.evaluate(() => ({ gold: (window as any).state.gold,
    score: (window as any).state.score, chests: (window as any).state.chestsOpened }));
  const oldResources = await resources();
  await page.evaluate(() => (window as any).openDashboard({ tab: 'library' }));
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'error');
  await expect(page.locator('#nqDashboard')).toContainText('Não foi possível carregar o Grimório');
  await expect(page.locator('#nqDashboard [data-action="closeDashboard"]').first()).toBeEnabled();
  await expect(page.locator('[data-library-entry]')).toHaveCount(0);
  await page.evaluate(() => {
    const w = window as any;
    w._dashToggleArticle({ dataset: { libraryReadKey: 'dapa' } });
    w._dashToggleArticle({ dataset: { libraryReadKey: 'cmv_kdigo_tx' } });
    w.openRefResumo('cmv_kdigo_tx'); w.openRefResumo('dapa');
    w._dashToggleFavorite({ dataset: { libraryKey: 'dapa' } });
  });
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).getGrimoireAchievementProgress())).toMatchObject({ value: 0, target: 0, complete: false });
  await page.evaluate(snapshot => {
    const w = window as any; w.closeDashboard(); w.renderRefs(['cmv_kdigo_tx'], { cmv_kdigo_tx: snapshot });
  }, retiredCmvSnapshot);
  await expect(page.locator('#refs')).toContainText('Fontes indisponíveis neste momento');
  await expect(page.locator('#refs a, #refs [data-action]')).toHaveCount(0);
  await expect(page.locator('#options')).toBeVisible();
  await expect(page.locator('#nextBtn')).toBeEnabled();
  await page.locator('#refs').evaluate(node => node.scrollIntoView({ block: 'center' }));
  await info.attach('mandatory-catalog-unavailable', { body: await page.locator('#refs').screenshot(), contentType: 'image/png' });
  await page.evaluate(() => {
    const w = window as any; w.__dashboard306 = w.openDashboard; w.openDashboard = undefined; w.openBibliotecaModal();
  });
  await expect(page.locator('#bibList')).toContainText('O acervo não pôde ser carregado');
  await expect(page.locator('#bibList .bib-resumo-btn')).toHaveCount(0);
  await page.evaluate(() => {
    const w = window as any;
    w.openChest(); (0, eval)('_openChestDirect()'); w.claimChestReward(); w.triggerChestRewardPopup();
  });
  await expect(page.locator('#autoChestPopup')).toHaveCount(0);
  expect(await resources()).toEqual(oldResources);
  expect(await ledger(page)).toEqual(before);
  await page.unroute('**/js/library-catalog.js*');
  await page.locator('#bibList [data-action="_bibTentarNovamente"]').click();
  await expect(page.locator('#bibList .bib-work').first()).toBeVisible();
  await page.evaluate(() => {
    const w = window as any; w.closeBibliotecaModal(); w.openDashboard = w.__dashboard306;
    document.querySelector<HTMLElement>('#nextBtn')!.focus(); window.dispatchEvent(new Event('pageshow'));
  });
  await expect(page.locator('#autoChestPopup')).toBeVisible();
  await page.route('**/js/library-catalog.js*', route => route.abort());
  await page.evaluate(() => { (window as any).NQLibraryCatalog = undefined; });
  await page.locator('#autoChestPopup .nqch-trigger').click();
  await expect(page.locator('#autoChestPopup')).toHaveCount(0);
  expect(await resources()).toEqual(oldResources);
  expect(await ledger(page)).toEqual(before);
  await page.unroute('**/js/library-catalog.js*');
  await page.evaluate(async () => {
    await (window as any).carregarDadosGrimorio();
    document.querySelector<HTMLElement>('#nextBtn')!.focus(); window.dispatchEvent(new Event('pageshow'));
  });
  await expect(page.locator('#autoChestPopup')).toBeVisible();
  await page.route('**/js/library-catalog.js*', route => route.abort());
  await page.evaluate(() => {
    const w = window as any; w._animateAndClaimChest(document.querySelector('#autoChestPopup .nqch-trigger'));
    w.NQLibraryCatalog = undefined;
  });
  await expect(page.locator('#autoChestPopup')).toHaveCount(0);
  expect(await resources()).toEqual(oldResources);
  expect(await ledger(page)).toEqual(before);
  await page.unroute('**/js/library-catalog.js*');
  await page.evaluate(async () => {
    const w = window as any; await w.carregarDadosGrimorio();
    document.querySelector<HTMLElement>('#nextBtn')!.focus(); window.dispatchEvent(new Event('pageshow'));
    w.__random306 = Math.random; Math.random = () => 0;
  });
  await expect(page.locator('#autoChestPopup')).toBeVisible();
  await page.locator('#autoChestPopup .nqch-trigger').click();
  await expect(page.locator('#autoChestPopup')).toHaveCount(0);
  await expect(page.locator('#chestModal')).toHaveClass(/show/);
  await page.evaluate(() => { Math.random = (window as any).__random306; });
  expect((await resources()).chests).toBe(oldResources.chests + 1);
  await page.locator('#chestModal').getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.locator('#nextBtn').click();
  await expect(page.locator('#options .option')).toHaveCount(4);
  await expect(page.locator('#options .option').first()).toBeEnabled();
});

test('current answer retains its published discovery while the library module is missing', async ({ page }) => {
  await injectGameState(page, { gold: 0 }, { asGuest: true });
  await seed(page, [], [], ['cmv_kdigo_tx']);
  await page.route('**/js/library-catalog.js*', route => route.abort());
  await page.evaluate(() => { (window as any).NQLibraryCatalog = undefined; });
  const correctIndex = await page.evaluate(() => (window as any).state.current.a);
  await page.locator('#options .option').nth(correctIndex).click();
  await expect(page.locator('#nextBtn')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-unlocked-refs')!))).toEqual(['dapa']);
  await page.evaluate(() => {
    (0, eval)('_unlockRefsFromQuestion(["forged", "cmv_kdigo_tx"], state.current.id)');
    (window as any).openRefResumo('dapa'); (window as any).openRefResumo('cmv_kdigo_tx');
  });
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-unlocked-refs')!))).toEqual(['dapa']);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites')!))).toEqual(['cmv_kdigo_tx']);
  await page.locator('#nextBtn').click();
  await expect(page.locator('#options .option')).toHaveCount(4);
  await expect(page.locator('#options .option').first()).toBeEnabled();
  await expect(page.locator('#refs')).toContainText('Fontes indisponíveis neste momento');
});
