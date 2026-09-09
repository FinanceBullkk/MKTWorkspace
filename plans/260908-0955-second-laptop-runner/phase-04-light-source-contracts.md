---
phase: 4
title: Isolated light source contracts
status: completed
verifiedAt: '2026-09-08T04:23:40Z'
---

# Phase 4: Isolated Light Source Contracts

## Context

Owner requested implementation on 8 September 2026 after the MSI inventory. This is a bounded
Node 22 source-test lane, not installer build/promotion. Main handles existing VM acceptance in
parallel; neither checkout nor frozen installer is replaced. Execution uses ck:cook --auto.

## Implementation

1. Keep manual probe as default; add explicit `source-contracts` choice on the same registered
   branch-only workflow. Retain disabled hosted job; source job depends on successful inventory.
2. Validate exact repository/ref/SHA/runner/MSI and free resources before provisioning. Require
   1.25 GiB free RAM and 2 GiB free disk; otherwise record BLOCKED without installing or building.
3. Create unique per-run/attempt checkout and output ownership. Pin checkout action by full SHA,
   persist-credentials false; contents-read only in the source job. Never use private sibling credentials.
   Establish owned empty Git global/system/template config and disabled hooks/signing/prompts
   BEFORE checkout; sanitize inherited Git configuration for checkout and all synthetic test commits.
4. Download only official Node 22.23.2 Windows x64 ZIP (35,683,585 bytes), SHA-256
   `1177b4137ba5adaa56354ae40f1080c7450e8ae09cecb47da459d1c52ac99f97`; bound transfer/extraction,
   verify before extraction, invoke by absolute path, verify version/platform/architecture.
   Do not change global Node/PATH/toolcache or invoke package managers.
5. Run serial, 128 MiB Node heap, bounded 180-second process, fixed three suites:
   `ci-gate-status.test.cjs`, `normalized-payload-manifest.test.cjs`, `local-release-quality.test.cjs`.
   Require 20 actual passes, zero fail/skip/cancel and exit 0. These tests need no dependency install.
   Contain the full owned process tree, including Node workers and Git, on timeout/cancellation;
   confirm exit before cleanup. If termination is uncertain, preserve scratch and report BLOCKED.
6. Use a minimal child environment and dedicated TEMP/TMP. Remove inherited auth/action outputs,
   NODE_OPTIONS/NODE_PATH and unrelated Git config. Synthetic Git tests must not invoke user hooks.
7. Keep immutable local receipt/TAP hashes outside checkout. No GitHub artifact/cache upload,
   external publication, real accounts, DB, engine launch, or heavy build. Cleanup only owned scratch;
   distinguish retained evidence from temporary Node/source files and report cleanup failures.

## Validation

Test parser, fixed mode/SHA/ref guards, capacity rejection, downloaded hash/size rejection,
source-path ownership and test receipt fail-closed behavior. Review before implementation/dispatch.
Use existing local Node 22 for small checks; do not run heavy host suites alongside VM.

## Checklist

- [x] Review plan and exact implementation boundary (two reviewer blockers addressed explicitly).
- [x] Implement isolated workflow/helper and focused tests.
- [x] Validate/review, commit/push only infrastructure files, dispatch once after review.
- [x] Read actual Node/source/test receipt; keep missing capacity BLOCKED, not PASS.

## Completion Evidence

Checklist 4/4 complete. Infrastructure commit `3e34e721c1a86d4457419136cd67afa8a310dcae`
pushed/read back on `codex/second-laptop-runner-probe`. Local infrastructure tests PASS 43/43,
zero skips; review's inherited Git selector issue fixed by rejecting contamination before checkout.

Run `34186377885`, source job `101935468119`: PASS on runner 21 `mkt-ci-windows`, machine `MSI`.
Official Node 22.23.2 archive pin/size PASS; source tree `2df326c8ba82f8da52c1c65fc5c8530074a1b117`.
Actual fixed tests 20/20 PASS, zero failures/skips/cancellations; eight commands exit 0 with
whole-tree termination confirmed; cleanup PASS. Free capacity 2.01 GiB RAM / 67.38 GiB disk;
thresholds unchanged. Retained hosted `windows` job SKIPPED with no runner; main verified zero API
artifacts. Receipt says `acceptance: OPEN`, `releaseReady: false`.

Local receipt was extracted from the run log, not transferred as original remote bytes. Raw TAP
and receipt remain in the owned MSI evidence directory. Hashes/provenance:
[delivery report](../reports/project-manager-260908-1122-runner-source-contracts.md).

## Remaining Boundaries

The original 0.79 GiB free-RAM reading was below budget; actual execution remeasured sufficient
light-lane capacity without lowering the threshold. This completes only the bounded slice of
plan step 4. Full Browser build, sibling Tool contracts/registration, real artifact delivery and
original VM/activation/human/network/canary acceptance remain OPEN, independent of this PASS.

## Questions

No implementation choice pending for this completed lane. Heavy-work capacity, package/DB
toolchains, separate Tool-registration execution and real build/output delivery remain unresolved.
