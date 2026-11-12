const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

const game = readFileSync(resolve(__dirname, '../../js/game.js'), 'utf8');
const minigame = readFileSync(resolve(__dirname, '../../js/minigame.js'), 'utf8');

function section(source, start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, 'real navigation source must remain available');
  return source.slice(from, to);
}

function engine() {
  let now = 0, timerId = 0, owner = 'owner-a', epoch = 1;
  const timers = new Map(), listeners = new Map();
  const noop = () => {};
  function element() {
    const classes = new Set();
    return {
      inert: false, hidden: false,
      classList: { add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name) },
      setAttribute: noop, removeAttribute: noop, remove: noop,
      querySelectorAll: () => [], addEventListener: noop,
    };
  }
  const app = element(), panel = element(), left = element();
  const ui = Object.fromEntries(['nextBtn', 'question', 'options', 'feedback', 'refs', 'bonusBtn', 'oraculoBtn', 'dockNextBtn'].map(key => [key, element()]));
  let next;
  ui.nextBtn.addEventListener = (name, callback) => { if (name === 'click') next = callback; };
  ui.nextBtn.click = () => next.call(ui.nextBtn, { target: ui.nextBtn });
  const context = {
    ui, Date: { now: () => now },
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, due: now + delay }); return id; },
    clearTimeout: id => timers.delete(id),
    document: {
      readyState: 'complete', body: element(),
      getElementById: id => id === 'mainApp' ? app : id === 'nextBtn' ? ui.nextBtn : null,
      querySelector: selector => selector === '.panel.right' ? panel : selector === '.panel.left' ? left : null,
      addEventListener: (name, callback) => listeners.set(name, callback),
    },
    window: { resetMentorQuestion: noop, scrollY: 0, scrollTo: noop, addEventListener: noop,
      NQAnswers: { present: question => question } },
    _loadingNextQuestion: false, _questionRenderUnlockTimer: null,
    // Same owner/epoch/domain contract as the journey binding, without auth I/O.
    _captureJourneyBinding: () => ({ owner, epoch, domain: 'normal' }),
    _matchesJourneyBinding: binding => binding.owner === owner && binding.epoch === epoch && binding.domain === 'normal',
    _pilotRestoredQuestion: false, _normalJourneyStaging: false, _nextQuestionOrigin: null,
    _currentQuestionRevision: null, _currentQuestionRevisionOriginRaw: null,
    state: { gameStarted: true, idx: 0, answered: false, current: null, correctTotal: 0 }, refsDB: {},
    isProgressSandbox: () => false, isCharacterPilot: () => false,
    _questionRevisionVerifier: () => ({ current: () => null }),
    drawQuestion: () => ({ id: 'technical-' + (++context.state.idx), q: 'Technical fixture', o: ['A', 'B', 'C', 'D'], a: 0, r: [] }),
  };
  for (const name of ['flushPendingRating', 'renderRefs', 'setLumenEvidenceAvailable', '_renderOptions', '_applyEpicLifelines', '_updateSkipButton', 'updateBossUI', 'applyBossOptionBadges', '_renderCampaignQuestionRevisionNotice']) context[name] = noop;
  vm.createContext(context);
  vm.runInContext(section(game, '    function renderQuestion(){', '\n    function flagQuestion()'), context);
  vm.runInContext(section(minigame, "    ui.nextBtn.addEventListener('click'", '    // Event delegation'), context);
  vm.runInContext(section(game, '    (function initSwipe()', '    // ============ CRONÔMETRO'), context);
  context.renderQuestion();

  return {
    app, context,
    tick(delta) {
      const target = now + delta;
      while (true) {
        const entry = [...timers].filter(([, timer]) => timer.due <= target).sort((a, b) => a[1].due - b[1].due)[0];
        if (!entry) break;
        now = entry[1].due; timers.delete(entry[0]); entry[1].callback();
      }
      now = target;
    },
    answer() { context.state.answered = true; context.state.correctTotal++; ui.nextBtn.classList.remove('hidden'); },
    next: () => ui.nextBtn.click(),
    swipe() {
      listeners.get('touchstart')({ touches: [{ clientX: 200, clientY: 100 }] });
      listeners.get('touchend')({ changedTouches: [{ clientX: 100, clientY: 100 }] });
    },
    switchOwner: () => { owner = 'owner-b'; },
    switchJourney: () => { epoch++; },
    snapshot: () => ({ id: context.state.current.id, index: context.state.idx, answered: context.state.answered, correct: context.state.correctTotal }),
  };
}

test('a valid swipe advances one answered question exactly once', () => {
  const f = engine(); f.tick(400); f.answer(); f.swipe();
  f.tick(149);
  assert.equal(f.snapshot().index, 1);
  f.tick(1);
  assert.deepEqual(f.snapshot(), { id: 'technical-2', index: 2, answered: false, correct: 1 });
  f.tick(400);
  assert.equal(f.snapshot().index, 2);
});

test('a swipe from A cannot advance B after manual Next and another answer', () => {
  const f = engine(); f.tick(400); f.answer(); f.swipe();
  f.tick(20); f.next(); f.tick(30); f.answer();
  const answeredB = f.snapshot();
  assert.equal(answeredB.id, 'technical-2');
  f.tick(100);
  assert.deepEqual(f.snapshot(), answeredB);
});

for (const transition of ['switchOwner', 'switchJourney']) test(`a pending swipe retires after ${transition}`, () => {
  const f = engine(); f.tick(400); f.answer(); f.swipe();
  const before = f.snapshot(); f[transition](); f.tick(150);
  assert.deepEqual(f.snapshot(), before);
});

for (const surface of ['hidden', 'inert']) {
  for (const trigger of ['swipe', 'pointer']) test(`${trigger} cannot advance while the campaign is ${surface}`, () => {
    const f = engine(); f.tick(400); f.answer();
    if (trigger === 'swipe') f.swipe();
    const before = f.snapshot();
    if (surface === 'hidden') f.app.classList.add('hidden'); else f.app.inert = true;
    if (trigger === 'pointer') f.next(); else f.tick(150);
    assert.deepEqual(f.snapshot(), before);
  });
}
