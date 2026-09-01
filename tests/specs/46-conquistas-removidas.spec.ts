import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * NQ-02: o contador de conquistas não pode divergir do que o modal mostra.
 *
 * O array salvo em `nefroquest-achievements` guarda identificadores
 * conquistados um dia. Três conquistas foram removidas de propósito —
 * 'speed_demon' premiava responder rápido, 'night_scholar' e 'marathon_runner'
 * premiavam virar noite —, mas continuam gravadas no save de quem as ganhou.
 *
 * As LINHAS do modal sempre foram imunes: são geradas a partir da lista atual.
 * O CONTADOR não era — somava o array salvo inteiro e podia exibir "14/12",
 * mais conquistas do que existem. A Central já filtrava; o modal legado não.
 *
 * A INVARIANTE aqui não depende de saber quais identificadores existem hoje: o
 * número do contador tem de ser exatamente o número de linhas marcadas como
 * obtidas. Ela pega os dois erros possíveis de uma vez — contador inflado por
 * conquista inexistente, e filtro apertado demais que zeraria quem tem
 * conquista de verdade.
 */

const CHAVE = 'nefroquest-achievements';
const REMOVIDAS = ['speed_demon', 'night_scholar', 'marathon_runner'];

async function abrirCom(page: Page, conquistas: string[]) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15000 });
  await page.evaluate(({ chave, lista }) => {
    localStorage.setItem(chave, JSON.stringify(lista));
  }, { chave: CHAVE, lista: conquistas });
}

async function medirModal(page: Page) {
  await page.evaluate(() => (window as any).showAchievementsModal?.());
  await page.locator('.ach-counter-num').first().waitFor({ timeout: 10000 });
  return page.evaluate(() => {
    const texto = document.querySelector('.ach-counter-num')?.textContent || '0/0';
    const [obtidas, total] = texto.split('/').map((n) => Number(n.trim()));
    return {
      obtidas,
      total,
      linhasObtidas: document.querySelectorAll('.ach-row.unlocked').length,
      linhasTotais: document.querySelectorAll('.ach-row').length,
    };
  });
}

test.describe('Contador de conquistas', () => {
  test('o contador bate com as linhas mostradas, com conquistas removidas no save', async ({ page }) => {
    await abrirCom(page, [...REMOVIDAS]);
    const m = await medirModal(page);

    expect(m.linhasTotais, 'o modal precisa listar conquistas').toBeGreaterThan(0);
    expect(m.total, 'o denominador precisa ser a lista atual').toBe(m.linhasTotais);
    expect(
      m.obtidas,
      `o contador (${m.obtidas}) diverge das linhas obtidas (${m.linhasObtidas}) — conquistas removidas estão sendo somadas`,
    ).toBe(m.linhasObtidas);
  });

  test('um save só com conquistas removidas mostra zero', async ({ page }) => {
    await abrirCom(page, [...REMOVIDAS]);
    const m = await medirModal(page);
    expect(m.obtidas, 'conquistas que não existem mais não podem contar').toBe(0);
  });

  test('o contador nunca passa do total', async ({ page }) => {
    // Save exagerado: as removidas mais identificadores que nunca existiram.
    await abrirCom(page, [...REMOVIDAS, 'inventada_a', 'inventada_b', 'inventada_c', 'inventada_d']);
    const m = await medirModal(page);
    expect(m.obtidas, `contador acima do total: ${m.obtidas}/${m.total}`).toBeLessThanOrEqual(m.total);
    expect(m.obtidas).toBe(m.linhasObtidas);
  });

  test('o filtro não zera quem tem conquista de verdade', async ({ page }) => {
    // A contrapartida. Deixa o próprio jogo desbloquear o que for legítimo a
    // partir do estado injetado, e só então mede: se o filtro estivesse
    // apertado demais, o contador cairia abaixo das linhas obtidas.
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    await injectGameState(page);
    await page.waitForLoadState('load');
    await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => (window as any).checkAchievements?.());

    const m = await medirModal(page);
    expect(m.obtidas, 'o contador não pode ficar abaixo do que o modal marca como obtido').toBe(m.linhasObtidas);
  });
});
