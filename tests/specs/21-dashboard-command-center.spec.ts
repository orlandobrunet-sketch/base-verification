import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { injectGameState } from '../helpers/game';
import { saveBase } from '../helpers/fixtures';

/**
 * Jogador mais atrás na jornada que o save padrão — nível 3, 32 acertos. Os
 * cenários da Central dependem desses números, então eles ficam explícitos.
 *
 * DETAILED_STATS abaixo NÃO usa `statsBase`: tem forma própria (byTopic,
 * questionHistory, timeStats, mostMissed) que os outros specs não exercitam.
 * Forçá-lo no fixture comum daria consolidação no papel e divergência no uso.
 */
const SAVE = saveBase({
  level: 3, xp: 84, xpToNext: 240, score: 1682,
  streak: 2, gold: 271, correctTotal: 32, idx: 6,
  timestamp: Date.now() - 60 * 60 * 1000,
});

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

type CommandCenterOptions = {
  sparse?: boolean;
  compStats?: Record<string, { c: number; t: number }>;
  rawStorage?: Record<string, string>;
};

const DASHBOARD_TABS = [
  { id: 'overview', name: 'Visão geral' },
  { id: 'skills', name: 'Competências' },
  { id: 'mapa', name: 'Mapa clínico' },
  { id: 'achievements', name: 'Conquistas' },
  { id: 'library', name: 'Grimório' },
  { id: 'ranking', name: 'Ranking' },
] as const;

async function gotoGame(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
}

async function openCommandCenter(page: Page, options: CommandCenterOptions = {}) {
  await gotoGame(page);
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics());
  await page.evaluate(({ save, stats, sparse, compStats, rawStorage }) => {
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
    if (compStats) localStorage.setItem('nefroquest-comp-stats', JSON.stringify(compStats));
    Object.entries(rawStorage || {}).forEach(([key, value]) => localStorage.setItem(key, value));
  }, {
    save: SAVE,
    stats: DETAILED_STATS,
    sparse: !!options.sparse,
    compStats: options.compStats || null,
    rawStorage: options.rawStorage || null,
  });

  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 15_000 });
}

async function waitForDashboardTabTerminal(page: Page, tabId: typeof DASHBOARD_TABS[number]['id']) {
  const dashboard = page.locator('#nqDashboard');
  if (tabId === 'mapa') {
    await expect(dashboard.locator('#nqDashMapResult')).not.toHaveText('');
  } else if (tabId === 'achievements') {
    await expect.poll(() => dashboard.locator('.nqd-badge-path img').evaluateAll(images => images.every(image => {
      const img = image as HTMLImageElement;
      return img.complete && img.naturalWidth > 0;
    }))).toBe(true);
  } else if (tabId === 'library') {
    // O Grimório tem DOIS desfechos legítimos: com acervo desenha o resumo e a
    // estante; vazio desenha só o bloco de ação. Exigir o resumo sempre fazia
    // este helper esperar um elemento que o vazio deixou de renderizar de
    // propósito, travando a aba num estado que nunca chegaria.
    await expect(dashboard.locator('.nqd-library-overview, [data-library-empty]').first()).toBeVisible();
  } else if (tabId === 'ranking') {
    await expect(dashboard.locator('.nqd-ranking-skeleton')).toHaveCount(0, { timeout: 20_000 });
  }
}

test.describe('Central de Comando do aprendizado', () => {
  test('mantém assets do dashboard disponíveis offline sem duplicar chaves versionadas', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'O contrato do SW precisa de uma única execução Chromium.');
    await page.goto('/offline.html');
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
    });
    if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
      await page.reload();
    }
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

    const assetPath = '/styles/lumen/dashboard.css';
    await page.evaluate(async path => {
      for (const cacheName of await caches.keys()) {
        if (!cacheName.startsWith('nefroquest-v')) continue;
        const cache = await caches.open(cacheName);
        for (const request of await cache.keys()) {
          if (new URL(request.url).pathname === path) await cache.delete(request);
        }
      }
    }, assetPath);

    const online = await page.evaluate(async path => {
      const response = await fetch(`${path}?v=cache-contract-a`);
      return { ok: response.ok, hasDashboardCss: (await response.text()).includes('#nqDashboard') };
    }, assetPath);
    expect(online).toEqual({ ok: true, hasDashboardCss: true });
    const cachedAfterOnline = await page.evaluate(async path => {
      const urls: string[] = [];
      for (const cacheName of await caches.keys()) {
        if (!cacheName.startsWith('nefroquest-v')) continue;
        const cache = await caches.open(cacheName);
        for (const request of await cache.keys()) {
          const url = new URL(request.url);
          if (url.pathname === path) urls.push(url.href);
        }
      }
      return urls;
    }, assetPath);
    expect(cachedAfterOnline).toHaveLength(1);
    expect(new URL(cachedAfterOnline[0]).search).toBe('');

    await context.setOffline(true);
    const offline = await page.evaluate(async path => {
      try {
        const response = await fetch(`${path}?v=cache-contract-b`);
        return { ok: response.ok, hasDashboardCss: (await response.text()).includes('#nqDashboard') };
      } catch (error) {
        return { ok: false, hasDashboardCss: false };
      }
    }, assetPath);
    const badgePaths = Array.from({ length: 5 }, (_, index) => `/assets/badges/badge${index + 1}-384.jpg`);
    const precachedBadges = await page.evaluate(async paths => Promise.all(paths.map(async path => {
      try {
        const response = await fetch(path);
        const blob = await response.blob();
        return { path, ok: response.ok, type: response.headers.get('content-type') || blob.type, bytes: blob.size };
      } catch (error) {
        return { path, ok: false, type: '', bytes: 0 };
      }
    })), badgePaths);
    await context.setOffline(false);

    expect(offline).toEqual({ ok: true, hasDashboardCss: true });
    expect(precachedBadges.every(badge => badge.ok && badge.type.startsWith('image/jpeg') && badge.bytes > 1_000)).toBe(true);
    const cachedAssetUrls = await page.evaluate(async path => {
      const urls: string[] = [];
      for (const cacheName of await caches.keys()) {
        if (!cacheName.startsWith('nefroquest-v')) continue;
        const cache = await caches.open(cacheName);
        for (const request of await cache.keys()) {
          const url = new URL(request.url);
          if (url.pathname === path) urls.push(url.href);
        }
      }
      return urls;
    }, assetPath);
    expect(cachedAssetUrls).toHaveLength(1);
    expect(new URL(cachedAssetUrls[0]).search).toBe('');
  });

  test('apresenta a entrada do Átrio como Central de Comando', async ({ page }) => {
    await gotoGame(page);
    await expect(page.locator('button[data-atrium-route="dashboard"]')).toContainText('Central de Comando');
    await expect(page.locator('#welcomeProfilePopup [data-action="openDashboard"]')).toContainText('Central de Comando');
  });

  test('trackQuestionAnswer registra cada competência da questão exatamente uma vez', async ({ page }) => {
    await gotoGame(page);
    await page.waitForFunction(() => typeof (window as any).trackQuestionAnswer === 'function');
    await page.evaluate(() => (window as any)._loadTopics());

    const result = await page.evaluate(() => {
      const bank = (window as any).questionBank || [];
      const getCompIds = (window as any).nqGetCompIds;
      const question = bank.find((candidate: any) => {
        const qid = candidate.qid || candidate.id;
        return qid && typeof getCompIds === 'function' && getCompIds(qid).length > 0;
      });
      if (!question) throw new Error('O banco não forneceu uma questão classificável para o teste.');

      const ids = [...new Set(getCompIds(question.qid || question.id))];
      localStorage.removeItem('nefroquest-comp-stats');
      (window as any).trackQuestionAnswer(question, true, 12);
      const stored = JSON.parse(localStorage.getItem('nefroquest-comp-stats') || '{}');
      localStorage.setItem('nefroquest-comp-stats', JSON.stringify({ [ids[0]]: [] }));
      (window as any).trackQuestionAnswer(question, true, 12);
      const repaired = JSON.parse(localStorage.getItem('nefroquest-comp-stats') || '{}');
      return { ids, stored, repaired };
    });

    expect(result.ids.length).toBeGreaterThan(0);
    expect(Object.keys(result.stored).sort()).toEqual([...result.ids].sort());
    for (const id of result.ids) expect(result.stored[id]).toEqual({ c: 1, t: 1 });
    for (const id of result.ids) expect(result.repaired[id]).toEqual({ c: 1, t: 1 });
  });

  test('trackQuestionAnswer normaliza formatos antigos sem perder containers estruturais', async ({ page }) => {
    await gotoGame(page);
    await page.waitForFunction(() => typeof (window as any).trackQuestionAnswer === 'function');
    await page.evaluate(() => (window as any)._loadTopics());

    const results = await page.evaluate(rawCases => {
      const question = ((window as any).questionBank || []).find((candidate: any) => candidate && (candidate.qid || candidate.id));
      if (!question) throw new Error('O banco não forneceu uma questão real para o teste.');
      return rawCases.map(raw => {
        localStorage.setItem('nefroquest-detailed-stats', raw);
        let threw = false;
        try {
          (window as any).trackQuestionAnswer(question, true, 12);
        } catch (error) {
          threw = true;
        }
        let stored: any = null;
        try {
          stored = JSON.parse(localStorage.getItem('nefroquest-detailed-stats') || 'null');
        } catch (error) {
          stored = null;
        }
        return {
          threw,
          object: Boolean(stored && typeof stored === 'object' && !Array.isArray(stored)),
          historyArray: Array.isArray(stored?.questionHistory),
          dailyActivityObject: Boolean(stored?.dailyActivity && typeof stored.dailyActivity === 'object' && !Array.isArray(stored.dailyActivity)),
          byTopicObject: Boolean(stored?.byTopic && typeof stored.byTopic === 'object' && !Array.isArray(stored.byTopic)),
          byCategoryObject: Boolean(stored?.byCategory && typeof stored.byCategory === 'object' && !Array.isArray(stored.byCategory)),
        };
      });
    }, [
      '[]',
      JSON.stringify({ questionHistory: {}, dailyActivity: 'x', byTopic: [] }),
    ]);

    expect(results).toEqual([
      { threw: false, object: true, historyArray: true, dailyActivityObject: true, byTopicObject: true, byCategoryObject: true },
      { threw: false, object: true, historyArray: true, dailyActivityObject: true, byTopicObject: true, byCategoryObject: true },
    ]);
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
    const primary = dashboard.locator('[data-nqd-primary="true"]:visible');
    await expect(primary).toHaveCount(1);
    await expect(primary).toHaveAttribute('data-action', /\S+/);
    await expect(primary).not.toHaveText('');
    await expect(dashboard.locator('.nqd-next-action:visible').first()).toBeVisible();

    const box = await dashboard.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.width)).toBe(page.viewportSize()!.width);
    expect(Math.round(box!.height)).toBe(page.viewportSize()!.height);
  });

  test('não diagnostica lacuna com amostra insuficiente e conta apenas revisões agendadas vencidas', async ({ page }) => {
    await openCommandCenter(page, { sparse: true });

    const dashboard = page.locator('#nqDashboard');
    await expect(dashboard.locator('[data-action-kind="gap"]')).toHaveCount(0);
    await expect(dashboard.locator('[data-action-kind="review"]')).toContainText('1 revisão agendada vencida');
    await expect(dashboard).not.toContainText('Tendência');
    await expect(dashboard).not.toContainText('conquista recente');
  });

  test('não converte competência sem amostra em desempenho de zero por cento', async ({ page }) => {
    await openCommandCenter(page, { sparse: true });
    await page.getByRole('tab', { name: 'Competências', exact: true }).click();
    await waitForDashboardTabTerminal(page, 'skills');

    const withoutSample = page.locator('#nqDashboard .nqd-skill-row:has(.nqd-no-sample)');
    expect(await withoutSample.count()).toBeGreaterThan(0);
    for (const row of await withoutSample.all()) {
      await expect(row.locator('.nqd-skill-values strong')).toHaveText('—');
      await expect(row).toContainText('Sem precisão calculada');
      await expect(row).not.toContainText('0%');
    }
  });

  test('abre a recomendação exata de menor desempenho em vez de selecionar todos os temas', async ({ page }) => {
    await openCommandCenter(page);
    await page.getByRole('tab', { name: 'Competências', exact: true }).click();
    const priority = page.locator('#nqDashboard .nqd-skill-priority');
    await expect(priority.getByRole('heading')).toHaveText('DRC');
    const cta = priority.getByRole('button', { name: 'Treinar este tema', exact: true });
    await expect(cta).toBeVisible();
    await cta.click();

    await expect(page.locator('#studyModePage')).toBeVisible();
    const selectedAxes = await page.evaluate(() => [...((window as any)._studySelectedAxes || [])]);
    expect(selectedAxes).toEqual(['drc']);
  });

  test('Escolher temas abre um seletor modal operável sem responder a questão ao fundo', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoGame(page);
    await injectGameState(page);
    const gameSnapshot = () => page.evaluate(() => ({
      answered: Boolean((window as any).state?.answered),
      currentId: (window as any).state?.current?.qid || (window as any).state?.current?.id || null,
      score: (window as any).state?.score,
      question: document.getElementById('question')?.textContent || '',
      options: [...document.querySelectorAll<HTMLButtonElement>('#options .option')].map(option => ({
        disabled: option.disabled,
        className: option.className,
      })),
    }));
    const before = await gameSnapshot();

    await page.evaluate(() => (window as any).openDashboard());
    await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('tab', { name: 'Competências', exact: true }).click();
    await page.getByRole('button', { name: 'Escolher temas', exact: true }).click();

    const dialog = page.locator('.study-mode-popup[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('#studyModePage')).toHaveCount(0);

    const trap = await dialog.evaluate(element => {
      const focusable = [...element.querySelectorAll<HTMLElement>('button:not(:disabled), [role="button"][tabindex="0"], a[href], select, input, textarea')]
        .filter(control => control.getClientRects().length && !control.closest('[hidden], [inert]'));
      const first = focusable[0];
      const last = focusable.at(-1)!;
      first.dataset.selectorTrapStart = 'true';
      last.dataset.selectorTrapEnd = 'true';
      last.focus();
      return focusable.length;
    });
    expect(trap).toBeGreaterThan(2);
    await page.keyboard.press('Tab');
    await expect(dialog.locator('[data-selector-trap-start="true"]')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.locator('[data-selector-trap-end="true"]')).toBeFocused();

    const axis = dialog.locator('#axisCardList [role="button"][aria-pressed]').first();
    await axis.focus();
    const beforePressed = await axis.getAttribute('aria-pressed');
    await axis.press('Enter');
    await expect(dialog.locator(`#${await axis.getAttribute('id')}`)).toHaveAttribute('aria-pressed', beforePressed === 'true' ? 'false' : 'true');

    await page.keyboard.press('A');
    await page.keyboard.press('1');
    expect(await gameSnapshot()).toEqual(before);
  });

  test('ignora formatos persistidos incompatíveis sem derrubar a Central', async ({ page }) => {
    test.setTimeout(60_000);
    await openCommandCenter(page, {
      rawStorage: {
        'nq-unlocked-refs': '{"unexpected":true}',
        unlockedArticles: '17',
        'nq-bib-favorites': 'null',
        'nefroquest-achievements': '{"century_club":true}',
        'nefroquest-comp-stats': '{"registro-incompleto"',
      },
    });

    const dashboard = page.locator('#nqDashboard[data-dashboard-state="ready"]');
    await expect(dashboard).toBeVisible();
    for (const tabName of ['Mapa clínico', 'Conquistas', 'Grimório']) {
      await page.getByRole('tab', { name: tabName, exact: true }).click();
      await expect(page.getByRole('tabpanel', { name: tabName })).toBeVisible();
    }
    await expect(dashboard.locator('.nqd-error')).toHaveCount(0);

    const trackingDidNotThrow = await page.evaluate(() => {
      const bank = (window as any).questionBank || [];
      const getCompIds = (window as any).nqGetCompIds;
      const question = bank.find((candidate: any) => {
        const qid = candidate.qid || candidate.id;
        return qid && typeof getCompIds === 'function' && getCompIds(qid).length > 0;
      });
      if (!question) throw new Error('O banco não forneceu uma questão classificável para o teste.');
      try {
        (window as any).trackQuestionAnswer(question, true, 12);
        return true;
      } catch (error) {
        return false;
      }
    });
    expect(trackingDidNotThrow).toBe(true);
  });

  test('no nível máximo não projeta um nível inexistente', async ({ page }) => {
    await gotoGame(page);
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
    await gotoGame(page);
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
    await gotoGame(page);
    await page.waitForFunction(() => typeof (window as any).resumeSavedStudyMode === 'function');
    await page.evaluate(() => (window as any)._loadTopics());
    const saved = await page.evaluate(() => {
      const questions = ((window as any).questionBank || []).slice(0, 3);
      const ids = questions.map((question: any) => String(question.id || question.qid));
      const state = {
        questions: [ids[2], ids[0], ids[1]], index: 1.5, correct: 1, wrong: 1,
        axisStats: { drc: { correct: 1, wrong: 1 } }, savedAt: Date.now(),
      };
      localStorage.setItem('nefroquest-study-state', JSON.stringify(state));
      return { state, expectedQuestion: questions[0].q };
    });
    const confirmCalls = await page.evaluate(() => {
      let calls = 0;
      window.confirm = () => { calls += 1; return false; };
      (window as any).resumeSavedStudyMode();
      return calls;
    });
    expect(confirmCalls).toBe(0);
    await expect(page.locator('#studyModePage')).toBeVisible();
    await expect(page.locator('#studyQuestionArea')).toContainText(saved.expectedQuestion);
    const progress = Number(await page.locator('#studyProgress').textContent());
    expect(Number.isInteger(progress)).toBe(true);
    expect(progress).toBeGreaterThanOrEqual(1);
    expect(progress).toBeLessThanOrEqual(saved.state.questions.length);
    await expect(page.locator('#studyQuestionArea .study-option-btn')).toHaveCount(4);
  });

  test('retoma estudo com índice ausente ou negativo sempre em uma pergunta válida', async ({ page }) => {
    await gotoGame(page);
    await page.waitForFunction(() => typeof (window as any).resumeSavedStudyMode === 'function');
    await page.evaluate(() => (window as any)._loadTopics());
    const fixtures = await page.evaluate(() => {
      const questions = ((window as any).questionBank || []).slice(0, 3);
      const ids = questions.map((question: any) => String(question.id || question.qid));
      const base = { questions: [ids[2], ids[0], ids[1]], correct: 0, wrong: 0, axisStats: {}, savedAt: Date.now() };
      return [
        { state: base, expectedQuestion: questions[2].q },
        { state: { ...base, index: -4 }, expectedQuestion: questions[2].q },
      ];
    });

    for (const fixture of fixtures) {
      await page.evaluate(state => {
        localStorage.setItem('nefroquest-study-state', JSON.stringify(state));
        (window as any).resumeSavedStudyMode();
      }, fixture.state);
      await expect(page.locator('#studyModePage')).toBeVisible();
      await expect(page.locator('#studyQuestionArea')).toContainText(fixture.expectedQuestion);
      const progress = Number(await page.locator('#studyProgress').textContent());
      expect(Number.isInteger(progress)).toBe(true);
      expect(progress).toBeGreaterThanOrEqual(1);
      expect(progress).toBeLessThanOrEqual(fixture.state.questions.length);
    }
  });

  test('revisão do plano abre somente cards agendados vencidos, sem perguntas inéditas', async ({ page }) => {
    await openCommandCenter(page);
    await page.locator('[data-action="_dashStartSRStudy"]').click();
    await expect(page.locator('#studyModePage')).toBeVisible();
    await expect(page.locator('#studyModePage')).toContainText('1/1');
  });

  test('oferece navegação por teclado e devolve o foco a um acionador real e visível', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoGame(page);
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.locator('[data-portal-route="guest"]').click();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    const opener = page.locator('button[data-atrium-route="dashboard"]');
    await opener.focus();
    await opener.click();
    await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 15_000 });

    const overviewTab = page.getByRole('tab', { name: 'Visão geral' });
    await overviewTab.focus();
    const tabOrientation = await overviewTab.locator('xpath=..').getAttribute('aria-orientation');
    await page.keyboard.press(tabOrientation === 'vertical' ? 'ArrowDown' : 'ArrowRight');
    const skillsTab = page.getByRole('tab', { name: 'Competências' });
    await expect(skillsTab).toBeFocused();
    await expect(skillsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Competências' })).toBeVisible();

    const focusBounds = await page.evaluate(() => {
      const root = document.getElementById('nqDashboard')!;
      const focusable = [...root.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')]
        .filter(element => element.tabIndex >= 0 && element.offsetParent !== null && !element.closest('[hidden]'));
      const first = focusable[0];
      const last = focusable.at(-1)!;
      first.dataset.focusTrapStart = 'true';
      last.dataset.focusTrapEnd = 'true';
      last.focus();
      return { lastTag: last.tagName };
    });
    expect(focusBounds.lastTag).toBeTruthy();
    const lastFocusable = page.locator('#nqDashboard [data-focus-trap-end="true"]');
    await page.keyboard.press('Tab');
    await expect(page.locator('#nqDashboard [data-focus-trap-start="true"]')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(lastFocusable).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('#nqDashboard')).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(opener).toBeVisible();
  });

  test('alcança por Tab os detalhes expansíveis do Mapa e das Conquistas', async ({ page }) => {
    await openCommandCenter(page);

    const expectTabReachable = async (target: ReturnType<Page['locator']>) => {
      await expect(target).toBeVisible();
      const predecessor = await target.evaluate(element => {
        const root = document.getElementById('nqDashboard')!;
        const focusable = [...root.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')]
          .filter(candidate => candidate.tabIndex >= 0 && candidate.offsetParent !== null && !candidate.closest('[hidden]'));
        const index = focusable.indexOf(element as HTMLElement);
        if (index <= 0) throw new Error('O detalhe não tem um controle anterior na ordem de teclado.');
        focusable[index - 1].dataset.keyboardPredecessor = 'true';
        focusable[index - 1].focus();
        return true;
      });
      expect(predecessor).toBe(true);
      await page.keyboard.press('Tab');
      await expect(target).toBeFocused();
    };

    await page.getByRole('tab', { name: 'Mapa clínico', exact: true }).click();
    await expectTabReachable(page.locator('#nqDashboard details[data-map-group]:visible > summary').first());

    await page.getByRole('tab', { name: 'Conquistas', exact: true }).click();
    await expectTabReachable(page.locator('#nqDashboard .nqd-achievement-detail:visible > summary').first());
  });

  test('isola do jogo os atalhos de resposta enquanto a Central está aberta', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoGame(page);
    await injectGameState(page);
    await expect(page.locator('#options .option')).toHaveCount(4);

    const gameSnapshot = () => page.evaluate(() => ({
      answered: Boolean((window as any).state?.answered),
      currentId: (window as any).state?.current?.qid || (window as any).state?.current?.id || null,
      score: (window as any).state?.score,
      correctTotal: (window as any).state?.correctTotal,
      question: document.getElementById('question')?.textContent || '',
      feedback: document.getElementById('feedback')?.textContent || '',
      options: [...document.querySelectorAll<HTMLButtonElement>('#options .option')].map(option => ({
        disabled: option.disabled,
        className: option.className,
      })),
      competencyStats: localStorage.getItem('nefroquest-comp-stats'),
    }));

    const before = await gameSnapshot();
    expect(before.answered).toBe(false);
    expect(before.options.every(option => !option.disabled)).toBe(true);

    await page.evaluate(() => (window as any).openDashboard());
    await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => {
      document.body.tabIndex = -1;
      document.body.focus();
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', bubbles: true, repeat: true }));
    });
    expect(await gameSnapshot()).toEqual(before);
    await page.keyboard.press('A');
    expect(await gameSnapshot()).toEqual(before);
    await page.keyboard.press('1');
    expect(await gameSnapshot()).toEqual(before);
    await page.keyboard.press('Enter');

    await expect(page.locator('#nqDashboard')).toBeVisible();
    expect(await gameSnapshot()).toEqual(before);
  });

  test('Enter no acionador real abre a Central sem avançar uma campanha já respondida', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoGame(page);
    await injectGameState(page);
    const wrongIndex = await page.evaluate(() => ((Number((window as any).state?.current?.a) || 0) + 1) % 4);
    await page.locator('#options .option').nth(wrongIndex).click();
    await expect.poll(() => page.evaluate(() => Boolean((window as any).state?.answered))).toBe(true);
    await expect(page.locator('#nextBtn')).toBeVisible();

    const gameSnapshot = () => page.evaluate(() => ({
      answered: Boolean((window as any).state?.answered),
      currentId: (window as any).state?.current?.qid || (window as any).state?.current?.id || null,
      index: (window as any).state?.idx,
      question: document.getElementById('question')?.textContent || '',
      nextVisible: Boolean(document.getElementById('nextBtn')?.getClientRects().length),
    }));
    const before = await gameSnapshot();

    const launcher = page.locator('#actionDock [data-action="openDashboard"]:visible, #mobileBottomDock [data-action="openDashboard"]:visible').first();
    await expect(launcher).toBeVisible();
    await launcher.focus();
    await launcher.press('Enter');

    await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 15_000 });
    expect(await gameSnapshot()).toEqual(before);
  });

  test('ao abrir pelo menu de perfil não devolve o foco a um botão que ficou oculto', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoGame(page);
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.locator('[data-portal-route="guest"]').click();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    const profileOpener = page.locator('#welcomeProfilePopup [data-action="openDashboard"]');
    await page.evaluate(() => {
      const opener = document.querySelector<HTMLElement>('#welcomeProfilePopup [data-action="openDashboard"]');
      opener?.classList.add('visible');
    });
    await page.locator('#welcomeProfileBtn').click();
    await expect(profileOpener).toBeVisible();
    await profileOpener.focus();
    await profileOpener.click();
    await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press('Escape');
    await expect(page.locator('#nqDashboard')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return Boolean(active
        && active.matches('[data-action="openDashboard"], [data-atrium-route="dashboard"]')
        && active.getClientRects().length
        && !active.closest('.profile-popup:not(.open)'));
    })).toBe(true);
  });

  test('mantém todas as áreas acessíveis e rotuladas sem transformar o mapa em conteúdo bloqueado', async ({ page }) => {
    await openCommandCenter(page);

    const expected = [
      ['Visão geral', 'Sala de Conduta'],
      ['Competências', 'Competências'],
      ['Mapa clínico', 'Mapa de prática clínica'],
      ['Conquistas', 'Conquistas'],
      ['Grimório', 'Grimório de Conhecimento'],
      ['Ranking', 'Ranking da Ordem'],
    ];

    for (const [tabName, heading] of expected) {
      await page.getByRole('tab', { name: tabName, exact: true }).click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }

    await page.getByRole('tab', { name: 'Mapa clínico', exact: true }).click();
    await expect(page.getByRole('tabpanel', { name: 'Mapa clínico' })).not.toContainText('Bloqueada');
    await expect(page.getByRole('tabpanel', { name: 'Mapa clínico' })).toContainText('Sem amostra');
  });

  test('o mapa expande uma área por vez e filtra somente estados realmente presentes', async ({ page }) => {
    await openCommandCenter(page, {
      compStats: {
        ab_disturbio_misto: { c: 1, t: 5 },
        ab_atr: { c: 1, t: 1 },
      },
    });
    await page.getByRole('tab', { name: 'Mapa clínico', exact: true }).click();
    await waitForDashboardTabTerminal(page, 'mapa');
    const map = page.getByRole('tabpanel', { name: 'Mapa clínico' });
    const groups = map.locator('details[data-map-group]');
    expect(await groups.count()).toBeGreaterThan(1);
    await expect(groups.first()).toHaveAttribute('open', '');
    await groups.nth(1).locator('summary').click();
    await expect(groups.nth(1)).toHaveAttribute('open', '');
    await expect(groups.first()).not.toHaveAttribute('open', '');

    await map.locator('#nqDashMapFilter').selectOption('attention');
    const visibleAttentionNodes = map.locator('.nqd-map-node:visible');
    expect(await visibleAttentionNodes.count()).toBeGreaterThan(0);
    for (const node of await visibleAttentionNodes.all()) await expect(node).toHaveAttribute('data-state', 'attention');
    await expect(map.locator('.nqd-map-node:not([data-state="attention"]):visible')).toHaveCount(0);
    await expect(map.locator('#nqDashMapResult')).toContainText(/temas? clínicos?/);

    await map.locator('#nqDashMapFilter').selectOption('all');
    const uniqueTheme = await map.locator('.nqd-map-node').evaluateAll(nodes => {
      const labels = nodes.map(node => node.getAttribute('data-search') || '').filter(Boolean);
      return labels.find(label => labels.filter(candidate => candidate.includes(label)).length === 1) || '';
    });
    expect(uniqueTheme).not.toBe('');
    await map.locator('#nqDashMapSearch').fill(uniqueTheme);
    await expect(map.locator('.nqd-map-node:visible')).toHaveCount(1);
    await expect(map.locator('.nqd-map-node:visible')).toHaveAttribute('data-search', uniqueTheme);
    await expect(map.locator('#nqDashMapResult')).toHaveText(/1 tema clínico em 1 área/);

    await map.locator('#nqDashMapSearch').fill('tema que certamente não existe');
    await expect(map.locator('#nqDashMapEmpty')).toBeVisible();
    await expect(map.locator('details[data-map-group]:visible')).toHaveCount(0);
  });

  test('devolve desejo às conquistas com badges reais carregados de forma eager e sem progresso decorativo', async ({ page }) => {
    await openCommandCenter(page);
    const dashboard = page.locator('#nqDashboard');
    await expect(dashboard.locator('.nqd-conduct-spine')).toHaveCount(0);

    const badgeImages = dashboard.locator('.nqd-badge-path img');
    await expect(badgeImages).toHaveCount(5);
    await expect.poll(() => badgeImages.evaluateAll(images => images.every(image => {
      const img = image as HTMLImageElement;
      return img.complete && img.naturalWidth >= 256 && img.naturalHeight >= 256 && img.getAttribute('loading') !== 'lazy';
    }))).toBe(true);

    await page.getByRole('tab', { name: 'Conquistas', exact: true }).click();
    const achievements = page.getByRole('tabpanel', { name: 'Conquistas' });
    for (let index = 1; index <= 5; index += 1) {
      await expect(achievements.locator(`.nqd-badge-path img[src="assets/badges/badge${index}-384.jpg"]`)).toBeVisible();
    }
    await expect(achievements.locator('.nqd-achievement-spotlight')).toContainText('Faltam 8 acertos');
    await expect(achievements.locator('.nqd-achievement-mark img[src="assets/titulodecampeao.png"]')).toHaveCount(1);
    await expect(achievements.locator('.nqd-achievement-filter[aria-pressed="true"]')).toHaveText('Objetivos');
    const visibleObjectives = await achievements.locator('[data-achievement-promoted="true"]:visible').count();
    await achievements.getByRole('button', { name: 'Conquistadas' }).click();
    await expect(achievements.locator('.nqd-achievement-filter[aria-pressed="true"]')).toHaveText('Conquistadas');
    const visibleStatuses = await achievements.locator('[data-achievement-status]:visible').evaluateAll(cards => cards.map(card => card.getAttribute('data-achievement-status')));
    expect(visibleStatuses.every(status => status === 'unlocked')).toBe(true);
    expect(visibleObjectives).toBeGreaterThan(0);
  });

  test('organiza o Grimório por descoberta sem inventar denominador de conhecimento', async ({ page }) => {
    await gotoGame(page);
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
    await expect(library.getByRole('option', { name: 'Publicação mais recente' })).toBeAttached();
    await expect(library.locator('.nqd-library-item .nqd-state', { hasText: /^Referência$/ })).toHaveCount(0);
    await expect(library.locator('.nqd-library-item').first()).toHaveAttribute('data-library-year', /\d{4}/);
    await expect(library.locator('.nqd-library-summary')).toContainText('descobertas reunidas');
    await expect(library.locator('.nqd-library-summary')).not.toContainText(/\bde\s+\d+\b/i);
    await expect(library.locator('[role="progressbar"]')).toHaveCount(0);
  });

  test('em 360×800 nenhuma área vaza horizontalmente e todos os controles visíveis têm alvo de 44px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openCommandCenter(page);

    const primaryBottom = await page.locator('[data-nqd-primary="true"]:visible').evaluate(element => element.getBoundingClientRect().bottom);
    expect(primaryBottom).toBeLessThanOrEqual(800);

    for (const tabInfo of DASHBOARD_TABS) {
      await page.locator(`[data-dash-tab="${tabInfo.id}"]`).click();
      const metrics = await page.evaluate(tabId => {
        const root = document.getElementById('nqDashboard')!;
        const pane = root.querySelector<HTMLElement>(`[data-dash-pane="${tabId}"]`)!;
        const isVisible = (element: HTMLElement) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const tooSmall = [...root.querySelectorAll<HTMLElement>('button, a[href], input, select, summary, [role="tab"]')]
          .filter(isVisible)
          .map(element => ({
            label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 60) || element.tagName,
            height: element.getBoundingClientRect().height,
          }))
          .filter(target => target.height < 43.5);
        const paneRect = pane.getBoundingClientRect();
        const paneOverflow = [...pane.children]
          .filter((element): element is HTMLElement => element instanceof HTMLElement)
          .filter(isVisible)
          .filter(element => !element.matches('.nqd-badge-path'))
          .map(element => ({
            element: element.id || element.className || element.tagName,
            rect: element.getBoundingClientRect(),
          }))
          .filter(({ rect }) => rect.left < paneRect.left - 1 || rect.right > paneRect.right + 1)
          .map(({ element, rect }) => ({ element, left: rect.left, right: rect.right }));
        const invalidHorizontalScrollers = [...pane.querySelectorAll<HTMLElement>('.nqd-badge-path')]
          .filter(isVisible)
          .map(element => ({ element, style: getComputedStyle(element), rect: element.getBoundingClientRect() }))
          .filter(({ style, rect }) => !['auto', 'scroll'].includes(style.overflowX) || rect.left < -1 || rect.right > window.innerWidth + 1)
          .map(({ element, style, rect }) => ({
            element: element.className,
            overflowX: style.overflowX,
            left: rect.left,
            right: rect.right,
          }));
        return {
          documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
          rootOverflow: root.scrollWidth - root.clientWidth,
          tooSmall,
          paneOverflow,
          invalidHorizontalScrollers,
        };
      }, tabInfo.id);

      expect(metrics.documentOverflow, `${tabInfo.name}: overflow do documento`).toBeLessThanOrEqual(1);
      expect(metrics.rootOverflow, `${tabInfo.name}: overflow da Central`).toBeLessThanOrEqual(1);
      expect(metrics.paneOverflow, `${tabInfo.name}: conteúdo comum excede o painel`).toEqual([]);
      expect(metrics.invalidHorizontalScrollers, `${tabInfo.name}: scroller horizontal não está contido`).toEqual([]);
      expect(metrics.tooSmall, `${tabInfo.name}: alvos menores que 44px`).toEqual([]);
    }
  });

  test('hover e foco preservam a geometria do conteúdo e mantêm foco visível', async ({ page }) => {
    await openCommandCenter(page);
    const action = page.locator('[data-nqd-primary="true"]:visible');
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

  test('prefers-reduced-motion remove animações, transições e rolagem suave', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCommandCenter(page);

    const moving = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#nqDashboard, #nqDashboard *')]
      .flatMap(element => [null, '::before', '::after'].flatMap(pseudo => {
        const style = getComputedStyle(element, pseudo);
        if (style.display === 'none' || style.visibility === 'hidden') return [];
        if (pseudo && (style.content === 'none' || style.content === 'normal')) return [];
        const transitionMs = style.transitionDuration.split(',').map(value => value.trim()).reduce((max, value) => {
          const amount = Number.parseFloat(value) || 0;
          return Math.max(max, value.endsWith('ms') ? amount : amount * 1000);
        }, 0);
        return style.animationName !== 'none' || transitionMs > 0 || style.scrollBehavior === 'smooth'
          ? [{ element: `${element.id || element.className || element.tagName}${pseudo || ''}`, animation: style.animationName, transitionMs, scrollBehavior: style.scrollBehavior }]
          : [];
      })));

    expect(moving).toEqual([]);
  });

  test('no modo normal nenhuma animação visível repete infinitamente', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openCommandCenter(page);
    for (const tabInfo of DASHBOARD_TABS) {
      await page.locator(`[data-dash-tab="${tabInfo.id}"]`).click();
      const infinite = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#nqDashboard, #nqDashboard *')]
        .filter(element => {
          const style = getComputedStyle(element);
          return style.display !== 'none'
            && style.visibility !== 'hidden'
            && style.animationName !== 'none'
            && style.animationIterationCount.split(',').some(value => value.trim() === 'infinite');
        })
        .map(element => ({ element: element.id || element.className || element.tagName, animation: getComputedStyle(element).animationName })));
      expect(infinite, tabInfo.name).toEqual([]);
    }
  });

  test('não introduz violações sérias ou críticas de acessibilidade', async ({ page }) => {
    test.setTimeout(120_000);
    await openCommandCenter(page);
    for (const tabInfo of DASHBOARD_TABS) {
      const tab = page.getByRole('tab', { name: tabInfo.name, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await waitForDashboardTabTerminal(page, tabInfo.id);

      const results = await new AxeBuilder({ page }).include('#nqDashboard').analyze();
      const blocking = results.violations.filter(violation => violation.impact === 'serious' || violation.impact === 'critical');
      expect(blocking, `${tabInfo.name}: ${blocking.map(violation => `${violation.id}: ${violation.help}`).join('\n')}`).toEqual([]);
    }
  });
});
