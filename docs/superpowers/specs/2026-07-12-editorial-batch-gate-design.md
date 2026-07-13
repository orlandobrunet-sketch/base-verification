# Editorial Batch Gate — Design

## Objective

Add a fail-closed, deterministic CI gate for every change to `data/topics.js` or `data/refs.js`. The gate proves that the actual diff matches an explicitly declared editorial batch. It does not replace medical review, editorial judgment, or human authorization.

## Scope

The first version includes:

- one machine-readable manifest per editorial PR;
- a zero-dependency Node.js validator that runs on Windows and Linux;
- automated checks for changed files, qids, question structure, references, counts, artifacts, and version synchronization;
- a pull-request template that exposes the medical and operational gates;
- unit and integration tests using Node's built-in test runner;
- integration with the existing `Quality Gates` job.

The first version does not interpret medical content, grant publication authorization, merge pull requests, or infer whether a Greptile comment is medically correct.

## Alternatives considered

### Inline Bash in GitHub Actions

This minimizes file count, but it is difficult to test locally on Windows and brittle for structured JavaScript data. Rejected.

### Zero-dependency Node.js validator

This provides one implementation for local and CI use, supports focused tests, and preserves the project's no-build approach. Selected.

### Dedicated GitHub App

This could enforce reviewer state and post annotations, but adds hosting, credentials, and maintenance beyond the immediate need. Deferred.

## Repository changes

### `scripts/editorial-batch-validator.mjs`

Command-line entry point. It accepts explicit base and head revisions and returns exit code 0 only when all applicable rules pass. Diagnostics identify the failed rule, affected file or qid, expected state, and actual state.

Proposed interface:

```text
node scripts/editorial-batch-validator.mjs --base <sha> --head <sha>
```

### `scripts/editorial-batch/`

Small modules with single responsibilities:

- `git-diff.mjs`: obtain changed paths and before/after file contents;
- `manifest.mjs`: locate, parse, and validate the batch manifest;
- `questions.mjs`: parse the one-question-per-line bank and compare qids;
- `references.mjs`: extract card IDs and reference consumers;
- `versions.mjs`: read and compare `version.json`, the service-worker cache key, and Sentry release;
- `rules.mjs`: apply the fail-closed policy and aggregate diagnostics.

Modules receive content and structured values rather than executing Git internally where practical. This keeps behavior testable without mocks.

### `docs/editorial/review-batches/manifest.schema.json`

Documents the manifest contract using JSON Schema. The runtime validator performs the required checks directly so CI does not need an additional schema-validation package.

### `.github/PULL_REQUEST_TEMPLATE.md`

Prompts the author to provide:

- batch name and manifest path;
- explicit user authorization;
- formal review status;
- Evidence, Pending Issue, Verdict, and Publication values;
- qid and FSRS decisions;
- expected counts and version;
- Greptile status or named fallback reviewer;
- confirmation that every thread was inspected before merge.

### `.github/workflows/ci.yml`

The existing `Quality Gates` job will fetch enough history to compare the pull-request base and head, then run the validator with the two GitHub SHAs. Existing checks remain unchanged.

## Manifest contract

Every PR that changes `data/topics.js` or `data/refs.js` must add or modify exactly one JSON manifest under `docs/editorial/review-batches/`. This includes technical and orthographic changes.

Required top-level fields:

```json
{
  "batch": "FARM-4A",
  "change_type": "medical_editorial",
  "expected_version": "12.65",
  "allowed_files": [],
  "questions": {},
  "expected_question_delta": 0,
  "refs_policy": "unchanged",
  "external_review": {
    "greptile": "required",
    "fallback_reviewer": null
  }
}
```

`change_type` is one of:

- `medical_editorial` — material medical or pedagogical change;
- `technical_only` — strictly technical or orthographic change without altered clinical meaning.

Each entry in `questions` declares one qid and an action:

- `rebuild` — qid exists before and after, with material changes;
- `refs_only` — qid exists before and after and only its `refs` array changes;
- `retire` — qid exists before and not after;
- `add` — qid does not exist before and exists after;
- `technical_only` — qid exists before and after with a declared non-clinical change.

Each question entry must state `preserve_fsrs`. It must be `false` for `retire` and `add`. A future schema version may add a separate reset mechanism; v1 does not reset FSRS automatically.

`refs_policy` is one of:

- `unchanged` — `data/refs.js` must be byte-identical;
- `declared` — card additions, modifications, or removals must be listed in a `references` object.

`external_review.greptile` is one of:

- `required` — the PR author asserts Greptile review is expected;
- `unavailable` — `fallback_reviewer` must contain a non-empty reviewer identity.

V1 validates this declaration but does not query or interpret GitHub review content.

## Validation rules

### Activation and manifest discovery

- If neither medical data file changed, the editorial manifest gate is not activated.
- If either changed, exactly one manifest must be added or modified.
- The manifest itself must be included in `allowed_files`.

### File scope

- Every changed path must be listed in `allowed_files`.
- Forbidden artifacts always fail, even if listed: ZIP archives; Playwright reports; test results; screenshots or traces under test-output directories; recognized scratch filenames.

### Question scope and actions

- The set of changed qids must equal the set declared in `questions`; unused authorization is not accepted.
- `rebuild`, `technical_only`, `retire`, and `add` must match before/after existence.
- `refs_only` must be deep-equal after removing the `refs` property.
- Undeclared additions, removals, reorder-driven mutations, or edits fail.

### Bank integrity

- Every question has a unique non-empty `qid`.
- Every question has exactly four alternatives.
- `ans` is an integer from 0 through 3.
- `q`, `exp`, `cat`, `diff`, and `refs` have the expected basic types.
- Every referenced card ID exists in `data/refs.js`.
- No reference card is orphaned after the change.
- Actual question-count delta equals `expected_question_delta`.

### Reference policy

- With `refs_policy: unchanged`, `data/refs.js` must be byte-identical.
- With `refs_policy: declared`, the changed card IDs must equal those declared in the manifest.
- Card removal is rejected while any question still consumes that card.

### Version policy

- Any activated editorial change must synchronize `version.json`, the cache key and version comment in `sw.js`, and the Sentry release in `index.html`.
- The synchronized value must equal `expected_version`.
- The version must differ from the base revision.
- The validator does not calculate semantic increments; the manifest declares the intended next version.

### External-review policy

- `required` accepts the manifest declaration for v1.
- `unavailable` requires a named fallback reviewer.
- Empty, missing, or contradictory review state fails.
- The PR template warns that zero threads is not evidence that Greptile ran.

## Data parsing

Questions are parsed from the established one-object-per-line format in `data/topics.js`. The parser accepts only lines that represent complete JSON question objects and reports malformed candidate lines. It does not execute repository JavaScript.

Reference IDs are extracted from the top-level card declarations in `data/refs.js` without executing the file. The extractor is tested against representative formatting from the real file. If the structure becomes ambiguous, validation fails rather than guessing.

## Error handling

The validator is fail-closed:

- missing base/head revisions, unreadable files, malformed manifests, ambiguous parsing, or Git errors produce a non-zero exit;
- all independently detectable rule failures are reported in one run;
- diagnostics avoid printing full medical records or secrets and show only the minimum relevant qid, path, or field.

## Testing strategy

Tests use `node:test` and temporary repositories or in-memory contents. Production behavior is implemented only after a corresponding test has failed for the expected reason.

Required scenarios:

1. valid rebuild-and-retire batch;
2. missing manifest;
3. multiple candidate manifests;
4. undeclared changed file;
5. undeclared qid;
6. declared qid that did not change;
7. valid and invalid `refs_only` changes;
8. incorrect question delta;
9. duplicate qid;
10. invalid alternatives or answer index;
11. missing reference card;
12. orphaned reference card;
13. forbidden artifact;
14. unsynchronized or unexpected version;
15. forbidden `refs.js` mutation;
16. declared reference-card changes;
17. Greptile unavailable without a fallback reviewer;
18. technical-only change with a mandatory manifest.

After focused tests, run the validator against a controlled fixture and run existing syntax and relevant CI checks locally where supported.

## Rollout

The new gate applies to pull requests created after it reaches `main`. Historical editorial Markdown manifests remain valid records and are not converted. The first future medical-data PR must create a JSON manifest under the new schema.

## Security and authority boundaries

- The validator never grants `Autorização de publicação: LIBERADA`.
- A passing check proves structural and scope conformity only.
- Explicit user authorization and formal `revisar-nefroquest` approval remain mandatory.
- No automatic merge is introduced.
- No external service receives repository content as part of this design.

## Acceptance criteria

- A PR touching either medical data file without a manifest is blocked.
- A PR containing an undeclared qid or file is blocked.
- A conforming declared batch passes locally and in CI.
- The validator runs with the Node.js runtime already used by CI and adds no production dependency.
- Existing application assets and medical content are unchanged by this feature.
