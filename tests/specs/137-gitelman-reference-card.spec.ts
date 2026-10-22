import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import path from 'node:path';

const approved = JSON.parse(readFileSync(path.resolve(__dirname,
  '../../docs/editorial/reviews/2026-10-21/gitelman-whole-card-candidate-A1.json'), 'utf8')).wholeCard;
const referenceId = 'gitelman_kdigo_2017';
test.use({serviceWorkers: 'block', reducedMotion: 'reduce'});

test('Gitelman full card opens the reviewed text in the clinical library', async ({page, context}) => {
  await context.routeWebSocket('**/*', socket => socket.close());
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    return ['localhost', '127.0.0.1'].includes(url.hostname) && request.method() === 'GET'
      ? route.continue() : route.abort();
  });
  await page.goto('/jogar/');
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => { (window as any).isAdminUser = () => true; });
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await page.getByRole('tab', {name: 'Fontes clínicas'}).click();
  await page.locator('#nqDashLibrarySearch').fill('Gitelman');
  const card = page.locator('[data-library-item]:visible').filter({
    has: page.locator('.nqd-favorite[data-library-key="' + referenceId + '"]')
  });
  await expect(card).toHaveCount(1);
  const loaded = await page.evaluate(id => (0, eval)('refsDB')[id], referenceId);
  expect(loaded).toEqual(approved);
  expect(loaded.badge).toBe('CONSENSUS');
  await card.getByRole('button', {name: 'Ler resumo', exact: true}).click();
  const reader = page.locator('.bib-resumo-modal [role="dialog"]');
  await expect(reader).toBeVisible();
  expect(await reader.locator('.nqreader-sections p').allTextContents())
    .toEqual([approved.resumo, approved.conclusao, approved.curiosidade, approved.impacto]);
  expect(await reader.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
});
