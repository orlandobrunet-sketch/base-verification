import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseQuestions,
  changedQuestionIds,
  equalExceptRefs,
} from '../../scripts/editorial-batch/questions.mjs';
import {
  parseReferenceIds,
  referenceConsumers,
} from '../../scripts/editorial-batch/references.mjs';

const question = (qid, refs = ['ref_a']) =>
  `  ${JSON.stringify({ qid, q: 'Q?', opts: ['A', 'B', 'C', 'D'], ans: 0, exp: 'E', cat: 'x', diff: 'medium', refs })},`;

test('parses complete one-line question objects without executing JavaScript', () => {
  const parsed = parseQuestions(`const topics = [\n${question('abc12345')}\n];`, 'topics.js');
  assert.equal(parsed.get('abc12345').opts.length, 4);
});

test('parses legacy CR-only line endings in topics.js', () => {
  const parsed = parseQuestions(`const topics = [\r${question('abc12345')}\r${question('def67890')}\r];`, 'topics.js');
  assert.deepEqual([...parsed.keys()], ['abc12345', 'def67890']);
});

test('rejects duplicate qids', () => {
  assert.throws(
    () => parseQuestions(`${question('abc12345')}\n${question('abc12345')}`, 'topics.js'),
    /duplicate qid abc12345/i,
  );
});

test('reports exactly the changed qids', () => {
  const before = parseQuestions(question('abc12345'), 'before');
  const after = parseQuestions(question('abc12345', ['ref_b']), 'after');
  assert.deepEqual(changedQuestionIds(before, after), ['abc12345']);
  assert.equal(equalExceptRefs(before.get('abc12345'), after.get('abc12345')), true);
});

test('extracts top-level reference ids and consumers', () => {
  const ids = parseReferenceIds(`const REFS = {\nref_a:{ label: 'A' },\n  ref_b: { label: 'B' },\n  "ref_c": { label: 'C' }\n};`, 'refs.js');
  assert.deepEqual([...ids], ['ref_a', 'ref_b', 'ref_c']);
  const consumers = referenceConsumers(parseQuestions(question('abc12345', ['ref_b']), 'topics.js'));
  assert.deepEqual([...consumers.get('ref_b')], ['abc12345']);
});
