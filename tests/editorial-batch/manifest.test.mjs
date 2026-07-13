import test from 'node:test';
import assert from 'node:assert/strict';
import { findChangedManifest, validateManifest } from '../../scripts/editorial-batch/manifest.mjs';

const valid = {
  batch: 'FARM-4A',
  change_type: 'medical_editorial',
  expected_version: '12.65',
  allowed_files: ['data/topics.js', 'version.json', 'sw.js', 'index.html', 'docs/editorial/review-batches/FARM-4A.json'],
  questions: {
    '5bfb77d2': { action: 'rebuild', preserve_fsrs: true },
    '23211e6a': { action: 'retire', preserve_fsrs: false },
  },
  expected_question_delta: -1,
  refs_policy: 'unchanged',
  external_review: { greptile: 'required', fallback_reviewer: null },
};

test('requires exactly one changed JSON manifest', () => {
  assert.equal(findChangedManifest(['data/topics.js', 'docs/editorial/review-batches/FARM-4A.json']), 'docs/editorial/review-batches/FARM-4A.json');
  assert.throws(() => findChangedManifest(['data/topics.js']), /exactly one/i);
});

test('accepts the complete contract', () => {
  assert.deepEqual(validateManifest(valid, 'FARM-4A.json').errors, []);
});

test('requires fallback reviewer when Greptile is unavailable', () => {
  const input = structuredClone(valid);
  input.external_review = { greptile: 'unavailable', fallback_reviewer: null };
  assert.match(validateManifest(input, 'FARM-4A.json').errors.join('\n'), /fallback_reviewer/);
});

test('requires preserve_fsrs false for retired qids', () => {
  const input = structuredClone(valid);
  input.questions['23211e6a'].preserve_fsrs = true;
  assert.match(validateManifest(input, 'FARM-4A.json').errors.join('\n'), /retire.*preserve_fsrs/i);
});
