---
phase: 1
logicalPhase: 1
date: 2026-08-28
status: blocked
---

# Phase 1 Handoff — Isolated Source and Toolchain

## Starting contract

- Read the Phase 0 feasibility handoff and retained its numeric guards.
- Continued under the owner's AGENTS.md standing authorization: conditional D: pilot, upstream
  Chromium first. No Brave checkout, MKTBrowser integration, or shell/profile/proxy/Relay/MCP
  refactor was authorized or performed.

## Completed work

- Created one engine-only root at D:\mkt-browser-engine (no spaces).
- Cloned depot_tools at revision f70835271105ca56d2cd5382a0118152bc2bdeea.
- Fetched Chromium with --no-history; the first transfer stalled and was interrupted, then a
  direct HTTP/1.1 retry completed with exit 0.
- Ran serial gclient sync pinned to source revision
  5f2a9d7331c8bf53be5b6b88488f6e07fd01235f. The summary records 1,241 solutions and 0 unsynced.
- Installed/modified Visual Studio Build Tools 2026 at D:\mkt-browser-engine\vs2026:
  installation 18.9.12112.369, MSVC 14.51.36231, MFC/ATL and x64 tools.
- Installed Windows SDK package 10.0.28000.2526; selected SDK directory is 10.0.28000.0.
  Debugging Tools windbg/cdb are 10.0.28000.2526.
- Ran the DEPS lastchange action because --nohooks left LASTCHANGE.committime absent.
- Generated out\Experimental with GN; no autoninja/compiler invocation.
- Wrote the sanitized provenance manifest and two clean-shell replay logs.

## Measurements

| Gate | Result |
|---|---|
| Source | detached SHA 5f2a9d7331c8bf53be5b6b88488f6e07fd01235f |
| DEPS | SHA-256 bc53dd5dab107c662829db31f260c35e962053b05990882deea86d4c567f6d80 |
| D: free after setup | 235.05 GiB |
| Conservative Phase 0 pre-fetch lower bound | 162.24 GiB (pilot floor 150 GiB) |
| Host RAM | 15.92 GiB total; 6.58 GiB available at final check |
| VM/WSL | none running at final check |
| GN | exit 0; 32,783 targets / 5,030 files / 28,928 ms |
| replay | 2/2 identical; SHA-256 ebef50530eff947c603cfa7bd0a7ce3f1063fdc7a3065b408027f53af4901d85 |
| MKTBrowser tracked index | pre/post SHA-256 01fd23153759e8644c2dc1ee051fbf166c36581fd91b26e91844f59beaecdbe9 |

## Verdict

BLOCKED, not partial PASS. Disk and toolchain/replay gates pass, but compile admission fails:
6.58 GiB is not greater than the required 12 GiB. No compiler, Ninja, browser launch, installer,
binary handoff, or distribution occurred. The exact SDK source comment pin is 10.0.28000.2270;
the installed 10.0.28000.2526 is newer in the same source-required family and must remain an
explicit review item.

## Files and state

- Root plan files changed: plan.md, phase-01-feasibility-gate.md,
  phase-02-isolated-source-and-toolchain.md, this handoff, and the Phase 1 evidence report.
- External evidence: D:\mkt-browser-engine\provenance-manifest.json
  (SHA-256 9175b37fef6a9fbee4204a6fab370e8fbac88383e3f5826bcc3dcf8cfb77541a).
- External generated output: D:\mkt-browser-engine\src\out\Experimental.
- MKTBrowser source files and its pre-existing dirty set are unchanged.
- A partial pack from the interrupted first fetch was moved recoverably to
  D:\mkt-browser-engine\quarantine\tmp_pack_GoJ7gQ; do not delete it without a storage decision.

## Commits

Focused plan/evidence commit: `ad06fbd4202ea3cc5c43e46f9a2b61689b724662` (`docs(engine): record isolated Chromium toolchain gate`).
This commit is local on `codex/fingerprint-engine-phase0`; no push or distribution was performed.
The external engine tree is not part of the workspace Git repository.

## Next-session procedure

1. Read this handoff only; do not rescan the whole repository.
2. Re-measure D: reserve, available RAM, and VM/WSL state.
3. Replay the clean-shell environment with depot_tools first, DEPOT_TOOLS_WIN_TOOLCHAIN=0, and
   vs2026_install=D:\mkt-browser-engine\vs2026.
4. Do not run autoninja until available RAM is greater than 12 GiB. If it is not, keep status
   BLOCKED and stop.
5. Before any binary leaves the experiment root, re-check MKTBrowser README license, notices,
   checksum, and approval status. No binary distribution is covered by this handoff.

## Traps and boundaries

- Without the custom vs2026_install override, Chromium's detector searches only the default
  C:\Program Files\Microsoft Visual Studio\18 path and GN fails.
- A no-hooks sync does not create LASTCHANGE.committime; run the documented hook or a complete
  hooks session before regenerating GN.
- Do not run a VM beside a Chromium compiler on this 16 GiB host.
- BrowserScan/CreepJS are future measurement instruments only. Bot-detection evasion, CAPTCHA or
  checkpoint bypass, rate-limit bypass, TikTok automation, and related legacy text remain out of
  scope.
