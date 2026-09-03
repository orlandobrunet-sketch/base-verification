import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * NQ-06A — a seção de memória da Central vira Estudo e Revisão.
 *
 * Antes ela mostrava números e terminava ali: quem quisesse estudar precisava
 * sair, achar o seletor de eixos e voltar. Agora abre com ação.
 *
 * DECISÕES DO PROPRIETÁRIO, e é isto que estes cenários congelam:
 *  - ação principal é ESTUDAR POR EIXO, não revisar o vencido;
 *  - a revisão vencida fica ao lado, visível, porque repetição espaçada só
 *    funciona se acontecer perto do vencimento;
 *  - a estimativa de tempo existe, mas some quando não há ritmo medido.
 */

const CARDS = 'nefroquest-sr-data';
const STATS = 'nefroquest-detailed-stats';
// `due` é lido com _number(): o motor grava timestamp, não texto ISO. Semear
// string deixava tudo como não-vencido e os cenários passavam sem provar nada.
const ONTEM = Date.now() - 86400000;
const DAQUI_5D = Date.now() + 5 * 86400000;

async function abrirCentral(page: Page, preparar?: (p: Page) => Promise<void>) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15000 });
  if (preparar) await preparar(page);
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible({ timeout: 15000 });
}

/** Escreve cards de revisão usando qids reais do banco carregado. */
const semear = (vencidas: number, futuras: number) => async (page: Page) => {
  await page.evaluate(async ({ chaveCards, chaveStats, ontem, futuro, nVenc, nFut }) => {
    const g = window as any;
    await g._loadTopics?.();
    const banco = Array.isArray(g.questionBank) ? g.questionBank : [];
    const ids = banco.map((q: any) => String(q.id || q.qid)).filter(Boolean);
    const cards: Record<string, unknown> = {};
    ids.slice(0, nVenc).forEach((id: string) => { cards[id] = { due: ontem, S: 30, reps: 3 }; });
    ids.slice(nVenc, nVenc + nFut).forEach((id: string) => { cards[id] = { due: futuro, S: 9, reps: 2 }; });
    localStorage.setItem(chaveCards, JSON.stringify(cards));
    localStorage.setItem(chaveStats, JSON.stringify({
      schemaVersion: 1, totalQuestions: 60, totalCorrect: 45, totalWrong: 15,
      byTopic: {}, byCategory: {}, questionHistory: [], dailyActivity: {},
      timeStats: { totalTime: 2700, questionCount: 60 }, mostMissed: {}, syncedMastered: [],
    }));
  }, { chaveCards: CARDS, chaveStats: STATS, ontem: ONTEM, futuro: DAQUI_5D, nVenc: vencidas, nFut: futuras });
};

test.describe('Estudo e revisão na Central', () => {
  /* Clicar de verdade, e não conferir o atributo.
   *
   * A primeira versão destes cenários lia `data-action` e dava por bom. O
   * atributo estava certo e os botões NÃO FUNCIONAVAM: o seletor abria em
   * camada 10000 e a Central fica em 11000, então o modal nascia ATRÁS dela.
   * Foi para produção assim, e quem encontrou foi o proprietário.
   *
   * Um teste que confere marcação não prova comportamento. Estes clicam e
   * exigem o resultado visível na tela. */
  const modalDeEstudo = (page: Page) => page.locator('.study-mode-popup');

  async function clicarEEsperarModal(page: Page, seletor: string) {
    await page.locator(seletor).click();
    await expect(modalDeEstudo(page), 'o modal de estudo precisa aparecer').toHaveCount(1, { timeout: 8000 });
  }

  test('clicar em estudar por eixo abre o seletor à vista', async ({ page }) => {
    await abrirCentral(page, semear(6, 4));

    const principal = page.locator('.nqd-study-primary');
    await expect(principal, 'a seção precisa abrir com uma ação').toHaveCount(1);
    await expect(principal).toContainText(/eixo/i);

    await clicarEEsperarModal(page, '.nqd-study-primary');

    // A Central precisa sair de cena: modal atrás dela é o mesmo que nada.
    await expect(page.locator('#nqDashboard'), 'a Central precisa fechar ao começar a estudar').toBeHidden();
    await expect(modalDeEstudo(page)).toBeVisible();
  });

  test('clicar em revisar abre a sessão, com a contagem certa no botão', async ({ page }) => {
    await abrirCentral(page, semear(6, 4));

    const revisar = page.locator('.nqd-study-secondary');
    await expect(revisar, 'com vencidas, a revisão precisa estar à vista').toHaveCount(1);
    await expect(revisar).toContainText('6');

    await revisar.click();
    await page.waitForTimeout(600);

    // startSRReviewAll seleciona todos os eixos e entra direto na sessão —
    // sem cair no aviso "Selecione pelo menos um eixo".
    const entrou = await page.evaluate(() => ({
      central: !!document.getElementById('nqDashboard') && getComputedStyle(document.getElementById('nqDashboard')!).display !== 'none',
      avisoDeEixo: document.body.innerText.includes('Selecione pelo menos um eixo'),
      sessao: !!document.querySelector('.study-mode-popup, .study-mode-page, #studyModePage'),
    }));
    expect(entrou.avisoDeEixo, 'revisar não pode pedir escolha de eixo').toBe(false);
    expect(entrou.central, 'a Central precisa fechar ao começar a revisão').toBe(false);
    expect(entrou.sessao, 'a sessão de revisão precisa aparecer').toBe(true);
  });

  test('sem nada vencido, o botão de revisar não existe', async ({ page }) => {
    // Botão que não faz nada ensina a ignorar botões.
    await abrirCentral(page, semear(0, 5));

    await expect(page.locator('.nqd-study-primary')).toHaveCount(1);
    await expect(
      page.locator('.nqd-study-secondary'),
      'sem vencidas não pode haver botão de revisar',
    ).toHaveCount(0);
  });

  test('sem histórico, a seção convida sem mostrar número algum', async ({ page }) => {
    await abrirCentral(page, async (p) => {
      await p.evaluate(({ c, s }) => { localStorage.removeItem(c); localStorage.removeItem(s); }, { c: CARDS, s: STATS });
    });

    const secao = page.locator('.nqd-memory-section');
    await expect(secao, 'a seção precisa existir mesmo sem histórico').toHaveCount(1);
    await expect(secao.locator('.nqd-study-primary')).toHaveCount(1);
    // Nenhuma métrica: zero aqui leria como dívida antes de haver o que dever.
    await expect(secao.locator('.nqd-metric-value'), 'sem histórico não se mostra número').toHaveCount(0);
    await expect(secao).not.toContainText('0 ');
  });

  test('a estimativa de tempo aparece com ritmo medido', async ({ page }) => {
    // 60 respostas em 2700s = 45s por questão; 6 vencidas ≈ 5 min.
    await abrirCentral(page, semear(6, 0));
    await expect(page.locator('.nqd-study-secondary')).toContainText(/\d+ min/);
  });

  test('sem ritmo medido, a estimativa se cala em vez de chutar', async ({ page }) => {
    await abrirCentral(page, async (p) => {
      await semear(6, 0)(p);
      // Amostra pequena demais para uma média significar algo.
      await p.evaluate((s) => {
        const st = JSON.parse(localStorage.getItem(s) || '{}');
        st.timeStats = { totalTime: 90, questionCount: 2 };
        localStorage.setItem(s, JSON.stringify(st));
      }, STATS);
    });

    const revisar = page.locator('.nqd-study-secondary');
    await expect(revisar).toHaveCount(1);
    await expect(revisar, 'com 2 respostas não existe ritmo — a estimativa tem de sumir').not.toContainText(/min/);
  });

  test('não afirma fraqueza — a classificação por palavra-chave não sustenta isso', async ({ page }) => {
    // Congela a recusa deliberada até o NQ-10 entregar competência curada.
    await abrirCentral(page, semear(6, 4));
    const texto = (await page.locator('.nqd-memory-section').textContent()) || '';
    expect(texto).not.toMatch(/ponto fraco|sua fraqueza|você erra mais/i);
  });
});
