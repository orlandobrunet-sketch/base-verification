import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/**
 * "Pergaminho encontrado": o modal do baú fica fora do contêiner que define a
 * cor do texto. Sem cor própria, resumo, conclusão, curiosidade e impacto do
 * artigo herdavam o preto padrão do navegador — preto sobre azul-escuro,
 * praticamente ilegível (relatado pelo proprietário com print).
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

for (const largura of [1280, 390]) {
  test(`o texto do artigo no pergaminho é legível em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: largura < 500 ? 844 : 900 });
    await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    await injectGameState(page);
    await page.waitForLoadState('load');
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => (0, eval)('showChestModal(nefroArticles[0], 1, 40)'));
    const artigo = page.locator('#chestArticle .article-card');
    await expect(artigo).toBeVisible();
    // Mede depois da animação de entrada: no meio dela a opacidade ainda sobe.
    await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || (a.effect as any)?.getTiming?.().iterations === Infinity));

    // O defeito era exatamente este: texto sem cor própria, herdando preto.
    const cores = await artigo.locator('p').evaluateAll(ps => ps.map(p => getComputedStyle(p).color));
    expect(cores.filter(c => c === 'rgb(0, 0, 0)'), 'parágrafo do artigo em preto herdado').toEqual([]);

    const falhas = await page.evaluate(medirContraste, '#chestArticle');
    expect(falhas, JSON.stringify(falhas, null, 1)).toEqual([]);
  });
}
