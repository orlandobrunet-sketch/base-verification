/* Pure normal-journey ledger. Eligibility, answers and persistence belong to the caller. */
(function () {
  'use strict';
  const RULESET = 'normal-character-initial-v1';
  const CLASSES = ['nephros', 'aquaria', 'glomerulus'];
  // These are structural identifiers, not an eligibility decision about Hardcore.
  const MODES = ['easy', 'normal', 'hard', 'hardcore'];
  const FIELDS = ['version', 'ruleset', 'journeyId', 'owner', 'difficulty', 'lockedClass',
    'windowAnswers', 'seenQids', 'creditedEvents', 'xpGranted', 'goldGranted', 'shieldSpent'];
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const integer = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
  const sameArray = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);

  function identity(context) {
    return object(context) && ['character', 'owner', 'difficulty'].every(key => own(context, key)) &&
      CLASSES.includes(context.character) && MODES.includes(context.difficulty) &&
      (context.owner === null || text(context.owner));
  }

  function create(context) {
    if (!identity(context) || !own(context, 'journeyId') || !text(context.journeyId)) {
      throw new TypeError('Explicit character, owner, difficulty and journeyId are required.');
    }
    return {version: 1, ruleset: RULESET, journeyId: context.journeyId,
      owner: context.owner, difficulty: context.difficulty, lockedClass: context.character,
      windowAnswers: 0, seenQids: [], creditedEvents: [], xpGranted: 0, goldGranted: 0, shieldSpent: false};
  }

  function snapshot(ledger, context) {
    if (!identity(context) || !object(ledger) || !FIELDS.every(key => own(ledger, key)) ||
        ledger.version !== 1 || ledger.ruleset !== RULESET || !text(ledger.journeyId) ||
        (own(context, 'journeyId') && ledger.journeyId !== context.journeyId) ||
        ledger.owner !== context.owner || ledger.difficulty !== context.difficulty ||
        ledger.lockedClass !== context.character || !integer(ledger.windowAnswers, 20) ||
        !integer(ledger.xpGranted, 20) || !integer(ledger.goldGranted, 40) ||
        typeof ledger.shieldSpent !== 'boolean' || !Array.isArray(ledger.seenQids) ||
        !Array.isArray(ledger.creditedEvents) || ledger.creditedEvents.length !== ledger.windowAnswers) return false;
    const seen = [];
    for (let index = 0; index < ledger.creditedEvents.length; index++) {
      const event = ledger.creditedEvents[index];
      const prefix = ledger.journeyId + ':' + (index + 1) + ':';
      if (typeof event !== 'string' || !event.startsWith(prefix)) return false;
      const qid = event.slice(prefix.length);
      if (!text(qid)) return false;
      if (!seen.includes(qid)) seen.push(qid);
    }
    // Repeated answers have distinct ordinal events but only one seen QID.
    if (!sameArray(seen, ledger.seenQids) || ledger.xpGranted > seen.length ||
        ledger.goldGranted > seen.length * 2 || ledger.goldGranted % 2 !== 0) return false;
    if (ledger.lockedClass !== 'nephros' && ledger.xpGranted !== 0) return false;
    if (ledger.lockedClass !== 'glomerulus' && ledger.goldGranted !== 0) return false;
    if (ledger.lockedClass !== 'aquaria' && ledger.shieldSpent) return false;
    return !ledger.shieldSpent || seen.length > 0;
  }

  function transition(previous, next) {
    if (previous.journeyId !== next.journeyId) return false;
    const increment = next.windowAnswers - previous.windowAnswers;
    const xp = next.xpGranted - previous.xpGranted;
    const gold = next.goldGranted - previous.goldGranted;
    const shield = !previous.shieldSpent && next.shieldSpent;
    if (increment < 0 || increment > 1 || xp < 0 || xp > 1 || gold < 0 || gold > 2 ||
        (previous.shieldSpent && !next.shieldSpent) ||
        !sameArray(previous.creditedEvents, next.creditedEvents.slice(0, previous.windowAnswers))) return false;
    if (increment === 0) {
      return xp === 0 && gold === 0 && !shield && sameArray(previous.seenQids, next.seenQids);
    }
    const prefix = next.journeyId + ':' + next.windowAnswers + ':';
    const qid = next.creditedEvents[next.windowAnswers - 1].slice(prefix.length);
    if (previous.seenQids.includes(qid) && (xp !== 0 || gold !== 0 || shield)) return false;
    // Zero credit is valid: outcome and actual retained XP are checked by the caller.
    return true;
  }

  // Optional journeyId binds a restore; an own previous property requests a transition check.
  // Neither form validates the answer outcome or decides mode eligibility.
  function valid(ledger, context) {
    try {
      if (!snapshot(ledger, context)) return false;
      if (!own(context, 'previous')) return true;
      return snapshot(context.previous, context) && transition(context.previous, ledger);
    } catch (_) { return false; }
  }

  window.NQCharacterBenefits = Object.freeze({RULESET, create, valid});
})();
