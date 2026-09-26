import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * Na tela de perguntas, o cenário é ambiente, não conteúdo.
 *
 * O proprietário relatou que o fundo "destoa, parece muita informação, cansa":
 * a ilustração aparecia viva e saturada atrás do enunciado, com partículas
 * flutuando. Agora ela fica escura, pouco saturada e desfocada, e as
 * partículas somem só nesta tela. Boss e Confronto Final têm fundos próprios.
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

test('o fundo da tela de perguntas fica em segundo plano', async ({ page }) => {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await expect(page.locator('#mainApp')).toBeVisible();

  const fundo = await page.evaluate(() => {
    const f = getComputedStyle(document.querySelector('.bg-layer')!).filter;
    const brilho = Number((f.match(/brightness\(([\d.]+)/) || [])[1]);
    const saturacao = Number((f.match(/saturate\(([\d.]+)/) || [])[1]);
    return { brilho, saturacao, desfoque: /blur\(\s*[1-9]/.test(f),
      particulas: getComputedStyle(document.querySelector('.particles')!).display };
  });
  expect(fundo.brilho, 'cenário claro demais atrás do enunciado').toBeLessThanOrEqual(0.4);
  expect(fundo.saturacao, 'cenário saturado demais').toBeLessThanOrEqual(0.6);
  expect(fundo.desfoque, 'cenário nítido compete com o texto').toBe(true);
  expect(fundo.particulas).toBe('none');
});
