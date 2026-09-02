# Post-deploy verification — readiness fixes on production

Date: 2026-08-31 02:45 ICT
Deployment: `0a696033-b610-492c-b75a-3e918cca102a`, status `SUCCESS`, created `2026-08-30T19:38:51Z`
Source: master `2734e2f0ba9c2a2f9c3731a44540c01d263b36e2` (merge of PR #43)

Carries `ba7960c` (per-dependency readiness budgets), `a20056c` (immutable R2 metadata cache +
AbortSignal threading), `9105e1a` (log readiness failure causes), `d8b1cd3` (runbook stop condition).

## Q13 preconditions, all evidenced before the merge

| # | Precondition | Evidence |
|---|---|---|
| 1 | Outstanding work committed | Clean tree; `AGENTS.md` and `AGENTS.md.bak-260828` untouched throughout |
| 2 | CI green on the branch | PR #43: `check` pass 4m20s, `contracts` pass, `relay-executable` pass, `secret-scan` pass; `mergeable=MERGEABLE state=CLEAN` |
| 3 | Backup + restore verify against the current database | `mkttool-prod-20260830-202039.sql`, 65,419 bytes, sha256 `468771c07a5beee1a0722101420f42321e3f0c174926126c14997c3dff17adf7`; verifier `status=PASS`, `mismatches=[]`, `cleanup=PASS` |
| 4 | Rollback tuple recorded | prior deployment `ed972e5b-7597-4c6d-8066-24bc11c4ea0b`, prior commit `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`, image `sha256:76ae3d4f9641...d3e2de`, migration action `npx prisma migrate deploy` |
| 5 | Post-merge verification | Below |

## Post-deploy checks

| Check | Result |
|---|---|
| Railway deployment created and promoted | `SUCCESS` |
| `/api/healthz` | **8/8 HTTP 200**, `ok=true`, `status=ready`, `database=ok`, `releaseMetadata=ok`, `r2=ok`, `relayVersion=16`, `releaseSource=r2` |
| Better Auth shared-IP warning | **Absent** — zero matches for shared-IP / trusted-proxy / Better Auth warnings in the new deployment's logs |
| Container startup | One migration container, one app container, `Ready in 179ms`; both in-process schedules armed (`[lịch dò] 09:00`, `[sao lưu] 03:00 lên R2`) |
| `/api/relay/download/v16` full GET + hash | **PASS, reverified 2026-09-01.** Authorized HTTP 200, 33,342,752 bytes, SHA-256 `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`, 1.3 s. Anonymous access remains 401 by design. |

## 1 September stability follow-up

- Last 24-hour production query: `/api/healthz` 947/947 successful, zero non-2xx, zero server 5xx.
- Fresh external burst: 24/24 HTTP 200/ready, 88-397 ms.
- Health upstream latency in the 24-hour evidence: p95 179 ms, max 767 ms.
- Memory/restart review: peak 0.42 GB; 120 one-minute samples showed no restart discontinuity.
- Direct R2 HEAD from this host: 20/20 pass, 243-886 ms, median 289 ms. This does not measure the
  Railway serving region, but shows why the former 450 ms shared readiness deadline was unsafe.

The incident is mitigated and under monitoring. The hardening mechanism is evidenced; the original
external R2-latency trigger is still inferential, not a confirmed root cause.

## Rollback position after this deploy

The rollback target is now deployment `ed972e5b` / commit `6ce28d0f`, which **does** serve
`/api/healthz`. The 404 stop condition recorded in the runbook applies to the older `c819e6a8`
tuple, not to this one, so this deployment's recovery path is healthy.

## What this does NOT establish

The exact upstream event that produced historical elevated R2 latency remains unknown. Healthy R2
reads exceeding 450 ms prove the old budget could create false `not_ready`; they do not identify why
the incident window was slower. A future bodyless 503 must be correlated at the platform edge before
attributing it to the container.

## Unresolved questions

- What external event caused the historical R2 slowdown? Serving-region timing is not yet recorded.
- Keep proxy streaming or redesign the installer protocol? Current decision: retain streaming because
  the pinned installer rejects redirects, depends on Range/resume, and the latest transfer completed
  in 1.3 s without a server 5xx.
