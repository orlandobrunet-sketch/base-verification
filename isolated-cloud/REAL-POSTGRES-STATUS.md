# Real PostgreSQL concurrency: PASSED (2026-11-15)

## Revalidation of transitionPath candidate (2026-11-15 13:00 UTC)

The UPDATED canonical migration `20261115150000_guard_owner_authority_progress.sql` also passed **3/3 fresh real PostgreSQL 17.12 clusters**. The runner now uses that canonical migration and the actual browser `createAuthority` export/import module.

In each run, in addition to all original concurrency/CAS/downgrade/reset/RLS assertions:
- A seven-state proof covers multiple journeys, a reward, reset, new journey and new reward.
- Six corrupt proof variants are rejected by BOTH browser import and PostgreSQL, with no partial state/version effect.
- Another owner's proof update is denied by RLS.
- Two real independent sessions compete for the same proof update; an observer confirms a row-lock wait; only the winner changes the row, and the loser returns zero rows.
- Exact response-loss replay preserves score=20, knowledge=2 and one receipt (`c1`), without resurrecting pre-reset reward `b1`.
- The SQL result equals the peer browser module's imported state.

Frozen source hashes:
- Guard: `0a02c2f0cc32950c1c0ed79b5f88659973aa96448ebebf96306885dc9234d0f3`
- Canonical migration: `dbb7e013dcca3b3869124b8cb4bfb77fd2a67bd1c58051c980c481268fbec942`
- Browser authority module: `f61f02e26fbf9a126b61bb850c7e91f67185e67009492bb7674e8679b2a5a817`
- Extended runner: `ced61c8b19e2f1821e8be67465181704d2cd43dc24c4933774b41afaceedf3af`

Evidence: retained local transition-protocol test artifacts (runs 1–3, result JSON, shutdown logs, signatures, input hashes, cleanup verification). Official source and build dependencies were verified as above. All three clusters stopped, TCP listeners verified closed, and source/runtime/build dependencies removed. No production or application SQL was changed by this test. The unit gate remains 1 pass + 1 intentional manual integration skip; real integrations passed separately.

## Earlier candidate execution
- PostgreSQL 17.12 built from official source in the cloud under /tmp, with explicit user approval, then removed.
- Three fresh independent disposable clusters passed the real integration runner (runs 3, 4, 5). No production or remote database accessed.
- All three observed two distinct real backend PIDs and an actual row-lock wait before releasing the winning transaction.
- Six assertions passed in every run: one claim commits; second CAS affects zero rows; score/article/knowledge/receipt credited once; legacy downgrade denied; stale reset rejected; another owner denied by RLS.
- Runner syntax/unit guard: 1 pass, 1 intentional manual-integration skip. The skip is not a PostgreSQL failure or substitute for the three real runs.

## Provenance
- Source: https://ftp.postgresql.org/pub/source/v17.12/postgresql-17.12.tar.bz2
- SHA-256 matched https://ftp.postgresql.org/pub/source/v17.12/postgresql-17.12.tar.bz2.sha256 (checksum file retained with evidence).
- Build-only bison/flex/m4 packages came from Debian's official deb.debian.org archive. Package SHA-256 values matched Packages.xz; that index's SHA-256 matched InRelease; InRelease signatures verified against the pre-existing Debian archive keyring (Bookworm archive, Trixie archive and Trixie release signatures).
- Dependencies were only extracted into a temporary directory. No system package installation, services, firewall or persistent PATH changes.

## Runner fixes found by first real execution
1. Disable unused Unix-domain sockets (`unix_socket_directories=''`). This environment permitted TCP loopback but rejected Unix socket creation. Test clients already use explicit 127.0.0.1 only.
2. Remove inherited PGSERVICE/PGSERVICEFILE variables rather than setting them to empty strings: libpq treats an empty PGSERVICE as a request for a missing service file.
The first two attempts failed only for these runner environment issues. All final test assertions passed three times after the fixes. No application or SQL changes were needed.

## Safety and cleanup
Fresh synthetic profiles only; randomized temporary SCRAM password; selected ephemeral loopback port; server stopped in finally. Shutdown logs and absent postmaster PID/password files checked for all five attempts. All disposable clusters, source, runtime and temporary build dependencies removed. Logs and result JSON retained.

Evidence: retained local concurrency test artifacts

## Scope / remaining gate
This validates the candidate CAS/owner-authority SQL under real concurrent PostgreSQL connections. It does not deploy that SQL, turn on application feature flags, establish production migration readiness, or replace end-to-end cloud/auth rollout checks. No commit, PR, merge, release or production migration performed.
