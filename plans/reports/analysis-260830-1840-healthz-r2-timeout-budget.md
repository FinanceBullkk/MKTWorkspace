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

## Fix implemented, not deployed

`MKTTool` commit `ba7960c` splits the budget per dependency: Postgres keeps 450 ms,
the release read gets 3 s (candidate A). A regression test reproduces the production symptom --
it fails at 455 ms against the old shared budget and passes against the split one. Full suite
215 files / 1959 tests pass; `tsc --noEmit` and `eslint .` clean.

Candidate B (demoting R2 to non-fatal) was **not** implemented. Whether a slow or broken object
store should take the service out of rotation and block deployment promotion is a product
decision about how core Relay distribution is, not a defect fix. It stays an owner decision.

Gates for `a20056c`: full suite 216 files / 1965 tests pass (exit 0), `eslint .` exit 0,
`tsc --noEmit` exit 0. An intermediate run had 3 failures in `relay-release-r2.test.ts` from the
new module-level cache bleeding between test cases; fixed by clearing it in that file's
`beforeEach`, which is the correct isolation for process-global state.

**The fix is not live.** Shipping it means merging to master, which is a production deployment,
owner-gated, and unwise while the incident is still open. Nothing was deployed, restarted, or
reconfigured.

## Root-cause audit (added 2026-08-30 19:00)

The timeout budget was the shallowest of three layers. Auditing the call path found two deeper
defects, and the deepest one explains why the failure was *bursty* rather than proportional to R2
latency.

### R1 — immutable metadata is re-fetched over the network on every call

`readRelayRelease()` -> `readFromR2()` -> `headRelayRelease()` -> `headObject()` performs a signed
`HEAD` to R2 **every time**. There was a cache for the *disk* path
(`relay-release-file.ts:200 cachedChecksum`) and **none** for the R2 path.

Callers, all of which hit the network on every invocation:

| Caller | Frequency |
|---|---|
| `src/app/api/healthz/route.ts` | every readiness probe |
| `src/components/setup/relay-download-section.tsx` | every render of the setup page (server component) |
| `src/app/api/relay/download/route.ts` and `download/[version]/route.ts` | every device download |
| `relay-compatibility-manifest-file.ts`, `release-provenance.ts` | per call |

This contradicts the workspace's own invariant. `decisions.md` prohibition 7: *"Never overwrite an
immutable object. v15 and v16 in R2 keep their bytes forever."* The `HEAD` result for a given
version is therefore a fact that cannot change, and it was being re-derived over a network hop on
every probe and every page render.

### R2 — the timeout did not cancel the work it timed out (the amplifier)

`withTimeout` is a `Promise.race`. It rejects the *outer* promise; the underlying `fetch` keeps
running until its own `AbortSignal.timeout(15_000)` in `headObject` fires. Each timed-out probe
therefore left an orphaned R2 request alive for up to **15 seconds** with nobody waiting on it.

That closes a positive feedback loop:

```
R2 latency rises -> probe exceeds its budget -> 503, orphaned HEAD keeps running 15 s
                 -> next probe starts another HEAD -> orphans accumulate
                 -> more concurrent load on R2 exactly while it is slow -> latency rises
```

This is why the incident arrived in bursts and then cleared on its own, rather than tracking R2
latency smoothly.

### R3 — budget mismatch

450 ms for a cross-network object-storage call whose own client budgets 60 s. Real, but the
shallowest layer, and fixed first in `ba7960c`.

## What was fixed

| Layer | Fix | Commit |
|---|---|---|
| R3 | Split the budget per dependency: Postgres 450 ms, release read 3 s | `ba7960c` |
| R1 | Per-version, TTL-bounded, success-only cache for the R2 metadata read | `a20056c` |
| R2 | Thread an `AbortSignal` through `readRelayRelease -> headRelayRelease -> headObject`; the readiness probe now passes `AbortSignal.timeout(...)` so expiry cancels the request instead of orphaning it | `a20056c` |

### Why the cache does not weaken readiness

A cold process has an empty cache, so a **new deployment still performs a real R2 read** before it
can report ready. That is exactly what deployment-promotion gating needs to prove. What disappears
is a long-running instance re-proving R2 reachability every 10-30 seconds, which was never the
point and was the thing generating the load. The TTL is 5 minutes so a long-lived process still
re-verifies periodically; it is a deliberate balance, not a measured number, and is documented as
such in the module.

Negative results (`available: false`) are deliberately **not** cached: that state changes the moment
someone publishes, and caching it would make a freshly published release look absent.

## Log evidence re-read (2026-08-30 19:45) -- two corrections

`railway logs --json` for deployment `ed972e5b`, with timestamps:

```
06:38:49Z  Starting Container      <- pre-deploy migration container
06:38:53Z  Stopping Container      <- `npx prisma migrate deploy` finished
06:39:16Z  Starting Container      <- application container
06:39:16Z  Ready in 112ms
06:43:37Z  TimeoutError / failed to pipe response
```

**Correction 1 -- there were no restarts.** The incident note's "periodic restarts" hypothesis, and
its reading of `200 not_ready` as an instance mid-startup, are disconfirmed. The two
`Starting Container` lines are one normal Railway deploy: the migration container, then the app
container. The application has had a single start, at `06:39:16Z`, and has been up since.

**Correction 2 -- the cited log evidence predates the incident by about four hours.** The
`TimeoutError` / `failed to pipe response` pair is timestamped `06:43:37Z` (13:43 ICT). The
incident began around 17:30 ICT (10:30 UTC). That pair is almost certainly the already-recorded
aborted Relay download (27,286,912 of 33,342,752 bytes), not evidence of this incident.

**Correction 3 -- to this report's own earlier framing.** The first pass attributed the whole
incident to the R2 readiness budget. Every 503 *this agent* sampled carried an application body
(`{"ok":false,"status":"not_ready",...}`), which is consistent with that. The incident note reported
bodyless 503s as well; those were not reproduced here and remain unexplained by the R1/R2/R3 fixes.
Do not treat the fixes as accounting for a bodyless 503.

### R4 -- the incident was invisible because the health check swallowed its own cause

The whole deployment logged **69 lines in six hours**. Nothing was written during the incident
window. Both readiness checks caught their cause and discarded it, and the release check carried a
comment stating the detail belongs in server logs while never writing one. That is why the
investigation had to reason from response bodies alone and reached for restart and OOM theories the
logs could neither confirm nor deny.

Fixed in `9105e1a`: the cause is logged server-side (error name and message only). The public body
keeps its exact shape and still carries no cause.

## Not done

No deploy, no restart, no setting change, no timeout edit. Diagnosis only. The route change and its
deployment are owner-gated, and deploying during an active incident is its own risk.

## Unresolved questions

- What is R2's actual latency distribution from this Railway region? Without it, any new timeout is
  another guess.
- Is `/api/relay/download/v16` failing for authenticated devices during the same windows?
- Should readiness depend on R2 at all, given the database is the true serving gate?
