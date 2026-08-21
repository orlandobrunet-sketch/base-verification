import { test, expect } from '@playwright/test';
import { injectGameState, enterGame, waitForGame } from '../helpers/game';

/**
 * Atordoamento do Arqui-Nefromante fora de hora (relato do dono, v14.63).
 *
 * O jogador viu a tarja "Equipamentos paralisados pelo veneno urêmico!" com o
 * tremor de tela no NÍVEL 2, sobreposta ao nome do personagem — sem chefe
 * nenhum em cena. O diário registrava, na ordem: atordoado pelo chefe, depois
 * "Jornada restaurada!".
 *
 * Eram dois defeitos independentes:
 *
 *  A) restoreGame() redefinia ~25 campos do estado e esquecia bossStunActive.
 *     O início de partida (boss.js) já chamava removeStun(); a restauração era
 *     o único caminho que deixava o debuff passar. Como o campo não é gravado
 *     no save, ele simplesmente sobrevivia em memória.
 *
 *  B) .equip-stun-overlay declarava `inset` e `z-index` sem `position`. Ambas
 *     são ignoradas em elemento estático, então a tarja — desenhada para cobrir
 *     a área de equipamentos — caía no fluxo normal, por cima do nome.
 *
 * O cenário B é afirmado sobre o valor RESOLVIDO no navegador, não sobre o
 * texto da regra: era exatamente a diferença que escondeu o defeito.
 */

test.describe('Atordoamento do chefe não atravessa a restauração', () => {
  test('restaurar a jornada limpa o atordoamento em vez de herdá-lo', async ({ page }) => {
    await page.goto('/jogar/');
    // correctTotal BAIXO de propósito: com 93 o app entra em modo chefe, o body
    // ganha .boss-battle-mode e a regra Lúmen se desliga — mascarando o defeito.
    // O relato mostra fundo normal, não o preto do confronto final: o
    // atordoamento vazou para um estado onde o chefe não está em cena.
    await injectGameState(page, { level: 2, correctTotal: 15 });
    await waitForGame(page);

    // Simula o que o jogador viveu: atordoado pelo chefe…
    await page.evaluate(() => {
      (window as any).state.bossStunActive = true;
      document.body.classList.add('boss-stun-active');
      (window as any).renderEquip?.();
    });
    await expect(page.locator('.equip-stun-overlay')).toHaveCount(1);

    // …e então a jornada é restaurada.
    await page.evaluate(() => (window as any).restoreGame());
    await page.evaluate(() => (window as any).renderEquip?.());

    const herdado = await page.evaluate(() => ({
      flag: !!(window as any).state.bossStunActive,
      classe: document.body.classList.contains('boss-stun-active'),
      tremor: !!document.getElementById('mainApp')?.classList.contains('boss-stun-shake'),
      tarjas: document.querySelectorAll('.equip-stun-overlay').length,
    }));

    expect(herdado.flag, 'bossStunActive sobreviveu ao restoreGame').toBe(false);
    expect(herdado.classe, 'a classe boss-stun-active ficou no body').toBe(false);
    expect(herdado.tremor, 'o tremor de tela ficou pendurado no #mainApp').toBe(false);
    expect(herdado.tarjas, 'a tarja de equipamentos bloqueados continuou na tela').toBe(0);
  });

  test('a tarja é posicionada, e não solta no fluxo por cima do nome', async ({ page }) => {
    await page.goto('/jogar/');
    // correctTotal BAIXO de propósito: com 93 o app entra em modo chefe, o body
    // ganha .boss-battle-mode e a regra Lúmen se desliga — mascarando o defeito.
    // O relato mostra fundo normal, não o preto do confronto final: o
    // atordoamento vazou para um estado onde o chefe não está em cena.
    await injectGameState(page, { level: 2, correctTotal: 15 });
    await waitForGame(page);

    await page.evaluate(() => {
      (window as any).state.bossStunActive = true;
      document.body.classList.add('boss-stun-active');
      (window as any).renderEquip?.();
    });

    const tarja = page.locator('.equip-stun-overlay').first();
    await expect(tarja).toHaveCount(1);

    // `inset` e `z-index` só valem em elemento posicionado. Sem isto a regra
    // Lúmen é decorativa e o layout escapa.
    const posicao = await tarja.evaluate(el => getComputedStyle(el).position);
    expect(posicao, 'inset/z-index não têm efeito em elemento estático').not.toBe('static');

    // E #equipList precisa ser um bloco contedor, senão a tarja se ancora num
    // ancestral qualquer e reaparece longe de onde deveria. Qualquer valor
    // posicionado serve — o tema Lúmen usa `absolute`, o CSS de stun usa
    // `relative`; afirmar um deles em particular seria travar a implementação
    // em vez do comportamento.
    const contexto = await page.evaluate(() =>
      getComputedStyle(document.getElementById('equipList')!).position);
    expect(contexto, '#equipList precisa ser um bloco contedor posicionado').not.toBe('static');

    // O teste que realmente reproduz o relato: a tarja não pode cobrir o nome.
    const sobrepoeNome = await page.evaluate(() => {
      const banner = document.querySelector('.equip-stun-overlay');
      const lista = document.getElementById('equipList');
      if (!banner || !lista) return null;
      const b = banner.getBoundingClientRect();
      const l = lista.getBoundingClientRect();
      // Uma folga de 1px absorve arredondamento de subpixel.
      return b.top < l.top - 1 || b.left < l.left - 1 || b.right > l.right + 1;
    });
    expect(sobrepoeNome, 'a tarja vazou para fora da área de equipamentos').toBe(false);
  });
});
