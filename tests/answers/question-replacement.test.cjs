'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../../js/question-revisions.js');
const answers = require('../../js/answer-presentation.js');
const {digest} = require('../../tools/build-question-revision-manifest.cjs');
const profiles = ['main', 'exam', 'study', 'offline'];
function fixture(mapping) {
  const before = {qid: 'old-objective', q: 'Old objective?', opts: ['Old answer', 'B', 'C', 'D'], ans: 0, exp: 'Old explanation', refs: ['old-card']};
  const after = {qid: 'new-objective', q: 'New objective?', opts: ['A', 'New answer', 'C', 'D'], ans: 1, exp: 'New explanation', refs: ['new-card']};
  const oldReferences = {'old-card': {label: 'Original card'}}, references = {'new-card': {label: 'New card'}};
  const source = q => ({id: q.qid, q: q.q, o: q.opts, a: q.ans, e: q.exp, r: q.refs});
  const currentSource = source(after), oldSource = source(before);
  const authorRevision = digest(after), referenceRevisions = {'new-card': digest(references['new-card'])};
  if (mapping === undefined) mapping = {'old-objective': {qid: after.qid,
    recordRevision: digest({authorRevision: digest(before), referenceRevisions: {'old-card': digest(oldReferences['old-card'])}})}};
  const manifest = {version: 1, release: 'technical-new', replacements: mapping, current: {[after.qid]: {
    authorRevision, referenceRevisions, recordRevision: digest({authorRevision, referenceRevisions}),
    sourceRevisions: Object.fromEntries(profiles.map(p => [p, digest(currentSource)]))}}};
  const history = [{qid: before.qid, release: 'technical-old', author: before, references: oldReferences,
    sources: Object.fromEntries(profiles.map(p => [p, oldSource])), policy: {material: true, pending: 'update-required'}}];
  return {before, after, currentSource, oldSource, history, manifest, references,
    options: {manifest, history, authors: [after], references, sources: Object.fromEntries(profiles.map(p => [p, [currentSource]]))}};
}
test('retired objective remains historical; an explicit replacement never changes its identity or recorded answer', () => {
  const f = fixture(), catalog = api.createCatalog(f.options);
  for (const profile of profiles) {
    assert.equal(catalog.current(f.before.qid, profile), null);
    const old = catalog.inspect(answers.present(f.oldSource), {profile});
    assert.equal(old.status, 'known'); assert.equal(old.value.historical, true);
    assert.deepEqual(old.value.author, f.before); assert.deepEqual(old.value.references, f.history[0].references);
    assert.deepEqual(catalog.retired(f.before.qid, profile).source, f.oldSource);
    assert.equal(catalog.retired(f.after.qid, profile), null);
    const replacement = catalog.replacement(f.before.qid, profile);
    assert.equal(replacement.binding.qid, f.after.qid); assert.equal(replacement.historical, false);
    assert.deepEqual(replacement.source, f.currentSource);
    assert.equal(catalog.inspect(answers.present(f.oldSource), {profile, binding: replacement.binding}).status, 'unknown');
    assert.equal(catalog.replacement(f.after.qid, profile), null);
    assert.equal(catalog.replacement('missing', profile), null);
  }
});
for (const mapping of [null, [], {'old-objective': 'missing'}, {'old-objective': 'old-objective'},
  {'missing': 'new-objective'}, {'new-objective': 'new-objective'}, {'old-objective': {qid: 'new-objective'}}]) {
  test('invalid replacement policy cannot grant a new authored identity: ' + JSON.stringify(mapping), () => {
    assert.throws(() => api.createCatalog(fixture(mapping).options), /replacement/i);
  });
}
test('replacement lookup is identical in cooperative catalog construction', async () => {
  const f = fixture(), catalog = await api.createCatalogAsync(f.options);
  assert.equal(catalog.replacement(f.before.qid, 'study').binding.qid, f.after.qid);
});
