---
type: measurement
phase: "2a"
logicalPhase: "1B"
date: 2026-08-28
status: blocked
---

# Phase 1B Evidence - Minimal Chromium Build Gate

## Summary

**BLOCKED.** The current host snapshot passes the requested D: capacity but fails the strict
physical-RAM admission. The one-time reboot/minimal-shell check has not been run in this session.
No Chromium compiler, Ninja build, browser launch, baseline harness, installer, copy, or
distribution action occurred.

- Gate definition: [Phase 1B build gate](../phase-02a-minimal-chromium-build-gate.md)
- Handoff: [Phase 1B handoff](../handoffs/phase-01b-minimal-chromium-build-gate.md)
- Post-reboot result: [Phase 1B post-reboot evidence](./phase-1b-post-reboot-evidence-20260828.md)

## Measurement Snapshot

Timestamp: `2026-08-28T14:47:55+07:00` (Asia/Saigon)

| Gate | Measured value | Method / status |
|---|---:|---|
| Physical RAM total | 15.92 GiB | `Win32_OperatingSystem.TotalVisibleMemorySize` |
| Physical RAM available | 6.80 GiB | `Win32_OperatingSystem.FreePhysicalMemory`; **FAIL** (`<=12`), about 5.20 GiB short |
| Independent RAM check | 6.79 GiB | Node `os.freemem()`; confirms the failure, about 5.21 GiB short |
| D: free | 235.05 GiB | `System.IO.DriveInfo`; **PASS** (`>=200`) |
| C: free | 58.80 GiB | `System.IO.DriveInfo`; informational |
| E: free | 27.72 GiB | `System.IO.DriveInfo`; workspace volume, not build volume |
| CPU | 12 logical CPUs | Node `os.cpus().length`; informational |
| OS | Windows `10.0.26200` | Node `os.release()` |

The available-RAM value is physical availability, not pagefile/commit headroom. Pagefile capacity,
if present, is deliberately excluded from this gate.

## Follow-up Active-State Check

Timestamp: `2026-08-28T15:07:10+07:00` (Asia/Saigon). This is an append-only follow-up to the
14:47:55 snapshot above; it does not overwrite that evidence.

| Check | Result |
|---|---|
| Physical RAM available | 7.02 GiB (CIM) / 7.01 GiB (Node); still `<=12 GiB`, so the RAM gate remains **BLOCKED** |
| D: free | 235.05 GiB; still `>=200 GiB` |
| VirtualBox | Full-path `VBoxManage list runningvms` exit `0`, empty result |
| WSL | `There are no running distributions.` |
| Build/engine processes | 0 matching compiler, linker, Ninja, Chromium, or VM processes |
| Experimental `.exe` files | 0 recursively; `chrome.exe` absent |

## VM / WSL Check

- No `VirtualBox`, `VirtualBoxVM`, `VBoxSVC`, `VBoxHeadless`, `vboxwebsrv`, VMware, QEMU, WSL,
  `vmmem`, `vmmemWSL`, or `vmwp` process was observed in the process snapshot.
- `wsl.exe --list --running` returned `There are no running distributions.`
- `VBoxManage.exe` is not on PATH, but the installed full path
  `C:\Program Files\Oracle\VirtualBox\VBoxManage.exe` returned exit `0` with an empty
  `list runningvms` result. Three registered VirtualBox VMs were listed as powered off; no guest
  process was observed.
- Hyper-V `Get-VM` is not available; the `vmcompute` service is idle-capable and was not treated as
  proof of a running guest. No Hyper-V guest process was observed, but complete VM inventory remains
  **NOT-VERIFIED** until a supported inventory command is available.
- The top working-set process was `Memory Compression` at 0.688 GiB; no single user process was an
  outlier large enough to establish a reliable `>12 GiB` margin. Steam/VS Code processes were still
  present, so this is not the clean post-reboot measurement requested by the gate.

## Gate Matrix

| Criterion | Required | Result |
|---|---|---|
| RAM preflight | `>12 GiB` physical available | **BLOCKED**: 6.79-6.80 GiB initial; 7.01-7.02 GiB latest |
| D: preflight | `>=200 GiB` free | PASS: 235.05 GiB |
| VM/WSL | zero active instances | PASS for VirtualBox/WSL active-state checks; Hyper-V inventory command unavailable, with no guest process observed |
| Source/toolchain | Phase 1 manifest + two replay hashes unchanged | PASS inherited; no source edits |
| Build invocation | exactly one serial component/debug `chrome` build | NOT-RUN |
| Artifact hash | `out\Experimental\chrome.exe` SHA-256 | NOT-RUN; file absent |
| Empty-profile launch | start and clean shutdown | NOT-RUN |
| MKTBrowser changes | zero source/binary changes | PASS for this evidence-only session |
| Distribution | zero copied/published binaries | PASS; no action occurred |

## Action Counts

| Action | Count |
|---|---:|
| Chromium compiler/Ninja invocations | `0` |
| Experimental `chrome` launches | `0` |
| Baseline harness launches | `0` |
| MKTBrowser source files changed | `0` |
| Binaries copied, installed, uploaded, or distributed | `0` |

## Reboot Decision

The one reboot trial is now **COMPLETE / BLOCKED**. The post-login helper ran at
2026-08-28T16:20:02+07:00 and recorded 1.85 GiB available physical RAM, one running VirtualBox
entry, three WSL entries, and ten VM-related processes. The RAM and isolation gates therefore
failed closed. See the dated [post-reboot evidence](./phase-1b-post-reboot-evidence-20260828.md);
do not retry this host or start the baseline harness.

### Execution attempt (pre-reboot preparation)

At 2026-08-28T16:05:05+07:00, the resumable helper
scripts/phase-1b-reboot-preflight.ps1 -Mode Prepare wrote
D:\mkt-browser-engine\replays\phase-1b-execution\pre-reboot-20260828-160506.json.
It measured 7.00 GiB available physical RAM, 235.05 GiB free on D:, and no running
VirtualBox VM or WSL distribution. The snapshot also detected open Steam/VS Code and a
VBoxSVC service process, so it is a preparation record only; no reboot or compiler command
was started. The post-reboot helper must be run once from a minimal terminal before any build.

At 2026-08-28T16:07:59+07:00, a non-forced Windows restart was scheduled for 180 seconds later.
The one-time post-login helper was registered for the current user and the schedule marker is at
D:\mkt-browser-engine\replays\phase-1b-execution\reboot-scheduled.json. The restart is
graceful (no force-close); unsaved application work remains the operator's responsibility.

## Artifact / Isolation Check

- Expected artifact path `D:\mkt-browser-engine\src\out\Experimental\chrome.exe`: absent at the
  evidence timestamp.
- Experimental output directory contained zero `.exe` files at the check; GN configuration exists,
  but no compiler output was produced.
- No `siso`, `ninja`, compiler/linker, Chromium, or experimental engine process was observed at the check.
- MKTBrowser checkout remains outside the engine root. Its current tracked-index SHA-256 is
  `01fd23153759e8644c2dc1ee051fbf166c36581fd91b26e91844f59beaecdbe9`, matching the Phase 1
  pre/post value. The same three pre-existing dirty paths remain and were not touched:
  `apps/desktop/src/main/ChromiumBrowserDriver.ts`, `packages/mcp-server/src/server.ts`, and
  `packages/types/src/index.ts`.
- No MKTBrowser file was modified or copied by this session.
- No installer, release archive, upload, publication, or external handoff was created.

## SDK Pin Record

The planned build must record all three values, without silently normalizing them:

- Windows SDK package: `10.0.28000.2526`
- Selected SDK directory: `10.0.28000.0`
- Chromium source comment pin: `10.0.28000.2270`

The newer patch is accepted by GN in the existing setup evidence, so it does not block a local
build. It remains an explicit reproducibility review item before any distribution or release claim.

## Verdict

`BLOCKED` - an entry gate fails and the compiler was not invoked. Phase 3 Baseline Measurement
Harness is `NOT-RUN` and remains locked until a later Phase 1B report records `PASS` for every
criterion, including binary hash and clean empty-profile shutdown.

## Evidence Integrity

This report contains no credentials, tokens, proxy values, IP addresses, profile data, page content,
or raw vendor responses. It is a host-capacity record only. Build metrics, artifact hash, and launch
metrics must be appended in a new dated report after a passing preflight; do not overwrite this
blocked snapshot.

## Unresolved Questions

- Will the one post-reboot minimal-shell measurement exceed 12 GiB physical available RAM?
- If not, which Windows build host with at least 32 GiB installed RAM will own the serial build?
- Is SDK package `10.0.28000.2526` the approved reproducibility pin against source comment
  `10.0.28000.2270`?
