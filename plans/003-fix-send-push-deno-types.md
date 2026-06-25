# Plan 003: Fix the `deno check` type errors in send-push so the typecheck gate can become blocking

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. Touch
> only the files in scope. If a STOP condition occurs, stop and report. When
> done, update the status row for this plan in `plans/README.md` — unless a
> reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 2b02f61..HEAD -- supabase/functions/send-push/index.ts .github/workflows/ci.yml`
> If either changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, STOP.
>
> **Prerequisite**: Deno v2 must be installed locally (`deno --version`). If it
> is not, STOP and report — this plan cannot be verified without it. Do not guess
> at the type fix and ship it unverified.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: MED (edits security-sensitive VAPID signing crypto — behavior must not change)
- **Depends on**: none (CI gate already shipped via PR #523/#524)
- **Category**: bug (type-safety) / dx
- **Planned at**: commit `2b02f61`, 2026-06-25

## Why this matters

PR #523 added a `deno check` step to CI for the Supabase Edge Functions; PR #524
made it **informational** (`continue-on-error: true`) because it surfaced 2
pre-existing `TS2769` errors in `supabase/functions/send-push/index.ts`. Those
errors are the well-known TS 5.7+/Deno typed-array generic friction:
`base64UrlToUint8Array` returns `Uint8Array<ArrayBufferLike>`, which the strict
Deno lib no longer accepts where `crypto.subtle.importKey` wants a `BufferSource`.
Fixing them lets the typecheck gate become **blocking** again — so a real type
regression in any Edge Function (which today is deployed by hand with no type
safety) gets caught in CI instead of in production.

This is a type-only fix: the runtime behavior of VAPID token signing must remain
byte-for-byte identical. Do not change the signing algorithm, key formats, or the
raw→pkcs8 fallback.

## Current state

- `supabase/functions/send-push/index.ts`, `buildVapidToken` (lines ~66–73):

  ```ts
  const rawKey = base64UrlToUint8Array(privateKeyB64);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', rawKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  ).catch(async () => {
    // Try PKCS8 format if raw fails (some VAPID key generators use PKCS8)
    const pkcs8Key = base64UrlToUint8Array(privateKeyB64);
    return crypto.subtle.importKey('pkcs8', pkcs8Key, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  });
  ```

  The two `importKey` calls are the `TS2769` "No overload matches this call"
  sites (CI log from run 28199601199). `base64UrlToUint8Array` is defined earlier
  in the same file and returns `Uint8Array` (via `Uint8Array.from(binary, …)`).

- CI step that will flip to blocking once this is fixed — `.github/workflows/ci.yml`,
  the "Edge Functions typecheck (deno check)" step, currently has
  `continue-on-error: true` and a comment block above `Setup Deno` explaining why.

- No other Edge Function reported a `deno check` error in the PR #523 run — only
  send-push. Confirm this still holds in Step 1.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Confirm Deno present | `deno --version` | prints v2.x |
| Typecheck the one function | `deno check supabase/functions/send-push/index.ts` | exit 0 after fix |
| Typecheck all functions | `for f in supabase/functions/*/index.ts; do deno check "$f" || exit 1; done` | exit 0 |
| Validate workflow YAML | `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml','r',encoding='utf-8'))"` | exit 0 |

## Scope

**In scope**:
- `supabase/functions/send-push/index.ts` — the minimal type fix at the two
  `importKey` call sites (and/or the return type of `base64UrlToUint8Array`).
- `.github/workflows/ci.yml` — ONLY in Step 3, and ONLY if every function passes
  `deno check`: remove `continue-on-error: true` from the deno step and update the
  explanatory comment. If any function still fails, leave the step informational.

**Out of scope**:
- The signing algorithm, key formats, the raw→pkcs8 fallback logic, or any
  runtime behavior. Type annotations / casts only.
- Any other Edge Function source — unless Step 1 shows it also fails `deno check`,
  in which case STOP and report (the scope was send-push only).
- No `version.json` / `sw.js` bump — Edge Functions are not SW-cached assets; the
  CLAUDE.md version rule applies to `style.css` / `js/*.js` only.

## Git workflow

- Branch: `advisor/003-send-push-deno-types`
- Conventional Commits. Suggested: `fix(send-push): satisfy deno check importKey types; make CI typecheck blocking`
- Edge Functions are deployed manually (CLAUDE.md) — this change is NOT
  auto-deployed by the merge. Note in the PR that `supabase functions deploy
  send-push` is required to ship the (behavior-identical) change. Do NOT push or
  open a PR unless the operator instructed it.

## Steps

### Step 1: Reproduce the failure and confirm it is send-push only

Run `for f in supabase/functions/*/index.ts; do echo "== $f =="; deno check "$f"; done`.
Confirm: only `send-push/index.ts` reports `TS2769` (two of them), all other
functions pass. If a different function also fails, STOP and report — the scope
here is send-push only.

**Verify**: the loop output shows `TS2769` solely under `send-push/index.ts`.

### Step 2: Apply the minimal type fix

The cause is that `base64UrlToUint8Array` returns `Uint8Array<ArrayBufferLike>`,
not the `ArrayBufferView<ArrayBuffer>` the strict lib wants for `BufferSource`.
Pick the smallest change that makes `deno check` pass **without** changing runtime
behavior. Candidate approaches, try in this order, keep the first that yields a
clean `deno check`:

1. Cast at the two call sites: pass `rawKey as BufferSource` and
   `pkcs8Key as BufferSource` to `importKey`.
2. If that does not satisfy the checker, copy into a fresh ArrayBuffer-backed view
   at the call site, e.g. `new Uint8Array(rawKey) ` won't change the generic — instead
   use `rawKey.buffer.slice(rawKey.byteOffset, rawKey.byteOffset + rawKey.byteLength)`
   passed as the key data (this yields a concrete `ArrayBuffer`).
3. If both are unsatisfying, annotate `base64UrlToUint8Array`'s return as
   `Uint8Array<ArrayBuffer>` and ensure its body produces one (it does, via
   `Uint8Array.from`).

Do NOT add `// @ts-ignore` / `// @ts-nocheck` — that defeats the gate. Do NOT
change the `'raw'` / `'pkcs8'` formats, the algorithm, or the fallback.

**Verify**: `deno check supabase/functions/send-push/index.ts` → exit 0.
And confirm the runtime logic is untouched: `git diff supabase/functions/send-push/index.ts`
shows only type annotations/casts on/around the two `importKey` calls (and/or the
helper's return type) — no change to string literals `'raw'`, `'pkcs8'`, `'ECDSA'`,
`'P-256'`, the `.catch` fallback, or `crypto.subtle.sign`.

### Step 3: Make the CI typecheck blocking (only if all functions pass)

Run `for f in supabase/functions/*/index.ts; do deno check "$f" || exit 1; done`.
If it exits 0, edit `.github/workflows/ci.yml`: remove the `continue-on-error: true`
line from the "Edge Functions typecheck (deno check)" step and update the comment
block above `Setup Deno` to say the gate is now blocking. If any function still
fails, leave the step informational and note which one in your report.

**Verify**: `grep -c "continue-on-error" .github/workflows/ci.yml` decreases by 1
(only the deno step's flag is removed; the `e2e` job's own `continue-on-error`
stays). YAML still valid (command in the table).

## Test plan

- This is a type-only change; there is no unit test for VAPID signing in the repo.
  The verification is the typecheck passing plus a careful diff confirming zero
  runtime change.
- If the operator wants runtime assurance, a follow-up could add a Deno test that
  signs a known key and asserts the JWT header/segments — out of scope here.

## Done criteria

ALL must hold:

- [ ] `deno check supabase/functions/send-push/index.ts` exits 0
- [ ] `for f in supabase/functions/*/index.ts; do deno check "$f" || exit 1; done` exits 0
- [ ] `git diff supabase/functions/send-push/index.ts` shows only type annotations/casts — no change to `'raw'`/`'pkcs8'`/`'ECDSA'`/`'P-256'`/`.catch`/`crypto.subtle.sign`
- [ ] If the gate was made blocking: `.github/workflows/ci.yml` is valid YAML and the deno step no longer has `continue-on-error`
- [ ] `git status --porcelain` shows only `supabase/functions/send-push/index.ts` (and optionally `.github/workflows/ci.yml`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Deno is not installed locally — cannot verify; report and stop.
- A function other than send-push also fails `deno check` — out of scope; report.
- No type-only change makes `deno check` pass (the error implicates the fallback
  control flow, not just the key type) — report the exact `TS2769` text; do not
  restructure the signing logic to satisfy the checker.
- The fix would require changing any runtime literal or the raw→pkcs8 fallback.

## Maintenance notes

- This change must be deployed with `supabase functions deploy send-push` to take
  effect in production — the GitHub Pages merge does not deploy Edge Functions.
  Because it is type-only, the deployed behavior is identical; deploying is
  optional unless other send-push changes ship.
- Once blocking, any future Edge Function type regression fails CI — good. If a new
  function legitimately needs a looser check, scope the exception to that file, not
  the whole step.
