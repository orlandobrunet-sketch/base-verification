import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('a preparação nativa cede a tela e só publica o catálogo completo', async ({ page, context, baseURL }, info) => {
  const origin = new URL(baseURL!).origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(origin).hostname);
  const audit = { errors: [] as string[], nonGET: [] as string[], sockets: 0 };
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { audit.nonGET.push(request.method() + ' ' + url.pathname); return route.abort(); }
    if (url.origin === origin) return route.continue();
    if (['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(url.origin) &&
      ['font', 'stylesheet'].includes(request.resourceType())) return route.continue();
    return route.abort();
  });
  await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-portal-route="guest"]')).toBeVisible();
  // Finish the real reference download first, so timer ticks cannot be
  // mistaken for waiting on that network request instead of catalog work.
  await page.evaluate(async () => {
    const w = window as any;
    await w.carregarDadosGrimorio();
    if (w.questionBank || w.questionRevisionCatalog) throw Error('Fresh native preparation required.');
    const probe = { pendingTicks: 0, completeProfiles: [] as boolean[], timer: 0 };
    w.__catalogPreparationProbe = probe;
    probe.timer = window.setInterval(() => {
      if (!w.questionBank?.length) return;
      const catalog = w.questionRevisionCatalog;
      if (!catalog) { probe.pendingTicks++; return; }
      const id = String(w.questionBank[0].id);
      probe.completeProfiles = ['main', 'exam', 'study', 'offline'].map(profile => !!catalog.current(id, profile));
      clearInterval(probe.timer);
    }, 0);
  });
  try {
    // Real pointer intent starts the native warm-up; no bank, answers,
    // controller, scheduler, RNG or clock is replaced by this test.
    await page.locator('[data-portal-route="guest"]').click();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    await page.waitForFunction(() => (window as any).__catalogPreparationProbe.completeProfiles.length === 4);
    const result = await page.evaluate(() => {
      const w = window as any;
      return { pendingTicks: w.__catalogPreparationProbe.pendingTicks,
        completeProfiles: w.__catalogPreparationProbe.completeProfiles,
        count: w.questionBank.length, manifestCount: Object.keys(w.NQQuestionRevisionManifest.current).length,
        authNull: w.authUser === null, correct: w.state.correctTotal, gold: w.state.gold };
    });
    await info.attach('native-catalog-preparation', { contentType: 'application/json', body: JSON.stringify({ result, audit }) });
    expect(result.pendingTicks, 'Browser tasks must run while actual catalog preparation is pending').toBeGreaterThanOrEqual(2);
    expect(result.completeProfiles).toEqual([true, true, true, true]);
    expect(result.count).toBe(741); expect(result.manifestCount).toBe(741);
    expect(result.authNull).toBe(true); expect(result.correct).toBe(0); expect(result.gold).toBe(0);
    expect(audit.errors).toEqual([]); expect(audit.nonGET).toEqual([]); expect(audit.sockets).toBe(0);
  } finally {
    await page.evaluate(() => clearInterval((window as any).__catalogPreparationProbe?.timer)).catch(() => {});
  }
});
