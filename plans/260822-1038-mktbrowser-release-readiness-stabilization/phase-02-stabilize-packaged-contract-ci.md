---
phase: 2
title: "Stabilize Packaged Contract CI"
status: in-progress
priority: P1
effort: "3-5 working days"
dependencies: []
---

# Phase 2: Stabilize Packaged Contract CI

## Overview

Make the Windows packaged runtime contract deterministic and diagnosable. The same source tree must
not alternate between success and a 60-second CDP timeout. The fix must remove the race or resource
collision; increasing the timeout again is explicitly insufficient.

Verified incident: PR run `32547593681` failed with `CDP /json/version not ready on port 9223 within
60000ms`, while push run `32547591956` passed on the identical Git tree
`2c13c91efffa9e0dac3f9cb8ed34ce23cd662631`. The driver currently allocates fixed ports by incrementing
from 9222 without reserving them.

## Context Links

- [Master plan](./plan.md)
- Failed run: `https://github.com/Techieslab-app/MKTBrowser/actions/runs/32547593681`
- Successful run: `https://github.com/Techieslab-app/MKTBrowser/actions/runs/32547591956`

## Requirements

- Reproduce the failure or prove its mechanism with port/process/startup diagnostics.
- Eliminate fixed-port collision and launcher-handoff ambiguity.
- Build the directory package once, hash it, and test that exact artifact in a fresh job context.
- Preserve the normal 15-second operator budget; CI-specific tolerance must not hide operator regressions.
- Run repeated cold packaged launches before calling the contract stable.

## Architecture

Preferred target:

```text
spawn Chromium with OS-assigned DevTools port
  -> read DevToolsActivePort from the owned profile directory
  -> validate owning process/data-dir relationship
  -> staged /json/version -> page target -> attach
  -> publish running state only after readiness
```

If the engine cannot support port `0`, reserve an ephemeral loopback port through a held socket and
close it immediately before spawn, with collision retry and port-owner diagnostics. Do not retain the
current monotonic 9222+ allocator.

Split CI into quality, package, and packaged-contract jobs. The package job uploads one hashed
unpacked artifact; the contract job downloads and exercises it. This detects dependency on leftover
workspace state and prevents an unnoticed rebuild between verification steps.

## File Inventory

| Action | File | Rough size | Test impact |
|---|---|---:|---|
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBrowserDriver.ts` | 2,581 lines | Port discovery, launch cleanup, diagnostics |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\cdpReadiness.ts` | Existing | Stage diagnostics and process checks |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\browser-process-discovery.ts` | Existing | Bind actual port to owned data directory/PID |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\startup-orphan-sweep.ts` | Existing | Recover actual DevTools port after crash |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\index.ts` | Existing | Serialize first launch behind startup orphan recovery |
| Modify | `E:\MKTWorkspace\MKTBrowser\scripts\verify-packaged-runtime-contract.cjs` | Existing | Repeat mode, artifact hash, process/port evidence |
| Modify | `E:\MKTWorkspace\MKTBrowser\scripts\system-chrome-engine-fixture.cjs` | Existing | Deterministic fixture and version evidence |
| Modify | `E:\MKTWorkspace\MKTBrowser\.github\workflows\release.yml` | Existing | Build-once/download/test job split |
| Create | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\devtools-port-discovery.ts` | 100-180 lines | Isolated discovery and validation tests |
| Create | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\devtools-port-discovery.test.ts` | 150-250 lines | Partial file, stale file, collision, timeout |

## Function And Interface Checklist

- [x] Launch state does not require a port before Chromium publishes one.
- [x] `DevToolsActivePort` parsing is bounded, schema-checked, and tied to the owned data directory.
- [x] Readiness errors report stage, elapsed time, child/primary PID state, port owner, and bounded stderr.
- [x] Failed launch always closes discovered processes and removes temporary profile state.
- [x] Startup orphan recovery can rediscover the port without trusting a stale command-line value.
- [x] Packaged verifier accepts `--repeat N` and records per-iteration timing without hiding failures.

## Implementation Steps

1. Add diagnostics before behavior changes: source/tree SHA, artifact SHA-256, runner image, Chrome
   version/hash, allocated/discovered port, child PID, selected primary PID, port owner, process tree,
   readiness stage timings, exit state, and last bounded stderr. Redact user paths and secrets.
2. Add a controlled collision test that occupies 9222/9223 and proves the current allocator fails or
   misroutes. Add launcher-handoff and stale `DevToolsActivePort` fixtures.
3. Implement OS-assigned DevTools port discovery, or the bounded reservation fallback if measured
   engine behavior requires it.
4. Refactor launch cleanup so every readiness failure tears down child and discovered primary
   processes before the next attempt.
5. Split workflow jobs: quality -> package once -> upload manifest/artifact -> fresh packaged verifier.
6. Run the packaged lifecycle 5 consecutive cold iterations on every PR merge tree. Run 20 iterations
   nightly/manual for seven consecutive runs during stabilization.
7. Add a separate timeout budget assertion: operator mode remains 15 seconds; CI repeats may use a
   measured upper bound only after port/process correctness is proven.
8. Preserve failure artifacts for 7 days: bounded app log, process/port snapshot, artifact manifest,
   and verifier timing JSON. Never upload profile data or tokens.

## Test Scenario Matrix

| Priority | Scenario | Expected result |
|---|---|---|
| Critical | Ports 9222/9223 already occupied | Launch selects another owned endpoint; no foreign attach |
| Critical | Browser launcher exits but primary process survives | Primary PID/port discovered; readiness continues correctly |
| Critical | Browser never opens DevTools | Fail within budget with actionable process/port evidence and full cleanup |
| High | Stale `DevToolsActivePort` from prior crash | Reject stale owner; wait for current launch record |
| High | Five sequential packaged cold launches | 5/5 pass; no orphan process or reused profile state |
| High | Artifact downloaded into fresh job | Same artifact hash passes without build workspace leftovers |
| Medium | Normal operator launch regression | Still fails within 15 seconds, not hidden by CI settings |

## Regression Gate

```powershell
corepack yarn test:installer
corepack yarn typecheck
corepack yarn lint
corepack yarn workspace @mktbrowser/desktop build
node scripts/verify-packaged-runtime-contract.cjs --repeat 5
```

Stability gate: 5/5 in the required PR run and 20/20 in at least seven independent Windows runner
runs. Any rerun needed to obtain green resets the consecutive-run count.

## Success Criteria

- [x] The fixed-port allocator is removed from packaged launch behavior.
- [x] A failed readiness run identifies the process/port mechanism without another diagnostic rerun.
- [ ] Required PR packaged verification passes 5/5 cold launches on the exact uploaded artifact.
- [ ] Seven independent 20-iteration runs complete without CDP readiness failure or orphan process.
- [x] Normal operator timeout remains strict and separately tested.

## Local Review Evidence - 22 August 2026

- Node 22 `test:installer`, typecheck, zero-warning lint, and the production Windows directory build
  pass after adversarial review fixes.
- A focused regression test proves startup orphan recovery aborts a never-resolving polite CDP close
  within its own total cleanup budget before the first launch barrier opens.
- Verifier health probes and MCP RPCs have independent hard deadlines, with regression coverage for
  both a never-settling transport and successful response-body consumption.
- The rebuilt executable is 221,933,568 bytes with SHA-256
  `b62642a57c2651c071a59fe210fa2fe9633df584d16fa49e3abd855e747bc1a7`; packaged `app.asar`
  SHA-256 is `8a2310fbd9341b0b45ae829a45b9fdbb40a31da5aa821513fb01e9209a919da7`.
- The exact local directory package passed 5/5 cold lifecycle iterations while loopback ports 9222
  and 9223 were held. Chrome `151.0.7922.138` SHA-256 evidence is recorded per iteration in
  `local-test-artifacts/phase2-packaged-contract-timings-bounded-sweep-final.json`; post-run checks
  found no disposable process, directory-package application process, or fixed-port listener.
- An expected active-port timeout produced the discovery stage, elapsed budget, child state,
  sanitized PID/parent/listener snapshot, and redacted final stack in one artifact; cleanup removed
  every disposable application/browser process.
- Phase 2 remains in progress. The required pull-request artifact run and seven independent 20/20
  Windows runner runs are external gates and have not happened yet.

## Risk Assessment

- Some Chromium variants may not write `DevToolsActivePort` identically. Mitigation: measure CFT and
  CloakBrowser, encapsulate parsing, and retain a tested reservation fallback.
- More diagnostics can leak local data. Mitigation: explicit allowlist, basename/hash only, bounded
  stderr, no token/profile contents.
- Repeated CI increases minutes. Mitigation: 5 iterations required on PR, 20 only nightly/manual.

## Security Considerations

Never attach to a DevTools endpoint based only on a reachable port. The endpoint must belong to the
process launched for the owned profile/data directory; otherwise a collision becomes cross-profile
control.

## Next Step

Phase 3 makes the stable packaged check the only Browser merge authority.
