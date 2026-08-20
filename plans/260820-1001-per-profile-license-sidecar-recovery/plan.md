---
title: "Per-Profile License Sidecar and Crash Recovery"
description: "Route each CloakBrowser license session through a profile-bound local sidecar, persist the minimum lease state, and release valid seats after crashes or power loss."
status: pending
priority: P1
effort: "3-5 working days plus one controlled live-protocol gate"
issue: null
branch: "MKTBrowser feat/cloakbrowser-licensed-engine-channel"
tags: [feature, backend, windows, experimental, critical]
blockedBy: []
blocks: [260820-0803-gioi-han-profile-chay-cung-luc]
created: 2026-08-20
createdBy: "ck:plan"
source: skill
---

# Per-Profile License Sidecar and Crash Recovery

## Overview

Implement a transparent, per-profile license sidecar for the unmodified CloakBrowser engine. The
sidecar forwards only measured vendor license calls, routes upstream through the profile's existing
SOCKS5 bridge, records the minimum data required to end a valid lease, and makes launch capacity
depend on confirmed release evidence instead of shutdown-method guesses.

Target repository: `E:\MKTWorkspace\MKTBrowser`.

## Operational Flow

```text
Profile launch
  -> reserve valid key
  -> start existing profile SOCKS5 bridge
  -> start profile-bound license sidecar on 127.0.0.1
  -> set CLOAKBROWSER_LICENSE_API to sidecar URL
  -> launch unmodified engine
  -> sidecar forwards start/heartbeat/end through the profile bridge
  -> SQLite journal records lease state without key or proxy secrets

Abnormal exit / power loss
  -> next app boot closes surviving browser processes
  -> recovery reads pending leases
  -> recovery resolves the current profile proxy
  -> recovery sends the measured session/end request
  -> key returns to idle only after confirmed vendor release
```

## Non-Negotiable Boundaries

- Use valid operator-owned license keys and the vendor's measured API only.
- Keep the CloakBrowser binary unmodified. No patching, key generation, response synthesis, or
  `install_id` rotation.
- Do not rely on `--license-through-proxy`. Node owns upstream forwarding, so Node must explicitly
  use the profile's local SOCKS5 bridge.
- Never persist or log a full license key, proxy URL, proxy credential, observed IP, or raw capture.
- Never fall back to direct license egress when a proxied profile's bridge is unavailable.
- Keep CFT behavior unchanged. The sidecar activates only for the licensed CloakBrowser engine.
- No commit, push, package publication, installation, or operational rollout without owner approval.

## Agent Execution Contract

- Environment: Windows (`win32`), PowerShell, timezone `Asia/Saigon`.
- Workspace: `E:\MKTWorkspace`; target Git repository: `E:\MKTWorkspace\MKTBrowser`.
- Required runtime: Node.js 22 with pinned Yarn through `corepack`.
- Before edits: read `E:\MKTWorkspace\MKTBrowser\README.md`, repository instructions, and
  `C:\Users\anhha\.claude\rules\development-rules.md`; inspect both Git worktrees.
- Work inline. Do not launch nested agents/workflows unless the owner explicitly requests them.
- Preserve unrelated dirty work. Modify only phase-owned files. Do not commit or push.
- Conversation may be Vietnamese; source, tests, comments, errors, docs, and reports stay English.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Verify License Protocol](./phase-01-verify-license-protocol.md) | Pending |
| 2 | [Implement Sidecar and Lease Journal](./phase-02-implement-sidecar-and-lease-journal.md) | Pending |
| 3 | [Integrate Driver and Startup Recovery](./phase-03-integrate-driver-and-startup-recovery.md) | Pending |
| 4 | [Validate and Handoff Capacity Model](./phase-04-validate-and-handoff-capacity-model.md) | Pending |

## Dependencies

- Evidence source: `E:\MKTWorkspace\plans\reports\research-260820-0858-giao-thuc-license-cloakbrowser.md`.
- Existing proxy path: `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\socks5Bridge.ts`.
- Existing key allocation: `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-key-pool.ts`.
- This plan blocks capacity/cooldown Phases 02-04 in
  `E:\MKTWorkspace\plans\260820-0803-gioi-han-profile-chay-cung-luc\plan.md` because it replaces
  timer-only cooldown assumptions with measured lease state.
- If implemented before the pre-MKB-04 baseline freeze, include it in audit Phase 00 and invalidate
  every dependent Browser artifact/evidence item. It does not independently authorize a release.

## Definition Of Done

- Successful live protocol schema recorded in sanitized evidence before production code depends on it.
- Two simultaneous profiles cannot cross-wire license keys, lease state, or proxy routes.
- Normal close, hard browser kill, Electron crash, and power-loss recovery have deterministic tests.
- A key becomes idle only after confirmed release; ambiguous outcomes remain cooling/pending.
- Full MKT Browser typecheck, lint, automated suites, build, and packaged-contract verification pass.

## Out Of Scope

- Building an MKT-owned Chromium engine.
- UI redesign, localization, or general capacity copy changes.
- Changing vendor account limits, subscription terms, or machine identity semantics.
- Redistributing or modifying the CloakBrowser binary.
