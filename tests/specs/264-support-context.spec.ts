import { test, expect, type Page, type Route } from '@playwright/test';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

type Audit = { blockedWrites: string[]; mockedContact: unknown[]; errors: string[] };
const audits = new WeakMap<Page, Audit>();

async function isolate(page: Page, replyContact?: (route: Route) => Promise<void>) {
  const audit: Audit = { blockedWrites: [], mockedContact: [], errors: [] };
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await page.context().routeWebSocket('**/*', socket => socket.close());
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === 'POST' && url.hostname === 'wviutasgroltjuyxpevc.supabase.co' &&
        url.pathname === '/functions/v1/send-contact' && replyContact) {
      audit.mockedContact.push(request.postDataJSON());
      await replyContact(route); // Boundary stub: this POST never leaves the runner.
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method())) {
      audit.blockedWrites.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }
    if (['localhost', '127.0.0.1'].includes(url.hostname)) await route.continue();
    else await route.abort();
  });
  return audit;
}

test.afterEach(async ({ page }) => {
  const audit = audits.get(page)!;
  expect(audit.blockedWrites).toEqual([]);
  expect(audit.errors).toEqual([]);
});

async function opaqueOfflineState(page: Page) {
  return page.evaluate(async () => {
    // Read the actual offline session and published revision objects as opaque
    // bytes. No bank, scoring function, SDK or controller is replaced.
    const runtime = (0, eval)('JSON.stringify({sessionQuestions,currentIndex,correctCount,isAnswered,currentPresentation,offlineAnswer,offlineRevision,offlineOriginalRaw,offlineSavedRaw})');
    const storage = Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]));
    const bytes = new TextEncoder().encode(JSON.stringify({ runtime, storage }));
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(value => value.toString(16).padStart(2, '0')).join('');
  });
}

test('offline connectivity changes preserve the real session, answer and history without automatic navigation', async ({ page, context }) => {
  await isolate(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/offline.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nq-off-btn')).toHaveCount(4);
  expect(await page.evaluate(() => (0, eval)('topics.length'))).toBe(741);
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  const status = page.locator('#nqOffConnection');
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).toHaveText('Conexão disponível');
  const url = page.url();
  const originalState = await opaqueOfflineState(page);
  const before = await page.locator('#nqOffCard').boundingBox();
  await context.setOffline(true);
  await expect(status).toHaveText('Sem conexão');
  expect(await opaqueOfflineState(page)).toBe(originalState);
  expect(page.url()).toBe(url);
  const disconnected = await page.locator('#nqOffCard').boundingBox();
  expect(disconnected!.y).toBeCloseTo(before!.y, 0);
  await expect(page.locator('.nq-off-sync-banner')).not.toContainText(/sincronizad|automaticamente|Supabase/);
  await expect(page.getByRole('link', { name: 'Voltar ao jogo', exact: true })).toHaveAttribute('href', '/jogar/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.nq-off-btn').first().click();
  await expect(page.locator('#nqOffFeedbackArea')).toBeVisible();
  const answeredState = await opaqueOfflineState(page);
  expect(answeredState).not.toBe(originalState);
  const answerText = await page.locator('#nqOffFeedbackArea').textContent();
  await context.setOffline(false);
  await expect(status).toHaveText('Conexão disponível');
  expect(await opaqueOfflineState(page)).toBe(answeredState);
  await expect(page.locator('#nqOffFeedbackArea')).toHaveText(answerText!);
  expect(page.url()).toBe(url);
});

test('contact validation associates each local error with its field and sends nothing', async ({ page }) => {
  const audit = await isolate(page, async route => { await route.fulfill({ json: { success: true } }); });
  await page.goto('/contato/', { waitUntil: 'domcontentloaded' });
  const submit = page.getByRole('button', { name: 'Enviar mensagem', exact: true });
  await submit.click();
  await expect(page.locator('#nome')).toBeFocused();
  await expect(page.locator('#nome')).toHaveAttribute('aria-describedby', /(?:^|\s)nomeErro(?:\s|$)/);
  await expect(page.locator('#nomeErro')).toHaveText('Informe seu nome.');
  await expect(page.locator('#nome')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#nome').fill('Pessoa local');
  await expect(page.locator('#nomeErro')).toBeHidden();
  await expect(page.locator('#nome')).not.toHaveAttribute('aria-invalid', 'true');
  await page.locator('#email').fill('sem-arroba');
  await submit.click();
  await expect(page.locator('#email')).toBeFocused();
  await expect(page.locator('#email')).toHaveAttribute('aria-describedby', /(?:^|\s)emailErro(?:\s|$)/);
  await expect(page.locator('#emailErro')).toContainText('e-mail válido');
  await page.locator('#email').fill('local@example.test');
  await submit.click();
  await expect(page.locator('#mensagem')).toBeFocused();
  await expect(page.locator('#mensagem')).toHaveAttribute('aria-describedby', /(?:^|\s)contador(?:\s|$)/);
  await expect(page.locator('#mensagem')).toHaveAttribute('aria-describedby', /(?:^|\s)mensagemErro(?:\s|$)/);
  await expect(page.locator('#mensagemErro')).toHaveText('Escreva sua mensagem.');
  expect(audit.mockedContact).toHaveLength(0);
});

test('contact retains filled text after a mocked failure and confirms beside the native submit control', async ({ page }) => {
  let attempts = 0, pending: Route | undefined;
  const audit = await isolate(page, async route => {
    attempts++;
    if (attempts === 1) await route.fulfill({ status: 502, json: { success: false } });
    else pending = route;
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/contato/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  await page.locator('#nome').fill('Pessoa local');
  await page.locator('#email').fill('local@example.test');
  await page.locator('#mensagem').fill('Mensagem técnica local, preservada após a falha.');
  const submit = page.getByRole('button', { name: 'Enviar mensagem', exact: true });
  await submit.click();
  await expect(page.getByRole('status')).toContainText('Não conseguimos enviar agora (erro 502)');
  await expect(page.locator('#nome')).toHaveValue('Pessoa local');
  await expect(page.locator('#email')).toHaveValue('local@example.test');
  await expect(page.locator('#mensagem')).toHaveValue('Mensagem técnica local, preservada após a falha.');
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect.poll(() => !!pending).toBe(true);
  await expect(page.locator('#enviar')).toBeDisabled();
  await expect(page.locator('#enviar')).toHaveAttribute('aria-busy', 'true');
  await page.locator('#enviar').evaluate(button => (button as HTMLButtonElement).click());
  expect(attempts).toBe(2);
  await pending!.fulfill({ json: { success: true } });
  const status = page.locator('#estado');
  await expect(status).toContainText('Mensagem enviada. Obrigado!');
  await expect(status).toBeFocused();
  await expect(status).toBeInViewport();
  await expect(submit).toBeEnabled();
  await expect(submit).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#mensagem')).toHaveValue('');
  await expect(page.locator('#contador')).toHaveText('0 de 2000 caracteres');
  expect(audit.mockedContact).toHaveLength(2);
  expect(audit.mockedContact[1]).toEqual({ name: 'Pessoa local', email: 'local@example.test', message: '[Contato pelo site]\n\nMensagem técnica local, preservada após a falha.' });
  const position = await status.evaluate(element => {
    const status = element.getBoundingClientRect(), button = document.getElementById('enviar')!.getBoundingClientRect();
    return { distance: status.top - button.bottom, horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
  });
  expect(position.distance).toBeGreaterThanOrEqual(0);
  expect(position.distance).toBeLessThan(64);
  expect(position.horizontalOverflow).toBe(false);
});

test('privacy index reaches all eight existing sections and returns focus within the same page', async ({ page }) => {
  await isolate(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/privacy-policy.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  const index = page.getByRole('navigation', { name: 'Índice da política', exact: true });
  await index.locator('summary').click();
  const links = index.getByRole('link');
  await expect(links).toHaveCount(8);
  await expect(page.locator('main > section')).toHaveCount(8);
  const originalHeadings = await page.locator('main > section h2').allTextContents();
  const path = new URL(page.url()).pathname;
  for (let i = 0; i < 8; i++) {
    const link = links.nth(i), destination = await link.getAttribute('href');
    expect(destination).toMatch(/^#nqPolicySection[1-8]$/);
    await expect(link).toHaveText(originalHeadings[i]);
    await link.focus();
    await link.press('Enter');
    const target = page.locator(destination!);
    await expect(target).toBeFocused();
    await expect(target.locator('h2')).toHaveText(originalHeadings[i]);
    await page.locator('[data-policy-return]').nth(i).click();
    await expect(index).toBeFocused();
    expect(new URL(page.url()).pathname).toBe(path);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('link', { name: /Voltar ao/ }).last()).toBeAttached();
});

test('news index navigates the existing reader and returns focus without replacing history or the page', async ({ page }) => {
  await isolate(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  const opener = page.locator('#welcomeVersionLabel');
  const url = page.url();
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Novidades', exact: true });
  const reader = dialog.getByRole('region', { name: 'Histórico de novidades', exact: true });
  const index = reader.getByRole('navigation', { name: 'Índice de novidades', exact: true });
  const disclosure = index.locator('details'), summary = disclosure.locator('summary');
  await expect(disclosure).not.toHaveAttribute('open', '');
  const entries = reader.locator('[data-news-entry]');
  await expect(entries).toHaveCount(31);
  const history = await entries.allTextContents();
  await summary.focus();
  await summary.press('Enter');
  const links = index.getByRole('link');
  await expect(links).toHaveCount(31);
  await expect(links.last()).toContainText('v6.0');
  await links.last().click();
  await expect(disclosure).not.toHaveAttribute('open', '');
  await expect(entries.last()).toBeFocused();
  await expect.poll(() => reader.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(page.url()).toBe(url);
  expect(await entries.allTextContents()).toEqual(history);
  await reader.getByRole('link', { name: 'Voltar ao índice', exact: true }).last().click();
  await expect(summary).toBeFocused();
  await expect(summary).toBeInViewport();
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(page.url()).toBe(url);
});
