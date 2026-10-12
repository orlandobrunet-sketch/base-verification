/* Optional character pilot: one local envelope, never a normal save or cloud payload. */
(function () {
  'use strict';
  const KEY = 'nefroquest-pilot-v1';
  const RULESET = 'class-boons-v1';
  const MODES = ['easy', 'normal', 'hard'];
  const CLASSES = ['nephros', 'aquaria', 'glomerulus'];
  const SAVE_KEYS = new Set(['nefroquest-save', 'nefroquest-save-v7']);
  const PROGRESS_KEYS = new Set([
    'nefroquest-stats', 'nefroquest-detailed-stats', 'nefroquest-mastered',
    'nefroquest-all-answered-qids', 'nefroquest-sr-data', 'nefroquest-achievements',
    'nefroquest-announced-badges', 'nefroquest-badge-history', 'nefroquest-journey-count',
    'nefroquest-arqui-defeated', 'nefroquest-hardcore-completed',
    'nefroquest-gold-milestone-shown', 'nefroquest_total_accumulated_knowledge',
    'nq-unlocked-refs', 'unlockedArticles', 'nq-acidbase-progress',
    'nefroquest-study-state', 'nefroquest-exam-state', 'nq_last_study',
    'nefroquest-minigame-notified', 'nefroquest-error-reasons', 'nefroquest-comp-stats',
    'nefroquest-minigame-best', 'nefroquest-recommended-difficulty', 'nefroquest-ritual-done'
  ]);
  const storage = window.localStorage;
  const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const ownerId = value => value == null ? null : String(value);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const integer = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
  let active = false, writable = false, owner = null, envelope = null, baseline = null;
  let generation = 0, status = 'normal', error = null, lease = false, unlock = null;
  let pendingLock = null, reservedDifficulty = null, transaction = null;
  const listeners = new Set();

  function identity() {
    if (typeof authUser !== 'undefined') return ownerId(authUser?.id);
    if ('authUser' in window) return ownerId(window.authUser?.id);
    return owner;
  }
  function captureBinding() {
    return Object.freeze({domain: active ? 'pilot' : 'normal',
      journeyId: active ? envelope?.journeyId || null : null,
      owner: active ? owner : identity(), generation});
  }
  function matchesBinding(binding) {
    if (!binding) return false;
    const current = captureBinding();
    return binding.domain === current.domain && binding.journeyId === current.journeyId &&
      binding.owner === current.owner && binding.generation === current.generation;
  }
  function notify() {
    const context = Object.freeze({...captureBinding(), status, error});
    for (const callback of listeners) {
      try { callback(context); } catch (_) { /* A view cannot change persistence authority. */ }
    }
  }
  function pause(reason) {
    writable = false;
    status = active ? 'paused' : 'normal';
    error = reason;
    generation++;
    notify();
    return false;
  }
  function release() {
    pendingLock = null;
    if (unlock) unlock();
    unlock = null; lease = false;
    active = writable = false;
    owner = null; envelope = baseline = transaction = reservedDifficulty = null;
    status = 'normal'; error = null;
    generation++;
    notify();
  }
  async function acquire() {
    const locks = window.navigator?.locks;
    if (!locks || typeof locks.request !== 'function') {
      error = 'Este navegador não oferece a proteção necessária entre abas.';
      return false;
    }
    const token = {};
    pendingLock = token;
    return new Promise(resolve => {
      try {
        Promise.resolve(locks.request(KEY, {mode: 'exclusive', ifAvailable: true}, async lock => {
          if (!lock || pendingLock !== token) {
            if (pendingLock === token) pendingLock = null;
            resolve(false); return;
          }
          pendingLock = null;
          lease = true;
          const held = new Promise(done => { unlock = done; });
          resolve(true);
          await held;
        })).catch(() => {
          if (pendingLock === token) pendingLock = null;
          resolve(false);
        });
      } catch (_) { pendingLock = null; resolve(false); }
    });
  }
  function validLedger(ledger, journeyId, character) {
    if (!object(ledger) || ledger.version !== 1 || ledger.ruleset !== RULESET ||
        ledger.journeyId !== journeyId || ledger.lockedClass !== character ||
        !CLASSES.includes(character) || !integer(ledger.windowAnswers, 20) ||
        !integer(ledger.xpGranted, 20) || !integer(ledger.goldGranted, 40) ||
        typeof ledger.shieldSpent !== 'boolean' || !Array.isArray(ledger.seenQids) ||
        !Array.isArray(ledger.creditedEvents) || ledger.creditedEvents.length !== ledger.windowAnswers) return false;
    const seen = [];
    for (let index = 0; index < ledger.creditedEvents.length; index++) {
      const event = ledger.creditedEvents[index];
      const prefix = `${journeyId}:${index + 1}:`;
      if (typeof event !== 'string' || !event.startsWith(prefix)) return false;
      const qid = event.slice(prefix.length);
      if (qid && !seen.includes(qid)) seen.push(qid);
    }
    if (JSON.stringify(seen) !== JSON.stringify(ledger.seenQids) ||
        ledger.xpGranted > seen.length || ledger.goldGranted > seen.length * 2 || ledger.goldGranted % 2) return false;
    if (character !== 'nephros' && ledger.xpGranted !== 0) return false;
    if (character !== 'glomerulus' && ledger.goldGranted !== 0) return false;
    if (character !== 'aquaria' && ledger.shieldSpent) return false;
    return !ledger.shieldSpent || seen.length > 0;
  }
  function validRecord(record) {
    if (!object(record) || record.schemaVersion !== 8 || record.domain !== 'pilot' ||
        record.ruleset !== RULESET || typeof record.journeyId !== 'string' || !record.journeyId ||
        !(record.owner === null || typeof record.owner === 'string') ||
        !integer(record.revision, Number.MAX_SAFE_INTEGER - 1) || record.revision < 1 ||
        !object(record.save) || record.save.schemaVersion !== 8 || record.save.journeyDomain !== 'pilot' ||
        !MODES.includes(record.save.difficulty) || !CLASSES.includes(record.save.character) ||
        !validLedger(record.classBenefits, record.journeyId, record.save.character) ||
        JSON.stringify(record.save.classBenefits) !== JSON.stringify(record.classBenefits) ||
        !object(record.progress)) return false;
    return Object.entries(record.progress).every(([key, value]) => PROGRESS_KEYS.has(key) && typeof value === 'string');
  }
  function parse(raw) {
    try { const result = JSON.parse(raw); return validRecord(result) ? result : null; }
    catch (_) { return null; }
  }
  function closed(save) {
    return !!(save.gameOver || save.gameCompleted || save.completedGame ||
      (save.gameStarted && save.lives === 0));
  }
  function restoredSave(save) {
    const result = copy(save);
    // A crash between the atomic fatal answer and its final screen cannot revive it.
    if (closed(result)) result.gameOver = true;
    return result;
  }
  function peek(requestedOwner) {
    try {
      const raw = storage.getItem(KEY);
      if (raw === null) return {exists: false, valid: false};
      const record = parse(raw);
      const valid = !!record && record.owner === ownerId(requestedOwner);
      return {exists: true, valid, character: valid ? record.save.character : null,
        difficulty: valid ? record.save.difficulty : null,
        started: valid ? record.save.gameStarted === true : false,
        resumable: valid && record.save.gameStarted === true && !closed(record.save),
        closed: valid ? closed(record.save) : false,
        error: valid ? null : 'O registro do piloto é inválido ou pertence a outro usuário.'};
    } catch (_) { return {exists: true, valid: false, error: 'Não foi possível ler o piloto salvo.'}; }
  }
  function peekProgress(key, requestedOwner) {
    if (!PROGRESS_KEYS.has(String(key))) return null;
    try {
      const record = parse(storage.getItem(KEY));
      return record?.owner === ownerId(requestedOwner) ? record.progress[String(key)] ?? null : null;
    } catch (_) { return null; }
  }
  function guard() {
    if (!active || !writable || !lease) return false;
    if (identity() !== owner) return pause('O usuário da jornada mudou.');
    try {
      if (storage.getItem(KEY) !== baseline) return pause('O piloto mudou em outra aba.');
    } catch (_) { return pause('Não foi possível conferir o piloto salvo.'); }
    return true;
  }
  async function reserve(difficulty, requestedOwner) {
    if (active || pendingLock || !MODES.includes(difficulty)) return false;
    error = null;
    if (!await acquire()) { error ||= 'O piloto está aberto em outra aba.'; return false; }
    try { baseline = storage.getItem(KEY); }
    catch (_) { release(); error = 'Não foi possível ler o armazenamento.'; return false; }
    owner = ownerId(requestedOwner);
    if (identity() !== owner) { release(); error = 'O usuário da jornada mudou.'; return false; }
    envelope = null; reservedDifficulty = difficulty;
    active = writable = true; status = 'reserved'; generation++;
    notify();
    return true;
  }
  function ledgerFor(journeyId, character) {
    return {version: 1, journeyId, lockedClass: character, ruleset: RULESET,
      windowAnswers: 0, seenQids: [], creditedEvents: [], xpGranted: 0, goldGranted: 0, shieldSpent: false};
  }
  function write(record) {
    if (!guard() || !validRecord(record)) return false;
    let raw;
    try {
      raw = JSON.stringify(record);
      storage.setItem(KEY, raw);
      if (storage.getItem(KEY) !== raw) return pause('Não foi possível confirmar a gravação do piloto.');
    } catch (_) { return pause('Não foi possível gravar o piloto.'); }
    envelope = record; baseline = raw;
    return true;
  }
  function start(character, difficulty, requestedOwner) {
    if (!guard() || status !== 'reserved' || !CLASSES.includes(character) ||
        difficulty !== reservedDifficulty || ownerId(requestedOwner) !== owner) return false;
    const journeyId = window.crypto?.randomUUID?.() || `pilot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ledger = ledgerFor(journeyId, character);
    const previous = parse(baseline);
    const progress = previous?.owner === owner ? copy(previous.progress) : {};
    delete progress['nefroquest-announced-badges'];
    const journeyCount = Number(progress['nefroquest-journey-count'] || 0);
    if (!integer(journeyCount, Number.MAX_SAFE_INTEGER - 1)) return false;
    progress['nefroquest-journey-count'] = String(journeyCount + 1);
    const save = {schemaVersion: 8, journeyDomain: 'pilot', character, difficulty,
      gameStarted: false, gameOver: false, classBenefits: copy(ledger)};
    const record = {schemaVersion: 8, domain: 'pilot', ruleset: RULESET, journeyId, owner,
      revision: (previous?.revision || 0) + 1, save, classBenefits: ledger,
      progress,
      createdAt: Date.now(), updatedAt: Date.now()};
    if (!write(record)) return false;
    reservedDifficulty = null; status = 'active'; generation++;
    notify();
    return true;
  }
  async function resume(requestedOwner) {
    if (active || pendingLock) return null;
    if (!await acquire()) { error = 'O piloto está aberto em outra aba.'; return null; }
    let raw, record;
    try { raw = storage.getItem(KEY); record = parse(raw); }
    catch (_) { release(); error = 'Não foi possível ler o piloto salvo.'; return null; }
    if (!record || record.owner !== ownerId(requestedOwner)) {
      release(); error = 'O registro do piloto é inválido ou pertence a outro usuário.'; return null;
    }
    if (record.save.gameStarted !== true) {
      release(); error = 'O início deste piloto não foi concluído. Comece uma nova jornada.'; return null;
    }
    owner = record.owner;
    if (identity() !== owner) { release(); error = 'O usuário da jornada mudou.'; return null; }
    baseline = raw; envelope = record;
    active = writable = true; status = 'active'; error = null; generation++;
    notify();
    return restoredSave(record.save);
  }
  function validTransition(next, save, answering) {
    const prior = envelope?.classBenefits;
    if (!prior || !validLedger(next, envelope.journeyId, prior.lockedClass)) return false;
    if (!answering) return JSON.stringify(next) === JSON.stringify(prior);
    const increment = next.windowAnswers - prior.windowAnswers;
    if (increment < 0 || increment > 1 || next.xpGranted < prior.xpGranted ||
        next.goldGranted < prior.goldGranted || (prior.shieldSpent && !next.shieldSpent) ||
        next.xpGranted - prior.xpGranted > 1 || next.goldGranted - prior.goldGranted > 2 ||
        JSON.stringify(next.creditedEvents.slice(0, prior.windowAnswers)) !== JSON.stringify(prior.creditedEvents)) return false;
    const extraXP = next.xpGranted - prior.xpGranted;
    const extraGold = next.goldGranted - prior.goldGranted;
    const shield = next.shieldSpent && !prior.shieldSpent;
    if (!increment && (extraXP || extraGold || shield)) return false;
    if (increment && next.seenQids.length === prior.seenQids.length && (extraXP || extraGold || shield)) return false;
    if (extraXP || extraGold || shield) {
      const result = save.pilotLastAnswer;
      if (!object(result) || result.domain !== 'pilot' || result.journeyId !== envelope.journeyId ||
          Number(result.xp || 0) !== extraXP || Number(result.gold || 0) !== extraGold || !!result.shield !== shield ||
          ((extraXP || extraGold) && result.correct !== true) || (shield && result.correct !== false)) return false;
    }
    return true;
  }
  function payload(save, ledger, progress) {
    const result = copy(save);
    result.schemaVersion = 8; result.journeyDomain = 'pilot'; result.classBenefits = copy(ledger);
    if (result.character !== envelope.save.character || result.difficulty !== envelope.save.difficulty) return null;
    return {...copy(envelope), revision: envelope.revision + 1, save: result,
      classBenefits: copy(ledger), progress: copy(progress), updatedAt: Date.now()};
  }
  function beginTransaction() {
    if (!guard() || !envelope || transaction) return false;
    transaction = {progress: copy(envelope.progress), callbacks: []};
    return true;
  }
  function commit(save, ledger) {
    if (!transaction || !guard() || !object(save) || !validTransition(ledger, save, true)) return false;
    const record = payload(save, ledger, transaction.progress);
    if (!record || !write(record)) return false;
    const callbacks = transaction.callbacks;
    transaction = null;
    for (const pending of callbacks) {
      if (!matchesBinding(pending.binding)) continue;
      try { pending.callback(); } catch (_) {}
    }
    return true;
  }
  function rollback() { transaction = null; }
  function save(saveValue, ledger) {
    if (!guard() || !envelope || transaction || !object(saveValue) ||
        !validTransition(ledger, saveValue, false)) return false;
    const record = payload(saveValue, ledger, envelope.progress);
    return !!record && write(record);
  }
  function load() { return guard() && envelope ? restoredSave(envelope.save) : null; }
  function reset() {
    if (!guard()) return false;
    try {
      storage.removeItem(KEY);
      if (storage.getItem(KEY) !== null) return pause('Não foi possível apagar o piloto.');
    } catch (_) { return pause('Não foi possível apagar o piloto.'); }
    release();
    return true;
  }
  function progressStorage(binding) {
    const captured = binding || captureBinding();
    function current() {
      if (!matchesBinding(captured)) throw new Error('A jornada desta ação mudou.');
      if (captured.domain === 'pilot' && (!guard() || !envelope))
        throw new Error(error || 'O piloto não pode gravar agora.');
    }
    return Object.freeze({
      getItem(key) {
        current(); key = String(key);
        if (captured.domain === 'normal') return storage.getItem(key);
        if (SAVE_KEYS.has(key)) return JSON.stringify(envelope.save);
        if (!PROGRESS_KEYS.has(key)) return storage.getItem(key);
        return (transaction?.progress || envelope.progress)[key] ?? null;
      },
      setItem(key, value) {
        current(); key = String(key); value = String(value);
        if (captured.domain === 'normal' || (!PROGRESS_KEYS.has(key) && !SAVE_KEYS.has(key))) {
          storage.setItem(key, value); return;
        }
        if (SAVE_KEYS.has(key)) throw new Error('Use o envelope do piloto para gravar a jornada.');
        if (transaction) { transaction.progress[key] = value; return; }
        const record = {...copy(envelope), revision: envelope.revision + 1, updatedAt: Date.now()};
        record.progress[key] = value;
        if (!write(record)) throw new Error(error || 'A gravação do piloto falhou.');
      },
      removeItem(key) {
        current(); key = String(key);
        if (captured.domain === 'normal' || (!PROGRESS_KEYS.has(key) && !SAVE_KEYS.has(key))) {
          storage.removeItem(key); return;
        }
        if (SAVE_KEYS.has(key)) throw new Error('Use reset para apagar apenas a jornada piloto.');
        if (transaction) { delete transaction.progress[key]; return; }
        const record = {...copy(envelope), revision: envelope.revision + 1, updatedAt: Date.now()};
        delete record.progress[key];
        if (!write(record)) throw new Error(error || 'A gravação do piloto falhou.');
      }
    });
  }
  const api = {
    KEY, RULESET, reserve, start, resume, release, reset, peek, peekProgress, load, save,
    beginTransaction, commit, rollback, abort: rollback, captureBinding, matchesBinding,
    onContextChange(callback) { listeners.add(callback); return () => listeners.delete(callback); },
    afterCommit(callback) {
      if (typeof callback !== 'function') return;
      if (transaction) transaction.callbacks.push({callback, binding: captureBinding()});
      else callback();
    },
    get active() { return active; }, get writable() { return writable; },
    get owner() { return owner; }, get journeyId() { return envelope?.journeyId || null; },
    get classBenefits() { return copy(envelope?.classBenefits || null); },
    get status() { return status; }, get error() { return error; }
  };
  window.NQPilot = Object.freeze(api);
  window.nqProgressStorage = progressStorage;
  window.addEventListener('storage', event => {
    if (!active || event.storageArea !== storage || (event.key !== KEY && event.key !== null)) return;
    guard();
  });
})();
