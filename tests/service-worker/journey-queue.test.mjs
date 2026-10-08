import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

// The alternative source lets the same regression run against the pre-fix
// Git snapshot. Every invocation is bounded, including the original hang.
const gamePath = process.env.NQ_GAME_SOURCE || new URL('../../js/game.js', import.meta.url);
const gameSource = readFileSync(gamePath, 'utf8');
const topicsSource = readFileSync(new URL('../../data/topics.js', import.meta.url), 'utf8');
const hash = source => createHash('sha256').update(source).digest('hex');
const start = gameSource.search(/^\s*function shuffleQueue\(\)\s*\{/m);
const end = gameSource.indexOf('function drawQuestion()', start);
assert.ok(start >= 0 && end > start, 'canonical queue function boundaries must exist');
const queueSource = gameSource.slice(start, end);
const metadata = vm.runInNewContext(`${topicsSource}\nJSON.stringify(topics.map((topic, index) => ({
  id: topic.qid || String(index + 1), _d: topic.diff || topic.d || 'medium'
})));`, {}, { timeout: 500, filename: 'data/topics.js (metadata only)' });
const realBank = JSON.parse(metadata);
const counts = Object.fromEntries(['easy', 'medium', 'hard'].map(difficulty =>
  [difficulty, realBank.filter(question => question._d === difficulty).length]));
assert.ok(Object.values(counts).every(count => count > 0), 'real bank must exercise each difficulty group');
console.log('JOURNEY_QUEUE_INPUT', JSON.stringify({ gameSha256: hash(gameSource), topicsSha256: hash(topicsSource), counts }));

const copy = value => JSON.parse(JSON.stringify(value));
const modes = [
  { mode: 'easy', pattern: ['easy', 'easy', 'medium', 'medium', 'hard'] },
  { mode: 'normal', pattern: ['easy', 'medium', 'hard', 'medium', 'hard'] },
  { mode: 'hard', pattern: ['medium', 'hard', 'hard', 'hard'] },
  { mode: 'hardcore', pattern: null },
  { mode: 'legacy-unknown', pattern: ['easy', 'medium', 'hard', 'medium', 'hard'] },
];
const fixture = ['easy', 'medium', 'hard'].flatMap(difficulty =>
  Array.from({ length: 12 }, (_, index) => ({ id: `${difficulty}-${index}`, _d: difficulty })));
const eligible = (bank, mode) => bank.filter(question => mode === 'hardcore' ? question._d === 'hard'
  : mode === 'hard' ? question._d !== 'easy' : true);

function runQueue(bank, mode, { mastered = [], recent = [] } = {}) {
  const state = {
    difficulty: mode, queue: [{ id: 'previous-question' }], idx: 9,
    character: 'aquaria', level: 4, xp: 87, xpToNext: 400, score: 321,
    lives: 3, maxLives: 3, correctTotal: 31,
    equipment: { weapon: { n: 'saved weapon', rar: 'rare', kno: 2 } },
    current: { id: 'saved-current' }, answered: true,
  };
  const before = copy(state);
  const bankBefore = copy(bank);
  const masteredSet = new Set(mastered);
  const recentIds = [...recent];
  const savedBytes = JSON.stringify({ schemaVersion: 7, ...before });
  const storage = new Map([['nefroquest-save-v7', savedBytes]]);
  const sandbox = {
    questionBank: bank, state, _masteredSet: masteredSet, _recentIds: recentIds,
    shuffle: array => [...array],
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem() { assert.fail('queue preparation must not write saves'); },
      removeItem() { assert.fail('queue preparation must not remove saves'); },
      clear() { assert.fail('queue preparation must not clear saves'); },
    },
  };
  assert.doesNotThrow(() => vm.runInNewContext(`${queueSource}\nshuffleQueue();`, sandbox,
    { timeout: 500, filename: `shuffleQueue (${mode})` }), `${mode} queue must terminate`);
  assert.deepEqual(bank, bankBefore, 'question metadata must remain unchanged');
  assert.deepEqual([...masteredSet], mastered, 'mastered IDs must remain unchanged');
  assert.deepEqual(recentIds, recent, 'recent history must remain unchanged');
  assert.equal(storage.get('nefroquest-save-v7'), savedBytes, 'saved bytes must remain unchanged');
  const { queue: ignoredQueue, idx: ignoredIndex, ...preserved } = copy(state);
  const { queue: oldQueue, idx: oldIndex, ...expected } = before;
  assert.deepEqual(preserved, expected, 'only queue and its cursor may change');
  assert.equal(state.idx, 0, 'new queue starts at its first question');
  return copy(state.queue);
}

function assertComplete(queue, bank, mode) {
  const expected = eligible(bank, mode).map(question => question.id).sort();
  const actual = queue.map(question => question.id);
  assert.equal(new Set(actual).size, actual.length, 'no question may appear twice');
  assert.deepEqual([...actual].sort(), expected, 'each eligible question must appear exactly once');
  if (mode === 'hard') assert.ok(queue.every(question => question._d !== 'easy'), 'hard mode excludes easy questions');
  if (mode === 'hardcore') assert.ok(queue.every(question => question._d === 'hard'), 'hardcore contains only hard questions');
}

for (const { mode, pattern } of modes) {
  test(`${mode}: finite complete queue preserves the declared mix and save`, () => {
    const bank = copy(fixture);
    const queue = runQueue(bank, mode);
    assertComplete(queue, bank, mode);
    if (pattern) {
      // Two complete rounds have all required groups available in this fixture.
      assert.deepEqual(queue.slice(0, pattern.length * 2).map(question => question._d), [...pattern, ...pattern]);
    }
  });
  test(`${mode}: real-bank metadata terminates with all eligible IDs once`, () => {
    const bank = copy(realBank);
    assertComplete(runQueue(bank, mode), bank, mode);
  });
}

for (const mode of ['normal', 'hard']) {
  test(`${mode}: mastered priority and recent tail remain compatible`, () => {
    const bank = copy(fixture);
    const mastered = bank.filter(question => Number(question.id.split('-')[1]) < 3).map(question => question.id);
    const recent = ['easy-4', 'medium-4', 'hard-4', 'medium-0', 'hard-0'];
    const queue = runQueue(bank, mode, { mastered, recent });
    assertComplete(queue, bank, mode);
    const recentSet = new Set(recent);
    const expectedTail = eligible(bank, mode).filter(question => recentSet.has(question.id));
    const split = queue.length - expectedTail.length;
    assert.ok(queue.slice(0, split).every(question => !recentSet.has(question.id)), 'recent questions cannot precede the tail');
    assert.ok(queue.slice(split).every(question => recentSet.has(question.id)), 'every recent question belongs to the tail');
    const masteredSet = new Set(mastered);
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const group = queue.slice(0, split).filter(question => question._d === difficulty);
      const firstMastered = group.findIndex(question => masteredSet.has(question.id));
      if (firstMastered >= 0) assert.ok(group.slice(firstMastered).every(question => masteredSet.has(question.id)),
        'non-recent fresh questions retain priority within their group');
    }
  });
}

test('hard: exhausted or absent eligible groups terminate without admitting easy questions', () => {
  for (const difficulties of [[], ['easy'], ['easy', 'medium'], ['easy', 'hard'], ['medium'], ['hard']]) {
    const bank = difficulties.map((difficulty, index) => ({ id: `edge-${index}`, _d: difficulty }));
    assertComplete(runQueue(bank, 'hard'), bank, 'hard');
  }
});
