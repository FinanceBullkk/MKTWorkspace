---
phase: 5
title: "Integrate Operator Readiness and Capacity UX"
status: in-progress
priority: P1
effort: "1-2 days"
dependencies: [2, 3, 4]
---

# Phase 5: Integrate Operator Readiness and Capacity UX

## Overview

Expose the proven Browser, proxy, and lease states through the existing Relay and MKTTool surfaces so
an operator knows whether launch is ready, blocked, running, terminating, or recovering. Complete the
second-machine flow without manual JSON edits, secret copying, engine names, or guessed countdowns.

## Context Links

- E:\MKTWorkspace\plans\260820-0803-gioi-han-profile-chay-cung-luc\plan.md
- E:\MKTWorkspace\plans\260818-0915-first-operator-pilot-onboarding\plan.md
- E:\MKTWorkspace\MKTTool\src\lib\relay\current-device-browser-health.ts
- E:\MKTWorkspace\MKTTool\relay\src\launch-profile.ts
- E:\MKTWorkspace\MKTBrowser\apps\desktop\src\renderer\src\App.tsx

## Requirements

- Functional: derive capacity from measured key/lease states, not a fixed max or guessed 17-minute timer.
- Functional: expose only aggregate free, active, pending-recovery, and cooling counts plus stable
  machine-readable failure codes.
- Functional: disable launch before click when no key is free, proxy is unhealthy, Browser is not ready,
  or a profile is already terminating/recovering.
- Functional: Relay health and operation responses distinguish unreachable, unconfigured, outdated,
  browser-not-ready, proxy-refused, no-capacity, and recovery-pending.
- Functional: setup discovers the token, current Relay, Browser, engine, contract, capabilities, and
  installer ownership without manual relay-config.json edits.
- Non-functional: user-facing strings are English, concise, and never expose vendor/engine names,
  ports, keys, paths, tokens, proxy secrets, or internal exception text.
- Non-functional: no broad UI redesign; modify existing status and action surfaces only.

## Architecture

MKT Browser remains the source of truth for running processes and lease capacity. Its existing runtime
report gains an additive, sanitized capability/state payload. Relay forwards stable codes and correlated
diagnostics. MKTTool combines local readiness with account ownership, assigned device, proxy health, and
profile readiness, then renders one launch decision. No layer invents state owned by another.

## File Inventory

| Action | Path | Purpose |
|---|---|---|
| Modify | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-key-pool.ts | Aggregate measured capacity states |
| Modify | E:\MKTWorkspace\MKTBrowser\packages\mcp-server\src\server.ts | Add sanitized runtime/capacity report |
| Modify | E:\MKTWorkspace\MKTBrowser\packages\types\src\index.ts | Additive contract types |
| Modify | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\renderer\src\App.tsx | Existing running/terminating/recovery state wiring |
| Modify if required | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\renderer\src\components\profile\ProfileTile.tsx | Minimal local state display |
| Modify | E:\MKTWorkspace\MKTTool\relay\src\launch-profile.ts | Stable error mapping and correlated outcome |
| Modify | E:\MKTWorkspace\MKTTool\src\lib\relay\current-device-browser-health.ts | Require new capability only after compatible release exists |
| Modify | E:\MKTWorkspace\MKTTool\src\components\mktbrowser-ui\ProfileTile.tsx | Pre-click readiness and exact remedy |
| Modify if required | E:\MKTWorkspace\MKTTool\src\components\setup\onboarding-stepper.tsx | One guided supported install path |
| Create | Tests beside modified modules only | Contract, readiness, state, and copy coverage |
| Delete | None | Parked features and legacy routes stay parked |

## Tests Before

1. Lock current runtime reporting, rejected health-body retention, token discovery, version-floor, and
   setup-state tests.
2. Lock Browser running/terminating state and key-pool count behavior.
3. Add failing tests for pending-recovery not counted as free and for launch disabled before click.
4. Add copy tests that reject engine names, secrets, paths, raw ports, and guessed cooldown times.

## Implementation Steps

1. Define the smallest additive runtime payload: total keys, free, active, pending recovery, cooling,
   Browser version, Relay-compatible contract, and capability names.
2. Add stable failure codes for no capacity and recovery pending; preserve existing proxy and engine codes.
3. Keep Browser runtime report diagnostic-only. Launch remains authoritative and rechecks state atomically.
4. Update Relay to map codes to operator remedies while retaining correlated diagnostics and redaction.
5. Update MKTTool readiness to combine account/device/proxy/profile facts with current local Browser state.
6. Disable launch when a known blocker exists and show one actionable sentence. Unknown local state must
   ask the operator to open/fix Relay setup, not claim the profile is safe.
7. Replace fixed-capacity and countdown language with measured state labels.
8. Keep automatic startup visible: show connecting, ready, blocked, and timed-out states; do not silently
   start local processes without status.
9. Confirm setup self-enrollment, sealed operator-key delivery, token discovery, Relay 15+, and Browser
   installer ownership work on a clean Windows user without file edits.
10. Build one compatible MKTTool, Relay, and Browser set. Verify minimum version/capability order prevents
    an older component from receiving an unsupported ticket.
11. Run the full second-machine launch path with a disposable profile and proxy.
12. Update living roadmap/changelog only after the integrated behavior is verified.

## Test Scenario Matrix

| Scenario | Expected |
|---|---|
| Free key and healthy proxy | Launch action enabled; atomic launch still rechecks |
| Every key active | No-capacity state; no ticket/launch attempt |
| Pending recovery | Recovery state and retry remedy; not counted free |
| Relay responding but unconfigured | Setup remedy using retained rejected health body |
| Relay or Browser outdated | Exact update remedy; no unsupported ticket |
| Browser unavailable | Visible local startup/setup state; no generic proxy error |
| Proxy refused | Proxy-specific remedy; no engine/internal sentence |
| Different owner/device | Server rejects before decrypting or issuing proxy secret |
| Setup on second PC | No JSON edit, key copy, token copy, or developer command |
| Status race at click | Browser atomic check wins; UI never overrides it |

## Dependency Map

- Requires phases 2-4 verified contracts.
- Absorbs capacity-plan phases 02-04.
- Blocks phase 6 operator canary.

## Tests After

- Browser runtime/capacity unit tests and packaged contract.
- Relay error and capability mapping tests.
- MKTTool readiness, authorization, version-floor, setup state, and UI copy tests.
- Full MKTTool 1,878+ suite, typecheck, lint, and build.
- Full MKTBrowser Node 22 verification and packaging preflight.

## Regression Gate

- Existing 1 account = 1 proxy = 1 profile = assigned device authorization remains enforced.
- No old Relay/Browser combination can silently accept an unsupported operation.
- No user-facing output contains secrets or vendor internals.
- Second PC reaches ready and launches a disposable profile without manual config.

## Success Criteria

### Automated checkpoint - 22 August 2026

- Browser runtime reporting exposes only a validated aggregate capacity shape; Relay and MKTTool
  reject incomplete, inconsistent, or identifier-bearing capacity data.
- `license-capacity-v1` is intentionally withheld, so MKTTool does not treat the diagnostic payload
  as launch authority before the measured vendor lifecycle is connected.
- Profile grid/table readiness now combines current Relay health, Browser compatibility, device
  assignment, proxy/account/profile facts, and current running inventory. Unknown inventory fails
  closed, running filters/counts use Browser profile IDs, and successful launches invalidate stale
  polls.
- Relay propagates only allowlisted stable failure codes. Operator copy does not expose engine names,
  contract details, capability identifiers, paths, ports, proxy endpoints, keys, or internal errors.
- The second-PC setup and integrated disposable launch criteria remain live human gates.

- [ ] Capacity comes from measured lease state.
- [ ] Known blockers disable launch before click and show exact remedies.
- [ ] Relay and Browser version/capability mismatch fails closed.
- [ ] Second-machine setup needs no JSON edit or secret/token copying.
- [ ] Integrated disposable profile launch succeeds through the assigned proxy.
- [ ] All UI and error copy is English and secret-safe.

## Risk Assessment

- Adding status to three layers can create competing truth. Mitigation: Browser owns runtime/lease,
  server owns authorization/account facts, Relay only transports and maps stable codes.
- UI prechecks can become stale. Mitigation: atomic Browser launch remains final authority.
- Capability floors can recreate the Relay 12/13 downgrade incident. Mitigation: publish compatible
  artifacts first, then raise consuming floors, with downgrade tests.

## Security Considerations

- Server never receives local license state details beyond aggregate readiness.
- Only the assigned device receives the ticket containing decrypted proxy data.
- Operator key delivery remains recipient-sealed and local; no manual copy path becomes the default.
