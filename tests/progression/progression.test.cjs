const { test } = require('node:test');
const assert = require('node:assert/strict');
const p = require('../../js/progression.js');
const spent = level => Array.from({ length: Math.min(level - 1, 9) }, (_, i) => p.costForLevel(i + 1)).reduce((sum, cost) => sum + cost, 0);

test('costs and correct-answer milestones retain the existing campaign rules', () => {
  assert.deepEqual(Array.from({ length: 10 }, (_, i) => p.costForLevel(i + 1)), [200, 229, 264, 304, 349, 402, 462, 532, 611, 703]);
  assert.deepEqual([0, 9, 10, 19, 20, 89, 90, 100].map(p.levelCapForCorrect), [1, 1, 2, 2, 3, 9, 10, 10]);
});
test('every awarded XP is either spent on an earned level or retained, including at the cap', () => {
  for (let level = 1; level <= 10; level++) for (let correctTotal = 0; correctTotal <= 100; correctTotal++) {
    for (const xp of [0, p.costForLevel(level) - 1, p.costForLevel(level), 5000]) for (const gain of [0, 1, 50, 135]) {
      const before = { level, xp, xpToNext: p.costForLevel(level), correctTotal }, next = p.advance(before, gain);
      assert.equal(spent(level) + xp + gain, spent(next.level) + next.xp);
      assert.equal(next.correctTotal, correctTotal);
      assert(next.level >= level && next.level <= Math.max(level, p.levelCapForCorrect(correctTotal)));
      assert.deepEqual(before, { level, xp, xpToNext: p.costForLevel(level), correctTotal });
    }
  }
});
test('applied XP agrees with the visible fraction and cannot fill an incomplete gate', () => {
  for (let level = 1; level < 10; level++) for (let correctTotal = (level - 1) * 10; correctTotal < level * 10; correctTotal++) {
    const v = p.project({ level, correctTotal, xp: 5000 });
    assert(v.applied < v.xpToNext && v.percent < 100);
    assert.equal(v.applied + v.reserved, v.xp);
    assert.equal(v.fraction, v.applied / v.xpToNext);
  }
  assert.deepEqual([p.view({ level: 1, correctTotal: 7, xp: 250 }).applied, p.view({ level: 1, correctTotal: 7, xp: 250 }).reserved], [140, 110]);
});
test('legacy projection consumes only earned costs without mutating save, and is idempotent', () => {
  const save = { level: 1, xp: 1000, correctTotal: 20, owner: 'legacy-owner', score: 123 };
  const raw = JSON.stringify(save), projected = p.project(save);
  assert.equal(projected.level, 3); assert.equal(projected.xp, 571);
  assert.equal(JSON.stringify(save), raw);
  assert.deepEqual(p.advance(projected), { level: 3, xp: 571, xpToNext: 264, correctTotal: 20, levelsGained: 0 });
  assert.equal(p.project({ level: 6, correctTotal: 47, xp: 480 }).level, 6);
});
test('XP alone does not advance a level, missing XP still matters, and maximum never becomes11', () => {
  assert.equal(p.advance({ level: 1, correctTotal: 9, xp: 5000 }).level, 1);
  assert.equal(p.advance({ level: 1, correctTotal: 10, xp: 199 }).level, 1);
  assert.equal(p.advance({ level: 1, correctTotal: 10, xp: 199 }, 1).level, 2);
  assert.equal(p.advance({ level: 10, correctTotal: 100, xp: 8000 }, 135).xp, 8135);
  assert.equal(p.advance({ level: 12, correctTotal: 100, xp: 8000 }, 135).level, 12);
});

test('save projection ignores stale saved prices exactly as the real restore does', () => {
  const save = { level: 1, xp: 199, correctTotal: 10, xpToNext: 1 };
  const raw = JSON.stringify(save), projected = p.fromSave(save);
  assert.equal(projected.level, 1); assert.equal(projected.xpToNext, 200);
  assert.equal(JSON.stringify(save), raw);
  assert.equal(p.fromSave({ ...save, xp: 200 }).level, 2);
});

test('earned life milestones agree with restore, respect equipment capacity and never repeat or revive', () => {
  const save = { level: 4, xp: 658, correctTotal: 60, lives: 1, maxLives: 5, extraLifeGiven: false };
  const raw = JSON.stringify(save), result = p.fromSave(save);
  assert.equal(result.level, 6); assert.equal(result.lives, 2); assert.equal(result.livesGained, 1);
  assert.equal(p.fromSave({ ...save, ...result }).lives, 2);
  assert.equal(JSON.stringify(save), raw);
  const capped = { level: 4, xp: 304, correctTotal: 40, lives: 5, maxLives: 5 };
  assert.equal(p.fromSave(capped).lives, 5);
  assert.equal(p.fromSave(capped, 6).lives, 6);
  assert.equal(p.fromSave({ ...save, lives: 0 }).lives, 0);
  assert.equal(p.fromSave({ ...save, gameOver: true }).lives, 1);
});
