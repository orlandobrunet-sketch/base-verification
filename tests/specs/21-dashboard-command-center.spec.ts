import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SAVE = {
  schemaVersion: 6,
  level: 3,
  xp: 84,
  xpToNext: 240,
  score: 1682,
  lives: 4,
  maxLives: 4,
  streak: 2,
  gold: 271,
  difficulty: 'normal',
  correctTotal: 32,
  character: 'nephros',
  selectedCharacter: 'nephros',
  gameStarted: true,
  gameOver: false,
  idx: 6,
  queueIds: [],
  recentIds: [],
  timestamp: Date.now() - 60 * 60 * 1000,
};

const DETAILED_STATS = {
  version: 1,
  totalQuestions: 30,
  totalCorrect: 20,
  totalWrong: 10,
  byTopic: {},
  byCategory: {
    acido_base: { correct: 9, wrong: 1 },
    drc: { correct: 2, wrong: 8 },
    dialise: { correct: 5, wrong: 5 },
  },
  questionHistory: [],
  dailyActivity: {
    '2026-08-10': { count: 12, correct: 8, time: 360 },
    '2026-08-11': { count: 8, correct: 6, time: 210 },
  },
  timeStats: { totalTime: 570, questionCount: 20 },
  mostMissed: {},
  syncedMastered: [],
};

async function openCommandCenter(page: Page, options: { sparse?: boolean } = {}) {
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics());
  await page.evaluate(({ save, stats, sparse }) => {
    localStorage.clear();
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(sparse ? {
      ...stats,
      totalQuestions: 2,
      totalCorrect: 1,
      totalWrong: 1,
      byCategory: { drc: { correct: 1, wrong: 1 } },
      dailyActivity: {},
    } : stats));
    const ids = ((window as any).questionBank || []).slice(0, 2).map((question: any) => String(question.id || question.qid));
    localStorage.setItem('nefroquest-sr-data', JSON.stringify({
      [ids[0]]: { due: Date.now() - 86_400_000, interval: 3, reps: 2 },
      [ids[1]]: { due: Date.now() + 86_400_000, interval: 3, reps: 2 },
      orphaned_question: { due: Date.now() - 86_400_000, interval: 3, reps: 2 },
    }));
  }, { save: SAVE, stats: DETAILED_STATS, sparse: !!options.sparse });

  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 15_000 });
}

test.describe('Central de Comando do aprendizado', () => {
  test('apresenta a entrada do Átrio como Central de Comando', async ({ page }) => {
    await page.goto('/jogar/');
    await expect(page.locator('button[data-atrium-route="dashboard"]')).toContainText('Central de Comando');
    await expect(page.locator('#welcomeProfilePopup [data-action="openDashboard"]')).toContainText('Central de Comando');
  });

  test('abre como página interna, preserva as seis áreas e mostra uma única ação principal', async ({ page }) => {
    await openCommandCenter(page);

    const dashboard = page.locator('#nqDashboard');
    await expect(dashboard).toHaveClass(/nq-command-center/);
    await expect(dashboard).not.toHaveAttribute('aria-modal', 'true');
    await expect(page.getByRole('navigation', { name: 'Áreas da Central de Comando' })).toBeVisible();

    const tabs = dashboard.locator('[data-dash-tab]');
    await expect(tabs).toHaveCount(6);
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(dashboard.locator('[data-nqd-primary="true"]')).toHaveCount(1);
    await expect(dashboard.locator('[data-nqd-primary="true"]')).toContainText('Retomar jornada');
    await expect(dashboard.locator('[data-action="_dashResumeJourney"]')).toHaveCount(1);
    await expect(dashboard.locator('.nqd-plan-item')).toHaveCount(3);
    await expect(dashboard.locator('.nqd-attention')).toContainText('10 respostas');

    const box = await dashboard.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.width)).toBe(1280);
    expect(Math.round(box!.height)).toBe(page.viewportSize()!.height);
  });

  test('não diagnostica lacuna com amostra insuficiente e conta apenas revisões agendadas vencidas', async ({ page }) => {
    await openCommandCenter(page, { sparse: true });

    const dashboard = page.locator('#nqDashboard');
    await expect(dashboard.locator('.nqd-attention')).toContainText('foco de treino aparecerá');
    await expect(dashboard.locator('.nqd-attention')).not.toContainText('Diagnóstico & Investigação');
    await expect(dashboard.locator('[data-plan-kind="review"]')).toContainText('1 revisão agendada vencida');
    await expect(dashboard).not.toContainText('Tendência');
    await expect(dashboard).not.toContainText('conquista recente');
  });

  test('no nível máximo não projeta um nível inexistente', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(save => {
      localStorage.clear();
      localStorage.setItem('nefroquest-save', JSON.stringify({ ...save, level: 10, xp: 0, xpToNext: 1 }));
      (window as any).openDashboard();
    }, SAVE);
    const dashboard = page.locator('#nqDashboard[data-dashboard-state="ready"]');
    await expect(dashboard).toBeVisible({ timeout: 15_000 });
    await expect(dashboard.locator('.nqd-next-form')).toContainText('Forma máxima');
    await expect(dashboard.locator('.nqd-milestone')).not.toContainText('Nível 11');
  });

  test('preserva o Set público de eixos após reabrir o seletor de estudo', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).resumeSavedStudyMode === 'function');
    await page.evaluate(() => (window as any)._loadTopics());
    const result = await page.evaluate(() => {
      const original = (window as any)._studySelectedAxes;
      (window as any).showAxesSelector();
      const sameAfterSelector = original === (window as any)._studySelectedAxes;
      document.querySelectorAll('.study-mode-popup').forEach(element => element.remove());
      return { sameAfterSelector };
    });
    expect(result.sameAfterSelector).toBe(true);
  });

  test('retoma estudo na ordem salva e restaura o estado pedagógico sem confirmação destrutiva', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).resumeSavedStudyMode === 'function');
    await page.evaluate(() => (window as any)._loadTopics());
    const saved = await page.evaluate(() => {
      const questions = ((window as any).questionBank || []).slice(0, 3);
      const ids = questions.map((question: any) => String(question.id || question.qid));
      const state = {
        questions: [ids[2], ids[0], ids[1]], index: 1, correct: 1, wrong: 1,
        axisStats: { drc: { correct: 1, wrong: 1 } }, savedAt: Date.now(),
      };
      localStorage.setItem('nefroquest-study-state', JSON.stringify(state));
      return state;
    });
    const confirmCalls = await page.evaluate(() => {
      let calls = 0;
      window.confirm = () => { calls += 1; return false; };
      (window as any).resumeSavedStudyMode();
      return calls;
    });
    expect(confirmCalls).toBe(0);
    await expect(page.locator('#studyModePage')).toBeVisible();
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem('nefroquest-study-state')!))).toMatchObject(saved);
  });

  test('revisão do plano abre somente cards agendados vencidos, sem perguntas inéditas', async ({ page }) => {
    await openCommandCenter(page);
    await page.locator('[data-action="_dashStartSRStudy"]').click();
    await expect(page.locator('#studyModePage')).toBeVisible();
    await expect(page.locator('#studyModePage')).toContainText('1/1');
  });

  test('oferece navegação por teclado, troca de painel e devolve o foco ao fechar', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => {
      const opener = document.createElement('button');
      opener.id = 'dashboardTestOpener';
      opener.textContent = 'Abrir Central';
      document.body.appendChild(opener);
      opener.focus();
      (window as any).openDashboard();
    });
    const opener = page.locator('#dashboardTestOpener');
    await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 15_000 });

    const overviewTab = page.getByRole('tab', { name: 'Visão geral' });
    await overviewTab.focus();
    await page.keyboard.press('ArrowRight');
    const skillsTab = page.getByRole('tab', { name: 'Competências' });
    await expect(skillsTab).toBeFocused();
    await expect(skillsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Competências' })).toBeVisible();
    await expect(page.locator('#nqDashRadarContainer')).toBeVisible();

    const focusBounds = await page.evaluate(() => {
      const root = document.getElementById('nqDashboard')!;
      const focusable = [...root.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
        .filter(element => element.tabIndex >= 0 && element.offsetParent !== null && !element.closest('[hidden]'));
      const last = focusable.at(-1)!;
      last.dataset.focusTrapEnd = 'true';
      last.focus();
      return { firstId: focusable[0].id, lastTag: last.tagName };
    });
    expect(focusBounds.lastTag).toBeTruthy();
    const lastFocusable = page.locator('#nqDashboard [data-focus-trap-end="true"]');
    await page.keyboard.press('Tab');
    await expect(page.locator(`#${focusBounds.firstId}`)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(lastFocusable).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('#nqDashboard')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('mantém todas as áreas acessíveis e rotuladas sem transformar o mapa em conteúdo bloqueado', async ({ page }) => {
    await openCommandCenter(page);

    const expected = [
      ['Visão geral', 'Sala de Conduta'],
      ['Competências', 'Competências'],
      ['Mapa', 'Mapa de Domínio'],
      ['Conquistas', 'Conquistas'],
      ['Grimório', 'Grimório de Conhecimento'],
      ['Ranking', 'Ranking da Ordem'],
    ];

    for (const [tabName, heading] of expected) {
      await page.getByRole('tab', { name: tabName, exact: true }).click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }

    await page.getByRole('tab', { name: 'Mapa', exact: true }).click();
    await expect(page.getByRole('tabpanel', { name: 'Mapa' })).not.toContainText('Bloqueada');
    await expect(page.getByRole('tabpanel', { name: 'Mapa' })).toContainText('Não explorada');
  });

  test('devolve desejo às conquistas com os cinco badges reais e sem progresso decorativo', async ({ page }) => {
    await openCommandCenter(page);
    const dashboard = page.locator('#nqDashboard');
    await expect(dashboard.locator('.nqd-conduct-spine')).toHaveCount(0);

    await page.getByRole('tab', { name: 'Conquistas', exact: true }).click();
    const achievements = page.getByRole('tabpanel', { name: 'Conquistas' });
    await expect(achievements.locator('.nqd-badge-path img')).toHaveCount(5);
    for (let index = 1; index <= 5; index += 1) {
      await expect(achievements.locator(`.nqd-badge-path img[src="assets/badges/badge${index}.png"]`)).toBeVisible();
    }
    await expect(achievements.locator('.nqd-achievement-spotlight')).toContainText('Faltam 8 acertos');
    await expect(achievements.locator('.nqd-achievement-mark img[src="assets/titulodecampeao.png"]')).toHaveCount(1);
    await expect(achievements.locator('.nqd-achievement-filter[aria-pressed="true"]')).toHaveText('Em andamento');
    const visibleProgress = await achievements.locator('[data-achievement-status="progress"]:visible').count();
    await achievements.getByRole('button', { name: 'Conquistadas' }).click();
    await expect(achievements.locator('.nqd-achievement-filter[aria-pressed="true"]')).toHaveText('Conquistadas');
    await expect(achievements.locator('[data-achievement-status="progress"]:visible')).toHaveCount(0);
    expect(visibleProgress).toBeGreaterThan(0);
  });

  test('organiza o Grimório em coleções com ordenação real e sem repetir Referência', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => (window as any)._loadTopics());
    await page.evaluate(() => {
      const refKeys = [...new Set(((window as any).questionBank || []).flatMap((question: any) => Array.isArray(question.r) ? question.r : []))].slice(0, 3);
      localStorage.setItem('nq-unlocked-refs', JSON.stringify(refKeys));
      localStorage.setItem('unlockedArticles', JSON.stringify([0, 1, 2]));
      (window as any).openDashboard();
    });
    await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('tab', { name: 'Grimório', exact: true }).click();
    const library = page.getByRole('tabpanel', { name: 'Grimório' });
    await expect(library.getByRole('tab', { name: 'Pergaminhos' })).toBeVisible();
    await expect(library.getByRole('option', { name: 'Mais recentes' })).toBeAttached();
    await expect(library.locator('.nqd-library-item .nqd-state', { hasText: /^Referência$/ })).toHaveCount(0);
    await expect(library.locator('.nqd-library-item').first()).toHaveAttribute('data-library-year', /\d{4}/);
  });

  test('em 360×800 não cria overflow, mantém a ação principal na primeira dobra e alvos de toque adequados', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openCommandCenter(page);

    const metrics = await page.evaluate(() => {
      const primary = document.querySelector<HTMLElement>('[data-nqd-primary="true"]');
      const navTargets = [...document.querySelectorAll<HTMLElement>('#nqDashboard [data-dash-tab]')];
      return {
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        primaryBottom: primary?.getBoundingClientRect().bottom ?? 9999,
        minTargetHeight: Math.min(...navTargets.map(el => el.offsetHeight)),
      };
    });

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
    expect(metrics.primaryBottom).toBeLessThanOrEqual(800);
    expect(metrics.minTargetHeight).toBeGreaterThanOrEqual(44);
  });

  test('hover e foco preservam a geometria do conteúdo e mantêm foco visível', async ({ page }) => {
    await openCommandCenter(page);
    const action = page.locator('[data-nqd-primary="true"]');
    const actionBefore = await action.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    await action.hover();
    await page.waitForTimeout(180);
    const actionAfterHover = await action.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    await action.focus();
    const focusStyle = await action.evaluate(element => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    const actionAfterFocus = await action.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    expect(actionAfterHover.width).toBeCloseTo(actionBefore.width, 1);
    expect(actionAfterHover.height).toBeCloseTo(actionBefore.height, 1);
    expect(actionAfterFocus.width).toBeCloseTo(actionBefore.width, 1);
    expect(actionAfterFocus.height).toBeCloseTo(actionBefore.height, 1);
    expect(focusStyle.outlineStyle).not.toBe('none');
    expect(parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(1);
  });

  test('toque troca de área sem duplicar a navegação', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openCommandCenter(page);
    const skillsTab = page.getByRole('tab', { name: 'Competências', exact: true });
    if (testInfo.project.name === 'mobile') await skillsTab.tap();
    else await skillsTab.click();
    await expect(skillsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Competências' })).toBeVisible();
    await expect(page.locator('#nqDashboard .nqd-nav [role="tablist"]')).toHaveCount(1);
  });

  test('prefers-reduced-motion remove movimento e nenhuma animação visível é infinita', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCommandCenter(page);

    const animated = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#nqDashboard *')]
      .filter(el => {
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.animationName !== 'none';
      })
      .map(el => ({ className: el.className, animation: getComputedStyle(el).animationName })));

    expect(animated).toEqual([]);
  });

  test('não introduz violações sérias ou críticas de acessibilidade', async ({ page }) => {
    test.setTimeout(90_000);
    await openCommandCenter(page);
    for (const tabName of ['Visão geral', 'Competências', 'Mapa', 'Conquistas', 'Grimório', 'Ranking']) {
      const tab = page.getByRole('tab', { name: tabName, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');

      const results = await new AxeBuilder({ page }).include('#nqDashboard').analyze();
      const blocking = results.violations.filter(violation => violation.impact === 'serious' || violation.impact === 'critical');
      expect(blocking, `${tabName}: ${blocking.map(violation => `${violation.id}: ${violation.help}`).join('\n')}`).toEqual([]);
    }
  });
});
