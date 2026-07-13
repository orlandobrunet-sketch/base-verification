# Editorial Batch Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fail-closed CI validator that requires and enforces a machine-readable editorial manifest for every change to `data/topics.js` or `data/refs.js`.

**Architecture:** A zero-dependency Node.js CLI compares explicit base and head revisions, parses the question bank and reference registry without executing them, validates one JSON batch manifest, and applies structural and scope rules. Small modules expose pure functions for focused `node:test` coverage; the existing GitHub Actions quality job invokes the CLI.

**Tech Stack:** Node.js 20+, ECMAScript modules, `node:test`, Git CLI, JSON Schema documentation, GitHub Actions YAML.

## Global Constraints

- Every change to `data/topics.js` or `data/refs.js`, including `technical_only`, requires exactly one changed JSON manifest under `docs/editorial/review-batches/`.
- Add no runtime or development package dependency.
- Do not execute `data/topics.js` or `data/refs.js` while validating them.
- The validator never grants medical approval or `Autorização de publicação: LIBERADA`.
- Preserve all existing CI checks.
- Do not modify application assets or medical content.
- Fail closed on unreadable revisions, malformed data, ambiguous parsing, or Git errors.

---

## File Structure

- Create `scripts/editorial-batch-validator.mjs` — CLI argument handling, Git content loading, diagnostic output, and exit status.
- Create `scripts/editorial-batch/questions.mjs` — parse one-question-per-line objects and compare question records.
- Create `scripts/editorial-batch/references.mjs` — extract top-level reference-card IDs and calculate consumers.
- Create `scripts/editorial-batch/manifest.mjs` — locate and validate the changed manifest and normalize its declarations.
- Create `scripts/editorial-batch/git-diff.mjs` — safe Git command wrapper, changed paths, and revision content.
- Create `scripts/editorial-batch/versions.mjs` — extract and validate the three canonical versions.
- Create `scripts/editorial-batch/rules.mjs` — aggregate all validation rules and diagnostics.
- Create `tests/editorial-batch/questions.test.mjs` — question and reference parser tests.
- Create `tests/editorial-batch/manifest.test.mjs` — manifest-contract tests.
- Create `tests/editorial-batch/rules.test.mjs` — pure rule-engine tests.
- Create `tests/editorial-batch/cli.test.mjs` — temporary-repository end-to-end tests.
- Create `docs/editorial/review-batches/manifest.schema.json` — JSON Schema documentation.
- Create `.github/PULL_REQUEST_TEMPLATE.md` — required editorial checklist.
- Modify `.github/workflows/ci.yml` — fetch history and execute the validator.

---

### Task 1: Question and Reference Parsers

**Files:**
- Create: `scripts/editorial-batch/questions.mjs`
- Create: `scripts/editorial-batch/references.mjs`
- Create: `tests/editorial-batch/questions.test.mjs`

**Interfaces:**
- Produces: `parseQuestions(source, pathLabel) -> Map<string, Question>`
- Produces: `changedQuestionIds(beforeMap, afterMap) -> string[]`
- Produces: `equalExceptRefs(before, after) -> boolean`
- Produces: `parseReferenceIds(source, pathLabel) -> Set<string>`
- Produces: `referenceConsumers(questionMap) -> Map<string, Set<string>>`

- [ ] **Step 1: Write failing question-parser tests**

Create tests that import the desired functions before the modules exist:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseQuestions,
  changedQuestionIds,
  equalExceptRefs,
} from '../../scripts/editorial-batch/questions.mjs';
import {
  parseReferenceIds,
  referenceConsumers,
} from '../../scripts/editorial-batch/references.mjs';

const question = (qid, refs = ['ref_a']) =>
  `  ${JSON.stringify({ qid, q: 'Q?', opts: ['A', 'B', 'C', 'D'], ans: 0, exp: 'E', cat: 'x', diff: 'medium', refs })},`;

test('parses complete one-line question objects without executing JavaScript', () => {
  const parsed = parseQuestions(`const topics = [\n${question('abc12345')}\n];`, 'topics.js');
  assert.equal(parsed.get('abc12345').opts.length, 4);
});

test('rejects duplicate qids', () => {
  assert.throws(
    () => parseQuestions(`${question('abc12345')}\n${question('abc12345')}`, 'topics.js'),
    /duplicate qid abc12345/i,
  );
});

test('reports exactly the changed qids', () => {
  const before = parseQuestions(question('abc12345'), 'before');
  const after = parseQuestions(question('abc12345', ['ref_b']), 'after');
  assert.deepEqual(changedQuestionIds(before, after), ['abc12345']);
  assert.equal(equalExceptRefs(before.get('abc12345'), after.get('abc12345')), true);
});

test('extracts top-level reference ids and consumers', () => {
  const ids = parseReferenceIds(`const REFS = {\n  ref_a:{ label: 'A' },\n  ref_b: { label: 'B' }\n};`, 'refs.js');
  assert.deepEqual([...ids], ['ref_a', 'ref_b']);
  const consumers = referenceConsumers(parseQuestions(question('abc12345', ['ref_b']), 'topics.js'));
  assert.deepEqual([...consumers.get('ref_b')], ['abc12345']);
});
```

- [ ] **Step 2: Run the parser tests and verify RED**

Run: `node --test tests/editorial-batch/questions.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/editorial-batch/questions.mjs`.

- [ ] **Step 3: Implement the minimal parsers**

Implement `parseQuestions` by trimming each line, selecting lines that start with `{` and end with `},` or `}`, removing only the trailing comma, and calling `JSON.parse`. Reject malformed candidate lines, missing/duplicate qids, and non-object values. Use canonical `JSON.stringify` comparison for `changedQuestionIds`; clone and delete `refs` for `equalExceptRefs`.

Implement `parseReferenceIds` with an anchored top-level declaration expression matching the real two-space indentation:

```javascript
const CARD_DECLARATION = /^  ([a-z0-9_]+)\s*:\s*\{/gm;
```

Reject zero matches and duplicate IDs. Build `referenceConsumers` by iterating each question's `refs` array.

- [ ] **Step 4: Run parser tests and verify GREEN**

Run: `node --test tests/editorial-batch/questions.test.mjs`

Expected: 4 tests pass, 0 fail.

- [ ] **Step 5: Commit Task 1**

```text
git add scripts/editorial-batch/questions.mjs scripts/editorial-batch/references.mjs tests/editorial-batch/questions.test.mjs
git commit -m "test(ci): add editorial data parsers"
```

---

### Task 2: Manifest Contract and Schema

**Files:**
- Create: `scripts/editorial-batch/manifest.mjs`
- Create: `tests/editorial-batch/manifest.test.mjs`
- Create: `docs/editorial/review-batches/manifest.schema.json`

**Interfaces:**
- Produces: `findChangedManifest(changedPaths) -> string`
- Produces: `validateManifest(value, manifestPath) -> { manifest, errors }`
- Manifest question actions: `rebuild | refs_only | retire | add | technical_only`

- [ ] **Step 1: Write failing manifest tests**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { findChangedManifest, validateManifest } from '../../scripts/editorial-batch/manifest.mjs';

const valid = {
  batch: 'FARM-4A',
  change_type: 'medical_editorial',
  expected_version: '12.65',
  allowed_files: ['data/topics.js', 'version.json', 'sw.js', 'index.html', 'docs/editorial/review-batches/FARM-4A.json'],
  questions: {
    '5bfb77d2': { action: 'rebuild', preserve_fsrs: true },
    '23211e6a': { action: 'retire', preserve_fsrs: false },
  },
  expected_question_delta: -1,
  refs_policy: 'unchanged',
  external_review: { greptile: 'required', fallback_reviewer: null },
};

test('requires exactly one changed JSON manifest', () => {
  assert.equal(findChangedManifest(['data/topics.js', 'docs/editorial/review-batches/FARM-4A.json']), 'docs/editorial/review-batches/FARM-4A.json');
  assert.throws(() => findChangedManifest(['data/topics.js']), /exactly one/i);
});

test('accepts the complete contract', () => {
  assert.deepEqual(validateManifest(valid, 'FARM-4A.json').errors, []);
});

test('requires fallback reviewer when Greptile is unavailable', () => {
  const input = structuredClone(valid);
  input.external_review = { greptile: 'unavailable', fallback_reviewer: null };
  assert.match(validateManifest(input, 'FARM-4A.json').errors.join('\n'), /fallback_reviewer/);
});

test('requires preserve_fsrs false for retired qids', () => {
  const input = structuredClone(valid);
  input.questions['23211e6a'].preserve_fsrs = true;
  assert.match(validateManifest(input, 'FARM-4A.json').errors.join('\n'), /retire.*preserve_fsrs/i);
});
```

- [ ] **Step 2: Run manifest tests and verify RED**

Run: `node --test tests/editorial-batch/manifest.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `manifest.mjs`.

- [ ] **Step 3: Implement contract validation**

Validate exact required fields, primitive types, supported enums, non-empty question declarations, unique `allowed_files`, manifest inclusion in `allowed_files`, qid format `/^[a-f0-9]{8}$/`, and action/FSRS compatibility. When `refs_policy` is `declared`, require a `references` object whose entries use `add | modify | remove`.

Return all validation errors rather than throwing after the JSON has been parsed. Throw only when manifest discovery is impossible or ambiguous.

- [ ] **Step 4: Add the JSON Schema**

Write a Draft 2020-12 schema with `additionalProperties: false`, the same required fields and enums, conditional requirement of `references` for `refs_policy: declared`, and conditional non-empty string `fallback_reviewer` for `greptile: unavailable`.

- [ ] **Step 5: Run manifest tests and verify GREEN**

Run: `node --test tests/editorial-batch/manifest.test.mjs`

Expected: 4 tests pass, 0 fail.

- [ ] **Step 6: Commit Task 2**

```text
git add scripts/editorial-batch/manifest.mjs tests/editorial-batch/manifest.test.mjs docs/editorial/review-batches/manifest.schema.json
git commit -m "feat(ci): define editorial batch manifest"
```

---

### Task 3: Pure Rule Engine and Version Validation

**Files:**
- Create: `scripts/editorial-batch/versions.mjs`
- Create: `scripts/editorial-batch/rules.mjs`
- Create: `tests/editorial-batch/rules.test.mjs`

**Interfaces:**
- Produces: `extractVersions({ versionJson, serviceWorker, indexHtml }) -> { json, cache, comment, sentry }`
- Produces: `validateBatch(input) -> Array<{ code, message }>`
- Consumes parsed before/after questions, reference IDs, changed paths, manifest, version text, and before/after `refs.js` text.

- [ ] **Step 1: Write failing version and rule tests**

Build a `validInput()` fixture with two before questions, one rebuilt survivor after, synchronized `12.65` version text, unchanged reference text, and the Task 2 manifest. Add separate tests asserting diagnostic codes for:

```javascript
assert.deepEqual(validateBatch(validInput()), []);
assert.ok(validateBatch(withExtraPath()).some(error => error.code === 'UNDECLARED_FILE'));
assert.ok(validateBatch(withExtraQid()).some(error => error.code === 'UNDECLARED_QID'));
assert.ok(validateBatch(withBadRefsOnly()).some(error => error.code === 'REFS_ONLY_SCOPE'));
assert.ok(validateBatch(withMissingReference()).some(error => error.code === 'MISSING_REFERENCE'));
assert.ok(validateBatch(withOrphanReference()).some(error => error.code === 'ORPHAN_REFERENCE'));
assert.ok(validateBatch(withBadVersion()).some(error => error.code === 'VERSION_MISMATCH'));
assert.ok(validateBatch(withZip()).some(error => error.code === 'FORBIDDEN_ARTIFACT'));
```

Also assert invalid question structure codes for non-four `opts`, invalid `ans`, and wrong basic field types.

- [ ] **Step 2: Run rule tests and verify RED**

Run: `node --test tests/editorial-batch/rules.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `rules.mjs`.

- [ ] **Step 3: Implement version extraction**

Use strict expressions:

```javascript
const cache = serviceWorker.match(/const CACHE = 'nefroquest-v([0-9.]+)'/);
const comment = serviceWorker.match(/NefroQuest Service Worker — v([0-9.]+)/);
const sentry = indexHtml.match(/release:\s*'nefroquest@([0-9.]+)'/);
```

Parse `version.json` with `JSON.parse`. Missing or duplicate canonical values become diagnostics rather than implicit defaults.

- [ ] **Step 4: Implement the rule engine**

Apply rules in this order while accumulating errors:

1. forbidden artifact patterns;
2. changed paths equal permitted paths;
3. declared qids equal changed qids;
4. action/existence and `refs_only` semantics;
5. actual question delta;
6. question structural integrity across the complete after bank;
7. reference existence and zero orphans;
8. `refs_policy` byte identity or exact declared card IDs;
9. canonical version synchronization, expected value, and difference from base.

Forbidden patterns include `*.zip`, `.playwright-mcp/`, `test-results/`, `tests/test-results/`, `tests/report/`, `playwright-report/`, `trace.zip`, and filenames containing `.scratch.` or ending `.tmp`.

- [ ] **Step 5: Run rule tests and verify GREEN**

Run: `node --test tests/editorial-batch/rules.test.mjs`

Expected: all rule scenarios pass, 0 fail.

- [ ] **Step 6: Commit Task 3**

```text
git add scripts/editorial-batch/versions.mjs scripts/editorial-batch/rules.mjs tests/editorial-batch/rules.test.mjs
git commit -m "feat(ci): enforce editorial batch scope"
```

---

### Task 4: Git Adapter and CLI End-to-End Validation

**Files:**
- Create: `scripts/editorial-batch/git-diff.mjs`
- Create: `scripts/editorial-batch-validator.mjs`
- Create: `tests/editorial-batch/cli.test.mjs`

**Interfaces:**
- Produces: `runGit(args, cwd) -> string`
- Produces: `changedPaths(base, head, cwd) -> string[]`
- Produces: `readAtRevision(revision, path, cwd, { optional }) -> string | null`
- CLI accepts exactly `--base <revision> --head <revision>` and optional `--cwd <path>` for tests.

- [ ] **Step 1: Write a failing CLI integration test**

Create a temporary Git repository using `mkdtemp`, configure a local test identity, and make a base commit containing minimal valid `data/topics.js`, `data/refs.js`, version files, and no manifest. Make a head commit changing a question plus a valid manifest. Execute:

```javascript
const result = spawnSync(process.execPath, [
  cliPath,
  '--base', baseSha,
  '--head', headSha,
  '--cwd', repo,
], { encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr || result.stdout);
assert.match(result.stdout, /Editorial batch validation passed/);
```

Add a second temporary commit that changes an undeclared qid and assert non-zero status plus `UNDECLARED_QID`.

- [ ] **Step 2: Run CLI tests and verify RED**

Run: `node --test tests/editorial-batch/cli.test.mjs`

Expected: FAIL because `scripts/editorial-batch-validator.mjs` does not exist.

- [ ] **Step 3: Implement safe Git access**

Use `execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })`; never compose a shell command. Normalize changed paths to `/`. Use `git diff --name-only <base> <head>` and `git show <revision>:<path>`. Optional reads return `null` only for a confirmed missing path; other Git errors fail.

- [ ] **Step 4: Implement CLI orchestration**

The CLI must:

1. parse and validate arguments;
2. load changed paths;
3. exit successfully with a clear “not activated” message when neither medical data file changed;
4. discover and parse exactly one manifest from head;
5. load base/head medical and version files;
6. call the parsers and `validateBatch`;
7. print each diagnostic as `ERROR [CODE] message` and exit 1 when any exists;
8. print one success summary with batch, changed qids, question delta, and version on exit 0.

Do not print full question content.

- [ ] **Step 5: Run CLI tests and verify GREEN**

Run: `node --test tests/editorial-batch/cli.test.mjs`

Expected: valid temporary PR passes; undeclared-qid temporary PR fails as asserted; test process exits 0.

- [ ] **Step 6: Run all validator tests**

Run: `node --test tests/editorial-batch/*.test.mjs`

Expected: all tests pass, 0 fail.

- [ ] **Step 7: Commit Task 4**

```text
git add scripts/editorial-batch/git-diff.mjs scripts/editorial-batch-validator.mjs tests/editorial-batch/cli.test.mjs
git commit -m "feat(ci): add editorial batch validator CLI"
```

---

### Task 5: Pull-Request Workflow and CI Integration

**Files:**
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- CI supplies `${{ github.event.pull_request.base.sha }}` and `${{ github.event.pull_request.head.sha }}` to the CLI.

- [ ] **Step 1: Write a failing source-contract test**

Add to `tests/editorial-batch/cli.test.mjs`:

```javascript
test('CI and PR template expose the editorial gate', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const template = await readFile(new URL('../../.github/PULL_REQUEST_TEMPLATE.md', import.meta.url), 'utf8');
  assert.match(workflow, /editorial-batch-validator\.mjs/);
  assert.match(workflow, /pull_request\.base\.sha/);
  assert.match(workflow, /pull_request\.head\.sha/);
  assert.match(template, /Autorização explícita/);
  assert.match(template, /Greptile indisponível/);
  assert.match(template, /zero threads não comprova/i);
});
```

- [ ] **Step 2: Run the source-contract test and verify RED**

Run: `node --test --test-name-pattern="CI and PR template" tests/editorial-batch/cli.test.mjs`

Expected: FAIL because the template is missing and the workflow does not invoke the CLI.

- [ ] **Step 3: Create the PR template**

Include sections for batch/manifest, exact qids/actions, explicit authorization, formal `revisar-nefroquest` verdict, Evidence/Pending Issue/Publication axes, FSRS decision, expected counts, three-file version, changed-file scope, CI results, and external review. State explicitly: “Zero threads não comprova que o Greptile executou uma revisão.” Require a named fallback when unavailable.

- [ ] **Step 4: Integrate the validator into existing CI**

Change the quality-job checkout to:

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

Add immediately after checkout:

```yaml
- name: Editorial batch scope gate
  run: >-
    node scripts/editorial-batch-validator.mjs
    --base "${{ github.event.pull_request.base.sha }}"
    --head "${{ github.event.pull_request.head.sha }}"
```

- [ ] **Step 5: Run source-contract and complete validator tests**

Run: `node --test tests/editorial-batch/*.test.mjs`

Expected: all tests pass, 0 fail.

- [ ] **Step 6: Run repository-level verification**

Run:

```text
node --check scripts/editorial-batch-validator.mjs
node --check scripts/editorial-batch/*.mjs
node --test tests/editorial-batch/*.test.mjs
git diff --check main...HEAD
```

Expected: every command exits 0; tests report 0 failures; diff check emits no errors.

- [ ] **Step 7: Audit the final diff against the design**

Confirm that no application asset or medical content changed; only planned scripts, tests, schema, template, workflow, design, and plan files are present. Confirm the existing dirty/untracked user files remain unstaged and untouched.

- [ ] **Step 8: Commit Task 5**

```text
git add .github/PULL_REQUEST_TEMPLATE.md .github/workflows/ci.yml tests/editorial-batch/cli.test.mjs
git commit -m "ci: require declared editorial batches"
```

---

## Final Verification

- [ ] Run `node --test tests/editorial-batch/*.test.mjs` and record total pass/fail counts.
- [ ] Run syntax checks for every new `.mjs` file.
- [ ] Run `git diff --check main...HEAD`.
- [ ] Run `git status --short` and distinguish task files from pre-existing user files.
- [ ] Inspect `git diff --stat main...HEAD` and the complete workflow/template diff.
- [ ] Verify no changes exist in `data/topics.js`, `data/refs.js`, `style.css`, `js/`, `version.json`, `sw.js`, or `index.html`.
- [ ] Do not claim completion until each command has fresh exit-code evidence.
