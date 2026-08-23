---
phase: 4
title: "Implement License Lease Recovery"
status: in-progress
priority: P1
effort: "3-5 days"
dependencies: [1, 3]
---

# Phase 4: Implement License Lease Recovery

## Overview

Replace shutdown-method guesses with measured, profile-bound license lease state. Route vendor
session traffic through the profile's proven proxy bridge, journal the minimum recovery metadata,
and recover normal close, hard kill, Electron crash, and restart without exposing keys or marking
ambiguous seats free.

## Context Links

- E:\MKTWorkspace\plans\260820-1001-per-profile-license-sidecar-recovery\plan.md
- E:\MKTWorkspace\plans\reports\research-260820-0858-giao-thuc-license-cloakbrowser.md
- E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-key-pool.ts
- E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\startup-orphan-sweep.ts
- E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBrowserDriver.ts

## Requirements

- Functional: verify the live vendor start, heartbeat, end, identity, and error schema using valid
  owner-controlled keys before production code depends on it.
- Functional: create one loopback-only sidecar per profile launch and forward only measured vendor
  requests through that profile's existing SOCKS bridge.
- Functional: persist lease identity, profile ID, key fingerprint/tail, timestamps, state, and bounded
  recovery data; never persist the full key, proxy URL, credentials, or raw response bodies.
- Functional: a key is idle only after confirmed release. Unknown, timed-out, or crashed outcomes
  remain pending-recovery or cooling.
- Functional: simultaneous profiles cannot cross-wire sidecar ports, keys, proxy routes, or journal rows.
- Non-functional: keep the proprietary engine and vendor protocol unmodified; no response synthesis,
  key generation, install-id rotation, replay, or bypass.
- Non-functional: CFT remains unchanged and never enters the licensed sidecar path.

## Architecture

Profile launch reserves a key, starts the existing profile SOCKS bridge, starts a profile-bound
license sidecar on a random loopback port, points the unmodified engine to that local endpoint, and
journals state transitions. The sidecar forwards vendor traffic through the profile bridge. On
normal end it confirms release before returning the key to idle. On abnormal shutdown the next
startup combines orphan sweep evidence with the journal, recreates the proxy path, requests release,
and keeps uncertainty visible instead of guessing.

## File Inventory

| Action | Path | Purpose |
|---|---|---|
| Create | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-session-sidecar.ts | Profile-bound loopback forwarder with strict route allowlist |
| Create | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-lease-journal.ts | Atomic, minimal, redacted lease state |
| Create | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-lease-recovery.ts | Startup and retry recovery state machine |
| Create | Matching test files beside each module | Protocol, redaction, concurrency, and recovery coverage |
| Modify | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-key-pool.ts | Derive capacity from confirmed lease states |
| Modify | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBrowserDriver.ts | Start/stop sidecar and record launch lifecycle |
| Modify | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\startup-orphan-sweep.ts | Reconcile process cleanup with pending leases |
| Modify | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\index.ts | Run bounded recovery before accepting launches |
| Modify if needed | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\socks5Bridge.ts | Expose a safe forwarding seam without weakening containment |
| Delete | None | Preserve key-pool and orphan-sweep behavior until replacement tests are green |

## Tests Before

1. Preserve current key pool allocation, no-overbooking, seat-refusal rotation, redaction, and empty
   pool tests.
2. Preserve orphan polite-close, kill fallback, process ownership, and process-table failure tests.
3. Write failing contract tests for confirmed-release-only idle state and profile-route isolation.
4. Record sanitized successful and refused live protocol schemas; abort the phase if the schema is
   not stable enough to implement without guessing.

## Implementation Steps

1. Run one controlled protocol gate with a disposable profile and valid key. Record method, path,
   required fields, response status categories, timing, and correlation only.
2. Define the lease state machine: idle, reserved, starting, active, ending, pending-recovery,
   cooling, confirmed-released, and terminal-refused where applicable.
3. Implement atomic journal writes with schema versioning and crash-safe replacement.
4. Implement a loopback-only sidecar with exact vendor host/path/method allowlist, body-size limits,
   timeouts, correlation IDs, and longest-first secret redaction.
5. Route sidecar upstream through the already-running profile SOCKS bridge. Refuse direct egress if
   the bridge is missing or unhealthy.
6. Bind sidecar instance, proxy bridge, profile ID, key allocation, child PID, and journal row into
   one launch context owned by ChromiumBrowserDriver.
7. Confirm session start before reporting launch capacity consumed and active.
8. On normal Browser.close, forward session end and mark the key idle only after confirmed release.
9. On SIGTERM, SIGKILL, launcher handoff, Electron crash, or unknown exit, mark pending-recovery.
10. At startup, finish orphan process cleanup, restore the matching proxy bridge, and attempt bounded
    release recovery. Never block the UI indefinitely.
11. Add an explicit retry path for pending recovery and a safe operator-visible cooling state.
12. Test two simultaneous profile launches with two keys and two proxies under forced interleaving.
13. Test app restart and simulated power loss from journal fixtures before any live destructive gate.
14. Remove timer-only assumptions only after the measured state machine passes all regressions.

## Measured 23 August 2026 - live vendor protocol

Evidence: [`ket-qua-260823-1250-do-nang-luc-seat-cloakbrowser.md`](../reports/ket-qua-260823-1250-do-nang-luc-seat-cloakbrowser.md),
[`ket-qua-260823-1910-gate-cach-ly-va-loi-khong-xoay-khoa.md`](../reports/ket-qua-260823-1910-gate-cach-ly-va-loi-khong-xoay-khoa.md)

| Measured | Result |
|---|---|
| `session/start` | HTTP 200, `lease_id`, `plan: "free"` |
| `lease_ttl_seconds` | 900 |
| `heartbeat_interval_seconds` | 300 |
| `session/end` | HTTP 200 `{"ok":true}`, seat free within seconds |
| Second session, same key | HTTP 403 `session_limit_exceeded`, `active_sessions:1`, `limit:1` |
| Second session, second key, same `install_id` | Granted. Sessions are counted **per licence**, not per account and not per install |
| Normal profile close | Seat free in seconds, not after the 900s lease. Measured twice |

The capacity model is therefore N keys on one machine, not N machines. Recovery after an unclean
exit is measured only incidentally so far: a launch that dies before it is licensed leaves the seat
held until the lease expires, observed at roughly 20-25 minutes rather than the nominal 900s, which
is what the pool's 17-minute cooldown already assumes.

### Blocker found and fixed while measuring

Key rotation never ran. The engine serves CDP before the licence server answers, and every check for
the child's exit sampled it once while it was still alive, so launch resolved successfully at ~0.9s
and the verdict landed at ~1.2s against a loop that had already returned. A held primary killed the
launch with a free key sitting unused in the pool.

Fixed in browser commit `b63d212`, proven on hardware: a held primary is refused, logged as
`LICENCE-KEY-REFUSED` with a `keysLeft` countdown, and the launch succeeds on the next free key,
reaching bootstrap in 1.4s. Two log shapes now tell the story apart - 15s with `port: null` and exit
76 means no seat; ~1.4s to `BOOTSTRAP-DONE` means the seat was granted.

Alongside it, browser commit `22207ad`: nothing in the renderer referenced the key list, so an
operator had no way to enter a second key at all. An N-key cost model needs a route into the product.

### Still open

Heartbeat behaviour across a long session, and recovery from hard kill, Electron crash, Relay restart
and reboot. Until those are measured, `license-capacity-v1` stays unadvertised.

## Test Scenario Matrix

| Scenario | Expected |
|---|---|
| Normal close | End confirmed; key returns idle |
| Browser hard kill | Lease becomes pending-recovery; not advertised free |
| Electron crash | Journal survives; startup recovery is deterministic |
| Power loss fixture | Partial write rejected or recovered from last valid record |
| Recovery success | Correct profile proxy used; exact lease released |
| Recovery timeout | State remains pending/cooling; bounded error shown |
| Two profiles/two keys | No key, port, proxy, or journal cross-wire |
| Seat refusal | Only refused key rests; next valid key may be tried |
| Proxy bridge failure | License and browser launch fail closed; no direct request |
| CFT launch | Sidecar and lease journal remain inactive |
| Malformed vendor response | No guessed success; state remains non-idle |
| Secret-like overlap in error | Full key/proxy fragments redacted longest-first |

## Dependency Map

- Requires phase 1 baseline and phase 3 proven proxy route.
- Supersedes execution details in 260820-1001-per-profile-license-sidecar-recovery.
- Blocks phase 5 capacity UX and phase 6 lifecycle canary.

## Tests After

- Unit tests for state machine, journal atomicity, sidecar allowlist, timeouts, redaction, and recovery.
- Driver integration tests for start/close/crash ordering.
- Concurrency tests with delayed start/end responses.
- Packaged restart test using disposable roots.
- One controlled live normal-close and one owner-approved hard-kill recovery run.

## Regression Gate

- Existing MKTBrowser suites remain green.
- New lease tests prove a key cannot become idle from shutdown method alone.
- Full Node 22 typecheck, lint, test:installer, desktop build, and packaged runtime contract pass.
- No full key, proxy secret, raw vendor body, or observed IP exists in files or logs.

## Success Criteria

### Automated checkpoint - 22 August 2026

- Implemented a versioned lease journal with atomic replacement, `.previous` recovery, strict record
  validation, copy-on-write memory updates, and serialized concurrent mutations.
- Full keys never enter the journal or runtime capacity boundary. Short development keys are masked,
  key fingerprints cannot cross the MCP response, and persisted error codes are bounded stable codes.
- Implemented deterministic recovery logic for unstarted reservations, missing profiles/keys,
  confirmed release, retry, thrown release, and concurrent profile isolation using fixtures.
- Capacity aggregation excludes pending-recovery and cooling records from free seats, but remains
  diagnostic-only.
- Not implemented by design: vendor protocol sidecar, driver lifecycle journal writes, startup
  release through the profile proxy, and live normal-close/hard-kill recovery. Those require the
  sanitized owner-controlled vendor protocol capture first.

- [ ] Live protocol schema is measured and sanitized before implementation.
- [ ] Each licensed profile owns one sidecar, bridge, key allocation, and journal row.
- [ ] Confirmed release is the only transition to idle.
- [ ] Normal close, hard kill, Electron crash, restart, and power-loss fixtures recover deterministically.
- [ ] Two simultaneous profiles cannot cross-wire keys or routes.
- [ ] CFT behavior is unchanged.

## Risk Assessment

- Vendor protocol can change without notice. Mitigation: strict schema validation, versioned evidence,
  bounded failure, and no synthesized responses.
- Recovery through an expired or unavailable proxy may be impossible. Mitigation: retain pending state,
  expose retry, and never lie that capacity is free.
- Sidecar work can accidentally become a license bypass. Mitigation: forward only measured traffic,
  keep engine and response semantics unmodified, and stop on any requirement to emulate the vendor.
- ChromiumBrowserDriver is already large. Mitigation: new lease responsibilities live in focused modules;
  the driver only owns orchestration.

## Security Considerations

- Store only key tail or one-way fingerprint; never full keys.
- Bind listeners to 127.0.0.1 with unguessable per-launch correlation and strict request limits.
- Do not expose sidecar endpoints through MCP, renderer IPC, Web, or Relay responses.
- Treat raw vendor captures as ephemeral sensitive material and delete them after sanitized schema review.
