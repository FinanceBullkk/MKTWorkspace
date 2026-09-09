---
phase: 4
title: "Exact VM verification and delivery"
status: in-progress
effort: ""
---

# Phase 4: Exact VM verification and delivery

## Overview

Validate the exact frozen installer on restored clean VM, then deliver only as far as evidence allows.

## Historical Checkpoints

Checkpoint (8 September, 11:14 ICT): packaged host contract r2 PASS 5/5; exact feature heads pushed;
signed candidate staged locally without publication. Corrected clean VM r2 PASS 9/9 with bound
wrapper PASS and child exit 0, completed 03:56:35Z. Preserve the first wrapper FAIL
(`childExitCode: null`); it is not reclassified. R2 bound receipt SHA-256:
`0a9d9fe3c44cc7c8985cf796f6690f517109bff56418f41626e77471e294a492`.

Guest-only test CA and hosts mapping verified; HTTPS login 200, real synthetic ADMIN session
accepted by /setup, PC enrolled through the actual UI. Bootstrap was authorized and key submitted
only in the local Relay popup; save completion is unverified. Guest UI and SSH then stopped
responding; VirtualBox recorded missing heartbeat. No product root cause established. Supported
activation/lifecycle, repair/uninstall and cleanup remain OPEN/BLOCKED, not a release approval.

11:28 ICT follow-up: the exact synthetic auth session was revoked (1 deleted, 0 remaining).
The stalled activation VM was preserved as snapshot `61f164f4-c2fb-40de-a489-a62c844d6bd3`.
After clean restore, guest CA/hosts/private-directory absence was verified. Restore reverted RAM
to 6 GiB; the new blank boot was stopped and configured back to 4 GiB before further work.
The 11-file repair bundle verification eventually returned PASS after a long unresponsive interval;
the original command chain subsequently acknowledged starting the one-shot repair task. An earlier
ACPI normal-shutdown request then completed; final VM state is poweroff. Repair's final receipt was
not collected, so repair/uninstall remain OPEN; inspect existing task/output before any retry.

Read-only host diagnosis confirms VirtualBox 7.2.16 NEM fallback, low host RAM headroom and
near-saturated, nearly full D: storage. No OOM or single cause of delay is proven. Environment
stability blocks acceptance; do not disable host security or infer a product defect from this run.
Owned pilot Next/HTTPS/PostgreSQL services were stopped at 04:30:20Z; all three loopback ports
read back closed. Operational PostgreSQL 5432 was untouched. Private fixture data remains retained;
do not reuse the revoked auth session or treat retained snapshots as current activation evidence.

## Current NVMe Checkpoint

8 September historical receipt read-back: the NVMe clone passed the bounded stability r2 and
copy/hash I/O windows. This is not current sustained stability: the later 06:29Z clock preflight
is FAIL. Recorded baseline: `dde2d98e-72d7-466e-8339-fb6b9c552752` on clone
`13b74869-d2e9-4df6-a043-d8c6b079db04`, from source snapshot
`326357d7-35b1-4c91-92ca-856fb0f35e9b`. See the
[stabilization addendum](./phase-04a-vm-stabilization.md) for environment receipts, historical
clock FAIL and bounded measurement limits. The generator's provenance is declared metadata;
baseline verification comes from the executing agent, not the generated descriptor alone.

The three installer gates now have fresh NVMe results. All bound receipts report PASS,
child exit 0 and `releaseReady: false`; raw evidence hashes and sidecars match on read-back.
All 11 bundle-file hashes match descriptor SHA-256
`b2a71ab9b5d61560abbbc03dcf089aa07854ae128d1eaa97101715bb1563f4b9`.
Prior original-VM and wrapper failures remain historical failures, not retroactive passes.

Evidence root: `local-test-artifacts/local-release-20260908/vm-gate-nvme/` (local-only).

| Bound receipt | Raw checks | Completed UTC | Receipt SHA-256 |
|---------------|------------|---------------|----------------|
| `repair-bound-evidence.json` | PASS 13/13 | 05:19:07Z | `b587051ef78f7da203e07a65d4d8ff3e194f24b713f0d14372ec8705de0f4e1a` |
| `uninstall-bound-evidence.json` | PASS 15/15 | 05:24:12Z | `e764c21dc1beae86cb0d4d7f721cd4558394fe898bf0aa233330b848419d01aa` |
| `clean-bound-evidence.json` | PASS 9/9 | 05:29:48Z | `6dbb98b8565cb36e9b27e6cb48e2b69ea29f9dfc741a02f94045d8a953dbd3b0` |

All three bind the unchanged Browser source `eacd1cc23b1a68537dee076e3899d4bf5c89dc5c` and
Tool source `b4ef969b5cac9473da77ef3db1bbb941b46cdd9c`, plus this exact candidate tuple:

| Candidate component | SHA-256 |
|---------------------|---------|
| Installer | `255c1a1c0128dabc4ef1fc3c51a864cc2dd2c790b98fb9af2ff462f885e06347` |
| Browser `app.asar` | `0f1fca7db867ad3a5057ea9e7b36dcb2c54a7f7dff1a54cb741a60d709e9fcd3` |
| Packaged Relay archive | `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` |
| Control contract | `b3d0b07981958b5f972da83f32f50475c8d95ccca005ce72525d0714a275dcaa` |
| CFT archive | `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004` |
| Signed candidate manifest | `bb65c942320ed214b9c837c9b2c6414983f3abc8914b6906acdf4f29a7891554` |

Repair restored owned files, shortcuts and registry metadata while preserving operator and Relay
state. Uninstall removed owned payload, shortcuts, registry, firewall rules and processes while
preserving unrelated/operator data. Clean install verified the supported combined installed state,
local control port, self-provisioned token/store, no developer Node and Defender enabled. These
gates do not exercise supported CFT activation or browser-page IP/DNS/WebRTC. The installer still
reports Authenticode `NotSigned`; signed candidate metadata does not change that result.

## Earlier Activation Checkpoint - Still OPEN

Later executing-agent observations establish that the fresh NVMe guest is not globally frozen.
Original host-forwarded SSH 2222 encounters a banner timeout, but guest-loopback SSH, Edge 9333
and the runtime-only diagnostic NAT forward 2223 respond. Guest display-off settings were saved
then changed from AC 300 / DC 180 seconds to zero; no host power change. See the
[stabilization addendum](./phase-04a-vm-stabilization.md) for scope and pending diagnostic cleanup.
No NEM, storage or RAM root cause is proven by these observations.

The owner accepted the guest-only test CA; the Web `/setup` page is authenticated. Fresh enrollment
count remains zero. Permission queries return `prompt` for `local-network-access`,
`loopback-network` and `local-network`. The actual `Allow local access and retry` button was clicked,
but `Needs repair` persists; user Allow remains pending. Do not call CA/authentication success
enrollment or treat a clicked retry as a granted browser permission.

Native first-run observation: `Continue` then `Create profile` used the default `My first profile`
because the attempted test-name entry did not take. The UI showed `Setup failed`:

> This MKT Browser build has no verified compatibility-set engine pin. Run installer repair instead
> of resolving an upstream latest version.

The exact guard message exists in frozen Browser `apps/desktop/src/main/ChromiumBootstrap.ts:507`.
This was before supported signed provisioning; no retry was performed at that observation. Record
first-run as OPEN with an observed initial failure, not PASS or a final signed-activation verdict.

Relay launcher r1 has a retained FAIL receipt (`PROCESS_IDENTITY_UNCERTAIN`), completed
05:59:41Z. `stoppedPid`, new `pid` and creation time are null; owned listener is not verified;
bootstrap is OPEN and `releaseReady` is false. These null fields do not prove the Relay was stopped.
Receipt `local-test-artifacts/local-release-20260908/pilot-nvme/relay-nvme-test-ca-launch.json`
SHA-256: `c94a2f93ecc3e07da55b5e70f674aa983eb792243c3a69097e4fdb923bdd0c26`.
It binds the same clone, baseline, installer and clean-gate receipt recorded above.

R2 separates an identity-checked elevated stop from a limited-token start that requires the exact
successful stop receipt. The executing agent reports review/static tests PASS 8/8 in
`local-test-artifacts/local-release-20260908/pilot-nvme/relay-ca-r2.test.cjs`; those source assertions
do not execute the guest stages. Live read-back at 06:24:22Z: stop task Ready, result 267014
(`0x41306`), no stdout/stderr, STARTED attempt or terminal receipt. Old Relay PID 928, creation
05:29:39.3150970Z, remains untouched. Stop completion and limited-token restart are not verified.
The task has a PT2M setting, but its cause of termination is unproven; do not infer causation.

Independent startup-only task `mkt-nvme-powershell-startup-probe-20260908`, using absolute
PowerShell with `-NoProfile -NonInteractive`, Highest/Interactive and a 30-second limit, likewise
reads Ready/result 267014 with no receipt. It is diagnostic evidence, not a product stop/start PASS.
No task rerun or product mutation is reported by this checkpoint.

06:29Z preflight remains FAIL: host UTC `06:29:05.0185585Z` through `06:29:13.5864710Z`, guest UTC
`06:28:38.3783479Z`; lag 26.64-35.21 seconds exceeds the 5-second signed-ticket gate. Host free RAM
2.83 GiB, guest free RAM 691,232 KiB, C: free 17.84 GiB, original VM off. Signed activation is paused
while clock and task dispatch remain unresolved. The earlier bounded stability r2 PASS is retained
as historical evidence only; no sustained current environment PASS or NEM/storage/RAM cause is proven.

The unchanged installer tuple and clean/repair/uninstall results remain valid at their measured
scope. Managed create/launch, supported Browser close, bad-proxy recovery and final fixture cleanup
remain OPEN. Page-network, unfamiliar-operator, physical second-PC and seven elapsed canary days
remain separate OPEN gates. Cleanup is explicitly OPEN because VM/fixture are retained for
continuation; guest CA, hosts mapping, runtime NAT 2223 and display changes remain present.
No readiness, public availability or operator-promotion claim follows.

## Current Continuation - Transport PASS, Activation OPEN

At 10:36Z the user allowed Apps on device; actual Edge queries for all three local-network
permission names returned `granted`, with Local network and Apps on device screenshots both Allow.
An actual Web-page health fetch returned Relay HTTP 400 with `ok: false`, `configured: false`,
v16 and no device. This closes the observed Web-to-Relay transport blocker only. The UI now shows
`Confirm this PC`; no confirmation has been clicked, so enrollment and activation remain OPEN.

Guest Windows Update restarts at 07:20Z and 07:26Z are evidenced by event 1074. Relay now runs as
PID 4664 with unchanged EXE SHA-256
`300646e1ea35aa47ece1b0d608d9b9681ee5bde82dd084bcdc5145345d07b60e`; Edge PID 6760 serves 9333,
reached through diagnostic tunnel 19333/session 74820. PID 928 is obsolete. Old r2 stop and startup
probe remain Ready/267014 with no receipts: never rerun an identity-pinned helper against the new
process. No runtime stop/start PASS follows from the automatic guest restart.

Clock still FAIL: a 10:37Z probe measured 7.657-11.978 seconds guest UTC lag. Pacific timezone
offset -420 explains the 14-hour displayed-time difference, not this UTC drift. The guest-only
1-second timesync-interval experiment was applied/read back and VBoxService restarted, yet the
next probe measured 42.852-47.945 seconds lag. The exact property was removed to restore its prior
absence and VBoxService Running was confirmed. No host clock or security policy was changed.

Local experiment records under `local-test-artifacts/local-release-20260908/` remain historical:
`nvme-clock-interval-r3.json` is STARTED and `nvme-clock-interval-r3-terminal.json` is
APPLIED_UNVERIFIED, not acceptance. Three NTP stripchart samples near +56.54 seconds, resync
reporting no time data, and later event 37 valid-data reporting do not close the clock gate.
See the [stabilization addendum](./phase-04a-vm-stabilization.md) for exact probe timestamps.

Final read-only preflight r3 completed at 10:50:04Z: FAIL (`CLOCK_OR_LATENCY_GATE_FAILED`),
125.587 seconds / three samples. Guest lag bounds progressed from [-667, 3670] ms (PASS) to
[13553, 18023] ms (FAIL) and [27755, 31762] ms (FAIL). SSH responses 4.007-4.471 seconds stayed
below 15 seconds; host free RAM 2.07-2.10 GiB, C: free 15.65 GiB, exact VM 4 GiB / 2 CPUs and
original VM off passed. Approximately 14 seconds/minute loss after initial near-sync is measured,
not a proven NEM/storage/RAM root cause. No signed actions were performed.

Local `nvme-current-preflight-r3-receipt.json` SHA-256 and sidecar verified:
`be08ceaad3d13f7b3b757376ca6ac63e39daa6c72cbfdb04131c2e7c62b0e653`.
The guest interval property is again confirmed absent. Stop further runtime retries; signed
activation now requires an architectural clock/environment decision, not more permission grants.
The installer tuple and three completed installer gates remain unchanged; no rebuild/publication.
Cleanup remains OPEN with VM/fixture, guest CA/hosts, NAT 2223, diagnostic tunnel and display
changes retained for continuation. No enrolled, product-ready or operator-promotion claim.

## Implementation Steps

1. Stop heavy host work, remeasure RAM, restore clean Defender snapshot and install chosen artifact.
   Implementation must already be committed/frozen, two-build compared and candidate metadata
   signed. Test distribution is candidate-only, not operator promotion.
2. Observe normal first run without runtime overrides/cache; verify downloaded CFT hash and version.
3. Exercise signed managed create/launch via packaged Relay HTTP, bad-proxy rejection and recovery.
   Close through the existing operator/Browser path; the product has no signed close ticket or
   Relay close route. Automated close is technical lifecycle evidence, not human acceptance.
4. Observe browser-page IP/DNS/WebRTC containment through an authorized test-only observation path
   without expanding the product MCP capability boundary. Verify repair/uninstall and cleanup.
5. Bind receipts to source/installer/engine/Relay/contract hashes and exact snapshot/commands.
6. Independently review changes, run relevant tests, push focused already-frozen paths, integrate only
   with replacement gates. Sign/publish through existing verified path only at appropriate scope.
7. Sync old/new plans and living documentation; hand off explicit remaining acceptance and owner work.

## Success Criteria

- [ ] Exact candidate clean install, normal activation, repair and uninstall PASS.
- [ ] Packaged Relay HTTP create/launch, supported Browser close and proxy recovery PASS.
- [ ] Page-network containment observed or explicitly OPEN; no probe substitution.
- [ ] Focused reviewed changes delivered and publication state reported honestly.
- [ ] Human/second-PC/seven-day gates recorded independently; no full readiness claim if open.

## Risks and Security

Never print proxy/ticket/token values. Test data remains disposable. No automatic closure of user
apps. Preserve profile/token/Relay data on repair/uninstall. Stop VM normally after final cleanup.
