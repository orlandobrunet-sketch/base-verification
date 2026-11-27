'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const libraryCatalog = require('../../js/library-catalog.js');
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
      this.classList = {add() {}, remove() {}};
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
    removeAttribute() {}
    focus() { ctx.document.activeElement = this; }
    remove() { this.isConnected = false; if (nodes.get(this.id) === this) nodes.delete(this.id);
      if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this);
      if (this.contains(ctx.document.activeElement)) ctx.document.activeElement = body; }
  }
  const body = new Node('body'), main = new Node('mainApp', body);
  class Observer { observe() { this.connected = true; } disconnect() { this.connected = false; } }
  const progress = () => ({domain: pilot ? 'pilot' : 'normal', journeyId: pilot ? journeyId : null, owner, generation});
  const ctx = {console, Object, Math, WeakMap, WeakSet, Set, NQLibraryCatalog: libraryCatalog, nefroArticles: [],
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
    playSound() {}, nqDialogo() {}, _toast() {}, claimChestReward() { claims++; },
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
  vm.runInContext(section('    const _LIFE_BONUS_ITEMS =', '    const _LEG_LABELS ='), ctx);
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

// A fresh VM models a new document; storage alone survives.
// Real pilot commit/resume and production reward scheduling are used. DOM is a stub.
test('committed earned chest remains deliverable after a fresh document resumes the save', async () => {
  const values = new Map();
  function page() {
    const f = fixture();
    Object.assign(f.ctx, {authUser: null, crypto: require('node:crypto').webcrypto,
      localStorage: {getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)},
      navigator: {locks: {request: async (_name, _options, callback) => callback({})}}});
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/answer-presentation.js'), 'utf8'), f.ctx);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/pilot.js'), 'utf8'), f.ctx);
    return f;
  }
  const before = page(), p = before.ctx.NQPilot;
  assert.equal(await p.reserve('normal', null), true);
  assert.equal(p.start('nephros', 'normal', null), true);
  const initial = p.load();
  Object.assign(initial, {gameStarted:true,lives:4,maxLives:4,level:1,xp:0,gold:0,score:0,
    answered:false,queueIds:['technical-q1'],chestCorrectCount:4,chestTarget:5});
  assert.equal(p.save(initial,p.classBenefits),true);
  assert.equal(p.beginTransaction(),true);
  before.ctx._pilotAnswerTransaction = {normal:false};
  const staged = p.load();
  Object.assign(before.ctx.state, staged);
  before.eval(section('        state.chestCorrectCount = (state.chestCorrectCount || 0) + 1;', '\n        const sm'));
  const ledger = p.classBenefits;
  ledger.windowAnswers=1;ledger.seenQids.push('technical-q1');
  ledger.creditedEvents.push(`${ledger.journeyId}:1:technical-q1`);
  Object.assign(staged,{chestCorrectCount:before.ctx.state.chestCorrectCount,chestTarget:before.ctx.state.chestTarget,
    classBenefits:ledger,pilotLastAnswer:{domain:'pilot',journeyId:ledger.journeyId,correct:true,xp:0,gold:0,shield:false}});
  assert.equal(p.commit(staged,ledger),true);
  assert.equal(before.eval('_pendingChestRewards.length'),1,'Control: accepted real commit queued earned opportunity');
  assert.equal(p.load().chestCorrectCount,0,'Committed counter reset');
  const committed=values.get(p.KEY);
  p.release();
  const after=page();
  assert.ok(await after.ctx.NQPilot.resume(null));
  const recovered=after.ctx.NQPilot.load();
  Object.assign(after.ctx.state,recovered);
  assert.equal(recovered.chestCorrectCount,0);
  assert.equal(values.get(p.KEY),committed,'Resume did not replace the committed payload');
  after.flush();after.advance(2000);
  // The committed opportunity survives loss of the old document.
  assert.equal(after.eval('_pendingChestRewards.length'),1,'Earned opportunity was lost across fresh-document resume');
  assert.ok(after.popup());
});

async function durablePage(values, resume=false) {
  const f=fixture();
  Object.assign(f.ctx,{authUser:null,crypto:require('node:crypto').webcrypto,
    localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)},
    navigator:{locks:{request:async(n,o,fn)=>fn({})}},
    _toast(){},renderHUD(){},updateBadges(){},showChestModal(){},showForgePopup(){},
    _markObtained(n){f.ctx.state.obtainedItems.push(n);},
    _matchesJourneyBinding:()=>true,
    _itemSellVal:()=>20,nefroArticles:[{titulo:'Technical article'}],unlockedArticles:[]});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../../js/pilot.js'),'utf8'),f.ctx);
  const p=f.ctx.NQPilot;
  if(resume)assert.ok(await p.resume(null));
  else {assert.equal(await p.reserve('normal',null),true);assert.equal(p.start('nephros','normal',null),true);}
  const save=p.load();
  if(!resume)Object.assign(save,{gameStarted:true,gameOver:false,lives:4,level:1,gold:0,score:0,chestsOpened:0,obtainedItems:[],equipment:{relic:{n:'Vazio'},weapon:{n:'Old'}},queue:[],correctTotal:5});
  assert.equal(p.save(save,p.classBenefits),true);
  Object.assign(f.ctx.state,save);f.ctx._stateData=f.ctx.state;
  f.ctx._pilotSavePayload=()=>JSON.parse(JSON.stringify(f.ctx.state));
  f.ctx.unlockedArticles=JSON.parse(f.ctx.nqProgressStorage().getItem('unlockedArticles')||'[]');
  return f;
}
test('real game durable article claim credits once, including article unlocked by another source',async()=>{
  const values=new Map();let f=await durablePage(values),p=f.ctx.NQPilot;
  p.beginTransaction();const receipt=p.stageChest();
  p.updateChest(receipt.id,r=>{r.phase='prepared';r.reward={kind:'article',articleIndex:0};});
  assert.equal(p.commit(f.ctx.state,p.classBenefits),true);
  f.ctx.nqProgressStorage().setItem('unlockedArticles','[0]');f.ctx.unlockedArticles=[0];
  f.flush();f.advance(1);
  assert.equal(f.eval('_claimDurableChest(_pendingChestRewards[0])'),true);
  assert.equal(p.load().score,40);assert.equal(p.load().chestsOpened,1);
  assert.equal(f.ctx.nqProgressStorage().getItem('nefroquest_total_accumulated_knowledge'),'1');
  assert.equal(f.ctx.nqProgressStorage().getItem('unlockedArticles'),'[0]');
  p.release();f=await durablePage(values,true);f.flush();f.advance(2000);
  assert.equal(f.eval('_pendingChestRewards.length'),0);assert.equal(f.ctx.NQPilot.load().score,40);
  f.ctx.NQPilot.release();
});
for(const choice of ['equip','sell'])test('real game durable equipment '+choice+' commits choice once',async()=>{
  const values=new Map(),f=await durablePage(values),p=f.ctx.NQPilot;
  p.beginTransaction();const receipt=p.stageChest();p.updateChest(receipt.id,r=>{r.phase='prepared';r.reward={kind:'equipment',slot:'weapon',item:{n:'New',rar:'common',atk:1,def:0,kno:0,luck:0}};});
  p.commit(f.ctx.state,p.classBenefits);
  f.ctx.showEquipComparePopup=(slot,old,item,equip,sell)=>{f.decide=choice==='equip'?equip:sell;};
  f.flush();f.advance(1);f.eval('_claimDurableChest(_pendingChestRewards[0])');
  assert.equal(p.load().score,0,'presentation must not grant credit');
  f.decide();f.decide();
  assert.equal(p.load().score,20);assert.equal(p.load().gold,20);
  assert.equal(p.load().equipment.weapon.n,choice==='equip'?'New':'Old');
  assert.equal(p.chestReceipts()[0].phase,'consumed');p.release();
});

test('durable equipment keeps the first Égide life bonus after a document reload', async () => {
  const values = new Map();
  let f = await durablePage(values);
  let pilot = f.ctx.NQPilot;
  try {
    Object.assign(f.ctx.state, {lives: 4, maxLives: 4});
    assert.equal(pilot.beginTransaction(), true);
    const receipt = pilot.stageChest();
    pilot.updateChest(receipt.id, pending => {
      pending.phase = 'prepared';
      pending.reward = {kind: 'equipment', slot: 'relic',
        item: {n: 'Égide Dialítica', rar: 'legendary', atk: 0, def: 1, kno: 0, luck: 0}};
    });
    assert.equal(pilot.commit(f.ctx.state, pilot.classBenefits), true);
    f.flush(); f.advance(1); f.click(); f.advance(1150);
    assert.equal(pilot.chestReceipts()[0].phase, 'consumed');
    assert.equal(pilot.load().lives, 5);
    assert.equal(pilot.load().maxLives, 4);
    assert.equal(pilot.load().legendaryAbilityUsed['egide-first-life-v1'], true);
    pilot.release();
    f = await durablePage(values, true);
    pilot = f.ctx.NQPilot;
    assert.equal(f.ctx.state.lives, 5);
    assert.equal(f.ctx.effectiveMaxLives(), 5);
    f.flush(); f.advance(2000);
    assert.equal(f.popup(), undefined);
  } finally { pilot.release(); }
});

test('a disappearing catalog leaves the durable receipt unchanged until the player can retry', async () => {
  const f = await durablePage(new Map());
  const pilot = f.ctx.NQPilot;
  try {
    assert.equal(pilot.beginTransaction(), true);
    const receipt = pilot.stageChest();
    pilot.updateChest(receipt.id, pending => {
      pending.phase = 'prepared';
      pending.reward = {kind: 'article', articleIndex: 0};
    });
    assert.equal(pilot.commit(f.ctx.state, pilot.classBenefits), true);
    const prepared = JSON.stringify(pilot.chestReceipts());
    f.flush(); f.advance(1); f.click();
    f.ctx.NQLibraryCatalog = undefined;
    f.advance(1150);
    assert.equal(JSON.stringify(pilot.chestReceipts()), prepared);
    assert.equal(pilot.load().score, 0);
    assert.equal(f.popup(), undefined);
    assert.equal(f.claims(), 0);
    f.ctx.NQLibraryCatalog = libraryCatalog;
    f.flush(); f.click(); f.advance(1150);
    assert.equal(pilot.chestReceipts()[0].phase, 'consumed');
    assert.equal(pilot.load().score, 40);
  } finally { pilot.release(); }
});

test('real game normal authority resumes a prepared article before the lazy catalog is loaded',async()=>{
  const {create}=require('../../js/normal-authority.js'),{createAuthority}=require('../../isolated-authority/owner-authority.cjs');
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const locks={request:async(n,o,fn)=>fn({})};
  const save={schemaVersion:7,saveOwner:null,journeyId:'normal-j',character:'nephros',gameStarted:true,gameOver:false,score:0,gold:0,chestsOpened:0,equipment:{relic:{n:'Vazio'}},obtainedItems:[]};
  const make=()=>create({createAuthority,storage,locks,owner:null,currentOwner:()=>null,validateSave:s=>s.character==='nephros',newJourneyId:()=> 'normal-j'});
  const before=make();await before.bootstrap({newSave:save});before.beginTransaction();
  const receipt=before.stageChest();before.updateChest(receipt.id,r=>{r.phase='prepared';r.reward={kind:'article',articleIndex:0};});
  before.commit(save);await before.release();
  const f=fixture();Object.assign(f.ctx,{isCharacterPilot:()=>false,NQ_DURABLE_PROGRESS:true,
    NQNormalAuthority:{create:options=>create({...options,createAuthority})},localStorage:storage,navigator:{locks},_authSessionEpoch:1,
    _reloadJourneyCollections(){},renderHUD(){},updateBadges(){},showChestModal(){},unlockedArticles:[]});
  delete f.ctx.nefroArticles;
  f.eval(section('    let _normalAuthorityOpening =', '    function loadGame()'));
  assert.equal(await f.ctx._ensureNormalAuthority(),true,'a saved receipt must not require an already loaded catalog');
  const store=f.ctx.NQNormalProgress;
  try {
    Object.assign(f.ctx.state,store.loadSave());f.ctx._stateData=f.ctx.state;
    f.ctx.nqProgressStorage=()=>store.storage;
    f.ctx._doSaveGame=()=>{store.commit(f.ctx.state);return true;};
    f.flush();f.advance(1);assert.equal(f.eval('_pendingChestRewards.length'),1);
    assert.equal(f.popup(),undefined);
    assert.equal(store.chestReceipts()[0].phase,'prepared');
    f.ctx.nefroArticles=[{titulo:'Technical article'}];
    f.flush();f.click();f.advance(1150);
    assert.equal(store.loadSave().score,40);
    assert.equal(store.storage.getItem('nefroquest_total_accumulated_knowledge'),'1');
    assert.equal(store.chestReceipts()[0].phase,'consumed');
  } finally { await store.release(); }
});

for (const difficulty of ['normal', 'hardcore']) {
  test(`a migrated ${difficulty} journey closes and resumes by bonus without losing its pending chest`, async () => {
    const {create} = require('../../js/normal-authority.js');
    const {createAuthority} = require('../../js/owner-authority.js');
    const owner = 'technical-end-owner';
    const legacy = {schemaVersion: 7, saveOwner: owner, character: 'nephros', difficulty,
      gameStarted: true, gameOver: false, level: 4, lives: 1, maxLives: 1, gold: 2000,
      score: 620, correctTotal: 6, bonusUses: 0, equipment: {relic: {n: 'Vazio'}}};
    const raw = JSON.stringify(legacy);
    const sources = [['nefroquest-save-v7', raw], ['nefroquest-save', raw],
      ['unlockedArticles', '[0]'], ['nefroquest_total_accumulated_knowledge', '3']];
    const values = new Map(sources);
    const storage = {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key)};
    const locks = {request: async (_name, _options, run) => run({})};
    const make = () => create({createAuthority, storage, locks, owner, currentOwner: () => owner,
      validateSave: save => save.character === 'nephros', newJourneyId: () => 'technical-end-journey'});
    const store = make();
    try {
      await store.bootstrap();
      assert.ok(store.beginTransaction());
      const receipt = store.stageChest();
      assert.ok(store.commit({...store.loadSave(), lives: 0, correctTotal: 7}));

      const f = fixture();
      f.switch({pilot: false, owner});
      const state = Object.assign(f.ctx.state, store.loadSave(), {queue: [{id: 'technical-bonus'}]});
      let gamesPlayed = 0;
      let finishScreens = 0;
      let nextQuestion = 0;
      Object.assign(f.ctx, {authUser: {id: owner}, localStorage: storage, NQNormalProgress: store,
        crypto: require('node:crypto').webcrypto, characters: {nephros: {}},
        CANONICAL_SAVE_KEY: 'nefroquest-save-v7', SAVE_KEY: 'nefroquest-save', SAVE_SCHEMA_VERSION: 7, STATS_KEY: 'stats',
        unlockedArticles: [0], _stateData: state, _saveCleanupBlocked: false, _normalJourneyStaging: false,
        _saveTimer: null, _autoSaveTimer: null, _cloudSyncTimer: null, _cloudLoadSyncTimer: null,
        _jornadaJaContabilizada: false, _recentIds: [], _legacySaveBaseline: raw,
        _invalidateStatsCache() {}, _scheduleCloudSync() {}, _warnStorageFull() {},
        _questionSaveExtras: () => ({}), _pilotOrigin: () => ({domain: 'normal'}),
        _authDisplayName: () => 'Technical player', boardPush() {},
        isProgressSandbox: () => false, isBossBattle: () => false,
        nqProgressStorage: () => store.storage, getNormalGameStats: () => JSON.parse(storage.getItem('stats') || '{}'),
        updateGameStats() { gamesPlayed++; }, finishGameUI() { finishScreens++; state.gameOver = true; },
        log() {}, renderHUD() {}, updateBadges() {},
        renderQuestion() { nextQuestion++; assert.equal(f.ctx._doSaveGame(), true); },
      });
      f.eval(section('    function _writeSaveTombstone(', '    function _prepareProgressOwner('));
      f.eval(section('    const _hardcoreCorrect =', '    function getEntitlementQuestionsAnswered('));
      f.eval(section('    function saveGame()', '    function _migrateSave('));
      f.eval(section('    function deleteSave()', '    function clearLocalProgress('));
      f.eval(section('    function restoreGame(', '    // Auto-save via Proxy debounce'));
      f.eval(section('    function bonusCost()', '    // === POPUP DE CONFIRMAÇÃO MOBILE'));

      assert.doesNotThrow(() => f.ctx.finishGame());
      assert.equal(store.writable, true);
      assert.deepEqual(sources.map(([key]) => storage.getItem(key)), sources.map(([, value]) => value));
      assert.equal(store.loadSave().gameOver, true);
      assert.equal(store.loadSave().correctTotal, 7);
      assert.equal(f.ctx.restoreGame(store.loadSave()), false, 'the closed attempt is unavailable to ordinary resume');
      assert.equal(gamesPlayed, 1);
      assert.equal(finishScreens, 1);
      assert.deepEqual(store.chestReceipts(), [receipt]);
      if (difficulty === 'hardcore') assert.equal(f.ctx.getHardcoreBestCorrect(), 7);

      f.ctx.buyBonusQuestion();
      assert.equal(nextQuestion, 1);
      assert.equal(store.loadSave().journeyId, 'technical-end-journey');
      assert.equal(store.loadSave().lives, 1);
      assert.equal(store.loadSave().gold, 500);
      assert.equal(store.loadSave().bonusUses, 1);
      assert.equal(store.loadSave().gameOver, false);
      assert.deepEqual(store.chestReceipts(), [receipt]);
      assert.equal(gamesPlayed, 1);
      assert.deepEqual(sources.map(([key]) => storage.getItem(key)), sources.map(([, value]) => value));
      f.advance(1);
      assert.ok(f.popup(), 'the same pending chest returns to the campaign after the bonus is purchased');

      await store.release();
      const reopened = make();
      try {
        await reopened.bootstrap();
        assert.equal(reopened.loadSave().bonusUses, 1);
        assert.deepEqual(reopened.chestReceipts(), [receipt]);
      } finally { await reopened.release(); }
    } finally { await store.release(); }
  });
}

test('victory keeps exploration available and holds explicit closure until a pending reward is claimed', () => {
  const f = fixture();
  f.switch({pilot: false});
  Object.assign(f.ctx.state, {gameCompleted: true, correctTotal: 100});
  const reward = {id: 'victory-chest', phase: 'prepared'};
  let closes = 0, saves = 0, refreshes = 0;
  const warnings = [];
  Object.assign(f.ctx, {NQNormalProgress: {writable: true, chestReceipts: () => [reward]},
    _toast: message => warnings.push(message), _flushChestRewards() { refreshes++; },
    finishGame() { closes++; }, saveGame() { saves++; }, log() {}, renderHUD() {}});
  f.eval(section('    function finishGameCompletely()', '    // ============ SISTEMA DE VIDA EXTRA'));

  f.victory();
  f.ctx.finishGameCompletely();
  assert.equal(closes, 0);
  assert.equal(saves, 0);
  assert.equal(refreshes, 1);
  assert.match(warnings[0], /baú pendente/);
  assert.equal(reward.phase, 'prepared');

  f.victory();
  f.ctx.continueAfterCompletion();
  assert.equal(closes, 0);
  assert.equal(saves, 1);
  assert.equal(f.ctx.state.completedGame, true);
  assert.equal(f.ctx.state.gameOver, false);

  reward.phase = 'consumed';
  f.victory();
  f.ctx.finishGameCompletely();
  assert.equal(closes, 1);
});

test('paused durable receipt never falls back to legacy award callback',()=>{
  const f=fixture();f.eval("_queueChestReward(_captureChestRewardBinding(),0,{id:'durable-receipt'})");
  f.advance(1);assert.ok(f.popup());f.ctx.NQPilot.writable=false;f.click();f.advance(1200);
  assert.equal(f.claims(),0);assert.equal(f.eval('_pendingChestRewards.length'),1);
});
test('fresh-document resume wires durable scheduler after rendering campaign',()=>{
  const resume=section('    async function continueGame(', '    function startNewFromWelcome()');
  assert.ok(resume.lastIndexOf('_flushChestRewards()')>resume.lastIndexOf('renderQuestion()'));
});
test('completed pilot with an earned final chest remains resumable until consumed',async()=>{
  const values=new Map(),f=await durablePage(values),p=f.ctx.NQPilot;
  p.beginTransaction();p.stageChest();Object.assign(f.ctx.state,{gameCompleted:true,correctTotal:100});p.commit(f.ctx.state,p.classBenefits);p.release();
  assert.equal(p.peek(null).resumable,true);assert.equal(p.peek(null).pendingChests,1);
  assert.ok(await p.resume(null));assert.equal(p.load().gameOver,false);p.release();
});
test('starting a new pilot cannot silently discard earned pending chests',async()=>{
  const values=new Map(),f=await durablePage(values),p=f.ctx.NQPilot;
  p.beginTransaction();p.stageChest();p.commit(f.ctx.state,p.classBenefits);p.release();
  assert.equal(await p.reserve('normal',null),true);assert.equal(p.start('nephros','normal',null),false);
  assert.equal(p.start('nephros','normal',null,{discardPending:true}),true);assert.equal(p.chestReceipts().length,0);p.release();
});

test('legacy normal answer feedback does not require a character benefits ledger',()=>{const f=fixture();f.ctx.state.classBenefits=null;f.eval(section('    function _pilotAnswerFeedback(', '    let _pilotResumePending'));assert.equal(f.eval('_pilotAnswerFeedback({normal:true,xp:0,gold:0,shield:false})'),'');});
test('malformed prepared reward cannot grant legacy or durable credit',async()=>{
  const f=await durablePage(new Map()),p=f.ctx.NQPilot;p.beginTransaction();const receipt=p.stageChest();p.updateChest(receipt.id,r=>{r.phase='prepared';r.reward={};});p.commit(f.ctx.state,p.classBenefits);f.flush();f.advance(1);
  assert.equal(f.eval('_claimDurableChest(_pendingChestRewards[0])'),false);assert.equal(p.load().score,0);assert.equal(p.chestReceipts()[0].phase,'prepared');p.release();
});
