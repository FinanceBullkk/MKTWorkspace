---
type: tester
date: 2026-09-08
status: local-pass
---

# Local Validation: Browser Startup and Fresh Engine Default

## Summary

All four assigned checks passed on Node v22.23.2, sequentially with the VM off.
No source edits, packaging, VM operations, Git mutations, remote requests, or vendor activation.
This is local source evidence only; installer, installed first-run, and GitHub gates remain separate.

Source: `E:\MKTWorkspace\MKTBrowser`, HEAD `2c68a6d9ac4376a28699027ea882370baa236c40`
plus the 12 changed/new files below. Skill-guided full-suite escalation protects shared test configuration;
report location follows the project-organization convention.

## Diff-Aware Scope

Analyzed 10 tracked changes plus 2 new files. Config/test-helper changes escalate to the complete
`test:installer` suite and the protected-module coverage contract.

| Changed file | Selected tests / strategy |
| --- | --- |
| `apps/desktop/src/main/browser-process-discovery.ts` | Co-located `browser-process-discovery.test.ts` (A) |
| `apps/desktop/src/main/browser-process-discovery.test.ts` | Changed test itself |
| `apps/desktop/src/main/devtools-port-discovery.ts` | Co-located `devtools-port-discovery.test.ts` (A) |
| `apps/desktop/src/main/devtools-port-discovery.test.ts` | Changed test itself |
| `apps/desktop/src/main/windows-process-query-worker.ts` | New co-located `windows-process-query-worker.test.ts` (A) |
| `apps/desktop/src/main/windows-process-query-worker.test.ts` | New test itself |
| `apps/desktop/src/main/runtime-contract.test.ts` | Changed test itself |
| `packages/settings-store/src/index.ts` | `settings-store.test.ts` imports module (C) |
| `packages/settings-store/src/settings-store.test.ts` | Changed test itself |
| `apps/desktop/package.json` | Test-command configuration: full suite (D) |
| `scripts/critical-coverage-contract.cjs` | Co-located contract test; full protected suite (A/D) |
| `scripts/critical-coverage-contract.test.cjs` | Changed test helper/contract: full suite (D) |

Unmapped changed production files: none.

## Test Results

| Command | Exit | Seconds | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: | ---: | ---: |
| `yarn typecheck` | 0 | 13.411 | n/a | 0 | 0 |
| `yarn lint` | 0 | 18.294 | n/a | 0 | 0 |
| `yarn test:installer` | 0 | 29.046 | 391 | 0 | 1 |
| `yarn test:critical-coverage` | 0 | 11.580 | 121 | 0 | 0 |

Installer: 392/392 configured test executions completed, 391 PASS and 1 intentional SKIP.
Critical coverage: 121/121 PASS. Counts are executions, not unique tests; the coverage run repeats
critical tests already exercised by installer. Cancelled/todo: zero in both runs.
Settings suite: 8/8 PASS, four added test cases. Lint includes workspace-quality validation and syntax
checks for 47 JavaScript files. No failed tests or unexpected warnings. MCP unauthenticated-mode warnings
and proxy refusal logs originate from deliberate negative fixtures.

The skipped test is `explicit machine integration gate inspects live Windows process, listener, and
startup state` in `apps/desktop/scripts/windows-installer-ownership-fixtures.test.cjs`.
It requires explicit live-host integration opt-in and is not a clean installer PASS.

## Coverage

Critical slice only: 14 protected modules, not whole-repository coverage.

| Metric | Measured | Required | Status |
| --- | ---: | ---: | --- |
| Lines | 91.48% | 86% | PASS |
| Branches | 84.23% | 80% | PASS |
| Functions | 91.39% | 85% | PASS |

New `windows-process-query-worker.ts`: 100% lines, branches, and functions.
Existing gaps remain: `browser-process-discovery.ts` 76.62/76.27/77.78;
`devtools-port-discovery.ts` 84.75/82.76/80.00; `license-lease-recovery.ts` branches 68.75;
`socks5Bridge.ts` branches 73.17. Exact uncovered lines are retained in the coverage log.
Settings-store is tested but excluded from this deliberately scoped coverage percentage.

## Read-Only Settings Review

- `packages/settings-store/src/index.ts:62`: only the default engine changes to CFT.
- `packages/settings-store/src/index.ts:118`: either explicit valid stored engine remains authoritative
  during store load; tests assert CFT and CloakBrowser preservation and byte-identical stored JSON.
- New cases cover fresh absent file, both explicit choices, missing engine, and unsupported engine;
  an unrelated persisted `startupOrphanSweep: false` survives loading.
- The failed-persistence test now attempts the non-default CloakBrowser value and still proves that
  failed writes cannot publish a new engine into memory (`settings-store.test.ts:8`).
- No new vendor activation path. `ChromiumBootstrap.ts:510` selects vendor manifest resolution only for
  the CloakBrowser engine. Fresh settings have empty key fields. This is source/test evidence, not a
  network trace of installed first run.

Important existing installer boundary: `ChromiumBootstrap.ts:503` rejects normal unpinned downloads.
CFT default alone cannot establish usable fresh setup; the actual installer needs a valid CFT
compatibility-set pin. `apps/desktop/src/main/index.ts:361` deliberately applies an active pin before
bootstrap, overriding a mismatched saved engine. Store-level preservation does not change that existing
compatibility-set policy. Lead informed before packaging.

## Performance and Build Status

Total assigned command wall time: 72.331 seconds.
Slowest installer cases: non-destructive shortcut inspection 2.099 s; loopback bridge 2.051 s;
exact-owned Relay cleanup 1.687 s. No individual case exceeded 5 seconds. Critical test runner took
10.988 s, including worker idle retirement. No intermittent failure observed in these two overlapping
runs; this is not a repeated stress/flakiness campaign or a memory-leak benchmark.

Typecheck/lint PASS. Production package build and all VM/install gates intentionally not run by this
agent; parent owns them. Settings tests generate ignored TypeScript build output; no tracked source
path was added or changed by validation. Settings fixtures use isolated temporary files with final cleanup.

## Evidence

Directory: `E:\MKTWorkspace\local-test-artifacts\vm-browser-startup-20260908\`.

- `closeout-typecheck-20260908-0656.log`: command-result receipt; typecheck emitted no stdout/stderr.
- `closeout-lint-20260908-0656.log`: captured output.
- `closeout-installer-20260908-0656.log`: complete TAP output, including the intentional skip.
- `closeout-critical-coverage-20260908-0656.log`: complete TAP and per-file coverage output.

Measured source SHA-256:

| File | SHA-256 |
| --- | --- |
| `packages/settings-store/src/index.ts` | `dee8b49e8a3b80b74b3ed173b32c7379ccfc3abe4a0296b994b68b72eef6d26c` |
| `packages/settings-store/src/settings-store.test.ts` | `018b5e995c96b06d9f0ff744bfbb92b623709281003d5266259be73739ea2a5d5` |
| `apps/desktop/src/main/windows-process-query-worker.ts` | `b197c098812d4fd46af4e8784a033e0328595837e24f1ee8b2f41422fe67d236` |

## Recommendations

1. Verify the exact installed CFT compatibility pin and normal first-run download/lifecycle before
   claiming readiness; keep the no-unpinned-production gate intact.
2. Run exact combined-installer clean/repair/uninstall gates in the disposable VM, then required CI.
3. Future test-quality work: expand process-discovery failure/platform branches and lease-recovery/
   SOCKS error branches; keep coverage thresholds unchanged.

## Unresolved Questions

- Which exact CFT compatibility-set pin will the final installed candidate use? Parent owns acceptance.
