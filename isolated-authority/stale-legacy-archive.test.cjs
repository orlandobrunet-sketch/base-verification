'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createAuthority} = require('./owner-authority.cjs');
const {create} = require('../js/normal-authority.js');

const keys = {
  saveRaw: 'nefroquest-save-v7', legacyRaw: 'nefroquest-save',
  articlesRaw: 'unlockedArticles', knowledgeRaw: 'nefroquest_total_accumulated_knowledge',
};
const uuid = number => '00000000-0000-4000-8000-' + String(number).padStart(12, '0');

async function fixture(owner = 'owner-a') {
  const seed = {schemaVersion: 7, saveOwner: owner, saveRevision: uuid(1), character: 'nephros',
    difficulty: 'normal', gameStarted: true, gameOver: false, lives: 3, score: 10, gold: 5};
  const baseline = {saveRaw: JSON.stringify(seed), legacyRaw: JSON.stringify(seed),
    articlesRaw: '[1]', knowledgeRaw: '3'};
  const checkpointKey = `nefroquest-cloud:${owner}`;
  const map = new Map([[checkpointKey, '{"version":19}'], ['nefroquest-sr-data', '{"old-stats":[]}']]);
  const write = view => Object.entries(view).forEach(([name, raw]) => {
    if (raw === null) map.delete(keys[name]);
    else map.set(keys[name], raw);
  });
  write(baseline);
  const hooks = {beforeGet: null, onSet: null};
  const storage = {
    getItem(key) { hooks.beforeGet?.(key); return map.get(key) ?? null; },
    setItem(key, value) { if (!hooks.onSet) map.set(key, value); else hooks.onSet(key, value); },
    removeItem(key) { map.delete(key); },
  };
  let held = false;
  let identity = 1;
  const locks = {async request(_name, _options, run) {
    if (held) return run(null);
    held = true;
    try { return await run({}); } finally { held = false; }
  }};
  const make = () => create({createAuthority, storage, locks, owner, currentOwner: () => owner,
    identityGeneration: () => identity, newJourneyId: () => uuid(10), validateSave(save, expectedOwner) {
      return save.saveOwner === expectedOwner && save.character === 'nephros' &&
        (save.schemaVersion === 7 || save.classBenefits?.journeyId === uuid(10));
    },
  });
  const first = make();
  await first.bootstrap();
  assert.ok(first.beginTransaction());
  const receipt = first.stageChest();
  assert.ok(first.commit({...first.loadSave(), score: 350, gold: 80}));
  const fingerprint = first.authority.fingerprint();
  const authorityKey = first.authority.key;
  await first.release();
  const stale = (number, {version = 7, snapshot = {}, mirror = true, collections = {}} = {}) => {
    const save = {...seed, score: 45, gold: 20, saveRevision: uuid(number), schemaVersion: version,
      ...(version === 9 ? {journeyDomain: 'normal', classBenefits: {journeyId: uuid(10)}} : {}), ...snapshot};
    const saveRaw = JSON.stringify(save, null, 2);
    return {saveRaw, legacyRaw: mirror ? saveRaw : null, articlesRaw: '[ 1, 5 ]', knowledgeRaw: '5', ...collections};
  };
  return {authorityKey, baseline, checkpointKey, fingerprint, hooks, make, map, receipt, stale, write,
    changeIdentity() { identity++; },
    view: () => Object.fromEntries(Object.keys(keys).map(name => [name, map.get(keys[name]) ?? null])),
  };
}

function payload(archive) {
  return Object.fromEntries(Object.keys(keys).map(name => [name, archive[name]]));
}

test('reopen archives a stale signed-in v9 save without a mirror and preserves authority and cloud bytes', async () => {
  const f = await fixture();
  const stale = f.stale(2, {version: 9, mirror: false});
  f.write(stale);
  const withoutOptIn = f.make();
  await assert.rejects(withoutOptIn.bootstrap(), {code: 'LEGACY_CONFLICT'});
  const store = f.make();
  try {
    const current = await store.bootstrap({archiveStaleLegacy: true});
    assert.equal(store.authority.fingerprint(), f.fingerprint);
    assert.equal(current.save.score, 350);
    assert.deepEqual(current.receipts, [f.receipt]);
    assert.deepEqual(current.collections, {articles: [1], knowledge: 3});
    assert.deepEqual(current.source.guard, stale);
    assert.deepEqual(payload(current.source), f.baseline);
    assert.deepEqual(f.view(), stale);
    const [legacy] = store.legacySourceArchives();
    assert.equal(legacy.index, 0);
    assert.ok(Number.isSafeInteger(legacy.archivedAt));
    assert.deepEqual(payload(legacy), stale);
    assert.equal(f.map.get(f.checkpointKey), '{"version":19}');
    assert.equal(f.map.get('nefroquest-sr-data'), '{"old-stats":[]}');
  } finally { await store.release(); }
});

test('a repeated open is idempotent and all distinct old writes are kept across ten reopenings', async () => {
  const f = await fixture();
  for (let index = 0; index < 10; index++) {
    const changed = f.stale(index + 2);
    f.write(changed);
    const store = f.make();
    await store.bootstrap({archiveStaleLegacy: true});
    assert.deepEqual(store.legacySourceArchives().map(payload),
      Array.from({length: index + 1}, (_, archived) => f.stale(archived + 2)));
    assert.equal(store.authority.fingerprint(), f.fingerprint);
    await store.release();
    const unchanged = f.map.get(f.authorityKey);
    const replay = f.make();
    await replay.bootstrap({archiveStaleLegacy: true});
    assert.equal(f.map.get(f.authorityKey), unchanged);
    await replay.release();
  }
});

for (const [name, configure] of [
  ['foreign canonical owner', f => f.write(f.stale(2, {snapshot: {saveOwner: 'owner-b'}}))],
  ['foreign mirror', f => f.write({...f.stale(2), legacyRaw: f.stale(3, {snapshot: {saveOwner: 'owner-b'}}).saveRaw})],
  ['missing canonical', f => f.write({...f.stale(2), saveRaw: null})],
  ['tombstone', f => f.write({...f.stale(2), saveRaw: '{"schemaVersion":7,"saveOwner":"owner-a","save":null}'})],
  ['unknown save revision', f => f.write(f.stale(2, {snapshot: {saveRevision: 'unknown'}}))],
  ['pilot domain', f => f.write(f.stale(2, {version: 9, snapshot: {journeyDomain: 'pilot'}}))],
  ['host-invalid save', f => f.write(f.stale(2, {snapshot: {character: 'unknown'}}))],
  ['article-only divergence', f => f.write({...f.baseline, articlesRaw: '[8]'})],
  ['invalid articles', f => f.write(f.stale(2, {collections: {articlesRaw: '[1,1]'}}))],
  ['invalid knowledge', f => f.write(f.stale(2, {collections: {knowledgeRaw: '-3'}}))],
  ['incomplete projection', f => {
    f.write(f.stale(2));
    const authority = JSON.parse(f.map.get(f.authorityKey));
    authority.source.auxiliaryProjection = {before: {}, target: {}};
    f.map.set(f.authorityKey, JSON.stringify(authority));
  }],
  ['incomplete retirement', f => {
    f.write(f.stale(2));
    const authority = JSON.parse(f.map.get(f.authorityKey));
    authority.source.retirementIntent = {owner: 'owner-a', from: f.baseline,
      to: {saveRaw: '{"schemaVersion":7,"saveOwner":"owner-a","save":null,"resetReason":"logout"}',
        legacyRaw: null, articlesRaw: null, knowledgeRaw: null}};
    f.map.set(f.authorityKey, JSON.stringify(authority));
  }],
]) test(`reopen preserves foreign or uncertain bytes for ${name}`, async () => {
  const f = await fixture();
  configure(f);
  const before = [...f.map];
  await assert.rejects(f.make().bootstrap({archiveStaleLegacy: true}), {code: 'LEGACY_CONFLICT'});
  assert.deepEqual([...f.map], before);
});

test('guest recovery needs an unambiguous matching canonical save and mirror', async () => {
  const f = await fixture(null);
  const certain = f.stale(2);
  f.write({...certain, legacyRaw: null});
  await assert.rejects(f.make().bootstrap({archiveStaleLegacy: true}), {code: 'LEGACY_CONFLICT'});
  f.write(certain);
  const store = f.make();
  try {
    await store.bootstrap({archiveStaleLegacy: true});
    assert.deepEqual(store.legacySourceArchives().map(payload), [certain]);
  } finally { await store.release(); }
});

test('quota refusal and lost readback leave both sources intact and retry without duplicate archives', async () => {
  const f = await fixture();
  const stale = f.stale(2);
  f.write(stale);
  const before = [...f.map];
  f.hooks.onSet = () => { throw Error('quota'); };
  await assert.rejects(f.make().bootstrap({archiveStaleLegacy: true}), {code: 'REFUSED'});
  assert.deepEqual([...f.map], before);

  f.hooks.onSet = (key, value) => {
    f.map.set(key, value);
    f.hooks.beforeGet = () => { throw Error('readback unavailable'); };
    throw Error('lost response');
  };
  await assert.rejects(f.make().bootstrap({archiveStaleLegacy: true}), {code: 'UNKNOWN'});
  f.hooks.onSet = f.hooks.beforeGet = null;
  const store = f.make();
  try {
    await store.bootstrap({archiveStaleLegacy: true});
    assert.deepEqual(store.legacySourceArchives().map(payload), [stale]);
    assert.deepEqual(f.view(), stale);
    assert.equal(store.authority.fingerprint(), f.fingerprint);
  } finally { await store.release(); }
});

test('an identity change after obtaining a lease refuses a pending archive before writing', async () => {
  const f = await fixture();
  f.write(f.stale(2));
  const before = [...f.map];
  f.hooks.beforeGet = key => {
    if (key === keys.saveRaw) { f.hooks.beforeGet = null; f.changeIdentity(); }
  };
  await assert.rejects(f.make().bootstrap({archiveStaleLegacy: true}), {code: 'UNAVAILABLE'});
  assert.deepEqual([...f.map], before);
});

test('a stale writer changing source bytes before authority commit leaves authority unmodified', async () => {
  const f = await fixture();
  f.write(f.stale(2));
  const initial = f.map.get(f.authorityKey);
  const second = f.stale(3);
  let reads = 0;
  f.hooks.beforeGet = key => {
    if (key === keys.saveRaw && ++reads === 3) f.write(second);
  };
  await assert.rejects(f.make().bootstrap({archiveStaleLegacy: true}), {code: 'LEGACY_CONFLICT'});
  assert.equal(f.map.get(f.authorityKey), initial);
  assert.deepEqual(f.view(), second);
});

test('a stale writer racing authority commit does not overwrite either snapshot', async () => {
  const f = await fixture();
  const first = f.stale(2), second = f.stale(3);
  f.write(first);
  f.hooks.onSet = (key, value) => {
    f.map.set(key, value);
    f.write(second);
  };
  await assert.rejects(f.make().bootstrap({archiveStaleLegacy: true}), {code: 'LEGACY_CONFLICT'});
  assert.deepEqual(f.view(), second);
  f.hooks.onSet = null;
  const store = f.make();
  try {
    await store.bootstrap({archiveStaleLegacy: true});
    assert.deepEqual(store.legacySourceArchives().map(payload), [first, second]);
    assert.equal(store.authority.fingerprint(), f.fingerprint);
  } finally { await store.release(); }
});
