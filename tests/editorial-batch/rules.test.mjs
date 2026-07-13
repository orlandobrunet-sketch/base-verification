import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuestions } from '../../scripts/editorial-batch/questions.mjs';
import { parseReferenceIds, referenceConsumers } from '../../scripts/editorial-batch/references.mjs';
import { extractVersions } from '../../scripts/editorial-batch/versions.mjs';
import { validateBatch } from '../../scripts/editorial-batch/rules.mjs';

const q = (qid, text, refs) => ({ qid, q: text, opts: ['A', 'B', 'C', 'D'], ans: 0, exp: 'E', cat: 'farmacologia', diff: 'medium', refs });
const map = (...questions) => new Map(questions.map((question) => [question.qid, question]));
const versions = (value) => ({ json: value, cache: value, comment: value, sentry: value });

function validInput() {
  const beforeQuestions = map(q('11111111', 'old', ['ref_a']), q('22222222', 'retire', ['ref_b']));
  const afterQuestions = map(q('11111111', 'new', ['ref_a', 'ref_b']));
  const refsText = "const REFS = {\n  ref_a:{},\n  ref_b:{}\n};";
  return {
    manifestPath: 'docs/editorial/review-batches/FARM-4A.json',
    manifest: {
      batch: 'FARM-4A', change_type: 'medical_editorial', expected_version: '12.65',
      allowed_files: ['data/topics.js', 'version.json', 'sw.js', 'index.html', 'docs/editorial/review-batches/FARM-4A.json'],
      questions: { '11111111': { action: 'rebuild', preserve_fsrs: true }, '22222222': { action: 'retire', preserve_fsrs: false } },
      expected_question_delta: -1, refs_policy: 'unchanged',
      external_review: { greptile: 'required', fallback_reviewer: null },
    },
    changedPaths: ['data/topics.js', 'version.json', 'sw.js', 'index.html', 'docs/editorial/review-batches/FARM-4A.json'],
    beforeQuestions, afterQuestions,
    beforeReferenceIds: parseReferenceIds(refsText), afterReferenceIds: parseReferenceIds(refsText),
    beforeConsumers: referenceConsumers(beforeQuestions), afterConsumers: referenceConsumers(afterQuestions),
    beforeRefsText: refsText, afterRefsText: refsText,
    beforeVersions: versions('12.64'), afterVersions: versions('12.65'),
  };
}

const codes = (input) => validateBatch(input).map((error) => error.code);

test('accepts a declared rebuild and retirement', () => assert.deepEqual(validateBatch(validInput()), []));
test('rejects undeclared files and forbidden artifacts', () => {
  const input = validInput();
  input.changedPaths.push('notes.zip');
  assert.ok(codes(input).includes('UNDECLARED_FILE'));
  assert.ok(codes(input).includes('FORBIDDEN_ARTIFACT'));
});
test('rejects undeclared and unused qids', () => {
  const input = validInput();
  input.manifest.questions['33333333'] = { action: 'technical_only', preserve_fsrs: true };
  assert.ok(codes(input).includes('QID_SCOPE'));
});
test('enforces refs_only semantics', () => {
  const input = validInput();
  input.manifest.questions['11111111'].action = 'refs_only';
  assert.ok(codes(input).includes('REFS_ONLY_SCOPE'));
});
test('rejects missing and orphaned references', () => {
  const input = validInput();
  input.afterQuestions.get('11111111').refs.push('missing_ref');
  input.afterReferenceIds.add('orphan_ref');
  assert.ok(codes(input).includes('MISSING_REFERENCE'));
  assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
});
test('allows pre-existing orphaned references but rejects newly orphaned ones', () => {
  const input = validInput();
  input.beforeReferenceIds.add('legacy_orphan');
  input.afterReferenceIds.add('legacy_orphan');
  assert.ok(!codes(input).includes('ORPHAN_REFERENCE'));

  input.afterQuestions.get('11111111').refs = ['ref_a'];
  input.afterConsumers = referenceConsumers(input.afterQuestions);
  assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
});
test('rejects invalid question structure', () => {
  const input = validInput();
  input.afterQuestions.get('11111111').opts = ['A'];
  input.afterQuestions.get('11111111').ans = 9;
  assert.ok(codes(input).includes('QUESTION_STRUCTURE'));
});
test('rejects question delta and version mismatches', () => {
  const input = validInput();
  input.manifest.expected_question_delta = 0;
  input.afterVersions.sentry = '12.64';
  assert.ok(codes(input).includes('QUESTION_DELTA'));
  assert.ok(codes(input).includes('VERSION_MISMATCH'));
});
test('extracts all canonical versions', () => {
  assert.deepEqual(extractVersions({
    versionJson: '{"version":"12.65"}',
    serviceWorker: "// NefroQuest Service Worker — v12.65\nconst CACHE = 'nefroquest-v12.65';",
    indexHtml: "release: 'nefroquest@12.65'",
  }), versions('12.65'));
});
