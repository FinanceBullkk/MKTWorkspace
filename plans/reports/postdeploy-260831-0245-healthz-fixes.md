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
| `/api/relay/download/v16` full GET + hash | **NOT re-verified.** The route returns 401 to anonymous probes; an authorized GET is required. The last full GET with hash comparison against `5c98cf46...1842e` is the earlier `ed972e5b` evidence and was not repeated for this deployment. |

## Rollback position after this deploy

The rollback target is now deployment `ed972e5b` / commit `6ce28d0f`, which **does** serve
`/api/healthz`. The 404 stop condition recorded in the runbook applies to the older `c819e6a8`
tuple, not to this one, so this deployment's recovery path is healthy.

## What this does NOT establish

The fixes are hardening, not a proven cure. The incident's restart cause remains unidentified: the
external verifier observed multiple startup sequences over a longer log window, and no memory metric
has been read by anyone. `railway logs` returns only the first ~5 minutes of a deployment, so it
cannot answer this. Whether the 503s recur is the real test, and it needs hours of observation
rather than a post-deploy probe.

## Unresolved questions

- What restarts the instance? Railway dashboard memory metrics around 17:30 and 02:00 ICT would
  settle the OOM question that neither party can currently answer.
- Does `/api/relay/download/v16` still serve the published bytes for authenticated devices on this
  deployment?
- Should `/api/relay/download/v16` stream 33 MB through an app worker at all, or redirect to a
  signed R2 URL?
