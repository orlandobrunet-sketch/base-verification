import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('cinematic movies keep native full and partial HTTP responses', async () => {
  const handlers = new Map();
  const sandbox = {
    self: { addEventListener: (type, handler) => handlers.set(type, handler) },
    location: { origin: 'https://nefroquest.com' },
    caches: { match: async () => undefined, open: async () => ({ put: async () => {} }) },
    fetch: async () => ({ ok: true, clone() { return this; } }),
    console, URL, Request,
  };
  vm.runInNewContext(readFileSync(new URL('../../sw.js', import.meta.url), 'utf8'), sandbox);
  for (const headers of [{}, { Range: 'bytes=0-1023' }]) {
    let intercepted = false;
    handlers.get('fetch')({
      request: new Request('https://nefroquest.com/assets/cinema/v1/nephros.mp4', { headers }),
      respondWith() { intercepted = true; },
    });
    assert.equal(intercepted, false, 'the browser must handle movie streaming and seeking');
  }
  let response;
  handlers.get('fetch')({
    request: new Request('https://nefroquest.com/js/game.js'),
    respondWith(promise) { response = promise; },
  });
  assert.ok(response, 'ordinary game assets must retain their offline cache handler');
  assert.equal((await response).ok, true);
});
