# Handoff S2a — production/security hardening
Date: 2026-08-30T03:02:00+07:00  |  Phase: 5  |  Status: PARTIAL

> **Historical S2a snapshot — superseded by current P4a evidence.** Its old Railway/healthz and
> proxy observations are pre-deploy; current deployment, trusted-header, and healthcheck evidence
> is in the successor `reports/lane-a-deploy.md`. Q16 closed Lane C; Q15 requires owner self-serve
> observations only.

## Done
- Added and tested the fail-closed restore verifier, Better Auth database-backed rate limiting, env-backed trusted-proxy configuration, the new unauthenticated readiness route, and the authenticated release-provenance route.
- Captured a remote backup, tightened its ACL, restored it into a disposable Postgres database, and compared salted aggregate/per-column checksums: 99 rows, zero mismatches, cleanup PASS.
- Applied the real rate-limit migration in a disposable database and ran two independent workers. The shared bucket produced exactly 100 successes and 20 throttles from 120 requests; restart persistence, separate client buckets, and malformed-header non-bypass all passed.
- Locked `deepmerge-ts` to `8.0.2`; clean install, Prisma generation, typecheck, build, targeted hardening tests, and `npm audit` (zero vulnerabilities) passed under Node `v22.23.2`.
- Added source-level release provenance that fails closed until candidate/source/deployment/Relay facts are present. Local route/guard tests pass.
- Full MKTTool regression passed 214 files / 1,939 tests; changed-source ESLint passed.

## Evidence written
- `reports/production-hardening-s2a.md` — sanitized command/results and open gates.
- local-only `reports/restore-verify-20260830-r4.json` — salted aggregate restore evidence; raw
  receipt is withheld from Git per `reports/restore-verify-receipt-redaction.md`.
- `reports/relay-v16-evidence.json` and `reports/release-manifest.json` — immutable Relay v16/read-back tuple and manifest alignment.
- `reports/gate-ledger.md` — current lane/gate status.

## NOT done / deliberately skipped
- The live Railway proxy chain has not been observed; no broad CIDR or guessed header was trusted. The production proxy gate stays OPEN.
- Railway `api/healthz` is not configured/deployed yet; the old deployment returns 404 for it. No `railway up` was run, and no floor change was made.
- Browser one-seat runtime/UI boundary, Lane A smoke, and rollback drill continue in S2b. Vendor, human, proxy, second-PC, power-cycle, and canary gates remain external/open.

## State the next session must know
- MKTTool branch `ci/self-hosted-runners` remains dirty by design; source edits and the ignored backup are not committed. Node 22 path is required for all subsequent MKTTool checks.
- `MKTTool/relay/src/spent-ticket-journal.ts` is present with the fail-closed rewrite after the user’s restoration incident; `relay-identity.ts` imports `ensureSpentTicketJournal` and typecheck/build pass.
- Do not treat local healthz/provenance tests as live Railway evidence. Configure the service healthcheck only in the final P4 deployment preflight, after the signed tuple and rollback tuple exist.

## Decisions still owed by the release owner
- None for the settled engineering choices in `decisions.md`. External vendor/proxy/human/second-PC/canary inputs remain OPEN and do not block the next local unit.

## Next unit
S2b — Prisma/dependency closeout, one-seat enforcement, Lane A smoke, and rollback drill. First action: review the Browser runtime diff so persisted extra keys cannot activate more than the verified one seat, then run the Browser contract suite.
