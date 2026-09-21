# Final validation - licence seat fixes

Date: 2026-09-21, Asia/Saigon. Scope: source verification only.
Evidence: [final-validation.json](../260921-1109-licence-seat-fixes/final-validation.json).

## Results

| Check | Exit | Result | Wall time |
|---|---:|---|---:|
| Browser full `yarn test:installer` | 0 | 623 executions: 622 pass, 0 fail, 1 skip | 62.261s |
| Browser `yarn typecheck` | 0 | PASS | 10.423s |
| Browser full `yarn lint` | 0 | PASS; workspace contract and 63 JavaScript syntax checks | 19.370s |
| Tool full `npm run lint` | 0 | PASS | 22.264s |
| Tool focused Vitest | 0 | 13 files, 170 tests pass, 0 fail, 0 skip | 3.957s |

Total: 793 executions, 792 passed, 0 failed, 1 skipped, 0 cancelled.
Browser count sums 17 Node test-run summaries, including repeated executions inside the package pipeline.
Vitest runner time: 3.34s; tests 244ms. Combined command wall time: 118.275s.

Toolchain verified: Node 22.23.2, Yarn 4.5.0, npm 10.9.8, Vitest 4.1.11.
All five commands ran sequentially. Initial RAM free: 2.22 GiB of 15.92 GiB; later 2.66 GiB.
Exact invocations, timestamps, log names and SHA-256 hashes are in the JSON receipt.

## Diff selection

Diff-aware mode: analyzed 43 changed/untracked files: Browser 30, Tool 13.
Full changed-file lists recorded in the JSON receipt.

- Browser: package scripts and shared types changed; full installer suite selected under strategies D/E.
- Browser source includes lease cooling/recovery, shutdown, aggregate capacity, checksum validation, and measurement-pin guards.
- Tool: five co-located suites selected under strategy A: current-device-browser-health, profile-launch-readiness, profile-setup-readiness, mkt-browser-adapter, mkt-browser-contract.
- Tool consumers/policies selected under strategy C: desktop-contract-mirror, profile-launch-ui, profile-setup-status, machine-clock-ban, relay-antidetect, launch-profile, handle-profiles, handle-ticket.
- Tool selected 13/238 discovered test files. Full repository test-case total not measured.
- Tool base `vitest.config.mts` retained; only `globalSetup: []` overrides the PostgreSQL schema setup for the explicitly scoped pure-unit tests.
- Documentation changes have no executable test mapping.

[!] No dedicated end-to-end tests executed for `MKTBrowser/scripts/fingerprint-measurement-mcp.cjs` or `MKTBrowser/scripts/measure-mkb01e-packaged-fingerprint.cjs`. Pin-helper regressions cover local drift policy; licensed-engine execution remains outside this pass.

## Skipped and open gates

Exactly one Node test skipped:
`explicit machine integration gate inspects live Windows process, listener, and startup state`.

Source: `MKTBrowser/apps/desktop/scripts/windows-installer-ownership-fixtures.test.cjs:216`.
Condition: non-Windows host OR `MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION !== "1"`.
Observed: Windows host; the environment flag is unset. The assignment expressly excludes this gate.
Machine-integration verdict: OPEN.

Coverage lines/branches/functions: not generated, OPEN. No percentage or threshold pass claimed.
Build: not run in this pass, OPEN. Earlier Browser build evidence is separate.
Tool typecheck: not run in this pass. Earlier typecheck evidence is separate.
Full Tool database/integration suite: not run. No database setup/migrations executed.
VM, packaged installer, real vendor capacity, second-PC, human acceptance, elapsed canary and identity acceptance remain separate.
Parent's earlier one-shot real-engine attempt was not repeated or reinterpreted.

## Failures and performance

No failed tests or check commands. No failure hidden by retry; no retries performed.
Two expected Node `ExperimentalWarning` messages for `--experimental-transform-types`.
Slowest Browser tests:

| Test | Duration |
|---|---:|
| isolated PowerShell orchestration waits, starts once, rejects conflicts and refuses recreated direct login | 8.961s |
| a missing app executable rejects through cleanup without an unhandled child error | 5.051s |

Dedicated flakiness and memory-leak campaigns not run. One final pass per command cannot establish their absence.

## Recommendations

1. Retain the machine-integration and release gates as OPEN until their separate real-environment evidence exists.
2. Run instrumented critical coverage in the authorized full quality stage; these counts are not coverage.
3. Keep harness pin regressions and real-engine acceptance distinct.

No source edits, staging, commits, reverts, deployment, vendor calls or app opening performed.
Development-rules file at the configured home path was absent; root and Tool AGENTS plus both READMEs were read.

## Unresolved questions

None for this assigned validation scope.
