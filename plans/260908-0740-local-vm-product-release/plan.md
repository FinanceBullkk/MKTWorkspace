---
title: Local VM product release
description: >-
  Replace hosted-only release gating with exact local and clean-VM evidence;
  enable supported CFT first run.
status: in-progress
priority: P1
branch: codex/profile-manager-readiness-evidence
tags: []
blockedBy: []
blocks:
  - 260908-0644-ready-to-use-closeout
created: '2026-09-08T00:45:50.779Z'
createdBy: 'ck:plan'
source: skill
---

# Local VM product release

## Overview

Owner selected local validation/build plus a disposable clean VM as the authoritative release
path on 8 September 2026. GitHub remains source hosting; Actions is optional diagnostics.
This supersedes only the hosted-only policy, not historical failed/skipped results or acceptance.

Scope: Windows proxy/profile manager, one profile at a time, manual account input. No
antidetect claims, vendor work, posting expansion, or weakening signed tickets/proxy isolation.
Use existing release signer, immutable storage and updater; no unpinned packaged bootstrap.

Execution: ck:cook --auto after independent review. Phase 2 and 3 can proceed independently.
Reports stay here; binary evidence and secrets stay outside tracked source.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Release contract and plan review](./phase-01-release-contract-and-plan-review.md) | Completed |
| 2 | [Local release gate](./phase-02-local-release-gate.md) | Completed |
| 3 | [CFT supported provisioning](./phase-03-cft-supported-provisioning.md) | In Progress |
| 4 | [Exact VM verification and delivery](./phase-04-exact-vm-verification-and-delivery.md) | In Progress |

Phase success criteria: 4/12 checked; 2/4 phases completed. Local command/payload evidence does not
close supported activation, VM, page-network, human, independent-hardware or elapsed-canary gates.

## Dependencies

Blocks the remaining engine-activation and release tasks of the earlier closeout. Prior installer,
startup and settings tests are historical evidence, rerun only when the tested artifact changes.
Two clean isolated builds compare normalized payloads; exact chosen installer is never rebuilt
between VM verification and publication. Same-host VM is not independent physical hardware.

## Success Criteria

- Required checks produce fail-closed receipts bound to source commits, artifacts and toolchains.
- Fresh installed CFT activates through verified signed release metadata without test overrides.
- Exact installer passes clean install, repair, uninstall, normal first run and managed lifecycle.
- Publication uses current valid signatures, immutable keys, full GET/hash and rollback safeguards.
- Page-network, unfamiliar-operator, second-PC and seven-day canary remain explicit if unobserved.

## Risks

Release tuple/version coordination and initial signed metadata delivery need code-level review.
Unsigned executable status is separate from manifest signing. No generic PASS via owner authority.
Do not disable automatic workflows until equivalent runnable local checks exist.

## Review Resolution

Initial review 7/10 identified three high-risk gaps. Phase details now require exact CFT contract
replacement, full publisher preflight before any PUT, and commit/freeze/sign/test/promotion order.
Existing ADMIN repair path handles first provisioning; no new Browser trust implementation.
Live HEAD: v16 manifest and five compatibility object keys absent; delegation expires August 2027.
