---
title: "MKTBrowser Release Readiness Stabilization"
description: "Remove release blockers, make packaged Windows CI deterministic, produce one attested installer from a frozen source tree, and close real-operator rollout gates."
status: in-progress
priority: P1
effort: "3-5 engineering weeks plus a 7-day canary"
issue: null
branch: "feat/cloakbrowser-licensed-engine-channel"
tags: [security, windows, ci, release, testing, refactor, critical]
blockedBy: []
blocks: []
created: "2026-08-22T03:45:42.476Z"
createdBy: "ck:plan"
source: skill
---

# MKTBrowser Release Readiness Stabilization

## Overview

Move MKT Browser from a strong internal technical build to an evidence-backed operator release.
The critical path is strict: remove vulnerable runtime extraction, eliminate packaged-contract CI
nondeterminism, require the pull-request merge check, produce one attested installer from
a frozen source tree, close real Windows/network/recovery gates, then complete a seven-day canary.

Large-module decomposition continues only after the release blockers are closed. It must proceed in
small behavior-preserving slices protected by the new coverage gates.
Scope mode is HOLD: reuse current P0/release work; do not add updater, macOS release, a new engine,
or automation expansion. Phases 1-6 form the release path; Phase 7 follows without delaying it.

## Verified Baseline - 22 August 2026

| Area | Current evidence | Release consequence |
|---|---|---|
| Packaged CI | Closed 22 August. The fixed-port allocator was the mechanism; with an OS-assigned port the required PR check passes 5/5 and seven independent runs passed 20/20 on one declared engine | Gate closed on evidence |
| Extraction | `extract-zip@2.0.1` is a direct packaged dependency used by engine and extension extraction; audit reports high-severity `GHSA-jmr9-qjv8-65gv` | Block release until removed or fully patched |
| Coverage | Closed 22 August. MKTBrowser 86/80/85 and MKTTool 81/74/79/78, both measured then rounded down, both failing closed on a renamed module | Floors in place before refactors |
| Installer | Rebuilt 23 August from frozen tree `cce7b897`, reproducible across two clean runners, attested with published SHA-256 `d18c8d79...`. Unsigned by decision | Retained, not distributed |
| Operational proof | 23 August: per-profile proxy egress, DNS, and WebRTC pass on two profiles measured sequentially, and a normal close returns the seat immediately. Concurrent two-profile isolation, human input, crash/reboot, second PC, and canary remain open | No broad operator rollout |
| Licence capacity | 23 August: the vendor counts sessions per licence, not per account or per install, measured with two keys on one `install_id`. N concurrent profiles cost N keys on one machine. But the shipped build does not rotate to a free key when the primary is refused, so N keys currently buy one profile | Blocks scale until rotation works |
| Browser hotspots | 2,581-line driver, 1,574-line fingerprint module, 1,364-line MCP server, plus 973/959-line startup modules | Refactor incrementally after P0 release gates |

## Release Rule

No installer may be distributed unless Phases 1-5 are complete and the exact signed artifact enters
Phase 6. A green feature-branch push is informational only. The required merge authority is the
pull-request check for the current merge tree.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Remove Vulnerable Runtime Extraction](./phase-01-remove-vulnerable-runtime-extraction.md) | Completed |
| 2 | [Stabilize Packaged Contract CI](./phase-02-stabilize-packaged-contract-ci.md) | Completed |
| 3 | [Enforce PR Merge and Critical Coverage Gates](./phase-03-enforce-pr-merge-and-critical-coverage-gates.md) | Completed |
| 4 | [Build Attested Installer from Frozen HEAD](./phase-04-build-signed-installer-from-frozen-head.md) | In Progress - candidate built and attested; receiving-machine checks carry into phase 5 |
| 5 | [Complete Real Environment and Recovery Gates](./phase-05-complete-real-environment-and-recovery-gates.md) | In Progress - sequential proxy/DNS/WebRTC and clean-close seat release pass; concurrent isolation blocked on key rotation |
| 6 | [Run Seven Day Canary and Promote](./phase-06-run-seven-day-canary-and-promote.md) | Pending |
| 7 | [Decompose Browser Hotspots Incrementally](./phase-07-decompose-browser-hotspots-incrementally.md) | Pending |

## Cross-Plan Dependencies

| Existing plan | Relationship |
|---|---|
| `../260821-1925-antidetect-browser-proxy-p0/plan.md` | Authoritative execution record for human input, network identity, lifecycle, second-PC, and canary evidence used by Phases 5-6 |
| `../260820-1001-per-profile-license-sidecar-recovery/plan.md` | Authoritative live vendor protocol and lease recovery work consumed by Phase 5 |
| `../260818-0915-first-operator-pilot-onboarding/plan.md` | Operator-friction evidence input for second-PC setup and canary |

These are phase-level dependencies, not plan-level blockers. Phases 1-4 can proceed immediately.

## Global Definition Of Done

- No high/critical unapproved production advisory in packaged Browser runtime dependencies.
- Required PR merge check passes repeatedly on the exact merge tree; branch rules prevent bypass.
- Critical-path coverage floors run in both repositories and cannot decrease silently.
- Installer is built once from frozen HEAD, verified, attested, and distributed with a published
  SHA-256. V1 ships unsigned by owner decision reaffirmed on 22 August 2026; see phase 4.
- Real proxy, DNS, WebRTC, input, vendor lease, crash/reboot, and second-PC gates have sanitized proof.
- The exact signed artifact completes seven days with no identity-boundary or unrecovered-seat event.
- Large modules are reduced through tested responsibility seams, not a broad rewrite.
