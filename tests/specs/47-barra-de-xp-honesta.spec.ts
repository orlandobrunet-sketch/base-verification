import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * NQ-02: a barra de XP não pode prometer um nível que o progresso não libera.
 *
 * O nível tem teto por acertos — um a cada dez, `levelCapForCorrect`. Quando o
 * teto é atingido, `gainXP` para de consumir XP e o trava em `xpToNext`. O
 * resultado na tela era "XP 200/200", barra a 100%, e o nível parado. Sem
 * explicação, isso lê como defeito: a pessoa completa a barra e nada acontece.
 *
 * A Central já dizia "o que destrava é acerto, não experiência". A tela onde a
 * pessoa realmente joga não dizia nada.
 *
 * MEDIDO ANTES DE CONSERTAR: com nível 1 e 3 acertos, ganhar 2000 de XP deixava
 * `XP 200/200` e nível 1 — barra cheia, promessa não cumprida, silêncio.
 */

async function abrirCom(page: Page, save: Record<string, unknown>) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, save);
  await page.waitForLoadState('load');
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15000 });
}

const lerBarra = (page: Page) => page.evaluate(() => {
  const g = window as any;
  g.renderHUD?.();
  return {
    texto: document.getElementById('xpTxt')?.textContent?.trim() || '',
    largura: (document.getElementById('xpFill') as HTMLElement)?.style.width || '',
    nivel: g.state.level,
    teto: g.levelCapForCorrect(g.state.correctTotal),
  };
});

test.describe('Barra de XP', () => {
  test('cheia e travada pelo portão, a barra diz quantos acertos faltam', async ({ page }) => {
    // Nível 1 com 3 acertos: o teto de nível é 1, então nenhum XP promove.
    await abrirCom(page, { level: 1, xp: 0, correctTotal: 3 });
    await page.evaluate(() => (window as any).gainXP?.(2000));

    const barra = await lerBarra(page);
    expect(barra.nivel, 'o cenário exige o nível travado no teto').toBe(1);
    expect(barra.largura, 'o cenário exige a barra cheia').toBe('100%');
    expect(
      barra.texto,
      `a barra ficou cheia sem dizer o que falta: "${barra.texto}"`,
    ).toMatch(/acertos?/i);
    // 10 acertos abrem o nível 2; com 3 feitos, faltam 7.
    expect(barra.texto).toContain('7');
  });

  test('sem o portão no caminho, o texto continua simples', async ({ page }) => {
    // A contrapartida: quem ainda não encheu a barra não pode ver aviso nenhum.
    await abrirCom(page, { level: 1, xp: 0, correctTotal: 3 });
    await page.evaluate(() => (window as any).gainXP?.(10));

    const barra = await lerBarra(page);
    expect(barra.largura, 'a barra não deveria estar cheia aqui').not.toBe('100%');
    expect(barra.texto, `texto poluído sem motivo: "${barra.texto}"`).not.toMatch(/acertos?/i);
    expect(barra.texto).toMatch(/^XP \d+\/\d+$/);
  });

  test('o numerador nunca passa do denominador', async ({ page }) => {
    await abrirCom(page, { level: 1, xp: 0, correctTotal: 3 });
    await page.evaluate(() => (window as any).gainXP?.(9999));

    const barra = await lerBarra(page);
    const [xp, alvo] = (barra.texto.match(/XP (\d+)\/(\d+)/) || []).slice(1).map(Number);
    expect(xp, `fração impossível na tela: ${barra.texto}`).toBeLessThanOrEqual(alvo);
  });

  test('no nível máximo não promete um nível seguinte', async ({ page }) => {
    // 90 acertos liberam o nível 10, que é o teto absoluto. Não existe nível 11
    // para prometer, e a barra não pode inventar um.
    await abrirCom(page, { level: 10, xp: 0, correctTotal: 95 });
    await page.evaluate(() => (window as any).gainXP?.(9999));

    const barra = await lerBarra(page);
    expect(barra.texto, `prometeu nível acima do máximo: "${barra.texto}"`).not.toMatch(/nível 11/i);
  });
});
