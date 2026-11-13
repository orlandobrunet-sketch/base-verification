'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const builder = require('../../tools/build-question-revision-manifest.cjs');
const revisions = require('../../js/question-revisions.js');
const topics = builder.load('data/topics.js', 'topics');
const references = builder.load('data/refs.js', 'refsDB');
const manifest = builder.load('data/question-revision-manifest.js', 'NQQuestionRevisionManifest');
const history = builder.load('data/question-revision-history.js', 'NQQuestionRevisionHistory');
const profiles = ['main', 'exam', 'study', 'offline'];
const sources = Object.fromEntries(profiles.map(profile =>
  [profile, topics.map((q, index) => builder.sources(q, index)[profile])]));
const catalog = revisions.createCatalog({manifest, history, authors: topics, sources, references});
const publishedBefore = history.filter(entry => entry.release === '17.09');

test('saved answers before the alternative revision retain their published wording and cards in every mode', () => {
  assert.equal(publishedBefore.length, 110);
  for (const old of publishedBefore) {
    assert.equal(builder.digest(old.author), old.authorRevision, old.qid);
    for (const profile of profiles) {
      const retained = catalog.inspect(old.sources[profile], {profile, binding: old.bindings[profile]});
      assert.equal(retained.status, 'known', old.qid + ':' + profile);
      assert.equal(retained.value.historical, true);
      assert.deepEqual(retained.value.source, old.sources[profile]);
      assert.deepEqual(retained.value.author, old.author);
      assert.deepEqual(retained.value.references, old.references);
      assert.deepEqual(retained.value.policy, {material: true, pending: 'update-required', answered: 'historical'});
    }
  }
});

test('shared-card edits preserve history for the three consumers whose question was not rewritten', () => {
  for (const [qid, id] of [['061c9bcb', 'kdigo_anemia_2026'], ['1e6a4479', 'kdigo_anemia_2026'],
    ['22189222', 'phosphate_binders_ckd']]) {
    const old = publishedBefore.find(entry => entry.qid === qid);
    assert(old, qid + ': card-only consumer needs its own previous record');
    assert(old.references[id]);
    for (const profile of profiles) {
      const checked = catalog.inspect(old.sources[profile], {profile, binding: old.bindings[profile]});
      assert.equal(checked.status, 'known');
      assert.deepEqual(checked.value.references[id], old.references[id]);
      const current = catalog.current(qid, profile);
      if (builder.digest(old.sources[profile]) === builder.digest(current.source)) {
        assert.equal(catalog.inspect(old.sources[profile], {profile}).status, 'ambiguous');
      }
    }
  }
});

test('removing a current catalogue card cannot erase the reference from a saved published answer', () => {
  for (const [qid, id] of [['67035e0e', 'dcor_trial'], ['3d8fc3fe', 'finerenone_2025']]) {
    const old = publishedBefore.find(entry => entry.qid === qid);
    assert(old?.references[id], qid + ': previous full card must survive retirement');
    for (const profile of profiles) {
      const retained = catalog.resolve(old.sources[profile], {profile, binding: old.bindings[profile]});
      assert.deepEqual(retained.references[id], old.references[id]);
      assert.equal(retained.historical, true);
    }
  }
});
// Exact continuation allowlist, separate from the frozen 17.09 archive above.
const continuationRewrittenQids = [
  '02814d6c', '0c1d09c3', '0e1a838d', '12328a3e', '18784ef8', '1b4ebca6',
  '23635484', '236ed8f1', '26804856', '3a01ea4b', '3e0788ac', '4b27ea54',
  '4c7566cf', '4decf9f9', '5d6677ab', '5e5b8558', '5eb00a6e', '66b811c3',
  '68091841', '69177b72', '795d4589', '9961a406', '9fadb7da', '9fd2cfdb',
  'b1b484d1', 'b7a93d7a', 'c1089f2e', 'cb6c4aae', 'ce79d609', 'd314fb0a',
  'd81defbb', 'ddb4938a', 'e3246f2c', 'ea37c153', 'ee80e444', 'f3ab76f3',
  'f4de7965', 'f7107bc3', 'f7fd9e8a', 'faac594e', 'fe70507d', 'ff676013',
];

test('the bounded continuation retains exactly 43 published 17.11 records and 172 bindings', () => {
  const rows = history.filter(entry => entry.release === '17.11');
  assert.equal(continuationRewrittenQids.length, 42);
  assert.equal(rows.length, 43);
  assert.deepEqual(rows.map(entry => entry.qid).sort(), [...continuationRewrittenQids, '5530b59c'].sort());
  let bindings = 0;
  for (const old of rows) {
    assert.equal(builder.digest(old.author), old.authorRevision, old.qid);
    for (const profile of profiles) {
      const retained = catalog.inspect(old.sources[profile], {profile, binding: old.bindings[profile]});
      assert.equal(retained.status, 'known', old.qid + ':' + profile);
      assert.equal(retained.value.historical, true);
      assert.equal(retained.value.release, '17.11');
      assert.deepEqual(retained.value.source, old.sources[profile]);
      assert.deepEqual(retained.value.author, old.author);
      assert.deepEqual(retained.value.references, old.references);
      assert.deepEqual(retained.value.binding, old.bindings[profile]);
      assert.deepEqual(retained.value.policy, {material: true, pending: 'update-required', answered: 'historical'});
      assert.notEqual(catalog.current(old.qid, profile).binding.recordRevision, old.recordRevision);
      bindings++;
    }
  }
  assert.equal(bindings, 172);
});

test('the retired KDIGO card survives bound history while the card-only continuation stays ambiguous without binding', () => {
  const retired = history.find(entry => entry.qid === 'ddb4938a' && entry.release === '17.11');
  const shared = history.find(entry => entry.qid === '5530b59c' && entry.release === '17.11');
  assert(retired?.references.kdigo_igan_2021, 'The published full KDIGO card must survive current retirement');
  assert(shared?.references.moeller_plosone_2014, 'The unchanged question must retain its previous full Moeller card');
  assert.equal(Object.hasOwn(references, 'kdigo_igan_2021'), false);
  for (const profile of profiles) {
    const retiredView = catalog.resolve(retired.sources[profile], {profile, binding: retired.bindings[profile]});
    assert.equal(retiredView.historical, true);
    assert.deepEqual(retiredView.references.kdigo_igan_2021, retired.references.kdigo_igan_2021);
    assert.equal(Object.hasOwn(catalog.current(retired.qid, profile).references, 'kdigo_igan_2021'), false);
    const current = catalog.current(shared.qid, profile);
    assert.deepEqual(current.author, shared.author);
    assert.deepEqual(current.source, shared.sources[profile]);
    assert.notDeepEqual(current.references.moeller_plosone_2014, shared.references.moeller_plosone_2014);
    assert.equal(catalog.inspect(shared.sources[profile], {profile}).status, 'ambiguous');
    const oldBound = catalog.resolve(shared.sources[profile], {profile, binding: shared.bindings[profile]});
    assert.equal(oldBound.historical, true);
    assert.deepEqual(oldBound.references, shared.references);
    const currentBound = catalog.resolve(current.source, {profile, binding: current.binding});
    assert.equal(currentBound.historical, false);
    assert.deepEqual(currentBound.references, current.references);
  }
});
