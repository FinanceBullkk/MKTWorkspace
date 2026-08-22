---
phase: 5
title: "Complete Real Environment and Recovery Gates"
status: pending
priority: P1
effort: "4-7 working days plus access to two Windows PCs, two proxies, and live vendor keys"
dependencies: [4]
---

# Phase 5: Complete Real Environment and Recovery Gates

## Overview

Close the gates code cannot prove: real network identity, human input, live vendor lease behavior,
crash/reboot recovery, and clean second-PC installation. Use the exact signed Phase 4 candidate.

This phase consumes, rather than duplicates, the execution details in the active P0 operational plan
and the per-profile license sidecar/recovery plan. Master-plan completion requires their relevant
phases to be checked off with sanitized evidence.

## Context Links

- [P0 operational readiness](../260821-1925-antidetect-browser-proxy-p0/plan.md)
- [Per-profile license recovery](../260820-1001-per-profile-license-sidecar-recovery/plan.md)
- [First operator onboarding](../260818-0915-first-operator-pilot-onboarding/plan.md)

## Requirements

- Use two disposable managed profiles, two assigned static proxies, and two Windows PCs.
- Preserve `1 account = 1 static proxy = 1 managed profile = 1 assigned Relay device`.
- First Google/Reddit/TikTok login and all credentials/OTP remain human-controlled.
- Never record proxy credentials, license keys, cookies, tickets, raw IPs, or page contents in evidence.
- Prove Browser egress equals independent proxy probe while DNS/WebRTC reveal no direct route.
- Prove vendor start/heartbeat/end and recovery behavior before advertising capacity as authoritative.
- Prove normal close, browser hard kill, Electron crash, Relay restart, OS reboot, and power-loss-like
  interruption do not cross-wire profiles or strand a seat indefinitely.
- Second PC installs from one signed package without Node, manual JSON, key copying, or port editing.

## Architecture And Gate Order

```text
signed candidate on PC A
  -> two-profile proxy/DNS/WebRTC isolation
  -> human login/input and normal use
  -> live vendor lease protocol + failure recovery
  -> crash/reboot matrix

signed candidate on clean PC B
  -> install -> authenticated setup -> device assignment -> managed launch
  -> repeat network/input/recovery smoke
  -> uninstall/repair proof
```

Do not start real-account work until disposable profile gates pass on both PCs.

## Evidence Inventory

| Create/Update | Path | Purpose |
|---|---|---|
| Update | `E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\phase-02-stabilize-browser-input-and-manual-login.md` | Human input/login proof |
| Update | `E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\phase-03-prove-proxy-dns-webrtc-and-fingerprint-isolation.md` | Network identity proof |
| Update | `E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\phase-04-implement-license-lease-recovery.md` | Live vendor/recovery proof |
| Update | `E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\phase-05-integrate-operator-readiness-and-capacity-ux.md` | Honest readiness/capacity behavior |
| Update | `E:\MKTWorkspace\plans\260818-0915-first-operator-pilot-onboarding\plan.md` | Second-PC friction and completion status |
| Create | Plan-scoped sanitized evidence files under the existing P0 plan | Machine-readable pass/fail, hashes, timestamps, no secrets |
| Update | `E:\MKTWorkspace\MKTTool\docs\development-roadmap.md` | Living NO-GO/GO gate truth |

## Interface Checklist

- [ ] Browser runtime reports stable, allowlisted failure codes for each blocked gate.
- [ ] Relay preserves ticket/device ownership and never receives operator secrets outside its boundary.
- [ ] Capacity remains unavailable/unknown until live vendor evidence is authoritative.
- [ ] Network evidence binds profile ID hash, proxy assignment hash, Browser artifact hash, and time.
- [ ] Recovery evidence distinguishes confirmed release, pending/cooling, and unknown; unknown never
  becomes free by timeout guess alone.
- [ ] Setup UI routes every failure to an operator action without exposing Relay/MCP vocabulary.

## Implementation Steps

1. Freeze a sanitized test manifest: installer SHA-256, Browser source/tree, Relay version/hash,
   PC labels A/B, profile labels, proxy labels, engine version/hash, and planned fault sequence.
2. On PC A, run two disposable profiles separately and concurrently. Compare independent proxy probe
   to in-browser egress; test DNS and WebRTC; reopen profiles and verify stable fingerprint plus no
   cross-profile storage or process reuse.
3. Complete human input tests: click/type/paste/file picker/window focus/minimize/cover behavior and
   one manual login. Record only timing and pass/fail, never credentials or page data.
4. Capture the live vendor license protocol using owned valid keys and sanitized schema. Implement or
   finish sidecar/driver integration per the existing plan; prove start/heartbeat/end and error states.
5. Run lifecycle faults in fixed order: normal close, browser hard kill, Electron crash, Relay restart,
   reboot with Browser open, reboot during pending recovery, and controlled power-loss equivalent.
6. Verify every recovery result against vendor truth. No key returns to idle until confirmed release.
7. Install the signed candidate on clean PC B through the supported one-download journey. Complete
   device assignment and managed profile launch without developer tools or manual config.
8. Repeat one network, input, crash/reboot, repair, and uninstall smoke on PC B.
9. Update living roadmap and linked plan checkboxes only from evidence. Any failed gate leaves rollout
   NO-GO with an exact blocker and artifact hash.

## Test Scenario Matrix

| Priority | Scenario | Pass condition |
|---|---|---|
| Critical | Profile A/B assigned different proxies | Each browser egress matches only its own proxy; no direct route |
| Critical | DNS/WebRTC probes under both profiles | No operator-home/public direct address or cross-profile route |
| Critical | Vendor lease after Electron/browser crash | Seat state matches vendor truth; bounded recovery; no false-free state |
| Critical | Reboot with active and pending leases | Startup sweep/recovery converges without cross-wiring |
| Critical | Clean second-PC install | Valid signature, no Node/config copying, correct device ownership |
| High | Manual typing/login/window focus | No unexplained input loss/stall; credentials remain human-controlled |
| High | Relay restart during Browser activity | Existing browser remains safe; subsequent operation re-authenticates |
| High | Repair/uninstall | Owned app files handled; profiles and unrelated Relay state preserved |

## Success Criteria

- [ ] Two disposable proxy/profile assignments pass egress, DNS, WebRTC, and isolation checks.
- [ ] Human input/login works on both PCs without credential automation.
- [ ] Live vendor lifecycle is measured and integrated; capacity is honest and fail-closed.
- [ ] Normal close, hard kill, Electron crash, Relay restart, and reboot recover deterministically.
- [ ] Clean second-PC install/setup/launch/repair/uninstall passes with the signed candidate.
- [ ] Evidence is sanitized, bound to exact artifact hashes, and reviewed before canary.

## Risk Assessment

- Real proxy/provider behavior can change during a run. Mitigation: independent before/after probes and
  invalidation of ambiguous trials.
- Fault tests can consume vendor seats temporarily. Mitigation: one controlled fault at a time,
  confirmed recovery before the next, no unbounded retries.
- Second-PC state may not be clean. Mitigation: record OS/account/install preflight and reject unknown
  previous Browser/Relay ownership.

## Security Considerations

Evidence must use hashes/labels and endpoint-free summaries. Screenshots/logs are retained only when
needed, inspected for secrets, and removed after the review window.

## Next Step

Only the exact candidate that passes every gate can enter Phase 6.
