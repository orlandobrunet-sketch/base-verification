import { test, expect, type Page } from '@playwright/test';

/**
 * NQ-01, primeiro item: nenhuma conta herda dados de outra no mesmo aparelho.
 *
 * O logout chamava clearLocalProgress(), que limpava save, estatísticas e
 * conquistas — mas doze chaves ficavam para trás. Quem entrasse depois na mesma
 * máquina herdava histórico de questões respondidas, votos de dificuldade,
 * padrões de erro, avaliações, favoritos e conhecimento acumulado de quem saiu.
 *
 * A pior era 'nq-pending-leaderboard': uma pontuação ainda não enviada da conta
 * anterior seria publicada no ranking global pela conta seguinte.
 *
 * O teste não faz login real — exercita o contrato de limpeza diretamente, que
 * é onde o defeito vivia. Login de verdade é de outro nível de teste.
 */

// Tudo que pertence à CONTA e não pode sobreviver ao logout.
const CHAVES_DE_CONTA: Record<string, string> = {
  'nefroquest-save': '{"xp":9999}',
  'nefroquest-detailed-stats': '{"acertos":42}',
  'nefroquest-achievements': '["primeira"]',
  'nefroquest-sr-data': '{"1e5e88e9":{"stability":9}}',
  'nefroquest-all-answered-qids': '["1e5e88e9","66b811c3"]',
  'nefroquest-difficulty-votes': '{"1e5e88e9":"hard"}',
  'nefroquest-error-reasons': '{"1e5e88e9":"anchoring"}',
  'nefroquest-rated-questions': '["1e5e88e9"]',
  'nefroquest-recommended-difficulty': 'hard',
  'nefroquest-ritual-done': '1',
  'nefroquest_total_accumulated_knowledge': '820',
  'nefroquest-minigame-notified': '1',
  'nq-bib-favorites': '["cni_nephrotoxicity_naesens"]',
  'nq-pending-leaderboard': '{"score":7300,"player_name":"Conta Anterior"}',
  'nq-nickname-asked': '1',
  'nq_last_study': '2026-08-21',
  'unlockedArticles': '["a1"]',
  'nq-unlocked-refs': '["r1"]',
  'nq-acidbase-progress': '{"caso":7}',
  'nefroquest-arqui-defeated': '1',
  'nefroquest-hardcore-completed': '1',
  'nefroquest-badge-history': '{"1":1}',
  'nefroquest-journey-count': '3',
};

// Preferências do APARELHO — precisam sobreviver.
const CHAVES_DE_APARELHO: Record<string, string> = {
  'nefroquest-music': 'off',
  'nefroquest-music-vol': '0.15',
  'nefroquest-sound': 'off',
  'nefroquest-sfx-vol': '0.3',
  'nq_notif_enabled': '1',
  'pwa-dismissed': '1',
  'nq-sw-version': '14.78',
};

async function abrirApp(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).clearLocalProgress === 'function');
}

test.describe('Isolamento de conta no mesmo aparelho', () => {
  test('a saída de uma conta não deixa nenhum dado pedagógico para a próxima', async ({ page }) => {
    await abrirApp(page);

    const sobreviventes = await page.evaluate((dados) => {
      for (const [chave, valor] of Object.entries(dados)) localStorage.setItem(chave, valor);
      (window as any).clearLocalProgress();
      return Object.keys(dados).filter((chave) => localStorage.getItem(chave) !== null);
    }, CHAVES_DE_CONTA);

    expect(sobreviventes, `estas chaves de conta sobreviveram ao logout: ${sobreviventes.join(', ')}`).toEqual([]);
  });

  test('a pontuação pendente da conta anterior não pode ser publicada pela próxima', async ({ page }) => {
    await abrirApp(page);

    const pendente = await page.evaluate(() => {
      localStorage.setItem('nq-pending-leaderboard', JSON.stringify({ score: 7300, player_name: 'Conta Anterior' }));
      (window as any).clearLocalProgress();
      return localStorage.getItem('nq-pending-leaderboard');
    });

    expect(pendente, 'pontuação pendente sobrevivendo ao logout entra no ranking pela conta errada').toBeNull();
  });

  test('as preferências do aparelho sobrevivem — trocar de conta não devolve o som no máximo', async ({ page }) => {
    await abrirApp(page);

    const perdidas = await page.evaluate((dados) => {
      for (const [chave, valor] of Object.entries(dados)) localStorage.setItem(chave, valor);
      (window as any).clearLocalProgress();
      return Object.entries(dados)
        .filter(([chave, valor]) => localStorage.getItem(chave) !== valor)
        .map(([chave]) => chave);
    }, CHAVES_DE_APARELHO);

    expect(perdidas, `estas preferências do aparelho foram apagadas indevidamente: ${perdidas.join(', ')}`).toEqual([]);
  });

  test('nenhuma chave do app fica fora da classificação conta/aparelho', async ({ page }) => {
    await abrirApp(page);

    // Um inventário que não acompanha o código é pior que nenhum: a chave nova
    // de amanhã entra sem ninguém decidir se ela pertence à conta ou ao
    // aparelho, e o vazamento volta calado. Aqui a falha é ruidosa.
    const naoClassificadas = await page.evaluate(({ conta, aparelho }) => {
      const conhecidas = new Set([...Object.keys(conta), ...Object.keys(aparelho)]);
      for (const chave of Object.keys(conta)) localStorage.setItem(chave, '1');
      for (const chave of Object.keys(aparelho)) localStorage.setItem(chave, '1');
      return Object.keys(localStorage).filter((chave) => {
        if (conhecidas.has(chave)) return false;
        // Ignora o que não é do app (extensões, Supabase, Sentry).
        return /^(nefroquest|nq[-_])/i.test(chave);
      });
    }, { conta: CHAVES_DE_CONTA, aparelho: CHAVES_DE_APARELHO });

    expect(
      naoClassificadas,
      `chaves do app sem classificação conta/aparelho: ${naoClassificadas.join(', ')} — decida a qual metade pertencem e acrescente à lista deste teste`,
    ).toEqual([]);
  });
});
