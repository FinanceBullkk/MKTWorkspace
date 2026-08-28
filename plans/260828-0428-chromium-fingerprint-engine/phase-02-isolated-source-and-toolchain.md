---
phase: 2
logicalPhase: 1
title: "Isolated Source and Toolchain"
status: blocked
priority: P1
effort: "90m active work; 1–4h fetch wall time"
dependencies: [phase-01]
---

# Phase 1: Isolated Source and Toolchain (CLI phase 2)

Current verdict (2026-08-28): BLOCKED. The isolated checkout, host toolchain, and GN
configuration are ready, but available host RAM is 6.58 GiB at the final check, below the
mandatory >12 GiB compile guard. No compiler or Ninja build was started.

## Context Links

- Plan: [plan.md](./plan.md)
- Gate: [Phase 0 feasibility](./phase-01-feasibility-gate.md)
- Chromium Windows build guide: https://chromium.googlesource.com/chromium/src/+/main/docs/windows_build_instructions.md
- Brave Windows environment guide: https://github.com/brave/brave-browser/wiki/Windows-Development-Environment
- MKT Browser runtime boundary: `MKTBrowser/apps/desktop/ChromiumBootstrap.ts:174-192,258-365,442-489`

## Overview

Create one disposable engine checkout/worktree on the approved host volume and verify the compiler
toolchain. This phase owns only the new engine tree; it does not add an engine kind or edit MKTBrowser.

## Key Insights

- Chromium requires a short path without spaces, NTFS, depot_tools first on PATH, and local VS/SDK
  components. `gclient` must be initialized from `cmd.exe`.
- Brave adds `brave-browser`/`brave-core`, init hooks, revision coupling, and build configuration
  secrets. Treat it as a separately pinned candidate, never as an implicit Chromium replacement.
- The current MKTBrowser pin and dirty source are evidence boundaries, not working copies for this phase.

## Requirements

### Functional

- Use exactly one approved engine repository/worktree under `D:\mkt-browser-engine\` or the owner-
  approved equivalent, with no path spaces.
- Pin the Chromium or Brave revision, DEPS/submodule state, depot_tools revision, VS version, SDK,
  and build arguments in a non-secret manifest.
- Keep all source, output, and optional cache outside `E:\MKTWorkspace\MKTBrowser`.

### Non-functional

- Reproducible setup: a second clean shell must report the same revisions and tool versions.
- Preserve at least 20 GiB free after setup; stop if the measured budget falls below the Phase 0 guard.
- No binary copied into the MKTBrowser runtime, no installer, and no distribution.

## Architecture

```text
approved D: root
  ├─ depot_tools (pinned)
  ├─ chromium/src or brave-browser (pinned)
  ├─ out/Experimental (one output tree)
  └─ manifest + logs (sanitized)
```

The tree is an isolated producer. A future adapter may consume a checksum, but this phase has no
runtime dependency from MKT Browser into the experimental tree.

## Related Code Files

- **Create (engine tree only):** checkout, `out/Experimental`, sanitized toolchain manifest.
- **Modify:** none in `E:\MKTWorkspace\MKTBrowser` or `E:\MKTWorkspace\MKTTool`.
- **Do not modify:** `windows-engine-release.json`, `ChromiumBootstrap.ts`, driver, Relay, MCP, or
  profile-manager files.

## Implementation Steps

1. Confirm owner approval, writable-root grant, `D:` free space `>=150 GiB` for a pilot (or
   `>=200–220 GiB` for full/release), and host available RAM `>12 GiB`; power off all VMs before work.
2. Install/verify the pinned Visual Studio C++ workload, MFC/ATL, Windows SDK/debugging tools,
   direct Git, depot_tools, and Python precedence from a `cmd.exe` shell.
3. Create the single engine checkout with `--no-history` unless the owner explicitly funds a shared
   cache; record fetch start/end, exit code, source SHA, DEPS state, and bytes consumed.
4. Generate one component/debug output directory only; do not start a compiler in this phase.
5. Snapshot MKTBrowser and workspace status before and after; write the provenance manifest and handoff.

## Success Criteria

- [ ] Exactly one engine checkout/worktree exists on the approved volume; no engine files are under
  the MKTBrowser checkout.
- [ ] Required toolchain checks are `100%` present and version-pinned; a fresh `cmd.exe` reproduces
  the same `where python3`, compiler, SDK, and depot_tools results.
- [ ] Source SHA and all dependency revisions are recorded; fetch exit code is `0`; no secrets enter
  the manifest.
- [ ] Free space is `>=150 GiB` before a minimal pilot and `>=20 GiB` after setup; otherwise verdict
  is `BLOCKED`, not a partial pass.
- [ ] MKTBrowser pre/post status and tracked-file hashes are identical; `0` MKTBrowser source files
  changed and `0` experimental binaries copied into it.
- [ ] No compiler/build process runs concurrently with another engine build or a VM.
- [ ] One machine-readable provenance manifest and `2/2` clean-shell replays produce identical
  revision/toolchain hashes; `0` undocumented local patches or dependency overrides are present.

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Brave/Chromium revision/toolchain skew | Non-reproducible checkout | Pin every revision and retain `DEPS`/init logs |
| Cache or VDI growth | Disk exhaustion | Avoid shared cache initially; measure after each step; stop at 20 GiB reserve |
| PowerShell depot_tools setup | Broken Python/MSYS bootstrap | Use `cmd.exe` exactly as upstream documents |
| License/notice ambiguity | Cannot distribute candidate | Keep non-production; require written review before any binary handoff |

## Security Considerations

- Exclude credentials, API keys, vendor tokens, and private build configuration from logs and manifests.
- Do not copy CloakBrowser assets or alter its license-bound runtime.
- Keep source provenance and checksums auditable without exposing operator secrets.

## Next Steps

Proceed to the baseline harness only after a fresh check reports available RAM >12 GiB and the
toolchain replay remains identical. If any criterion fails, stop and record the exact blocker.

## Execution Evidence

- Candidate: upstream Chromium, detached at 5f2a9d7331c8bf53be5b6b88488f6e07fd01235f; depot_tools
  at f70835271105ca56d2cd5382a0118152bc2bdeea; 1,241 dependency entries, 0 unsynced.
- fetch --no-history --nohooks and serial gclient sync both exited 0. The selective DEPS
  lastchange hook exited 0 so GN could consume LASTCHANGE.committime.
- Visual Studio Build Tools 2026 18.9.12112.369, MSVC 14.51.36231, SDK package
  10.0.28000.2526 (selected directory 10.0.28000.0), and Debugging Tools 10.0.28000.2526 are
  present. The custom path requires vs2026_install in every shell.
- gn gen out\Experimental exited 0 (32,783 targets, 5,030 files, 28,928 ms), and a matching
  gn ls replay returned 32,783 target lines. autoninja was not invoked.
- D: measured 235.05 GiB free after setup; the conservative Phase 0 pre-fetch measurement was
  162.24 GiB (pilot floor 150 GiB, reserve floor 20 GiB). Final RAM was 6.58 GiB available on a
  15.92 GiB host; no VirtualBox VM or WSL distro was running.
- Two clean-shell replay logs have identical SHA-256
  ebef50530eff947c603cfa7bd0a7ce3f1063fdc7a3065b408027f53af4901d85.
- Machine-readable provenance (all dependency revisions, tool hashes, sanitized MKTBrowser
  snapshots): D:\mkt-browser-engine\provenance-manifest.json
  (SHA-256 9175b37fef6a9fbee4204a6fab370e8fbac88383e3f5826bcc3dcf8cfb77541a).
- MKTBrowser tracked-index SHA-256 stayed
  01fd23153759e8644c2dc1ee051fbf166c36581fd91b26e91844f59beaecdbe9; its three pre-existing
  dirty files were unchanged, and no experimental binary was copied into that checkout.

## Unresolved Questions

- Is the newer SDK patch 10.0.28000.2526 acceptable as the reproducibility pin against the
  Chromium source comment pin 10.0.28000.2270?
- When can the host provide more than 12 GiB available RAM for the first compiler run?
