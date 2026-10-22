'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const builder = require('../../tools/build-question-revision-manifest.cjs');
const revisions = require('../../js/question-revisions.js');
const approved = JSON.parse(fs.readFileSync(path.resolve(__dirname,
  '../../docs/editorial/reviews/2026-10-21/gitelman-whole-card-candidate-A1.json'), 'utf8')).wholeCard;
const RID = 'gitelman_kdigo_2017';
const consumers = ['1e2668d6', '81740f2d', '940b2835'];

test('Gitelman registry contains the exact twelve-field independently approved card', () => {
  const refs = builder.load('data/refs.js', 'refsDB');
  assert.equal(Object.keys(refs[RID]).length, 12);
  assert.deepEqual(refs[RID], approved);
  assert.equal(builder.digest(refs[RID]), 'sha256:aa02ffc07c33a7bf4b2aeb21c7c32839a9215e67dbd549ee5ff314b656ec361f');
});

test('Gitelman consumers remain real bank links; b933be69 is not silently relinked', () => {
  const topics = builder.load('data/topics.js', 'topics');
  assert.deepEqual(topics.filter(q => q.refs.includes(RID)).map(q => q.qid).sort(), consumers);
  assert.deepEqual(topics.find(q => q.qid === 'b933be69').refs, ['kdigo_ckd', 'brenner_rector']);
});

test('all four profiles preserve old Gitelman cards with explicit historical binding', () => {
  const topics = builder.load('data/topics.js', 'topics');
  const references = builder.load('data/refs.js', 'refsDB');
  const manifest = builder.load('data/question-revision-manifest.js', 'NQQuestionRevisionManifest');
  const history = builder.load('data/question-revision-history.js', 'NQQuestionRevisionHistory');
  const sources = Object.fromEntries(['main', 'exam', 'study', 'offline'].map(profile =>
    [profile, topics.map((q, index) => builder.sources(q, index)[profile])]));
  const catalog = revisions.createCatalog({manifest, history, authors: topics, sources, references});
  for (const qid of consumers) {
    const old = history.find(entry => entry.qid === qid && entry.release === '16.19');
    assert(old, qid + ': previous published card must remain available');
    assert.equal(manifest.current[qid].authorRevision, old.authorRevision);
    assert.deepEqual(manifest.current[qid].sourceRevisions, old.sourceRevisions);
    assert.equal(builder.digest(old.references[RID]), 'sha256:dc2ed96f52cab471d53e333a4ed0ae4ca237b611e315df84efbb02d10a3bfe6c');
    for (const profile of Object.keys(old.sources)) {
      const retained = catalog.inspect(old.sources[profile], {profile, binding: old.bindings[profile]});
      assert.equal(retained.status, 'known', qid + ':' + profile);
      assert.equal(retained.value.historical, true);
      assert.deepEqual(retained.value.references[RID], old.references[RID]);
      assert.equal(retained.value.policy.pending, 'update-required');
      assert.deepEqual(catalog.current(qid, profile).references[RID], approved);
      assert.equal(catalog.inspect(old.sources[profile], {profile}).status, 'ambiguous');
    }
  }
});
