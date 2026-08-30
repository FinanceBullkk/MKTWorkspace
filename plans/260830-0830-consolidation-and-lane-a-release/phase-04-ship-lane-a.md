---
phase: 4
title: "ship-lane-a"
status: partial
priority: P1
effort: "1–2 days"
dependencies: [1]
---

# Phase 4: ship-lane-a

## Overview

Lane A — MKTTool Web/Facebook, admin-led internal production — is the one lane that can actually
ship. Its hardening is built and tested: database-backed rate limiting proven with two racing
workers, trusted-proxy resolution, an unauthenticated readiness route, restore verification against
real production data, `deepmerge-ts` HIGH resolved with a clean audit.

What is missing is not engineering. For P4a, the attestation chain is **clean source → CI → current
database backup/restore → rollback tuple → master merge → verified deployment and route**. The signed
five-artifact tuple belongs to P4b and is not a web-service prerequisite.

## Correction, 2026-08-30 10:20 — this phase conflated two different tuples

U4 came back BLOCKED because the release ceremony demanded a **five-artifact compatibility tuple**
(`--installer --relay --browser --control-contract --engine`), and the CloakBrowser Stable `.2`
archive is missing. Codex was right to refuse to fabricate one.

But that requirement was inherited wrongly. Two separate things were treated as one:

| Artifact | What it is for | Needs the engine? |
|---|---|---|
| **MKTTool web deployment** | The Next.js service on Railway — auth, rate limiting, healthz, relay download route | **No.** The web app does not contain the engine. |
| **Five-artifact compatibility tuple** | The Browser/Relay/engine fleet contract that devices read to update | Yes — genuinely blocked on the vendor. |

**And `railway up` is not the deployment path here.** `MKTTool/.github/workflows/ci.yml:235` states it
plainly: *"Railway deploys from master, so merging is deploying"*. Railway's GitHub integration
deploys on master, and `ci.yml` already carries a `deploy-verification` job that fails when a merge
produces no deployment or a failed one.

So Lane A ships by **merging the consolidation branch to master with CI green** — not by signing a
Browser tuple. The engine archive never gated it. Phase 4 is split accordingly:

- **P4a — Lane A web deployment.** Unblocked by the tuple correction. Gated on CI green, the
  fresh backup/restore and rollback tuple, and the owner's now-answered Q13 merge approval.
- **P4b — Browser five-artifact tuple.** Genuinely blocked on the vendor; belongs with Lane B/C, not
  with Lane A.

Nothing about the safety posture changes: the merge still requires green CI, a recorded rollback
tuple, backup and restore proven, and post-deploy verification. What changes is that Lane A is no
longer hostage to a vendor deliverable it never needed.

## The chain, and why order matters

**P4a — the Lane A chain, corrected:**

```text
owned source paths clean (P1)                     ✅ protected MKTTool AGENTS files remain local
  -> CI green on the consolidation branch          ← U2's new gates must pass on themselves
     -> backup + db:restore:verify on current DB   ← proven once; re-run against today's database
        -> rollback tuple recorded
           -> Q13-approved merge to master          ← production deployment; do not merge on red CI
              -> Railway auto-deploys from master
                 -> /api/healthz returns 200
                    -> /api/relay/download/v16 reachable
                       -> route-first satisfied; Phase 5 may move the floor
```

Every arrow is a precondition, not a suggestion. The pre-merge baseline was `/api/healthz` →
**404** and `/api/relay/download/v16` → **401** while Railway served `c819e6a8`; after the
approved merges, final deployment `ed972e5b…` serves master commit `6ce28d0f…`, healthz is 200,
and the authorized full `/v16` GET matches the immutable published bytes. The earlier successful
deployment `8e1123a3…` is retained as a historical P4a receipt.

**P4b — the Browser tuple** stays exactly as the rest of this phase describes: five artifacts, signed
ceremony, engine archive required. It is blocked on the vendor and does not gate P4a.

## Requirements

- Functional: production runs the committed candidate source, not an uncommitted draft.
- Functional: Railway deployment metadata is captured immediately before and after the Q13-approved
  merge; Railway's GitHub integration is the deployment path, not a bare `railway up`.
- Functional: the deployed commit is verified against `meta.commitHash` from Railway after deploy;
  `/api/healthz` is a readiness signal and does not expose source identity.
- Functional: after the deployment and route checks pass, `healthcheckPath` is configured to the new
  `/api/healthz` route.
- Operational: backup taken and restore verified **before** the migration runs, using the tooling
  built in the run.
- Safety: rollback tuple recorded and rehearsed before deploy, not after.

## Related paths

| Path | Action |
|---|---|
| `MKTBrowser/scripts/emit-release-provenance.cjs` | Retain as P4b evidence; not a P4a gate |
| `MKTTool/.github/workflows/ci.yml` | Required branch checks before merge |
| `MKTTool/src/app/api/healthz/route.ts` | Verify live after deploy |
| Railway service settings | Set `healthcheckPath`; no `railway.json` exists — configure explicitly |
| `MKTTool/scripts/restore-database-verify.ts` | Preflight |
| `plans/260830-0830-consolidation-and-lane-a-release/reports/lane-a-deploy.md` | Create |

## Implementation Steps

1. **Confirm the source gate.** Verify the consolidation branch has all owned changes committed and
   required CI checks configured. The protected `AGENTS.md` files are intentionally excluded from
   staging. The Browser provenance receipt may remain a separate P4b record; it is not a web deploy
   precondition.

2. **Record the rollback tuple first.** Source SHA, migration state, Relay version, deployment ID
   `3621f603-1c51-4246-824c-55cc0e6b5764`, rollback commit `c819e6a8`, and the current schema state.
   Written down before anything changes, or the rollback is theatre.

3. **Run the backup and restore preflight.** `npm run db:backup:remote`, then `db:restore:verify`
   against a disposable Postgres. This already passed once during the run; it must pass again
   against the current database, not be inherited.

4. **Keep the Browser ceremony out of P4a.** The Browser provenance receipt is retained as P4b
   evidence, but the missing Stable `.2` engine archive means no five-artifact tuple can be signed.
   It is not needed by the Next.js web service and must not be fabricated to satisfy this phase.

5. **Prepare the merge.** Capture `railway status --json` and the rollback tuple immediately before
   the owner-approved merge. Confirm the route is unauthenticated and sub-second — it must not inherit
   `guardedRoute`, and it must never be pointed at `api/health/run`, which is authenticated, opens a
   browser, and has `maxDuration = 120`.

6. **Merge/deploy.** Once all required branch checks are green and no source work is uncommitted,
   merge PR #40 to `master` under Q13. Railway's GitHub integration deploys from `master`; do not
   substitute `railway up` for that path. Capture the resulting deployment ID and commit.

7. **Verify from outside.** `/api/healthz` must return 200 with `ok:true`, `status:"ready"`, database
   readiness, and Relay v16. Verify the deployed commit separately through Railway deployment
   metadata (`meta.commitHash`); healthz does not expose source identity. `/api/relay/download/v16`
   must serve the exact published bytes to an authorized caller — verify by full GET and hash, not
   HEAD. Confirm the Better Auth shared-IP warning is gone from the logs and that two distinct clients
   receive separate rate-limit buckets in production. Only after these checks, set Railway's
   `healthcheckPath` to `/api/healthz`.

8. **Run the bounded Lane A smoke** against production: allowlist and role matrix, Google OAuth
   start/callback/session revocation, Facebook token health and revocation where enabled,
   posting-safety confirmation on destructive actions, scheduled job health, backup freshness. Record
   what passed, what was synthetic, and what was not exercised. The Reddit parser failure observed
   during the run is out of Lane A scope — note it, do not fix it here.

9. **Rehearse the rollback** in a disposable environment against the recorded tuple before declaring
   Lane A shipped. If rollback has not been executed once, it does not exist.

10. **Record the Lane A decision.** GO or NO-GO with residual risks named, including the 60-day
    unsigned-installer exception, the P4b open tuple, and the fact that Lane C is closed with no
    CloakBrowser channel.

## Test Scenario Matrix

| ID | Scenario | Method | Expected |
|---|---|---|---|
| P4-01 | Attestable source | branch status + required CI | owned source paths committed; protected AGENTS files excluded |
| P4-02 | Rollback tuple complete | Review before deploy | Every field present |
| P4-03 | Backup + restore | Fresh run against current DB | Row/checksum match, cleanup passes |
| P4-04 | Browser tuple signature (P4b) | Verify with public material when the five-artifact tuple exists | Tampered tuple rejected; this is not a P4a gate |
| P4-05 | Healthcheck live | External GET `/api/healthz` + Railway metadata | 200/readiness fields; commit checked in `meta.commitHash` |
| P4-06 | Route-first satisfied | Authorized full GET of `/v16` | Bytes and hash match the published object |
| P4-07 | Rate limiting in production | Two distinct client IPs | Separate buckets; no shared-IP warning |
| P4-08 | Lane A smoke | Bounded admin-led run | Passes recorded honestly, with scope labelled |
| P4-09 | Rollback drill | Disposable restore of the prior tuple | Bounded recovery, documented |

## Current P4a checkpoint — 30 August 2026

The provenance rerun is accepted for the Browser source (`source.clean=true`) as P4b evidence. The
fresh current-DB backup/restore passed and the rollback tuple was recorded before merge. The
disposable P4-09 rehearsal is now executed and qualified; it restored the recorded prior state,
applied the candidate migration, rebuilt/started the exact prior source, and cleaned up with
`CLEANUP_REMAINING=0`. It did not touch Railway production. The drill found that prior source serves
`/api/health/run` but returns 404 for `/api/healthz`, while the live service healthcheck targets
`/api/healthz`; a human-approved rollback therefore still needs a prior-compatible healthcheck
decision. PR #42's
required checks (`33296599912`) passed, then the approved merge reached `master` at
`6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`; final master run `33297347911` also passed. Railway
deployment `ed972e5b-7597-4c6d-8066-24bc11c4ea0b` is SUCCESS with the matching commit;
`/api/healthz` is 200; the authorized final `/v16` full GET is an exact hash match; and
`healthcheckPath=/api/healthz` is set. One earlier client transfer ended before the complete body,
but the retry completed all bytes and matched the hash; this transport observation is retained in
the evidence report. The Better Auth shared-IP warning is absent in the final log query after
`TRUSTED_PROXY_IP_HEADERS=x-real-ip`; the burst proof is explicitly synthetic/header-labelled, not
two physical networks. P4b remains OPEN and is not a P4a precondition.

## Success Criteria

- [x] Browser provenance receipt is retained as P4b evidence; its five-artifact tuple remains OPEN
  for the missing engine archive and is not a P4a requirement.
- [x] Rollback tuple recorded before any change.
- [x] Disposable rollback rehearsal completed and documented before a Lane A GO; the exact prior
  tuple, restore/migration/build timings, cleanup, and failure-at-step signatures are in
  `reports/rollback-drill-p4-09.md`. The operational healthcheck prerequisite remains OPEN.
- [x] Backup and restore verified against the current database.
- [x] Committed candidate deployed; deployed commit verified against Railway metadata after the fact.
- [x] `/api/healthz` returns 200 and Railway's healthcheck points at it.
- [x] `/v16` serves the exact published bytes — route-first is satisfied for Phase 5.
- [x] Production rate limiting uses the configured client header and the shared-IP warning is gone
  in the bounded synthetic production burst; physical second-network evidence is not claimed.
- [ ] A signed Lane A GO/NO-GO exists with residual risks named.

## Risk Assessment

- **Deploying a draft.** The branch/CI gate and merge SHA are the guard; do not merge with uncommitted
  source or a stale head.
- **Migration outliving the old binary.** Backup, expand-contract migrations, and a rehearsed
  rollback. The restore path exists now — use it rather than trusting it.
- **Healthcheck pointed at the wrong route.** `api/health/run` would fail on auth and time out,
  making Railway think the service is dead. Verify externally after deploy, not by reading config.
- **Declaring Lane A shipped on synthetic evidence.** Step 8 requires labelling what was synthetic.
  A green smoke over mock data is not a production smoke.
