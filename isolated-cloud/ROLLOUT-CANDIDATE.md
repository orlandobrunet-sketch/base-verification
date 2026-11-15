# Durable chests: release candidate 17.22 (not published)

## Current status
The SQL migration is prepared at `supabase/migrations/20261115150000_guard_owner_authority_progress.sql`. It includes the byte-identical audited guard plus a transaction and CAS prerequisite checks. It has not been applied remotely. Both NQ_DURABLE_PROGRESS and NQ_OWNER_CLOUD_GUARD_VERIFIED remain OFF. Version/cache preparation does not activate the feature.

Real multi-connection PostgreSQL verification passed three independent clusters for the PREVIOUS guard. The transitionPath guard was subsequently rerun successfully on three real PostgreSQL17.12 clusters; see real-postgres-transition/RESULTS.md. SQL is unchanged in the auxiliary-projection stage. These results do not certify the new browser projection/UI or hosted auth. See REAL-POSTGRES-STATUS.md for historical evidence.

## Remaining activation gates (do not skip)
1. Test full browser candidate, not only focused local mocks.
2. Multi-epoch linear offline transitions now have client/SQL-verified transition journals. Unproven snapshots remain rejected. True divergence has explicit local-offline/remote-archive choices. Remote adoption now uses a recoverable exact auxiliary projection and releases its sync hold only on complete readback. Archived branches can be restored explicitly with snapshot/auxiliary/journal recovery. Restored divergence remains local until a new cloud choice; local-over-remote replacement remains deliberately unsupported. Real-browser and hosted-auth verification are still required.
3. Validate actual intended staging schema, owner RLS, auth refresh/account changes and CAS using synthetic accounts and a separately approved staging endpoint. No approved endpoint or credentials are bundled here. Never use production as a substitute.
4. Recheck main and other active executors; candidate currently bases on 434924dafb6797aca788f54f18fd3421be630285.
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

## Draft CI branch only
This candidate shares provisional version17.22 with independent PR971. It must be rebased and renumbered before any integration. This draft authorizes GitHub CI only: no merge, production deployment, remote migration or activation. Both feature gates remain OFF.
