# Analysis — the 503s are a readiness-budget defect, not (only) an R2 outage

Date: 2026-08-30 18:40 ICT
Author: reviewing agent (read-only diagnosis; nothing deployed, restarted, or reconfigured)
Companion to: `incident-260830-1830-production-intermittent-503.md`

## Independently reproduced

Six `/api/healthz` probes, ~8 s apart, 11:32–11:33 UTC:

| Result | Count | Body |
|---|---|---|
| `200 ready` | 4 | `database=ok, releaseMetadata=ok, r2=ok, relayVersion=16, releaseSource=r2` |
| `503 not_ready` | 2 | `database=ok, releaseMetadata=failed, r2=failed, relayVersion=null` |

`database` was `ok` in **every** sample. `r2` and `releaseMetadata` failed together every time —
expected, since `releaseSource=r2` means the metadata read *is* the R2 read. One failing dependency,
not two.

## The mechanism

`src/app/api/healthz/route.ts:10` — `const CHECK_TIMEOUT_MS = 450;`
`src/app/api/healthz/route.ts:64` — `await withTimeout(readRelayRelease(RELAY_VERSION), CHECK_TIMEOUT_MS);`
`src/lib/r2/r2-client.ts:134` — the R2 client's own default is `timeoutMs = 60_000`.

The readiness route gives a cross-network object-storage round trip **450 ms**, while the client that
performs it budgets 60 s — a 133× mismatch. The database check passes the same 450 ms budget easily
because `SELECT 1` against in-region Postgres is sub-millisecond. R2 is a remote HTTP call.

`git log -S` shows `450` has been present since `e0c8686` ("feat(api): add unauthenticated readiness
endpoint") and was never changed. Master is unchanged at `6ce28d0`; deployment `ed972e5b` is still
`SUCCESS`. **No code regressed.** R2 latency drifted above a budget that was always fragile.

## Why this is worse than an R2 hiccup

`route.ts:18` states the intent: *"Failures return 503 so Railway does not keep routing to a
half-ready [instance]"*, and `route.ts:38` maps `not_ready -> 503`.

So a latency spike on a **non-critical, remote** dependency removes the whole service from rotation
even though the database — the thing that actually gates serving — is healthy. The readiness signal
conflates "R2 is slow" with "this instance cannot serve".

This same route is the Railway `healthcheckPath`. It therefore governs **deployment promotion**, not
just routing.

## Operational consequences, in priority order

1. **Do not deploy or merge while this is flapping.** At an observed ~33 % failure rate, a promotion
   healthcheck can fail on a healthy build. The pending MKTTool commit is docs-only and merging it
   is a production deployment; there is no reason to attempt it now.
2. **The recovery path is now degraded in two independent ways.** The prior image `c819e6a8` returns
   404 on `/api/healthz` (measured in the P4-09 drill), *and* the current healthcheck is
   intermittently 503 on the live image. A rollback attempted today faces both.
3. **Holding `MIN_RELAY_VERSION` at 13 was the right call.** Had the floor moved to 16, v13–v15
   devices would be forced to upgrade through R2-backed release routes that are intermittently
   unavailable. The floor decision protected the fleet by accident of good discipline.
4. **Device impact is unmeasured.** `/api/relay/download/v16` returns 401 to anonymous probes, so an
   authenticated GET is required to establish whether downloads are affected. `relayVersion=null`
   during failures makes impact likely but unproven.

## Candidate fixes — owner decision, each requires a deploy

- **A. Separate the budgets.** Give the R2/release check its own timeout (seconds, not 450 ms) while
  the database check keeps a tight one. Smallest change; keeps R2 in readiness.
- **B. Demote R2 to non-fatal.** Report `r2` and `releaseMetadata` in the body but let readiness be
  governed by the database. `/api/healthz` stops taking the service out of rotation for a slow
  object store. Recommended if the web app can serve without R2.
- **C. Both**, plus record the real R2 latency distribution before choosing a number, so the new
  budget is measured rather than guessed.

Prefer **C**. Choosing a timeout without measuring the dependency is how 450 ms got here.

Do not "fix" this by widening the timeout until it stops failing without knowing the distribution —
that reproduces the original error at a larger number.

## Not done

No deploy, no restart, no setting change, no timeout edit. Diagnosis only. The route change and its
deployment are owner-gated, and deploying during an active incident is its own risk.

## Unresolved questions

- What is R2's actual latency distribution from this Railway region? Without it, any new timeout is
  another guess.
- Is `/api/relay/download/v16` failing for authenticated devices during the same windows?
- Should readiness depend on R2 at all, given the database is the true serving gate?
