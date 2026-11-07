(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NQProgression = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_LEVEL = 10;
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const costForLevel = level => Math.floor(200 * Math.pow(1.15, Math.max(1, Math.floor(number(level, 1))) - 1));
  const levelCapForCorrect = correct => Math.min(MAX_LEVEL, 1 + Math.floor(Math.max(0, number(correct)) / 10));
  function snapshot(input) {
    const level = Math.max(1, Math.floor(number(input.level, 1)));
    const target = number(input.xpToNext);
    return { level, xp: Math.max(0, number(input.xp)), xpToNext: target > 0 ? target : costForLevel(level), correctTotal: Math.max(0, Math.floor(number(input.correctTotal))) };
  }
  function advance(input, gain = 0) {
    const state = snapshot(input), initialLevel = state.level;
    state.xp += Math.max(0, number(gain));
    const cap = levelCapForCorrect(state.correctTotal);
    while (state.level < cap && state.xp >= state.xpToNext) {
      state.xp -= state.xpToNext;
      state.level++;
      state.xpToNext = costForLevel(state.level);
    }
    // The remaining balance is a bank, including XP waiting for the correct-answer gate.
    // Older saves and levels above today's cap are preserved, never downgraded.
    return { ...state, levelsGained: state.level - initialLevel };
  }
  function view(input) {
    const state = snapshot(input), max = state.level >= MAX_LEVEL;
    const stageCorrect = Math.min(10, Math.max(0, state.correctTotal - (state.level - 1) * 10));
    const applied = max ? 0 : Math.min(state.xp, Math.floor(state.xpToNext * stageCorrect / 10));
    const fraction = max ? 1 : applied / state.xpToNext;
    return { ...state, max, applied, reserved: max ? state.xp : state.xp - applied, fraction,
      percent: Math.floor(fraction * 100), missingCorrect: max ? 0 : Math.max(0, state.level * 10 - state.correctTotal),
      missingXp: max ? 0 : Math.max(0, state.xpToNext - state.xp) };
  }
  function project(input) { const state = advance(input); return { ...view(state), levelsGained: state.levelsGained }; }
  function fromSave(input, lifeCap = Math.max(1, number(input.maxLives, 3))) {
    const projected = project({ ...input, xpToNext: costForLevel(input.level) });
    let lives = Math.max(0, number(input.lives, 3)), extraLifeGiven = !!input.extraLifeGiven, livesGained = 0;
    // Restore only earned milestone rewards; do not revive a defeated journey.
    if (lives > 0 && !input.gameOver) {
      for (let level = Math.max(1, Math.floor(number(input.level, 1))) + 1; level <= projected.level; level++) {
        extraLifeGiven = false;
        if (level % 5 === 0 && lives < lifeCap) { lives++; livesGained++; extraLifeGiven = true; }
      }
    }
    return { ...projected, lives, extraLifeGiven, livesGained };
  }
  return Object.freeze({ MAX_LEVEL, costForLevel, levelCapForCorrect, advance, view, project, fromSave });
});
