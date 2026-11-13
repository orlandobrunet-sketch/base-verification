'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../../js/utils.js'), 'utf8');

// Execute the actual declared helpers. Only the browser storage environment is
// supplied; no scheduler/helper implementation is replaced or duplicated.
function declared(name) {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, name);
  const open = source.indexOf('{', start);
  let depth = 0, quote = null, escaped = false;
  for (let index = open; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw Error('Unterminated helper: ' + name);
}
function environment(initialRaw = '{}') {
  const stores = new Map([['first', initialRaw], ['second', '{}']]);
  let owner = 'first', writes = 0;
  const storage = {
    getItem(key) { assert.equal(key, 'nefroquest-sr-data'); return stores.get(owner); },
    setItem() { writes++; },
  };
  const context = vm.createContext({window: {nqProgressStorage: () => storage}, localStorage: storage});
  vm.runInContext("const SR_KEY='nefroquest-sr-data';\n" +
    ['_nqUtilsProgressStorage', '_loadSRData', 'getSRDueQuestions', 'getSRScheduledDueQuestions']
      .map(declared).join('\n'), context);
  return {
    select: qs => Array.from(context.getSRScheduledDueQuestions(qs), q => q.qid || q.id),
    broad: qs => Array.from(context.getSRDueQuestions(qs), q => q.qid || q.id),
    setRaw(raw) { stores.set(owner, raw); },
    setOwner(value) { owner = value; },
    writes: () => writes,
  };
}

test('scheduled review excludes unseen questions while the broad practice contract remains intact', () => {
  const env = environment(), qs = [{qid: 'seen'}, {qid: 'unseen'}, {id: 'runtime-only'}];
  assert.deepEqual(env.select(qs), []);
  assert.deepEqual(env.broad(qs), ['seen', 'unseen', 'runtime-only']);
  assert.equal(env.writes(), 0);
});

test('scheduled review includes the midnight boundary and overdue cards, excluding future and orphan schedules', () => {
  const today = new Date().setHours(0, 0, 0, 0), env = environment(JSON.stringify({
    boundary: {due: today}, overdue: {due: today - 86400000}, future: {due: today + 1},
    orphan: {due: today - 86400000}, runtime: {due: today},
  }));
  const qs = [{qid: 'boundary'}, {qid: 'overdue'}, {qid: 'future'}, {qid: 'unseen'}, {id: 'runtime'}];
  assert.deepEqual(env.select(qs), ['boundary', 'overdue', 'runtime']);
  assert.equal(env.writes(), 0);
});

test('scheduled selection reads the active progress namespace anew and never repairs invalid data by writing it', () => {
  const today = new Date().setHours(0, 0, 0, 0), env = environment(JSON.stringify({first: {due: today}}));
  const qs = [{qid: 'first'}, {qid: 'second'}];
  assert.deepEqual(env.select(qs), ['first']);
  env.setOwner('second');
  assert.deepEqual(env.select(qs), []);
  env.setRaw(JSON.stringify({second: {due: today}}));
  assert.deepEqual(env.select(qs), ['second']);
  for (const raw of ['null', '[]', '"not a schedule"', '{broken']) {
    env.setRaw(raw);
    assert.deepEqual(env.select(qs), []);
  }
  env.setOwner('first');
  assert.deepEqual(env.select(qs), ['first']);
  assert.equal(env.writes(), 0);
});

test('only finite primitive dates are schedules, including legacy numeric strings', () => {
  const today = new Date().setHours(0, 0, 0, 0);
  const cards = {boundary: {due: today}, legacy: {due: String(today)}, future: {due: String(today + 1)}};
  for (const [index, due] of [null, '', '  ', false, true, {}, [], {valueOf: null, toString: null}, undefined,
    'not-a-timestamp', 'Infinity', Infinity, NaN].entries()) cards['invalid-' + index] = {due};
  const env = environment(JSON.stringify(cards));
  assert.deepEqual(env.select(Object.keys(cards).map(qid => ({qid}))), ['boundary', 'legacy']);
  assert.equal(env.writes(), 0);
});
