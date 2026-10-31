---
phase: 5
title: "production-security-hardening"
status: partial
priority: P1
effort: "3–5 days (including backup/restore and staged configuration review)"
dependencies: [1]
---

# Phase 5: production-security-hardening

> **Historical predecessor hardening phase — superseded by current P4a evidence.** Its old proxy,
> healthcheck, and deployment observations predate the successful master deployment. Current residuals
> are the bounded credentialed smoke and rollback rehearsal; Q15/Q16 status is in the successor plan.

## Overview

Harden the MKTTool source/configuration that will be included in the final release and prepare the
Railway change set. The final deploy happens only in Phase 4 after this phase's changes are frozen
and signed. Close the production controls that the audit found open: health/readiness visibility,
trusted-proxy rate limiting, durable rate-limit storage, Prisma/deepmerge risk, one-seat enforcement
within the stated local/vendor boundary, backups, Web/Facebook safety, and rollback. This phase can
support Lane A independently; it must not waive Browser identity or human/vendor gates.

## Requirements

- Functional: production exposes a non-sensitive liveness/readiness signal and an authenticated
  release/provenance view that identifies the deployed commit and candidate ID.
- Functional: Better Auth receives a verified client IP from Railway's actual proxy path; different
  clients receive separate buckets, malformed/spoofed forwarded headers cannot bypass limits, and
  the warning is gone.
- Functional: rate-limit state is appropriate for the deployment topology (memory is not durable
  across restart/replicas). If memory is retained for a narrowly scoped Lane A pilot, the exception
  must name the one-replica limit, expiry, monitoring, and migration date; Lane C cannot inherit it.
- Functional: the server enforces the account/profile/device invariant and the Browser's local
  license-key pool enforces the one-seat cap; a second key cannot silently consume a vendor request
  or advertise unsupported concurrency. The server must not receive or store operator license keys.
- Security: resolve `deepmerge-ts` HIGH finding through a patched dependency/isolated CLI path, or
  record an owner-approved, expiring risk acceptance with compensating controls.
- Operational: remote backup and restore are proven before migration/deploy; rollback is rehearsed.

## Architecture

```text
trusted Railway edge -> MKTTool auth/API -> Prisma/Postgres
       |                    |                 |
       |                    +-> durable rate-limit store (DB/approved secondary)
       +-> health/liveness  +-> candidate provenance

MKTTool server vault key != Relay operator vault key
one vendor seat -> one assigned device/profile -> one static proxy/account
```

Never derive the trusted client IP from a header that an end user can set. First observe Railway's
actual forwarding chain with a temporary sanitized diagnostic, then configure the exact header or
proxy CIDR. Use Better Auth's `advanced.ipAddress.ipAddressHeaders`/`trustedProxies` semantics and
consider its IPv6 subnet control. Reference: [Better Auth
security guidance](https://better-auth.com/docs/reference/security).

Verified against the installed build (`better-auth ^1.6.25`): both
`advanced.ipAddress.ipAddressHeaders` and `advanced.ipAddress.trustedProxies` exist, and
`dist/api/rate-limiter/index.mjs` emits the exact shared-bucket warning the audit observed when
neither is set. `MKTTool/src/lib/auth/auth-server.ts` currently declares **no** `ipAddress`,
`rateLimit`, or `storage` options at all, so production is running Better Auth defaults: an
in-memory limiter keyed on a single shared bucket. The remedy below is implementable as written.

The Prisma finding is contextual: the advisory describes stack exhaustion for crafted recursive
graphs ([GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)); Prisma's own
issue says the current call site is its developer-controlled config path and proposes an override
or upstream bump ([Prisma #30052](https://github.com/prisma/orm/issues/30052)). Verify this locally;
do not dismiss it solely because normal request JSON is plain.

## Related Code Files

| Repository/path | Action | Purpose |
|---|---|---|
| `MKTTool/src/lib/auth/auth-server.ts` | Modify/test | Explicit Better Auth IP headers/trusted proxies, rate-limit settings, and storage. |
| `MKTTool/src/lib/auth/require-actor.ts` and `guarded-route.ts` | Verify/test | Auth/role gates remain fail-closed. |
| `MKTTool/src/proxy.ts` and `src/lib/http/same-origin-guard.ts` | Verify/test | Origin/host checks are not confused with client-IP trust. |
| `MKTTool/src/app/api/auth/[...all]/route.ts` | Verify | Auth route receives the real trusted header. |
| `MKTTool/src/lib/ops-alerts/*` | Modify/extend | Alert on rate-limit/IP, backup, scheduler, and release drift. |
| `MKTTool/src/lib/db/database-backup.ts`, `backup-source.ts` | Run/test | Remote backup (plain SQL dump, restorable with `psql -f`). |
| `MKTTool/scripts/restore-database-verify.ts` | **Create** | No restore tooling exists today — only printed hints at `scripts/backup-database.ts:80-82`. This script must create a disposable database, apply the dump, and emit row-count/checksum comparison output. Add it as `db:restore:verify` in `package.json`. |
| `MKTTool/prisma.config.ts`, `MKTTool/prisma/schema.prisma`, `MKTTool/package.json`, `package-lock.json` | Modify/test | Prisma/deepmerge patch and optional durable rate-limit schema/migration. |
| `MKTTool/prisma/migrations/*` and Better Auth schema-generation output | Create/modify if DB storage chosen | Durable rate-limit table and migration/rollback compatibility. |
| `MKTTool/src/lib/setup/*`, `src/components/setup/*` | Modify/test | Server account/device invariant and candidate metadata shown to operators. |
| `MKTBrowser/apps/desktop/src/renderer/src/components/screens/AdditionalLicenceKeys.tsx` | Modify/test in P3-owned Browser change | Local one-seat UI/pool boundary; no operator keys cross to MKTTool. |
| `MKTTool/src/lib/relay/*` and ticket issuance paths | Verify/test | Server floor, ticket recipient binding, and release tuple. |
| `MKTTool/Dockerfile`, Railway service settings, `docs/deployment-guide.md` | Modify/verify | Healthcheck, predeploy migration, and safe service-specific deployment. No `railway.json` exists today; discover/configure the service setting explicitly. |
| `MKTTool/src/app/api/healthz/route.ts` | **Create (new route only)** | Non-sensitive liveness/readiness endpoint. Must NOT reuse or nest under the existing `api/health/*` tree, and must NOT be wrapped in `guardedRoute`. |
| `MKTTool/src/app/api/health/run/route.ts` | Read only — do not repurpose | Existing authenticated per-account probe (`guardedRoute`, same-origin guard, `maxDuration = 120`, opens a browser). Pointing Railway's healthcheck at it would fail on auth and time out. |
| `plans/260829-2125-internal-product-readiness/reports/production-deploy.md` | Create | Sanitized backup, deploy, smoke, and rollback evidence. |

## Implementation Steps

1. Select the exact MKTTool source/config change set that will be handed to Phase 4. Confirm it
   contains the Relay floor/pin/copy changes intended for production and record the current Railway
   tuple as rollback (`c819e6a8dff5cac027d24b4a9d488ec241e2ccaa`, deployment ID, region, replica
   count, and schema state). Do not claim it is the final signed candidate yet.
2. Run `npm run db:backup:remote` before any schema/dependency deployment. Verify the dump is
   encrypted/permissioned outside Git.

   **Build the restore path first — it does not exist.** `scripts/backup-database.ts` only prints
   restore hints (`createdb -U postgres mkttool_restore_test`, then
   `psql -U postgres -d mkttool_restore_test -f <dump>`); there is no restore script, so P5-02 has no
   tool behind it today. Write `scripts/restore-database-verify.ts`, wire it as `db:restore:verify`,
   and have it: create a disposable database, apply the dump, run per-table row counts and column
   checksums against the source, print a pass/fail summary, and drop the database. It must compare
   aggregates only — never print record contents. Record restore duration and result.
3. Create a **new** liveness endpoint at `api/healthz`. Do not reuse the existing `api/health/run`
   route: it is `guardedRoute`-wrapped, same-origin guarded, and `maxDuration = 120` because it opens
   a browser per account — Railway's healthcheck would be rejected on auth and would time out. The
   new route must be unauthenticated, sub-second, and must not leak account, proxy, ticket, or secret
   data.
   Define readiness dependencies explicitly (database connectivity, required release metadata, and
   optional R2 reachability) and configure Railway's `healthcheckPath`; make unhealthy state fail
   closed without triggering destructive migrations.
4. Capture Railway's forwarding headers/source using a short-lived authenticated/admin diagnostic
   that logs only header names, sanitized IP forms, hop count, and request ID. Confirm the edge
   strips end-user-supplied values. Then set env-backed `ipAddressHeaders` or narrowly scoped
   `trustedProxies`; never use a broad private range or trust arbitrary `X-Forwarded-For`.
5. Choose rate-limit storage. For one replica and low-risk Lane A, memory may be a documented
   temporary control with restart/scale limitations; for production durability or future replicas,
   use Better Auth database storage (migration + backup/restore) or an approved atomic secondary
   store. Do not silently rely on per-process memory.
6. Add integration tests for two distinct client IPs, same-IP throttling, spoofed/multi-hop headers,
   malformed addresses, IPv4/IPv6 normalization, restart and two-replica behavior, and rate-limit
   response headers. If database/secondary storage is selected, run a real Postgres concurrency test
   (two workers racing the same key) and a two-process/replica test proving atomic increments and
   shared state. Confirm the Railway warning disappears and no client can select a bucket by sending
   a forged header.
7. Resolve the Prisma finding: first check whether a patched Prisma/@prisma/config release exists;
   otherwise test a locked npm override for `deepmerge-ts >=8`, or isolate Prisma CLI/config parsing
   from request runtime. Exercise migrations, `prisma generate`, build, startup, and normal API
   traffic. If no safe fix is approved, write an owner/security risk acceptance with CVE/GHSA,
   reachability analysis, compensating controls, expiry, and remediation owner; retain the HIGH
   status in reports.
8. Enforce the one-seat policy without breaking the trust boundary. MKTTool must atomically enforce
   one account/profile/device assignment and refuse cross-account reuse; MKTBrowser's local
   `LicenseKeyPool`/lease journal must cap active keys/profiles for the entitlement and fail before
   opening a second local session. Do not send operator license keys to the server. If true
   cross-machine vendor-seat enforcement is required, obtain an opaque vendor entitlement/API
   contract first; otherwise keep the vendor as the authority and record live evidence in P6.
   Hide/disable `AdditionalLicenceKeys` and concurrency affordances for the one-seat plan, provide a
   migration UX that never silently deletes stored keys, and test upgrade/downgrade, revocation,
   cooldown, restart, and races. Keep `1 account = 1 proxy = 1 profile = 1 device`.
9. Verify security boundaries: `VAULT_KEY_SERVER` never reaches Relay/operator clients,
   `VAULT_KEY_OPERATOR` never reaches Railway, auth allowlists are checked on every request, same-
   origin/HTTPS/cookie settings remain intact, and logs redact tokens/passwords/tickets/page data.
10. Prepare a deployment runbook and handoff, but do not deploy a draft tuple. Include backup,
    migration, healthcheck, release provenance, OAuth, rate-limit, scheduled-job, Lane A smoke, and
    rollback commands for Phase 4's final freeze.
11. Define Lane A acceptance explicitly: allowlist/role matrix, Google OAuth start/callback/session
    revocation, Facebook token health/expiry/revocation (where enabled), posting-safety confirmation
    and destructive-action checks, observer-proxy separation, scheduled health jobs, backup freshness,
    and a bounded admin-led Web/Facebook smoke. This is a controlled internal lane, not Browser
    real-account authorization.
12. Run a rollback drill against the prior deployment/artifact in a disposable environment. Define
    when to stop issuing tickets, revoke the candidate, revert the Railway service, and restore DB;
    obtain operations/security signoff before handing this change set to Phase 4.

## Test Scenario Matrix

| ID | Scenario | Method | Expected result | Evidence |
|---|---|---|---|---|
| P5-01 | Backup before change | Remote dump + encrypted storage check | Recoverable dump exists outside Git | Backup receipt |
| P5-02 | Empty-DB restore | New `db:restore:verify` script against disposable Postgres | Script exists, restores, and passes row-count/checksum checks without secret exposure | Restore report |
| P5-03 | Health/liveness | Public liveness/readiness requests and failure fixtures | Correct status, no sensitive fields, Railway observes it | VM/Railway log |
| P5-04 | Real proxy chain | Sanitized header diagnostic | Exact trusted header/CIDR identified; client spoof is rejected | Diagnostic record |
| P5-05 | Per-IP rate limits | Two IPs + repeated same-IP requests | Separate buckets; expected 429/retry metadata | Integration log |
| P5-06 | Header abuse | Forged leftmost/multi-hop/malformed/IPv6 headers | Cannot bypass or merge buckets; fail closed | Security test |
| P5-07 | Restart/scale/concurrency | Restart plus real Postgres two-worker/two-process race when durable storage is chosen | Shared state is atomic and durable; memory exception is explicit and expiring | Rate-limit report |
| P5-08 | Prisma advisory | Audit + runtime reachability + patched/override tests | No unresolved HIGH, or signed expiring risk acceptance | SCA report |
| P5-09 | One-seat/local lease race | Concurrent second-key/profile requests on Browser plus server account/device race | Only one local lease/profile and one server assignment; no operator key crosses boundary | Entitlement tests |
| P5-10 | Secret boundary | Log/response scan and vault key inspection | No credentials/tokens/tickets/cookies/page data leak | Redaction report |
| P5-11 | Lane A Web/Facebook smoke | Allowlist/roles, Google OAuth start/callback/revoke, Facebook token health/expiry/revoke, safety confirmation, scheduled job, observer proxy | Admin-led smoke is bounded, auditable, and fail-closed; every destructive action requires confirmation | Lane A report |
| P5-12 | Deploy alignment (Phase 4 handoff) | Runbook/preflight against Railway service | No draft deploy; commands and expected checks are complete | Handoff receipt |
| P5-13 | Rollback | Disposable prior tuple restore/redeploy | Bounded rollback works and is documented | Drill evidence |

## Function / Interface Checklist

| Contract | Required check |
|---|---|
| Better Auth IP config | Explicit, env-backed, narrowly trusted header/CIDR; no arbitrary client trust. |
| Rate-limit storage | Chosen storage, migration/config, atomicity, restart/replica behavior, and retention documented. |
| Durable rate-limit schema | If DB storage is chosen, `prisma/schema.prisma`, generated migration, empty-DB restore, and concurrent Postgres test agree. |
| Auth route | Uses the same trusted proxy assumptions as rate limiter; origin checks remain separate. |
| Health endpoint | New unauthenticated `api/healthz` (never `api/health/run`), liveness/readiness semantics, sub-second timeout, no secrets, Railway path configured. |
| Release provenance endpoint | Returns candidate/source/deployment identifiers only after auth where appropriate. |
| Prisma dependency | Patched/overridden/isolated with lockfile and runtime tests, or explicit risk acceptance. |
| Account/device invariant | Server-side atomic one-account/profile/device assignment; no operator key storage. |
| One-seat local pool | Browser `LicenseKeyPool`/lease journal caps local sessions; vendor remains authority across machines. |
| Backup/restore | Predeploy command, encrypted retention, empty-DB restore via the newly created `db:restore:verify`, and rollback compatibility. |
| Deployment command | `railway status` then `railway up --service mkttool-web`; no bare deploy. |
| Observability | Alerts for IP warning, health failure, backup freshness, scheduler timeout, lease/replay failure. |

## Dependency Map

| Dependency | Direction | Reason |
|---|---|---|
| Phase 1 candidate/owner | P1 to P5 | Defines target commit and lane. |
| Phase 4 CI scaffolding | P4 to P5 (optional) | Provides checks/runbook conventions; P5 can harden source before final signing. |
| Database backup/restore capability | External to P5 | Required before migrations/config changes. |
| Railway proxy metadata | External to P5 | Needed for safe client-IP trust. |
| Prisma/Better Auth package releases | External to P5 | Determines patch/storage implementation. |
| P5 hardened change set | P5 to P3/P4/P6/P8 | Browser copy/installer and final signed deployment must include these changes. |

## Historical S2a/S2b closeout (pre-P4a; retained for evidence)

Local production/security controls were prepared: the salted restore verification passed, Better Auth
rate limits use durable Postgres state, trusted-proxy parsing is fail-closed, `api/healthz` and the
authenticated provenance route exist, the locked `deepmerge-ts` override passed install/generate/
build/runtime checks, and the one-seat Browser boundary preserves inactive stored keys. The bounded
Lane A smoke was local/synthetic only at this checkpoint. The successor later verified P4a deployment,
fresh backup/restore, trusted-header configuration, healthz, and full `/v16` read-back. Bounded
credentialed smoke and rollback rehearsal remain OPEN; no full Lane A GO is inferred.

## Success Criteria

- [ ] Hardened source/config and a reviewed Railway deployment runbook are ready for Phase 4; after
  Phase 4 deploys, the live service is verified against the signed candidate SHA and health signal.
- [ ] `db:restore:verify` is written, committed, and passes an empty-DB restore before deploy;
  rollback tuple and drill exist. A printed hint in `backup-database.ts` is not a restore path.
- [ ] Better Auth uses a verified trusted proxy header/CIDR; warning is gone and per-client limits
  are proven across restart/replica behavior.
- [ ] If durable rate limits are selected, schema/migration, real Postgres concurrency, and restore
  tests pass; if memory is retained, a named expiring Lane A exception is visible and Lane C remains
  ineligible. (Local schema/concurrency/restore PASS; live Railway proxy observation remains OPEN.)
- [x] Prisma HIGH is fixed/isolated or has an explicit owner/security acceptance with expiry; report
  does not call the system fully secure while it remains open. (Locked `deepmerge-ts` 8.0.2 override,
  clean install, audit, generate, build, and runtime checks PASS.)
- [x] Server account/device invariant and Browser local one-seat pool are enforced without sending
  operator keys to MKTTool and are accurately represented in UI/docs. (Persisted extra keys remain
  visible/preserved but are inactive in the default runtime; vendor cross-machine entitlement stays
  OPEN.)
- [ ] Auth, origin, vault-key, redaction, scheduler, and alert checks pass; Lane A owner signs GO.

## Risk Assessment

- **Wrong trusted proxy:** attackers spoof a header or all clients share one bucket. Mitigate with
  observed Railway chain, exact CIDR/header, spoof tests, and no broad private ranges.
- **Memory limiter reset:** restart/scale erases limits. Mitigate with DB/atomic secondary storage or
  a short-lived documented Lane A exception with monitoring; never treat it as Browser production
  readiness.
- **Prisma override breakage:** forcing a major transitive version can alter CLI semantics. Mitigate
  with lockfile, migration/build/runtime tests and upstream tracking.
- **Migration/rollback loss:** schema changes outlive the old binary. Mitigate with backup/restore,
  expand-contract migrations, and a disposable rollback drill.
- **One-seat race:** two operators obtain local or cross-machine leases concurrently. Mitigate with
  atomic server account/device constraints, the Browser `LicenseKeyPool`/lease journal, live vendor
  evidence, and an opaque vendor entitlement contract if cross-machine enforcement is required.
- **Diagnostic leakage:** proxy headers or auth details enter logs. Mitigate with allowlisted fields,
  short retention, and a post-run log scan.
