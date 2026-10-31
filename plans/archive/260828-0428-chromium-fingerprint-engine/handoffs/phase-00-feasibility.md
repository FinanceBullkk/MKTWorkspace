---
phase: 0
date: 2026-08-28
status: complete
---

## Resolution Addendum (2026-08-28)

The owner subsequently authorized Codex to decide and continue under AGENTS.md. The decision
recorded for the next phase is a conditional D: pilot with upstream Chromium first. The original
resource guards remain unchanged: preserve at least 20 GiB free, require more than 12 GiB
available RAM before compilation, keep VMs off during compilation, and do not distribute a binary
without the separate license/approval gate.

## Phase 1B Amendment (2026-08-28)

The isolated-source work later completed setup and GN replay on D:. Compilation is intentionally a
separate Phase 1B gate with the stricter `D: >=200 GiB` preflight, physical RAM `>12 GiB`, and zero
active VM/WSL requirement. The historical measurements in this handoff remain unchanged; the
current preflight and reboot decision live in `../reports/phase-1b-minimal-chromium-build-gate-evidence.md`.

# Phase 0 Handoff — Feasibility Gate

## What Was Done

- Read workspace `AGENTS.md`, development rules, MKTBrowser README, relevant W01/W02/license docs,
  prior fingerprint reports, and the P0 acceptance matrix.
- Created the engine plan and the bounded follow-on phase files. A later amendment inserts the
  Phase 1B artifact gate between toolchain setup and baseline measurement.
- Performed read-only host, disk, toolchain, Git, and VirtualBox measurements.
- Started a workspace-only branch `codex/fingerprint-engine-phase0`; the nested MKTBrowser branch and
  its intentional dirty fingerprint-contract files were not changed.

## Measurements

The values in this section are the original Phase 0 snapshot and are not a current host claim.
Use the dated Phase 1B preflight report for the current RAM, disk, and VM/WSL state.

- Windows 11 Home x64 build `26200`; Ryzen 5 5600 (`6C/12T`); RAM `15.92 GiB` total and `1.79 GiB`
  free while `mkt-ci-windows` runs.
- E: NTFS/NVMe free `27.73 GiB` — reject (<100 GB official floor).
- D: NTFS/SATA free `162.24 GiB` — conditional minimal pilot only.
- `mkt-ci-windows`: running, 4 vCPU/6 GiB, dynamic 80 GiB VDI on D:. Other gate VMs powered off.
- `gclient`, GN, Ninja, MSVC, and `vswhere` were not found; no VS/SDK directory was found.

## Decision and Evidence

- No `git clone`, `fetch`, `gclient`, `gn`, `autoninja`, engine launch, installer, or distribution
  occurred (`0` build actions).
- Proposed future host path: `D:\mkt-browser-engine\` (not created).
- Pilot guard: `>=150 GiB` before fetch, `>=20 GiB` reserve after; host available RAM `>12 GiB` and
  no VM running during compile.
- Full/release/test guard: `>=200–220 GiB` free; the Phase 0 timestamp did not meet it.
  The later Phase 1B snapshot records D: at 235.05 GiB, which meets the new `>=200 GiB` build gate.
- Under `workspace-write`, D: requires an explicit writable-root grant. The current read-only audit did
  not need one.

## Files Changed

- `plans/260828-0428-chromium-fingerprint-engine/plan.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-01-feasibility-gate.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-02-isolated-source-and-toolchain.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-02a-minimal-chromium-build-gate.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-03-baseline-measurement-harness.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-04-native-audio-and-fonts.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-05-graphics-and-context-consistency.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-06-profile-persistence-and-rollback.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-07-mkt-integration-and-vm-review.md`
- `plans/260828-0428-chromium-fingerprint-engine/reports/phase-0-feasibility-measurements.md`
- `plans/260828-0428-chromium-fingerprint-engine/reports/phase-1b-minimal-chromium-build-gate-evidence.md`
- `plans/260828-0428-chromium-fingerprint-engine/handoffs/phase-01b-minimal-chromium-build-gate.md`
- this handoff file

Plan artifacts are committed locally in implementation commit `0d7118d` (`docs(plan): add Chromium
fingerprint engine feasibility gate`); this handoff update is local and nothing was pushed. No
MKTBrowser/MKTTool source file was touched.

## Open Gate

Phase 1 setup is complete, but Phase 1B remains blocked until a fresh preflight proves physical RAM
`>12 GiB`, D: free `>=200 GiB`, and zero active VM/WSL instances. The one-time reboot/minimal-shell
trial is next. If RAM remains `<=12 GiB`, move the build to a Windows host with at least 32 GiB RAM;
do not run the baseline harness. Do not infer approval from this handoff.

## Traps for Next Session

- Do not stop/delete/compact VMs as an unreviewed cleanup; D: already contains dynamic VM files.
- Do not build in the current MKTBrowser checkout or add a third engine kind to its shell; any
  future integration requires a new approved plan.
- Do not promote Cloak Preview, add JS surface patches, or weaken `G2-IDENTITY=FAIL`.
- BrowserScan/CreepJS remain measurement tools only. Keep old TikTok/CAPTCHA/checkpoint/rate-limit
  material out of scope even if a legacy document mentions it.
- Before any binary leaves the experiment directory, re-check exact engine license, notices, checksum,
  and approval status; application MIT does not grant engine redistribution rights.
