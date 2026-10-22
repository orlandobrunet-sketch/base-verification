import {test, expect, type Page} from '@playwright/test';
import {saveBase} from '../helpers/fixtures';

test.use({serviceWorkers: 'block', reducedMotion: 'reduce'});
test.beforeEach(async ({context}) => {
  await context.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
    && route.request().method() === 'GET' ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
});

async function openClarity(page: Page, options: {admin?: boolean; empty?: boolean; missingBank?: boolean} = {}) {
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await page.evaluate(() => (window as any)._loadTopics());
  const meta = await page.evaluate(({save, options}) => {
    const w = window as any;
    const refs = (0, eval)('refsDB');
    const articles = (0, eval)('nefroArticles');
    const comps = (0, eval)('NQ_COMPETENCIES');
    const keys = Object.keys(refs);
    const reachable = new Set(w.questionBank.flatMap((q: any) => q.r || q.refs || []));
    localStorage.clear();
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({version: 1, totalQuestions: 12,
      totalCorrect: 8, totalWrong: 4, byCategory: {}, byTopic: {}, questionHistory: [], dailyActivity: {},
      timeStats: {totalTime: 120, questionCount: 12}, mostMissed: {}}));
    const values = [{c: 0, t: 0}, {c: 1, t: 1}, {c: 3, t: 4}, {c: 2, t: 5},
      {c: 3, t: 5}, {c: 9, t: 9}, {c: 7, t: 10}, {c: 6, t: 10}, {c: 69, t: 99}, {c: 49, t: 99}];
    localStorage.setItem('nefroquest-comp-stats', JSON.stringify(Object.fromEntries(values.map((value, i) => [comps[i].id, value]))));
    localStorage.setItem('nq-unlocked-refs', JSON.stringify(options.empty ? [] : [keys[0], keys[0], keys[1], 'invalid-ref', null]));
    localStorage.setItem('unlockedArticles', JSON.stringify(options.empty ? [] : [2, '2', 4, -1, articles.length, null, false, '']));
    w.isAdminUser = () => !!options.admin;
    if (options.missingBank) {
      w.questionBank = [];
      w._loadTopics = async () => { throw new Error('deterministic topics unavailable'); };
    }
    return {refs: keys.length, articles: articles.length, expectedDiscovered: options.empty ? 0 : 4,
      lockedKey: keys.find(key => key !== keys[0] && key !== keys[1])!,
      lockedTitle: refs[keys.find(key => key !== keys[0] && key !== keys[1])!].label,
      unlinkedTitle: keys.filter(key => !reachable.has(key)).map(key => refs[key].label)[0],
      guidelines: Object.entries(refs).filter(([key, r]: [string, any]) => (options.empty || ![keys[0], keys[1]].includes(key))
        && (r.badge === 'GUIDELINE' || /kdigo/i.test(`${r.label || ''} ${r.journal || ''}`))).length,
      samples: values.map((value, i) => ({...value, label: comps[i].label}))};
  }, {save: saveBase({level: 3, correctTotal: 32}), options});
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  return meta;
}

test('organiza a Visão geral em coluna única e revela comparação por teclado', async ({page}) => {
  await openClarity(page);
  const pane = page.locator('#nqdPane-overview');
  const blocks = pane.locator('[data-overview-section]');
  await expect(blocks).toHaveCount(4);
  expect(await blocks.evaluateAll(elements => elements.map(el => (el as HTMLElement).dataset.overviewSection)))
    .toEqual(['pace', 'now', 'review', 'reward']);
  await expect(pane.locator('.nqd-journey,.nqd-form-trail')).toHaveCount(0);
  await expect(page.locator('.nqd-main')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(pane.locator('[data-nqd-primary="true"]')).toHaveCount(1);
  const detail = pane.locator('.nqd-learning-pulse details');
  await expect(detail).not.toHaveAttribute('open', '');
  await expect(pane.locator('.nqd-pulse-bars')).toBeVisible();
  const summary = detail.locator('summary');
  await summary.focus(); await summary.press('Enter');
  await expect(detail).toHaveAttribute('open', '');
  await summary.press('Space');
  await expect(detail).not.toHaveAttribute('open', '');
});

test('conta temas praticados e tentativas sem confundir amostra pequena com domínio', async ({page}) => {
  const meta = await openClarity(page);
  await page.getByRole('tab', {name: 'Mapa clínico', exact: true}).click();
  const map = page.locator('#nqdPane-mapa');
  await expect(map.locator('.nqd-map-reading-help')).toContainText('9 de');
  await expect(map).not.toContainText(/Em consolidação|Amostra inicial/);
  for (const sample of meta.samples) {
    const row = map.locator('.nqd-map-node').filter({has: page.getByRole('heading', {name: sample.label, exact: true, includeHidden: true})});
    if (!sample.t) await expect(row).toContainText('Responda questões deste tema para começar.');
    else {
      await expect(row.locator('p')).toHaveText(`${sample.c} ${sample.c === 1 ? 'acerto' : 'acertos'} em ${sample.t} ${sample.t === 1 ? 'resposta' : 'respostas'}`);
      if (sample.t < 5) { await expect(row).toHaveAttribute('data-state', 'sample'); await expect(row.locator('p')).not.toContainText('%'); }
      if (sample.c === 69 && sample.t === 99) {
        await expect(row).toHaveAttribute('data-state', 'consolidating');
        await expect(row.locator('p')).toHaveText('69 acertos em 99 respostas');
      }
    }
  }
  await map.locator('#nqDashMapFilter').selectOption('answered');
  await expect(map.locator('.nqd-map-node:not([hidden])')).toHaveCount(9);
  for (const group of await map.locator('[data-map-group]:visible').all()) {
    if (!(await group.evaluate(el => (el as HTMLDetailsElement).open))) await group.locator(':scope > summary').click();
    for (const row of await group.locator('.nqd-map-node:not([hidden])').all()) {
      await expect(row).toBeVisible();
      await expect(row).not.toHaveAttribute('data-state', 'unseen');
    }
  }
  await map.locator('#nqDashMapFilter').selectOption('unseen');
  for (const row of await map.locator('.nqd-map-node:not([hidden])').all()) await expect(row).toHaveAttribute('data-state', 'unseen');
});

test('oferece o inventário faltante sem resumo bloqueado nem novas descobertas', async ({page}) => {
  const meta = await openClarity(page);
  const before = await page.evaluate(() => [localStorage.getItem('nq-unlocked-refs'), localStorage.getItem('unlockedArticles')]);
  await page.getByRole('tab', {name: 'Grimório', exact: true}).click();
  const library = page.locator('#nqdPane-library');
  await expect(library.locator('.nqd-library-summary')).toContainText('4 descobertas reunidas');
  await expect(library.locator('.nqd-library-summary')).toContainText(`2 de ${meta.articles} pergaminhos`);
  await expect(library.locator('[data-library-entry]:visible')).toHaveCount(2);
  await library.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(library.locator('[data-library-entry]:visible')).toHaveCount(meta.articles - 2);
  await expect(library.locator('[data-library-entry]:visible button')).toHaveCount(0);
  await expect(library.locator('[data-library-entry]:visible .nqd-library-impact')).toHaveCount(0);
  await page.getByRole('tab', {name: 'Fontes clínicas', exact: false}).click();
  await expect(library.locator('[data-library-entry]:visible')).toHaveCount(meta.refs - 2);
  await library.locator('#nqDashLibraryFilter').selectOption('guideline');
  await expect(library.locator('[data-library-entry]:visible')).toHaveCount(meta.guidelines);
  await library.locator('#nqDashLibraryFilter').selectOption('all');
  if (meta.unlinkedTitle) {
    await library.locator('#nqDashLibrarySearch').fill(meta.unlinkedTitle);
    await expect(library.locator('[data-library-entry]:visible').first()).toContainText('não está vinculada');
  }
  await page.evaluate(key => {
    const button = document.createElement('button'); button.dataset.libraryReadKey = key;
    (window as any)._dashToggleArticle(button); button.dataset.libraryKey = key; (window as any)._dashToggleFavorite(button);
  }, meta.lockedKey);
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  expect(await page.evaluate(() => [localStorage.getItem('nq-unlocked-refs'), localStorage.getItem('unlockedArticles')])).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem('nq-bib-favorites'))).toBeNull();
});

test('mantém acesso administrativo separado das descobertas pessoais e conserva filtros ao voltar', async ({page}) => {
  const meta = await openClarity(page, {admin: true});
  const before = await page.evaluate(() => [localStorage.getItem('nq-unlocked-refs'), localStorage.getItem('unlockedArticles')]);
  await page.getByRole('tab', {name: 'Grimório', exact: true}).click();
  const library = page.locator('#nqdPane-library');
  await expect(library.locator('.nqd-library-summary')).toContainText('Visão administrativa');
  await expect(library.locator('.nqd-library-summary')).toContainText('4 descobertas reunidas');
  await expect(library.locator('[data-library-item]:visible')).toHaveCount(meta.articles);
  await library.locator('#nqDashLibraryDiscovery').selectOption('unlocked');
  await expect(library.locator('[data-library-item]:visible')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await page.evaluate(() => (window as any).openDashboard({tab: 'library'}));
  await expect(page.locator('#nqDashLibraryDiscovery')).toHaveValue('unlocked');
  await expect(page.locator('[data-library-item]:visible')).toHaveCount(2);
  expect(await page.evaluate(() => [localStorage.getItem('nq-unlocked-refs'), localStorage.getItem('unlockedArticles')])).toEqual(before);
});

test('deixa a coleção vazia explorável e não inventa ausência de vínculo quando o banco falha', async ({page}) => {
  await openClarity(page, {empty: true, missingBank: true});
  await page.getByRole('tab', {name: 'Grimório', exact: true}).click();
  await expect(page.locator('[data-library-empty]')).toBeVisible();
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(page.locator('[data-library-empty]')).toBeHidden();
  await expect(page.locator('.nqd-library-locked-item:visible').first()).toBeVisible();
  await page.getByRole('tab', {name: 'Fontes clínicas', exact: false}).click();
  await expect(page.locator('.nqd-library-locked-item:visible').first()).toContainText('não está disponível para conferir');
  await expect(page.locator('.nqd-library-locked-item:visible').first()).not.toContainText('não está vinculada');
});

test('320px e texto a 200% preservam controles, títulos e coleções sem rolagem lateral', async ({page}) => {
  await page.setViewportSize({width: 320, height: 844});
  await openClarity(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('32px');
  for (const name of ['Visão geral', 'Mapa clínico', 'Grimório']) {
    await page.getByRole('tab', {name, exact: true}).click();
    const pane = page.locator('[data-dash-pane]:visible');
    const paneGeometry = await pane.evaluate(el => ({id: el.id, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
      width: el.getBoundingClientRect().width, fontSize: getComputedStyle(el).fontSize, fontFamily: getComputedStyle(el).fontFamily}));
    expect(paneGeometry.scrollWidth, `${name}: ${JSON.stringify(paneGeometry)}`).toBeLessThanOrEqual(paneGeometry.clientWidth + 1);
    expect(await page.locator('.nqd-main').evaluate(el => el.scrollWidth <= el.clientWidth + 1), name).toBe(true);
  }
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  const pane = page.locator('#nqdPane-library');
  expect(await pane.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await expect(page.locator('.nqd-library-locked-item:visible').first()).toBeVisible();
  await page.getByRole('tab', {name: 'Fontes clínicas', exact: false}).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', {name: 'Pergaminhos', exact: false})).toBeFocused();
});

test('390px e 320px mantêm busca e filtro do Mapa separados e inteiros', async ({page}) => {
  await openClarity(page);
  await page.getByRole('tab', {name: 'Mapa clínico', exact: true}).click();
  for (const [width, fontSize] of [[390, 16], [320, 16], [320, 32]]) {
    await page.setViewportSize({width, height: 844});
    await page.evaluate(size => { document.documentElement.style.fontSize = size + 'px'; }, fontSize);
    const metrics = await page.locator('.nqd-map-toolbar').evaluate(toolbar => {
      const input = toolbar.querySelector('input')!.getBoundingClientRect();
      const select = toolbar.querySelector('select')!.getBoundingClientRect();
      const label = toolbar.querySelector('.nqd-map-search > span')!;
      const rect = label.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(label);
      return {inputWidth: input.width, labelWidth: rect.width, separated: input.bottom <= select.top,
        labelText: label.textContent,
        textInside: [...range.getClientRects()].every(r => r.left >= rect.left - 1 && r.right <= rect.right + 1),
        within: toolbar.scrollWidth <= toolbar.clientWidth + 1};
    });
    expect(metrics.labelText).toBe('Buscar área ou tema');
    expect(metrics.inputWidth, `${width}px/${fontSize}px: campo utilizável`).toBeGreaterThanOrEqual(140);
    expect(metrics.labelWidth, `${width}px/${fontSize}px: rótulo inteiro`).toBeGreaterThanOrEqual(140);
    expect(metrics.separated).toBe(true);
    expect(metrics.textInside).toBe(true);
    expect(metrics.within).toBe(true);
  }
});
