---
title: Local VM product release
description: >-
  Replace hosted-only release gating with exact local and clean-VM evidence;
  enable supported CFT first run.
status: in-progress
priority: P1
branch: codex/profile-manager-readiness-evidence
tags: []
blockedBy: [260924-0114-relay-cold-start-tls-profiles]
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

The remaining practical acceptance/delivery work is blocked by the
[Relay cold health, pilot TLS and profiles repair plan](../260924-0114-relay-cold-start-tls-profiles/plan.md).
The 23 September terminal report records these failures on the 0.3.24 / Relay 18 candidate;
historical completed gates remain unchanged. A replacement payload needs new exact-candidate evidence.

Blocks the remaining engine-activation and release tasks of the earlier closeout. Prior installer,
startup and settings tests are historical evidence, rerun only when the tested artifact changes.
Two clean isolated builds compare normalized payloads; exact chosen installer is never rebuilt
between VM verification and publication. Same-host VM is not independent physical hardware.

## Current Candidate Checkpoint - 25 September 2026

The repair plan now freezes clean committed MKTTool `a32c293fc9a25c3d17873a31e9a5a62d711e2f3e`
and MKTBrowser `67e8f16b35a3b8427cf5d5d98aebdc413eee2447` source. Browser `0.3.27` / Relay `20`
pins the deterministic `c66a3935...5526b` archive (35,123,164 bytes; unchanged executable).
The prior unpublished `e749be84...7439ff` ZIP depended on mixed script line endings; its immutable
exact-artifact receipt remains BLOCKED. Final source normalizes the three delivered scripts to
CRLF with BOM preserved and binds the helper as a release input. The four earlier source-review
blockers are resolved. Previous `38b5ed0` local-gate PASS receipts are superseded for acceptance;
Tool r2 quality/security/contracts/Relay, exact production-origin Relay smoke/TLS and source binding
now pass locally. Browser `67e8f16` serializes packaging test files after a preserved r2 watchdog
FAIL under PowerShell contention, without relaxing assertions or deadlines. Its official eight-stage
rerun passes 8/8; both opt-in machine-skip occurrences are covered by the dedicated 4/4 gate.
Final source binding, post-quality read-back and owned-environment cleanup pass. The technical
Browser directory package has `includeRelay=false` and is not an accepted installer. The final
verified local ledger is PASS; evidence is indexed by the
[current checkpoint ledger](../reports/checkpoint-260925-1335-candidate-backlog.md).

The abandoned `0.3.26` candidate passed eight Browser quality stages and a two-build comparison
of 129 normalized files, then failed retained Relay terminal handoff. Its `9cc71eba...26d69`
archive is forbidden and its receipts remain historical. Neither that comparison nor older
completed local-gate phases accepts `0.3.27`. No new Browser installer packaging, VM execution,
push, deployment or publication is part of this source-backlog checkpoint. The exact replacement
installer, cold-page/profile/public-TLS, human, second-PC and canary gates remain OPEN.

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
Historical initial review: v16 manifest and five compatibility object keys were absent; delegation
expiry was recorded as August 2027. This is not a refreshed live-storage observation.
