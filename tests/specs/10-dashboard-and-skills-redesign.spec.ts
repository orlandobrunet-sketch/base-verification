import { test, expect } from '@playwright/test';
import { injectGameState, waitForGame, isLiveEnv } from '../helpers/game';

test.describe('Dashboard, Core Skills & Layout Reset E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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
          'acido_base': { correct: 3, wrong: 1 }, // 75%
          'eletrólitos': { correct: 1, wrong: 1 }, // 50%
          'genetica': { correct: 0, wrong: 0 },
          // Fisiopatologia total: 4 correct, 2 wrong -> 66.6%
          'drc': { correct: 2, wrong: 3 } // 40%
        }
      };
      return (window as any).getCoreSkillsStats(mockStats);
    });

    // Fisiopatologia e Pesquisa (acido_base, eletrólitos, genetica, nefrologia_geral)
    const fisio = stats.find((s: any) => s.id === 'fisiopatologia_pesquisa');
    expect(fisio).toBeDefined();
    expect(fisio.correct).toBe(4);
    expect(fisio.wrong).toBe(2);
    expect(Math.round(fisio.accuracy)).toBe(67);

    // Tratamento e Farmacologia (drc, hipertensao, nefropatia_diabetica, farmacologia)
    const tratamento = stats.find((s: any) => s.id === 'tratamento_farmacologia');
    expect(tratamento).toBeDefined();
    expect(tratamento.correct).toBe(2);
    expect(tratamento.wrong).toBe(3);
    expect(Math.round(tratamento.accuracy)).toBe(40);
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

  test('clicking Treinar Ponto Fraco starts study mode with worst skill categories', async ({ page }) => {
    // Inject game state to bypass landing screen and load game screen
    await injectGameState(page);
    await waitForGame(page);

    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    
    // Inject mock detailed stats to set a worst skill (Tratamento)
    await page.evaluate(() => {
      const mockStats = {
        byCategory: {
          'acido_base': { correct: 10, wrong: 0 }, // Fisiopatologia 100%
          'drc': { correct: 1, wrong: 9 } // Tratamento 10% (Worst!)
        }
      };
      localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(mockStats));
    });

    // Open dashboard
    await page.evaluate(() => {
      (window as any).openDashboard();
    });

    // Switch to Skills tab in dashboard
    await page.click('button[data-dash-tab="skills"]');

    // Verify point fraco button is visible and click it
    const weaknessBtn = page.locator('button.nq-dash-weakness');
    await expect(weaknessBtn).toBeVisible();
    await weaknessBtn.click();

    // Verify that custom study page is opened and study selected axes contains worst skill categories
    const studyPage = page.locator('#studyModePage');
    await expect(studyPage).toBeVisible();
    
    const selectedAxes = await page.evaluate(() => {
      return Array.from((window as any)._studySelectedAxes);
    });

    // Tratamento categories: ['drc', 'hipertensao', 'nefropatia_diabetica', 'farmacologia']
    expect(selectedAxes).toContain('drc');
    expect(selectedAxes).toContain('hipertensao');
    expect(selectedAxes).toContain('nefropatia_diabetica');
    expect(selectedAxes).toContain('farmacologia');
  });

  test('clicking Skills tab renders radar chart canvas', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    
    // Open the dashboard
    await page.evaluate(() => {
      (window as any).openDashboard();
    });

    // Click the Skills tab
    await page.click('button[data-dash-tab="skills"]');

    // Wait for the radar container to contain a canvas
    const canvas = page.locator('#nqDashRadarContainer canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });
  });
});

