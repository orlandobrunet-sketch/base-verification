import { test, expect } from '@playwright/test';

test.describe('Dashboard, Core Skills & Layout Reset E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jogar/');
  });

  test('getUserTitle returns correct lore titles', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).getUserTitle === 'function');
    const titles = await page.evaluate(() => {
      return [
        (window as any).getUserTitle(10),
        (window as any).getUserTitle(30),
        (window as any).getUserTitle(100),
        (window as any).getUserTitle(200),
        (window as any).getUserTitle(600),
        (window as any).getUserTitle(1000),
        (window as any).getUserTitle(2000),
      ];
    });
    expect(titles[0]).toBe('Aspirante da Guilda 🧭');
    expect(titles[1]).toBe('Nefro-Iniciado 🛡️');
    expect(titles[2]).toBe('Escriba dos Rins ✍️');
    expect(titles[3]).toBe('Erudito do Equilíbrio 📚');
    expect(titles[4]).toBe('Patrono dos Glomérulos 🧪');
    expect(titles[5]).toBe('Conselheiro Renal 🫁');
    expect(titles[6]).toBe('Grão-Mestre da Uremia 👑');
  });

  test('getCoreSkillsStats groups and calculates correctly', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).getCoreSkillsStats === 'function');
    const stats = await page.evaluate(() => {
      const mockStats = {
        byCategory: {
          'acido_base': { correct: 3, wrong: 1 },   // 75%
          'eletrólitos': { correct: 1, wrong: 1 },  // 50%
          // Hidroeletrolítico e ácido-base: 4 certas, 2 erradas -> 66,6%
          'drc': { correct: 2, wrong: 3 },          // 40%
          'hipertensao': { correct: 0, wrong: 0 },
          'glomerular': { correct: 5, wrong: 5 }    // 50%
        }
      };
      return (window as any).getCoreSkillsStats(mockStats);
    });

    // Os eixos passaram a ser domínios clínicos (v14.53): sódio/potássio e
    // ácido-base deixaram de ser "Fisiopatologia & Pesquisa", e glomerular
    // deixou de ser medida dentro do eixo de transplante.
    const hidro = stats.find((s: any) => s.id === 'hidroeletrolitico_acidobase');
    expect(hidro).toBeDefined();
    expect(hidro.correct).toBe(4);
    expect(hidro.wrong).toBe(2);
    expect(Math.round(hidro.accuracy)).toBe(67);

    const drc = stats.find((s: any) => s.id === 'drc_nefroprotecao');
    expect(drc).toBeDefined();
    expect(drc.correct).toBe(2);
    expect(drc.wrong).toBe(3);
    expect(Math.round(drc.accuracy)).toBe(40);

    // Glomerulopatia tem eixo próprio e não contamina o de transplante.
    const glomerular = stats.find((s: any) => s.id === 'glomerulopatias');
    expect(glomerular).toBeDefined();
    expect(glomerular.correct).toBe(5);

    const transplante = stats.find((s: any) => s.id === 'transplante');
    expect(transplante).toBeDefined();
    expect(transplante.correct).toBe(0);
  });

  test('confirming difficulty clears rd-game-over from body', async ({ page }) => {
    await page.evaluate(() => {
      document.body.classList.add('rd-game-over', 'boss-battle-mode');
      (window as any)._pendingDiff = 'normal';
      (window as any)._confirmDiff(false);
    });
    const classes = await page.evaluate(() => Array.from(document.body.classList));
    expect(classes).not.toContain('rd-game-over');
    expect(classes).not.toContain('boss-battle-mode');
  });

  // Dois cenários desta suíte foram substituídos pela Central de Comando (v14.50) e
  // vivem agora em specs/21-dashboard-command-center.spec.ts, sob o contrato novo:
  //
  // - "clicking Treinar Ponto Fraco starts study mode with worst skill categories"
  //   afirmava que o botão selecionava o balde inteiro de competência
  //   (drc + hipertensao + nefropatia_diabetica + farmacologia). O redesign passou a
  //   treinar exatamente a lacuna exibida; ver "abre a recomendação exata de menor
  //   desempenho em vez de selecionar todos os temas", que exige _studySelectedAxes === ['drc'].
  //
  // - "clicking Skills tab renders radar chart canvas" afirmava #nqDashRadarContainer.
  //   O radar foi removido por exibir 0% onde não havia amostra; ver "não converte
  //   competência sem amostra em desempenho de zero por cento", que exige "—" e
  //   "Sem precisão calculada" nas competências sem dado.
});

