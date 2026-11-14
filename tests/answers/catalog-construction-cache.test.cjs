'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const revisions = require('../../js/question-revisions.js');
const answers = require('../../js/answer-presentation.js');
const clone = value => JSON.parse(JSON.stringify(value));
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}'
  : JSON.stringify(value);
const digest = value => 'sha256:' + crypto.createHash('sha256').update(canonical(value), 'utf8').digest('hex');

function fixture(qid = 'construction-token') {
  const author = {qid, t: 'Tokens', cat: 'technical', diff: 'medium',
    q: 'Choose the marked token.', opts: ['marked', 'round', 'square', 'plain'], ans: 0,
    exp: 'The first token is marked.', refs: ['technical-card']};
  const references = {'technical-card': {label: 'Token card', resumo: 'A bounded technical card.'}};
  const source = {id: author.qid, q: author.q, o: [...author.opts], a: author.ans, e: author.exp};
  const sources = {main: [clone(source)], exam: [clone(source)], study: [clone(source)], offline: [clone(source)]};
  const authorRevision = digest(author), referenceRevisions = {'technical-card': digest(references['technical-card'])};
  const manifest = {version: 1, release: 'technical-construction', current: {[author.qid]: {
    authorRevision, referenceRevisions, recordRevision: digest({authorRevision, referenceRevisions}),
    sourceRevisions: Object.fromEntries(Object.entries(sources).map(([profile, [value]]) => [profile, digest(value)])),
  }}};
  return {manifest, history: [], authors: [author], sources, references};
}

test('published digest remains SHA-256 of exact canonical JSON across Unicode and block boundaries', () => {
  const values = [null, true, false, -0, 1.5, 'acentos: ação; emoji: 🧭; escapes: \u0000\n\\"',
    {z: 2, a: ['α', '\ud800', {nested: '日本語'}]},
    ...[0, 1, 54, 55, 56, 57, 62, 63, 64, 65, 127, 128, 129, 100000].map(size => 'x'.repeat(size)),
    JSON.parse('{"__proto__":{"safe":true},"constructor":"token","b":2,"a":1}')];
  for (const value of values) assert.equal(revisions.digest(value), digest(value));
  assert.equal(revisions.digest({b: 2, a: 1}), revisions.digest({a: 1, b: 2}));
  const injected = new Proxy(new Map(), {get() { throw Error('Extra arguments must stay ignored.'); }});
  assert.equal(revisions.digest(values[6], injected), digest(values[6]));
});

test('previous successful hashes never allow malformed JSON, accessors or mutation through validation', () => {
  const getter = {}; Object.defineProperty(getter, 'a', {enumerable: true, get() { throw Error('Accessor must not execute.'); }});
  const cyclic = {}; cyclic.self = cyclic;
  for (const value of [[, 'hole'], [undefined], {a: undefined}, {a: NaN}, Infinity, new Date(), /token/, cyclic, getter, 1n, Symbol('token')]) {
    revisions.digest({a: 1});
    assert.throws(() => revisions.digest(value), TypeError);
  }
  const mutable = {a: 1};
  assert.equal(revisions.digest(mutable), digest(mutable));
  mutable.a = 2; assert.equal(revisions.digest(mutable), digest(mutable));
  Object.defineProperty(mutable, 'a', {enumerable: true, get() { throw Error('Must reject accessor after a valid hash.'); }});
  assert.throws(() => revisions.digest(mutable), TypeError);
});

test('each runtime profile re-reads and validates shared reference values instead of trusting an earlier profile', () => {
  const data = fixture(), correct = clone(data.references['technical-card']); let reads = 0;
  Object.defineProperty(data.references, 'technical-card', {enumerable: true, get() {
    reads++; return reads === 1 ? correct : {...correct, resumo: 'Unpublished drift on the next read.'};
  }});
  assert.throws(() => revisions.createCatalog(data), /Runtime reference cards differ/);
  assert.equal(reads, 2);
  const valid = fixture(); assert(revisions.createCatalog(valid).current(valid.authors[0].qid, 'main'));
});

test('construction failure and later builds cannot retain trust for mutated author, source, card or record', () => {
  for (const mutate of [
    data => { data.authors[0].exp = 'Unpublished author drift.'; },
    data => { data.sources.exam[0].e = 'Unpublished source drift.'; },
    data => { data.references['technical-card'].resumo = 'Unpublished card drift.'; },
    data => { data.manifest.current[data.authors[0].qid].recordRevision = digest('invented'); },
  ]) {
    const data = fixture(); assert(revisions.createCatalog(data).current(data.authors[0].qid, 'main'));
    mutate(data); assert.throws(() => revisions.createCatalog(data), TypeError);
    const valid = fixture(); assert(revisions.createCatalog(valid).current(valid.authors[0].qid, 'study'));
  }
});

test('a reentrant build and extra option cannot redirect construction hashing or contaminate another build', () => {
  const outer = fixture(), inner = fixture(); let entered = false, entries = 0;
  Object.defineProperty(outer.authors[0], Symbol.toStringTag, {get() {
    if (!entered) { entered = true; entries++; assert(revisions.createCatalog(inner).current(inner.authors[0].qid, 'offline')); }
    return 'Object';
  }});
  Object.defineProperty(outer, 'digest', {get() { throw Error('A public option must not inject the private hash function.'); }});
  const catalog = revisions.createCatalog(outer);
  assert.equal(entries, 1); assert(catalog.current(outer.authors[0].qid, 'exam'));
  assert.equal(revisions.digest({a: 1}), digest({a: 1}));
});

test('catalog results remain defensive and runtime inspection rechecks a mutated snapshot after a valid lookup', () => {
  const data = fixture(), catalog = revisions.createCatalog(data), qid = data.authors[0].qid;
  const first = catalog.current(qid, 'main');
  first.author.exp = 'Do not retain caller edits.'; first.references['technical-card'].resumo = 'Do not retain caller edits.';
  first.source.e = 'Do not retain caller edits.'; first.binding.recordRevision = digest('invented');
  const again = catalog.current(qid, 'main');
  assert.deepEqual(again.author, data.authors[0]); assert.deepEqual(again.references, data.references);
  assert.deepEqual(again.source, data.sources.main[0]);
  const snapshot = answers.present(data.sources.main[0], {preserveOrder: true});
  assert.equal(catalog.inspect(snapshot, {profile: 'main', binding: again.binding}).status, 'known');
  snapshot.e = 'Unpublished mutation after a known inspection.';
  assert.equal(catalog.inspect(snapshot, {profile: 'main', binding: again.binding}).status, 'unknown');
});

test('async catalog snapshots all inputs before yielding and does not publish an intermediate result', async () => {
  assert.equal(typeof revisions.createCatalogAsync, 'function');
  const data = fixture(), before = clone(data), expected = revisions.createCatalog(before);
  let resolved = false;
  const firstTurn = new Promise(resolve => setTimeout(resolve, 0));
  const pending = revisions.createCatalogAsync(data).then(catalog => { resolved = true; return catalog; });
  data.authors[0].exp = 'Changed after the factory returned.';
  data.sources.main[0].q = 'Changed after the factory returned.';
  data.references['technical-card'].resumo = 'Changed after the factory returned.';
  data.manifest.current[data.authors[0].qid].recordRevision = digest('changed after call');
  await firstTurn;
  assert.equal(resolved, false, 'A caller task must get a turn before construction completes.');
  const catalog = await pending;
  for (const profile of Object.keys(before.sources))
    assert.deepEqual(catalog.current(before.authors[0].qid, profile), expected.current(before.authors[0].qid, profile));
});

test('async builds stay independent and clear failed construction without poisoning a later retry', async () => {
  const a = fixture('technical-a'), b = fixture('technical-b'), bad = fixture('technical-bad');
  bad.sources.study[0].e = 'Unpublished runtime drift.';
  const settled = await Promise.allSettled([revisions.createCatalogAsync(a), revisions.createCatalogAsync(b), revisions.createCatalogAsync(bad)]);
  assert.equal(settled[0].status, 'fulfilled'); assert.equal(settled[1].status, 'fulfilled');
  assert.equal(settled[2].status, 'rejected'); assert(settled[2].reason instanceof TypeError);
  assert(settled[0].value.current('technical-a', 'main')); assert.equal(settled[0].value.current('technical-b', 'main'), null);
  assert(settled[1].value.current('technical-b', 'main')); assert.equal(settled[1].value.current('technical-a', 'main'), null);
  assert((await revisions.createCatalogAsync(fixture('technical-retry'))).current('technical-retry', 'offline'));
});

test('async snapshots reject non-JSON accessors and cycles rather than using a value that can change during a yield', async () => {
  const accessor = fixture();
  Object.defineProperty(accessor.references, 'technical-card', {enumerable: true, get() { throw Error('Getter must not execute.'); }});
  await assert.rejects(revisions.createCatalogAsync(accessor), TypeError);
  const cycle = fixture(); cycle.authors[0].self = cycle.authors[0];
  await assert.rejects(revisions.createCatalogAsync(cycle), TypeError);
  const sparse = fixture(); sparse.sources.main = [, sparse.sources.main[0]];
  await assert.rejects(revisions.createCatalogAsync(sparse), TypeError);
});

test('async construction gives other macrotasks repeated turns while retaining synchronous catalog behavior', async () => {
  const data = {manifest: {version: 1, release: 'technical-many', current: {}}, history: [], authors: [],
    sources: {main: [], exam: [], study: [], offline: []}, references: fixture().references};
  for (let i = 0; i < 160; i++) {
    const row = fixture('technical-many-' + i);
    data.authors.push(row.authors[0]); Object.assign(data.manifest.current, row.manifest.current);
    for (const profile of Object.keys(data.sources)) data.sources[profile].push(row.sources[profile][0]);
  }
  const expected = revisions.createCatalog(data); let turns = 0;
  const timer = setInterval(() => { turns++; }, 0);
  let actual;
  try { actual = await revisions.createCatalogAsync(data); } finally { clearInterval(timer); }
  assert(turns >= 2, 'Construction must yield across more than its initial task.');
  for (const author of data.authors) for (const profile of Object.keys(data.sources))
    assert.deepEqual(actual.current(author.qid, profile), expected.current(author.qid, profile));
});

test('async and sync published catalogs retain every current and historical value, binding and policy in all four profiles', async () => {
  const builder = require('../../tools/build-question-revision-manifest.cjs');
  const authors = builder.load('data/topics.js', 'topics'), references = builder.load('data/refs.js', 'refsDB');
  const manifest = builder.load('data/question-revision-manifest.js', 'NQQuestionRevisionManifest');
  const history = builder.load('data/question-revision-history.js', 'NQQuestionRevisionHistory');
  const sources = {main: [], exam: [], study: [], offline: []};
  authors.forEach((author, index) => Object.entries(builder.sources(author, index))
    .forEach(([profile, source]) => sources[profile].push(source)));
  const data = {manifest, history, authors, sources, references};
  const expected = revisions.createCatalog(data), actual = await revisions.createCatalogAsync(data);
  let currentProfiles = 0, historicalProfiles = 0;
  for (const [profile, list] of Object.entries(sources)) for (const source of list) {
    const before = expected.current(source.id, profile), after = actual.current(source.id, profile);
    assert.deepEqual(after, before, source.id + ':' + profile);
    assert.deepEqual(actual.inspect(source, {profile, binding: after.binding}),
      expected.inspect(source, {profile, binding: before.binding}), source.id + ':' + profile);
    currentProfiles++;
  }
  for (const archived of history) for (const [profile, source] of Object.entries(archived.sources)) {
    const options = {profile, binding: archived.bindings[profile]};
    assert.deepEqual(actual.inspect(source, options), expected.inspect(source, options), archived.qid + ':' + profile);
    assert.deepEqual(actual.inspectLegacy(archived.qid, options), expected.inspectLegacy(archived.qid, options), archived.qid + ':' + profile);
    historicalProfiles++;
  }
  assert.equal(authors.length, 741); assert.equal(currentProfiles, 2964);
  assert.equal(history.length, 169); assert.equal(historicalProfiles, 676);
});
