import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/');
  await page.locator('[data-portal-route="guest"]').click();
});

test('estudo integra escolha, pausa e retomada sem repetir resposta', async ({ page }) => {
  const campaign = await page.evaluate(() => localStorage.getItem('nefroquest-save'));
  await page.evaluate(() => (window as any).showTopicSelector());
  const setup = page.getByRole('main', { name: 'Escolha o modo de estudo' });
  await expect(setup).toBeVisible();
  expect(await setup.evaluate(el => getComputedStyle(el).position)).toBe('relative');
  await expect(setup).not.toHaveAttribute('aria-modal', 'true');
  await setup.getByRole('button', { name: 'Iniciar estudo livre' }).click();
  await expect(page.locator('#studyModePage')).toBeVisible();
  await expect(setup).toHaveCount(0);
  await page.locator('#studyOptions button').first().click();
  await expect(page.locator('#studyFeedback')).toBeVisible();
  await page.getByRole('button', { name: 'Pausar e voltar' }).click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-study-state')!));
  expect(saved.index).toBe(1);
  expect(saved.correct + saved.wrong).toBe(1);
  await page.evaluate(() => (window as any).showTopicSelector());
  await page.getByRole('button', { name: 'Retomar estudo' }).click();
  await expect(page.locator('#studyProgress')).toHaveText('2');
  await expect(page.locator('.study-mode-popup')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save'))).toBe(campaign);
});

test('temas cabem em 320px com texto ampliado e retornam ao Átrio', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.evaluate(() => (window as any).showTopicSelector());
  await page.getByRole('button', { name: 'Selecionar Temas' }).click();
  const setup = page.getByRole('main', { name: 'Escolha os temas de estudo' });
  await expect(setup).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.keyboard.press('Escape');
  await expect(setup).toHaveCount(0);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
});

test('sair dos temas retorna à mesma área do Dashboard', async ({ page }) => {
  await page.evaluate(() => (window as any).openDashboard({ tab: 'skills' }));
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await page.getByRole('button', { name: 'Escolher temas', exact: true }).click();
  await expect(page.getByRole('main', { name: 'Escolha os temas de estudo' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await expect(page.getByRole('tab', { name: 'Competências', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#nqDashboard')).not.toHaveAttribute('inert', '');
});

test('nova sessão por tema pede escolha na página e mantém a salva até confirmar', async ({ page }) => {
  let nativeDialogs = 0;
  page.on('dialog', async dialog => { nativeDialogs++; await dialog.dismiss(); });
  await page.evaluate(async () => {
    await (window as any)._loadTopics();
    const ids = (window as any).questionBank.slice(0, 2).map((q: any) => q.qid || q.id || q.q.substring(0, 40));
    localStorage.setItem('nefroquest-study-state', JSON.stringify({ questions: ids, index: 1, correct: 1, wrong: 0, savedAt: Date.now() }));
    (window as any).showAxesSelector();
  });
  const saved = await page.evaluate(() => localStorage.getItem('nefroquest-study-state'));
  await page.getByRole('button', { name: 'Iniciar Sessão', exact: true }).click();
  const choice = page.locator('[data-study-resume-choice]');
  await expect(choice).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-study-state'))).toBe(saved);
  await choice.getByRole('button', { name: 'Iniciar nova sessão' }).click();
  await expect(page.locator('#studyProgress')).toHaveText('1');
  await expect(page.locator('#studyCorrect')).toHaveText('0');
  expect(nativeDialogs).toBe(0);
});

test('resultado compacto reinicia contadores e limpa a sessão concluída ao sair', async ({ page }) => {
  await page.evaluate(async () => {
    await (window as any).startFreeStudyMode();
    (0, eval)('studyModeQuestions = studyModeQuestions.slice(0, 1); showStudyModePage();');
  });
  await page.locator('#studyOptions button').first().click();
  await page.getByRole('button', { name: 'Ver Resultados' }).click();
  await expect(page.getByRole('heading', { name: 'Estudo concluído' })).toBeVisible();
  await expect(page.locator('.nq-study-result-metrics dd').first()).toHaveText('1');
  await expect(page.locator('#studyProgress')).toHaveText('1');
  await page.getByRole('button', { name: 'Estudar Novamente' }).click();
  await expect(page.getByRole('button', { name: 'Pausar e voltar' })).toBeVisible();
  await expect(page.locator('#studyCorrect')).toHaveText('0');
  await expect(page.locator('#studyWrong')).toHaveText('0');
  await page.locator('#studyOptions button').first().click();
  await page.getByRole('button', { name: 'Ver Resultados' }).click();
  await page.locator('.nq-study-session-header [data-action="exitStudyMode"]').click();
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-study-state'))).toBeNull();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
});
