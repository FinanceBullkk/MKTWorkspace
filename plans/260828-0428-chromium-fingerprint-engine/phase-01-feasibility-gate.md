---
phase: 1
logicalPhase: 0
title: "Feasibility Gate (Phase 0)"
status: complete
priority: P1
effort: "1h measurement; continuation decision recorded"
dependencies: []
---

# Phase 0: Feasibility Gate

## Phase 1B Amendment (2026-08-28)

The measurements below remain the original Phase 0 snapshot. Later host checks measured D: at
235.05 GiB free but only 6.79-7.02 GiB available physical RAM, so the new Phase 1B build gate
remains blocked until the one-time reboot/minimal-shell check or a 32 GiB+ Windows build host.
Compilation and the 100-launch baseline are intentionally not part of this phase.

## Context Links

- Plan: [plan.md](./plan.md)
- Product boundary: `MKTBrowser/README.md:3-10,88-107,109-123,137-139,217-225,245-254`
- Existing acceptance baseline: `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md:7-28,40-67,104-135,628-636`
- Existing engine evidence: [fingerprint-isolation-preview-151-0-7922-108-3-20260828.md](../260821-1925-antidetect-browser-proxy-p0/reports/fingerprint-isolation-preview-151-0-7922-108-3-20260828.md)
- Strategy research: [vendor-independent fingerprint isolation](../reports/research-260828-0153-vendor-independent-fingerprint-isolation.md)

## Overview

Read-only feasibility audit for an experimental, MKT-owned Chromium-compatible engine. It answers
where a build could run, how much capacity it needs, and what wall-time risk this host carries. It
does not fetch source, install a toolchain, launch an engine, or modify MKT Browser.

**Original gate result:** measurement complete; `BLOCKED` pending owner choice. At that
measurement point D: was only `CONDITIONAL` for a minimal pilot and not sufficient for a
full/release build plus VM headroom. The continuation decision below resolves the owner-choice
part; it does not relax the resource guards.

## Continuation Decision (2026-08-28)

The owner later instructed Codex to decide and continue under the workspace rules. The recorded
choice is the conditional D: pilot, upstream Chromium as the first candidate, and strict
no-build/no-distribution gates when measured resources fail. No Brave checkout or MKT Browser
integration is inherited by this decision.

## Key Insights

### Host measurement (2026-08-28 04:40 +07:00)

| Item | Measured value | Consequence |
|---|---:|---|
| OS | Windows 11 Home x64, build 26200 | Meets Windows 10+ baseline |
| CPU | AMD Ryzen 5 5600, 6 cores / 12 threads | Below Chromium's 20+ core performance guidance |
| RAM | 16,698,004 KiB total (~15.92 GiB); 1,872,676 KiB free (~1.79 GiB) while `mkt-ci-windows` runs | Meets 8 GiB floor, below the >16 GiB recommendation; VM must be stopped before compile |
| E: (workspace, NVMe) | 29,769,564,160 bytes free (~27.73 GiB) | **Reject** for Chromium checkout/build; below the 100 GB NTFS floor |
| D: (1 TB SATA SSD) | 174,204,719,104 bytes free (~162.24 GiB) | **Conditional** for minimal no-history/component pilot only |
| C: (NVMe) | 56,200,683,520 bytes free (~52.35 GiB) | Not enough for a full engine checkout/build |
| VM state | `mkt-ci-windows` running, 4 vCPU/6144 MiB, dynamic 80 GiB VDI on D; other gate VMs powered off | Do not compile concurrently; dynamic VDI growth consumes D headroom |
| Toolchain | `depot_tools/gclient`, `gn`, `ninja`, `cl`, `vswhere` not on PATH; VS/SDK directories not found | Toolchain setup is a separate gate; no implicit readiness |

### Capacity model (engineering estimate, not a Chromium guarantee)

| Component | Minimal pilot estimate |
|---|---:|
| Chromium source + dependencies (`--no-history`) | 35–50 GiB |
| One component/debug `out` directory | 50–80 GiB |
| Visual Studio/SDK/temp/pagefile growth | 15–25 GiB |
| Required free safety margin after the run | 20–30 GiB |
| **Total without a shared Git cache** | **120–185 GiB** |
| Shared `--git-cache` (optional) | +~30 GiB |

The current D: value can fit only the low end of a minimal pilot and leaves no reliable margin for
VM growth. A full/release/test checkout should be admitted only with **at least 200–220 GiB free**
on the selected volume, while preserving at least 20 GiB at peak. Do not delete or compact existing
VMs as part of this phase.

### Wall-time estimate on this host

- Toolchain installation and verification: **1–3 hours**, network/package dependent (estimate).
- `fetch --no-history`: **1–4 hours** likely; Chromium documents more than one hour on a fast link
  and many hours on slower ones.
- First minimal `autoninja -C out\Default chrome`: **4–12 hours** estimated, low confidence; paging,
  Defender, SATA throughput, or link steps can exceed this or OOM.
- Full/release/test targets: **8–24+ hours or fail to complete** on 6C/12T and 16 GiB (very low
  confidence; no upstream wall-time promise).
- Incremental rebuild: **5–60 minutes** is a hypothesis only; measure from Siso/Ninja summaries.

### Proposed location (not created in Phase 0)

Use a short, space-free host path such as `D:\mkt-browser-engine\` **only after approval**. Keep
source, `out`, and any cache on D:; do not build in the disposable VM. If the owner requires a
full/release build, provide another volume or free at least 40–60 GiB first. Under the stated
`workspace-write` sandbox, D: is outside the writable root, so a future build session must explicitly
open `D:\mkt-browser-engine\` (or an approved equivalent) as a writable root. The current session's
read-only audit does not need that permission; a junction under E: is not treated as a substitute.

## Requirements

### Functional

- Record host, volume, VM, toolchain, and timestamp facts without secrets.
- Classify each candidate location as `REJECT`, `CONDITIONAL`, or `READY`; never infer readiness from
  the official 100 GB minimum alone.
- Stop before any checkout, build, engine launch, binary distribution, or MKT Browser integration.
- Record the continuation decision before Phase 1 and preserve the hard resource gates.

### Non-functional

- Preserve the current MKTBrowser checkout and all dirty files.
- Keep Chromium compilation strictly single-job at the engine level; documentation may be parallel.
- Preserve the acceptance-matrix evidence vocabulary: `FAIL`, `OPEN`, `BLOCKED`, `NOT-RUN`, and
  `INVALID` are not passes.

## Architecture

```text
read-only host probe
  -> resource budget + confidence-labelled time estimate
  -> owner decision (minimal pilot / more disk / defer)
  -> [future] isolated D: engine worktree
  -> [future] sequential source fetch and build
```

No data path enters `MKTBrowser`, MKTTool, Relay, MCP, profile storage, or the installed engine pin.

## Related Code Files

- **Modify:** none.
- **Create:** this plan's evidence and handoff files only.
- **Must remain untouched:** `MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts`,
  `MKTBrowser/packages/mcp-server/src/server.ts`, `MKTBrowser/packages/types/src/index.ts`,
  MKTTool adapter/Relay files, and `MKTBrowser/apps/desktop/windows-engine-release.json`.

## Implementation Steps

These steps describe the completed historical feasibility audit; the continuation work is recorded
in the Phase 1 handoff.

1. Capture OS/CPU/RAM, volume free space, disk type, and filesystem using read-only probes.
2. Inspect VirtualBox registration and running state; record VDI locations and allocations without
   changing VM state.
3. Check for existing Chromium/depot_tools/Visual Studio/SDK tools; record `NOT_FOUND` explicitly.
4. Compare measured values with current Chromium/Brave maintainer requirements and model peak usage.
5. Write the decision gate and stop. Do not run `git clone`, `fetch`, `gclient`, `gn`, `autoninja`,
   installer, or engine launch.

## Success Criteria

- [x] Timestamped host inventory records CPU, RAM, E:/D:/C: bytes, filesystem, disk type, and VM
  state with zero credentials, proxy values, license keys, or profile data.
- [x] E: is explicitly rejected (`27.73 GiB < 100 GiB`); D: is explicitly conditional
  (`162.24 GiB`); full/release admission threshold is recorded as `200–220 GiB` free.
- [x] Required pilot guard is numeric: at least `150 GiB` free before fetch and at least `20 GiB`
  free after the pilot; available host RAM must exceed `12 GiB` and no VM may be running at compile.
- [x] Toolchain readiness was not claimed at the Phase 0 timestamp: `gclient`, GN, Ninja, MSVC,
  and VS discovery were all recorded absent then.
- [x] Fetch/build/launch count is **0** in this phase.
- [x] Conditional D: pilot and upstream Chromium are recorded as the continuation choice; hard
  compile and distribution gates remain enforced.

## Gate Verdict

**COMPLETE — continuation decision recorded.** The measurements support only a **conditional
minimal pilot on D:\mkt-browser-engine\** with a 20 GiB reserve. A later phase must still stop
before compilation when available host RAM is at or below 12 GiB.

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Dynamic VM disks grow during checkout/build | D: exhaustion and corrupted/incomplete fetch | Power off VMs; record free space before/after each gate; keep 20 GiB reserve |
| 16 GiB RAM with 6C/12T | Paging, OOM, multi-hour links | Run host-only, use one component/debug target, cap parallelism, capture build summary |
| SATA D: slower than workspace NVMe | Wall time exceeds estimate | Treat estimates as low confidence; use Siso/Ninja timing, consider another SSD |
| Missing VS/SDK/depot_tools | Phase 1 cannot start | Install and verify exact pinned versions in a separate session |
| Sandbox denies D: | Fetch/build cannot be authorized by path | Open only the selected D: subtree as a writable root before the build session |
| Engine license or notices unclear | Distribution prohibited | Keep all binaries non-production; run license/checksum/approval gate before any distribution |

## Security Considerations

- No secret-bearing files, VM credentials, engine archives, or profile data were read or copied.
- The proprietary CloakBrowser pin is not changed. The application MIT license is not treated as an
  engine redistribution license.
- BrowserScan/CreepJS appear only as future measurement instruments, never as evasion targets.

## Next Steps

- Open a fresh session, read the Phase 0 handoff addendum, then use the isolated-source handoff and
  [Phase 1B — Minimal Chromium Build Gate](./phase-02a-minimal-chromium-build-gate.md); do not touch
  the current MKTBrowser branch.

## Unresolved Questions

- Is the newer 10.0.28000.2526 SDK patch acceptable for a reproducibility pin against the
  Chromium comment pin 10.0.28000.2270?
