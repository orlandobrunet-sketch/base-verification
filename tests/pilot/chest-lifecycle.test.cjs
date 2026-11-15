'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../js/game.js'), 'utf8').replace(/\r\n/g, '\n');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'Production lifecycle section must exist');
  return source.slice(a, b);
}
function fixture() {
  const nodes = new Map(), timers = new Map(), listeners = new Map(), contextListeners = [];
  let now = 0, id = 0, claims = 0, presentations = 0, generation = 1, owner = null, journeyId = 'technical-pilot', pilot = true;
  const events = {addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); }};
  class Node {
    constructor(id = '', parent = null) {
      this.id = id; this.parentElement = parent; this.isConnected = true; this.dataset = {};
      this.children = []; this.hidden = false; this.disabled = false;
      this.classList = {add() {}};
      if (id) nodes.set(id, this);
      if (parent) parent.children.push(this);
    }
    set innerHTML(value) { this.html = value; }
    appendChild(node) { node.parentElement = this; this.children.push(node); if (node.id) nodes.set(node.id, node); }
    closest(selector) { if (selector === '#autoChestPopup') return this.id === 'autoChestPopup' ? this : this.parentElement?.closest(selector);
      return this.hidden || this.parentElement?.hidden ? this : null; }
    getClientRects() { return this.hidden ? [] : [{}]; }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    querySelector(selector) { this.controls ||= new Map();
      if (!this.controls.has(selector)) this.controls.set(selector, new Node('', this));
      return this.controls.get(selector); }
    querySelectorAll() { return [this.querySelector('button')]; }
    setAttribute() {}
    focus() { ctx.document.activeElement = this; }
    remove() { this.isConnected = false; if (nodes.get(this.id) === this) nodes.delete(this.id);
      if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this);
      if (this.contains(ctx.document.activeElement)) ctx.document.activeElement = body; }
  }
  const body = new Node('body'), main = new Node('mainApp', body);
  class Observer { observe() { this.connected = true; } disconnect() { this.connected = false; } }
  const progress = () => ({domain: pilot ? 'pilot' : 'normal', journeyId: pilot ? journeyId : null, owner, generation});
  const ctx = {console, Object, Math, WeakMap, WeakSet, Set,
    _progressEpoch: 1, _progressSandboxMode: null, _pilotAnswerTransaction: null,
    state: {gameStarted: true, gameOver: false, gameCompleted: false, correctTotal: 0},
    _currentSaveOwner: () => owner, isCharacterPilot: () => pilot,
    performance: {now: () => now}, MutationObserver: Observer,
    getComputedStyle: () => ({display: 'block', visibility: 'visible'}),
    document: {...events, body, activeElement: main, hidden: false,
      createElement: () => new Node(), getElementById: key => nodes.get(key),
      querySelector: () => [...nodes.values()].find(node => node.dialog && node.isConnected && !node.hidden) || null,
      querySelectorAll: () => [...nodes.values()].filter(node => node.dialog && node.isConnected)},
    ...events, setTimeout(fn, delay) { const timer = ++id; timers.set(timer, {fn, at: now + delay}); return timer; },
    clearTimeout: timer => timers.delete(timer),
    playSound() {}, nqDialogo() {}, claimChestReward() { claims++; },
    renderVictoryResults() {
      if (!ctx.state.gameCompleted || ctx.state.correctTotal < 100 || nodes.has('victoryModal')) return false;
      presentations++; const result = new Node('victoryModal', body); result.dialog = true; return true;
    },
    matchMedia: () => ({matches: false}),
    NQPilot: {writable: true, captureBinding: progress,
      matchesBinding: binding => JSON.stringify(binding) === JSON.stringify(progress()),
      onContextChange: fn => contextListeners.push(fn)}};
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(section('    function _captureJourneyBinding()', '    function _reloadJourneyCollections()'), ctx);
  vm.runInContext(section('    function _afterCharacterCommit(', '    function _recordCharacterProgress('), ctx);
  vm.runInContext(section('    const _pendingChestRewards = [];', '    function claimChestReward()'), ctx);
  vm.runInContext(section('    function showGameCompletionModal()', '    function renderVictoryResults()'), ctx);
  vm.runInContext(section('    function reopenVictoryResults()', '    function returnHomeAfterVictory()'), ctx);
  function advance(ms) {
    const end = now + ms;
    for (;;) {
      const next = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      timers.delete(next[0]); now = next[1].at; next[1].fn();
    }
    now = end;
  }
  return {ctx, main, nodes, timers, listeners, advance,
    eval: code => vm.runInContext(code, ctx),
    queue(delay = 1200) { ctx._queueChestReward(ctx._captureChestRewardBinding(), now + delay); },
    flush: () => ctx._flushChestRewards(), popup: () => nodes.get('autoChestPopup'), claims: () => claims, presentations: () => presentations,
    click() { ctx._animateAndClaimChest(nodes.get('autoChestPopup').querySelector('.nqch-trigger')); },
    dialog(id = 'intermediate-dialog') { const dialog = new Node(id, body); dialog.dialog = true; return dialog; },
    victory() { const root = new Node('victoryModal', body), panel = new Node('victory-panel', root);
      panel.dialog = true; return {root, panel, control: panel.querySelector('button')}; },
    dock() { const root = new Node('mobileBottomDock', body); return {root, control: new Node('dock-forge', root)}; },
    control() { return new Node('other-control', body); },
    switch(values = {}) { if ('owner' in values) owner = values.owner; if ('journeyId' in values) journeyId = values.journeyId;
      if ('pilot' in values) pilot = values.pilot; generation += values.generation || 0; ctx._progressEpoch += values.epoch || 0; },
    retire: () => ctx._retireChestRewardContext(), notify: () => contextListeners.forEach(fn => fn())};
}

test('an answer receipt is created only after its actual commit callback runs', () => {
  const f = fixture();
  f.ctx._pilotAnswerTransaction = {normal: true, callbacks: []};
  const acceptedAnswerHook = section('          const chestBinding = _captureChestRewardBinding();', '\n        }\n        const sm');
  f.eval('{' + acceptedAnswerHook + '}');
  f.advance(2000); assert.equal(f.popup(), undefined); assert.equal(f.timers.size, 0);
  // Aborted transactions discard the real registered callbacks, not a receipt.
  f.ctx._pilotAnswerTransaction = null;
  assert.equal(f.eval('_pendingChestRewards.length'), 0);
  f.ctx._pilotAnswerTransaction = {normal: true, callbacks: []};
  f.eval('{' + acceptedAnswerHook + '}');
  const callbacks = f.ctx._pilotAnswerTransaction.callbacks;
  f.advance(500); callbacks.forEach(fn => fn()); f.ctx._pilotAnswerTransaction = null;
  f.advance(699); assert.equal(f.popup(), undefined);
  f.advance(1); assert.ok(f.popup());
});

for (const refuse of [true, false]) test('a real pilot commit ' + (refuse
  ? 'reaches a refused write without publishing its chest opportunity'
  : 'publishes its chest opportunity exactly once after a successful write'), async () => {
  const f = fixture(), values = new Map(); let failWrite = false, refusedWrites = 0, committedCallbacks = 0;
  Object.assign(f.ctx, {authUser: null, crypto: require('node:crypto').webcrypto,
    localStorage: {getItem: key => values.get(key) ?? null, removeItem: key => values.delete(key),
      setItem(key, value) {
        if (failWrite) { refusedWrites++; throw Error('Technical storage refusal'); }
        values.set(key, String(value));
      }},
    navigator: {locks: {request: async (_name, _options, callback) => callback({})}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/answer-presentation.js'), 'utf8'), f.ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/pilot.js'), 'utf8'), f.ctx);
  const pilot = f.ctx.NQPilot;
  assert.equal(await pilot.reserve('normal', null), true);
  assert.equal(pilot.start('nephros', 'normal', null), true);
  const save = pilot.load();
  Object.assign(save, {gameStarted: true, lives: 4, maxLives: 4, level: 1, xp: 0, gold: 0,
    score: 0, answered: false, queueIds: ['technical-q1']});
  assert.equal(pilot.save(save, pilot.classBenefits), true);
  assert.equal(pilot.beginTransaction(), true);
  f.ctx._pilotAnswerTransaction = {normal: false};
  f.eval(section('          const chestBinding = _captureChestRewardBinding();', '\n        }\n        const sm'));
  f.ctx._afterCharacterCommit(() => { committedCallbacks++; });
  const ledger = pilot.classBenefits;
  ledger.windowAnswers = 1; ledger.seenQids.push('technical-q1');
  ledger.creditedEvents.push(`${ledger.journeyId}:1:technical-q1`);
  const staged = pilot.load(); staged.classBenefits = ledger;
  staged.pilotLastAnswer = {domain: 'pilot', journeyId: ledger.journeyId, correct: true,
    xp: 0, gold: 0, shield: false};
  const before = values.get(pilot.KEY);
  failWrite = refuse;
  assert.equal(pilot.commit(staged, ledger), !refuse);
  assert.equal(refusedWrites, refuse ? 1 : 0, 'A valid answer reaches the real atomic storage write');
  assert.equal(committedCallbacks, refuse ? 0 : 1);
  assert.equal(pilot.commit(staged, ledger), false, 'A completed or refused transaction cannot be committed again');
  assert.equal(committedCallbacks, refuse ? 0 : 1);
  pilot.rollback(); f.ctx._pilotAnswerTransaction = null;
  f.advance(5000);
  if (refuse) assert.equal(values.get(pilot.KEY), before);
  else assert.notEqual(values.get(pilot.KEY), before);
  assert.equal(f.eval('_pendingChestRewards.length'), refuse ? 0 : 1);
  assert.equal(!!f.popup(), !refuse); assert.equal(f.claims(), 0);
  pilot.release();
});

test('the original deadline defers a hidden campaign without taking another surface focus', () => {
  const f = fixture(); f.queue(); f.main.hidden = true;
  const control = f.control(); control.focus();
  f.advance(1200); assert.equal(f.popup(), undefined); assert.equal(f.ctx.document.activeElement, control);
  f.main.hidden = false; f.flush(); assert.equal(f.popup(), undefined);
  f.main.focus(); f.flush(); assert.ok(f.popup());
});

test('an intermediate dialog holds each accepted opportunity; claims remain one per opportunity', () => {
  const f = fixture(), dialog = f.dialog(); f.queue(); f.queue(); f.advance(1200);
  assert.equal(f.popup(), undefined); assert.equal(f.eval('_pendingChestRewards.length'), 2);
  dialog.remove(); f.main.focus(); f.flush(); f.click(); f.click(); f.advance(1150);
  assert.equal(f.claims(), 1); assert.equal(f.eval('_pendingChestRewards.length'), 1);
  const reward = f.dialog(); f.flush(); assert.equal(f.popup(), undefined);
  reward.remove(); f.main.focus(); f.flush(); f.click(); f.advance(1150);
  assert.equal(f.claims(), 2); assert.equal(f.eval('_pendingChestRewards.length'), 0);
  assert.equal(f.listeners.size, 0);
});

for (const [label, change] of [
  ['owner', f => f.switch({owner: 'other'})], ['journey', f => f.switch({journeyId: 'other'})],
  ['domain', f => f.switch({pilot: false})], ['epoch', f => f.switch({epoch: 1})],
  ['lease', f => f.switch({generation: 1})], ['sandbox', f => { f.ctx._progressSandboxMode = 'preview'; }],
]) test('a pending or opening chest cannot claim across a changed ' + label, () => {
  const f = fixture(); f.queue(0); f.advance(0); f.click(); change(f); f.flush(); f.advance(1150);
  assert.equal(f.claims(), 0); assert.equal(f.popup(), undefined); assert.equal(f.timers.size, 0);
  assert.equal(f.eval('_pendingChestRewards.length'), 0); assert.equal(f.listeners.size, 0);
});

test('leaving during the opening animation retains the same unclaimed opportunity', () => {
  const f = fixture(); f.queue(0); f.advance(0); f.click(); f.advance(500);
  f.main.hidden = true; f.flush(); f.advance(650); assert.equal(f.claims(), 0); assert.equal(f.popup(), undefined);
  f.main.hidden = false; f.main.focus(); f.flush(); f.click(); f.advance(1150);
  assert.equal(f.claims(), 1); assert.equal(f.eval('_pendingChestRewards.length'), 0);
});

test('same-pilot transfer is opaque, single use, identity checked and cannot duplicate receipts', () => {
  const f = fixture(); f.queue(); f.queue();
  const first = f.ctx._capturePendingChestPilotResume(), second = f.ctx._capturePendingChestPilotResume();
  assert.deepEqual(Object.keys(first), []); assert.equal(Object.isFrozen(first), true);
  f.retire(); f.switch({generation: 1, epoch: 1});
  assert.equal(f.ctx._restorePendingChestPilotResume(first), true);
  assert.equal(f.ctx._restorePendingChestPilotResume(first), false);
  assert.equal(f.ctx._restorePendingChestPilotResume(second), true);
  assert.equal(f.eval('_pendingChestRewards.length'), 2);
  f.advance(1200); f.click(); f.advance(1150); f.main.focus(); f.flush(); f.click(); f.advance(1150);
  assert.equal(f.claims(), 2);
  assert.equal(f.ctx._restorePendingChestPilotResume(Object.freeze({})), false);
});

test('another owner or pilot cannot receive a saved receipt, and failure consumes the token', () => {
  for (const changed of [{owner: 'other'}, {journeyId: 'other'}, {pilot: false}]) {
    const f = fixture(); f.queue(); const token = f.ctx._capturePendingChestPilotResume();
    f.retire(); f.switch({...changed, generation: 1, epoch: 1});
    assert.equal(f.ctx._restorePendingChestPilotResume(token), false);
    assert.equal(f.ctx._restorePendingChestPilotResume(token), false);
    f.advance(5000); assert.equal(f.popup(), undefined); assert.equal(f.claims(), 0);
  }
});

test('a direct preview preserves immediate render without campaign visibility and never transfers as earned', () => {
  const f = fixture(); f.main.hidden = true; f.ctx.triggerChestRewardPopup(); f.flush(); assert.ok(f.popup());
  const token = f.ctx._capturePendingChestPilotResume(); f.retire(); f.switch({epoch: 1, generation: 1});
  assert.equal(f.ctx._restorePendingChestPilotResume(token), true); f.advance(5000); assert.equal(f.popup(), undefined);
  f.ctx.triggerChestRewardPopup(); f.click(); f.advance(1150); assert.equal(f.claims(), 1);
});

test('retiring or releasing the context disconnects every pending timer, popup and watcher', () => {
  for (const method of ['retire', 'notify']) {
    const f = fixture(); f.queue(); f.ctx.triggerChestRewardPopup(); f.click(); f[method](); f.advance(10000);
    assert.equal(f.timers.size, 0); assert.equal(f.listeners.size, 0); assert.equal(f.popup(), undefined);
    assert.equal(f.eval('_pendingChestRewards.length'), 0); assert.equal(f.claims(), 0);
  }
});

test('an earned final chest keeps1200ms and its complete native prize precedes results once', () => {
  const f = fixture(); Object.assign(f.ctx.state, {gameCompleted: true, correctTotal: 100});
  f.queue(); f.ctx.showGameCompletionModal(); f.ctx.showGameCompletionModal();
  assert.equal(f.presentations(), 0); f.advance(1199); assert.equal(f.popup(), undefined);
  f.advance(1); assert.ok(f.popup()); assert.equal(f.presentations(), 0);
  f.click(); f.click(); f.advance(1150);
  const article = f.dialog('chestModal'); article.querySelector('button').focus(); f.flush();
  assert.equal(f.claims(), 1); assert.equal(f.eval('_pendingChestRewards.length'), 0); assert.equal(f.presentations(), 0);
  article.remove(); f.main.focus(); f.flush(); f.flush();
  assert.equal(f.presentations(), 1); assert.equal(f.ctx.state.gameCompleted, true); assert.equal(f.ctx.state.correctTotal, 100);
});

for (const id of ['chestModal', 'equipCompareOverlay', 'forge-popup']) test('a handback after receipt consumption still awaits '+id, () => {
  const f = fixture(); Object.assign(f.ctx.state, {gameCompleted: true, correctTotal: 100});
  f.queue(0); f.advance(0); f.click(); f.advance(1150); assert.equal(f.claims(), 1);
  const output = f.dialog(id); output.querySelector('button').focus();
  f.ctx.showGameCompletionModal(); assert.equal(f.presentations(), 0);
  output.remove(); f.main.focus(); f.flush(); assert.equal(f.presentations(), 1);
});

test('results remain synchronous without a prize and never reappear after an existing instance closes', () => {
  const f = fixture(); Object.assign(f.ctx.state, {gameCompleted: true, correctTotal: 100});
  f.ctx.showGameCompletionModal(); assert.equal(f.presentations(), 1);
  f.ctx.showGameCompletionModal(); f.ctx.reopenVictoryResults(); assert.equal(f.presentations(), 1);
  f.nodes.get('victoryModal').remove(); f.flush(); assert.equal(f.presentations(), 1);
  f.ctx.state.completedGame = true; f.ctx.reopenVictoryResults(); assert.equal(f.presentations(), 2);
});

test('a deferred result respects external focus, hidden campaign and context retirement', () => {
  const f = fixture(); Object.assign(f.ctx.state, {gameCompleted: true, correctTotal: 100});
  const output = f.dialog(); output.querySelector('button').focus(); f.ctx.showGameCompletionModal();
  assert.equal(f.presentations(), 0); output.remove(); f.control().focus(); f.flush(); assert.equal(f.presentations(), 0);
  f.main.hidden = true; f.main.focus(); f.flush(); assert.equal(f.presentations(), 0);
  f.main.hidden = false; f.ctx.document.hidden = true; f.flush(); assert.equal(f.presentations(), 0);
  f.ctx.document.hidden = false; f.flush(); assert.equal(f.presentations(), 1);
  for (const change of [g => g.switch({owner:'other'}), g => g.switch({epoch:1}),
    g => {g.ctx._progressSandboxMode='other';}, g => {g.ctx.state.gameOver=true;}, g => g.retire()]) {
    const g = fixture(); Object.assign(g.ctx.state, {gameCompleted: true, correctTotal: 100});
    g.dialog(); g.ctx.showGameCompletionModal(); assert.equal(g.presentations(), 0);
    change(g); g.flush(); g.advance(2000); assert.equal(g.presentations(), 0); assert.equal(g.listeners.size, 0);
  }
});

test('pending earned rewards block completion before reveal, while direct or stale opportunities do not', () => {
  const f = fixture(); f.queue();
  assert.equal(f.ctx.hasPendingChestReward(), true);
  f.advance(1199); assert.equal(f.ctx.hasPendingChestReward(), true); assert.equal(f.popup(), undefined);
  f.advance(1); f.click(); f.advance(1150); assert.equal(f.ctx.hasPendingChestReward(), false);
  const direct = fixture(); direct.ctx.triggerChestRewardPopup(); assert.equal(direct.ctx.hasPendingChestReward(), false);
  const stale = fixture(); stale.queue(); stale.switch({owner: 'other'}); assert.equal(stale.ctx.hasPendingChestReward(), false);
  const ended = fixture(); ended.queue(); ended.ctx.state.gameOver = true; assert.equal(ended.ctx.hasPendingChestReward(), false);
});

test('the visible native dock remains a valid origin for current campaign results', () => {
  const f = fixture(), dock = f.dock(); Object.assign(f.ctx.state, {gameCompleted:true,correctTotal:100});
  dock.control.focus(); assert.equal(f.main.contains(dock.control), false);
  f.ctx.showGameCompletionModal(); assert.equal(f.presentations(), 1);
});

test('native dock focus cannot bypass a pending prize, another dialog or a hidden campaign', () => {
  for (const block of [f=>f.queue(),f=>f.dialog(),f=>{f.main.hidden=true;},f=>{f.ctx.document.hidden=true;}]) {
    const f = fixture(), dock = f.dock(); Object.assign(f.ctx.state, {gameCompleted:true,correctTotal:100});
    dock.control.focus(); block(f); f.ctx.showGameCompletionModal(); f.advance(1200);
    assert.equal(f.presentations(), 0); assert.equal(f.popup(), undefined); assert.equal(f.ctx.document.activeElement, dock.control);
  }
});

test('an external control with a native-looking action does not become campaign focus', () => {
  const f = fixture(), control = f.control(); control.dataset.action = 'showForjaModal';
  Object.assign(f.ctx.state, {gameCompleted:true,correctTotal:100}); control.focus();
  f.ctx.showGameCompletionModal(); assert.equal(f.presentations(), 0);
});
