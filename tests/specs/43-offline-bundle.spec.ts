import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => readFileSync(path.join(root, file));
const digest = (body: Buffer) => createHash('sha256').update(body).digest('hex');
const worker = read('sw.js').toString();
const bundlePrefix = '/__nq_offline_bundle__/';
const stagePrefix = 'nefroquest-offline-bundle-';
const pathOf = (url: string) => url.split('?')[0];
type Bundle = { files: Map<string, Buffer>, sw: string, id: string };
const baseFiles = ['/offline.html', ...Array.from(read('offline.html').toString().matchAll(/<script\b[^>]*src="([^"]+)"/g), m => m[1])];

function bundle(change?: 'bank' | 'history' | 'manifest' | 'quota'): Bundle {
  const originals = new Map(baseFiles.map(url => [url, read(pathOf(url))]));
  const pin = change === 'bank' ? '/data/topics.js'
    : change === 'history' ? '/data/question-revision-history.js'
    : '/data/question-revision-manifest.js';
  const files = new Map(originals);
  if (change) {
    const from = baseFiles.find(url => pathOf(url) === pin)!;
    const to = pin + '?release=98.93';
    const html = Buffer.from(originals.get('/offline.html')!.toString().replace(from, to));
    const altered = Buffer.concat([originals.get(from)!, Buffer.from('\n;window.__nqFixtureChanged = true;\n')]);
    files.clear();
    originals.forEach((bytes, url) => files.set(url === from ? to : url,
      url === from ? altered : url === '/offline.html' ? html : bytes));
  }
  const rows = Array.from(files, ([url, bytes]) => [url, digest(bytes)]);
  let sw = worker.replace(/const OFFLINE_FILES = \[[\s\S]*?\n\];/, 'const OFFLINE_FILES = ' + JSON.stringify(rows) + ';')
    .replace(/const STATIC_ASSETS = \[[\s\S]*?\n\];/, 'const STATIC_ASSETS = [];');
  if (change) sw = sw.replace(/const CACHE = 'nefroquest-v[\d.]+';/, "const CACHE = 'nefroquest-v98.93';");
  if (change === 'quota') sw = sw.replace("await cache.put(offlineKey(id, 'ready'),", `
    if (id === currentOfflineId && (await fetch('/fixture-quota', { cache: 'no-store' })).status === 503)
      throw new DOMException('Test quota', 'QuotaExceededError');
    await cache.put(offlineKey(id, 'ready'),`);
  return { files, sw, id: rows[0][1] };
}

function migrationFromPublicWorker(): Bundle {
  const ref = 'e786d185e7296a101f08599092548a65251fbd66';
  const fromGit = (file: string) => execFileSync('git', ['show', ref + ':' + file.replace(/^\//, '')], { cwd: root, maxBuffer: 12 * 1024 * 1024 });
  const html = fromGit('/offline.html');
  const urls = ['/offline.html', ...Array.from(html.toString().matchAll(/<script\b[^>]*src="([^"]+)"/g), m => m[1])];
  const files = new Map(urls.map(url => [url, fromGit(pathOf(url))]));
  const sw = fromGit('/sw.js').toString().replace(/const STATIC_ASSETS = \[[\s\S]*?\n\];/, 'const STATIC_ASSETS = ' + JSON.stringify(urls.map(pathOf)) + ';');
  return { files, sw, id: digest(html) };
}

async function withSite(initial: Bundle, run: (site: {
  url: string,
  requests: string[],
  publish: (next: Bundle, fail: string, stale?: Buffer) => void,
  fix: () => void,
}) => Promise<void>) {
  let current = initial;
  let fault = '';
  let staleBytes: Buffer | undefined;
  const requests: string[] = [];
  const server = createServer((request, response) => {
    const url = request.url!;
    requests.push(url);
    if (url === '/sw.js') return response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' }).end(current.sw);
    if (url === fault && !staleBytes) return response.writeHead(503, { 'Cache-Control': 'no-store' }).end();
    if (url === '/fixture-quota') return response.writeHead(200).end();
    const bytes = url === fault ? staleBytes : current.files.get(url);
    if (bytes) return response.writeHead(200, { 'Content-Type': url === '/offline.html' ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' }).end(bytes);
    return response.writeHead(404).end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const { port } = server.address() as { port: number };
    await run({ url: `http://127.0.0.1:${port}/offline.html`, requests,
      publish(next, fail, stale) { current = next; fault = fail; staleBytes = stale; },
      fix() { fault = ''; staleBytes = undefined; } });
  } finally {
    const closed = once(server, 'close');
    server.close();
    server.closeAllConnections();
    await closed;
  }
}

const controller = (page: Page) => page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
const choices = (page: Page) => page.locator('.nq-off-btn');
const save = (page: Page) => page.evaluate(() => localStorage.getItem('nefroquest-offline-study-state'));
const stats = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-detailed-stats') || '{}'));
const ready = (page: Page, id: string) => page.evaluate(async ({ name, key }) => Boolean(await caches.match(key, { cacheName: name })),
  { name: stagePrefix + id, key: bundlePrefix + id + '/ready' });

test.use({ launchOptions: {
  executablePath: process.env.NQ_CHROMIUM_PATH || undefined,
  args: ['--no-proxy-server', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'],
} });
test.describe.configure({ timeout: 45_000 });

test('a new visitor opening Offline Study directly can reload without network after preparation', async ({ page, context }) => {
  const initial = bundle();
  await withSite(initial, async site => {
    await page.goto(site.url);
    await expect(choices(page)).toHaveCount(4);
    await controller(page);
    expect(await ready(page, initial.id)).toBe(true);
    await context.setOffline(true);
    const response = await page.reload();
    expect(response?.fromServiceWorker()).toBe(true);
    await expect(choices(page)).toHaveCount(4);
    expect(await page.locator(`script[src^="${bundlePrefix}${initial.id}/"]`).count()).toBe(5);
  });
});

for (const scenario of ['bank', 'history', 'quota', 'manifest'] as const) {
  test(`an interrupted ${scenario} update preserves and resumes offline study`, async ({ page, context }) => {
    const legacy = Boolean(process.env.NQ_EXACT_LEGACY);
    const initial = legacy ? migrationFromPublicWorker() : bundle();
    const exactCandidate = legacy && scenario === 'manifest';
    const next = exactCandidate ? bundle() : bundle(scenario);
    const failedPath = scenario === 'bank' ? '/data/topics.js?release=98.93'
      : scenario === 'history' ? '/data/question-revision-history.js?release=98.93'
      : scenario === 'quota' ? '/fixture-quota'
      : [...next.files.keys()].find(url => url.startsWith('/data/question-revision-manifest.js?'))!;
    await withSite(initial, async site => {
      await page.goto(site.url);
      if (legacy) await page.evaluate(() => navigator.serviceWorker.register('/sw.js'));
      await controller(page);
      await expect(choices(page)).toHaveCount(4);
      const arbitraryOtherCache = 'another-app-test-cache';
      await page.evaluate(name => caches.open(name), arbitraryOtherCache);
      const correct = await page.evaluate(() => (window as any).eval('currentPresentation.a'));
      await choices(page).nth(correct).click();
      await expect(page.getByText('✅ Resposta Correta!')).toBeVisible();
      const answered = await save(page);
      expect((await stats(page)).totalQuestions).toBe(1);
      const order = await choices(page).allTextContents();

      await page.evaluate(() => navigator.serviceWorker.addEventListener('controllerchange', () => {
        (window as any).__nqReplacedWorker = true;
      }, { once: true }));
      site.publish(next, failedPath, scenario === 'history'
        ? initial.files.get([...initial.files.keys()].find(url => url.startsWith('/data/question-revision-history.js'))!) : undefined);
      await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
      await page.waitForFunction(() => (window as any).__nqReplacedWorker === true);
      expect(site.requests).toContain(failedPath);
      expect(await ready(page, initial.id)).toBe(true);
      expect(await ready(page, next.id)).toBe(false);
      expect(await page.evaluate(name => caches.has(name), arbitraryOtherCache)).toBe(true);

      await context.setOffline(true);
      const offline = await page.reload();
      expect(offline?.fromServiceWorker()).toBe(true);
      await expect(page.getByText('✅ Resposta Correta!')).toBeVisible();
      expect(await choices(page).allTextContents()).toEqual(order);
      expect(await save(page)).toBe(answered);
      expect((await stats(page)).totalQuestions).toBe(1);
      expect(await page.locator(`script[src^="${bundlePrefix}${initial.id}/"]`).count()).toBe(5);
      expect(await page.evaluate(() => (window as any).__nqFixtureChanged)).toBeUndefined();

      site.fix();
      await context.setOffline(false);
      await expect.poll(async () => {
        await page.reload();
        return ready(page, next.id);
      }, { timeout: 15_000, intervals: [250, 750, 1000] }).toBe(true);
      await context.setOffline(true);
      await page.reload();
      await expect(page.getByText('✅ Resposta Correta!')).toBeVisible();
      expect(await choices(page).allTextContents()).toEqual(order);
      expect(await save(page)).toBe(answered);
      expect(await page.locator(`script[src^="${bundlePrefix}${next.id}/"]`).count()).toBe(5);
      expect(await page.evaluate(() => (window as any).__nqFixtureChanged)).toBe(exactCandidate ? undefined : true);
      await page.getByRole('button', { name: 'Próxima Questão' }).click();
      await expect(page.getByRole('heading', { name: 'Questão 2' })).toBeVisible();
      expect(JSON.parse((await save(page))!).index).toBe(1);
      expect((await stats(page)).totalQuestions).toBe(1);
    });
  });
}

test('a cold browser can answer online despite a rejected readiness write, then prepare on reload', async ({ page, context }) => {
  const initial = bundle('quota');
  await withSite(initial, async site => {
    site.publish(initial, '/fixture-quota');
    await page.goto(site.url);
    await expect(choices(page)).toHaveCount(4);
    await expect.poll(() => site.requests.includes('/fixture-quota')).toBe(true);
    const correct = await page.evaluate(() => (window as any).eval('currentPresentation.a'));
    await choices(page).nth(correct).click();
    await expect(page.getByText('✅ Resposta Correta!')).toBeVisible();
    expect(await ready(page, initial.id)).toBe(false);
    expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
    const answered = await save(page);

    site.fix();
    await expect.poll(async () => {
      await page.reload();
      return ready(page, initial.id);
    }, { timeout: 15_000, intervals: [200, 500] }).toBe(true);
    await controller(page);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('✅ Resposta Correta!')).toBeVisible();
    expect(await save(page)).toBe(answered);
    expect((await stats(page)).totalQuestions).toBe(1);
  });
});

test('an old sparse cache does not certify or activate a partial replacement', async ({ page }) => {
  const legacy = Boolean(process.env.NQ_EXACT_LEGACY);
  const initial = legacy ? migrationFromPublicWorker() : bundle();
  const next = bundle('bank');
  await withSite(initial, async site => {
    await page.goto(site.url);
    if (legacy) await page.evaluate(() => navigator.serviceWorker.register('/sw.js'));
    await controller(page);
    await expect(choices(page)).toHaveCount(4);
    const originalWorker = await page.evaluateHandle(() => navigator.serviceWorker.controller);
    await page.evaluate(async ({ id, legacy, prefix, stage }) => {
      const cache = await caches.open(legacy ? 'nefroquest-v17.34' : stage + id);
      await cache.delete(legacy ? '/data/topics.js' : prefix + id + '/5');
    }, { id: initial.id, legacy, prefix: bundlePrefix, stage: stagePrefix });
    const originalSave = await save(page);
    const failed = '/data/topics.js?release=98.93';
    site.publish(next, failed);
    const status = await page.evaluate(async () => {
      const reg = (await navigator.serviceWorker.getRegistration())!;
      const outcome = new Promise(resolve => reg.addEventListener('updatefound', () => {
        const installing = reg.installing!;
        installing.postMessage({ type: 'SKIP_WAITING' });
        installing.addEventListener('statechange', () => {
          if (['redundant', 'activated'].includes(installing.state)) resolve(installing.state);
        });
      }, { once: true }));
      await reg.update();
      return outcome;
    });
    expect(status).toBe('redundant');
    expect(await page.evaluate(worker => navigator.serviceWorker.controller === worker, originalWorker)).toBe(true);
    expect(site.requests).toContain(failed);
    expect(await ready(page, next.id)).toBe(false);
    expect(await save(page)).toBe(originalSave);

    site.fix();
    await page.evaluate(() => navigator.serviceWorker.addEventListener('controllerchange', () => {
      (window as any).__nqReplacedWorker = true;
    }, { once: true }));
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
    await page.waitForFunction(() => (window as any).__nqReplacedWorker === true);
    await page.reload();
    await expect(choices(page)).toHaveCount(4);
    expect(await ready(page, next.id)).toBe(true);
    expect(await save(page)).toBe(originalSave);
  });
});
