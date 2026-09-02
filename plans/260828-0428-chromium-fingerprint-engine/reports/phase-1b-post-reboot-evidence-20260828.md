---
type: measurement
phase: "2a"
logicalPhase: "1B"
date: 2026-08-28
status: blocked
---

# Phase 1B Post-Reboot Evidence - Minimal Chromium Build Gate

## Verdict

**BLOCKED.** The one permitted reboot check completed, but the host did not meet the resource
gate. The post-login snapshot recorded 1.85 GiB available physical RAM (strictly more than 12 GiB
is required), and active WSL/VirtualBox-related processes were present. No compiler, Chromium
build, browser launch, baseline harness, installer, copy, or distribution action was run.

## Post-Reboot Snapshot

| Check | Result | Gate |
|---|---:|---|
| Measurement timestamp | 2026-08-28T16:20:02+07:00 | recorded |
| Physical RAM total | 15.92 GiB | informational |
| Physical RAM available | 1.85 GiB | **BLOCKED**; required >12 GiB |
| D: free | 234.99 GiB | PASS; required >=200 GiB |
| VirtualBox running VMs | 1 reported by the helper | **BLOCKED** |
| WSL running entries | 3 reported by the helper | **BLOCKED** |
| VM-related process count | 10 | **BLOCKED** |
| Experimental chrome.exe | absent; recursive .exe count 0 | NOT-RUN |
| MKTBrowser tracked-index hash | 01fd23153759e8644c2dc1ee051fbf166c36581fd91b26e91844f59beaecdbe9 | unchanged |
| MKTBrowser dirty paths | 3 pre-existing paths | unchanged |

The helper evidence is retained at
D:\mkt-browser-engine\replays\phase-1b-execution\post-reboot-20260828-162005.json.
The later read-only live check found about 4.37 GiB available RAM after startup settled, still far
below the gate; WSL-related processes remained present. This later value does not replace the
timestamped post-login gate measurement.
The helper's VirtualBox count came from the post-login query; a later direct query returned no
named running VM while the three VBoxHeadless processes remained alive. That ambiguity is itself
not a clean zero-VM proof, so the gate remains blocked rather than being treated as a pass.

## Action Counts

| Action | Count |
|---|---:|
| Reboot attempts | 1 scheduled, graceful |
| Chromium compiler/Ninja invocations | 0 |
| Experimental chrome launches | 0 |
| Baseline harness launches | 0 |
| MKTBrowser source files changed | 0 |
| Binaries copied, installed, uploaded, or distributed | 0 |

## Decision

The reboot retry is exhausted for this host. Keep Phase 1B BLOCKED and move the serial build to a
Windows host with at least 32 GiB installed RAM. Do not lower the RAM gate, count pagefile space,
or run the Phase 3 Baseline Measurement Harness. The SDK patch-pin review remains open but is not
the current blocker.

## Evidence Integrity

This report contains only sanitized host capacity and process-state metadata. No credentials,
tokens, proxy values, IP addresses, profile data, page content, or vendor responses were recorded.

## Unresolved Questions

- Which Windows host with at least 32 GiB installed RAM will own the next serial build?
- Is SDK package 10.0.28000.2526 accepted for reproducibility against source comment 10.0.28000.2270?
