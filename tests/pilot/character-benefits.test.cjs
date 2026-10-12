'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../js/character-benefits.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const identity = (character = 'nephros', owner = null, difficulty = 'normal') => ({character, owner, difficulty});
const journeyId = 'bd49b887-26cd-4a5d-8b14-4f45499a3617';

function api() {
  const window = {}, context = {window};
  for (const key of ['localStorage', 'document', 'navigator', 'crypto', 'NQPilot', 'fetch']) {
    const forbidden = {get() { throw new Error('Unexpected browser/persistence access: ' + key); }};
    Object.defineProperty(window, key, forbidden);
    Object.defineProperty(context, key, forbidden);
  }
  Object.defineProperty(context, 'Date', {get() { throw new Error('Unexpected clock access'); }});
  Object.defineProperty(context, 'Math', {get() { throw new Error('Unexpected RNG access'); }});
  vm.runInNewContext(source, context, {filename: 'character-benefits.js'});
  return window.NQCharacterBenefits;
}

function empty(rules, context = identity(), id = journeyId) {
  return rules.create({...context, journeyId: id});
}

// Claims supplied by the authority, not an implementation of eligibility or rewards.
function answer(previous, qid, {xp = 0, gold = 0, shield = false} = {}) {
  const next = clone(previous);
  next.windowAnswers++;
  next.creditedEvents.push(next.journeyId + ':' + next.windowAnswers + ':' + qid);
  if (!next.seenQids.includes(qid)) next.seenQids.push(qid);
  next.xpGranted += xp;
  next.goldGranted += gold;
  if (shield) next.shieldSpent = true;
  return next;
}

test('normal ledger is pure, caller-owned and disjoint from the legacy pilot', () => {
  const rules = api(), context = {...identity(), journeyId}, before = clone(context);
  const ledger = rules.create(context);
  assert.equal(rules.RULESET, 'normal-character-initial-v1');
  assert.deepEqual(Object.keys(rules).sort(), ['RULESET', 'create', 'valid']);
  assert.deepEqual(clone(ledger), {version: 1, ruleset: 'normal-character-initial-v1',
    journeyId, owner: null, difficulty: 'normal', lockedClass: 'nephros', windowAnswers: 0,
    seenQids: [], creditedEvents: [], xpGranted: 0, goldGranted: 0, shieldSpent: false});
  assert.deepEqual(context, before);
  assert.equal(rules.valid(ledger, identity()), true);
  const other = empty(rules);
  ledger.seenQids.push('caller-mutation');
  assert.deepEqual(clone(other.seenQids), []);
  assert.equal(rules.valid(other, identity()), true);
  const legacy = {...clone(other), ruleset: 'class-boons-v1'};
  assert.equal(rules.valid(legacy, identity()), false);
});

test('all four mode names are structural identities, without determining eligibility', () => {
  const rules = api();
  for (const character of ['nephros', 'aquaria', 'glomerulus']) {
    for (const difficulty of ['easy', 'normal', 'hard', 'hardcore']) {
      for (const owner of [null, 'account-A']) {
        const context = identity(character, owner, difficulty);
        assert.equal(rules.valid(empty(rules, context), context), true);
      }
    }
  }
});

test('create requires explicit valid identity and a caller-supplied journey identifier', () => {
  const rules = api(), context = {...identity(), journeyId};
  for (const key of ['character', 'owner', 'difficulty', 'journeyId']) {
    const missing = {...context}; delete missing[key];
    assert.throws(() => rules.create(missing), /Explicit character/);
  }
  for (const change of [{character: 'other'}, {difficulty: 'medium'}, {owner: ''},
    {owner: 7}, {journeyId: ''}, {journeyId: '  '}, {journeyId: null}]) {
    assert.throws(() => rules.create({...context, ...change}), /Explicit character/);
  }
});

test('saved normal ledgers require their matching owner, class and mode', () => {
  const rules = api(), context = identity('glomerulus', 'account-A', 'hard'), ledger = empty(rules, context);
  assert.equal(rules.valid(ledger, {...context, journeyId}), true);
  assert.equal(rules.valid(ledger, {...context, journeyId: 'other-journey'}), false);
  assert.equal(rules.valid(ledger, {...context, journeyId: undefined}), false);
  for (const wrong of [identity('nephros', 'account-A', 'hard'), identity('glomerulus', 'account-B', 'hard'),
    identity('glomerulus', null, 'hard'), identity('glomerulus', 'account-A', 'normal'), {}]) {
    assert.equal(rules.valid(ledger, wrong), false);
  }
  const inherited = Object.create(ledger);
  assert.equal(rules.valid(inherited, context), false);
});

test('malformed, incomplete and non-integer snapshots fail validation without throwing', () => {
  const rules = api(), ledger = empty(rules);
  for (const value of [null, undefined, [], 1, 'ledger']) assert.equal(rules.valid(value, identity()), false);
  for (const key of Object.keys(ledger)) {
    const missing = clone(ledger); delete missing[key];
    assert.equal(rules.valid(missing, identity()), false, key);
  }
  for (const change of [{version: 2}, {windowAnswers: '0'}, {windowAnswers: -1},
    {windowAnswers: 0.5}, {windowAnswers: 21}, {xpGranted: NaN}, {xpGranted: Infinity},
    {goldGranted: -2}, {goldGranted: 0.5}, {shieldSpent: 0}, {seenQids: {}}, {creditedEvents: null}]) {
    assert.equal(rules.valid({...clone(ledger), ...change}, identity()), false);
  }
  const throwing = Object.defineProperty(clone(ledger), 'version', {get() { throw Error('corrupt accessor'); }});
  assert.equal(rules.valid(throwing, identity()), false);
});

test('ordinal events reconstruct unique seen QIDs including repeated answers', () => {
  const rules = api();
  const first = answer(empty(rules), 'question:1');
  const repeated = answer(first, 'question:1');
  const third = answer(repeated, 'question:2');
  assert.equal(rules.valid(third, identity()), true);
  for (const change of [
    {seenQids: ['question:1', 'question:1', 'question:2']},
    {seenQids: ['question:2', 'question:1']},
    {seenQids: ['question:1']},
    {creditedEvents: third.creditedEvents.slice(1)},
    {creditedEvents: [third.creditedEvents[0], third.creditedEvents[0], third.creditedEvents[2]]},
    {creditedEvents: [third.creditedEvents[0], journeyId + ':3:question:1', third.creditedEvents[2]]},
    {creditedEvents: [third.creditedEvents[0], 'other-journey:2:question:1', third.creditedEvents[2]]}
  ]) assert.equal(rules.valid({...clone(third), ...change}, identity()), false);
  const blank = answer(empty(rules), '');
  assert.equal(rules.valid(blank, identity()), false);
  const sparse = clone(third); delete sparse.seenQids[1];
  assert.equal(rules.valid(sparse, identity()), false);
});

test('class-specific caps allow the complete window but reject foreign resources', () => {
  const rules = api();
  for (const character of ['nephros', 'glomerulus', 'aquaria']) {
    const context = identity(character);
    let ledger = empty(rules, context);
    for (let index = 1; index <= 20; index++) {
      ledger = answer(ledger, 'q' + index, {xp: character === 'nephros' ? 1 : 0,
        gold: character === 'glomerulus' ? 2 : 0, shield: character === 'aquaria' && index === 1});
      assert.equal(rules.valid(ledger, context), true);
    }
    assert.equal(rules.valid(answer(ledger, 'q21'), context), false);
    if (character === 'nephros') {
      assert.equal(rules.valid({...ledger, xpGranted: 21}, context), false);
      assert.equal(rules.valid({...ledger, goldGranted: 2}, context), false);
    } else if (character === 'glomerulus') {
      assert.equal(rules.valid({...ledger, goldGranted: 42}, context), false);
      assert.equal(rules.valid({...ledger, goldGranted: 39}, context), false);
      assert.equal(rules.valid({...ledger, xpGranted: 1}, context), false);
    } else {
      assert.equal(rules.valid({...ledger, xpGranted: 1}, context), false);
      assert.equal(rules.valid({...ledger, goldGranted: 2}, context), false);
    }
    if (character !== 'aquaria') assert.equal(rules.valid({...ledger, shieldSpent: true}, context), false);
  }
  assert.equal(rules.valid({...empty(rules, identity('aquaria')), shieldSpent: true}, identity('aquaria')), false);
});

test('snapshot credits cannot exceed first-occurrence QIDs', () => {
  const rules = api();
  for (const character of ['nephros', 'glomerulus']) {
    const context = identity(character), first = answer(empty(rules, context), 'same');
    const repeated = answer(first, 'same', character === 'nephros' ? {xp: 2} : {gold: 4});
    assert.equal(rules.valid(repeated, context), false);
  }
});

test('one-answer transitions accept zero credit and do not infer correctness', () => {
  const rules = api();
  for (const character of ['nephros', 'glomerulus', 'aquaria']) {
    const context = identity(character), previous = empty(rules, context);
    const zero = answer(previous, 'q1'), before = clone(previous), after = clone(zero);
    assert.equal(rules.valid(zero, {...context, previous}), true);
    assert.deepEqual(clone(previous), before);
    assert.deepEqual(clone(zero), after);
    const credit = answer(previous, 'q1', character === 'nephros' ? {xp: 1}
      : character === 'glomerulus' ? {gold: 2} : {shield: true});
    assert.equal(rules.valid(credit, {...context, previous}), true);
  }
});

test('repeated QIDs consume an ordinal but cannot grant any new resource', () => {
  const rules = api();
  for (const character of ['nephros', 'glomerulus', 'aquaria']) {
    const context = identity(character), previous = answer(empty(rules, context), 'same');
    const repeated = answer(previous, 'same');
    assert.equal(rules.valid(repeated, {...context, previous}), true);
    const forged = answer(previous, 'same', character === 'nephros' ? {xp: 1}
      : character === 'glomerulus' ? {gold: 2} : {shield: true});
    assert.equal(rules.valid(forged, context), true, 'snapshot alone cannot locate the earlier credit');
    assert.equal(rules.valid(forged, {...context, previous}), false);
  }
});

test('transitions reject skipped positions, oversized grants and rewritten history', () => {
  const rules = api(), context = identity(), previous = answer(empty(rules), 'q1');
  const twoAnswers = answer(answer(previous, 'q2'), 'q3');
  assert.equal(rules.valid(twoAnswers, context), true);
  assert.equal(rules.valid(twoAnswers, {...context, previous}), false);
  const tooMuchXP = answer(previous, 'q2', {xp: 2});
  assert.equal(rules.valid(tooMuchXP, context), true);
  assert.equal(rules.valid(tooMuchXP, {...context, previous}), false);
  const gContext = identity('glomerulus'), gPrevious = answer(empty(rules, gContext), 'q1');
  const tooMuchGold = answer(gPrevious, 'q2', {gold: 4});
  assert.equal(rules.valid(tooMuchGold, gContext), true);
  assert.equal(rules.valid(tooMuchGold, {...gContext, previous: gPrevious}), false);
  const rewritten = answer(previous, 'q2');
  rewritten.creditedEvents[0] = journeyId + ':1:changed'; rewritten.seenQids[0] = 'changed';
  assert.equal(rules.valid(rewritten, context), true);
  assert.equal(rules.valid(rewritten, {...context, previous}), false);
});

test('transitions forbid credit without a new position and irreversible-resource regression', () => {
  const rules = api(), context = identity(), previous = answer(empty(rules), 'q1');
  assert.equal(rules.valid({...clone(previous), xpGranted: 1}, {...context, previous}), false);
  const paid = answer(empty(rules), 'q1', {xp: 1});
  assert.equal(rules.valid({...clone(paid), xpGranted: 0}, {...context, previous: paid}), false);
  const gContext = identity('glomerulus'), gPaid = answer(empty(rules, gContext), 'q1', {gold: 2});
  assert.equal(rules.valid({...clone(gPaid), goldGranted: 0}, {...gContext, previous: gPaid}), false);
  const aContext = identity('aquaria'), aPaid = answer(empty(rules, aContext), 'q1', {shield: true});
  const resetShield = answer(aPaid, 'q2'); resetShield.shieldSpent = false;
  assert.equal(rules.valid(resetShield, aContext), true);
  assert.equal(rules.valid(resetShield, {...aContext, previous: aPaid}), false);
});

test('previous is optional but a supplied invalid ledger or changed journey cannot be repaired', () => {
  const rules = api(), context = identity(), previous = empty(rules), next = answer(previous, 'q1');
  assert.equal(rules.valid(next, context), true);
  for (const invalid of [undefined, null, {}, {...clone(previous), ruleset: 'class-boons-v1'}]) {
    assert.equal(rules.valid(next, {...context, previous: invalid}), false);
  }
  const other = answer(empty(rules, context, 'another-journey'), 'q1');
  assert.equal(rules.valid(other, context), true);
  assert.equal(rules.valid(other, {...context, previous}), false);
  assert.equal(rules.valid(empty(rules, identity('aquaria')), {...identity('aquaria'), previous}), false);
});

test('an expired window accepts only equivalent ledgers, never replenishment', () => {
  const rules = api(), context = identity('aquaria');
  let previous = empty(rules, context);
  for (let index = 1; index <= 20; index++) previous = answer(previous, 'q' + index, {shield: index === 1});
  assert.equal(rules.valid(clone(previous), {...context, previous}), true);
  const reset = empty(rules, context);
  assert.equal(rules.valid(reset, context), true);
  assert.equal(rules.valid(reset, {...context, previous}), false);
});
