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
crash/reboot recovery, and clean second-PC installation. Use the exact current-source Phase 4
candidate only after its supported combined install and repair gates pass.

This phase consumes, rather than duplicates, the execution details in the active P0 operational plan
and the per-profile license sidecar/recovery plan. Master-plan completion requires their relevant
phases to be checked off with sanitized evidence.

## Context Links

- [P0 operational readiness](../260821-1925-antidetect-browser-proxy-p0/plan.md)
- [Per-profile license recovery](../260820-1001-per-profile-license-sidecar-recovery/plan.md)
- [First operator onboarding](../260818-0915-first-operator-pilot-onboarding/plan.md)

## Requirements

- Use two disposable managed profiles and two assigned static proxies, opened **one at a time**
  under the 25 August one-seat cap, across PC A and the clean VM guest acting as PC B.
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
current-source attested candidate on PC A
  -> sequential two-profile proxy/DNS/WebRTC isolation (one seat, one profile open at a time)
  -> human login/input and normal use
  -> live vendor lease protocol + failure recovery
  -> crash/reboot matrix

same attested candidate on the clean VM guest acting as PC B
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
| Clean second-machine install | **Reopened 24 August.** Clean preflight and receive-side hash pass. The old harness stopped when Browser files appeared, before mandatory firewall/Relay custom-install work completed. Fresh evidence had 129 Browser files but no Relay, no firewall rules, no startup shortcut, no Publisher, and no Relay ownership metadata |
| Uninstall | Browser-file removal and Browser-data preservation were observed after the partial install. This does not prove combined Browser + Relay ownership cleanup because the supported installed state never existed |
| Repair | **Environmental FAIL.** Defender remediated installer-spawned PowerShell behavior as `Behavior:Win32/PShellCobStager.A`; it was not disabled or allow-listed |

### The snapshot remains useful; the completion condition changed

The Windows 11 Home snapshot still gives a reproducible clean precondition. It remains intentionally
limited to installation and recovery; virtual hardware cannot prove fingerprint realism and no real
account belongs in it.

The critical harness defect was deeper than an SSH/session issue. Browser payload copy happens before
the installer's mandatory firewall/Relay custom phase. Polling only for `MKTBrowser.exe` converted a
partial install into a false pass. Both clean-install and repair harnesses now require installer exit
zero, Browser payload, pinned Relay, two WebRTC firewall rules, desktop/startup shortcuts, Publisher,
and Relay ownership metadata before launch begins.

The current environment cannot reach that state without changing security policy. The repair clone
showed the installer's Administrator error and two Defender detections. Defender remained enabled and
was not allow-listed. The disposable clone disk/config was deleted afterward; the original VM data on
`D:` remains untouched.

The VirtualBox/NEM instability remains an environment constraint: live snapshots can wedge the guest,
while offline restore is reliable enough for short external gates.

### Lifecycle continuation - 24 August 2026

Evidence: [`lifecycle-installer-repair-evidence-20260824.md`](../260821-1925-antidetect-browser-proxy-p0/reports/lifecycle-installer-repair-evidence-20260824.md).

The host runtime was bound to the current local directory artifact, not the older candidate: source
`c802fabb`, tree `bd87f752`, executable SHA-256 `9c269536...`, and `app.asar` SHA-256
`37ba4a0a...`. The control-port PID was an interactive-session `MKTBrowser` process and the exact
hashed executable was locked, but sandbox policy prevented querying the PID image path. This is
strong local evidence, not release provenance, and cannot qualify the candidate.

One unmanaged disposable profile with no proxy or account data launched and closed through MCP.
Capacity moved `free 1 / active 0 / cooling 1` -> `0 / 1 / 1` -> `1 / 0 / 1`. Lifecycle logs record
`Browser.close`, child exit code 0, and `SHUTDOWN-COMPLETE` with method `Browser.close`. The close
added no cooling or pending-recovery state.

The earlier attempt started with two free keys. One vendor key was refused, remained cooling, and the
second key opened the profile after rotation. The active seat returned on close; the refused key did
not falsely become free.

Hard kill and Electron crash were not injected: terminate access returned Win32 error 5 for every
new disposable engine process and the Browser main process, so the harness could not guarantee safe
scope or relaunch. Relay restart was inapplicable because no Relay process/listener was running. Host
reboot was not performed because it would disrupt unrelated processes without separate exact reboot
authorization. Production pending-recovery reboot remains structurally blocked by the missing driver
journal writes, sidecar forwarding, and startup vendor release integration.

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

### The journal writes named as a structural blocker are now in - 24 August 2026

The blocker recorded above - "missing driver journal writes ... and startup vendor release
integration" - was more literal than it read. `license-lease-journal.ts` and
`license-lease-recovery.ts` existed and were fully tested, but **nothing in the product ever called
them.** The journal was opened at startup and read only to render capacity; `recoverLicenseLeases`
was referenced by its own test and nowhere else. The only live seat bookkeeping was
`LicenseKeyPool`, which is in memory, so every restart offered every key as `idle`.

That is what the concurrent-isolation probe hit. A browser killed by a crash or a Stop leaves its
session open on the vendor for the full lease; the app restarts having forgotten this; the next
launch picks that key and is refused exit 76. On a one-key install it is the whole product
unavailable, with nothing running that the operator could close to explain it.

Fixed in Browser `3ecc68f`:

| Change | Effect |
|---|---|
| Pool seeds `cooling` from persisted leases, counted from each lease's own `updatedAt` | A restart no longer resets the vendor's clock |
| `LicenseLeaseRecorder` writes reserve → starting → active → ending → `confirmed-released` \| `cooling`, plus `terminal-refused` on a refusal | The journal finally carries real data |
| `licenseSeatWaitMessage` replaces a bare `ENGINE_UNAVAILABLE` | Distinguishes "close a running profile" from "a previous session is resting, ~X minutes left" |

Journal writes are best-effort and logged: a bookkeeping failure must never refuse a launch that
would otherwise work.

**Lease expiry is now measured, not assumed.** A lease abandoned with no `session/end` and no
heartbeat was reclaimed after **15.1 minutes**, against the server's declared
`lease_ttl_seconds: 900` - enforced to within five seconds. The 17-minute cooldown stays as 900s
plus clock-skew margin. This corrects the "roughly 20-25 minutes" previously recorded in
`260821-1925-.../phase-04`, which was never reproduced.

Still open, and deliberately so: a killed browser continues to lose its seat for the full lease.
`session/end` needs a `lease_id` and `instance_id` that die with the engine. This work declines to
offer the key until the vendor's clock has run - trading an unexplained refusal for an explained
wait - rather than recovering the seat, which would require intercepting the licence channel and sits
against the binary licence's reverse-engineering clause. `recoverLicenseLeases` therefore still does
not run at startup; its `deps.release` needs that same impossible call. The journal now carries real
records, so it is ready the day a legitimate release path exists.

At this checkpoint the change was unit-tested only. The next subsection records the later human
gate that killed a browser, restarted the app, and checked the cooling state.

### Hard-kill and restart cooling continuation - 25 August 2026

Evidence: `local-test-artifacts/phase5/hard-kill-restart-cooling-evidence.json`, run
`P0-G3-SEAT-20260825110255`.

The human seat-safety gate passed on the corrected dirty-source directory artifact. Its base is source
`78499472f0283f31328432e79b45d1dee34c6fa3`, tree
`b060da0583a768580afb2fa54c00101a4c708150`, with dirty-source SHA-256
`e00e333ead8b488630d81abf0229854501c0cf5561b861659a48e639b1b0f212`. The executable SHA-256 is
`c4a156219a49ec1ced225c0435274786490c6ae066ef58496eb38d3b94cc0eee`; packaged `app.asar` SHA-256
is `fea4c756c079144588944ca1fab98269d99742b1613466600ae11f3482f7b09f`. The gate used
CloakBrowser `151.0.7922.108.2`.

A licensed disposable profile reached journal `active` with `0 free / 1 active`. The exact owned
CloakBrowser main process was externally killed. The journal became `cooling`, never
`confirmed-released`, and capacity became `0 free / 1 cooling`. Restarting the app with the same
single key preserved that state and blocked relaunch before engine spawn with an honest cooling-wait
message. Restoring the original two-key settings exposed the independent free key as
`1 free / 1 cooling`. Original settings were restored byte-for-byte, no owned process remained, and
the cooling journal was intentionally preserved rather than making the vendor-held seat false-free.

The same executable and `app.asar` hashes then passed the packaged runtime/profile contract under
Node `22.23.2`; that verifier used engine `151.0.7922.174`. This is a pass for the hard-kill/restart
cooling-safety subset only. The Electron app was terminated after the browser was already gone and
cooling, so active-session Electron crash, Relay restart, reboot/startup convergence, and early
vendor seat release remain unproved. `G3-RECOVERY` therefore remains open.

#### Post-gate adversarial correction

Review found a Windows launcher-handoff race after the human run. The spawned child may exit `0`
while the actual owned browser runs under another PID; if that browser then crashes, treating the
launcher exit as a clean seat release creates a false-free key. The driver now trusts a zero/no-signal
exit only when it belongs to the owned browser PID. A launcher exit remains ambiguous and cooling.

The corrected dirty source has SHA-256
`e00e333ead8b488630d81abf0229854501c0cf5561b861659a48e639b1b0f212`. Under Node `22.23.2`, focused
lifecycle tests pass `47/47`, `test:mkb02` passes `116/116`, and critical coverage passes `89/89` at
88.07% lines, 82.70% branches, and 87.50% functions. Typecheck, lint, the full installer/build gate,
and the fresh packaged contract also pass. The rebuilt directory artifact is executable SHA-256
`c4a156219a49ec1ced225c0435274786490c6ae066ef58496eb38d3b94cc0eee`, packaged `app.asar` SHA-256
`fea4c756c079144588944ca1fab98269d99742b1613466600ae11f3482f7b09f`; it is unsigned and unattested.

The pre-review run is retained separately at
`local-test-artifacts/phase5/hard-kill-restart-cooling-evidence-pre-review.json`, executable
`d4189049...`. After its lease expired, the corrected artifact reran the same narrow human gate and
passed. Its new retained vendor seat is cooling, so do not repeat the destructive gate until that
lease expires.

### Active Electron crash recovery continuation - 25 August 2026

Evidence: `local-test-artifacts/phase5/active-electron-crash-evidence.json`, run
`P0-G3-ELECTRON-20260825122143`; the original failing run is retained as pre-fix evidence.

The first run proved the missing seam: startup politely closed the exact browser orphan, but the
durable `active` lease and pool block did not change. The corrected startup path now returns a
profile-scoped seat verdict only for the exact owned CloakBrowser layout, applies it to the journal
and in-memory pool, and leaves failed/unmatched cases pending or cooling instead of guessing free.

On the rebuilt artifact, force-killing only the exact Electron main left the owned CloakBrowser and
journal active. Restart closed that orphan through `Browser.close`, converged the journal to
`confirmed-released` and capacity to one free seat, then relaunched and cleanly closed the same
profile as a vendor differential. No process, settings backup, or test journal remained after
cleanup; evidence retained no secret or local identity.

Artifact: dirty-source SHA-256 `38196691...067a`, executable `50b0ccb3...5469`, `app.asar`
`7160c85a...a557`, unsigned and unattested. Node `22.23.2` verification passes `test:mkb02` 120/120,
critical coverage 93/93 at 88.66/83.74/87.78, typecheck, lint, installer/build, and packaged contract.
Active-session Electron crash is closed for this artifact; Relay restart and reboot/startup have the
concrete failures below, so `G3-RECOVERY` and the Phase 5 success criterion remain open.

### Relay restart and host reboot continuation - 25 August 2026

Relay run `P0-G3-RELAY-20260825130239` used installed Relay version 15, SHA-256
`eb37eb54...10d1`, against Browser dirty source `38196691...067a`, EXE `50b0ccb3...5469`, and
`app.asar` `7160c85a...a557`. The Browser survived the Relay restart, Relay identity and active
capacity stayed stable, a fresh ticket worked, and final close confirmed release. The same restart
forgot an unexpired consumed ticket and accepted it again. The gate fails
`RELAY-RESTART-FORGETS-SPENT-TICKET`; spent JTI replay state must survive process restart.

Owner-approved reboot run `P0-G3-REBOOT-20260825135710` began at journal `active`, capacity
`0 free / 1 active`. The host boot time changed and no Browser process survived. Exact packaged
startup then reported `0 free / 0 active / 1 pending`, retained the journal as `active`, and blocked
relaunch before spawning. This is `FAIL-CLOSED`: it prevents false-free reuse, but it does not
recover availability or offer deterministic convergence. The blocker is
`REBOOT_LEASE_STUCK_PENDING_RECOVERY`.

After the 17-minute safety margin, cleanup restored the original settings, journal, and profile DB
and removed the disposable profile, one-shot task, backups, and owned processes. A separately
installed Browser instance briefly locked the profile DB, requiring one cleanup-only retry; that
retry is excluded from the product verdict because restore had already begun.

Phase 5 remains open. Fix Relay replay durability and wire reboot-stranded lease convergence before
rerunning these two gates.

### Clean second-machine installation continuation - 25 August 2026

Evidence: `local-test-artifacts/vm/clean-install-evidence.json` and
`local-test-artifacts/vm/defender-evidence.md`.

The corrected clean-machine harness passed 9/9 for current-source candidate `7849947`, tree
`b060da0583a768580afb2fa54c00101a4c708150`, installer SHA-256
`ad1af433cea4070b5860a3c841d170bb1ef91ec3df33e2c11309acd0ba5d945c`. The guest had no product or
Node runtime before transfer. The completed state included Browser, pinned Relay, two firewall
rules, desktop and startup shortcuts, Publisher/ownership metadata, the local control listener,
and first-run MCP token and profile store. Defender stayed enabled with no detection in the gate
window and no policy change.

The guest engine was `1.1.25080.5` with signatures `1.437.1.0`, so the same gate must be rerun after
updating the offline clean snapshot. Repair and combined uninstall have not inherited this pass and
remain open. The candidate is unsigned, unattested, and not releasable; therefore the Phase 5
clean-second-PC success criterion and overall rollout remain open.

The rerun from snapshot `clean-with-ssh-defender-20260825` passed the same 9/9 matrix after Defender
was updated and verified across reboot at engine `1.1.26070.7`, signatures `1.457.331.0`. No threat
or Defender event 1116/1117 appeared in the gate window. The old-definition caveat is closed for
clean install; repair, combined uninstall, attestation, and the remaining Phase 5 gates stay open.

Repair and combined uninstall then passed separately on the same candidate and Defender snapshot.
Repair passed 13/13 after deliberate damage to owned payload, shortcuts and registry metadata;
operator profile/token/database state and Relay config survived, and post-repair launch served the
control port. Uninstall passed 15/15: Browser payload, shortcuts, firewall rules, uninstall metadata
and the Browser-owned Relay executable were removed; operator data and unrelated Relay state were
preserved; no owned process or control listener remained. Defender recorded no detection or event
1116/1117 in either gate window.

This closes the VM installer lifecycle slice for current source. It does not close authenticated
second-PC setup, attestation, reboot recovery, human input, network isolation or
the Phase 5 success criterion as a whole.

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

- [ ] Two disposable proxy/profile assignments pass egress, DNS, WebRTC, and isolation checks,
  measured sequentially. Concurrent isolation is DEFERRED, not passed.
- [ ] Human input/login works on both PCs without credential automation.
- [ ] Live vendor lifecycle is measured and integrated; capacity is honest and fail-closed.
- [x] Normal close, hard kill, Electron crash, Relay restart, and real power-cycle reboot recover deterministically on the hash-bound 27 August evidence.
- [ ] Clean PC B install/setup/launch/repair/uninstall passes with the verified candidate on the VM
  guest, with the evidence recording the machine as virtual.
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
