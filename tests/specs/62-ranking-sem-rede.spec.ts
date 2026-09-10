import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * Sem rede, o ranking dizia que estava vazio.
 *
 * `_doBoardFetch` tratava falha devolvendo `[]`. Lista vazia é
 * indistinguível de ranking realmente vazio, e quem recebia afirmava a coisa
 * errada com todas as letras:
 *
 *   Central:      "Nenhum registro disponível.
 *                  A primeira partida concluída inicia este registro."
 *   modal legado: "Nenhum aventureiro registrou pontuação ainda.
 *                  Seja o primeiro a entrar para a história!"
 *
 * Tudo isso com dezenas de registros no banco, apenas inalcançáveis naquele
 * instante. Falhar é diferente de estar vazio, e só quem falhou sabe disso.
 *
 * A Central já tinha o `catch` certo esperando; faltava a falha chegar até
 * ele. O modal legado não tinha nenhum, e ganhou o seu.
 */

test.use({ serviceWorkers: 'block' });

const REGISTROS = [
  { player_name: 'Ana', score: 900, level: 9, user_id: 'u1' },
  { player_name: 'Bruno', score: 700, level: 7, user_id: 'u2' },
];

async function entrar(page: Page, comRede: boolean) {
  await page.route('**/rest/v1/leaderboard**', (rota) =>
    comRede
      ? rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(REGISTROS) })
      : rota.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  // O cache local sobrevive entre cenários e mascararia a falha.
  await page.evaluate(() => localStorage.removeItem('nq-board-cache'));
}

async function abrirRanking(page: Page) {
  await page.evaluate(() => (window as any).openDashboard?.());
  await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 25000 });
  await page.evaluate(() => (document.querySelector('#nqDashboard [data-dash-tab="ranking"]') as HTMLElement)?.click());
  return page.locator('#nqdPane-ranking');
}

test.describe('Ranking: falhar não é estar vazio', () => {
  test('sem rede, a Central diz que não conseguiu carregar', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Um percurso basta para o contrato.');
    test.setTimeout(180000);
    await entrar(page, false);
    const painel = await abrirRanking(page);

    await expect(painel).toContainText(/não foi possível carregar o ranking/i, { timeout: 25000 });
    // O que ele NÃO pode dizer: que o ranking está vazio, ou convidar a
    // "ser o primeiro" quando há gente lá.
    await expect(painel, 'falha sendo anunciada como ranking vazio').not.toContainText(/nenhum registro disponível/i);
    await expect(painel).not.toContainText(/primeira partida concluída inicia/i);
    // E não pode ficar girando para sempre.
    await expect(page.locator('.nqd-ranking-skeleton')).toHaveCount(0);
  });

  test('com rede, os registros aparecem — o conserto não inventou erro', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Um percurso basta para o contrato.');
    test.setTimeout(180000);
    // A contrapartida: transformar falha em exceção não pode fazer o caminho
    // bom parecer quebrado.
    await entrar(page, true);
    const painel = await abrirRanking(page);

    await expect(painel).toContainText('Ana', { timeout: 25000 });
    await expect(painel).toContainText('Bruno');
    await expect(painel).not.toContainText(/não foi possível carregar/i);
  });

  test('sem rede, o modal legado também para de convidar a "ser o primeiro"', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Um percurso basta para o contrato.');
    test.setTimeout(180000);
    /* Este é o que mais mentia: sem rede, chamava o jogador a inaugurar um
     * ranking que já existe. E `renderBoard` não tinha try/catch — sem o novo
     * bloco, a exceção deixaria o spinner girando, pior que a mensagem
     * errada. */
    await entrar(page, false);
    await page.evaluate(() => (window as any).openBoardModal?.() ?? (window as any).renderBoard?.(true));
    await page.waitForTimeout(3000);

    const corpo = page.locator('#boardBody');
    if (!(await corpo.count())) test.skip(true, 'modal legado não disponível nesta build');

    await expect(corpo).toContainText(/não foi possível carregar o ranking/i, { timeout: 20000 });
    await expect(corpo, 'convite falso a inaugurar um ranking que já existe').not.toContainText(/seja o primeiro/i);
    await expect(corpo).not.toContainText(/nenhum aventureiro registrou/i);
  });
});
