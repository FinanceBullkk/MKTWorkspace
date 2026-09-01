# Lane A deployment record

Date: 2026-08-30 (ICT)
Status: **P4a DEPLOYED / SIGNED CONDITIONAL GO; P4b OPEN**

> **Successor verification, 2026-09-01:** current deployment is
> `0a696033-b610-492c-b75a-3e918cca102a`, master commit
> `2734e2f0ba9c2a2f9c3731a44540c01d263b36e2`, status `SUCCESS`. The last 24-hour health evidence is
> 947/947 HTTP 200 with zero server 5xx; a fresh 24-request burst is 24/24 ready. Authorized `/v16`
> full GET remains exact at 33,342,752 bytes and SHA-256
> `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`. The immediate rollback
> target is this report's `ed972e5b` / `6ce28d0f`, which serves `/api/healthz`; the older
> `c819e6a8` healthcheck mismatch is not the current target.

This record separates the MKTTool web deployment from the Browser five-artifact contract. P4a is
the Next.js service on Railway. It does not contain the Browser engine and does not require a
five-artifact Browser tuple. P4b remains a separate technical item.

## P4a source and CI

The consolidation branch was pushed and PR #40 was merged to `master` under the owner's Q13
approval. The later docs-only PR #42 was also approved and merged after its required checks passed;
the current `master` merge commit is `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`.

The final master push CI run `33297347911` is fully green:

| Check | Result | Evidence |
|---|---|---|
| `check` | **PASS** | lint, typecheck, tests, coverage, and build |
| `contracts` | **PASS** | disposable-Postgres restore/rate contracts |
| `secret-scan` | **PASS** | required scan |
| `deploy-verification` | **PASS** | Railway deployment observed |
| relay executable | **SKIPPED BY WORKFLOW CONDITION** | not treated as a pass for this push |

The preceding PR #42 run `33296599912` was also green, including U2's new required contracts (with
the PR-only deploy job skipped by condition). Earlier green runs `33292005382` and `33292350436`
remain historical evidence. The earlier red run `33291209847` is retained as failure evidence only: it exposed the missing host
`psql` and missing Node setup, which commit `35b977b` fixed. The candidate's outstanding
`MKTTool/eslint.config.mjs` change was committed before merge; the protected `AGENTS.md` files were
not staged.

## Browser provenance boundary (P4b only)

After the dedicated Q14 MKTBrowser commit `1decde437cf6495652b9d7bdbb76290ab2130411`,
`emit-release-provenance.cjs` accepted the Browser tree (`source.clean=true`). Receipt SHA-256 is
`c84598c29273ac5ee18496404d43be46dd7bc77c6cb64351066892971a41149f` (temporary path outside Git).
It records the installer, payload, Relay v16, and a metadata-only engine pin. The exact CloakBrowser
Stable `.2` archive is absent, so this is **not** a five-artifact tuple and was not used as a P4a
gate.

## Rollback tuple and database preflight

The tuple was recorded before the merge:

| Field | Value |
|---|---|
| Railway project | `renewed-benevolence` |
| Environment / service | `production` / `mkttool-web` |
| Prior deployment | `3621f603-1c51-4246-824c-55cc0e6b5764` |
| Prior commit | `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa` |
| Migration action | `npx prisma migrate deploy` |
| Candidate commit | `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432` |
| Candidate Relay | v16, SHA `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` |
| Schema state | predeploy migration action recorded; merged deployment completed |
| Healthcheck before change | `null` |

Fresh current-database evidence (not inherited from an earlier run):

```text
npm run db:backup:remote
  data/backups/mkttool-prod-20260830-101918.sql
  64,270 bytes
  SHA-256 40ba103453a764db5ecd4288bba7a8537fa911832e9216c56303a31e9ef1694f

npm run db:restore:verify -- --dump <that dump> --report <temporary receipt>
  PASS; source/restored aggregate rows 100/100; mismatches 0; cleanup PASS
  receipt SHA-256 b5f652ec178d037f3c3353769d79926cd42327b33375a6c7f278e850d5955804
```

The SQL dump and restore receipt contain operational data and remain outside Git.

## Railway deployment and external verification

Railway created final deployment `ed972e5b-7597-4c6d-8066-24bc11c4ea0b`, status `SUCCESS`, branch
`master`, with `meta.commitHash` exactly equal to `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432` and one
running instance. `npx prisma migrate deploy` ran as the predeploy action. Earlier successful
deployments `8e1123a3-c7f6-49a8-bb97-68c35bd4807a` and `c4ac6781-6c41-486f-9e24-eeaf67aed22b`
are retained as historical receipts, not current state.

`GET https://mkttool-web-production.up.railway.app/api/healthz` returned HTTP **200**, 166 bytes,
SHA-256 `7fac32dc21433db23cb4995006a08a7d054831530bbcab436ad15bd022dbf224`, with:

```json
{"ok":true,"status":"ready","checks":{"database":"ok","releaseMetadata":"ok","r2":"ok"},"relayVersion":16,"releaseSource":"r2"}
```

An authorized **full GET** (not HEAD) of `/api/relay/download/v16` against the final deployment
returned HTTP 200, 33,342,752 bytes, SHA-256
`5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`, matching the immutable
published object. The first client attempt ended before the complete body (HTTP logs show 27,286,912
transmitted bytes); a retry completed the full body in 91,105 ms and matched exactly. The downloaded
bytes were deleted after hashing.

## Better Auth trusted-proxy verification

The old deployment logged the exact Better Auth shared-bucket warning when a multi-hop synthetic
`X-Forwarded-For` header was supplied. Railway's documented direct-ingress client header is
`X-Real-IP`; production variable `TRUSTED_PROXY_IP_HEADERS=x-real-ip` was set explicitly and caused
the successful deployment above. No broad CIDR was invented. A final-deployment log query (69 lines)
found zero occurrences of the exact shared-IP warning; the two-client burst below remains explicitly
qualified evidence from the earlier successful deployment.

After restart, a bounded production burst through the direct Railway domain produced separate
rate-limit buckets: client A 101 requests → 100 HTTP 200 and 1 HTTP 429; client B 1 request → HTTP
200. A fresh log query found **zero** occurrences of the exact shared-IP warning. The test used
header-labelled synthetic clients from one host; Railway HTTP logs therefore show one physical
source IP. It proves the configured header path and warning removal, not two independent networks.
Prisma create/update race diagnostics emitted during the burst are Better Auth adapter telemetry,
not the shared-IP warning, and are recorded separately rather than hidden.

Railway service configuration now reports `healthcheckPath=/api/healthz` through the
`serviceInstance` query; no deployment was triggered by that setting. A subsequent health GET
remained 200/ready.

## Gate ledger

| Gate | Result | Evidence / qualification |
|---|---|---|
| P4a owned source and required CI | **PASS** | final merge SHA and runs `33296599912`, `33297347911` |
| P4a current-DB backup + restore | **PASS** | fresh dump/receipt hashes above |
| P4a rollback tuple | **PASS (recorded)** | prior deployment, commit, migration, schema state |
| P4a Railway deployment | **PASS** | final deployment `ed972e5b…`, metadata commit match |
| P4a readiness route | **PASS** | HTTP 200 and all checks `ok` |
| P4a authorized v16 route | **PASS** | full GET/hash exact match |
| P4a trusted-proxy warning | **PASS (qualified synthetic)** | zero warning logs; two labelled buckets |
| P4-09 rollback rehearsal | **PASS (disposable, qualified)** | `reports/rollback-drill-p4-09.md`; restore/migration/prior-source start/cleanup timings recorded; no production rollback executed |
| P4-08 Lane A smoke | **PASS / bounded** | `reports/lane-a-credentialed-smoke-20260901.md`; OAuth/admin, Facebook token health, destructive confirmation, scheduler, and backup freshness passed; queue was empty so posting was not exercised |
| Rollback healthcheck compatibility | **PASS for immediate target / recheck before action** | `ed972e5b` / `6ce28d0f` serves `/api/healthz`; older `c819e6a8` does not |
| P4b Browser five-artifact tuple | **OPEN** | exact Stable `.2` engine archive absent |
| Lane C | **CLOSED** | no CloakBrowser channel; no request, date, or “coming soon” |

**P4a decision:** the approved Lane A web deployment is live and route-first is satisfied. The
bounded credentialed smoke and disposable rollback rehearsal passed; no production rollback was
performed. The historical prior-image healthcheck mismatch is retained as a warning for that old
tuple; the immediate rollback target is healthcheck-compatible, subject to a fresh pre-action
setting check. The owner signed CONDITIONAL GO on 2026-09-01 (ICT), accepting residual risks 1–8.
The Relay floor remains 13 until U5's real-device gate is met.

## Unresolved questions / external dependencies

- P4-09 disposable rehearsal is complete; any real rollback remains separately human-approved, and
  the selected target plus `/api/healthz` setting must be rechecked immediately before action.
- P4-08 bounded credentialed/admin smoke is complete; see `reports/lane-a-credentialed-smoke-20260901.md`.
- P5-03 has one owner-machine v16 observation; the second remains open.
- P4b remains open for the missing Browser archive; Lane C is closed because no vendor channel
  exists.
