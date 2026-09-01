---
phase: P0
title: "Park custom Chromium build and freeze the pivot"
status: pending
priority: P1
dependencies: [O0]
owner: "one Codex session"
---

# Phase P0: Park custom Chromium build and freeze the pivot

## Objective

Turn the failed local build attempt into an explicit decision record so no later session
accidentally resumes the old path. Keep the original `>12 GiB` physical-RAM rule intact for a
future host.

## Read

- `plans/260828-0428-chromium-fingerprint-engine/plan.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-02a-minimal-chromium-build-gate.md`
- `plans/260828-0428-chromium-fingerprint-engine/reports/phase-1b-post-reboot-evidence-20260828.md`
- `MKTBrowser/README.md`

## Work

- Record the host/resource facts and the reason for the pivot.
- Mark the custom build execution as parked/blocked in the new plan; link the old evidence without
  rewriting it.
- Capture a read-only Git status and exact pre-existing dirty paths/digests.
- Record the existence (metadata only) of any `ttk-*` directories under the cached engine runtime;
  treat them as sensitive pre-existing state and leave them untouched for P2 quarantine.
- Confirm that no custom binary, MKTBrowser source edit, release, or distribution occurred.

## Exit gate

P0 PASS requires a dated decision record, a clean list of protected dirty paths, and zero product
source changes from this phase. It unlocks inventory only; it does not unlock a runtime download.
