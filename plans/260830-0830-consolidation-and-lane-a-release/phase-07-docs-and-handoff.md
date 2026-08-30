---
phase: 7
title: "docs-and-handoff"
status: complete
priority: P2
effort: "1 day"
dependencies: [2, 4, 5, 6]
---

# Phase 7: docs-and-handoff

## Overview

Everything true about this system must survive in the plan directory, handoffs, and repository docs.
The pre-work inventory below is historical: the current overlays and runbooks have been written, and
the remaining work is a cold consistency review rather than an assumption that the system is absent.

This phase makes the repository self-explanatory to someone who was not here.

## Requirements

- Functional: `docs/` describes the system as it actually is, including what remains unproven.
- Functional: every operational procedure built during this work has a runbook a new operator can
  follow without reading a plan file.
- Functional: gate statuses in the acceptance matrix and roadmap match the evidence, with dates.
- Non-functional: no document claims a capability the evidence does not support. This is the failure
  mode the entire predecessor plan existed to correct — do not reintroduce it in the docs layer.

## Historical pre-work inventory (superseded by the current overlays below)

| Document | Problem |
|---|---|
| `MKTTool/docs/development-roadmap.md` | Historical sections remain, but the current overlay now records post-merge P4a and Lane C CLOSED |
| `MKTTool/docs/internal-beta-release.md` | Historical pre-merge wording needed qualification; current overlay now separates P4a from P4b |
| `MKTTool/docs/deployment-guide.md` | Historical `railway up` walkthrough remains as a labelled fallback; current path is master/GitHub integration |
| `MKTTool/docs/system-architecture.md` | Pre-overlay inventory; current file includes the trusted-proxy, rate-limit, journal, and one-seat sections |
| `MKTTool/docs/codebase-summary.md` | Pre-overlay inventory; current file includes the new modules |
| `MKTBrowser/README.md` | Pre-overlay inventory; current file records 0.3.13/provenance and identity boundaries |
| Acceptance matrix | Pre-overlay contradiction; reconciled in the matrix and worker report |
| — | Three runbooks now exist; cold command/path review remains the active check |

## Implementation Steps

1. **Update the acceptance matrix from evidence.** Set `G2-IDENTITY = FAIL` with the 2026-08-30 date
   and the three colliding surface digests. Resolve the `G3-RECOVERY` contradiction in the matrix
   itself, citing the line numbers and stating the reconciliation: historical subset PASS on a
   dirty-source artifact, OPEN on the exact published installer. Do not delete the old entries —
   supersede them, the way the run superseded its own S3 payload manifests.

2. **Rewrite `development-roadmap.md`** with real gate statuses and dates. Lane A: P4a deployed,
   with credentialed smoke and rollback rehearsal still named. Lane B: demo-only with the 60-day
   unsigned exception and its expiry date. Lane C: **CLOSED** because there is no CloakBrowser
   channel. No lane carries a date it cannot justify.

3. **Rewrite `internal-beta-release.md`** around the current tuple: installer `e5623b8a…76cc`, Relay
   v16 `5c98cf46…1842e`, engine pin `151.0.7922.108.2`. Keep the quarantined 0.3.12/v15 hashes as
   explicitly-labelled negative evidence — they are the reason several checks exist.

4. **Extend `deployment-guide.md`** with what was actually built: the `healthz` readiness contract,
   `db:backup:remote` → `db:restore:verify` preflight, the rollback tuple format, the
   `railway status` → master merge/GitHub deployment → post-deploy status sequence, and the
   route-first-then-floor rule with the reason it exists. Keep any direct `railway up` instructions
   explicitly labelled as an exceptional fallback.

5. **Update `system-architecture.md`** with the trusted-proxy chain, the database-backed rate-limit
   store, the fail-closed journal durability model, and the one-seat boundary showing where the
   server/operator key split lies.

6. **Regenerate `codebase-summary.md`** to cover the new modules: `trusted-proxy-config`,
   `restore-database-verification`, `spent-ticket-journal` durability, `license-key-pool`,
   `api/healthz`, and the contract tests.

7. **Write three runbooks** under `MKTTool/docs/runbooks/`, each executable by someone who has never
   read a plan file:
   - `database-restore.md` — backup, verify, and what a mismatch means
   - `relay-floor-migration.md` — inventory, route-first, owner self-serve reinstall, bump, probe,
     revoke (no notification step for Q15's owner-only fleet)
   - `release-rollback.md` — the complete tuple, the decision tree, and when to stop the line

8. **Reconcile the two plan directories.** Mark `260829-2125-internal-product-readiness` as
   superseded with its historical outcome, point at the verification report and P4a post-deploy
   record, and add an explicit Q16 closure notice to retained Browser reports. Cross-link this plan.
   A reader should be able to start at either and find the other.

9. **Final honesty pass.** Grep the docs for claims of uniqueness, isolation, undetectability,
   TikTok rollout readiness, or unsupported concurrency. Each must be absent or explicitly negated;
   technical-only TikTok setup language must not be presented as readiness. The
   `FingerprintForm` wording is the reference standard: *"These controls keep profile configuration
   internally consistent; they do not prove fingerprint uniqueness or identity isolation."*

## Test Scenario Matrix

| ID | Scenario | Method | Expected |
|---|---|---|---|
| P7-01 | Matrix matches evidence | Compare every gate to its evidence file | No status without a hash-bound source |
| P7-02 | `G3-RECOVERY` resolved | Read the matrix | Contradiction reconciled in place, history retained |
| P7-03 | No overclaims | Grep for uniqueness/isolation/TikTok/undetect | Absent or explicitly negated |
| P7-04 | Runbooks executable | Have someone follow one cold | Completes without external context |
| P7-05 | Versions current | Grep for `0.3.2`, `0.3.12`, `v15` | Only as labelled negative evidence |
| P7-06 | Plans cross-linked | Follow links both ways | Reader reaches the full picture from either |

## Current checkpoint — 30 August 2026, post-deploy reconciliation

The MKTTool operational docs and three runbooks originated in `faa8661`; their current overlays now
record the master/Railway P4a deployment, route/hash evidence, service-instance healthcheck, and
the Q15 self-serve path. MKTBrowser README and the acceptance matrix identify the current Browser
branch/provenance boundary. The reviewed predecessor records (including `baseline-capture.md`,
`fleet-v13-v15-inventory.{md,json}`, `s5-handoff-runbook.md`, and `handoffs/S1a-relay-durability.md`)
now carry explicit historical/current pointers and Q16 Lane C closure notices. The cold-operator
review is complete for command/path consistency; no production rollback or owner-machine reinstall
is claimed from documentation alone.

## Success Criteria

- [x] Acceptance matrix reflects evidence with dates; `G3-RECOVERY` reconciled in place.
- [x] Roadmap carries honest per-lane status; no unjustified dates.
- [x] Beta-release doc describes the current tuple; old hashes labelled negative.
- [x] Deployment guide covers healthz, backup/restore, rollback tuple, route-first-then-floor.
- [x] Architecture and codebase summary include the new modules.
- [x] Three runbooks exist and received a cold-operator command/path review; production rollback and
  physical owner-machine actions remain intentionally unexecuted.
- [x] Both plan directories are cross-linked with outcomes recorded, including the superseded
  predecessor and Q16 closure notice.
- [x] No unsupported uniqueness, identity-isolation, stealth, or TikTok-rollout claim remains in the
  current docs; historical statements are labelled and the technical-only boundary is explicit.

## Risk Assessment

- **Docs drifting again within weeks.** Phase 2's version-coherence and claim checks should cover the
  mechanical parts; the rest depends on updating docs in the same commit as the behaviour. Say so in
  the code standards.
- **Reintroducing overclaims through enthusiasm.** Step 9 is a required pass, not a courtesy. The
  product's central historical failure was documents promising what evidence denied.
- **Runbooks that only their author can follow.** P7-04 requires someone else to execute one cold. An
  untested runbook is a comforting fiction.
