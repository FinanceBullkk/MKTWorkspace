---
phase: 0
date: 2026-08-28
status: blocked
---

# Phase 0 Handoff — Feasibility Gate

## What Was Done

- Read workspace `AGENTS.md`, development rules, MKTBrowser README, relevant W01/W02/license docs,
  prior fingerprint reports, and the P0 acceptance matrix.
- Created the engine plan and seven bounded follow-on phase files.
- Performed read-only host, disk, toolchain, Git, and VirtualBox measurements.
- Started a workspace-only branch `codex/fingerprint-engine-phase0`; the nested MKTBrowser branch and
  its intentional dirty fingerprint-contract files were not changed.

## Measurements

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
- Full/release/test guard: `>=200–220 GiB` free; current D: does not meet it.
- Under `workspace-write`, D: requires an explicit writable-root grant. The current read-only audit did
  not need one.

## Files Changed

- `plans/260828-0428-chromium-fingerprint-engine/plan.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-01-feasibility-gate.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-02-isolated-source-and-toolchain.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-03-baseline-measurement-harness.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-04-native-audio-and-fonts.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-05-graphics-and-context-consistency.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-06-profile-persistence-and-rollback.md`
- `plans/260828-0428-chromium-fingerprint-engine/phase-07-mkt-integration-and-vm-review.md`
- `plans/260828-0428-chromium-fingerprint-engine/reports/phase-0-feasibility-measurements.md`
- this handoff file

Plan artifacts are committed locally as `a860601` (`docs(plan): add Chromium fingerprint engine
feasibility gate`); nothing was pushed. No MKTBrowser/MKTTool source file was touched.

## Open Gate

Owner must choose one path before Phase 1: (A) conditional minimal D: pilot after capacity/writable-root
preflight, (B) provide a volume with `>=200–220 GiB` free, or (C) defer. Owner must also choose
upstream Chromium versus a pinned Brave candidate. Do not infer approval from this handoff.

## Traps for Next Session

- Do not stop/delete/compact VMs as an unreviewed cleanup; D: already contains dynamic VM files.
- Do not build in the current MKTBrowser checkout or add a third engine kind to its shell yet.
- Do not promote Cloak Preview, add JS surface patches, or weaken `G2-IDENTITY=FAIL`.
- BrowserScan/CreepJS remain measurement tools only. Keep old TikTok/CAPTCHA/checkpoint/rate-limit
  material out of scope even if a legacy document mentions it.
- Before any binary leaves the experiment directory, re-check exact engine license, notices, checksum,
  and approval status; application MIT does not grant engine redistribution rights.
