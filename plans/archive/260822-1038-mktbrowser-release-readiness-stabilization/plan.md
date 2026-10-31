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

> **Historical predecessor plan — superseded 30 August 2026.** Its 0.3.12/old-branch baseline and
> in-progress status are retained for traceability. Current truth is in the consolidation plan:
> P4a Web is deployed, P4b Browser five-artifact provenance is OPEN, Q15 is owner-only self-serve,
> and Lane C is **CLOSED** because no CloakBrowser channel exists.

## Overview

**Internal beta boundary, 29 August 2026:** a clean `0.3.12` Windows candidate from source
`6d1b0a2` was hash-bound, packaged-smoked, and published for a controlled admin-led beta. This plan
continues to govern broad Browser rollout and does not read that beta as closure of the human,
network, identity, vendor, operator, or canary gates. The Web/Facebook handoff may proceed without
waiting for Phases 5-6. Custom-engine, macOS, updater, concurrency, and automation work stay outside
the immediate delivery path.

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
| Installer | Rebuilt 23 August from frozen tree `cce7b897`, attested with published SHA-256 `d18c8d79...`. Receive-side hash passed; the clean combined-install claim was invalidated when Defender quarantined the installer's PowerShell as `Behavior:Win32/PShellCobStager.A`. Diagnosed 24 August as a behavioural COM-stager match and partly remediated in `8595027`; three parts of that shape remain | Retained, not distributed. Candidate now trails six Browser fixes: one rebuild carries them all |
| Operational proof | Per-profile proxy egress, DNS, and WebRTC pass on two profiles measured sequentially. Normal close, Browser hard-kill cooling, active Electron-crash startup recovery, packaged Relay v15 spent-ticket replay, and the final real VirtualBox power-cycle/reboot convergence gate pass on hash-bound artifacts. Concurrent isolation and candidate-equivalent lifecycle remain open | No broad operator rollout |
| Licence capacity | 24 August: abandoned-lease expiry measured at **15.1 minutes** against the declared `lease_ttl_seconds: 900`, correcting an unreproduced 20-25 minute figure; the lease journal and recovery module were found built, tested, and never called from the product, so a held seat was forgotten on every restart (`3ecc68f`). 23 August: the vendor counts sessions per licence, not per account or per install, measured with two keys on one `install_id`. N concurrent profiles cost N keys on one machine. The build declared a refused launch successful before the verdict arrived, so rotation never ran; fixed in `b63d212` and proven end to end on hardware — a held primary rotates to a free key and the profile opens. The UI had no way to enter a second key at all, fixed in `22207ad` | Capped at one concurrent profile by owner decision on 25 August; rotation retained in code but out of v1 scope |
| Browser hotspots | 2,581-line driver, 1,574-line fingerprint module, 1,364-line MCP server, plus 973/959-line startup modules | Refactor incrementally after P0 release gates |

## Owner Scope Decisions - 25 August 2026

Three questions left open by the 24-25 August evidence were answered by the owner. Each narrows v1
rather than adding work, and each carries a cost stated here rather than discovered by an operator.

| Decision | Ruling | Consequence |
|---|---|---|
| Concurrent capacity | **One profile at a time.** Only one licence seat is free, so v1 ships a hard cap of one | The concurrent two-profile launch gate cannot run and leaves the release path. Cross-profile isolation is proved sequentially. Multi-key rotation stays in the code, unsupported and untested for v1 |
| Code signing | **Unsigned, reaffirmed.** No budget for an Authenticode certificate | SmartScreen warns on every install. The published SHA-256 and the distribution channel are the only origin evidence there is. Onboarding must name the warning before the operator meets it |
| Second machine | **The clean VM guest is PC B** | `G4-OPERATOR` may close on a virtual machine. Evidence must record it as virtual so nobody later reads it as physical-PC parity. Host hardware distinctness stays unproved |

### What the one-seat cap does to the risk profile

The cap does not make recovery less important. It makes recovery the product. With two keys a
stranded seat costs a rotation; with one key it costs **the entire application** for up to the
measured 15.1-minute lease expiry, and the operator can do nothing but wait.

That promotes early vendor release from a nice-to-have to the highest-value remaining fix: ending
the licence session explicitly on shutdown turns a 15-minute dead wait into an immediate reopen.
The supporting parts already exist and already fail closed - `license-key-pool.ts` refuses a launch
before spawning when no key is idle rather than burning an attempt on the vendor, and
`license-seat-wait-message.ts` distinguishes "close a running profile" from "a dead browser still
holds the seat, it frees in about N minutes". What is missing is the call that ends the session.

## Release Rule

No installer may be distributed unless Phases 1-5 are complete and the exact attested artifact enters
Phase 6. A green feature-branch push is informational only. The required merge authority is the
pull-request check for the current merge tree.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Remove Vulnerable Runtime Extraction](./phase-01-remove-vulnerable-runtime-extraction.md) | Completed |
| 2 | [Stabilize Packaged Contract CI](./phase-02-stabilize-packaged-contract-ci.md) | Completed |
| 3 | [Enforce PR Merge and Critical Coverage Gates](./phase-03-enforce-pr-merge-and-critical-coverage-gates.md) | Completed |
| 4 | [Build Attested Installer from Frozen HEAD](./phase-04-build-signed-installer-from-frozen-head.md) | In Progress - 25 Aug: current-source candidate passes clean install 9/9, repair 13/13 and uninstall 15/15 on updated Defender; artifact remains unsigned, unattested and not releasable |
| 5 | [Complete Real Environment and Recovery Gates](./phase-05-complete-real-environment-and-recovery-gates.md) | In Progress - 27 Aug: hard-kill cooling, active Electron-crash startup recovery, packaged Relay v15 replay durability, and final real power-cycle/reboot convergence pass; authenticated second-PC setup, human input, and remaining network/vendor gates remain open |
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
- The exact attested artifact completes seven days with no identity-boundary or unrecovered-seat event.
- Large modules are reduced through tested responsibility seams, not a broad rewrite.
