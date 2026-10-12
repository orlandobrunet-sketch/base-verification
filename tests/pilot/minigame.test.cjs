const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../js/minigame.js'), 'utf8');
// Execute the production mode functions without unrelated campaign/DOM listeners.
const rapid = source.slice(0, source.indexOf('    /* As etapas do Confronto Final'));
const narrative = source.slice(source.indexOf('    function showNarrativePopup(stage)'),
  source.indexOf('    function resetGame()'));
const ritual = source.slice(source.indexOf('    const RITUAL_LEN'),
  source.indexOf('    window.openRitual = openRitual;') + '    window.openRitual = openRitual;'.length);
const bossSource = fs.readFileSync(path.join(__dirname, '../../js/boss.js'), 'utf8');
const pilotCard = bossSource.slice(bossSource.indexOf('    function refreshCharacterPilotUI()'),
  bossSource.indexOf('    window.refreshCharacterPilotUI = refreshCharacterPilotUI;'));
const characterStartup = bossSource.slice(bossSource.indexOf('    async function startGameWithCharacter()'));

function fixture({pilot = false, loadTopics = async () => {}} = {}) {
  const normal = new Map([
    ['nefroquest-minigame-best', '9'], ['nefroquest-recommended-difficulty', 'hard'],
    ['nefroquest-ritual-done', 'normal-history'], ['nefroquest-sr-data', '{"legacy":1}']
  ]);
  const assisted = new Map(), nodes = new Map(), timeouts = new Map(), intervals = new Map();
  const subscribers = new Set(), closed = [], calls = {xp: [], items: [], sr: [], saved: 0, stun: 0, recovery: 0};
  let generation = 1, epoch = 1, owner = 'fixture-user', timerId = 0;
  const storage = values => ({getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)});
  const ordinaryStorage = storage(normal), assistedStorage = storage(assisted);

  class Node {
    constructor(id = '', parent = null) {
      this.id = id; this.parent = parent; this.children = [];
      this.isConnected = true; this.disabled = false; this.dataset = {}; this.listeners = [];
      this.style = {}; this.classList = {add() {}, toggle() {}};
      this.lastElementChild = {insertAdjacentHTML() {}};
      if (id) nodes.set(id, this);
      if (parent) parent.children.push(this);
    }
    set innerHTML(html) {
      this.children.slice().forEach(node => node.remove());
      this.children = []; this.html = html;
      for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) new Node(match[1], this);
      for (const match of html.matchAll(/<button[^>]+\bdata-i="(\d+)"[^>]*>/g)) {
        const button = new Node('', this); button.dataset.i = match[1];
      }
    }
    get innerHTML() { return this.html || ''; }
    querySelector(selector) {
      if (selector.startsWith('#')) return nodes.get(selector.slice(1)) || null;
      return new Node('', this);
    }
    querySelectorAll(selector) {
      if (selector === '#ritualOpts button') return this.children.filter(node => 'i' in node.dataset);
      return [];
    }
    addEventListener(type, fn, options) { this.listeners.push({type, fn, once: !!options?.once}); }
    click() {
      if (this.disabled) return;
      for (const listener of this.listeners.filter(item => item.type === 'click')) {
        if (listener.once) this.listeners.splice(this.listeners.indexOf(listener), 1);
        listener.fn({preventDefault() {}});
      }
    }
    insertAdjacentHTML(position, html) {
      for (const match of html.matchAll(/\bid="([^"]+)"/g)) new Node(match[1], this.parent);
    }
    remove() {
      this.isConnected = false;
      this.children.slice().forEach(node => node.remove());
      if (nodes.get(this.id) === this) nodes.delete(this.id);
      if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this);
    }
    focus() {}
    getBoundingClientRect() { return {left: 0, top: 0, width: 1, height: 1}; }
  }
  const ctx = {
    console, localStorage: ordinaryStorage, state: {gold: 0, xp: 0, correctTotal: 25, level: 1},
    document: {getElementById: id => nodes.get(id) || null,
      createElement: () => new Node(), body: {appendChild: node => {if (node.id) nodes.set(node.id, node);}}},
    setTimeout: (fn, delay) => {const id = ++timerId; timeouts.set(id, {fn, delay}); return id;},
    clearTimeout: id => timeouts.delete(id),
    setInterval: fn => {const id = ++timerId; intervals.set(id, fn); return id;},
    clearInterval: id => intervals.delete(id),
    RAPID_QUIZ_QUESTIONS: Array.from({length: 12}, (_, i) => ({qid: `rapid-fixture-${i}`, q: 'Fixture', ans: true, exp: '', cat: 'fixture'})),
    topics: ['easy', 'medium', 'hard'].flatMap(band => Array.from({length: 12}, (_, i) =>
      ({qid: `ritual-fixture-${band}-${i}`, _d: band, q: 'Fixture', o: ['A', 'B'], a: 0}))),
    items: Object.fromEntries(['weapon', 'armor', 'relic'].map(slot => [slot,
      [{n: 'Fixture item', rar: 'epic', atk: 0, def: 0, kno: 0}]])),
    nqDialogo() {}, escapeHtml: String, gainXP: value => {calls.xp.push(value); ctx.state.xp += value;},
    equipOrSell: (slot, item) => calls.items.push({slot, item}), log() {}, _track() {},
    renderHUD() {}, updateBadges() {}, saveGame() {calls.saved++;}, playSound() {},
    applyBossStun() {calls.stun++; ctx.state.bossStunActive = true;},
    removeStun() {calls.recovery++; ctx.state.bossStunActive = false;},
    updateSRData: (qid, correct) => {
      calls.sr.push({qid, correct, pilot: ctx.NQPilot.active});
      ctx.nqProgressStorage(ctx.NQPilot.captureBinding()).setItem('nefroquest-sr-data', JSON.stringify(calls.sr));
    }, _loadTopics: loadTopics,
    nqPaginaPropria: id => {
      const pagina = new Node(id);
      return {pagina, fechar: options => {closed.push({id, options}); pagina.remove();}};
    }, scrollTo() {},
    NQPilot: {
      active: pilot,
      captureBinding: () => ({domain: ctx.NQPilot.active ? 'pilot' : 'normal', generation, owner}),
      matchesBinding: binding => !!binding && binding.generation === generation && binding.owner === owner &&
        binding.domain === (ctx.NQPilot.active ? 'pilot' : 'normal'),
      onContextChange: fn => subscribers.add(fn)
    },
    _captureJourneyBinding: () => ({epoch, owner}),
    _matchesJourneyBinding: binding => binding.epoch === epoch && binding.owner === owner,
    nqProgressStorage: binding => {
      if (!ctx.NQPilot.matchesBinding(binding)) throw new Error('Stale test binding');
      return binding.domain === 'pilot' ? assistedStorage : ordinaryStorage;
    }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(rapid + '\n' + narrative + '\n' + ritual, ctx);
  const node = id => {assert.ok(nodes.has(id), `Missing test DOM node ${id}`); return nodes.get(id);};
  const runDelay = delay => {
    const entries = [...timeouts.entries()].filter(([, task]) => task.delay === delay);
    entries.forEach(([id, task]) => {timeouts.delete(id); task.fn();});
  };
  const change = (nextPilot = !ctx.NQPilot.active, nextOwner = owner) => {
    ctx.NQPilot.active = nextPilot; owner = nextOwner; generation++; epoch++;
    subscribers.forEach(fn => fn());
  };
  const finishRapid = () => {
    for (let i = 0; i < 10; i++) {node('mgTrue').click(); node('mgProxima').click();}
  };
  const finishRitual = async () => {
    await node('ritualStart').listeners[0].fn();
    for (let i = 0; i < 8; i++) {
      node('ritualPage').querySelectorAll('#ritualOpts button')[0].click(); runDelay(900);
    }
  };
  return {ctx, normal, assisted, nodes, timeouts, intervals, closed, calls, node, runDelay,
    change, finishRapid, finishRitual, advanceNormalJourney: () => {epoch++;}};
}

test('delayed pilot invitation is cancelled and queued replay cannot open in normal context', () => {
  const f = fixture({pilot: true});
  f.ctx.maybeTriggerMinigame(25);
  const queued = [...f.timeouts.values()][0].fn;
  f.change(false); queued();
  assert.equal(f.timeouts.size, 0);
  assert.equal(f.nodes.has('minigameIntroPopup'), false);
});

test('normal new-journey epoch also rejects an already queued invitation', () => {
  const f = fixture(); f.ctx.maybeTriggerMinigame(25);
  f.advanceNormalJourney(); f.runDelay(1500);
  assert.equal(f.nodes.has('minigameIntroPopup'), false);
});

test('ordinary completed quiz retains reward amounts and credits each result once', () => {
  const f = fixture(); f.ctx.showRapidQuizMinigame();
  for (let i = 0; i < 9; i++) {f.node('mgTrue').click(); f.node('mgProxima').click();}
  f.node('mgTrue').click();
  const duplicateResult = f.node('mgProxima').listeners[0].fn;
  f.node('mgProxima').click(); duplicateResult();
  assert.equal(f.ctx.state.gold, 345); assert.equal(f.ctx.state.xp, 135);
  assert.deepEqual(f.calls.xp, [135]);
  f.node('mgContinueBtn').click(); f.runDelay(400);
  assert.equal(f.calls.items.length, 1); assert.equal(f.calls.saved, 1);
});

test('rapid quiz closes on account/domain change and stale option cannot grant resources', () => {
  const f = fixture({pilot: true}); f.ctx.showRapidQuizMinigame();
  const staleAnswer = f.node('mgTrue').listeners[0].fn;
  f.change(false, 'different-fixture-user'); staleAnswer();
  assert.equal(f.nodes.has('rapidQuizPage'), false); assert.equal(f.intervals.size, 0);
  assert.equal(f.ctx.state.gold, 0); assert.equal(f.ctx.state.xp, 0);
  assert.equal(f.closed[0].options.restoreOrigin, false);
});

test('delayed item cannot cross pilot leave even when its callback was already queued', () => {
  const f = fixture({pilot: true}); f.ctx.showRapidQuizMinigame(); f.finishRapid();
  f.node('mgContinueBtn').click();
  const queuedItem = [...f.timeouts.values()].find(task => task.delay === 400).fn;
  f.change(false); queuedItem();
  assert.equal(f.calls.items.length, 0); assert.equal(f.timeouts.size, 0);
});

test('delayed item is also rejected after a normal journey reset without a domain notification', () => {
  const f = fixture(); f.ctx.showRapidQuizMinigame(); f.finishRapid();
  f.node('mgContinueBtn').click(); f.advanceNormalJourney(); f.runDelay(400);
  assert.equal(f.calls.items.length, 0);
});

test('pilot standalone record is isolated and has no campaign reward', () => {
  const f = fixture({pilot: true}), before = JSON.stringify([...f.normal]);
  f.ctx.showStandaloneMinigame(); f.finishRapid();
  assert.equal(f.assisted.get('nefroquest-minigame-best'), '10');
  assert.equal(JSON.stringify([...f.normal]), before);
  assert.equal(f.ctx.state.gold, 0); assert.equal(f.ctx.state.xp, 0);
});

test('record write failure that pauses the pilot closes cleanly without a false result or normal write', () => {
  const f = fixture({pilot: true}), before = JSON.stringify([...f.normal]);
  const progressStorage = f.ctx.nqProgressStorage;
  f.ctx.nqProgressStorage = binding => ({
    getItem: key => progressStorage(binding).getItem(key),
    setItem() {f.change(true); throw new Error('Synthetic persistence failure');}
  });
  f.ctx.showStandaloneMinigame();
  assert.doesNotThrow(() => f.finishRapid());
  assert.equal(f.nodes.has('rapidQuizPage'), false);
  assert.equal(JSON.stringify([...f.normal]), before);
  assert.equal(f.assisted.size, 0);
});

test('pilot ritual stores recommendation and SR only in its own progress', async () => {
  const f = fixture({pilot: true}), before = JSON.stringify([...f.normal]);
  await f.ctx.openRitual(); await f.finishRitual();
  assert.equal(f.assisted.get('nefroquest-recommended-difficulty'), 'hardcore');
  assert.ok(f.assisted.get('nefroquest-ritual-done')); assert.equal(f.calls.sr.length, 8);
  assert.ok(f.calls.sr.every(result => result.pilot));
  assert.equal(JSON.stringify([...f.normal]), before);
  assert.equal(f.ctx.state.gold, 0); assert.equal(f.ctx.state.xp, 0);
});

test('normal ritual retains recommendation behavior and normal SR persistence', async () => {
  const f = fixture(); await f.ctx.openRitual(); await f.finishRitual();
  assert.equal(f.normal.get('nefroquest-recommended-difficulty'), 'hardcore');
  assert.notEqual(f.normal.get('nefroquest-ritual-done'), 'normal-history');
  assert.equal(f.calls.sr.length, 8); assert.ok(f.calls.sr.every(result => !result.pilot));
  assert.equal(f.assisted.size, 0);
});

test('ritual topic load completed after leaving cannot reopen or save to the next journey', async () => {
  let completeLoad;
  const f = fixture({pilot: true, loadTopics: () => new Promise(resolve => {completeLoad = resolve;})});
  await f.ctx.openRitual();
  const loading = f.node('ritualStart').listeners[0].fn();
  f.change(false); completeLoad(); await loading;
  assert.equal(f.nodes.has('ritualPage'), false); assert.equal(f.nodes.has('ritualQuestao'), false);
  assert.equal(f.calls.sr.length, 0); assert.equal(f.assisted.size, 0);
});

test('ritual answer timer and cached option are harmless after context changes', async () => {
  const f = fixture({pilot: true}); await f.ctx.openRitual();
  await f.node('ritualStart').listeners[0].fn();
  const oldAnswer = f.node('ritualPage').querySelectorAll('#ritualOpts button')[0].listeners[0].fn;
  oldAnswer(); const queued = [...f.timeouts.values()].find(task => task.delay === 900).fn;
  f.change(false); queued(); oldAnswer();
  assert.equal(f.timeouts.size, 0); assert.equal(f.calls.sr.length, 0);
  assert.equal(f.assisted.size, 0); assert.equal(f.nodes.has('ritualPage'), false);
  assert.equal(f.closed[0].options.restoreFocus, false);
});

for (const effect of [
  {name: 'stun', stage: {at: 93, stun: true}, initial: false, final: true},
  {name: 'recovery', stage: {at: 98, stunRecovery: true}, initial: true, final: false}
]) {
  const showEffect = f => {
    f.ctx.state.bossStunActive = effect.initial;
    f.ctx.showNarrativePopup({...effect.stage, ch: 'Fixture', title: 'Fixture', text: 'Fixture'});
    return [...f.timeouts.values()].find(task => task.delay === 300).fn;
  };
  const assertCancelled = f => {
    assert.equal(f.ctx.state.bossStunActive, effect.initial);
    assert.equal(f.calls.stun, 0); assert.equal(f.calls.recovery, 0);
  };

  test(`narrative ${effect.name} applies once in its original pilot journey`, () => {
    const f = fixture({pilot: true}); showEffect(f); f.runDelay(300); f.runDelay(300);
    assert.equal(f.ctx.state.bossStunActive, effect.final);
    assert.equal(f.calls[effect.name], 1);
  });

  test(`queued narrative ${effect.name} cannot affect the normal journey after pilot leave`, () => {
    const f = fixture({pilot: true}), queued = showEffect(f);
    f.change(false); queued();
    assertCancelled(f); assert.equal(f.timeouts.size, 0);
  });

  test(`queued narrative ${effect.name} cannot affect another account in the same domain`, () => {
    const f = fixture({pilot: true}), queued = showEffect(f);
    f.change(true, 'different-fixture-user'); queued();
    assertCancelled(f); assert.equal(f.timeouts.size, 0);
  });

  test(`narrative ${effect.name} is rejected after a normal journey reset without a domain event`, () => {
    const f = fixture(); showEffect(f); f.advanceNormalJourney(); f.runDelay(300);
    assertCancelled(f);
  });
}

function renderPilotCard(saved) {
  const nodes = Object.fromEntries(['characterPilotSaved', 'characterPilotSavedDescription',
    'resumePilotBtn', 'characterPilotBanner'].map(id => [id, {hidden: false, disabled: false, textContent: ''}]));
  const context = {state: {gameStarted: false}, NQPilot: {active: false, peek: () => saved},
    document: {getElementById: id => nodes[id] || null}};
  context.window = context;
  vm.createContext(context); vm.runInContext(pilotCard, context);
  context.refreshCharacterPilotUI();
  return nodes;
}

test('incomplete pilot card explains that the journey did not start and prevents resume', () => {
  const card = renderPilotCard({exists: true, valid: true, started: false, resumable: false,
    closed: false, character: 'nephros', difficulty: 'normal'});
  assert.equal(card.characterPilotSaved.hidden, false);
  assert.equal(card.resumePilotBtn.disabled, true);
  assert.equal(card.resumePilotBtn.textContent, 'Piloto não iniciado');
  assert.match(card.characterPilotSavedDescription.textContent, /registro antigo não concluiu o início/);
  assert.match(card.characterPilotSavedDescription.textContent, /Comece uma nova jornada para jogar/);
});

test('closed pilot card keeps its closed label and prevents resume', () => {
  const card = renderPilotCard({exists: true, valid: true, started: true, resumable: false,
    closed: true, character: 'aquaria', difficulty: 'hard'});
  assert.equal(card.resumePilotBtn.disabled, true);
  assert.equal(card.resumePilotBtn.textContent, 'Jornada piloto encerrada');
  assert.match(card.characterPilotSavedDescription.textContent, /encerrado/);
});

test('valid started pilot card allows resume with character and difficulty details', () => {
  const card = renderPilotCard({exists: true, valid: true, started: true, resumable: true,
    closed: false, character: 'glomerulus', difficulty: 'easy'});
  assert.equal(card.resumePilotBtn.disabled, false);
  assert.equal(card.resumePilotBtn.textContent, 'Retomar jornada piloto');
  assert.match(card.characterPilotSavedDescription.textContent, /Dr\. Glomerulus · Fácil/);
});

test('invalid or foreign pilot card refuses resume and preserves normal journey messaging', () => {
  const card = renderPilotCard({exists: true, valid: false, resumable: false});
  assert.equal(card.characterPilotSaved.hidden, false);
  assert.equal(card.resumePilotBtn.disabled, true);
  assert.match(card.characterPilotSavedDescription.textContent, /Este piloto salvo não pode continuar/);
  assert.match(card.characterPilotSavedDescription.textContent, /jornada normal permanece disponível/);
});

test('absent pilot card stays hidden and does not expose an enabled resume action', () => {
  const card = renderPilotCard({exists: false, valid: false});
  assert.equal(card.characterPilotSaved.hidden, true);
  assert.equal(card.resumePilotBtn.disabled, true);
});

function startupFixture({pilot = false, failFirstQuestion = false, failFinalSave = false, rejectNormalStart = false} = {}) {
  let epoch = 1, generation = 1, finishLoad, failLoad;
  const transitions = [];
  const calls = {start: [], normalStart: [], order: [], abort: 0, render: 0, save: 0, dismiss: 0, mainOpened: 0, toast: [], toastRemoved: 0};
  const context = {
    state: {character: 'aquaria', difficulty: 'normal', gameStarted: false, gold: 88},
    authUser: {id: 'fixture-owner'}, questionBank: null,
    characters: {aquaria: {name: 'Fixture', title: 'Fixture'}, nephros: {name: 'Fixture', title: 'Fixture'}},
    _lastSelectedCharacter: 'aquaria', _guestMode: true, FREE_QUESTIONS_LIMIT: 15,
    isProgressSandbox: () => false, isPremium: () => false,
    localStorage: {getItem: () => null}, getEntitlementQuestionsAnswered: () => 0,
    _toast: message => calls.toast.push(message),
    _loadTopics: () => new Promise((resolve, reject) => {finishLoad = resolve; failLoad = reject;}),
    document: {querySelector: () => ({remove: () => calls.toastRemoved++}), getElementById: () => null,
      body: {classList: {remove() {}}}},
    ui: {journal: {innerHTML: 'Fixture'}}, _forja: null, _forjaSequence: 0,
    _sessionWrongAnswers: [], _minigameTriggerCount: 0, _boardPushedThisSession: false, chestCost: 0,
    removeStun() {}, log() {}, shuffleQueue() {}, renderHUD() {}, updateBadges() {},
    renderQuestion() {calls.render++; calls.order.push('rendered'); if (failFirstQuestion) stopPilot();},
    saveGame() {calls.save++; if (failFinalSave) stopPilot();},
    refreshCharacterPilotUI() {}, dismissWelcome() {calls.dismiss++; calls.order.push('dismissed'); transitions.push(() => calls.mainOpened++);},
    // This fixture tests the caller's gates and success ordering; persistence is tested by the real save engine.
    _startNormalCharacterJourney({character, difficulty, initialize}) {
      calls.normalStart.push({character, difficulty});
      if (rejectNormalStart) return false;
      Object.assign(context.state, {character, difficulty, journeyDomain: 'normal',
        classBenefits: {journeyId: 'normal-fixture', lockedClass: character}});
      if (initialize() === false) return false;
      calls.order.push('normal-confirmed');
      return true;
    },
    musicEnabled: false, musicStarted: false,
    cancelPilotGameStart() {calls.abort++;},
    _captureJourneyBinding: () => ({epoch, owner: context.authUser?.id || null}),
    _matchesJourneyBinding: binding => binding.epoch === epoch && binding.owner === (context.authUser?.id || null),
    NQPilot: {
      active: pilot, writable: true, status: pilot ? 'reserved' : 'normal', classBenefits: null,
      captureBinding: () => ({generation, owner: context.authUser?.id || null, domain: context.NQPilot.active}),
      matchesBinding: binding => binding.generation === generation && binding.owner === (context.authUser?.id || null) &&
        binding.domain === context.NQPilot.active,
      start: (...args) => {calls.start.push(args); context.NQPilot.status = 'active'; generation++;
        context.NQPilot.classBenefits = {lockedClass: args[0]}; return true;}
    }
  };
  const stopPilot = () => {
    epoch++; generation++; context.NQPilot.active = false; context.NQPilot.writable = false;
    context.NQPilot.status = 'normal'; context.state.gameStarted = false; context.state.journeyDomain = 'normal';
  };
  context.window = context;
  vm.createContext(context); vm.runInContext(characterStartup, context);
  return {context, calls,
    runTransitions: () => transitions.splice(0).forEach(callback => callback()),
    start: () => context.startGameWithCharacter(),
    resolve: () => {context.questionBank = []; finishLoad();},
    reject: () => failLoad(new Error('Synthetic load failure')),
    change: ({nextPilot = context.NQPilot.active, owner = context.authUser?.id || null} = {}) => {
      epoch++; generation++; context.authUser = owner ? {id: owner} : null;
      context.NQPilot.active = nextPilot; context.NQPilot.status = nextPilot ? 'reserved' : 'normal';
      Object.assign(context.state, {character: 'nephros', gameStarted: false, gold: 777});
    }};
}

for (const transition of [
  {name: 'normal startup to new pilot reservation', pilot: false, nextPilot: true},
  {name: 'old pilot reservation to another pilot reservation', pilot: true, nextPilot: true},
  {name: 'old pilot reservation to normal journey', pilot: true, nextPilot: false},
  {name: 'normal startup to another normal journey', pilot: false, nextPilot: false},
  {name: 'pilot startup to another account', pilot: true, nextPilot: true, owner: 'different-owner'}
]) {
  test(`topic load completing after ${transition.name} preserves the new context`, async () => {
    const f = startupFixture({pilot: transition.pilot}), pending = f.start();
    f.change({nextPilot: transition.nextPilot, owner: transition.owner});
    const stateBefore = JSON.stringify(f.context.state), statusBefore = f.context.NQPilot.status;
    f.resolve(); await pending;
    assert.equal(JSON.stringify(f.context.state), stateBefore);
    assert.equal(f.context.NQPilot.status, statusBefore);
    assert.equal(f.calls.start.length, 0); assert.equal(f.calls.abort, 0);
    assert.equal(f.calls.normalStart.length, 0);
    assert.equal(f.calls.render, 0); assert.equal(f.calls.save, 0); assert.equal(f.calls.dismiss, 0);
    assert.equal(f.calls.toastRemoved, 0); assert.equal(f.calls.toast.length, 1);
  });
}

for (const failure of ['failFirstQuestion', 'failFinalSave']) {
  test(`pilot ${failure} stays at welcome and does not schedule an empty campaign transition`, async () => {
    const f = startupFixture({pilot: true, [failure]: true}), pending = f.start();
    f.resolve(); assert.equal(await pending, false); f.runTransitions();
    assert.equal(f.calls.start.length, 1); assert.equal(f.calls.render, 1);
    assert.equal(f.calls.save, failure === 'failFirstQuestion' ? 0 : 1);
    assert.equal(f.calls.dismiss, 0); assert.equal(f.calls.mainOpened, 0);
    assert.equal(f.context.NQPilot.active, false); assert.equal(f.context.state.gameStarted, false);
    assert.equal(f.calls.abort, 0);
  });
}

test('failed old pilot topic load cannot cancel the new pilot reservation or replace its message', async () => {
  const f = startupFixture({pilot: true}), pending = f.start();
  f.change({nextPilot: true, owner: 'different-owner'});
  const stateBefore = JSON.stringify(f.context.state);
  f.reject(); await pending;
  assert.equal(JSON.stringify(f.context.state), stateBefore);
  assert.equal(f.context.NQPilot.status, 'reserved'); assert.equal(f.calls.abort, 0);
  assert.equal(f.calls.toast.length, 1); assert.equal(f.calls.toastRemoved, 0);
});

for (const pilot of [false, true]) {
  test(`${pilot ? 'pilot' : 'normal'} startup still initializes after its original topic load`, async () => {
    const f = startupFixture({pilot}), pending = f.start();
    assert.equal(f.calls.start.length, 0); assert.equal(f.calls.normalStart.length, 0);
    assert.equal(f.calls.render, 0); assert.equal(f.calls.dismiss, 0);
    f.resolve(); assert.equal(await pending, true);
    assert.equal(f.context.state.gameStarted, true);
    assert.equal(f.context.state.journeyDomain, pilot ? 'pilot' : 'normal');
    assert.equal(f.context.state.pilotJourneyAccounted, false);
    assert.equal(f.calls.start.length, pilot ? 1 : 0);
    assert.equal(f.calls.render, 1); assert.equal(f.calls.save, pilot ? 1 : 0);
    assert.equal(f.calls.dismiss, 1);
    assert.equal(f.calls.abort, 0); assert.equal(f.calls.toastRemoved, 1);
    assert.equal(f.calls.normalStart.length, pilot ? 0 : 1);
    if (!pilot) {
      assert.deepEqual(f.calls.normalStart, [{character: 'aquaria', difficulty: 'normal'}]);
      assert.deepEqual(f.calls.order, ['rendered', 'normal-confirmed', 'dismissed']);
      assert.equal(f.context.state.classBenefits.journeyId, 'normal-fixture');
    }
    f.runTransitions(); assert.equal(f.calls.mainOpened, 1);
  });
}

test('normal startup rejected by its wrapper preserves the old state and keeps welcome open', async () => {
  const f = startupFixture({rejectNormalStart: true}), before = JSON.stringify(f.context.state), pending = f.start();
  f.resolve(); assert.equal(await pending, false); f.runTransitions();
  assert.deepEqual(f.calls.normalStart, [{character: 'aquaria', difficulty: 'normal'}]);
  assert.equal(JSON.stringify(f.context.state), before);
  assert.equal(f.calls.start.length, 0); assert.equal(f.calls.abort, 0);
  assert.equal(f.calls.render, 0); assert.equal(f.calls.save, 0);
  assert.equal(f.calls.dismiss, 0); assert.equal(f.calls.mainOpened, 0);
  assert.deepEqual(f.calls.order, []);
});
