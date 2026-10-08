import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('SW installation waits for every successful cache write', async () => {
  const source = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
  const handlers = new Map();
  let releaseWrites;
  const writes = new Promise(resolve => { releaseWrites = resolve; });
  let writesStarted = 0;
  let fetchesStarted = 0;
  let installation;
  let completed = false;
  const sandbox = {
    self: { addEventListener: (type, handler) => handlers.set(type, handler), skipWaiting() {} },
    caches: { open: async () => ({ put: () => { writesStarted++; return writes; } }) },
    fetch: async () => { fetchesStarted++; return { ok: true, clone() { return this; } }; },
    console, URL, Request,
  };
  vm.runInNewContext(source, sandbox, { filename: 'sw.js' });
  handlers.get('install')({ waitUntil: promise => { installation = promise; promise.then(() => { completed = true; }); } });
  try {
    await new Promise(setImmediate);
    assert.ok(fetchesStarted > 0, 'precache must request assets');
    assert.equal(writesStarted, fetchesStarted, 'all successful assets start a cache write');
    assert.equal(completed, false, 'install must stay alive while its cache writes are pending');
  } finally {
    releaseWrites();
    await installation;
  }
  assert.equal(completed, true, 'install may complete after the writes resolve');
});
