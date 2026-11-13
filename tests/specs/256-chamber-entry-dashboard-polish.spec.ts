import { test, expect, type Page, type Locator } from '@playwright/test';
import { createHash } from 'node:crypto';
import { saveBase, statsBase } from '../helpers/fixtures';

// Guest-only local records; native routes, renderers and case values run intact.
test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const progressKeys = ['nefroquest-save', 'nefroquest-save-v7', 'nefroquest-detailed-stats',
  'nefroquest-comp-stats', 'nefroquest-sr-data', 'nefroquest-study-state', 'nq-acidbase-progress'];
const diagnostics = new WeakMap<Page, { errors: string[]; nonGET: string[]; sockets: number }>();
const progress = (page: Page) => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), progressKeys);

test.beforeEach(async ({ page, context, baseURL, isMobile }) => {
  const origin = new URL(baseURL!).origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(origin).hostname);
  const observed = { errors: [] as string[], nonGET: [] as string[], sockets: 0 };
  diagnostics.set(page, observed);
  page.on('pageerror', error => observed.errors.push(error.message));
  await context.route('**/*', route => {
    const request = route.request();
    if (request.method() !== 'GET') observed.nonGET.push(request.method() + ' ' + new URL(request.url()).pathname);
    return request.method() === 'GET' && new URL(request.url()).origin === origin ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => { observed.sockets++; socket.close(); });
  await page.setViewportSize({ width: isMobile ? 390 : 1440, height: 900 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.evaluate(() => (window as any)._loadTopics());
  await page.evaluate(({ save, stats }) => {
    const definitions = (window as any).CORE_SKILLS;
    (stats as any).byCategory = Object.fromEntries([{ correct: 9, wrong: 1 }, { correct: 2, wrong: 8 }, { correct: 6, wrong: 4 }]
      .map((sample, index) => [definitions[index].categories[0], sample]));
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(stats));
    localStorage.setItem('nefroquest-comp-stats', '{}');
  }, { save: saveBase(), stats: statsBase({ version: 1, totalQuestions: 30, totalCorrect: 17, totalWrong: 13,
    byTopic: {}, questionHistory: [], timeStats: {}, mostMissed: {} }) });
});

test.afterEach(async ({ page }, info) => {
  const observed = diagnostics.get(page)!;
  await info.attach('internal-pages-runtime', { contentType: 'application/json', body: JSON.stringify(observed) });
  expect(observed.errors).toEqual([]); expect(observed.nonGET).toEqual([]); expect(observed.sockets).toBe(0);
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
});

async function scale(page: Page, width: number, font: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate(size => document.documentElement.style.fontSize = size + 'px', font);
  await page.waitForFunction(size => Math.abs(parseFloat(getComputedStyle(document.documentElement).fontSize) - size) < .01, font);
}

async function readable(target: Locator, interactive = false) {
  await expect(target).toBeVisible(); await target.scrollIntoViewIfNeeded();
  const report = await target.evaluate(element => {
    const box = element.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(element);
    const glyphs = [...range.getClientRects()].filter(rect => rect.width && rect.height);
    const rect = (bounds: DOMRect) => ({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
    const clipping: unknown[] = [];
    if (glyphs.some(bounds => bounds.left < -1 || bounds.right > innerWidth + 1))
      clipping.push({ ancestor: 'viewport', width: innerWidth, glyphs: glyphs.map(rect) });
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
      // Ignore non-box containers and root overflow, which clips the viewport,
      // not BODY's in-flow rectangle behind the fixed dashboard.
      if (style.display === 'contents' || parent === document.body || parent === document.documentElement) continue;
      if (glyphs.some(glyph =>
        (['hidden', 'clip'].includes(style.overflowX) && (glyph.left < bounds.left - 1 || glyph.right > bounds.right + 1)) ||
        (['hidden', 'clip'].includes(style.overflowY) && (glyph.top < bounds.top - 1 || glyph.bottom > bounds.bottom + 1))))
        clipping.push({ ancestor: parent.className, display: style.display, overflow: [style.overflowX, style.overflowY], bounds: rect(bounds), glyphs: glyphs.map(rect) });
    }
    return { clipping, width: box.width, height: box.height, viewportWidth: innerWidth,
      font: getComputedStyle(document.documentElement).fontSize,
      hit: element.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)) };
  });
  const label = target.toString() + ' at ' + report.viewportWidth + 'px / font ' + report.font;
  expect(report.clipping, label + ': visible text stays inside real clipping boxes').toEqual([]);
  if (interactive) {
    expect(report.hit, 'the decorative artwork does not intercept the control').toBe(true);
    expect(report.width).toBeGreaterThanOrEqual(44); expect(report.height).toBeGreaterThanOrEqual(44);
  }
}

async function dashboard(page: Page, tab: 'overview' | 'skills' | 'library') {
  await page.locator('[data-atrium-route="dashboard"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  if (tab !== 'overview') await page.locator('#nqDashboard [data-dash-tab="' + tab + '"]').click();
  await expect(page.locator('#nqdPane-' + tab)).toBeVisible();
}

async function exposeExams(page: Page) {
  const fold = page.locator('.abx-context-fold');
  if (await fold.isVisible() && !(await fold.evaluate(element => (element as HTMLDetailsElement).open)))
    await fold.locator('summary').click();
  const examTab = page.getByRole('tab', { name: 'Exames', exact: true });
  if (await examTab.isVisible() && await examTab.getAttribute('aria-selected') !== 'true') await examTab.click();
  await expect(page.locator('.ab-context .ab-gas-grid')).toBeVisible();
}

async function laboratory(page: Page) {
  await exposeExams(page);
  const report = await page.locator('.ab-context .ab-gas-grid').evaluate(grid => {
    const rows = [...grid.querySelectorAll('.ab-gas')];
    const values = rows.map(row => [row.querySelector('span')?.textContent?.trim(),
      row.querySelector('strong')?.textContent?.trim(), row.querySelector('em')?.textContent?.trim() || '']);
    const vertical = [...grid.querySelectorAll('.ab-lab-group')].every(group => {
      const boxes = [...group.querySelectorAll('.ab-gas')].map(row => row.getBoundingClientRect());
      return boxes.every((box, index) => box.width > 0 && box.height > 0 &&
        (!index || box.top >= boxes[index - 1].bottom - 1 && Math.abs(box.left - boxes[index - 1].left) < 1));
    });
    return { values, vertical };
  });
  expect(report.values.map(row => row[0])).toEqual(['pH', 'PaCO₂', 'HCO₃⁻', 'BE', 'Na⁺', 'Cl⁻', 'K⁺', 'Albumina']);
  expect(report.values.map(row => row[2])).toEqual(['', 'mmHg', 'mEq/L', 'mEq/L', 'mEq/L', 'mEq/L', 'mEq/L', 'g/dL']);
  expect(report.values.every(row => !!row[1])).toBe(true); expect(report.vertical).toBe(true);
  // Preserve all values and units without interpreting or printing clinical data.
  return createHash('sha256').update(JSON.stringify(report.values)).digest('hex');
}

test('entrada nativa da Câmara conserva progresso e os oito exames na leitura vertical entre introdução, ato e telas', async ({ page }) => {
  const before = await progress(page);
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="balance"]:visible').click();
  if (await page.locator('#nqEntryCinema[open]').count()) await page.keyboard.press('Escape');
  await expect(page.locator('.ab-hub-stage')).toBeVisible();
  const start = page.locator('[data-ab-next="aldric"]:visible');
  await expect(start).toBeEnabled(); await readable(start, true); await start.click();
  await expect(page.locator('#acidBaseOverlay')).toHaveAttribute('data-ab-case-id', 'aldric');
  await expect(page.locator('#acidBaseOverlay')).toHaveAttribute('data-abx-stage', 'intro');
  const original = await laboratory(page);
  await page.locator('[data-ab-start-acts]').click();
  await expect(page.locator('#acidBaseOverlay')).toHaveAttribute('data-abx-stage', 'act');
  expect(await laboratory(page)).toBe(original);
  for (const [width, font] of [[320, 32], [1440, 16]]) {
    await scale(page, width, font);
    expect(await laboratory(page)).toBe(original);
    for (const group of await page.locator('.ab-lab-group').all()) await readable(group);
  }
  await page.locator('[data-ab-close]').click();
  await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);
  expect(await progress(page)).toEqual(before);
});

test('Competências apresenta um único título e mantém a área do diagrama operável ao ampliar texto', async ({ page }) => {
  await dashboard(page, 'skills'); const before = await progress(page);
  const pane = page.locator('#nqdPane-skills');
  for (const [width, font] of [[1440, 16], [320, 32]]) {
    await scale(page, width, font);
    await expect(pane.locator('h1')).toHaveCount(1);
    await expect(pane.locator('.nqs-atlas-header').getByRole('heading')).toHaveCount(1);
    await expect(pane.locator('.nqs-atlas-header h1')).toHaveText('Competências');
    await expect(pane.getByRole('heading', { name: 'Competências', exact: true })).toHaveCount(1);
    await expect(pane.getByRole('heading', { name: /atlas de compet[eê]ncias/i })).toHaveCount(0);
    await readable(pane.locator('h1'));
    const control = pane.locator('.nqs-orbit-node').nth(2);
    await control.scrollIntoViewIfNeeded(); await control.focus(); await control.press('Enter');
    await expect(control).toHaveAttribute('aria-pressed', 'true');
    const id = await control.getAttribute('aria-controls');
    await expect(page.locator('#' + id)).toBeVisible();
    await expect(page.locator('#' + id)).toHaveAttribute('data-skill-id', (await control.getAttribute('data-skill-id'))!);
    expect(await progress(page)).toEqual(before);
  }
});

test('Grimório mantém livro nativo inteiro e leitura e busca acessíveis no celular e após falha real da arte', async ({ page }) => {
  await scale(page, 1440, 16); await dashboard(page, 'library'); const before = await progress(page);
  const image = page.locator('.nqd-grimoire-art'), header = page.locator('.nqd-grimoire-header');
  await expect(image).toHaveAttribute('src', '/assets/images/grimoire-banner-1711.webp');
  expect(await image.evaluate(async (element: HTMLImageElement) => {
    await element.decode();
    return element.complete && element.naturalWidth === 2172 && element.naturalHeight === 724 && getComputedStyle(element).objectFit === 'contain';
  })).toBe(true);
  const headerCopy = () => header.evaluate(element => element.textContent!.replace(/\s+/g, ' ').trim());
  const copy = await headerCopy();
  await scale(page, 320, 32);
  await expect(image).not.toBeVisible();
  expect(await headerCopy()).toBe(copy);
  for (const selector of ['h1', '.nqd-grimoire-rule', '.nqd-library-summary']) await readable(header.locator(selector));
  await readable(page.getByRole('searchbox', { name: 'Buscar no Grimório', exact: true }), true);
  expect(await progress(page)).toEqual(before);

  await page.locator('#nqDashboard [data-action="closeDashboard"]:visible').first().click();
  await page.route('**/assets/images/grimoire-banner-1711.webp', route => route.abort());
  await scale(page, 1440, 16); await dashboard(page, 'library');
  await expect(header).toHaveClass(/has-no-art/);
  await expect(image).toHaveAttribute('hidden');
  expect(await headerCopy()).toBe(copy);
  await scale(page, 320, 32);
  for (const selector of ['h1', '.nqd-grimoire-rule', '.nqd-library-summary']) await readable(header.locator(selector));
  await readable(page.getByRole('searchbox', { name: 'Buscar no Grimório', exact: true }), true);
  expect(await progress(page)).toEqual(before);
});

test('ícones da Visão geral são decorativos e conservam nomes, destinos e alvos das ações', async ({ page }) => {
  await dashboard(page, 'overview'); const before = await progress(page);
  const cards = page.locator('.nqd-next-actions-list .nqd-next-action');
  await expect(cards).toHaveCount(3);
  const names = ['Estudar esta área', 'Retomar jornada', 'Escolher áreas'];
  const routes = ['_dashGoAxisWeakness', '_dashResumeJourney', '_dashExploreSkills'];
  for (const [width, font] of [[1440, 16], [320, 32]]) {
    await scale(page, width, font);
    for (let index = 0; index < names.length; index++) {
      const card = cards.nth(index), button = card.getByRole('button', { name: names[index], exact: true });
      await expect(button).toHaveAttribute('data-action', routes[index]); await readable(button, true);
      const emblem = card.locator('.nqd-action-emblem'); await expect(emblem).toBeVisible();
      await expect(emblem).toHaveAttribute('aria-hidden', 'true');
      await expect(emblem.locator('svg')).toHaveAttribute('focusable', 'false');
      expect(await emblem.evaluate(element => !element.querySelector('button, a, [tabindex]') && element.getBoundingClientRect().width > 0)).toBe(true);
    }
    expect(await progress(page)).toEqual(before);
  }
  await cards.nth(2).getByRole('button', { name: 'Escolher áreas', exact: true }).click();
  await expect(page.locator('.study-mode-popup')).toBeVisible();
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
  expect(await progress(page)).toEqual(before);
});
