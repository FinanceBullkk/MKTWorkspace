# Incident note — production intermittent 503 / not_ready

**Observed by:** external verifier (read-only). **Status: MITIGATED / MONITORING.** Cause not confirmed.
The hardening deployment is healthy; no new incident has been observed in the current verification window.

> **Current evidence, 2026-09-01:** the historical restart/OOM/browser-launch hypotheses below are
> superseded by fresh metrics. Deployment `0a696033-b610-492c-b75a-3e918cca102a` (master commit
> `2734e2f0ba9c2a2f9c3731a44540c01d263b36e2`) is `SUCCESS`. The last 24-hour query returned
> `/api/healthz` **947/947 HTTP 200**, zero non-2xx responses, and zero server 5xx. A fresh external
> burst returned **24/24 HTTP 200/ready**. Peak process memory was 0.42 GB during the prior incident
> review, with no restart discontinuity in 120 one-minute samples; OOM and restart are not supported
> by the available metrics. R2 latency remains the only live hypothesis, not a confirmed root cause.

> The authorized `/api/relay/download/v16` full GET was reverified on this deployment: HTTP 200,
> 33,342,752 bytes, SHA-256 `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`,
> elapsed 1.3 s. Direct R2 HEAD probes from this host passed 20/20 (243-886 ms, median 289 ms);
> this is not serving-region telemetry. Proxy streaming remains in place because the pinned installer
> requires `redirect: "error"` and resumable Range support.

> **Update 2026-08-31 02:00 ICT — RECURRED. The 19:40 "resolved" note below was premature.**
> The failure returned roughly 6.5 hours after the first window closed. Five samples spaced 10 s:
> 4 × `ready`, 1 × **503**. Same mixed signature as before: mostly healthy, occasional 503, with a
> `not_ready` observed by the watcher moments earlier.
>
> Production logs retain **more than one startup sequence** (`> next start`, `▲ Next.js 16.3.0`,
> `✓ Ready in 112ms`, `> mkttool@0.1.0 start`), which is direct evidence the instance has restarted
> within the retained window. Startup itself is fast, so each restart should produce only a brief
> 503 — a ~20 % observed failure rate therefore implies restarts are frequent, not occasional.
>
> This reframes the working hypothesis: **the primary fault is probably the instance restarting**,
> with elevated R2 latency either a second, independent factor or a consequence of cold starts.
> The 450 ms shared readiness budget explains the `not_ready` mode, not the 503s.
>
> **Restart cause remains unidentified.** OOM, unhandled rejection, and Railway-side recycling are
> all still open. This needs log access over a longer window than the CLI tail provides.

> **Update 02:25 ICT — a specific, testable hypothesis.** A second `not_ready` fired 26 minutes
> after the first, so the fault is periodic rather than random. Two structural facts fit:
>
> - `src/lib/health/daily-health-check-scheduler.ts:46,249` — the web server runs an **in-process**
>   scheduler, `setInterval(tick, TICK_INTERVAL_MS)` with `TICK_INTERVAL_MS = 60_000`. Its header
>   comment explains the deliberate choice not to use the platform's cron.
> - `src/lib/health/health-check-runner.ts:24` imports `openObserverSession` from
>   `observer-browser-session` — the health check **launches a browser**.
>
> So the process serving HTTP is also the process that periodically starts a browser, on a
> single Railway replica. A browser launch is a large memory spike; on a small container that is a
> plausible OOM → restart → 503 → cold start (`Ready in 112ms`) → brief `not_ready` while the R2
> client initialises. That chain explains every symptom observed, including the periodicity.
>
> **Not yet proven.** No memory metric has been read, and no restart has been correlated with a
> specific scheduler tick or browser launch. Confirm before acting. If it holds, the fix is
> structural — move the browser workload out of the web process (platform cron, a worker service,
> or a separate job runner) rather than raising the memory limit.

> **Superseded note, 19:40 ICT — recovered without intervention.** Five samples spaced 15 s: `ready=5`,
> `not_ready=0`, `503=0`. This recovery happened **before** any fix was deployed — the branch is
> still ahead of `master` and production still runs `6ce28d0`. So the incident window was roughly
> 17:30–19:00 and closed on its own.
>
> **Do not read the fixes below as having resolved it.** Commits `ba7960c` (per-dependency
> readiness budgets) and `a20056c` (cache immutable release metadata) are correct and worth
> deploying, but they are hardening against the *next* episode, not the cure for this one. The
> most likely cause remains transient elevated R2 latency, which the 450 ms shared budget turned
> into `not_ready`. That diagnosis is still unproven.

## What changed

Production was clean on every check between 12:00 and 17:00 ICT. From roughly 17:30 it began
failing intermittently. Master is unchanged at `6ce28d0`; deployment `ed972e5b` is still `SUCCESS`.
No new deploy caused this.

## Measurements

| Sample | Spacing | Result |
|---|---|---|
| 3 requests | ~0.3 s apart | `not_ready`, `ready`, `not_ready` — r2 and releaseMetadata failed together, database ok |
| 4 requests | 12 s apart | 3 × `ready`, 1 × **503** |
| 5 requests | 15 s apart | 4 × `ready`, 0 × `not_ready`, 1 × **503** |
| 24-hour production query after hardening | one-minute/request log evidence | **947/947 HTTP 200**, zero non-2xx, zero server 5xx |
| Fresh 2026-09-01 burst | 24 sequential requests | **24/24 HTTP 200/ready**, 88-397 ms |
| Direct R2 HEAD from this host | 20 requests | **20/20 pass**, 243-886 ms, median 289 ms; not serving-region evidence |
| Authorized `/v16` full GET | one complete transfer | **200**, 33,342,752 bytes, exact SHA, 1.3 s |

Two distinct failure modes:
- **`200` with `status: not_ready`** — `checks.r2=failed`, `checks.releaseMetadata=failed`,
  `checks.database=ok`, `relayVersion=null`
- **`503` Service Unavailable** — no response body

`database` was `ok` in every sample that returned a body.

## Production log evidence

```
Error [TimeoutError]: The operation was aborted due to timeout
⨯ Error: failed to pipe response
```

Thrown from an async route handler (stack is minified Next.js chunks, so the exact route is not
identifiable from the log alone).

## Current diagnosis — bounded, not a confirmed root cause

The available evidence supports a readiness-budget failure mechanism, not a confirmed external
trigger. R2 latency or timeout remains the strongest hypothesis:

- The `healthz` R2 reachability check timing out would produce exactly `r2=failed` +
  `releaseMetadata=failed` while `database=ok`.
- Healthy direct R2 reads from this host reached 886 ms, so the former shared 450 ms deadline was
  below observed ordinary latency. This explains how an otherwise healthy service could report
  `not_ready` without proving what made R2 slow during the incident window.
- `failed to pipe response` remains compatible with an aborted streamed response, but the latest
  complete 33 MB transfer succeeded through the app worker in 1.3 s.
- The restart interpretation is not supported by the later memory/restart metrics. Repeated startup
  lines in retained logs were not sufficient to attribute the incident window to process recycling.

OOM and repeated restarts are excluded by the available metrics. Platform-edge instability remains
possible only for a future bodyless 503 that has no matching container request/log.

## Why this matters beyond the error rate

Railway probes `/api/healthz` when promoting a deployment. At the observed failure rate, the next
deployment has a real chance of failing its healthcheck and being rolled back — and the P4-09
rollback drill already found that an image rollback **does not restore the `healthcheckPath`
service setting**. So a failed promotion could land in a state where the rollback target is probed
on a path it does not serve.

## Follow-up and stop conditions

1. Keep the 3 s release-metadata budget and cached immutable metadata; do not widen it without
   serving-region latency evidence.
2. On recurrence, correlate the exact timestamp across Railway edge HTTP logs, container logs, and
   `[healthz] release check failed` output. A bodyless edge 503 with no container request is platform
   evidence; a JSON `not_ready` response is application readiness evidence.
3. Retain proxy streaming for `/v16`. Redirect is a separate protocol change: it would break the
   pinned installer's redirect refusal, require signed-query URL support, expose the R2 location, and
   must preserve Range/resume semantics before adoption.
4. Do not reopen the browser-launch/OOM theory unless fresh metrics correlate a scheduler run with
   a memory spike or process restart.

## Bearing on the Lane A GO/NO-GO

The production-stability premise is restored: the current deployment has a clean 24-hour health
window and a fresh authorized artifact replay. Lane A remains unsigned only because the bounded
credentialed P4-08 smoke and owner decision are still open, not because this incident is active.

## Unresolved questions

1. What external event caused the elevated R2 latency during the historical windows? Current data
   proves the old deadline was unsafe, not the upstream trigger.
2. Can serving-region R2 latency be measured without adding a noisy or costly probe?
