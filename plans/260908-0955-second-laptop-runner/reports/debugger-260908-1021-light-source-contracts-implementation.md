---
type: debugger
date: 2026-09-08
---

# Light Source Contracts Implementation

## Summary

Implemented only the isolated infrastructure checkout at `D:/mkt-self-hosted-20260908/MKTBrowser`.
Default remains manual inventory. Explicit `source-contracts` adds a bounded dependency-free Node 22
test lane after successful inventory. No commit, push, dispatch, installer rebuild or product promotion.

## Changes

- `release.yml`: manual mode routing; exact SHA/ref/repository/runner/MSI guards; 1.25 GiB RAM and
  2 GiB disk gate before provisioning; fresh run/attempt/GUID checkout and external evidence paths.
- Git isolation precedes pinned checkout `11bd71901bbe5b1630ceea73d27597364c9af683`; system/global,
  templates/hooks, prompts, signing and inherited Git/SSH configuration controls isolated. Checkout
  token is contents-read only and not persisted. No sibling credentials, caches or artifact upload.
  Inherited Git/GCM/SSH selectors block before paths/checkout: GitHub env-file `NAME=` writes cannot
  genuinely remove selectors, so contaminated runner state is rejected rather than blanked.
- Pinned official Node ZIP requires 35,683,585 bytes and SHA-256
  `1177b4137ba5adaa56354ae40f1080c7450e8ae09cecb47da459d1c52ac99f97`. Transfer bounded by size/time;
  only exact `node.exe` entry extracted after hash validation. No package managers or global tools changed.
- Fixed three suites run serially with 128 MiB Node heap and 180-second deadline. Require 20 passes,
  zero failures/skips/cancellations, valid TAP and successful actual command exit. Retain TAP/stderr,
  hashes and immutable final receipt outside checkout; check source commit/tree/cleanliness and Node
  hash before/after. Product acceptance remains OPEN.
- Native helper uses atomic `PROC_THREAD_ATTRIBUTE_JOB_LIST` during suspended CreateProcess, verifies
  membership before resume, and kills the full private job on owner death. Timeout/output termination
  waits for zero active processes before allowing cleanup. Unknown termination preserves scratch/BLOCKED.
- Output cap is a 16 MiB-per-stream threshold checked every 25 ms; slight overshoot is possible.
  This is process containment, not a security sandbox. Windows 10+ required; unsupported API fails closed.

## Verification

Supported local Node 22.23.2, real Windows PowerShell 5.1:

- Serial infrastructure suite: 42/42 PASS, 0 failures/skips/cancellations, 26.03 seconds.
- Ten source-runner guard tests: routing, precheckout order, pins, parser, capacity, identity, owned
  path marker, TAP fail-closed cases and wrong-size/hash archive rejection without download.
- Seven native helper tests: exit/env/cwd/output, detached-child timeout, detached-child normal exit,
  abrupt owner death, existing output/invalid timeout, output flood and failed native process creation.
- Existing probe guards and real shell-loader regression: 25/25 PASS.
- Scoped ESLint, Prettier and git diff check PASS. Existing Prettier YAML parser accepts workflow.
- Initial TAP test exposed case-insensitive `TODO` matching the `# todo 0` summary. Corrected to match
  directives on test-result lines; both zero-summary acceptance and actual SKIP/TODO rejection retained.
- Independent review found blank-versus-absent Git selector semantics. Replaced blanking with a
  precheckout fail-closed guard; new actual PowerShell regression confirms inherited GIT_DIR blocks
  before filesystem/capacity activity. Focused source-lane suite now 11/11 PASS, 9.37 seconds;
  total infrastructure test count is 43 after this addition. Scoped lint/format/diff remain PASS.

## Recommendations

Independent review and test the real contained 20-suite invocation before dispatch. Keep capacity
rejection as BLOCKED. Check actual MSI receipt rather than treating these local infrastructure tests
as laptop execution evidence. Frozen Browser/Tool checkouts and installer remain unchanged.

## Unresolved Questions

- Full runner download/checkout/20-suite execution on MSI is unrun by this subtask.
- Resource availability is remeasured by the actual job; earlier inventory was below the RAM threshold.
