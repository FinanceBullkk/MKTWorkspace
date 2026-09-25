---
title: 'Relay cold readiness, compatibility TLS, and profiles diagnostics'
description: >-
  Repair three clean-VM blockers with measured readiness, verified artifact TLS,
  and actionable profile errors.
status: in-progress
sourceValidation: PASS
sourceFreeze: PASS
sourceFreezeScope: committed-source-only
fullTestSuite: PASS
localContracts: PASS
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
updated: '2026-09-25'
createdBy: 'ck:plan'
source: skill
---

# Relay cold readiness, compatibility TLS, and profiles diagnostics

## Overview

Implementation is committed and final frozen-source local validation passes. The four follow-up
source-review findings are resolved. Exact replacement-installer and clean-VM acceptance remain
open; local validation does not complete any of the five acceptance phases. Scope: the three failures recorded on 23 September for Browser 0.3.24 / Relay 18.
Work in `E:/MKTWorkspace`, with separate Git roots for MKTTool and MKTBrowser.

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

## Current Checkpoint - 25 September 2026

Source freeze is PASS for clean committed source only: MKTTool `a32c293fc9a25c3d17873a31e9a5a62d711e2f3e`
(tree `fd4b7a04d90b0aecb240bd846004de8a61335f01`) and MKTBrowser
`67e8f16b35a3b8427cf5d5d98aebdc413eee2447` (tree `8820784941a838f5ca26387fde2608e396460e7e`).
The final Tool commit normalizes all three delivered Windows scripts to CRLF while preserving all other bytes, including the PowerShell BOM; Browser source binding includes that helper. The earlier
`js-yaml` 4.3.2 development advisory fix remains included. Focused Tool 25/25 and Browser 23/23,
lint and diff checks pass. Final Tool r2 quality 10/10 (2,457 tests, zero skips; coverage thresholds
met), security 2/2, contracts 3/3 and Relay 5/5 pass. Exact production-origin Relay rebuild,
packaged smoke, direct-child strict TLS/handoff 3/3 and final source binding pass. The official
Browser eight-stage gate at `67e8f16` passes 8/8. Its installer suite passes 719 tests with one
explicit machine-test skip; the dedicated machine gate passes 4/4. Both occurrences of that opt-in
skip, including the build's repeat, are covered with zero unexplained skips. Post-quality source
binding and owned-environment cleanup pass. The [current checkpoint ledger](../reports/checkpoint-260925-1335-candidate-backlog.md)
owns the immutable receipts; `r2/verified-ledger.json` is PASS (SHA-256
`7d29ad9bbd124ac073085b8e66c1821342959c844675365570682c9bb13466b7`).

The selected replacement is Browser `0.3.27` / Relay `20`, candidate
`20260925-browser-0.3.27-relay-20-cold-start-tls-profiles-cft`, with Relay archive
`c66a39353252ffa7b6ad9b936f5aad02634c729560f3b49793f4cbfe5b55526b`.
The new archive is 35,123,164 bytes; the executable hash is unchanged. The prior unpublished
`e749be84...7439ff` pin depended on mixed script line endings and failed the exact-artifact rebuild
gate. Its immutable receipt remains BLOCKED. Earlier `38b5ed0` quality 10/10, security 2/2,
contracts 3/3 and Relay 5/5 PASS receipts are historical after this source change; they cannot
replace r2 validation. The ledger records the entry-level diagnosis and exact receipt paths.
The earlier `0.3.26` candidate really passed eight local quality stages and a two-build
comparison of 129 normalized payload files. Its Relay archive
`9cc71eba405c8ea5ff9f288491ea0b827c7403b3c43541d1fa18c48a87126d69` then failed terminal
update handoff and is forbidden as a packaging input. Those receipts remain historical.

The four source-review findings are resolved in committed source: bounded bootstrap-parent
readiness, Relay version-floor alignment, per-invocation packaging receipts and empty known-folder
cleanup. The later terminal handoff repair is also committed. The first Browser r2 gate failed its
concurrent-wrapper 15-second watchdog under cross-file PowerShell contention; its FAIL receipt is
preserved. Browser `67e8f16` serializes packaging test files without changing assertions, watchdogs
or the two concurrent wrappers inside that test. The serial packaging diagnostic passes 109 tests
with one explicit machine-test deferral; the later official full rerun now closes the local Browser
gate. The technical directory package uses `includeRelay=false`; it is not a Browser installer or
an accepted candidate. No `0.3.27` installer build, VM run, push, deployment, publication or promotion
is part of this checkpoint. Exact replacement installer, cold-page/profile, public-TLS, human,
second-PC and canary acceptance remain OPEN; the overall release verdict remains NO-GO.

## Historical Execution Checkpoint - 24 September 2026

The following rows retain the results and limits of that earlier inspection; they are not the
current source or candidate allocation status.

| Evidence domain | Verdict | Boundaries |
|---|---|---|
| Source repairs and focused validation | PASS (committed source, focused scope) | MKTTool `b9dda844a6ab1cc4f355799486bdda40782af5b5`: focused no-DB 211/211, Relay 514/514, typecheck/lint, TLS 12/12, local validation 15/15, post-simplify 98/98. MKTBrowser `7df85768f1e9ec6e23da39c9d87aed09acdc098d`: cache-hit Relay handoff repair; focused Node 22.23.2 tests 25/25. The 712/713 installer result is parent-checkpoint evidence, not a refreshed full-suite result for this commit. |
| Source freeze | IN PROGRESS (Browser refresh) | Clean MKTTool HEAD `b9dda844a6ab1cc4f355799486bdda40782af5b5` (tree `80ca729c84f71e0766821390b7992e4ad6b5a52d`) and MKTBrowser HEAD `7df85768f1e9ec6e23da39c9d87aed09acdc098d` (tree `467175a2f038d69ca571251ac3ac809ebc0028a0`). The new Browser head has focused PASS evidence but still needs the final suite refresh. No push. |
| MKTTool full test suite | BLOCKED | `npm test` reached 2,048 passing tests, but 342 database tests lack required test-schema tables; this is not a PASS. |
| MKTTool contracts runner | PASS (local contract scope) | Fresh detached `b9dda844a6ab1cc4f355799486bdda40782af5b5` checkout: Node `22.23.2`, PostgreSQL `16.12`, and official runner passed dependencies, empty-database preflight, and restore/rate-limit contracts (3/3). Receipt: `D:\MKTWorkspace-local-validation\260924-b9dda-pg16-contracts-pg16-r1\receipt.json`, SHA-256 `c097a49e41636e3ff24f7980fab190cacd601552b55dbb705239cdf19757fc12`. |
| Current local SEA TLS and handoff | PASS (local source diagnostic only) | Fixture-bound Relay v20 archive `cb2cf850d391c5bbc07730d4c67be284944ad760374c2f7237d10609eee3cc1c` / executable `9b1e252255f28f2c6befb4a203bfb51104487ec70b399e13e2fdb403238a48b6`: direct-child trusted/missing-intermediate/wrong-hostname flow 3/3, disposable TLS matrix 12/12, and packaged Relay smoke passed. A Global per-user-SID mutex serializes CurrentUser certificate fixture cleanup across Windows sessions. The source repair is committed locally as MKTTool `b2e0707219c080045d9406518ee3ad65358cada1`; the locally built archive remains diagnostic only, not a replacement candidate, normal-parent scoped-trust, or public-TLS result. |
| Retained Relay v20 exact TLS diagnostic | FAIL (retained bytes only) | The hash-verified v20 archive/executable reaches staging with the direct test child and scoped CA, but the old `onPrepared` path never completes the helper-lock handoff or exits (`null !== 0`). Normal parent launch continues to scrub the scoped CA by design. The expected failure leaves zero fixture/retained-case directories, tagged certificates, or Relay processes. This does not prove public TLS or a replacement candidate. |
| Heavy Browser build and replacement-candidate execution | BLOCKED (host preflight) | 24 September measurement found 1,520 MiB available RAM. `VBoxManage.exe` was unavailable on `PATH`, but explicit `C:\Program Files\Oracle\VirtualBox\VBoxManage.exe list runningvms` succeeded with empty output: no VM was running at inspection. No heavy Browser build, two-build comparison, candidate installer, VM run, public TLS, deployment, publication, or promotion was started. |
| Replacement candidate and product acceptance | OPEN / NO-GO | Exact SEA TLS, public TLS, new tuple/pins, two-build equivalence, clean-VM cold/page/profile lifecycle, human, second-PC, and canary evidence are not observed. |
| Identity boundary | FAIL | `G2-IDENTITY=FAIL` unchanged; no identity-isolation or real-account-safety claim is authorized. |

Historical failed and blocked receipts remain unchanged. Later source repairs and candidate work
are recorded in the current checkpoint above; a historical host measurement is not a current
preflight or an acceptance verdict. Recheck host resources before Browser packaging or VM work.

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
3. What safe code/stage does the replacement candidate report for a reproduced `/profiles` refusal?
   The original missing-body cause remains unknown and is not a new recoverability gate.
