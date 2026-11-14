'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../../js/game.js'), 'utf8');
const begin = source.indexOf('let _questionRevisionCatalogPromise = null;');
const end = source.indexOf('    function _loadTopics(', begin);
assert(begin >= 0 && end > begin, 'Native catalog initialization boundary required.');

function environment(api) {
  const author = {qid: 'loading-token', q: 'Choose a token.', opts: ['A', 'B'], ans: 0};
  const context = vm.createContext({Promise, Error, topics: [author], refsDB: {}, questionBank: [{id: author.qid}],
    _studyCanonical: value => ({id: value.qid}), _requiresQuestionRevisionCatalog: () => true,
    window: {NQQuestionRevisions: api, NQQuestionRevisionManifest: {}, NQQuestionRevisionHistory: []}});
  vm.runInContext(source.slice(begin, end), context);
  return {context, start: () => context._initializeQuestionRevisionCatalog()};
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}

test('native initialization shares pending work and publishes nothing before all profiles validate', async () => {
  const work = deferred(), calls = [], catalog = Object.freeze({current() {}});
  const env = environment({createCatalogAsync: options => { calls.push(options); return work.promise; },
    createCatalog() { throw Error('Synchronous preparation must not run when async is available.'); }});
  const first = env.start(), second = env.start();
  assert.equal(first, second);
  assert.equal(env.context.window.questionRevisionCatalog, undefined);
  await Promise.resolve();
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(calls[0].sources), ['main', 'exam', 'study', 'offline']);
  assert.equal(calls[0].sources.main, calls[0].sources.exam);
  assert.equal(env.context.window.questionRevisionCatalog, undefined);
  work.resolve(catalog); await Promise.all([first, second]);
  assert.equal(env.context.window.questionRevisionCatalog, catalog);
  assert.equal(env.start(), undefined); assert.equal(calls.length, 1);
});

test('rejected preparation leaves no partial catalog and a later attempt can validate normally', async () => {
  const firstWork = deferred(), secondWork = deferred(), catalog = Object.freeze({current() {}});
  let calls = 0;
  const env = environment({createCatalogAsync: () => ++calls === 1 ? firstWork.promise : secondWork.promise});
  const first = env.start(); await Promise.resolve();
  firstWork.reject(Error('Unpublished source drift'));
  await assert.rejects(first, /Unpublished source drift/);
  assert.equal(env.context.window.questionRevisionCatalog, undefined);
  const retry = env.start(); assert.notEqual(retry, first); await Promise.resolve();
  assert.equal(calls, 2); assert.equal(env.context.window.questionRevisionCatalog, undefined);
  secondWork.resolve(catalog); await retry;
  assert.equal(env.context.window.questionRevisionCatalog, catalog);
});

test('legacy synchronous bundles remain validated and a missing release cannot publish a catalog', async () => {
  const catalog = Object.freeze({current() {}}); let calls = 0;
  const env = environment({createCatalog: () => { calls++; return catalog; }});
  await env.start(); assert.equal(calls, 1); assert.equal(env.context.window.questionRevisionCatalog, catalog);
  const missing = environment({createCatalog: () => { throw Error('Must not be called'); }});
  delete missing.context.window.NQQuestionRevisionManifest;
  assert.throws(missing.start, /Published question revision files unavailable/);
  assert.equal(missing.context.window.questionRevisionCatalog, undefined);
});
