# Plan 002: Characterization tests pin game.js XP/level scoring invariants

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2b02f61..HEAD -- js/game.js tests/specs/09-unit-pure-functions.spec.ts`
> If either file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as a
> STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `2b02f61`, 2026-06-25

## Why this matters

The core game loop lives in `js/game.js` (≈4987 lines), the largest file in the
repo. Its XP/level/progression math encodes a **documented, load-bearing
invariant**: level 10 (the max) is reached at *exactly* 90 correct answers, which
is `BOSS_START_CORRECT` — the moment the boss battle begins, 10 questions before
the 100-correct win. If a future refactor (e.g. the ongoing PED-4 design-system
migration, which already touches `game.js`) silently changes the XP curve or the
level-cap cadence, the boss could start at the wrong time and nothing would fail —
there is no fast test pinning this behavior. The existing
`tests/specs/09-unit-pure-functions.spec.ts` already characterizes a few pure
functions (`getStreakMultiplier`, `escapeHtml`, `_firstSentence`, `shuffle`) by
exposing them on `window` and calling them via Playwright `page.evaluate`. This
plan extends that exact pattern to the XP/level math, so the documented invariant
becomes a green/red test instead of a comment.

This is a *characterization* test: it pins current behavior as-is (it is not a bug
fix). If a value below looks "wrong", that is still the behavior to lock in —
report it, do not change game logic.

## Current state

- `js/game.js` defines the scoring math (around lines 2194–2219):

  ```js
  const MAX_LEVEL = 10;
  function xpForLevel(lv) {
    // xpToNext = 200 * 1.15^(lv-1), garante ~10 questões no nível 1
    return Math.floor(200 * Math.pow(1.15, lv - 1));
  }
  // ...
  function levelCapForProgress() {
    return Math.min(MAX_LEVEL, 1 + Math.floor((state.correctTotal || 0) / 10));
  }
  function gainXP(x){ /* mutates state.xp / state.level; not pure */ }
  ```

  - `xpForLevel(lv)` is **pure** (depends only on its argument). It is **not**
    currently exposed on `window`.
  - `levelCapForProgress()` reads the module-scoped global `state` Proxy
    (`state.correctTotal`). `state` is **not** on `window` (verified: a fresh
    executor confirmed `window.state` is `undefined` and there is no
    `window.state =` assignment anywhere in `js/*.js`). So the cap function
    **cannot** be tested by mutating `window.state`. This plan therefore does a
    tiny **behavior-preserving extract**: pull the pure arithmetic into
    `levelCapForCorrect(correctTotal)` and have `levelCapForProgress()` delegate
    to it, then expose only the pure helper. Do **not** expose the live `state`
    Proxy on `window`.
  - `MAX_LEVEL` is `10`; the cap formula yields L1 at 0 correct, L2 at 10, …,
    L10 at 90 correct — that is the invariant to pin.
  - **Floating-point note (do not "correct" it):** `xpForLevel` uses
    `Math.floor(200 * 1.15^(lv-1))`. Because `1.15` is not exactly representable
    in IEEE-754, `200*1.15 = 229.999…` → floor `229` (not 230); likewise
    `lv=5 → 349`, `lv=10 → 703`. These floored values **are** the behavior to
    pin. Compute them live (Step 2); never hand-round.

- `js/game.js` already exposes many functions on `window` near the bottom and
  inline, e.g. (verbatim):

  ```js
  window.isPremium = isPremium;
  window._loadTopics = _loadTopics;
  window.renderQuestion = function ...
  ```

  Follow this exact `window.<name> = <name>;` idiom.

- `getStreakMultiplier` is exposed on `window` from `js/utils.js` (that is how
  the existing test reaches it). Confirm the pattern by reading
  `tests/specs/09-unit-pure-functions.spec.ts` — the test does:

  ```ts
  await page.waitForFunction(() => typeof (window as any).getStreakMultiplier === 'function');
  const mult = await page.evaluate((s) => (window as any).getStreakMultiplier(s).mult, streak);
  ```

- Test runner: Playwright, config at `tests/playwright.config.ts`
  (`testDir: './specs'`, `baseURL: process.env.BASE_URL || 'http://localhost:5500'`).
  Specs are named `NN-description.spec.ts`. The new spec must follow this naming
  and load the page with `await page.goto('/')` in a `beforeEach`, exactly like
  spec 09.

- **Critical repo rule (CLAUDE.md)**: any PR that changes `js/*.js` MUST bump the
  version in the same commit — `version.json` and the `CACHE` constant + header
  comment in `sw.js`. There is a `.githooks/pre-commit` guard that blocks a
  `js/*.js` change without `version.json` + `sw.js` in the same commit. This plan
  changes `js/game.js` (Step 1), so the version bump in Step 4 is mandatory.
  Current version is `12.30` (`version.json` = `{"version": "12.30"}`; `sw.js`
  line 2 = `const CACHE = 'nefroquest-v12.30';` and line 1 comment
  `// NefroQuest Service Worker — v12.30`). Bump to `12.31`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Parse game.js after edit | `node --check js/game.js` | exit 0 |
| Install test deps (first time) | `cd tests && npm install` | exit 0 |
| Install browser (first time) | `cd tests && npx playwright install chromium` | exit 0 |
| Start local server (separate terminal, from repo root) | `npx serve . -p 5500` (or `python -m http.server 5500`) | serves at :5500 |
| Run the new spec | `cd tests && BASE_URL=http://localhost:5500 npx playwright test specs/14-scoring-invariants.spec.ts --reporter=list` | all pass |
| Run existing unit spec (regression) | `cd tests && BASE_URL=http://localhost:5500 npx playwright test specs/09-unit-pure-functions.spec.ts --reporter=list` | all pass |

Note: the server must be running and serving the repo **root** (so `/` loads
`index.html` and `/js/game.js`). On Windows use Git Bash for these commands.

## Scope

**In scope** (the only files you should modify/create):
- `js/game.js` — extract the pure `levelCapForCorrect(correctTotal)` helper from
  `levelCapForProgress` (behavior-preserving — see Step 1) and add two
  `window.<name> = <name>;` exposure lines. No change to any *value* the code
  produces; the diff should be ~+5 lines.
- `tests/specs/14-scoring-invariants.spec.ts` — create.
- `version.json` — bump to `12.31`.
- `sw.js` — bump CACHE constant + header comment to `12.31`.

**Out of scope** (do NOT touch):
- The *arithmetic* of `xpForLevel`, the level-cap formula, `gainXP`, or any other
  game logic. The only permitted change to `js/game.js` is the
  behavior-preserving extract in Step 1 (moving the existing cap formula verbatim
  into `levelCapForCorrect` and delegating) plus the two `window.` lines — no
  value the code computes may change. If a *value* seems wrong, that is a STOP
  condition, not an edit.
- Exposing `state` on `window` — explicitly forbidden; use the pure helper.
- `tests/specs/09-unit-pure-functions.spec.ts` — leave the existing spec as-is;
  add a new file rather than extending it (keeps the diff isolated and matches the
  one-concern-per-spec layout).
- Any other `js/*.js` file.

## Git workflow

- Branch: `advisor/002-scoring-characterization-tests`
- Commit message style: Conventional Commits (see `git log`). Suggested:
  `test(scoring): characterize xpForLevel + level-cap (boss@90) invariants — v12.31`
- The version bump (Step 4) MUST be in the same commit as the `js/game.js` change
  (pre-commit hook enforces this). Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Extract a pure level-cap helper and expose the two pure functions

In `js/game.js`, find the current `levelCapForProgress` definition (around line
2205), which reads:

```js
    function levelCapForProgress() {
      return Math.min(MAX_LEVEL, 1 + Math.floor((state.correctTotal || 0) / 10));
    }
```

Replace it with a behavior-preserving extract — a pure helper plus a thin
delegating wrapper (keep all surrounding comments intact):

```js
    function levelCapForCorrect(correctTotal) {
      return Math.min(MAX_LEVEL, 1 + Math.floor((correctTotal || 0) / 10));
    }
    function levelCapForProgress() {
      return levelCapForCorrect(state.correctTotal || 0);
    }
```

This produces an identical result for every input (the `|| 0` guard is just
applied twice, harmlessly). Then, immediately after the wrapper (just before
`function gainXP(x){`), add:

```js
    window.xpForLevel = xpForLevel;
    window.levelCapForCorrect = levelCapForCorrect;
```

Do not change `xpForLevel`, `gainXP`, or any other logic. Indentation: match the
surrounding 4-space indent. Do **not** expose `state` on `window`.

**Verify**: `node --check js/game.js` → exit 0, no output. And
`grep -c "window.xpForLevel\|window.levelCapForCorrect" js/game.js` → `2`.

### Step 2: Compute the expected values to assert

Before writing the test, compute the ground-truth values (these are what the
current code produces — characterization):

`xpForLevel(lv) = Math.floor(200 * 1.15^(lv-1))` — **floored IEEE-754 values**
(note 229/349/703, not 230/350/702 — see the floating-point note in Current state):

| lv | expected |
|----|----------|
| 1  | 200      |
| 2  | 229      |
| 3  | 264      |
| 4  | 304      |
| 5  | 349      |
| 10 | 703      |

Confirm these locally and **use whatever your command prints** (the formula's
live output is the source of truth, not this table):
`node -e "for (const lv of [1,2,3,4,5,10]) console.log(lv, Math.floor(200*Math.pow(1.15,lv-1)))"`
→ expected `1 200`, `2 229`, `3 264`, `4 304`, `5 349`, `10 703`.

`levelCapForCorrect(correctTotal)` invariant: `Math.min(10, 1 + Math.floor(correctTotal/10))`:

| correctTotal | expected cap |
|--------------|--------------|
| 0            | 1            |
| 9            | 1            |
| 10           | 2            |
| 89           | 9            |
| 90           | 10           |
| 100          | 10           |
| 250          | 10 (clamped) |

The load-bearing assertion is **cap === 10 at correctTotal 90** (= `BOSS_START_CORRECT`)
and **cap === 9 at 89** (i.e. max level is *not* reached before the boss starts).

### Step 3: Create the characterization spec

Create `tests/specs/14-scoring-invariants.spec.ts`, modeled structurally on
`tests/specs/09-unit-pure-functions.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

/**
 * Characterization tests for game.js XP / level scoring invariants.
 * Pins current behavior — NOT a spec for desired behavior. If a value here
 * needs to change, it means game logic changed; update deliberately.
 */

test.describe('Game scoring — XP & level invariants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('xpForLevel follows 200 * 1.15^(lv-1), floored', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).xpForLevel === 'function');
    const cases: [number, number][] = [
      [1, 200],
      [2, 229],
      [3, 264],
      [4, 304],
      [5, 349],
      [10, 703],
    ];
    for (const [lv, expected] of cases) {
      const xp = await page.evaluate((l) => (window as any).xpForLevel(l), lv);
      expect(xp).toBe(expected);
    }
  });

  test('level cap reaches 10 exactly at 90 correct (BOSS_START_CORRECT)', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).levelCapForCorrect === 'function');
    const cases: [number, number][] = [
      [0, 1],
      [9, 1],
      [10, 2],
      [89, 9],
      [90, 10],
      [100, 10],
      [250, 10],
    ];
    for (const [correctTotal, expectedCap] of cases) {
      const cap = await page.evaluate((ct) => (window as any).levelCapForCorrect(ct), correctTotal);
      expect(cap).toBe(expectedCap);
    }
  });
});
```

Notes for the executor:
- The level-cap test calls the **pure** `window.levelCapForCorrect(ct)` directly —
  no `state`, no `window.state`. Do not add a `window.state` exposure.
- If your Step-2 local computation printed different `xpForLevel` numbers than the
  `cases` array above, **use your printed numbers** and note it in your report
  (the live formula output is authoritative).

**Verify**: start the server, then
`cd tests && BASE_URL=http://localhost:5500 npx playwright test specs/14-scoring-invariants.spec.ts --reporter=list`
→ both tests pass (2 passed).

### Step 4: Bump the version (mandatory — `js/game.js` changed)

Because Step 1 modified `js/game.js`, bump the version in the same commit:

1. `version.json`: change `{"version": "12.30"}` → `{"version": "12.31"}`.
2. `sw.js` line 1 comment: `// NefroQuest Service Worker — v12.30` → `… v12.31`.
3. `sw.js` line 2: `const CACHE = 'nefroquest-v12.30';` → `'nefroquest-v12.31';`.

**Verify**:
- `grep -c "12.31" version.json` → `1`
- `grep -c "nefroquest-v12.31\|— v12.31" sw.js` → `2`
- The CI version-sync gate logic (sw cache version === version.json) will pass:
  both read `12.31`.

### Step 5: Confirm no regression in the existing unit spec

**Verify**: `cd tests && BASE_URL=http://localhost:5500 npx playwright test specs/09-unit-pure-functions.spec.ts --reporter=list`
→ all pass (the `window.xpForLevel` additions must not affect existing tests).

## Test plan

- New file `tests/specs/14-scoring-invariants.spec.ts` with two tests:
  1. `xpForLevel` curve at lv ∈ {1,2,3,4,5,10} (happy path + the floor at lv 10).
  2. `levelCapForProgress` at correctTotal ∈ {0,9,10,89,90,100,250} — the
     regression this plan exists to catch is **cap===10 at 90** and **cap===9 at 89**.
- Structural pattern to follow: `tests/specs/09-unit-pure-functions.spec.ts`
  (`waitForFunction` for the global, `page.evaluate` to call it, table-driven `cases`).
- Verification: the new spec passes (2 passed) and spec 09 still passes.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `node --check js/game.js` exits 0
- [ ] `grep -c "window.xpForLevel\|window.levelCapForCorrect" js/game.js` returns `2`
- [ ] `tests/specs/14-scoring-invariants.spec.ts` exists and its 2 tests pass under Playwright
- [ ] `specs/09-unit-pure-functions.spec.ts` still passes (no regression)
- [ ] `version.json` reads `12.31` and `sw.js` CACHE + header read `12.31` (CI version-sync will pass)
- [ ] `git status --porcelain` shows only: `js/game.js`, `tests/specs/14-scoring-invariants.spec.ts`, `version.json`, `sw.js` (plus `plans/README.md` status row)
- [ ] `plans/README.md` status row for 002 updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- The `xpForLevel` / `levelCapForProgress` code in `js/game.js` does not match the
  "Current state" excerpt (drift since this plan was written) — in particular if
  the current `levelCapForProgress` body is not the single
  `Math.min(MAX_LEVEL, 1 + Math.floor((state.correctTotal || 0) / 10))` return.
- `window.xpForLevel` or `window.levelCapForCorrect` is not a function at runtime
  after your edit (the exposure didn't take) — recheck Step 1.
- Any computed `xpForLevel` value disagrees with the live
  `node -e` output from Step 2 — that would mean the code was edited; report it.
- A test fails because the *current* behavior differs from the asserted
  characterization — report the actual value; do NOT change game logic to make the
  test pass, and do NOT change the assertion to a value you didn't compute from the
  live code.
- The pre-commit hook blocks the commit for a missing version bump — that means
  Step 4 was skipped; complete it (do not use `--no-verify`).

## Maintenance notes

- If the XP curve or the 10-correct-per-level cadence is ever changed
  deliberately, these tests will fail by design — update the `cases` tables to the
  new computed values in the same PR, and double-check the boss-start invariant
  (cap reaching MAX_LEVEL at `BOSS_START_CORRECT`) still holds or is intentionally moved.
- `BOSS_START_CORRECT` is referenced in comments around game.js:2201; if it stops
  being 90, the "cap===10 at 90" assertion is the canary — keep them in sync.
- Reviewer should confirm Step 1 added *only* the two `window.` lines and changed
  no function body (the diff for `js/game.js` should be +2 lines).
- Natural follow-up (out of scope here): characterize `gainXP` behavior (it mutates
  `state`), and the streak-scored XP path at game.js:2485 — both need a small
  state-setup harness, which is a larger task than this plan.
