# Plan 001: CI parses every JS file, typechecks the Edge Functions, and the secret-grep is fixed

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2b02f61..HEAD -- .github/workflows/ci.yml`
> If `.github/workflows/ci.yml` changed since this plan was written, compare the
> "Current state" excerpts against the live file before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `2b02f61`, 2026-06-25

## Why this matters

NefroQuest is a vanilla-JS SPA with **no build step**: the browser loads
`js/*.js` as classic scripts. There is no bundler, no linter, no typechecker —
so a single syntax error (a stray comma, an unclosed brace) in any JS file is
never caught before it reaches production at nefroquest.com, where it breaks the
whole app silently. The existing CI (`.github/workflows/ci.yml`) is good but only
does **string greps** over the files — it never actually *parses* them. The full
Playwright E2E job is `continue-on-error: true` (informational, non-blocking) and
the blocking smoke job runs only 2 specs, so a parse error in e.g. `dashboard.js`
or `study-mode.js` can pass CI entirely.

This plan adds three cheap, high-value gates: (1) `node --check` on every JS file
(a syntax error fails the build), (2) `deno check` on the Edge Functions (which
are currently redeployed by hand with no type safety), and (3) a fix to the
existing secret-leak step, which has a dead variable and only scans `index.html`.

`node --check js/game.js` already passes locally (Node 22), confirming the guard
is trivially addable and won't flag the current code.

## Current state

- `.github/workflows/ci.yml` — the only CI workflow. Triggered on
  `pull_request` to `main`. Has a `quality` job with these steps (in order):
  1. "Check version sync (SW ↔ version.json)"
  2. "Bundle size check"
  3. "HTML structure check"
  4. "Secret leak check"
  5. "Vercel security headers check"
  6. "XSS innerHTML guard"

  Then two more jobs: `smoke-e2e` (needs: quality) and `e2e` (needs: smoke-e2e,
  `continue-on-error: true`).

- The **Secret leak check** step today (verbatim — note the dead `KNOWN_KEY`,
  assigned but never referenced, and the grep targets only `index.html`):

  ```yaml
      # ── 4. Segurança: chaves hardcoded suspeitas ───────────────────────────
      - name: Secret leak check
        run: |
          ERRORS=0
          # Permitir apenas a chave anon pública do Supabase conhecida
          KNOWN_KEY="<REDACTED — a public anon-key fragment is hardcoded here>"
          # Detectar padrões de service_role ou JWT secret (nunca devem estar no front)
          if grep -qE 'service_role|eyJ...<privileged JWT regex>' index.html; then
            echo "❌ Possible service_role key or privileged JWT found in index.html"
            ERRORS=$((ERRORS+1))
          else
            echo "✅ No privileged Supabase keys detected"
          fi
          if [ $ERRORS -gt 0 ]; then exit 1; fi
  ```

  (The exact regex string is in the live file — do not retype it from here; edit
  the live file in place. Do **not** copy any key fragment into this plan or any
  commit message.)

- Repo conventions for CI steps: bash `run:` blocks, emoji status echoes
  (`✅`/`❌`), `ERRORS=$((ERRORS+1))` accumulator pattern, `exit 1` on failure.
  Match this style exactly — see the "HTML structure check" and "XSS innerHTML
  guard" steps as exemplars.

- JS files to parse live in `js/` (19 files: account, achievements, admin, audio,
  auth, boss, changelog, dashboard, exam, game, leaderboard, minigame,
  minigame-acidbase, notifications, paywall, study-mode, utils + any others) and
  `data/` (articles, competencies, rapid-quiz, refs, topics). All are classic
  browser scripts — `node --check` parses syntax without executing them.

- Edge Functions live in `supabase/functions/<name>/index.ts` (7 functions:
  ai-mentor, ai-diagnosis, send-flag, send-contact, create-mp-preference,
  mp-webhook, send-push). They are Deno/TypeScript, importing from `https://esm.sh/…`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Parse one JS file | `node --check js/game.js` | exit 0, no output |
| Parse all JS | `for f in js/*.js data/*.js; do node --check "$f" || exit 1; done` | exit 0 |
| Typecheck functions (needs Deno) | `deno check supabase/functions/*/index.ts` | exit 0 (see STOP condition) |
| Validate workflow YAML locally | `node -e "require('js-yaml')" 2>/dev/null || python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"` | exit 0 (valid YAML) |

You do **not** have a way to run GitHub Actions locally — verification is: the
commands above pass locally, and the YAML is valid. The CI itself will run on the PR.

## Scope

**In scope** (the only file you should modify):
- `.github/workflows/ci.yml`

**Out of scope** (do NOT touch):
- Any `js/*.js`, `data/*.js`, or `supabase/functions/**` source file. If
  `node --check` or `deno check` reports a *pre-existing* error in any of these,
  that is a STOP condition — report it, do not fix it here. This plan only adds
  CI gates; it does not change application code.
- `version.json` / `sw.js` — no version bump is needed because no static asset
  (`style.css`, `js/*.js`) is modified by this plan. (The repo's Service-Worker
  rule only applies when you change shipped assets.)

## Git workflow

- Branch: `advisor/001-ci-verification-baseline`
- One commit. Message style is Conventional Commits (see `git log`: e.g.
  `fix(refs/dashboard): …`, `feat(PED-2): …`). Suggested message:
  `ci: parse all JS (node --check), typecheck edge functions (deno check), fix secret-grep`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a "JS syntax check" step to the `quality` job

In `.github/workflows/ci.yml`, inside the `quality` job's `steps:` list, add a new
step **immediately after** the "HTML structure check" step (step 3) and before the
"Secret leak check" step. Match the existing bash/emoji style:

```yaml
      # ── 3b. Sintaxe JS: todo js/*.js e data/*.js deve parsear ──────────────
      - name: JS syntax check (node --check)
        run: |
          ERRORS=0
          for f in js/*.js data/*.js; do
            if node --check "$f"; then
              echo "✅ $f"
            else
              echo "❌ Syntax error in $f"
              ERRORS=$((ERRORS+1))
            fi
          done
          if [ $ERRORS -gt 0 ]; then
            echo "❌ $ERRORS file(s) failed to parse"
            exit 1
          fi
          echo "✅ All JS files parse cleanly"
```

Note: the `quality` job currently has no `actions/setup-node` step — the
GitHub-hosted `ubuntu-latest` runner ships with Node preinstalled, so `node` is
available. Do not add a setup-node step to the `quality` job unless `node --check`
turns out to be unavailable (it will be available).

**Verify**: `for f in js/*.js data/*.js; do node --check "$f" || exit 1; done; echo OK`
→ prints `OK`, exit 0.

### Step 2: Add a Deno typecheck for the Edge Functions

Add another new step **after** the step from Step 1:

```yaml
      # ── 3c. Typecheck das Edge Functions (Deno) ────────────────────────────
      - name: Setup Deno
        uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - name: Edge Functions typecheck (deno check)
        run: |
          ERRORS=0
          for f in supabase/functions/*/index.ts; do
            if deno check "$f"; then
              echo "✅ $f"
            else
              echo "❌ Type error in $f"
              ERRORS=$((ERRORS+1))
            fi
          done
          if [ $ERRORS -gt 0 ]; then
            echo "❌ $ERRORS function(s) failed typecheck"
            exit 1
          fi
          echo "✅ All edge functions typecheck cleanly"
```

Before committing, run `deno check supabase/functions/*/index.ts` locally **if Deno
is installed**. If Deno is not installed locally, you cannot pre-verify this step —
that is acceptable; the YAML validity check (Step 4) plus the CI run will cover it.
**If `deno check` reports any error in the existing function code, STOP** (see STOP
conditions) — do not modify the function source to make it pass.

**Verify** (only if Deno is installed locally): `deno check supabase/functions/*/index.ts`
→ exit 0. If Deno is not installed, skip and rely on Step 4.

### Step 3: Fix the "Secret leak check" step

Edit the existing "Secret leak check" step in place:

1. **Remove the dead `KNOWN_KEY=...` line entirely** (it is assigned but never
   used). Do not preserve the key fragment anywhere.
2. **Extend the grep to also scan `js/`** so a privileged key committed in a JS
   file is caught, not just `index.html`. Change the single `grep ... index.html`
   into a recursive scan over `index.html` and `js/`:

   ```yaml
          if grep -rqE 'service_role|<keep the existing privileged-JWT regex verbatim from the live file>' index.html js/; then
   ```

   Keep the existing regex pattern exactly as it is in the live file — only add
   the `-r` flag and the `js/` path, and delete the `KNOWN_KEY` line. Do not
   retype the regex from memory; edit the live line.

**Verify**: `grep -c "KNOWN_KEY" .github/workflows/ci.yml` → `0` (the dead var is gone).
And confirm the secret check still passes against the real tree:
`grep -rqE 'service_role' index.html js/ && echo "FOUND (investigate)" || echo "clean"`
→ `clean` (no `service_role` literal in shipped front-end code).

### Step 4: Validate the workflow YAML

Confirm the edited file is still valid YAML and the new step names are present.

**Verify**:
- `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('valid yaml')"` → `valid yaml`
- `grep -c "JS syntax check\|Edge Functions typecheck\|Setup Deno" .github/workflows/ci.yml` → `3`

## Test plan

This plan changes CI configuration only; there is no application code to unit-test.
Verification is:
- All `js/*.js` and `data/*.js` parse under `node --check` (Step 1 verify).
- The workflow file is valid YAML and contains the three new steps (Step 4 verify).
- The dead `KNOWN_KEY` variable is removed (Step 3 verify).
- Optional, manual: introduce a deliberate syntax error in a throwaway copy
  (`cp js/utils.js /tmp/bad.js`, break it, `node --check /tmp/bad.js` → exits 1),
  to confirm the gate actually catches errors. Delete the throwaway copy after;
  do NOT commit it.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `for f in js/*.js data/*.js; do node --check "$f" || exit 1; done` exits 0
- [ ] `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` exits 0
- [ ] `grep -c "KNOWN_KEY" .github/workflows/ci.yml` returns `0`
- [ ] `grep -c "JS syntax check\|Edge Functions typecheck\|Setup Deno" .github/workflows/ci.yml` returns `3`
- [ ] `git status --porcelain` shows only `.github/workflows/ci.yml` modified (plus `plans/README.md` status row)
- [ ] `plans/README.md` status row for 001 updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- The live "Secret leak check" step no longer matches the "Current state" excerpt
  (the codebase has drifted since this plan was written).
- `node --check` reports a syntax error in any **existing** `js/*.js` or
  `data/*.js` file — that means there is a real pre-existing bug; report it with
  the file:line, do not attempt to fix application code under this plan.
- `deno check` reports a type error in any **existing** function — report the
  errors; do not modify function source. (You may, if the operator approves,
  make the Deno step `continue-on-error: true` so it ships as informational, but
  ask first.)
- `denoland/setup-deno@v2` is unavailable or the org disallows third-party
  actions — report it; the `node --check` gate (Step 1) is the priority and can
  ship alone.

## Maintenance notes

- When new `js/` or `data/` files are added, the `js/*.js data/*.js` globs pick
  them up automatically — no CI edit needed.
- If a build step is ever introduced (contradicting the current "no build step"
  design in CLAUDE.md), the `node --check` gate becomes redundant with the
  bundler's parse and can be removed.
- Reviewer should confirm the Deno step does not slow CI unacceptably; if the
  esm.sh dependency download is slow, consider caching `~/.cache/deno` with
  `actions/cache`, mirroring the Playwright-browser cache already in the `e2e` job.
- The secret-grep is a coarse safety net, not a real secrets scanner; if secret
  hygiene becomes a priority, a dedicated tool (gitleaks) is the follow-up — out
  of scope here.
