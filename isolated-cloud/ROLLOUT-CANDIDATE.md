# Durable chests on the 17.34 base

## Current status
PR 972 integrated the candidate with release 17.34 and shipped cache revision 17.37 with both flags off. The owner guard and its HTTP 409 conflict handling were validated in NefroQuest Chest Staging. The same two migrations are installed in production and verified with two disposable accounts. The 17.39 game enables `NQ_DURABLE_PROGRESS` and `NQ_OWNER_CLOUD_GUARD_VERIFIED` together on the official HTTPS origin.

The integrated migrations passed on three real PostgreSQL 17.12 clusters. Each concurrent claim left one committed reward. The staging change replaces the database retry signal with HTTP 409 while preserving the guard checks. The browser recognizes both conflict codes during the rollout. Cold-start tests verify that pending receipts and old progress can be read while the library is still loading. Delivering a scroll still requires its catalog entry.

The 17.36 candidate passed the chest and account-switch flow in desktop Chromium, Android emulation and iPhone emulation with real staging sessions. The 17.37 candidate additionally preserves the protected save at defeat and victory closure. The bonus question reopens the same journey and presents its pending chest. Tests cover the takeover of an empty legacy logout marker and preservation of earlier data when a handoff cannot be verified.

Revision 17.38 adds recovery when a 17.34 tab writes a valid save for the same account after the protected journey opens. On reopen, the app appends the four exact legacy storage values to the account's local archive and records the new guard in the same commit. The protected journey, collections and reward receipts remain intact. Its last confirmed cloud revision has its own key. Players can download the old copy under Jornadas arquivadas. The archive stays on the original device.

Revision 17.39 preserves the resume flow for devices that only hold the old save key, a format used before 15.92. That page can resume and write the first canonical save locally. Cloud synchronization waits for a reload, when the compatible save can open under the protected flow. Devices with an existing protected record stay on the protected path.

## Remaining activation gates (do not skip)
1. Test full browser candidate, not only focused local mocks.
2. Multi-epoch linear offline transitions now have client/SQL-verified transition journals. Unproven snapshots remain rejected. True divergence has explicit local-offline/remote-archive choices. Remote adoption now uses a recoverable exact auxiliary projection and releases its sync hold only on complete readback. Archived branches can be restored explicitly with snapshot/auxiliary/journal recovery. Restored divergence remains local until a new cloud choice; local-over-remote replacement remains deliberately unsupported. Real-browser and hosted-auth verification are still required.
3. Validate owner RLS, session refresh, account changes and CAS with synthetic accounts in NefroQuest Chest Staging. Keep credentials out of the repository and the test evidence. Use only staging for these account tests.
4. Confirm the tested revision includes the current main. Verify the frontend and both database migrations against the candidate before deployment. Verify an already-open 17.34 tab and an installed web app across the rollout. The old tab can retain its original script after the service worker updates.
5. Only after gates: deploy SQL first, verify it under synthetic authenticated owner/other-owner sessions, then enable matched client flags as one coordinated release. Run chest/reload/account checks again on that exact build.

## Offline regression coverage
- Two offline journeys retain their exact local authority after reload and unchanged-ancestor read.
- Reset followed by a new offline journey cannot resurrect discarded articles or knowledge.
- Changed remote branches fail before local collection, statistics or receipt effects.
- Multiple epochs and transition+reward snapshots with a valid transitionPath are accepted by client and SQL, exactly once. Missing, reordered, adulterated or excessive proofs are rejected without modifying remote version or payload.
These are safety tests, not proof that offline multi-journey reconciliation is implemented.

## Rollback
Before any authority row exists, leaving flags OFF keeps legacy operation. After activation, existing authority rows reject legacy downgrade by design. Do not drop the trigger or switch clients to legacy writes as a rollback. Freeze cloud writes, preserve exports/backups, and use a reviewed forward-compatible recovery plan. Never force a new base or copy/union receipts to make a rejected snapshot pass.

## Packaging
Include isolated-authority/recovery/cloud test directories (CI imports them), six JS modules and their loader/cache entries, migration, and regular regressions. Exclude disposable `browser-server.cjs`, ad-hoc chest browser configs, local browser results and external evidence archives from a final publication unless deliberately adopted into the test harness. No medical content changed.

## Updated offline protocol (2026-11-15)
- Local transition journal records before/after snapshots atomically with each journey/reset.
- Maximum64 transitions, no silent truncation. Cloud evidence maximum129 states.
- The journal is not a replay queue: only the final state is committed after all edges validate.
- Matching remote reread confirms current state before clearing the journal. Version-only CAS acknowledgement does not clear it.
- Divergence UI refetches and rebuilds a decision after deferred local play; stale confirmation never selects automatically. Session reset clears stale deferment.
- Remote adoption preserves local semantic state, offline journal and captured auxiliary progress in a local archive. It stages an auxiliary projection intent; the hold is removed only after every selected auxiliary value is verified. Interrupted projection resumes before gameplay becomes writable.
- No automatic/local-over-remote authority overwrite path is introduced.
