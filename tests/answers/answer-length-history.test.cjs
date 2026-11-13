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
