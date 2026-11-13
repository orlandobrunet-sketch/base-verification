import { test, expect, type Page, type Route } from '@playwright/test';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

const recordRows = [
  { player_name: 'Ana da coleção', character_name: 'Dra. Aquaria', score: 812, level: 4, chests_opened: 2, played_at: '2026-11-01T12:00:00Z' },
  { player_name: 'Outro explorador', character_name: 'Dr. Nephros', score: 790, level: 3, chests_opened: 1, played_at: '2026-11-01T12:00:00Z' },
];
const profileRows = [
  { player_name: 'Perfil atual', total_correct: 234, best_level: 6, total_games: 7 },
];

async function localRoutes(page: Page, respond?: (route: Route, url: URL) => Promise<boolean>) {
  const writes: string[] = [];
  await page.context().routeWebSocket('**/*', socket => socket.close());
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      writes.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }
    if (respond && await respond(route, url)) return;
    if (['localhost', '127.0.0.1'].includes(url.hostname)) await route.continue();
    else await route.abort();
  });
  return writes;
}

async function enterGuestAtrium(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  const guest = page.locator('[data-portal-route="guest"]');
  await expect(guest).toBeVisible();
  await guest.click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
}

async function rankingProtectedState(page: Page) {
  return page.evaluate(() => ({
    owner: (window as any).authUser?.id || null,
    progress: Object.fromEntries([
      'nefroquest-save', 'nefroquest-save-v7', 'nefroquest-study-state',
      'nefroquest-exam-state', 'nefroquest-sr-data', 'nefroquest-error-reasons',
    ].map(key => [key, localStorage.getItem(key)])),
    journey: (0, eval)('JSON.stringify({gold:state.gold,score:state.score,idx:state.idx,equipment:state.equipment,correctTotal:state.correctTotal})'),
  }));
}

test('ranking retries beside the error, preserves the filter and makes one real request', async ({ page }) => {
  let records = 0;
  let releaseRetry: (() => void) | undefined;
  const retryGate = new Promise<void>(resolve => { releaseRetry = resolve; });
  const writes = await localRoutes(page, async (route, url) => {
    if (url.hostname !== 'wviutasgroltjuyxpevc.supabase.co' || url.pathname !== '/rest/v1/leaderboard') return false;
    records++;
    if (records === 1) await route.fulfill({ status: 503, json: { message: 'Controlled unavailable ranking' } });
    else {
      await retryGate;
      await route.fulfill({ status: 200, json: recordRows });
    }
    return true;
  });
  await enterGuestAtrium(page);
  const expiredRecord = JSON.stringify({ data: recordRows, ts: 1 });
  await page.evaluate(raw => localStorage.setItem('nefroquest-leaderboard', raw), expiredRecord);
  const before = await rankingProtectedState(page);
  await page.locator('[data-atrium-route="ranking"]').click();
  const retry = page.locator('#boardBody').getByRole('button', { name: 'Tentar novamente', exact: true });
  await expect(retry).toBeVisible();
  await expect(retry).toBeEnabled();
  await expect(page.locator('#boardLoading')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-leaderboard'))).toBe(expiredRecord);
  await page.locator('#boardSearch').fill('Ana da coleção');
  await retry.focus();
  await retry.press('Enter');
  await expect.poll(() => records).toBe(2);
  await expect(retry).toBeDisabled();
  await expect(retry).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#boardRefresh')).toBeDisabled();
  await expect(page.locator('#boardLoading')).toBeVisible();
  await expect(page.locator('#boardSearch')).toBeFocused();
  // A second activation of the disabled native control must not start work.
  await retry.evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  expect(records).toBe(2);
  await expect(page.locator('#boardSearch')).toHaveValue('Ana da coleção');
  releaseRetry!();
  await expect(page.locator('#boardBody tr')).toHaveCount(1);
  await expect(page.locator('#boardBody')).toContainText('Ana da coleção');
  await expect(page.locator('#boardBody')).not.toContainText('Outro explorador');
  await expect(page.locator('#boardLoading')).toBeHidden();
  await expect(page.locator('#boardRefresh')).toBeEnabled();
  await expect(page.locator('#boardRefresh')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#boardSearch')).toBeFocused();
  expect(await rankingProtectedState(page)).toEqual(before);
  expect(records).toBe(2);
  expect(writes).toEqual([]);
});

test('a late ranking retry cannot replace the current tab after closing and reopening', async ({ page }) => {
  let records = 0;
  let profiles = 0;
  let lateRoute: Route | undefined;
  const writes = await localRoutes(page, async (route, url) => {
    if (url.hostname !== 'wviutasgroltjuyxpevc.supabase.co') return false;
    if (url.pathname === '/rest/v1/leaderboard') {
      records++;
      if (records === 1) await route.fulfill({ status: 503, json: { message: 'Controlled first failure' } });
      else if (records === 2) lateRoute = route;
      else await route.fulfill({ json: recordRows });
      return true;
    }
    if (url.pathname === '/rest/v1/profiles_stats') {
      profiles++;
      await route.fulfill({ json: profileRows });
      return true;
    }
    return false;
  });
  await enterGuestAtrium(page);
  const before = await rankingProtectedState(page);
  const opener = page.locator('[data-atrium-route="ranking"]');
  await opener.click();
  await page.locator('#boardBody').getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect.poll(() => !!lateRoute).toBe(true);
  await page.locator('#closeBoard').click();
  await expect(page.locator('#boardModal')).toBeHidden();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.locator('.board-tab-btn[data-arg="global"]').click();
  await expect(page.locator('#boardBody')).toContainText('Perfil atual');
  await expect(page.locator('#boardHead')).toContainText('Acertos');
  const activeRows = await page.locator('#boardBody').textContent();
  const activeUpdate = await page.locator('#boardLastUpdate').textContent();
  const oldResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/rest/v1/leaderboard' && response.status() === 200);
  await lateRoute!.fulfill({ json: [{ ...recordRows[0], player_name: 'Resposta antiga fora de contexto' }] });
  await oldResponse;
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator('#boardBody')).toHaveText(activeRows!);
  await expect(page.locator('#boardLastUpdate')).toHaveText(activeUpdate!);
  await expect(page.locator('#boardBody')).not.toContainText('Resposta antiga fora de contexto');
  await expect(page.locator('#boardLoading')).toBeHidden();
  await expect(page.locator('#boardRefresh')).toBeEnabled();
  await page.locator('.board-tab-btn[data-arg="record"]').click();
  await expect.poll(() => records).toBe(3);
  await expect(page.locator('#boardBody')).toContainText('Ana da coleção');
  expect(profiles).toBe(1);
  expect(await rankingProtectedState(page)).toEqual(before);
  expect(writes).toEqual([]);
});

test('a ranking response captured for an old owner cannot paint the new owner context', async ({ page }) => {
  let records = 0;
  let lateRoute: Route | undefined;
  const writes = await localRoutes(page, async (route, url) => {
    if (url.hostname !== 'wviutasgroltjuyxpevc.supabase.co' || url.pathname !== '/rest/v1/leaderboard') return false;
    records++;
    if (records === 1) await route.fulfill({ status: 503, json: { message: 'Controlled first failure' } });
    else if (records === 2) lateRoute = route;
    else await route.fulfill({ json: recordRows });
    return true;
  });
  await enterGuestAtrium(page);
  const before = await rankingProtectedState(page);
  await page.locator('[data-atrium-route="ranking"]').click();
  const retry = page.locator('#boardBody').getByRole('button', { name: 'Tentar novamente', exact: true });
  await retry.click();
  await expect.poll(() => !!lateRoute).toBe(true);
  // Exercise the existing owner setter; no session/client/function is replaced,
  // no credential or premium metadata is supplied, and all writes are blocked.
  const nextOwner = 'e2822896-b95e-48d4-b6ad-8db86f69ea9d';
  await page.evaluate(id => { (window as any).authUser = { id, app_metadata: {}, user_metadata: {} }; }, nextOwner);
  const oldResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/rest/v1/leaderboard' && response.status() === 200);
  await lateRoute!.fulfill({ json: [{ ...recordRows[0], player_name: 'Resposta do contexto anterior' }] });
  await oldResponse;
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator('#boardBody')).not.toContainText('Resposta do contexto anterior');
  await expect(page.locator('#boardLoading')).toBeHidden();
  await expect(page.locator('#boardRefresh')).toBeEnabled();
  await expect(retry).toBeEnabled();
  await expect(retry).not.toHaveAttribute('aria-busy', 'true');
  await retry.click();
  await expect.poll(() => records).toBe(3);
  await expect(page.locator('#boardBody')).toContainText('Ana da coleção');
  const after = await rankingProtectedState(page);
  expect(after.owner).toBe(nextOwner);
  expect(after.progress).toEqual(before.progress);
  expect(after.journey).toBe(before.journey);
  expect(writes).toEqual([]);
});

for (const fault of ['rejection', 'incomplete'] as const) {
  test(`update recovery retries ${fault} without consuming the destination or clearing saved progress`, async ({ page }) => {
    const destination = '/jogar/?auth=login#retorno-local';
    const protectedStorage = {
      'nefroquest-save-v7': 'preserved-journey-bytes',
      'nefroquest-study-state': 'preserved-study-bytes',
      'nefroquest-exam-state': 'preserved-exam-bytes',
      'sb-wviutasgroltjuyxpevc-auth-token': 'preserved-auth-bytes',
      'nq-sw-version': '17.12',
    };
    const writes = await localRoutes(page, async (route, url) => {
      if (url.pathname !== '/jogar/') return false;
      await route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="pt-BR"><title>Destino local da recuperação</title><h1>Destino preservado</h1></html>' });
      return true;
    });
    await page.clock.install({ time: new Date('2026-11-13T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-11-13T12:00:01Z'));
    await page.addInitScript(({ fault, destination, protectedStorage }) => {
      if (location.pathname !== '/clear-cache.html') return;
      for (const [key, value] of Object.entries(protectedStorage)) localStorage.setItem(key, value);
      sessionStorage.setItem('nq-post-cache-url', destination);
      const nativeKeys = CacheStorage.prototype.keys;
      const nativeDelete = CacheStorage.prototype.delete;
      const probe = { deletes: 0, enumerations: 0, nativeDeletes: 0, release: null as null | (() => void) };
      (window as any).__recoveryProbe = probe;
      // Only the platform failure is controlled. Every successful operation
      // delegates to the real CacheStorage implementation on this local origin.
      const ready = caches.open('nq-recovery-old-fixture');
      CacheStorage.prototype.keys = async function () {
        await ready;
        probe.enumerations++;
        return nativeKeys.call(this);
      };
      CacheStorage.prototype.delete = async function (key: string) {
        if (key !== 'nq-recovery-old-fixture') return nativeDelete.call(this, key);
        probe.deletes++;
        if (probe.deletes === 1) {
          if (fault === 'rejection') throw new Error('Controlled storage failure');
          return false; // Resolved, but the old cache remains: not a success.
        }
        await new Promise<void>(resolve => { probe.release = resolve; });
        const removed = await nativeDelete.call(this, key);
        probe.nativeDeletes++;
        return removed;
      };
    }, { fault, destination, protectedStorage });
    await page.goto('/clear-cache.html', { waitUntil: 'domcontentloaded' });
    const status = page.locator('#status');
    const retry = page.getByRole('button', { name: 'Tentar novamente', exact: true });
    await expect(status).toHaveAttribute('role', 'alert');
    await expect(status).toContainText('Não foi possível concluir');
    await expect(status).not.toContainText('Pronto');
    await expect(retry).toBeVisible();
    await expect(retry).toBeEnabled();
    expect(await page.evaluate(() => sessionStorage.getItem('nq-post-cache-url'))).toBe(destination);
    expect(await page.evaluate(() => caches.keys())).toContain('nq-recovery-old-fixture');
    expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(protectedStorage))).toEqual(protectedStorage);
    await page.evaluate(() => document.documentElement.style.fontSize = '32px');
    const bounds = await retry.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await retry.focus();
    await retry.press('Enter');
    await expect.poll(() => page.evaluate(() => (window as any).__recoveryProbe.deletes)).toBe(2);
    await expect(retry).toBeDisabled();
    await expect(retry).toHaveAttribute('aria-busy', 'true');
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).not.toContainText('Pronto');
    await retry.evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
    expect(await page.evaluate(() => (window as any).__recoveryProbe.deletes)).toBe(2);
    expect(await page.evaluate(() => sessionStorage.getItem('nq-post-cache-url'))).toBe(destination);
    await page.evaluate(() => (window as any).__recoveryProbe.release());
    await expect(status).toContainText('Pronto');
    expect(await page.evaluate(() => (window as any).__recoveryProbe.nativeDeletes)).toBe(1);
    expect(await page.evaluate(() => caches.keys())).not.toContain('nq-recovery-old-fixture');
    expect(await page.evaluate(() => (window as any).__recoveryProbe.enumerations)).toBeGreaterThanOrEqual(3);
    await expect(retry).toBeHidden();
    await page.clock.fastForward(1500);
    await expect(page).toHaveURL(new RegExp('/jogar/\\?auth=login#retorno-local$'));
    await expect(page.getByRole('heading', { name: 'Destino preservado' })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('nq-post-cache-url'))).toBeNull();
    expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(protectedStorage))).toEqual(protectedStorage);
    expect(writes).toEqual([]);
  });
}
