# Lifecycle and Installer Repair Evidence - 24 August 2026

## Verdict

- Rollout remains **NO-GO**.
- Normal close passed on the current local directory artifact with one disposable, unmanaged,
  no-proxy profile.
- The attested candidate's receiving-machine hash remains valid, but its supported combined
  Browser + Relay install, repair, and uninstall gate is open.
- Hard kill, Electron crash, Relay restart, host reboot, and pending-recovery reboot did not run.

## Artifact Scope

| Item | Value |
|---|---|
| Attested candidate source/tree | `eac77f8f` / `cce7b897` |
| Attested installer SHA-256 | `d18c8d79fc6a6f77e1783044e2e9fae4ac28f73b152992bee0a0bcbc6a4e3490` |
| Current Browser source/tree | `c802fabb` / `bd87f752` |
| Current local Browser executable SHA-256 | `9c269536b6203f7fda54214813074c8ccb964a637b658225ec0afd928f8bae7b` |
| Current local `app.asar` SHA-256 | `37ba4a0aa551404f77e42184c37c7d6531c01b11279f0c4a564b313c19b20f8c` |
| CloakBrowser executable SHA-256 | `484ab0e66600a3b0a8c4848ccaef38ce65b69e87687a68a3b2b68d5db1f0455e` |

The candidate predates four local Browser fixes. Candidate repair observations cannot qualify a
future rebuild. Current local lifecycle evidence cannot qualify the older candidate.

## Installer Repair

The old clean-install harness stopped waiting when `MKTBrowser.exe` appeared. That occurs before the
mandatory `customInstall` sequence finishes WebRTC firewall setup, pinned Relay installation,
startup shortcut creation, Publisher metadata, and Relay ownership metadata.

Fresh disposable-VM evidence after the attempted silent install:

| Check | Result |
|---|---|
| Candidate hash in guest | PASS |
| Clean snapshot preflight | PASS |
| Browser payload | 129 files copied |
| Relay executable | Absent |
| WebRTC firewall rules | 0 |
| Startup shortcut | Absent |
| Uninstall Publisher | Unset |
| Relay ownership metadata | Unset |
| Installer task | Exit 1; installer process remained at an error dialog |
| Microsoft Defender | `Behavior:Win32/PShellCobStager.A`; remediation succeeded; not disabled or allow-listed |

Result: `REPAIR-ENVIRONMENT-DEFENDER-BLOCK`. Repair did not reach a supported installed baseline.
The earlier 9/9 record is invalid for the combined-install gate. Receive-side hash, clean preflight,
Browser payload/first-run, and Browser-data-preservation observations remain useful component
evidence only.

The disposable clone disk/config was deleted through VirtualBox. The original VM directory on `D:`
remains. Sandbox policy left one 351 KB clone hardening log directory.

## Normal Close

The host control port belonged to an `MKTBrowser` process in the interactive session. The exact
hashed `win-unpacked` executable was readable but locked against exclusive write. Sandbox process
inspection could not prove the PID's image path, so this is strong local binding, not release
provenance.

One disposable profile contained no proxy or account data.

| Stage | Capacity (`free / active / cooling / pending`) | Result |
|---|---|---|
| Baseline after prior key refusal | `1 / 0 / 1 / 0` | No profile running |
| Launch | `0 / 1 / 1 / 0` | PASS in 3.6 s |
| Normal close | `1 / 0 / 1 / 0` | PASS in 0.7 s |

Lifecycle log sequence: `CLOSE-REQUESTED` -> `Browser.close` with `graceful-shutdown` -> child exit
code 0 -> `SHUTDOWN-COMPLETE` with method `Browser.close`. No new cooling or pending-recovery state
appeared during close.

The preceding attempt started at `2 / 0 / 0 / 0`; one unreliable key was refused and entered
cooling while rotation opened the profile on the other key. Closing returned the active seat, but
the refused key correctly remained cooling.

A final sanitized read at `2026-08-24T05:13:04Z` found zero running profiles and capacity
`2 / 0 / 0 / 0`. The earlier cooling seat returned to free naturally; no pending-recovery state
appeared.

## Fresh Verification

| Gate | Result |
|---|---|
| PowerShell parser | PASS: 17 VM/lifecycle harness scripts, 0 parse errors |
| Evidence JSON | PASS: all 7 retained lifecycle/installer JSON files parse |
| Workspace/MKTTool/MKTBrowser `git diff --check` | PASS; line-ending warnings only |
| Node 22 installer/package suite | PASS on Node `22.18.0`; one explicit live-machine integration test skipped by design |
| MKTBrowser typecheck | PASS on Node `22.18.0` |
| MKTBrowser lint | PASS on Node `22.18.0`; workspace quality and 34 JavaScript syntax checks passed |

The managed Windows sandbox makes `os.userInfo()` fail in Node 22 and Node 24 with
`uv_os_get_passwd ... ENOMEM`. `tsx` uses that API only to name its temporary directory. Verification
therefore used a temporary preload that supplied `process.geteuid()` for the test process; the
preload was removed after the gates. No product source or persisted operator state changed.

## Rebuilt Candidate Requirements

1. Replace the installer-spawned PowerShell pattern that Defender currently remediates while
   preserving mandatory fail-closed firewall verification and the pinned Relay contract.
2. Freeze the resulting current source/tree, including the four Browser fixes that postdate the old
   candidate, and produce a new attestation and receive-side SHA-256 record.
3. Run the corrected clean-install and repair harnesses on a supported clean Windows environment
   with Defender enabled and no allow-list. Require installer exit zero and the complete
   Browser/Relay/firewall/shortcut/registry state.
4. Prove combined uninstall ownership and operator-data preservation from that supported baseline.
5. Use only that exact rebuilt artifact for the remaining concurrent, crash, Relay, reboot, and
   canary gates. Evidence from the old candidate or the current directory package cannot substitute.

## Unrun Cases

| Case | Code | Reason |
|---|---|---|
| Browser hard kill | `LIFECYCLE-PROCESS-CONTROL-DENIED` | Terminate access returned Win32 error 5 for all six disposable engine processes |
| Electron crash | `LIFECYCLE-PROCESS-CONTROL-DENIED` | Browser main process also returned Win32 error 5; safe relaunch could not be guaranteed |
| Relay restart | `LIFECYCLE-RELAY-NOT-RUNNING` | No Relay process or listener existed on this host |
| Host reboot | `LIFECYCLE-REBOOT-NOT-AUTHORIZED` | Would disrupt unrelated user processes; no separate exact reboot authorization |
| Reboot during pending recovery | `LIFECYCLE-PENDING-RECOVERY-NOT-INTEGRATED` | Driver journal writes, sidecar forwarding, and startup vendor release are not integrated |

## Evidence Files

- `local-test-artifacts/vm/installer-repair-environment-evidence.json`
- `local-test-artifacts/vm/clean-install-evidence-reconciliation.json`
- `local-test-artifacts/lifecycle/host-normal-close-evidence.json`
- `local-test-artifacts/lifecycle/host-normal-close-log-evidence.json`
- `local-test-artifacts/lifecycle/host-lifecycle-process-control.json`
- `local-test-artifacts/lifecycle/host-unavailable-lifecycle-cases.json`
- `local-test-artifacts/lifecycle/host-final-sanitized-state.json`

## Unresolved Questions

- Can the installer PowerShell behavior be changed to avoid Defender detection without weakening the
  mandatory firewall and Relay contract?
- Which second vendor key will be reliable enough for concurrent isolation and destructive recovery
  rehearsal?
- Where will hard-kill, Electron-crash, Relay-restart, and reboot gates run with owned process-control
  authority and no operational profiles?
