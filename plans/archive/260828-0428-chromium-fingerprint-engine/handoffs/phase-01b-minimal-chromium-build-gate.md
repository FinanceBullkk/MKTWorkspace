---
phase: "2a"
logicalPhase: "1B"
date: 2026-08-28
status: blocked
---

# Phase 1B Handoff - Minimal Chromium Build Gate

> **Historical / parked handoff — 30 August 2026.** U6 closed the custom-engine track without a
> build. This 28 August `BLOCKED` result is retained as evidence only; no reboot, host move, or build
> is scheduled for the current release. Reopen only through a new owner decision and the condition in
> the parent engine plan.

## Starting Contract

- Phase 1 (isolated source/toolchain) is setup-complete; its prior low-RAM observation is carried
  forward as the compile blocker, not treated as a build result.
- The only permitted artifact is one upstream Chromium component/debug target, `chrome`, in
  `D:\mkt-browser-engine\src\out\Experimental`.
- MKTBrowser, MKTTool, Relay, MCP, installed engine paths, and distribution channels are out of scope.
- Baseline Measurement Harness (Phase 3) cannot start until this handoff is replaced by a complete
  `PASS` evidence report.

## Historical state (2026-08-28)

The observations below span an earlier preflight snapshot and the later one-time post-reboot check;
the dated post-reboot outcome in the next section is the closure evidence. They are not two current
machine states.

- Verdict: **BLOCKED**; the one permitted reboot check recorded `1.85 GiB` physical RAM available
  on a `15.92 GiB` host (`>12 GiB` required). The later live reading settled near `4.37 GiB`, still
  below the gate.
- D: free `235.05 GiB` (`>=200 GiB` required) — disk gate passes at this snapshot.
- No active VM/WSL process was observed; WSL reported no running distributions. `VBoxManage.exe`
  was not on PATH, but the installed full path returned exit `0` with an empty `list runningvms`
  result; three registered VirtualBox VMs were powered off.
- Hyper-V `Get-VM` was also unavailable; no guest process was observed, but complete VM inventory
  remains unverified and must be handled fail-closed at the next preflight.
- Steam/VS Code were still open; this is not the requested post-reboot minimal-shell measurement.
- `chrome.exe` does not exist under `out\Experimental`; no compiler/Ninja invocation occurred.
- No compiler, linker, Siso, Ninja, Chromium, or experimental engine process was observed at the preflight.
- MKTBrowser source and tracked dirty files were not touched; no binary was copied or distributed.
- SDK record to preserve: package `10.0.28000.2526`, selected directory `10.0.28000.0`, source
  comment pin `10.0.28000.2270`. GN accepted the selected directory; the patch difference is not a
  local-build blocker, but remains open for reproducibility/distribution review.
- A resumable measurement helper is available at
  `../scripts/phase-1b-reboot-preflight.ps1`. It writes only sanitized JSON under
  `D:\\mkt-browser-engine\\replays\\phase-1b-execution` and does not build anything.

## Historical post-reboot outcome

The one permitted reboot check completed at 2026-08-28T16:20:02+07:00 and remained BLOCKED:
available physical RAM was 1.85 GiB, the helper observed one VirtualBox entry, three WSL entries,
and ten VM-related processes. A later live reading settled near 4.37 GiB; it was still below the
gate. The largest process working sets were VBoxHeadless (about 4.31 GiB) and vmmemWSL (about
1.45 GiB). The dated report is `../reports/phase-1b-post-reboot-evidence-20260828.md`.
Do not retry this host under the closed track. A future explicit reopen may select a Windows build
host with at least 32 GiB installed RAM, but no host move is scheduled for this release.

## Historical required-next-session procedure (only if reopened)

> Do not execute the procedure below unless the parent plan has been explicitly reopened. It is a
> retained runbook, not a current task queue.

1. Read [the Phase 1B build gate](../phase-02a-minimal-chromium-build-gate.md) and this handoff.
2. The historical host's one reboot retry is exhausted and remains BLOCKED. If the track is reopened,
   select a Windows build host with at least 32 GiB installed RAM; do not count pagefile space.
3. On that host, run the helper in Prepare and PostReboot modes, then continue only if RAM is
   strictly `>12 GiB`, D: is `>=200 GiB`, and zero VM/WSL instances are proven.
4. If the gates pass, start one sampler, invoke exactly one serial component/debug build for target
   `chrome`, and record exit code, wall time, peak host/process RAM, D: before/after/delta, binary
   size, and SHA-256.
5. Launch once with a fresh empty profile, shut down gracefully, confirm zero owned browser processes,
   compare MKTBrowser pre/post hashes, and write a new dated evidence report. Keep the artifact local.

## Stop Conditions

- Any preflight failure or missing proof: `BLOCKED`, no compiler command.
- Non-zero build exit, missing/hash-mismatched artifact, failed launch, dirty shutdown, MKTBrowser
  mismatch, or reserve breach: `FAIL`; retain first evidence and do not rerun speculatively.
- Any binary copy, install, upload, release, or distribution attempt: stop and escalate for a separate
  license/notice/checksum/approval gate.

## Evidence

- Historical preflight report: `../reports/phase-1b-minimal-chromium-build-gate-evidence.md`
- Prior source/toolchain manifest: `D:\mkt-browser-engine\provenance-manifest.json` (outside Git)
- Prior clean-shell replay hash: `ebef50530eff947c603cfa7bd0a7ce3f1063fdc7a3065b408027f53af4901d85`

## Historical unresolved questions (closed for this release)

- The one permitted reboot did not produce more than 12 GiB physical available RAM; no current owner
  question remains. A future reopen needs a fresh resource decision.
- The choice of a 32 GiB+ Windows build host is a future owner decision if the track reopens.
- The newer SDK patch remains a future reproducibility review item; no current release depends on it.
