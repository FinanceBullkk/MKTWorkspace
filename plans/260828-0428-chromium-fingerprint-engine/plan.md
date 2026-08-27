---
title: "MKT Browser Experimental Chromium Fingerprint Engine"
description: "Evaluate and, only after a resource gate, build an isolated Chromium/Brave engine with measurable native fingerprint consistency while preserving MKT Browser contracts."
status: in-progress
priority: P1
branch: "codex/fingerprint-engine-phase0"
tags: [feature, experimental, security, windows]
blockedBy: []
blocks: []
created: "2026-08-28"
createdBy: "ck:plan"
source: skill
---

# MKT Browser Experimental Chromium Fingerprint Engine

## Overview

Build and measure a separate Chromium-compatible engine experiment. The existing MKT Browser shell,
profile manager, proxy path, Relay, MCP contract, data roots, and runtime/update boundaries remain
unchanged. BrowserScan and CreepJS are diagnostic instruments only; a score is never an objective.

The CLI numbers phase files from 1; the table shows `CLI id (logical phase)` so the requested
**Phase 0** remains explicit without breaking CLI-managed links.

## Scope Boundaries

- Engine work lives in a separate repository/worktree. No direct edits to the current MKTBrowser
  checkout or its dirty files.
- The final phase is a read-only compatibility/VM review. An adapter or runtime descriptor is not
  authorized here; it needs a new plan and explicit approval after this experiment.
- Build runs serially on the host; never compile Chromium while a VM is consuming host RAM.
- Before any binary distribution, re-check exact engine license, notices, checksum, and approval status
  required by `MKTBrowser/README.md:88-89,223-225`.
- Explicitly out of scope (not research, implementation, or acceptance): evading bot detection,
  bypassing CAPTCHA, bypassing checkpoints, bypassing rate limits, and TikTok automation.
- Contaminated legacy inputs are historical context only and are not inherited: `MKTBrowser/docs/mkb-w03-tiktok-antidetect-breakthrough-plan.md`, the old P0 plan's parked automation/CAPTCHA/TikTok text (`plans/260821-1925-antidetect-browser-proxy-p0/plan.md:26-28,50-59`), and related old P0 phase-02/phase-06/canary text.
- Any bot-detection, checkpoint, rate-limit, CAPTCHA, or TikTok/automation material anywhere in those legacy plans/reports is explicitly out of scope; only identity/proxy evidence rows named in the crosswalk may inform this plan.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 (0) | [Feasibility Gate](./phase-01-feasibility-gate.md) | In progress — blocked on owner decision |
| 2 (1) | [Isolated Source and Toolchain](./phase-02-isolated-source-and-toolchain.md) | Pending |
| 3 (2) | [Baseline Measurement Harness](./phase-03-baseline-measurement-harness.md) | Pending |
| 4 (3) | [Native Audio and Fonts](./phase-04-native-audio-and-fonts.md) | Pending |
| 5 (4) | [Graphics and Context Consistency](./phase-05-graphics-and-context-consistency.md) | Pending |
| 6 (5) | [Profile Persistence and Rollback](./phase-06-profile-persistence-and-rollback.md) | Pending |
| 7 (6) | [MKT Integration and VM Review](./phase-07-mkt-integration-and-vm-review.md) | Pending |

## Dependencies

- Evidence baseline only: `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md`;
  its `G2-IDENTITY=FAIL` is retained and not weakened.
- Existing MKTBrowser W01/W02 contracts and `windows-engine-release.json` remain frozen until a
  later, separately reviewed integration phase.
- CLI phases 2–7 (logical phases 1–6) are sequential for engine source/build work. Instrumentation and documentation may run
  in parallel only when they do not touch the engine checkout or shared files.
- Each phase limits active reading/coding to one session (about 2h); long fetch/build/measurement
  wall time is an explicitly unattended gate with its own evidence.

## Acceptance Crosswalk

| New engine rule | Existing matrix reference |
|---|---|
| Sanitized evidence and non-pass statuses | `:7-28` |
| Same-profile repeat and cross-profile tuple measurement | `:104-135,247-283` |
| Invalidation on source/artifact/profile/test changes | `:628-636` |

## Success Criteria

- Phase 0 records a reproducible host/resource budget and an explicit owner decision before any fetch.
- A candidate engine must show measured same-profile determinism and cross-profile joint-identity
  separation on the named surfaces; failures remain `FAIL`, `OPEN`, or `NOT-RUN`.
- No release, install, publish, or MKT Browser contract change occurs from this plan without the
  separate license, VM, and review gates.
