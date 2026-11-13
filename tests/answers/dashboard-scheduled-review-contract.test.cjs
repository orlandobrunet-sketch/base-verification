'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../../js/dashboard.js'), 'utf8');
function declared(name) {
  const start = source.indexOf('function ' + name + '('); assert(start >= 0, name);
  let depth = 0, quote = null, escaped = false;
  for (let index = source.indexOf('{', start); index < source.length; index++) {
    const char = source[index];
    if (quote) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === quote) quote = null; continue; }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw Error('Unclosed helper ' + name);
}
function environment(cards, ids = Object.keys(cards)) {
  let active = 'first', writes = 0;
  const stores = new Map([['first', JSON.stringify(cards)], ['second', '{}']]);
  const storage = owner => ({getItem(key) { assert.equal(key, 'nefroquest-sr-data'); return stores.get(owner); }, setItem() { writes++; }, removeItem() { writes++; }});
  const context = vm.createContext({window: {questionBank: ids.map(id => ({id})), nqProgressStorage: binding => storage(binding || active)}, localStorage: storage('first')});
  vm.runInContext("let _dashboardBinding='first';\n" + ['_progressStorage', '_readJson', '_number', '_startOfToday', '_scheduledCardDue', '_memoryState', '_countOverdueReviews'].map(declared).join('\n'), context);
  return {count: () => context._countOverdueReviews(), memory: () => JSON.parse(JSON.stringify(context._memoryState())),
    setRaw(raw) { stores.set(active, raw); }, switchOwner(owner, recapture = false) { active = owner; if (recapture) vm.runInContext('_dashboardBinding=' + JSON.stringify(owner), context); },
    raw: owner => stores.get(owner), writes: () => writes};
}
test('Dashboard counts only finite primitive scheduled dates, keeping legacy strings and midnight', () => {
  const today = new Date().setHours(0, 0, 0, 0), cards = {boundary: {due: today, S: 3}, legacy: {due: String(today), S: 3}, future: {due: today + 86400000, S: 3}};
  for (const [index, due] of [null, '', '  ', false, true, [], {}, {valueOf: null, toString: null}, undefined, 'Infinity'].entries()) cards['invalid' + index] = {due, S: 3};
  cards.arrayCard = []; cards.nullCard = null;
  const env = environment(cards), before = env.raw('first');
  assert.equal(env.count(), 2); assert.equal(env.memory().overdue, 2);
  assert.equal(env.memory().horizon[1].count, 1);
  assert.equal(env.raw('first'), before); assert.equal(env.writes(), 0);
});
test('card validity does not rewrite stability, history or orphan schedules', () => {
  const today = new Date().setHours(0, 0, 0, 0), env = environment({a: {due: today, S: 30}, b: {due: null, S: 2}, orphan: {due: today, S: 50}}, ['a', 'b']);
  const memory = env.memory();
  assert.equal(memory.seen, 2); assert.equal(memory.consolidated, 1); assert.equal(memory.medianS, 16);
  assert.equal(memory.overdue, 1); assert.equal(env.count(), 1); assert.equal(env.writes(), 0);
});
test('Dashboard uses its captured progress binding rather than another active owner namespace', () => {
  const today = new Date().setHours(0, 0, 0, 0), env = environment({a: {due: today, S: 3}});
  env.switchOwner('second'); assert.equal(env.count(), 1);
  env.switchOwner('second', true); assert.equal(env.count(), 0); assert.equal(env.memory().seen, 0);
  env.switchOwner('first', true); assert.equal(env.count(), 1); assert.equal(env.writes(), 0);
});
test('invalid raw containers remain untouched and do not invent due cards', () => {
  const env = environment({}, ['a']);
  for (const raw of ['null', '[]', '"not a schedule"', '{broken']) {
    env.setRaw(raw); assert.equal(env.count(), 0); assert.equal(env.memory().overdue, 0);
    assert.equal(env.raw('first'), raw);
  }
  assert.equal(env.writes(), 0);
});
