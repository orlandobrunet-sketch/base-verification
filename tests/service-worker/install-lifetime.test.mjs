import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../../' + path.replace(/^\//, ''), import.meta.url));
const source = read('sw.js').toString();
const origin = 'https://nq.test';

function worker({ failure, waitForWrite } = {}) {
  const handlers = new Map(), stores = new Map(), network = [];
  let skipped = 0;
  const key = request => new URL(typeof request === 'string' ? request : request.url, origin).pathname;
  const open = async cacheName => {
    if (!stores.has(cacheName)) stores.set(cacheName, new Map());
    const entries = stores.get(cacheName);
    return {
      match: async request => entries.get(key(request))?.clone(),
      put: async (request, response) => {
        const name = key(request);
        if (failure?.(cacheName, name)) throw new DOMException('Quota exceeded', 'QuotaExceededError');
        await waitForWrite?.(cacheName, name);
        entries.set(name, response.clone());
      },
      delete: async request => entries.delete(key(request)),
      keys: async () => [],
    };
  };
  const sandbox = {
    self: { addEventListener: (type, handler) => handlers.set(type, handler), skipWaiting() { skipped++; } },
    caches: { open, keys: async () => [...stores.keys()], has: async name => stores.has(name) },
    fetch: async request => {
      const path = key(request);
      network.push(path);
      return new Response(path === '/offline.html' || /\/(?:answer-presentation|question-revisions|topics|question-revision-(?:manifest|history))\.js$/.test(path) ? read(path) : 'generic fixture');
    },
    console, URL, Request, Response, Headers, Uint8Array, AbortSignal, crypto: webcrypto, location: {origin},
  };
  vm.runInNewContext(source, sandbox, { filename: 'sw.js' });
  const lifecycle = (type, details) => {
    let completion;
    handlers.get(type)({ ...details, waitUntil: promise => { completion = promise; } });
    return completion;
  };
  return { stores, network, open, lifecycle, skipped: () => skipped };
}

test('install persists the complete package before honoring SKIP_WAITING; install awaits generic cache writes too', async () => {
  let unblockMarker;
  const markerGate = new Promise(resolve => { unblockMarker = resolve; });
  let unblockGeneric;
  const genericGate = new Promise(resolve => { unblockGeneric = resolve; });
  let markerStarted, genericStarted;
  const markerReached = new Promise(resolve => { markerStarted = resolve; });
  const genericReached = new Promise(resolve => { genericStarted = resolve; });
  const fixture = worker({ waitForWrite: (name, key) => {
    if (key.endsWith('/ready')) { markerStarted(); return markerGate; }
    if (/^nefroquest-v/.test(name)) { genericStarted(); return genericGate; }
  } });
  const install = fixture.lifecycle('install');
  await markerReached;
  const skip = fixture.lifecycle('message', { data: { type: 'SKIP_WAITING' } });
  let finished = false;
  install.then(() => { finished = true; });
  assert.equal(fixture.skipped(), 0);
  assert(fixture.network.includes('/data/topics.js'));
  for (const cache of fixture.stores.values()) for (const key of cache.keys())
    assert.match(key, /^\/__nq_offline_bundle__\//, 'old worker must not see staged bytes under canonical keys');
  unblockMarker();
  await genericReached;
  assert.equal(finished, false);
  unblockGeneric();
  await Promise.all([install, skip]);
  assert.equal(finished, true);
  assert(fixture.skipped() > 0);
});

for (const blocked of [/\/ready$/, /\/5$/]) {
  test('rejects incomplete initial install, even with SKIP_WAITING: ' + blocked, async () => {
    const fixture = worker({ failure: (name, key) => name.startsWith('nefroquest-offline-bundle-') && blocked.test(key) });
    const install = fixture.lifecycle('install');
    const skip = fixture.lifecycle('message', { data: { type: 'SKIP_WAITING' } });
    await assert.rejects(install, /Nenhum pacote/);
    await skip;
    assert.equal(fixture.skipped(), 0);
    assert.equal([...fixture.stores.values()].some(cache => [...cache.keys()].some(k => k.endsWith('/ready'))), false);
  });
}
