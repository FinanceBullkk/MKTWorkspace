---
title: "MKT Browser Experimental Chromium Fingerprint Engine"
description: "Evaluate and, only after a resource gate, build an isolated Chromium/Brave engine with measurable native fingerprint consistency while preserving MKT Browser contracts."
status: closed
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

## Execution disposition — 30 August 2026 — CLOSED

The workspace owner closed the custom-engine track after the authorized post-U1 reboot and an
isolated host check. Available RAM reached at most `8.231 GiB` of `15.924 GiB`, below the strict
`>12 GiB` Phase 1B gate; `D:` space was `234.788 GiB` and VM/WSL guests were stopped. No
`autoninja` build was started, so no build timing or artifact is claimed. The completed Phase 0/1
toolchain and GN replay evidence remains historical evidence and is intentionally preserved.

The track may reopen only on different hardware that proves **more than 16 GiB available RAM** (not
merely installed RAM), or on a funded cloud builder, **and** with a named owner for the subsequent
three-profile/five-run identity measurement and security-rebase work. A vendor claim or a lower
capacity maintenance window does not satisfy that condition. Until then MKTBrowser remains a Lane
A/B tool and makes no identity-isolation claim; `G2-IDENTITY` remains **FAIL** and **Lane C is
CLOSED** for this product shape because there is no CloakBrowser channel. This is not a pending
vendor wait; any alternative-vendor work requires a new, separately funded product decision.

## Historical execution disposition — 28 August 2026

The local custom-Chromium execution path is parked after the Phase 1B resource gate remained
blocked on the 16 GiB host. Do not resume Phase 1B or the dependent baseline phases here. The
active execution roadmap is
`../260828-1655-prebuilt-engine-session-orchestrator/plan.md`, which evaluates the existing
licensed engine without weakening the original build gate. This file remains the historical
record of the source-build feasibility work and its evidence.

## Overview

Build and measure a separate Chromium-compatible engine experiment. The existing MKT Browser shell,
profile manager, proxy path, Relay, MCP contract, data roots, and runtime/update boundaries remain
unchanged. BrowserScan and CreepJS are diagnostic instruments only; a score is never an objective.
The isolated toolchain phase now ends at reproducible GN configuration; the new Phase 1B is the
first and only artifact-build gate before baseline measurement.

The table keeps the existing `CLI id (logical phase)` notation for historical rows. The inserted
`2a` row is CLI phase `2a` and logical **Phase 1B**; this preserves the explicit Phase 0 label and
does not renumber existing phase files.

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

## Phases (historical plan; parked after the 30 August closure)

> Phases 3–7 below are retained as the original dependency map, not as active work. U6 closed the
> custom-engine track without a build; no reboot, host move, measurement, or VM review is scheduled
> for this release. A new owner decision must explicitly reopen the track before any parked phase is
> executed.

| Phase | Name | Status |
|-------|------|--------|
| 1 (0) | [Feasibility Gate](./phase-01-feasibility-gate.md) | Completed — conditional D pilot decision recorded |
| 2 (1) | [Isolated Source and Toolchain](./phase-02-isolated-source-and-toolchain.md) | Completed — source/toolchain/GN replay; build moved to Phase 1B |
| 2a | [Minimal Chromium Build Gate (logical Phase 1B)](./phase-02a-minimal-chromium-build-gate.md) | **Closed without build** — host RAM gate failed after the authorized isolation check |
| 3 (2) | [Baseline Measurement Harness](./phase-03-baseline-measurement-harness.md) | Parked — requires explicit reopen and Phase 1B PASS |
| 4 (3) | [Native Audio and Fonts](./phase-04-native-audio-and-fonts.md) | Parked — requires explicit reopen |
| 5 (4) | [Graphics and Context Consistency](./phase-05-graphics-and-context-consistency.md) | Parked — requires explicit reopen |
| 6 (5) | [Profile Persistence and Rollback](./phase-06-profile-persistence-and-rollback.md) | Parked — requires explicit reopen |
| 7 (6) | [MKT Integration and VM Review](./phase-07-mkt-integration-and-vm-review.md) | Parked — requires explicit reopen |

## Dependencies (historical / reopen-only)

Historical Phase 1B status (2026-08-28): **BLOCKED** after the one permitted post-reboot check.
Physical RAM and VM/WSL gates failed; no build or baseline run occurred. The 30 August closure
supersedes the former instruction to move the build to another host: no host move, reboot, or build is
scheduled unless a new owner decision reopens this track under the condition above.

- Evidence baseline only: `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md`;
  its `G2-IDENTITY=FAIL` is retained and not weakened.
- Existing MKTBrowser W01/W02 contracts and `windows-engine-release.json` remain frozen until a
  later, separately reviewed integration phase.
- CLI phases 2 → 2a → 3–7 (logical phases 1 → 1B → 2–6) are sequential for engine
  source/build/measurement work. Instrumentation and documentation may run in parallel only when
  they do not touch the engine checkout or shared files.
- Each phase limits active reading/coding to one session (about 2h); long fetch/build/measurement
  wall time is an explicitly unattended gate with its own evidence.

## Acceptance Crosswalk

| New engine rule | Existing matrix reference |
|---|---|
| Sanitized evidence and non-pass statuses | `:7-28` |
| Same-profile repeat and cross-profile tuple measurement | `:104-135,247-283` |
| Invalidation on source/artifact/profile/test changes | `:628-636` |

## Success Criteria (historical / reopen-only)

- Phase 0 records a reproducible host/resource budget and the continuation decision before fetch.
- Phase 1B produces exactly one isolated component/debug `chrome` artifact only when available
  physical RAM is `>12 GiB`, D: free space is `>=200 GiB`, and `0` VM/WSL instances are active.
- Phase 1B records exit code, wall time, peak RAM, D: before/after, binary SHA-256, empty-profile
  launch/clean shutdown, and MKTBrowser pre/post identity; any failed gate stops the chain.
- The historical host gets at most one post-reboot RAM check; if physical availability remains
  `<=12 GiB`, a future explicitly reopened build may move to a Windows host with at least `32 GiB`
  installed RAM and the baseline stays locked. No move is scheduled for this release.
- Baseline Measurement Harness remains `NOT-RUN` until Phase 1B is a documented PASS; its 100-launch
  run cannot be used to compensate for a failed build gate.
- A candidate engine must show measured same-profile determinism and cross-profile joint-identity
  separation on the named surfaces; failures remain `FAIL`, `OPEN`, or `NOT-RUN`.
- No release, install, publish, or MKT Browser contract change occurs from this plan without the
  separate license, VM, and review gates.
