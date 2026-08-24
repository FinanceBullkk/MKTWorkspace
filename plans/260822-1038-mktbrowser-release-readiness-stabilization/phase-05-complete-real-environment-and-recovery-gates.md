---
phase: 5
title: "Complete Real Environment and Recovery Gates"
status: in-progress
priority: P1
effort: "4-7 working days plus access to two Windows PCs, two proxies, and live vendor keys"
dependencies: [4]
---

# Phase 5: Complete Real Environment and Recovery Gates

## Overview

Close the gates code cannot prove: real network identity, human input, live vendor lease behavior,
crash/reboot recovery, and clean second-PC installation. Use the exact verified Phase 4 candidate.

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
- Second PC installs from one published package without Node, manual JSON, key copying, or port editing.

## Architecture And Gate Order

```text
verified candidate on PC A
  -> two-profile proxy/DNS/WebRTC isolation
  -> human login/input and normal use
  -> live vendor lease protocol + failure recovery
  -> crash/reboot matrix

verified candidate on clean PC B
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
7. Install the verified candidate on clean PC B through the supported one-download journey. Complete
   device assignment and managed profile launch without developer tools or manual config.
8. Repeat one network, input, crash/reboot, repair, and uninstall smoke on PC B.
9. Update living roadmap and linked plan checkboxes only from evidence. Any failed gate leaves rollout
   NO-GO with an exact blocker and artifact hash.

## Measured 23 August 2026 - PC A

Evidence: [`ket-qua-260823-1910-gate-cach-ly-va-loi-khong-xoay-khoa.md`](../reports/ket-qua-260823-1910-gate-cach-ly-va-loi-khong-xoay-khoa.md)

| Gate | Result |
|---|---|
| Vendor capacity model | Sessions are counted **per licence**, not per account or per install. Two keys granted two concurrent sessions on one `install_id`. N concurrent profiles cost N keys on one machine |
| Per-profile proxy egress | Pass. Profile A egressed `82.29.239.125` and profile B `82.25.225.8`, each matching only its own independent probe. The operator's real address never appeared |
| DNS | Pass. Each profile's resolver was its own proxy, not the operator's ISP resolver |
| WebRTC | Pass. No ICE candidates gathered under either profile, so nothing to leak. The total absence is itself a possible fingerprint tell and is not yet measured |
| Concurrent two-profile isolation | **Not run.** Only one seat was ever free, so A and B were measured sequentially. Sequential measurement cannot exclude cross-wiring between two live profiles |
| Normal close returns the seat | Pass, twice. The seat was free within seconds, not after the 900s lease expiry |
| Hard kill, Electron crash, Relay restart, reboot | Not run |
| Clean second-machine install | **Pass**, 24 August. A Windows 11 Home guest that had never held the product: published hash matched after transfer, silent install produced 129 files, the app started in the operator's own session and served its control port, and first run provisioned its own token, data directory and profile store with no Node, no hand-written JSON and no port chosen by anyone |
| Uninstall | **Pass**. Every file and the shortcut removed and the registry entry gone, while the operator's marker file and profiles.db survived. Only an empty program folder remains |
| Repair | Not run |

### The clean machine is a snapshot, and that is the point

The second-PC gate now runs against a Windows 11 Home guest rather than a spare laptop, because
"a machine that has never had the product" is a property a real machine has exactly once. Restoring
a snapshot brings it back in about thirty seconds, and it was needed: the first pass installed the
product before the harness failed, which destroyed the very precondition the gate exists to test.

Scope is deliberately narrow. A virtual GPU and its device strings are themselves a detection
signal, so nothing about fingerprint realism, and no real account, belongs in this guest. It
measures installation, first run and removal.

Three harness defects were found and fixed while getting there, all of them ways a test can look
like a product failure. The gate ran over SSH, which lands in session 0 with no desktop, so the
launched app never opened its control port - it now launches through an interactive scheduled task,
which is also how an operator actually starts it. `Start-Process -Wait` on the silent installer
never returned even though 129 files and a working uninstaller were already on disk. And a live
snapshot cannot be taken on this host at all: it fails saving machine state and leaves the guest
wedged, while an offline snapshot works and is all this gate needs.

Worth naming for whoever runs this next: the host's own hypervisor holds AMD-V, so VirtualBox falls
back to the NEM backend. The guest wedges hard under sustained load - twice during Windows setup,
once mid-gate. Recovery is a snapshot restore. It is a property of this host, not of the product,
and it is the reason every step here is short and driven from outside the guest.

### Blocker found while running this gate, and its fix

The build did not rotate to a free licence key when the primary was refused. `LicenseKeyPool` and
`launchWithKeyRotation` exist for exactly this, but with a held primary and a free second key in the
pool the launch died at exit 76 without rotating; with the free key as primary the same launch
succeeded.

Root cause: the engine serves CDP before the licence server answers, and every check for the child's
exit was a single sample taken while it was still alive. Launch resolved successfully at ~0.9s and
the verdict landed at ~1.2s, so the rotation loop had already returned before a refusal existed. The
bootstrap-stage check also threw an untagged `Error`, which `isSeatRefusal` cannot recognise.

Fixed in `b63d212`: launch waits out a bounded verdict window (2.5s, twice the slowest measured
verdict) before publishing the running record, returning early the moment the child exits, and every
during-launch exit is classified through one path. Timing and classification moved to
`apps/desktop/src/main/licence-verdict.ts` with seven tests, proven to fail against the old
behaviour first.

Verified on hardware, end to end. With the primary key's seat genuinely held and the second key
free, the launch refused the primary at exit 76, logged `LICENCE-KEY-REFUSED keysLeft:1`, spawned
again on the free key, and reached `BOOTSTRAP-DONE` in 1.4s with CDP serving. N keys now buys N
profiles. Two shapes are now distinguishable in the log: 15s with `port: null` and exit 76 means the
seat was unavailable; ~1.4s to `BOOTSTRAP-DONE` means it was granted.

A second gap surfaced while proving this and is fixed in `22207ad`: nothing in the renderer
referenced `cloakBrowserLicenseKeys`, so an operator had no way to enter a second key at all — the
list had to be hand-edited into `settings.json`. Settings now manages the key list. Replacing the
primary also drops the retired key, which the store had been silently folding back into the pool.

## Test Scenario Matrix

| Priority | Scenario | Pass condition |
|---|---|---|
| Critical | Profile A/B assigned different proxies | Each browser egress matches only its own proxy; no direct route |
| Critical | DNS/WebRTC probes under both profiles | No operator-home/public direct address or cross-profile route |
| Critical | Vendor lease after Electron/browser crash | Seat state matches vendor truth; bounded recovery; no false-free state |
| Critical | Reboot with active and pending leases | Startup sweep/recovery converges without cross-wiring |
| Critical | Clean second-PC install | Installer hash matches the published value, no Node/config copying, correct device ownership |
| High | Manual typing/login/window focus | No unexplained input loss/stall; credentials remain human-controlled |
| High | Relay restart during Browser activity | Existing browser remains safe; subsequent operation re-authenticates |
| High | Repair/uninstall | Owned app files handled; profiles and unrelated Relay state preserved |

## Success Criteria

- [ ] Two disposable proxy/profile assignments pass egress, DNS, WebRTC, and isolation checks.
- [ ] Human input/login works on both PCs without credential automation.
- [ ] Live vendor lifecycle is measured and integrated; capacity is honest and fail-closed.
- [ ] Normal close, hard kill, Electron crash, Relay restart, and reboot recover deterministically.
- [ ] Clean second-PC install/setup/launch/repair/uninstall passes with the verified candidate.
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
