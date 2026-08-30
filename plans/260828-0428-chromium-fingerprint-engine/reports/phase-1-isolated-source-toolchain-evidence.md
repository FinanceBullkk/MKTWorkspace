---
type: measurement
phase: 1
logicalPhase: 1
date: 2026-08-28
status: blocked
---

# Phase 1 Evidence — Isolated Chromium Source and Toolchain

## Scope Amendment (2026-08-28)

This report retains the original observation that compilation was blocked at 6.58 GiB available
RAM. The plan now treats checkout/toolchain/GN setup as complete and carries that observation into
the separate Phase 1B artifact gate; this historical report is not evidence that a compiler ran.

## Verdict

BLOCKED. The source checkout, dependencies, host compiler toolchain, and GN configuration are
usable in an isolated tree. The mandatory compile gate is not met: final available RAM was
6.58 GiB, while the plan requires more than 12 GiB. No compiler, Ninja, browser launch, installer,
distribution, or MKT Browser integration was run.

## Decision and isolation

- Continuation authorization was recorded after the Phase 0 owner gate. The first candidate is
  upstream Chromium, not Brave.
- All engine state is under D:\mkt-browser-engine. The only source worktree is
  D:\mkt-browser-engine\src; no engine file is under E:\MKTWorkspace\MKTBrowser.
- The disposable mkt-ci-windows VM was powered off before GN/toolchain work; no WSL distro was
  running at the final check. No VM was run concurrently with a compiler (there was no compiler).
- Existing dirty MKTBrowser files were preserved. No binary was copied into that checkout.

## Source and dependency provenance

| Item | Measured value |
|---|---|
| Chromium source revision | 5f2a9d7331c8bf53be5b6b88488f6e07fd01235f |
| DEPS SHA-256 | bc53dd5dab107c662829db31f260c35e962053b05990882deea86d4c567f6d80 |
| depot_tools revision | f70835271105ca56d2cd5382a0118152bc2bdeea |
| dependency entries | 1,241 |
| unsynced entries | 0 |
| fetch | first attempt interrupted after transfer stall; direct retry exit 0 |
| gclient sync | exit 0, serial, pinned revision, JSON summary written |
| generated hook | DEPS lastchange exit 0; LASTCHANGE.committime exists |

The complete dependency revision set is in the sanitized machine-readable manifest outside the
workspace Git repository. The manifest also stores SHA-256 values for DEPS, gclient state, and the
sync summary.

## Toolchain

| Component | Result |
|---|---|
| Visual Studio Build Tools | 2026, installation 18.9.12112.369, complete/launchable |
| MSVC | 14.51.36231; cl 19.51.36256.0 |
| Windows SDK | package 10.0.28000.2526; selected directory 10.0.28000.0 |
| SDK Debugging Tools | windbg/cdb 10.0.28000.2526 |
| bundled GN | 2531 (c7ffaf80713a) |
| bundled Ninja | 1.12.1 |
| bundled clang/lld | present under third_party/llvm-build/Release+Asserts |
| clean-shell replay | 2/2 identical SHA-256 ebef50530eff947c603cfa7bd0a7ce3f1063fdc7a3065b408027f53af4901d85 |

The custom VS installation requires vs2026_install=D:\mkt-browser-engine\vs2026 and
DEPOT_TOOLS_WIN_TOOLCHAIN=0 in each build shell. Without that explicit path, Chromium's
vs_toolchain.py only probes its default C: location and fails; this is a reproducibility trap, not
an undocumented source patch.

## GN gate

After the selective lastchange hook:

- gn gen out\Experimental exited 0: 32,783 targets from 5,030 files in 28,928 ms.
- gn ls out\Experimental in the same environment exited 0 and returned 32,783 target lines.
- args were is_component_build=true, is_debug=true, symbol_level=0, blink_symbol_level=0, and
  v8_symbol_level=0.
- autoninja was never invoked; no object, library, executable, or installer was produced.

## Resource measurements

| Gate | Result |
|---|---|
| Phase 0 conservative pre-fetch lower bound | 162.24 GiB free on D: (pilot floor 150 GiB) |
| Final D: free | 235.05 GiB |
| Final C: free | recorded in manifest |
| Final E: free | recorded in manifest |
| Host RAM | 15.92 GiB total; 6.58 GiB available |
| Compile guard | FAIL/BLOCKED: 6.58 is not greater than 12 GiB |

The disk reserve passes. The RAM gate does not; do not start a compiler until a fresh measurement
is greater than 12 GiB. The SDK source comment names patch 10.0.28000.2270; the installed
10.0.28000.2526 is newer in the same required 10.0.28000 family, and the source minimum check and
GN generation accepted the selected directory. Keep this patch difference visible for review.

## Contract-preservation measurement

- MKTBrowser tracked-index SHA-256 before and after:
  01fd23153759e8644c2dc1ee051fbf166c36581fd91b26e91844f59beaecdbe9
- Pre-existing dirty-file set: 3 files; post set identical.
- Experimental binaries copied into MKTBrowser: 0.
- Workspace changes in this phase are plan/evidence files only; nested MKTBrowser source remains
  untouched.

## Acceptance matrix

| Criterion | Status | Evidence |
|---|---|---|
| one isolated checkout/worktree | PASS | one src worktree under D:\mkt-browser-engine |
| required toolchain present and replayable | PASS | VS/SDK/MSVC + 2/2 replay hash |
| source/dependency pin and fetch exit | PASS | SHA, DEPS, 1,241 entries, exit 0 |
| disk floor and reserve | PASS | 162.24 GiB lower bound; 235.05 GiB final |
| MKTBrowser unchanged | PASS | tracked index and dirty set identical |
| no concurrent build/VM | PASS for work performed | no compiler/Ninja process; VM/WSL off |
| manifest and replay evidence | PASS | manifest SHA below; two identical logs |
| compile admission | BLOCKED | 6.58 GiB available < 12 GiB guard |

## Evidence locations

- Manifest: D:\mkt-browser-engine\provenance-manifest.json
- Manifest SHA-256: 9175b37fef6a9fbee4204a6fab370e8fbac88383e3f5826bcc3dcf8cfb77541a
- Replay logs: D:\mkt-browser-engine\replays\clean-shell-1.txt and clean-shell-2.txt
- Next-session handoff: ../handoffs/phase-01-isolated-source-and-toolchain.md

No BrowserScan/CreepJS measurement was run in this setup phase. Bot detection evasion, CAPTCHA or
checkpoint bypass, rate-limit bypass, TikTok automation, and related legacy material remain
explicitly out of scope.

## Open gates

1. Re-measure available RAM in a clean session; it must be greater than 12 GiB before any
   compiler/Ninja command.
2. Confirm whether the newer 10.0.28000.2526 patch is the accepted reproducibility pin or obtain
   the exact 10.0.28000.2270 installer.
3. Before any binary leaves D:\mkt-browser-engine, perform the MKTBrowser README license and
   approval check. No such distribution is authorized by this evidence.
