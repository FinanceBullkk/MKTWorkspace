---
phase: 2
title: "Stabilize Packaged Contract CI"
status: complete
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
- [x] Required PR packaged verification passes 5/5 cold launches on the exact uploaded artifact.
- [x] Seven independent 20-iteration runs complete without CDP readiness failure or orphan process.
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

## CI Evidence - 22 August 2026

The Phase 1 and Phase 2 work existed only as local commits until this date. The required check had
therefore been grading a tree that did not contain the fix, which is why the branch read as unstable
while the local evidence read as green. Both were true statements about different trees.

| Run | Event | Tree | Result |
|---|---|---|---|
| `32568808252` | pull_request | `48372cc` | quality, package, packaged-contract all pass; 5/5 iterations |
| `32569415269` | pull_request | `6b70a6d` | same three jobs pass; 5/5 iterations; `windows-installer` correctly skipped |

Run `32569415269` is the authoritative one: it is the current merge tree. Iterations averaged about
eleven seconds each against the uploaded artifact in a job that never built it.

`windows-installer` reporting `skipped` is itself the evidence that the new dispatch gate holds. A
stability dispatch can no longer emit a second installer beside the single verified Phase 4 artifact.
Since v1 ships unsigned, an extra installer is not distinguishable from the real one by inspection,
which is precisely why an extra one must not exist.

## Stability Streak Progress - 22 August 2026

| Run | Iterations | Declared engine | Result |
|---|---|---|---|
| `32570630202` | 20 | `151.0.7922.170` | 20/20 |
| `32572582551` | 20 | `151.0.7922.170` | 20/20 |
| `32572622904` | 20 | `151.0.7922.170` | 20/20 |
| `32572628115` | 20 | `151.0.7922.170` | 20/20 |
| `32572633406` | 20 | `151.0.7922.170` | 20/20 |
| `32572638973` | 20 | `151.0.7922.170` | 20/20 |
| `32572644069` | 20 | `151.0.7922.170` | 20/20 |

Streak complete: 7 of 7. One hundred and forty cold packaged launches, no CDP readiness failure, no
rerun anywhere in the count. Every run declared the same engine and the guard confirmed it on each of
the one hundred and forty iterations, so this is one streak on one engine rather than seven runs that
happened to agree. `windows-installer` reported `skipped` in all seven.

A green run is also the orphan evidence: the verifier fails a run when cleanup cannot remove the
disposable application or browser processes, so seven clean runs mean no run left one behind.

Six dispatches at 11:50-11:51 UTC appear between runs one and two in the run list and are not part of
the count. They were refused a runner for billing and never started, so they measured nothing and
neither counted nor reset the streak. They are named here so the gap is not later read as six
suppressed failures.

The six runs did not fail the contract; they never allocated a runner. GitHub reported: *the job was
not started because recent account payments have failed or your spending limit needs to be
increased*. Nothing was measured, so these runs neither count toward the streak nor reset it. They
are recorded here so the gap in run identifiers is not later mistaken for six suppressed failures.

## Resolved - Actions Spending Limit

The repository is private under an organization, so every Actions minute is billed and Windows
runners bill at a 2x multiplier. The streak stalled at one of seven when the spending limit was
reached. The limit was raised the same day and the remaining six runs completed. Recorded because the
failure presented as six red runs and was not an engineering fault at all.

### Cost Note Worth Acting On

Each dispatch currently re-runs `quality` and `package` before `packaged-contract`, so a seven-run
streak pays for seven full lint/typecheck/test passes and seven package builds to obtain seven
twenty-iteration measurements. Roughly a third of the spend measures what the streak is about.

There is a second, larger consequence. Rebuilding per dispatch means the seven runs exercise seven
separately built packages. The gate is meant to prove that one packaged artifact launches reliably,
so testing seven artifacts once each is weaker evidence than testing one artifact seven times, while
costing considerably more.

A dispatch mode that downloads the artifact from a named earlier run would cut the spend and
strengthen the evidence at the same time. It is not implemented, because implementing it changes the
merge tree and therefore requires another required-gate run, which is exactly the spend that is
currently unavailable.

## Self-Hosted Runner Remediation - 26 August 2026

PR run `32887170530` reached the packaged-contract job on the approved self-hosted Windows runner,
but the job stopped before launching the app because Google Chrome was not installed. Chrome was
then installed in the `mkt-ci-windows` image and verified as a Google-signed executable; measured
version is `152.0.7977.65` with SHA-256
`1978a6175a53db1a435d745d00222ae4b5f328f492c7bcdb63b93e78013fd728`.

A local retry against the old artifact exposed a second runner-specific failure. The runner log and
live inspection showed a newly-created `DevToolsActivePort` record, the matching profile process,
and its loopback listener, but the timestamp freshness check still rejected the record. The fix
removes filesystem timestamps as an authority: the caller's pre-spawn deletion is the freshness
boundary, and exact data-directory process plus listener ownership remain mandatory authentication.

The fix was built from clean merge tree `5747a26685868fce320c329d2e7dee34f4b0127d` in the same VM.
The resulting package has executable SHA-256
`c76835a17d5ba43f87b3ca407fd670eb6a6c48b577ab83080c649670672ef030` and `app.asar` SHA-256
`202dc283bfa7f4f0b7977a8e4498fa079757b83505c16218ec4768025f9e8c82`; packaged runtime/profile
contract passed `5/5`, with the same Chrome version and hash on every iteration. The focused
`test:mkb02` suite passed `120/120`, typecheck and lint passed.

### Remediation delivered - 26 August 2026

Commit `62b86f6` pins the packaged verifier to Chrome for Testing `152.0.7977.64`, authenticates
both archive SHA-256 `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004` and
executable SHA-256 `79832d1e60cbad9323c07339f9608bc0ce93cb9242b9b5481c04a0c536720980`, and extracts
only into the job's temporary directory. All Windows/Linux jobs now require the `mktbrowser` runner
label; `secrets: inherit` was removed where no secret is used. The pull-request Windows pipeline
runs only when the head repository is the base repository, so a fork PR is refused before any
untrusted checkout reaches the persistent self-hosted runner and the required gate fails closed.

Local Node 22 gates passed: installer suite, typecheck, lint, PowerShell parse, workflow YAML parse,
and packaged runtime contract `5/5`. PR merge-tree run `32931672855` passed `quality`, `package`,
`packaged-contract`, and `mktbrowser-pr-release-gate`; the packaged job recorded CFT `152.0.7977.64`
and the pinned executable hash on all five iterations. The push run was cancelled because it is not
merge authority. No release, signing, deployment, or publication was performed.

This closes the unpinned-verifier finding and the missing-Chrome runner failure. The repository is
still public and the runners are persistent; a private repository or ephemeral/isolated runner
remains the stronger long-term boundary for arbitrary same-repository write access.

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
