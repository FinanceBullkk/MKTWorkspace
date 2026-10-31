# P4-09 Disposable rollback rehearsal

Date: 2026-08-30 (ICT)
Status: **DISPOSABLE DRILL EXECUTED; QUALIFIED PASS WITH A HEALTHCHECK PREREQUISITE**

## Executive summary

- **Scope:** Rehearsed the recorded Lane A tuple without changing Railway production.
- **Tuple:** prior deployment `3621f603-1c51-4246-824c-55cc0e6b5764`, prior source
  `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa`, migration action `npx prisma migrate deploy`.
- **Recovery evidence:** the recorded pre-merge dump restored into a new local PostgreSQL
  database; the candidate migration was applied there; the exact prior source rebuilt and started
  against both pre- and post-migration schemas; the prior migration command reported no pending
  migrations; disposable databases were dropped and verified absent.
- **Important finding:** the prior source does not contain `/api/healthz`. It returned HTTP 404 in
  the rehearsal, while the current Railway service setting is `/api/healthz`. A real rollback must
  change/select a prior-compatible healthcheck setting before or with the human-approved rollback.
  This setting was not changed in production.

## Safety boundary and environment

- Railway commands were read-only: deployment listing, status, bounded historical log query, and
  GET `/api/healthz`. No `railway redeploy`, deploy, migration, setting update, or rollback ran.
- Final production post-check (15:26:13 ICT): active deployment remained
  `ed972e5b-7597-4c6d-8066-24bc11c4ea0b`, commit
  `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`, status `SUCCESS`; `/api/healthz` remained HTTP 200,
  `ok=true`, `status=ready`, Relay 16.
- Disposable target: local PostgreSQL 17.10 on `localhost:5432`; generated database names began
  `mkttool_p409_` and were dropped after each run (`CLEANUP_REMAINING=0`).
- Prior source was extracted from the exact commit into a temporary directory outside Git. Node
  `v22.23.1` was used for install, build, Prisma generation, and runtime. No secret values are in
  this report. The production dump remains outside Git and contains encrypted operational data.

## Recorded tuple verification

Read-only `railway deployment list --service mkttool-web --environment production --limit 1000
--json` located the recorded deployment:

| Field | Observed |
|---|---|
| Deployment ID | `3621f603-1c51-4246-824c-55cc0e6b5764` |
| Historical status | `REMOVED` (not selected or changed) |
| Created | `2026-08-22T13:15:57.715Z` |
| `meta.commitHash` | `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa` (exact match) |
| Image digest | `sha256:1e4f6879bafa3d41ca4a4f9c79b2ca78716cb0ff7b2e3094b35d17e566bac965` |
| `meta.serviceManifest.deploy.preDeployCommand` | `npx prisma migrate deploy` (exact match) |
| Historical healthcheck path/timeout | `null` / `null` |

The current service-instance query (read-only) reported `healthcheckPath=/api/healthz` and
`healthcheckTimeout=null`. This is a service setting, not restored by a deployment image rollback.

## Backup and restore evidence

### Fresh current-database backup (read-only production operation)

| Event | ICT timestamp |
|---|---:|
| `npm run db:backup:remote` start | `2026-08-30T15:07:22.0826377+07:00` |
| end | `2026-08-30T15:07:44.6573477+07:00` |
| duration | **22,575 ms** |
| result | exit 0; 116 rows in 15 tables; completion trailer present |

Dump: `MKTTool/data/backups/mkttool-prod-20260830-150725.sql`
Size: 65,419 bytes
SHA-256: `63cb2dda4ba18be54f59c1f3ec6c35a4c2dd40890361a6188e9a9cf4db1d5308`

The full `db:restore:verify` against this current dump returned `PASS`, source/restored aggregate
total 101/101, `mismatches=[]`, `cleanup=PASS`:

- start `2026-08-30T15:08:06.3380224+07:00`;
- end `2026-08-30T15:08:14.2372794+07:00`;
- duration **7,897 ms**;
- receipt outside Git: `%TEMP%\mkttool-p409-restore-7db74f1a6ce046118c6456f211de9474.json`,
  SHA-256 `d18b9cdd85f54622fa9f2cf28f6d9364b1d53e98d515dc713ddf1d12056adfa2`.

### Recorded pre-merge dump used for the rollback sequence

Dump: `MKTTool/data/backups/mkttool-prod-20260830-101918.sql` (64,270 bytes; previously recorded
pre-merge dump; 14 migrations). A raw `psql -v ON_ERROR_STOP=1` restore into disposable database
`mkttool_p409_20260830082748_4305` returned exit 0:

- database creation: `2026-08-30T15:27:48.046+07:00` to `15:27:48.303+07:00`;
- raw SQL restore: `15:27:48.303+07:00` to `15:27:48.570+07:00`;
- raw restore duration: **267 ms**;
- migration table count after restore: **14**; `RateLimit` table absent;
- cleanup: `15:28:25.969+07:00` to `15:28:26.071+07:00`, `CLEANUP_REMAINING=0`.

The raw restore timing is intentionally distinguished from the 7,897 ms full verifier timing,
which also performs aggregate/hash comparison and cleanup.

## End-to-end disposable rollback sequence

The following sequence models `candidate -> prior deployment` while keeping every operation local.

1. **Restore prior schema/data.** The recorded 14-migration dump restored with
   `ON_ERROR_STOP=1`, exit 0, raw duration 267 ms.
2. **Apply candidate migration.** From the current candidate source, `npx prisma migrate deploy`
   applied exactly `20260830030000_add_better_auth_rate_limit` to the disposable database:

   - start `2026-08-30T15:27:55.405+07:00`;
   - end `2026-08-30T15:28:07.458+07:00`;
   - duration **12,053 ms**;
   - exit 0, `15 migrations found`, `All migrations have been successfully applied`.

   Post-migration query: 15 migration rows, `RateLimit` table present, zero rows.

3. **Rebuild prior artifact.** Exact `c819e6a8…` source and lock were extracted to a temporary
   directory. After a clean `npm ci --ignore-scripts` and `npm run db:generate`, `npm run build`
   completed under Node 22.23.1:

   - build start `2026-08-30T15:19:32.677+07:00`;
   - end `2026-08-30T15:19:52.328+07:00`;
   - duration **19,651 ms**, exit 0;
   - Next route listing contains no `/api/healthz`, as expected for this commit.

4. **Run the recorded migration action from the prior source.** Against the post-candidate
   disposable schema, exact `npx prisma migrate deploy` reported:

   - start `2026-08-30T15:27:17.874+07:00`;
   - end `2026-08-30T15:27:19.227+07:00`;
   - duration **1,353 ms**, exit 0;
   - `14 migrations found`; `No pending migrations to apply`.

   The same command against the pre-migration disposable schema also returned exit 0 and
   `No pending migrations to apply` (1,353–1,432 ms across the two runs). This confirms the
   prior artifact does not try to undo or reject the newer additive migration.

5. **Start prior artifact and probe readiness.** `next start` stayed alive against the
   post-candidate disposable database. Probe timestamps:

   - start request `2026-08-30T15:28:19.598+07:00`;
   - root `/` HTTP **307** (login redirect) in 18 ms;
   - `/login` HTTP **200**;
   - `/api/auth/get-session` HTTP **200**, body `null` (no session);
   - `/api/health/run` GET HTTP **405** (method not allowed);
   - `/api/healthz` HTTP **404**;
   - process was stopped at `2026-08-30T15:28:20.132+07:00`.

   The same 404 was reproduced against the untouched 14-migration disposable restore. Therefore
   the result is source/route behavior, not migration damage.

6. **Cleanup.** The post-migration disposable database was dropped at
   `2026-08-30T15:28:25.969+07:00`; the cleanup query returned `CLEANUP_REMAINING=0`.

## Hypotheses tested

1. **Prior binary cannot read the current schema.** *Eliminated.* It built, started, and its exact
   migration command returned no pending migrations against both 14- and 15-migration disposable
   schemas.
2. **Prior deployment cannot be reproduced from the recorded source.** *Eliminated after clean
   setup.* An initial attempt was interrupted while dependencies were still being installed and
   emitted `Cannot find module '@tailwindcss/postcss'`; a complete clean `npm ci` followed by
   generation made the exact prior source build pass. The first error is an environment/setup
   signature, not a tuple incompatibility.
3. **Rollback would be healthy under the current Railway service setting.** *Confirmed false.*
   The prior source has no `/api/healthz`; local runtime returned 404, while the current
   service-instance setting is `/api/healthz`. Deployment image rollback does not restore that
   setting.

## Failure-at-step signatures

These are the stop conditions to use in a real owner-approved recovery. Signatures marked
“observed” were reproduced in this disposable run; the others are the runbook's explicit halt
conditions.

| Step | Failure signature | Required response |
|---|---|---|
| Tuple lookup/identity | Missing deployment ID, `meta.commitHash` differs from `c819e6a8…`, or pre-deploy command differs from `npx prisma migrate deploy` | Stop; do not select a deployment by position or latest status |
| Fresh backup | Non-zero `db:backup:remote`, no exactly-one new `mkttool-prod-*.sql`, zero-byte dump, or missing completion trailer | Stop; retain prior known-good backup; never choose an older file by guess |
| Dump validation/restore | **Observed:** `Dump is missing the PostgreSQL completion trailer; it may be truncated.` and exit 1 for a 1,000-byte truncated copy. `psql` with `ON_ERROR_STOP=1` non-zero is the general SQL failure signature | Stop; treat target as contaminated and require cleanup/admin review |
| Candidate migration | Prisma non-zero exit / `Error: Schema engine error:` on an unavailable disposable DB (observed); migration SQL error or timeout | Stop; do not invent a down migration or touch production |
| Prior migration compatibility | Pending migrations, Prisma schema error, or non-zero `npx prisma migrate deploy` | Stop; prior image is not safe against current schema; return decision to owner |
| Artifact/build | Non-zero build, missing dependency, or missing expected output | Stop; do not call a source checkout a deployable prior artifact |
| Process startup | No “Ready”/child exits before probe, port unavailable, or runtime error | Stop; do not proceed to traffic-changing action |
| Readiness route | **Observed:** prior `/api/healthz` HTTP 404; root 307 is not the required 200 readiness contract; `/api/health/run` GET 405 | Change/select a prior-compatible healthcheck setting under owner approval, or stop. Do not assume image rollback changes service settings |
| Post-rollback identity | Railway status not `SUCCESS`, deployment metadata commit not the approved prior SHA | Stop and escalate; no further rollback/redeploy guessing |
| External readiness/Relay | `/api/healthz` not 200/ready, database not `ok`, or authorized full Relay GET non-200/byte/hash mismatch | Stop; retain `MIN_RELAY_VERSION=13`; do not strand devices |
| Log review | Bounded target-deployment logs unavailable, migration errors, or shared-IP warning present | Treat evidence as OPEN/failed; do not claim recovery |
| Cleanup | Disposable DB drop fails or remaining-database query is non-zero | Isolate contaminated target; have administrator remove it; drill is not complete |

## Result and owner action

- **P4-09 disposable restore/redeploy rehearsal:** executed with bounded local evidence; database
  restoration, candidate migration, prior source build/start, compatibility check, and cleanup
  passed.
- **Production rollback:** not executed and remains human-approved only, as required.
- **Operational prerequisite before any real rollback:** the owner must decide and document a
  healthcheck path that the prior image serves with HTTP 200, or temporarily adjust/disable the
  service healthcheck before selecting the historical deployment. Verify the setting after the
  rollback because Railway does not restore it from the image.
- Keep the current production setting and Relay floor unchanged until that owner-approved plan is
  executed; this drill made no production setting or data changes.

## Unresolved questions

- Which prior-compatible unauthenticated HTTP 200 route should be the approved temporary Railway
  healthcheck (`/login` returned 200 locally but is not yet an owner-approved operational choice)?
- Can Railway apply the healthcheck setting atomically with the human-approved historical
  deployment selection, or must the owner perform two ordered dashboard/API actions?
- Whether the historical prior image exposed any runtime-only route not present in the recorded
  source checkout; local source and build evidence show no `/api/healthz` route.
