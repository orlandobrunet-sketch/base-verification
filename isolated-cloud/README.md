# Owner authority cloud integration (not deployed)

`owner-authority-guard.sql` is a local candidate migration. It must be reviewed/applied before enabling cloud authority writes. No remote SQL was executed. It assumes the existing `game_progress_version` CAS trigger and does not replace RLS, authentication, or CAS.

Payload: `profiles.game_progress.ownerAuthority = {format:'nq-owner-authority-v1', base: string|null, state:{protocol,owner,resetEpoch,save,collections,receipts,tombstone}}`.

`base` is the canonical snapshot fingerprint of the **last confirmed remote authority state**, not the new local state. Server parses it as JSON and compares against previous `state`. Local `importCloud` compares the string to its own canonical snapshot. Do not regenerate a base after conflict to force acceptance; fetch and resolve/reject divergence. First upgrade from legacy cloud has no authority ancestor and is an explicit migration boundary; host must reconcile the legacy save before enabling upgrade.

Browser helper `NQCloudAuthority.build(authority, legacyProgress, {serverGuardVerified:false,base:null})`:
- default false rejects CLOUD_GUARD_REQUIRED;
- uses exportCloud and removes competing save/articles/knowledge keys;
- preserves unrelated stats keys.

`NQCloudAuthority.merge(authority, cloud, {serverGuardVerified:false})`:
- default false rejects;
- rejects legacy payload instead of importing it over authority;
- atomically imports ownerAuthority before any other merge side effect;
- returns `{state,remaining}`. Reload in-memory save/collections from state. Legacy merge may only process remaining; do not re-enter its save/article branches.

`_buildCloudProgress` must call build only after local authority exists and the deployed server protocol has been independently verified. `_mergeCloudProgress` must call merge before writing any legacy progress. A conflict must not fall through to union/timestamp logic. Existing `_commitCloudProgress` CAS still applies and should only acknowledge the base after server success.

Epoch handling: same-epoch receipts/collections are monotonic. Each epoch +1 remains a clean reset snapshot (null save, empty receipts/collections) or new journey snapshot (empty receipts, preserved collections). Offline transitions now persist an atomic local `{before,after}` journal. Export supplies `transitionPath` (1–129 states, final equal to `state`), and client/SQL validate every edge under these unchanged rules. A single CAS stores the final snapshot; intermediate steps never replay reward reducers. The local journal holds at most64 transitions and refuses excess without truncation. It is cleared only when an actual remote reread exactly confirms the current semantic state, not on CAS version-only acknowledgement.

Real divergent branches are not treated as linear descendants. `authority-cloud-decision.js` offers explicit keep-local-without-sync or adopt-remote-with-local-archive choices. It validates local fingerprint and refetched remote version/full payload. Remote adoption atomically archives local snapshot, transition journal and available auxiliary progress; it preserves the remote receipts as-is. Remote adoption now stages a durable auxiliary-projection intent alongside the selected branch. Ten fixed local keys are replaced exactly (including false/empty values), never unioned. Gameplay and upload remain blocked until every write is read back and the intent is cleared. Bootstrap retries an interrupted projection idempotently; owner/lease/source/authority and captured before-or-target bytes are checked before each write. Unrelated external changes fail closed. The old branch, exact auxiliary bytes and transition journal remain archived. After successful projection, normal sync can resume from the confirmed remote checkpoint. No remote branch is overwritten by this selection. Replacing a divergent remote with local is deliberately not supported by this guard.

Tests run embedded PostgreSQL (PGlite), actual existing CAS migration and candidate trigger, under authenticated role + RLS. They cover malformed owner/schema, downgrade, receipt changes/removal, collection regression, stale reset, divergent ancestor, version rejection and another-owner RLS. This is not a multi-connection real PostgreSQL concurrency test.

## First divergent legacy migration: explicit choice only

`js/legacy-cloud-decision.js` deliberately rejects any remote progress already containing `ownerAuthority`.

1. `prepare(authority, {version,progress}, {normalizeLegacy})` captures local fingerprint, remote version+payload and normalized remote save/collections. Normalizer must validate owner/question presentation/catalog and return `{save,collections,knowledgePolicy}`. Since legacy cloud omitted accumulated knowledge, policy must be explicit and displayed; preserving verified same-account local knowledge is possible, but do not infer/replay chest rewards.
2. Show both complete branches and warn that the nonselected branch is archived, not unioned. `token.local`, `token.remote` and `token.warning` provide material for the UI. No choice is made automatically.
3. On explicit button click, refetch cloud and call `choose(authority,token,'local'|'remote',freshRemote)`. It rejects any changed local fingerprint/version/remote bytes. Both branches plus intended choice are archived durably before returning a plan. No remote state is changed here.
4. Suspend gameplay/progress mutations while CAS runs. Upload `plan.ownerAuthority` using `plan.expectedVersion`, after server-guard verification. Other progress fields must follow the selected branch, not the old array-union merge. This is a first migration; payload base is null and server legacy row permits initial authority installation.
5. On confirmed CAS result (version +1 and exact payload), call `finalize(authority,plan,{version,progress})`. Local choice leaves data untouched. Remote choice installs save+collections as one transaction, clears old pending receipts, advances epoch and retains the archive. A failed CAS must not call finalize.
6. After interrupted response/reload, `recover(authority,confirmedRemote)` validates the durable intended payload/version before installing it. If local changed while request was in flight, it fails closed rather than overwriting new play; surface reconciliation status. Do not claim success merely because a request was submitted.

This helper intentionally does not provide a way to overwrite a remote authority envelope with a token meant for legacy migration. Its archive is local; it is not sent in cloud authority snapshots.

## Archived branch recovery
The cloud status exposes “Jornadas arquivadas”. Opening the list or preview is read-only. Explicit restore swaps the selected archived local branch with the current branch in the same archive slot, restoring its save, collections, receipts, transition journal and exact auxiliary bytes without rerunning reward effects. Archive and decision tokens verify both semantic and auxiliary fingerprints. A restored divergent branch remains local until a new explicit cloud decision; this is not permission to overwrite remote authority or manufacture a new ancestor. Reset/logout closes the archive dialog and its focus trap immediately.

Projection limits are explicit: pure incoming auxiliary JSON is bounded to1MiB; captured raw projection maps must fit2,000,000 serialized characters. Oversized originals are rejected before installing a new branch or intent, never truncated. Interrupted writes retain the archive and recoverable intent. An uncooperative external writer changing a captured key causes conflict instead of being deliberately overwritten. All normal writers still require the same session lease; localStorage is not a cross-client database transaction.
