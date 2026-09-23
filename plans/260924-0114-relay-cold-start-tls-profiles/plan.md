---
title: 'Relay cold readiness, compatibility TLS, and profiles diagnostics'
description: >-
  Repair three clean-VM blockers with measured readiness, verified artifact TLS,
  and actionable profile errors.
status: in-progress
sourceValidation: PASS
acceptance: OPEN
releaseVerdict: NO-GO
priority: P1
branch: master
tags:
  - bugfix
  - relay
  - browser
  - readiness
  - tls
effort: 18-26h plus clean-VM execution
blockedBy: []
blocks:
  - 260908-0740-local-vm-product-release
  - 260921-1331-cloak-fast-profile-switch
created: '2026-09-23T18:17:38.729Z'
updated: '2026-09-24'
createdBy: 'ck:plan'
source: skill
---

# Relay cold readiness, compatibility TLS, and profiles diagnostics

## Overview

Implementation is in progress. Source-only repairs and local source validation are frozen, but
exact-runtime, replacement-candidate, and clean-VM acceptance remain open. Scope: the three
failures recorded on 23 September for Browser 0.3.24 / Relay 18. Work in `E:/MKTWorkspace`, with
separate Git roots for MKTTool and MKTBrowser.

Read [Claude handoff](./claude-handoff.md), then [verified analysis](./reports/source-analysis.md).
The latter distinguishes observed failures, confirmed code behavior, and unresolved causes.

| Issue | Confirmed | Required result |
|---|---|---|
| Cold health | 5,064.978 ms exceeds Web's 4,000 ms; timeout becomes `no-permission` | Bounded health, truthful pending/timeout state, responsive cold path |
| Compatibility TLS | Ticket issued; packaged Relay rejected pilot artifact TLS; transition absent | Exact packaged downloader accepts intended trust chain and rejects invalid chains |
| Profiles | One diagnostic GET returned 400 in 3,449.4 ms; body lost | Capture a safe reason/stage, repair the proven cause, preserve honest refusals |

Preferred design: separate fast Relay availability from expensive Browser/install readiness;
retain strict action gates. Do not solve this by only increasing the global timeout. Keep native
TLS verification, signed artifacts, ownership, replay protection, and proxy checks intact.

The replacement Browser/Relay pair must negotiate a versioned install-readiness contract. A Browser
reporting an incomplete, missing, or stale local-install observation is not authorized for profile
inventory, creation, or launch; the Relay action boundary is authoritative.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Capture baseline and diagnostic evidence](./phase-01-capture-baseline-and-diagnostic-evidence.md) | In Progress |
| 2 | [Repair cold readiness and timeout classification](./phase-02-repair-cold-readiness-and-timeout-classification.md) | In Progress |
| 3 | [Repair compatibility artifact TLS trust](./phase-03-repair-compatibility-artifact-tls-trust.md) | In Progress |
| 4 | [Resolve profiles rejection and error contract](./phase-04-resolve-profiles-rejection-and-error-contract.md) | In Progress |
| 5 | [Validate replacement candidate and hand off](./phase-05-validate-replacement-candidate-and-hand-off.md) | In Progress |

## Execution checkpoint - 24 September 2026

| Evidence domain | Verdict | Boundaries |
|---|---|---|
| Source repair and freeze | PASS (source-only) | MKTTool `014c77d`; MKTBrowser `6d13e8d`; focused tests and isolated quality/Relay/security gates passed. |
| MKTTool contracts runner | BLOCKED | Requires PostgreSQL 16; host has PostgreSQL 17 and Docker is unavailable. No production database was used. |
| Replacement candidate and product acceptance | OPEN / NO-GO | Exact SEA TLS, public TLS, new tuple/pins, two-build equivalence, clean-VM cold/page/profile lifecycle, human, second-PC, and canary evidence are not observed. |
| Identity boundary | FAIL | `G2-IDENTITY=FAIL` unchanged; no identity-isolation or real-account-safety claim is authorized. |

No MKTTool `master` push, deployment, publication, or candidate promotion occurred. All phase
success-criteria checkboxes remain open: source tests do not substitute for the required exact
artifact, VM, or human acceptance evidence.

## Dependencies

Phase 1 precedes all fixes. Phases 2 and 3 are independent after diagnosis; Phase 4 uses Phase 1
evidence and Phase 2 readiness semantics. Phase 5 follows all three fixes. Five phases keep the
unknown-cause diagnostic and exact-artifact acceptance separate from the three repair tracks.

This plan blocks the remaining practical acceptance/delivery work in
[local VM release](../260908-0740-local-vm-product-release/plan.md) and
[fast profile switching](../260921-1331-cloak-fast-profile-switch/plan.md).
Their completed source/installer evidence remains historical PASS; this does not reopen completed
licence/fingerprint research or the accepted 0.3.17 tuple.

## Acceptance Boundary

- Preserve the rejected frozen candidate and original receipts. Fixes create a new candidate.
- Source tests, packaged TLS tests, clean-VM product checks, and public-TLS checks have separate verdicts.
- First cold request is measured before any readiness prewarm from a test harness. Production
  startup preparation is permitted if it is part of the delivered behavior and included in timing.
- Target health handler budget: 2,500 ms; actual cold page GET must remain below 4,000 ms in every
  predefined trial. Pending/unknown is not Ready, permission denial, capacity refusal, or repair failure.
- Profiles success requires 200 and a valid inventory/options payload, including a legitimate empty list.
  Failure requires a stable safe code/stage, never an invented empty success or raw engine exception.
- No ticket/profile/engine retry loops. Use a fresh authorization for each planned update attempt.
- ACPI diagnosis is a separate cleanup follow-up; retain bounded guest OS shutdown fallback.
- Public/operator promotion still requires exact-tuple approval; second-PC, human permission,
  page-network and elapsed canary evidence stay OPEN if unobserved. `G2-IDENTITY=FAIL` is unchanged.

## Open Questions To Resolve During Implementation

1. Which spans account for the cold 5,064.978 ms, including install inspection and secure-store reads?
2. Which TLS cause code/chain failed in the exact SEA process, and is public TLS affected?
3. Which `/profiles` rejection branch produced the historical 400? A new reproduction cannot
   retroactively prove the missing original body unless independently correlated.
