import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

const references = {
  'known-source': { label: 'Fonte técnica descoberta', resumo: 'Conteúdo técnico descoberto.', ano: 2024, url: 'https://example.test/known-source' },
  'locked-source': { label: 'Fonte técnica bloqueada', resumo: 'Conteúdo técnico reservado.', ano: 2023, url: 'https://example.test/locked-source' },
};
const scrolls = [
  { titulo: 'Pergaminho técnico descoberto', resumo: 'Conteúdo técnico do pergaminho descoberto.', ano: 2022, raridade: 'comum', url: 'https://example.test/known-scroll' },
  { titulo: 'Pergaminho técnico bloqueado', resumo: 'Conteúdo técnico do pergaminho reservado.', ano: 2021, raridade: 'raro', url: 'https://example.test/locked-scroll' },
];
const authors = [{
  qid: 'library-access-technical', cat: 'geral', diff: 'medium',
  q: 'Questão técnica para validar acesso ao catálogo fictício.',
  opts: ['Opção A', 'Opção B', 'Opção C', 'Opção D'], ans: 0,
  exp: 'Conteúdo técnico de teste de navegação.', refs: Object.keys(references),
}];
const ledger = (page: Page) => page.evaluate(() => [
  localStorage.getItem('nq-unlocked-refs'), localStorage.getItem('unlockedArticles'),
]);

test.beforeEach(async ({ context, page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET' || url.origin !== origin) return route.abort();
    if (url.pathname === '/data/refs.js') return route.fulfill({ contentType: 'application/javascript', body: 'const refsDB = ' + JSON.stringify(references) + ';' });
    if (url.pathname === '/data/articles.js') return route.fulfill({ contentType: 'application/javascript', body: 'const nefroArticles = ' + JSON.stringify(scrolls) + ';' });
    return route.continue();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await routeTechnicalQuestionBank(page, authors, references);
  await page.addInitScript(() => {
    const copied: string[] = [];
    (window as any).__copiedLibraryTitles = copied;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (title: string) => { copied.push(title); } } });
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async () => {
    await (window as any)._loadTopics({ refsOnly: true });
    await (window as any).carregarDadosGrimorio();
    localStorage.setItem('nq-unlocked-refs', JSON.stringify(['known-source']));
    localStorage.setItem('unlockedArticles', JSON.stringify([0]));
    localStorage.setItem('nq-bib-favorites', JSON.stringify([]));
  });
});

async function openLibrary(page: Page, admin: boolean) {
  await page.evaluate(admin => { (window as any).isAdminUser = () => admin; return (window as any).openDashboard({ tab: 'library' }); }, admin);
  await expect(page.locator('#nqdPane-library')).toBeVisible();
  const filters = page.locator('[data-library-filter-toggle]');
  if (await filters.getAttribute('aria-expanded') === 'false') await filters.click();
}
const readButton = (page: Page, key: string) => page.locator('[data-library-read-key="' + key + '"]');

test('Bloqueados impede leitura inclusive do admin, com cadeado, teclado e guarda programática', async ({ page }) => {
  await openLibrary(page, true);
  const before = await ledger(page);
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(page.locator('[data-library-entry]:visible')).toHaveCount(2);
  for (const key of ['locked-source', '__art_1']) {
    const button = readButton(page, key);
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAccessibleName('Resumo bloqueado');
    await expect(button.locator('svg')).toHaveCount(1);
    await button.evaluate(element => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await page.evaluate(key => (window as any)._dashToggleArticle({ dataset: { libraryReadKey: key } }), key);
    await button.evaluate(element => {
      (element as HTMLButtonElement).disabled = false;
      (window as any)._dashToggleArticle(element);
      (element as HTMLButtonElement).disabled = true;
    });
    await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  }
  const card = readButton(page, 'locked-source').locator('xpath=ancestor::article');
  await card.locator('.nqd-favorite').focus();
  await page.keyboard.press('Tab');
  await expect(card.locator('[data-copy-title]')).toBeFocused();
  await card.locator('[data-copy-title]').click();
  expect(await page.evaluate(() => (window as any).__copiedLibraryTitles)).toEqual(['Fonte técnica bloqueada']);
  await expect(card.getByRole('link', { name: /Abrir artigo/ })).toHaveAttribute('href', 'https://example.test/locked-source');
  await card.locator('.nqd-favorite').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nq-bib-favorites') || '[]'))).toEqual(['locked-source']);
  expect(await ledger(page)).toEqual(before);
});

test('prévia em Todos e Favoritos continua disponível e o bloqueio volta ao restaurar o filtro', async ({ page }) => {
  await openLibrary(page, true);
  const before = await ledger(page);
  await readButton(page, 'locked-source').click();
  await expect(page.locator('.bib-resumo-modal')).toContainText('Conteúdo técnico reservado.');
  await page.keyboard.press('Escape');
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await readButton(page, 'locked-source').locator('xpath=ancestor::article').locator('.nqd-favorite').click();
  await page.getByRole('tab', { name: 'Favoritos', exact: false }).click();
  await expect(readButton(page, 'locked-source')).toBeEnabled();
  await expect(readButton(page, 'locked-source')).toHaveAccessibleName('Ler resumo');
  await readButton(page, 'locked-source').click();
  await expect(page.locator('.bib-resumo-modal')).toContainText('Conteúdo técnico reservado.');
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Todos', exact: false }).click();
  await expect(readButton(page, 'locked-source')).toBeDisabled();
  await page.keyboard.press('Escape');
  await openLibrary(page, true);
  await expect(page.locator('#nqDashLibraryDiscovery')).toHaveValue('locked');
  await expect(readButton(page, 'locked-source')).toBeDisabled();
  await page.evaluate(() => (window as any)._dashToggleArticle({ dataset: { libraryReadKey: '__art_1' } }));
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  await page.locator('#nqDashLibraryDiscovery').selectOption('all');
  await expect(readButton(page, 'locked-source')).toBeEnabled();
  await expect(readButton(page, 'locked-source')).toHaveAccessibleName('Ler resumo');
  await readButton(page, '__art_1').click();
  await expect(page.locator('.bib-resumo-modal')).toContainText('Conteúdo técnico do pergaminho reservado.');
  expect(await ledger(page)).toEqual(before);
});

test('jogador comum lê só descobertas; filtrar e chamadas forjadas não concedem acesso', async ({ page }) => {
  await openLibrary(page, false);
  const before = await ledger(page);
  await expect(page.locator('[data-library-entry]')).toHaveCount(4);
  await expect(page.locator('[data-library-item]')).toHaveCount(2);
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(page.locator('[data-library-entry]:visible')).toHaveCount(2);
  await expect(page.locator('[data-library-entry]:visible [data-action="_dashToggleArticle"]')).toHaveCount(0);
  await page.evaluate(() => {
    for (const key of ['locked-source', '__art_1']) (window as any)._dashToggleArticle({ dataset: { libraryReadKey: key } });
  });
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  await page.locator('#nqDashLibraryDiscovery').selectOption('unlocked');
  await expect(page.locator('[data-library-entry]:visible')).toHaveCount(2);
  for (const key of ['known-source', '__art_0']) {
    await expect(readButton(page, key)).toBeEnabled();
    await readButton(page, key).click();
    await expect(page.locator('.bib-resumo-modal')).toHaveCount(1);
    await page.keyboard.press('Escape');
  }
  expect(await ledger(page)).toEqual(before);
});
