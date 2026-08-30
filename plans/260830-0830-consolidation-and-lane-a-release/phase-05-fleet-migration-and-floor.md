---
phase: 5
title: "fleet-migration-and-floor"
status: in-progress
priority: P1
effort: "1–2 days"
dependencies: [4]
---

# Phase 5: fleet-migration-and-floor

## Overview

`MIN_RELAY_VERSION` is still **13**. Until it moves to 16, the replay fix shipped in v16 is optional
for the fleet and the vulnerable v15 relays keep receiving tickets. The entire security value of the
Relay work lives in this bump.

**Pre-P4a snapshot (now superseded):** It was correctly not done during the pre-merge run, for a
good reason: `/api/relay/download/v16` was
unreachable on the live deployment, so raising the floor would have cut off operators with no way to
upgrade. Phase 4 fixes that. This phase does the bump safely.

## The blast radius is real and known

Historical read-only production query, 2026-08-29 (ownership was unresolved at capture time; do not
use this wording as the current human-owner count):

| Version | Devices | Notes |
|---|---|---|
| v13 | 0 | — |
| v14 | 0 | — |
| **v15** | **2 active** | **2 distinct owner records in the database**, 1 linked account, last seen 2026-08-19, both `operatorKeyGrantPending` |
| unknown | 3 | all already revoked |

The original snapshot described two distinct database owner records; that is not a count of humans.
Q15 is now closed: both active v15 devices are the workspace owner's own machines. The
migration path is therefore self-serve reinstall on those machines; no notification or acknowledgement
channel is required. The database still cannot prove which binary is installed.

`RelayDevice` has no installer-version or acknowledgement columns, so the database cannot prove which
binary is on a machine or whether an update was applied. Do not infer either.

## Requirements

- Functional: v15 operators have a tested upgrade path to v16 **before** the floor moves.
- Functional: the floor change is route-first — `/v16` verified reachable by full GET first.
- Functional: rejection of an under-floor relay is a clear, actionable message, not an opaque failure.
- Functional: `MIN_RELAY_VERSION_BY_KIND` is re-derived correctly; it follows `MIN_RELAY_VERSION`
  through `Math.max`, so per-kind floors move with it.
- Safety: the vulnerable v15 bytes are revoked; a rollback must never silently re-enable them.
- Evidence: no device identifiers, owner identifiers, or account identifiers in any report.

## Implementation Steps

1. **Re-run the fleet inventory** against production, read-only, after the Phase 4 deploy. Numbers
   from 2026-08-29 are a week old by the time the floor moves; a device may have appeared or gone
   quiet. Emit aggregates only.

2. **Verify route-first, again, live.** Full GET of `/api/relay/download/v16` as an authorized
   caller. Compare bytes and SHA against
   `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`. A HEAD request is not
   sufficient and never was.

3. **Build the owner upgrade path.** Q15 identifies both devices as the owner's own machines, so
   document a self-serve reinstall from the 0.3.13 installer. No notification channel or external
   acknowledgement is needed. A real-device observation is still required before the bump; this host
   cannot operate either owner machine, so do not infer completion from database rows or route bytes.

4. **Make the rejection message actionable.** An under-floor relay should tell the operator what
   version it is, what is required, and where to get it. A bare 4xx turns a two-minute reinstall into
   a support ticket.

5. **Move the floor.** Change `MIN_RELAY_VERSION` 13 → 16 in `src/lib/tickets/ticket-types.ts`, deploy
   it, and confirm `MIN_RELAY_VERSION_BY_KIND` follows. This is a source change plus a deploy — it is
   not live until deployed.

6. **Probe the whole stranded set.** v13, v14, and v15 must each be rejected only after the route is
   live; v16 accepted; unknown and too-new versions fail safely. v13/v14 have no devices today but the
   inventory is a latest-state snapshot, not history — probe them anyway.

7. **Revoke the vulnerable bytes.** Ensure the v15 tuple is marked revoked through the compatibility
   floor. Note honestly what revocation cannot do: an R2 pointer change does not recall an EXE
   already on a disk. The floor is the enforcement; the pointer is bookkeeping.

8. **Record the migration outcome**, including any device that did not upgrade and what happens to it.

## Test Scenario Matrix

| ID | Scenario | Method | Expected |
|---|---|---|---|
| P5-01 | Fresh inventory | Read-only production query | Current counts; aggregates only, zero identifiers |
| P5-02 | Route-first live | Authorized full GET of `/v16` | Bytes and SHA match exactly |
| P5-03 | Real upgrade | Upgrade an actual v15 device | Reports v16 afterwards |
| P5-04 | Actionable rejection | Under-floor relay requests a ticket | Message names version, requirement, and remedy |
| P5-05 | Full stranded set | Probe v13/v14/v15/v16/unknown/too-new | Correct accept/reject, all fail-safe |
| P5-06 | Per-kind floors | Inspect after the bump | Follow `MIN_RELAY_VERSION` via `Math.max` |
| P5-07 | Revocation | Request the revoked v15 tuple | Marked revoked; hashes retained as negative evidence |
| P5-08 | No premature stranding | Timeline review | No rejection predates route availability |

## Current checkpoint — 30 August 2026

Q15 is closed: both active v15 devices are the owner's machines, so the documented path is a
self-serve 0.3.13 reinstall with no notification channel. After final P4a deployment
`ed972e5b-7597-4c6d-8066-24bc11c4ea0b` (master commit
`6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`), the fresh aggregate inventory is v15=2 active and
unknown/null=3 revoked (`reports/fleet-inventory-postdeploy.json`). An authorized full GET of
`/v16` returned 200 and the immutable published SHA; master CI/deploy-verification run
`33297347911` passed and the service healthcheck is `/api/healthz`. The source floor nevertheless remains 13:
neither owner machine has supplied an observed post-install v16 health response from this host.
No device identifier is recorded in the evidence.

## Success Criteria

- [x] Fresh inventory captured after the Phase 4 deploy.
- [x] `/v16` verified reachable by full GET before any floor change.
- [x] A self-serve upgrade path is documented for the owner's two machines; real-device
  post-install observation remains OPEN.
- [ ] `MIN_RELAY_VERSION` is 16 in production; per-kind floors follow.
- [ ] v13/v14/v15 rejected, v16 accepted, unknown/too-new fail safely.
- [ ] v15 bytes revoked, with the limits of revocation stated honestly.
- [ ] No device identifiers in any evidence file.

## Risk Assessment

- **Stranding an operator with no path back.** Route-first plus a tested upgrade, in that order. This
  is the exact hazard the run avoided by refusing the bump; do not reintroduce it by rushing.
- **Assuming the database knows what is installed.** It does not — no installer columns exist. Prove
  the upgrade by observing the device report v16, not by reasoning about it.
- **Stale inventory.** The 2026-08-29 numbers are not evidence at bump time. Re-run them.
- **Believing revocation recalls binaries.** It does not. The compatibility floor is what actually
  denies service; say so plainly in the report rather than implying recall.
