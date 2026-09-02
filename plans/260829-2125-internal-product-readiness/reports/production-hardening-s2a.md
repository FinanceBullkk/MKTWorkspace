# S2a production/security hardening evidence

> **Historical pre-P4a snapshot — superseded by the successor post-deploy report.** The local
> controls remain useful evidence, but old Railway/proxy/healthz and “no commit/push” statements are
> not current. P4a is deployed and qualified; see the successor plan for current residual gates.

**Captured:** 2026-08-30 (ICT)
**Candidate:** `20260830-browser-0.3.13-relay-16`
**Result:** `LOCAL_PASS_WITH_RAILWAY_AND_EXTERNAL_GATES_OPEN`

This record describes the source/configuration work prepared for Phase 4. It is not a deployment
claim. No Railway deployment, floor change, OAuth login, Facebook action, vendor call, or physical
environment gate was executed.

## Backup and restore

- `npm run db:backup:remote` produced the ignored dump
  `MKTTool/data/backups/mkttool-prod-20260830-021726.sql` (63,729 bytes, SHA-256
  `DF1B485A1BB43D715499743B1148D4A9FAF100305941D6F8DCF13434EE5E212D`).
- The dump is excluded by `MKTTool/.gitignore`; its ACL was tightened after capture to the current
  user, `SYSTEM`, and local Administrators only. No SQL contents or credentials are in this report.
- `npm run db:restore:verify -- --dump data/backups/mkttool-prod-20260830-021726.sql --report
  reports/restore-verify-20260830-r4.json` completed with `status=PASS`, `cleanup=PASS`, 99 source
  rows versus 99 restored rows, zero aggregate
  mismatches, and a 9,531 ms duration. Per-column checksums are salted per run; the random salt is
  held only in memory and is absent from the report. The disposable database was dropped in the
  cleanup path. The raw receipt is withheld from Git per `reports/restore-verify-receipt-redaction.md`.
- The source/deployment rollback tuple remains the baseline deployment `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa`,
  deployment ID `3621f603-1c51-4246-824c-55cc0e6b5764`, one replica, Southeast Asia. The current
  Railway healthcheck setting is unset.

## Schema, authentication, and rate limiting

- Added the `RateLimit` Prisma model and migration
  `20260830030000_add_better_auth_rate_limit`; Better Auth is explicitly configured for database
  storage with a 10-second window and a 100-request ceiling.
- `npm run db:generate` passed under Node `v22.23.2`; the migration was applied by the real
  verification harness to a disposable Postgres database.
- `npm run auth:rate-limit:verify` passed with two independent workers racing the same bucket:
  120 concurrent requests yielded 100 successful and 20 throttled responses, row count 100;
  a distinct RFC5737 client obtained its own bucket; after worker restart the same bucket returned
  429 with a retry header; malformed/multi-hop forwarding input did not bypass the limit.
- `trusted-proxy-config.ts` is env-backed, defaults to the narrow `x-forwarded-for` header, trusts
  no broad private CIDR, validates exact IPv4/IPv6 CIDRs, and applies an explicit IPv6 subnet.
  Local resolver tests cover single-hop, multi-hop, malformed, spoofed, IPv4-mapped, and IPv6
  normalization cases (included in the 52-test hardening run).
- The actual Railway forwarding chain has not yet been observed on the deployed hardened route;
  therefore the production trusted-header/CIDR gate and the claim that the live Better Auth warning
  is gone remain **OPEN**. A deployment-time sanitized admin diagnostic is required before setting
  non-default proxy values.

## Readiness and release provenance

- Added unauthenticated, sub-second `GET /api/healthz`. It checks Postgres and the exact Relay v16
  release metadata with bounded timeouts, returns 200 only when ready, returns 503 without causes
  on failure, and never performs migrations or emits account/proxy/ticket/secret data.
- Added authenticated `GET /api/release/provenance`. It fails closed with 503 until a sanitized
  candidate ID, source SHA, deployment ID, and Relay v16 metadata are present; it never echoes
  arbitrary environment values or release URLs. Local route/guard and provenance tests pass.
- `npm run build` passed and the route list contains both `/api/healthz` and
  `/api/release/provenance`. Railway still serves the old deployment (`/api/healthz` was 404 at the
  baseline), so the live healthcheck remains unconfigured until the P4 tuple is ready.

## Prisma/dependency result

- Added a locked npm override for `deepmerge-ts` `8.0.2` and regenerated `package-lock.json`.
- A clean `npm ci --ignore-scripts` completed after moving the prior `node_modules` directory out of
  the repository. `npm ls deepmerge-ts` shows `8.0.2 overridden`; `npm audit --json` reports zero
  info/low/moderate/high/critical vulnerabilities. `prisma generate`, typecheck, build, and the
  rate-limit runtime harness pass. The old package advisory is therefore not being carried as an
  unresolved HIGH in this candidate.

## Account/device and secret boundaries

- Existing transactional account-owner actions and unique `Account.antidetectProfileId`/
  `proxyId` constraints were reviewed; the database test suite covers owner allowlists, device
  existence/revocation, owner matching, and cross-account refusal.
- Server vault keys and operator Relay keys remain separate; no operator licence key is accepted by
  MKTTool. Browser one-seat runtime/UI enforcement is the S2b follow-on and is not counted as done
  by this report.
- The focused hardening suite (proxy config/resolution, healthz, provenance, guard, and related
  auth checks) passed 52 tests; changed-source ESLint passed. The final S4b MKTTool regression
  rerun passed **215 files / 1,958 tests** under Node `v22.23.2` (the earlier S2a snapshot was
  214 files / 1,939 tests).

## Open gates handed to S2b/P4/S5

- Railway forwarding observation, `healthcheckPath=api/healthz`, deployment provenance, and live
  Lane A Web/Facebook smoke require the final signed tuple and remain OPEN.
- Vendor channel/entitlement, two disposable proxy pairs, human first login, real power-cycle,
  clean second PC, and canary operators are external gates. They are prepared for S5 and not
  simulated here.
- No commit or push was made. Unrelated dirty work in both repositories was preserved.
