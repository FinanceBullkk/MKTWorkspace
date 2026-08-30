---
phase: "2a"
logicalPhase: "1B"
title: "Minimal Chromium Build Gate"
status: closed
gateStatus: closed-without-build
priority: P1
effort: "30m preflight; 4-12h unattended build; 30m launch/evidence"
dependencies: [phase-02]
---

# Phase 1B: Minimal Chromium Build Gate (CLI phase 2a)

> **Historical / parked handoff — 30 August 2026.** U6 closed the custom-engine track without a
> build. The blocked 28 August observations and procedure below are retained for audit and a possible
> future reopen; do not reboot, move hosts, invoke `autoninja`, or start measurement for this release.
> Reopening requires a new owner decision and the condition recorded in the parent plan.

## Overview

Produce exactly one isolated upstream Chromium component/debug `chrome` artifact and prove that it
can start with an empty profile and shut down cleanly. This is a hard artifact gate between the
isolated toolchain and the baseline harness. It never changes MKTBrowser, installs an engine, or
distributes a binary.

**Historical verdict (2026-08-28 16:20 +07:00; superseded by the 30 August closure): BLOCKED.** The one permitted reboot/minimal-shell
check completed, but physical RAM was only 1.85 GiB available on a 15.92 GiB host and active
VirtualBox/WSL state was detected. D: still had 234.99 GiB free. No build, browser launch, or
baseline run was started. The former instruction to move the gate to another host is reopen-only;
no host move is scheduled under the closed track.

## Context Links

- Plan: [plan.md](./plan.md)
- Setup handoff: [isolated source and toolchain](./handoffs/phase-01-isolated-source-and-toolchain.md)
- Setup evidence: [phase 1 evidence](./reports/phase-1-isolated-source-toolchain-evidence.md)
- Historical preflight evidence: [Phase 1B evidence](./reports/phase-1b-minimal-chromium-build-gate-evidence.md)
- Next-session handoff: [Phase 1B handoff](./handoffs/phase-01b-minimal-chromium-build-gate.md)
- Execution helper: [reboot preflight script](./scripts/phase-1b-reboot-preflight.ps1)
- Baseline successor: [baseline measurement harness](./phase-03-baseline-measurement-harness.md)
- Chromium Windows build guide: https://chromium.googlesource.com/chromium/src/+/main/docs/windows_build_instructions.md

## Historical entry gates (all mandatory if reopened)

| Gate | Required at the immediate preflight | Current observation | Status |
|---|---|---|---|
| Available physical RAM | Strictly `>12 GiB`; do not count pagefile/commit limit | 1.85 GiB post-reboot (15.92 GiB total) | **FAIL/BLOCKED** |
| D: free space | `>=200 GiB` before the build; retain `>=20 GiB` after | 234.99 GiB post-reboot | PASS (snapshot) |
| VM/WSL | `0` running VM/WSL instances; no concurrent build | Helper observed 1 VirtualBox entry, 3 WSL entries, and 10 VM-related processes | **FAIL/BLOCKED** |
| Toolchain replay | Phase 1 manifest and `2/2` clean-shell replay unchanged | Recorded in Phase 1 handoff | PASS (inherited) |
| Isolation | Engine source/output outside `E:\MKTWorkspace\MKTBrowser` | `D:\mkt-browser-engine\src` | PASS (inherited) |

Any failed or unverified entry gate stops this phase before `autoninja` and keeps the verdict
`BLOCKED`; it is never converted to a partial pass by using a pagefile, VM, or lower disk floor.

## Historical reboot decision procedure (only if explicitly reopened)

The procedure was performed at most once on the historical host and failed closed; the timestamped
result is recorded in
[phase-1b-post-reboot-evidence-20260828.md](./reports/phase-1b-post-reboot-evidence-20260828.md).
Do not repeat it on this host.

The execution helper writes a sanitized JSON snapshot outside the MKTBrowser checkout.
Run powershell.exe -NoProfile -ExecutionPolicy Bypass -File
.\scripts\phase-1b-reboot-preflight.ps1 -Mode Prepare before reboot, then run it with
-Mode PostReboot -DelaySeconds 30 after login. It performs measurement only; it never invokes a
compiler or baseline harness.

The one-time reboot procedure below has now been executed and failed closed. The numbered steps are
retained as a historical runbook for a future explicitly approved build host; they are not current
release actions.

1. Save the pre-reboot evidence and close Steam, VS Code, Chrome, terminals, VM clients, and other
   non-essential applications. Do not delete caches, compact VM disks, or change the pagefile.
2. Reboot Windows once. After login, open only a minimal terminal; do not start Steam, VS Code,
   Chrome, VirtualBox, WSL, or any other workload.
3. Measure available **physical** RAM, D: free space, and active VM/WSL state immediately before
   any compiler command. Record both the measurement method and timestamp.
4. If RAM is `>12 GiB`, D: is `>=200 GiB`, and active VM/WSL count is zero, continue to the build.
5. If RAM is `<=12 GiB` (or another entry gate is not proven), stop. Mark this phase `BLOCKED` and
   hand off to a Windows build host with at least 32 GiB installed RAM. Do not retry by relying on
   pagefile headroom or by lowering the gate.

## Requirements

### Functional

- Use the pinned upstream Chromium checkout at `D:\mkt-browser-engine\src` and the existing
  component/debug GN output `out\Experimental`.
- Preserve the existing component/debug GN intent (`is_component_build=true`, `is_debug=true`,
  symbol levels `0`) and record the effective args hash before the build; do not switch to a release
  or test configuration.
- Run exactly one target: `chrome`. One serial `autoninja` invocation is allowed; no second engine
  build, parallel build, Brave build, release target, installer, or MKTBrowser build is allowed.
- Capture exit code, monotonic start/end and wall time, peak host RAM usage, peak build-process
  working set, D: free bytes before/after, byte delta, output path, file size, and SHA-256 of
  `out\Experimental\chrome.exe`.
- Launch the resulting binary once with a newly created empty profile directory under the isolated
  engine root. Verify readiness, request a graceful shutdown, and prove that the owned process tree
  is gone. Do not use accounts, cookies, production proxies, or MKTBrowser profile data.
- Record the exact SDK pin: package `10.0.28000.2526`, selected directory `10.0.28000.0`, and the
  Chromium source comment pin `10.0.28000.2270`. The patch difference remains visible in evidence.
  GN already accepted the selected directory, so this mismatch does not block a local build; it is
  an open reproducibility/distribution review item.

### Non-functional

- Keep all source, output, logs, temporary profile data, and hashes outside the MKTBrowser checkout.
- Preserve the existing MKTBrowser tracked-index hash and pre-existing dirty-file set before and
  after the gate; expected changed MKTBrowser source files: `0`.
- Keep the artifact local to `D:\mkt-browser-engine`; distributed/copied binaries: `0`.
- Use sanitized evidence only. Never persist seeds, credentials, tokens, proxy values, IP addresses,
  page content, or raw crash/vendor responses.
- A non-zero build exit, missing binary/hash, failed launch, dirty shutdown, or postflight mismatch is
  `FAIL`; an entry-gate failure is `BLOCKED`. Neither unlocks the baseline harness.

## Architecture

```text
minimal post-boot preflight
  -> RAM/D:/VM/WSL gate
  -> one serial autoninja -C out\Experimental chrome
  -> build metrics + chrome.exe SHA-256
  -> empty-profile launch
  -> graceful shutdown + zero owned processes
  -> postflight disk/MKTBrowser/isolation comparison
  -> sanitized evidence + handoff
```

The artifact is an experiment output, not a runtime dependency. No file crosses into
`E:\MKTWorkspace\MKTBrowser`, MKTTool, Relay, MCP, or any installer tree.

## Related Code Files

- **Create (engine tree only):** build wrapper/log, metrics JSON, empty-profile fixture, and SHA-256
  record under `D:\mkt-browser-engine\`.
- **Modify:** none in `E:\MKTWorkspace\MKTBrowser`, `E:\MKTWorkspace\MKTTool`, Relay, or MCP.
- **Do not modify:** `windows-engine-release.json`, `ChromiumBootstrap.ts`, driver, profile storage,
  or any installed engine path.

## Historical implementation procedure (only if explicitly reopened)

1. Snapshot the MKTBrowser tracked index, dirty paths, D: free bytes, physical RAM, VM/WSL state,
   source/toolchain revisions, and SDK values. Store only sanitized metadata.
2. Execute the one-time reboot decision procedure. If any entry gate fails, write the blocked report
   and stop before invoking a compiler.
3. Start a sampler before the build. Poll host available physical RAM and the build process tree once
   per second (or record the exact interval if the host requires another cadence); retain peak values,
   process-tree coverage, and any sampling gaps in the report.
4. Invoke the pinned environment once with the component/debug target only:
   `autoninja -C D:\mkt-browser-engine\src\out\Experimental chrome`.
   Record command shape and environment pins without logging secrets.
5. Capture exit code, elapsed time, peak metrics, D: before/after/delta, and output existence. On
   success, compute SHA-256 and file size for `chrome.exe`; on failure, retain the first diagnostic
   and do not rerun speculatively.
6. Launch `chrome.exe` with a fresh empty `--user-data-dir` in the experiment root and bounded
   first-run flags (`--no-first-run --no-default-browser-check --disable-background-networking`),
   wait at most 60 seconds for readiness, then use a graceful browser shutdown. Verify no owned
   Chromium process remains and remove only the disposable fixture.
7. Re-measure D:, RAM, VM/WSL, and the MKTBrowser tracked index/dirty set. Confirm no binary was
   copied or distributed and write the evidence report plus this phase handoff.
8. Set the verdict mechanically: only all criteria PASS unlock Phase 3. Otherwise keep Phase 3
   `NOT-RUN` and hand off the blocker or failure.

## Success Criteria

- [ ] Immediate preflight proves physical RAM `>12 GiB`, D: free `>=200 GiB`, and `0` active VM/WSL.
- [ ] Preflight and postflight both prove zero active VM/WSL for the entire build/launch window;
  any inventory gap or guest start invalidates the gate.
- [ ] Exactly one serial `chrome` component/debug build invocation runs; no other target or build
  process starts.
- [ ] Build exit code, start/end timestamps, wall time, minimum available/peak-used host RAM, peak
  build working set, D: free before/after, and byte delta are recorded with sampler cadence and gaps.
- [ ] `D:\mkt-browser-engine\src\out\Experimental\chrome.exe` exists and has a recorded SHA-256
  and byte size; no hash is substituted from another file.
- [ ] One empty-profile launch reaches readiness and exits through a clean shutdown; owned process
  count is zero afterward and the fixture is removed.
- [ ] SDK package/selected directory/source-comment pins are recorded, including the
  `10.0.28000.2526` versus `10.0.28000.2270` difference.
- [ ] MKTBrowser tracked-index hash and pre-existing dirty set are identical pre/post; changed source
  files and copied experimental binaries are both `0`.
- [ ] No installer, publication, release, or distribution action occurs; artifact stays under the
  isolated experiment root.
- [ ] Evidence report and handoff are present, with a mechanical `PASS`, `FAIL`, or `BLOCKED` verdict.
- [ ] Phase 3 remains `NOT-RUN` unless this phase is a documented `PASS`.

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| RAM falls below the threshold during linking | OOM, paging, or corrupted output | Abort/record; move to a >=32 GiB host; never use pagefile as proof |
| D: consumption exceeds the reserve | Incomplete build or damaged checkout | Require >=200 GiB preflight and >=20 GiB postflight; stop on reserve breach |
| VM/WSL starts unexpectedly | Host contention and invalid metrics | Check process/state before and after; fail closed on ambiguity |
| Launcher leaves child processes | False clean result and resource leak | Use graceful shutdown plus process-tree confirmation and bounded cleanup |
| SDK patch drift | Non-reproducible artifact | Record package and selected directory separately; keep source pin mismatch open |
| Artifact escapes the experiment root | Unapproved distribution or contract change | No copy/install/publish step; verify MKTBrowser tree and distribution count |

## Security Considerations

- Use disposable, empty profiles only; no real identity, credentials, cookies, proxy, or production
  data enters the launch.
- Hash binaries and redact command/environment output before writing evidence.
- The application MIT license does not grant engine redistribution rights. License, notice, checksum,
  and approval review remains a separate gate before any binary leaves the experiment root.
- Bot-detection evasion, CAPTCHA/checkpoint bypass, rate-limit bypass, TikTok automation, and related
  legacy material remain out of scope.

## Historical next steps (only if explicitly reopened)

- **If a future reopen is blocked:** record the exact RAM/host result and keep the baseline harness
  `NOT-RUN`; do not infer a pass from another artifact.
- For a future, separately approved Chromium build, prefer a host with at least 32 GiB installed RAM
  and revalidate every entry gate before invoking a compiler.
- **If PASS:** attach the binary hash and clean-shutdown evidence, then start Phase 3 with its planned
  100 launches. Baseline remains forbidden until this report is reviewed as PASS.
- On a verified PASS after an explicit reopen, update `gateStatus` and phase status according to the
  parent plan; this historical file does not authorize a build or a status change now.
- **After any binary leaves the experiment root:** stop and obtain the separate license/notice/checksum
  and approval decision; this phase itself authorizes no distribution.

## Historical unresolved questions (closed for this release)

- The one post-reboot minimal-shell check did not exceed the gate; no current owner question remains.
  Reopening requires a new owner decision and a fresh resource measurement.
- Is SDK package `10.0.28000.2526` accepted as the reproducibility pin against source comment
  `10.0.28000.2270`, or is the exact older package required? This remains a future reproducibility
  review item, not an active release gate.
