import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';
import { attachFailureEvidence } from '../helpers/failure-evidence';
import { startStarterContextLifecycle, finishStarterContextLifecycle } from '../helpers/starter-context-lifecycle';

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await startStarterContextLifecycle(page);
});

test.afterEach(async ({ page }, info) => {
  try {
    if (info.status !== info.expectedStatus) await attachFailureEvidence(page, info);
  } finally { await finishStarterContextLifecycle(page, info); }
});

for (const character of ['glomerulus', 'aquaria', 'nephros']) {
  test(`equipamento inicial de ${character} mantém nomes e atributos quando a imagem falha`, async ({ page, context }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET' || !['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
      return route.continue();
    });
    await context.routeWebSocket('**/*', socket => socket.close());
    await routeTechnicalQuestionBank(page, [{ qid: 'starter-fallback-279', cat: 'geral',
      q: 'Teste técnico de equipamento.', opts: ['Primeira opção', 'Segunda opção'],
      ans: 0, exp: 'Correção técnica.' }]);
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    await injectGameState(page, { character, gold: 0, score: 0, xp: 0,
      correctTotal: 0, level: 1 }, { asGuest: true });
    const icons = page.locator('#equipList img.slot-starter-icon');
    // Dispatch the browser's image-error boundary after all six lazy images
    // exist, independently of viewport loading and remote connection timing.
    const before = await page.evaluate(() => {
      const icons = [...document.querySelectorAll<HTMLImageElement>('#equipList img.slot-starter-icon')];
      const stateBefore = (0, eval)('JSON.stringify([state.gold,state.xp,state.lives,state.equipment])');
      const labels = icons.map(icon => ({ name: icon.dataset.itemName, slot: icon.dataset.slotLabel }));
      icons.forEach(icon => icon.dispatchEvent(new Event('error')));
      return { labels, resources: stateBefore };
    });
    expect(before.labels).toHaveLength(6);
    await expect(icons).toHaveCount(0);
    const fallbacks = page.locator('#equipList .slot-starter-icon.slot-temp-emoji');
    await expect(fallbacks).toHaveCount(6);
    const after = await fallbacks.evaluateAll(nodes => nodes.map(node => ({
      name: (node as HTMLElement).dataset.itemName, slot: (node as HTMLElement).dataset.slotLabel,
      text: node.textContent,
    })));
    expect(after.map(({ name, slot }) => ({ name, slot }))).toEqual(before.labels);
    expect(after.every(icon => !!icon.name && !!icon.slot && !!icon.text?.trim())).toBe(true);
    expect(await page.evaluate(() => (0, eval)('JSON.stringify([state.gold,state.xp,state.lives,state.equipment])'))).toBe(before.resources);
    await info.attach('starter-image-fallback', { contentType: 'application/json', body: JSON.stringify({ character, before, after, errors }) });
    expect(errors).toEqual([]);
  });
}
