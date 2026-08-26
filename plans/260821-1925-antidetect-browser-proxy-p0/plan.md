---
title: "P0 Antidetect Browser and Proxy Operational Readiness"
description: "Make the owned Windows antidetect browser reliably launch the correct profile through its assigned proxy, preserve identity isolation, recover license sessions, and complete a human-operated canary."
status: in-progress
priority: P1
effort: "8-12 working days plus a 7-day canary soak"
issue: null
branch: "workspace master; MKTTool master; MKTBrowser feat/cloakbrowser-licensed-engine-channel"
tags: [bugfix, backend, windows, proxy, security, critical]
blockedBy: []
blocks: [260813-1546-pre-mkb04-system-quality-audit]
created: "2026-08-21"
createdBy: "ck:plan"
source: skill
---

# P0 Antidetect Browser and Proxy Operational Readiness

## Overview

P0 is the shortest path from the current technical foundation to a browser operators can trust:
MKTTool validates account ownership and proxy health, Relay verifies the signed device-bound ticket,
MKT Browser atomically persists the assigned proxy, launches the unmodified licensed engine, and
keeps profile, fingerprint, proxy, and license state isolated through close, crash, and restart.

The plan deliberately parks AI Video Factory, automated warmup, TikTok auto-posting, analytics,
CAPTCHA solving, macOS, and general UI redesign. Manual browsing and human-controlled login are the
only account actions in scope.

## Target Outcome

An operator on a second Windows PC can install the supported package, create or receive one managed
profile, launch it only through its assigned static proxy, verify matching browser egress with no
DNS/WebRTC bypass, log in manually, close and reopen it without unexplained stalls or consumed
license seats, and understand every blocked state without editing configuration files.

## Operational Flow

MKTTool account and proxy checks
-> signed ticket for the assigned Relay device
-> Relay decrypts locally and requests atomic managed launch
-> MKT Browser persists and verifies the proxy
-> per-profile SOCKS bridge and network privacy controls start
-> fingerprint and profile data are loaded
-> a profile-bound license lease is reserved
-> unmodified Chromium engine launches
-> operator logs in and browses manually
-> graceful close or deterministic recovery releases resources

## Scope Boundaries

- Preserve one account = one static proxy = one managed profile = one assigned Relay device.
- v1 runs **one profile at a time**. One licence seat is free, so concurrency is capped at one by the
  25 August owner decision, and a second launch must be refused before spawn with an honest wait.
- Never expose proxy credentials, license keys, tickets, observed IPs, cookies, or operator secrets.
- Never fall back to direct network access when proxy, bridge, firewall, or lease state is uncertain.
- Never automate credentials, OTP, CAPTCHA, posting, liking, scrolling, or content production.
- Do not modify or emulate the proprietary Chromium engine or vendor license service.
- No commit, push, publish, install, production deploy, or real-account canary without owner approval.

## Cross-Plan Dependencies

| Relationship | Existing plan or evidence | Treatment |
|---|---|---|
| Absorbs | 260820-1001-per-profile-license-sidecar-recovery | Phase 4 becomes the authoritative P0 execution contract |
| Absorbs | 260820-0803-gioi-han-profile-chay-cung-luc, phases 02-04 | Phase 5 uses measured lease state, not a guessed cooldown |
| Completes | 260818-0915-first-operator-pilot-onboarding, steps 5-6 | Phase 6 requires one real unit of manual browser work and friction notes |
| Invalidates until frozen | 260813-1546-pre-mkb04-system-quality-audit | New Browser artifacts and evidence must be regenerated after P0 |
| Continues | review-260821-1019-nghiem-thu-d1-ep-occlusion.md | Phase 2 closes cover-mode and A/B evidence before production flags change |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Freeze P0 Baseline and Acceptance Contract](./phase-01-freeze-p0-baseline-and-acceptance-contract.md) | In Progress |
| 2 | [Stabilize Browser Input and Manual Login](./phase-02-stabilize-browser-input-and-manual-login.md) | Pending |
| 3 | [Prove Proxy DNS WebRTC and Fingerprint Isolation](./phase-03-prove-proxy-dns-webrtc-and-fingerprint-isolation.md) | In Progress - 23 Aug: live egress/DNS/WebRTC pass per profile, measured sequentially; concurrent two-profile proof DEFERRED out of v1 by the 25 Aug one-seat cap |
| 4 | [Implement License Lease Recovery](./phase-04-implement-license-lease-recovery.md) | In Progress - 26 Aug: hard-kill cooling and active Electron-crash pass; the Relay-restart replay hole is fixed in MKTTool `57e14fa` and awaits a gate rerun; reboot still fails closed with a stranded pending seat |
| 5 | [Integrate Operator Readiness and Capacity UX](./phase-05-integrate-operator-readiness-and-capacity-ux.md) | In Progress - readiness UX complete; authoritative capacity withheld |
| 6 | [Run Canary Pilot and Issue GO-NO-GO](./phase-06-run-canary-pilot-and-issue-go-no-go.md) | Pending |

## Technical Checkpoint - 22 August 2026

The automatically verifiable P0 foundation is complete and green. Proxy egress verification now
fails closed on unavailable or malformed results; the correct-proxy smoke uses signed tickets and
the Relay handler rather than direct page-control tools; lease records use atomic crash-safe storage,
strict schema validation, serialized mutations, redacted key identities, and deterministic recovery
fixtures; Relay and MKTTool use stable allowlisted failure codes and current local profile inventory;
and stale polling cannot overwrite a newer launch result.

The Browser can produce a sanitized aggregate capacity payload, but it deliberately does **not**
advertise `license-capacity-v1`. The journal is not yet connected to a measured vendor sidecar and
driver lifecycle, so making that payload launch-authoritative could report a seat free while the
vendor still considers it occupied. No production floor or capability consumer may be raised until
the live start/heartbeat/end/error protocol is captured and the sidecar lifecycle is implemented.

Current automated verification on Node 22:

- MKTTool: 207 test files and 1,903 tests pass; typecheck, lint, and production build pass.
- MKTBrowser: typecheck and lint pass with zero warnings; the complete installer suite passes with
  only the explicit live Windows-machine integration gate skipped; desktop build and packaged
  runtime/profile-lifecycle verification pass.
- `git diff --check` is clean in both repositories.

This is not rollout approval. Two disposable assignments, real proxy/browser egress equality,
DNS/WebRTC and fingerprint isolation, manual login/input, live vendor lease recovery, second-PC
setup, packaged crash/reboot recovery, the seven-day canary, and owner GO/NO-GO remain open.

## Dependencies

- Windows x64; supported topology remains one Windows user per PC.
- Node.js 22 with pinned Yarn through Corepack for MKTBrowser packaging.
- Valid operator-owned CloakBrowser keys and at least two working static proxies for isolation proof.
- Disposable profiles first; a real-account canary is a separate explicit approval gate.
- Existing MKTTool 1,878-test baseline and MKTBrowser typecheck/lint/installer suites stay green.

## P0 Gates

| Gate | Exit condition |
|---|---|
| G0 Baseline | Reproducible Node 22 checks, frozen SHAs, artifact hashes, and sanitized evidence contract |
| G1 Interaction | Cover/minimize controls produce valid evidence; manual login/input has no unexplained dispatch stall |
| G2 Network identity | Correct exit path, no DNS/WebRTC bypass, stable per-profile fingerprint, no cross-profile state, measured sequentially under the one-seat cap |
| G3 Lifecycle | Normal close, hard kill, Electron crash, Relay restart, and reboot recover without cross-wiring or false-free seats |
| G4 Operator | Supported installer and setup work on the clean VM guest acting as PC B, recorded as virtual, with no manual config or secret copying |
| G5 Canary | Seven-day manual-use soak meets every metric; signed GO or exact NO-GO blockers recorded |

No gate may close from unit tests alone when it requires packaged Windows, real proxy, or human
evidence. A failed control invalidates the experiment; it is not evidence that a treatment works.
