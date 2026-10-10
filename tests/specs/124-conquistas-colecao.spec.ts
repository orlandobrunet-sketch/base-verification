import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block' });

const preservedKeys = ['nefroquest-save', 'nefroquest-save-v7', 'nefroquest-detailed-stats', 'nefroquest-achievements', 'nefroquest-badge-history', 'nq-unlocked-refs', 'unlockedArticles'];

async function openCollection(page: Page, correctTotal = 32, earned: 'none' | 'some' | 'all' = 'some', remembered: boolean | null = true) {
  await page.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { correctTotal });
  await page.evaluate(({ earned, remembered }) => {
    const ids = earned === 'all' ? (0, eval)('ACHIEVEMENTS_LIST').map((item: any) => item.id)
      : earned === 'none' ? [] : ['century_club', 'arqui_nefromante_slayer', 'speed_demon'];
    localStorage.setItem('nefroquest-achievements', JSON.stringify(ids));
    localStorage.setItem('nefroquest-badge-history', JSON.stringify(remembered === null ? null : remembered ? { 1: { jornada: 1 }, 2: { jornada: 1 } } : {}));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({ totalQuestions: 145, totalCorrect: 123, totalWrong: 22, bestStreak: 45, byTopic: { Hemodiálise: { total: 40, correct: 35, wrong: 5 } }, byCategory: {}, questionHistory: [], dailyActivity: {} }));
    (window as any).openDashboard({ tab: 'achievements' });
  }, { earned, remembered });
  await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible();
  return page.getByRole('tabpanel', { name: 'Conquistas', exact: true });
}

test('coleção começa completa, reconhece posses e mostra progresso real sem conceder conquista', async ({ page }) => {
  const pane = await openCollection(page);
  await expect(pane.locator('.nqd-achievement:visible')).toHaveCount(12);
  await expect(pane.locator('.nqd-achievement').first()).toHaveAttribute('data-achievement-status', 'unlocked');
  await expect(pane.getByRole('button', { name: 'Todas', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(pane.locator('.nqd-achievement-summary strong')).toHaveText('2');
  await expect(pane.locator('.nqd-badge-node[data-memoria="true"]')).toHaveCount(1);
  const hd = pane.locator('[data-achievement-id="hd_master"]');
  await expect(hd.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '35');
  await expect(hd.locator('[role="progressbar"]')).toHaveAttribute('aria-valuemax', '50');
  await expect(hd.locator('.nqd-state')).toHaveText('Em progresso');
  await expect(pane.locator('[data-achievement-id="century_club"] .nqd-state')).toContainText('Conquistada');
  await expect(pane.getByRole('button', { name: 'Objetivos', exact: true })).toHaveCount(0);
  await expect(pane.locator('.nqd-achievement-detail, details')).toHaveCount(0);
  const requirements = await page.evaluate(() => (0, eval)('ACHIEVEMENTS_LIST').map((item: any) => ({ id: item.id, description: item.description })));
  for (const requirement of requirements) {
    await expect(pane.locator(`[data-achievement-id="${requirement.id}"] .nqd-achievement-copy`)).toHaveText(requirement.description);
    await expect(pane.locator(`[data-achievement-id="${requirement.id}"] .nqd-achievement-copy`)).toBeVisible();
  }
  expect(await pane.locator('.nqd-achievement.is-unlocked img').evaluateAll(images => images.every(img => getComputedStyle(img).filter === 'none'))).toBe(true);
  expect(await pane.locator('.nqd-achievement.is-locked img').evaluateAll(images => images.every(img => getComputedStyle(img).filter.includes('grayscale(1)')))).toBe(true);
  const before = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys);
  await pane.getByRole('button', { name: 'Conquistadas', exact: true }).click();
  await expect(pane.locator('.nqd-achievement:visible')).toHaveCount(2);
  await expect(pane.locator('#nqdAchievementFilterStatus')).toHaveText('2 conquistas exibidas.');
  await pane.getByRole('button', { name: 'Todas', exact: true }).click();
  await expect(pane.locator('.nqd-achievement:visible')).toHaveCount(12);
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys)).toEqual(before);
});

test('grade desktop mantém os cards uniformes e os requisitos alinhados sem corte', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'Em mobile os cards seguem o fluxo natural de leitura.');
  const pane = await openCollection(page);
  await expect.poll(async () => pane.locator('.nqd-achievement-grid').evaluate(grid => grid.style.getPropertyValue('--achievement-title-height'))).not.toBe('');
  const cards = await pane.locator('.nqd-achievement').evaluateAll(elements => elements.map(card => {
    const box = card.getBoundingClientRect();
    const copy = card.querySelector('.nqd-achievement-copy')!;
    const range = document.createRange(); range.selectNodeContents(copy);
    return { width: box.width, height: box.height, title: card.querySelector('.nqd-achievement-title')!.getBoundingClientRect().top - box.top,
      requirement: copy.getBoundingClientRect().top - box.top, progress: card.querySelector('.nqd-achievement-progress')?.getBoundingClientRect().top! - box.top,
      entire: [...range.getClientRects()].every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.bottom <= box.bottom + 1),
      noScroll: !['auto', 'scroll'].includes(getComputedStyle(card).overflowY) && card.scrollHeight <= card.clientHeight + 1 };
  }));
  for (const field of ['width', 'height', 'title', 'requirement'] as const) expect(Math.max(...cards.map(card => card[field])) - Math.min(...cards.map(card => card[field]))).toBeLessThan(1);
  const progress = cards.map(card => card.progress).filter(Number.isFinite);
  expect(Math.max(...progress) - Math.min(...progress)).toBeLessThan(1);
  expect(cards.every(card => card.entire && card.noScroll)).toBe(true);
});

for (const fixture of ['admin', 'complete', 'registered'] as const) test(`Grimório usa desbloqueios do perfil e aquisição registrada: ${fixture}`, async ({ page }) => {
  await openCollection(page);
  const expected = await page.evaluate(async fixture => {
    (window as any).closeDashboard();
    const refs = (0, eval)('refsDB'), articles = (0, eval)('nefroArticles');
    const reachable = [...new Set((window as any).questionBank.flatMap((question: any) => Array.isArray(question.r) ? question.r : []).filter(Boolean))]
      .filter(key => Object.prototype.hasOwnProperty.call(refs, key as string));
    (window as any).isAdminUser = () => fixture === 'admin';
    // Referências legadas que estão no acervo permanecem no save, mas o
    // objetivo canônico conta somente as alcançáveis pelo banco vigente.
    localStorage.setItem('nq-unlocked-refs', JSON.stringify(fixture === 'admin' ? [] : Object.keys(refs)));
    localStorage.setItem('unlockedArticles', JSON.stringify(fixture === 'admin' ? [] : articles.map((_: any, index: number) => index)));
    localStorage.setItem('nefroquest-achievements', JSON.stringify(fixture === 'registered' ? ['grimoire_master'] : []));
    const condition = (0, eval)('ACHIEVEMENTS_LIST').find((achievement: any) => achievement.id === 'grimoire_master').condition();
    await (window as any).openDashboard({ tab: 'achievements' });
    return { condition, target: reachable.length + articles.length };
  }, fixture);
  const pane = page.getByRole('tabpanel', { name: 'Conquistas', exact: true });
  const card = pane.locator('[data-achievement-id="grimoire_master"]');
  const before = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys);
  expect(expected.condition).toBe(fixture !== 'admin');
  await expect(card).toHaveClass(fixture === 'registered' ? /is-unlocked/ : /is-locked/);
  if (fixture === 'registered') {
    await expect(card.locator('.nqd-state')).toContainText('Conquistada');
    await expect(card.locator('[role="progressbar"]')).toHaveCount(0);
  } else {
    await expect(card.locator('[role="progressbar"]')).toHaveAttribute('aria-valuemax', String(expected.target));
    await expect(card.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', String(fixture === 'admin' ? 0 : expected.target));
    await expect(card.locator('.nqd-state')).toHaveText(fixture === 'admin' ? 'A conquistar' : 'Objetivo completo');
    await expect(card.locator('.nqd-achievement-progress-note')).toContainText(fixture === 'admin' ? 'não registra desbloqueios do perfil' : 'conquista ainda não registrada');
    expect(await card.locator('img').evaluate(image => getComputedStyle(image).filter)).toContain('grayscale(1)');
  }
  const art = card.locator('.nqd-achievement-mark');
  await art.focus(); await page.keyboard.press('Enter');
  const detail = page.getByRole('dialog', { name: 'Guardião do Grimório Eterno', exact: true });
  await expect(detail).toHaveAttribute('data-acquired', String(fixture === 'registered'));
  if (fixture !== 'registered') await expect(detail).toContainText(fixture === 'admin' ? 'não registra desbloqueios do perfil' : 'conquista ainda não registrada');
  await page.keyboard.press('Escape'); await expect(art).toBeFocused();
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys)).toEqual(before);
});

test('arte ampliada isola a jornada, aceita teclado e retorna à mesma conquista sem mudar o save', async ({ page }) => {
  const pane = await openCollection(page);
  const art = pane.getByRole('button', { name: 'Campeão da Nefrologia — ampliar arte e requisito', exact: true });
  const before = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys);
  await art.focus();
  await page.keyboard.press('Enter');
  const detail = page.getByRole('dialog', { name: 'Campeão da Nefrologia' });
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('Derrote o Arqui-Nefromante e vença o jogo');
  await expect(detail).toContainText('Conquistada · fica com você');
  await expect(detail).toHaveAttribute('data-acquired', 'true');
  expect(await detail.locator('img').evaluate(img => getComputedStyle(img).filter)).toBe('none');
  await page.keyboard.press('1');
  await page.keyboard.press('Tab');
  expect(await detail.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(detail).toHaveCount(0);
  await expect(art).toBeFocused();
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys)).toEqual(before);

  const badge = pane.getByRole('button', { name: 'Sábio do Microscópio — 40 acertos — ampliar arte e requisito', exact: true });
  await badge.click();
  const badgeDetail = page.getByRole('dialog', { name: 'Sábio do Microscópio' });
  await expect(badgeDetail).toContainText('40 acertos na mesma jornada');
  await expect(badgeDetail).toContainText('desde a 1ª jornada');
  await expect(badgeDetail.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '32');
  await expect(badgeDetail).toHaveAttribute('data-acquired', 'true');
  expect(await badgeDetail.locator('img').evaluate(img => getComputedStyle(img).filter)).toBe('none');
  await badgeDetail.getByRole('button', { name: 'Voltar à coleção' }).click();
  await expect(badge).toBeFocused();
});

test('falha de carga do banco não apresenta o Grimório como objetivo completo', async ({ page }) => {
  let failedTopicRequest = false;
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/data/topics.js') { failedTopicRequest = true; return route.abort(); }
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    await (window as any).carregarDadosGrimorio();
    localStorage.setItem('unlockedArticles', JSON.stringify((0, eval)('nefroArticles').map((_: any, index: number) => index)));
    localStorage.setItem('nefroquest-achievements', '[]');
  });
  const before = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys);
  await page.evaluate(() => (window as any).openDashboard({ tab: 'achievements' }));
  await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible();
  const card = page.locator('[data-achievement-id="grimoire_master"]');
  await expect(card).toHaveClass(/is-locked/);
  await expect(card.locator('.nqd-state')).toHaveText('Dados indisponíveis');
  await expect(card.locator('[role="progressbar"]')).toHaveCount(0);
  await expect(card.locator('.nqd-achievement-progress-note')).toContainText('Não foi possível carregar o acervo');
  expect(failedTopicRequest).toBe(true);
  expect(await page.evaluate(() => ({ bankAvailable: Array.isArray((window as any).questionBank), complete: (0, eval)('ACHIEVEMENTS_LIST').find((achievement: any) => achievement.id === 'grimoire_master').condition() }))).toEqual({ bankAvailable: false, complete: false });
  await card.locator('.nqd-achievement-mark').focus(); await page.keyboard.press('Enter');
  const detail = page.getByRole('dialog', { name: 'Guardião do Grimório Eterno', exact: true });
  await expect(detail).toHaveAttribute('data-acquired', 'false');
  await expect(detail).toContainText('Dados indisponíveis');
  await expect(detail.locator('[role="progressbar"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys)).toEqual(before);
});

test('logout fecha detalhe e libera o fundo sem devolver foco à jornada encerrada', async ({ page }) => {
  const pane = await openCollection(page);
  await pane.getByRole('button', { name: /^Clube dos 100.*ampliar arte e requisito$/ }).click();
  await expect(page.getByRole('dialog', { name: 'Clube dos 100' })).toBeVisible();
  await page.evaluate(async () => {
    (window as any).__hiddenFocus = [];
    document.addEventListener('focusin', event => {
      const target = event.target as HTMLElement;
      if (target.closest('[hidden], [inert], .hidden')) (window as any).__hiddenFocus.push(target.id || target.className);
    });
    (0, eval)('_supaClient = null; _guestMode = true; authUser = null');
    await (window as any).authLogout();
  });
  await expect(page.locator('.nq-ach-detail, #nqDashboard')).toHaveCount(0);
  await expect(page.locator('#landingScreen')).toBeVisible();
  expect(await page.evaluate(() => ({
    hiddenFocus: (window as any).__hiddenFocus,
    modalOpen: !!document.querySelector('dialog:modal'),
    welcomeInert: document.getElementById('welcomeScreen')!.inert,
    achievements: localStorage.getItem('nefroquest-achievements'),
    save: JSON.parse(localStorage.getItem('nefroquest-save-v7')!),
  }))).toMatchObject({ hiddenFocus: [], modalOpen: false, welcomeInert: false, achievements: null, save: { save: null, resetReason: 'logout' } });
});

test('trilha completa mantém o último selo e não inventa um próximo marco', async ({ page }) => {
  const pane = await openCollection(page, 100);
  await expect(pane.locator('.nqd-achievement-spotlight')).toContainText('Trilha de selos completa');
  await expect(pane.locator('.nqd-achievement-spotlight')).toContainText('Os cinco selos da jornada foram conquistados');
  await expect(pane.locator('.nqd-badge-node[data-state="unlocked"]')).toHaveCount(5);
  await expect(pane.locator('.nqd-badge-node[aria-current]')).toHaveCount(0);
  await expect(pane.locator('.nqd-badge-node[data-acquired="true"]')).toHaveCount(5);
  expect(await pane.locator('.nqd-badge-art img, .nqd-achievement-spotlight-art img').evaluateAll(images => images.every(img => getComputedStyle(img).filter === 'none'))).toBe(true);
});

for (const earned of ['none', 'all'] as const) test(`aquisição real e filtros com ${earned === 'none' ? 'nenhuma' : 'todas as'} conquistas`, async ({ page }) => {
  const pane = await openCollection(page, earned === 'all' ? 100 : 0, earned, false);
  const count = earned === 'all' ? 12 : 0;
  await expect(pane.locator('.nqd-achievement-summary strong')).toHaveText(String(count));
  await expect(pane.locator('.nqd-achievement:visible')).toHaveCount(12);
  expect(await pane.locator('.nqd-achievement-mark img').evaluateAll((images, acquired) => images.every(img => acquired ? getComputedStyle(img).filter === 'none' : getComputedStyle(img).filter.includes('grayscale(1)')), earned === 'all')).toBe(true);
  await expect(pane.locator('.nqd-badge-node[data-acquired="true"]')).toHaveCount(earned === 'all' ? 5 : 0);
  const spotlight = pane.locator('.nqd-achievement-spotlight');
  await expect(spotlight).toHaveAttribute('data-acquired', String(earned === 'all'));
  expect(await spotlight.locator('img').evaluate((img, acquired) => acquired ? getComputedStyle(img).filter === 'none' : getComputedStyle(img).filter.includes('grayscale(1)'), earned === 'all')).toBe(true);
  if (earned === 'none') {
    // 100% de progresso sem aquisição registrada continua sem cor.
    await expect(pane.locator('[data-achievement-id="century_club"] [role="progressbar"]')).toHaveAttribute('aria-valuenow', '100');
    await expect(pane.locator('[data-achievement-id="century_club"]')).toHaveClass(/is-locked/);
    const art = pane.locator('.nqd-achievement-spotlight-art');
    await art.click();
    const detail = page.getByRole('dialog', { name: 'Vórtice do Néfron' });
    await expect(detail).toHaveAttribute('data-acquired', 'false');
    expect(await detail.locator('img').evaluate(img => getComputedStyle(img).filter)).toContain('grayscale(1)');
    await page.keyboard.press('Escape');
    await expect(art).toBeFocused();
  }
  const before = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys);
  await pane.getByRole('button', { name: 'Conquistadas', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(pane.locator('.nqd-achievement:visible')).toHaveCount(count);
  await expect(pane.locator('#nqdAchievementFilterEmpty')).toBeVisible({ visible: count === 0 });
  await expect(pane.locator('#nqdAchievementFilterStatus')).toHaveText(`${count} conquistas exibidas.`);
  await pane.getByRole('button', { name: 'Todas', exact: true }).click();
  await expect(pane.locator('.nqd-achievement:visible')).toHaveCount(12);
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys)).toEqual(before);
});

test('próximo selo não obtido fica cinza e posse histórica continua colorida', async ({ page }) => {
  const pane = await openCollection(page, 32, 'some', false);
  await expect(pane.locator('.nqd-badge-node[data-acquired="true"]')).toHaveCount(1);
  await expect(pane.locator('.nqd-badge-node[aria-current]')).toHaveAttribute('data-acquired', 'false');
  expect(await pane.locator('.nqd-badge-node[data-acquired="false"] img').evaluateAll(images => images.every(img => getComputedStyle(img).filter.includes('grayscale(1)')))).toBe(true);
  expect(await pane.locator('.nqd-badge-node[data-acquired="true"] img').evaluateAll(images => images.every(img => getComputedStyle(img).filter === 'none'))).toBe(true);
  await pane.locator('[data-achievement-id="hd_master"] .nqd-achievement-mark').click();
  const detail = page.getByRole('dialog', { name: 'Mestre da Hemodiálise' });
  await expect(detail).toHaveAttribute('data-acquired', 'false');
  await expect(detail).toContainText('Acerte 50 questões sobre Hemodiálise');
  await expect(detail).toContainText('Em progresso');
  expect(await detail.locator('img').evaluate(img => getComputedStyle(img).filter)).toContain('grayscale(1)');
});

test('histórico nulo preserva o próximo selo cinza sem modificar progresso ou aquisição', async ({ page }) => {
  const pane = await openCollection(page, 32, 'some', null);
  const spotlight = pane.locator('.nqd-achievement-spotlight');
  await expect(spotlight).toHaveAttribute('data-acquired', 'false');
  await expect(spotlight).toContainText('revelar este selo');
  expect(await spotlight.locator('img').evaluate(img => getComputedStyle(img).filter)).toContain('grayscale(1)');
  await expect(pane.locator('.nqd-badge-node[data-acquired="true"]')).toHaveCount(1);
  await expect(pane.locator('.nqd-badge-node[data-memoria="true"]')).toHaveCount(0);
  const before = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys);
  const art = spotlight.locator('.nqd-achievement-spotlight-art');
  await art.click();
  const detail = page.getByRole('dialog', { name: 'Sábio do Microscópio' });
  await expect(detail).toHaveAttribute('data-acquired', 'false');
  expect(await detail.locator('img').evaluate(img => getComputedStyle(img).filter)).toContain('grayscale(1)');
  await expect(detail.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '32');
  await expect(detail.locator('[role="progressbar"]')).toHaveAttribute('aria-valuemax', '40');
  await page.keyboard.press('Escape');
  await expect(art).toBeFocused();
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys)).toEqual(before);
});

test('celebrações reais usam artes próprias, não se sobrepõem e preservam foco e progresso', async ({ page }) => {
  const pane = await openCollection(page);
  const origin = pane.getByRole('button', { name: 'Todas', exact: true });
  await origin.focus();
  const before = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys);
  await page.clock.install();
  await page.evaluate(() => {
    for (const id of ['century_club', 'arqui_nefromante_slayer']) {
      const achievement = (0, eval)('ACHIEVEMENTS_LIST').find((item: any) => item.id === id);
      (window as any).showAchievementNotification(achievement);
    }
  });
  const messages = page.locator('#nqAchievementCelebrations [role="status"]');
  await expect(messages).toHaveCount(2);
  const images = messages.locator('img');
  await expect(images.nth(0)).toHaveAttribute('src', 'assets/achievements/centenario.webp');
  await expect(images.nth(1)).toHaveAttribute('src', 'assets/achievements/campeao.webp');
  const boxes = await messages.evaluateAll(elements => elements.map(element => ({ top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom })));
  expect(boxes[1].top).toBeGreaterThan(boxes[0].bottom);
  await expect(origin).toBeFocused();
  await page.clock.fastForward(5400);
  await expect(messages).toHaveCount(0);
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), preservedKeys)).toEqual(before);
});

for (const width of [320, 390, 1100]) test(`coleção e detalhes contidos em ${width} com texto a 200%`, async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'Cada cenário define sua própria viewport.');
  await page.setViewportSize({ width, height: 800 });
  const pane = await openCollection(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  expect(await pane.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  expect(await pane.locator('.nqd-achievement').evaluateAll(cards => cards.every(card => {
    const style = getComputedStyle(card);
    return !['auto', 'scroll'].includes(style.overflowY) && card.scrollHeight <= card.clientHeight + 1;
  }))).toBe(true);
  expect(await pane.locator('.nqd-achievement-title, .nqd-achievement-copy').evaluateAll(nodes => nodes.every(node => {
    const card = node.closest('.nqd-achievement')!.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(node);
    return [...range.getClientRects()].every(rect => rect.left >= card.left - 1 && rect.right <= card.right + 1 && rect.bottom <= card.bottom + 1);
  }))).toBe(true);
  for (const art of await pane.locator('.nqd-achievement-mark').all()) {
    const box = await art.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeLessThanOrEqual(104);
  }
  const art = pane.getByRole('button', { name: 'Clube dos 100 — ampliar arte e requisito', exact: true });
  await art.click();
  const detail = page.getByRole('dialog', { name: 'Clube dos 100' });
  expect(await detail.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  const close = detail.getByRole('button', { name: 'Voltar à coleção' });
  const box = await close.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.y + box!.height).toBeLessThanOrEqual(800);
  await close.click();
  await expect(art).toBeFocused();
});
