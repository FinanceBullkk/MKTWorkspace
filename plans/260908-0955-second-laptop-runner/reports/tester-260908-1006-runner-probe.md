---
type: tester
date: 2026-09-08
---

# Test Report: Second Laptop Runner Probe

## Summary

Scoped local gate PASS. Final probe tests 23/23 PASS, 0 FAIL, 0 SKIP; 5.95 seconds.
Combined mapped contracts previously passed 54/54 in 5.80 seconds. No remote job, real laptop
measurement, scratch-success execution, installer, dependency installation, heavy build or Git action
was performed by this tester. Actual runner and product acceptance remain OPEN.

## Diff-Aware Scope

Initial changed file: `.github/workflows/release.yml`. Root subsequently changed `package.json`
and `apps/desktop/src/main/runtime-contract.test.ts`; tester owns only new
`scripts/self-hosted-runner-preflight.test.cjs`.

Mapped by workflow reads/import graph (Strategy C): new probe test, runtime-contract,
mkt-browser-contract and productIdentity. Package entry only exposes the new bounded test command.
Infrastructure/config normally escalates full-suite scope; lead explicitly constrained this task
to local probe contracts without installation or heavy builds. Full suite remains NOT RUN here.

## Results

| Check | Result |
| --- | --- |
| New probe contracts | 23 PASS; 4 static, 1 actual WinPS5.1 parser, 18 negative execution cases |
| Runtime contracts | 23 PASS with same-worktree workspace export resolver |
| Product/MCP identity contracts | 8 PASS |
| Combined mapped suite | 54 PASS, 0 FAIL, 0 SKIP; 5.80 s |
| Final probe rerun after root YAML formatting and action-regex fix | 23 PASS; 5.95 s |
| New test `node --check` | PASS |
| New test ESLint with existing project configuration | PASS, 0 warnings |
| `git diff --check` | PASS; standard CRLF checkout notices only |
| Build / full dependency suite / remote probe | NOT RUN / OPEN |

Node: existing `node-v22.23.2-win-x64` toolchain. Inline workflow PowerShell parsed and negative
cases executed by actual Windows PowerShell 5.1, not a replacement shell.

Guards deny missing/empty/short/nonhex/uppercase/different/shell-shaped expected SHA, missing
dispatched SHA, wrong repository/runner/OS/architecture, missing runner, missing/empty/blank host,
and current host with both cases. Sentinel command functions prove denial precedes CIM, path,
tool or scratch actions. Inputs are passed only through a minimal child environment.

Static contracts constrain exact branch/manual event, Windows/X64/repository/laptop labels,
zero probe token permissions, 3-minute timeout, serialized job, disabled existing pipeline,
no actions/secrets/download/cache/artifacts/install/build, fixed version commands and env allowlist.
Scratch ownership, exclusive file creation, read-back and non-recursive cleanup are inspected.
Mutation assertions verify both `- uses:` and nested `uses:` are rejected anywhere in the step list.

## Findings And Historical Failures

- Initial ordinary runtime-test command: 8 PASS, 1 file-load FAIL. Exact error:
  `ERR_MODULE_NOT_FOUND: Cannot find package '@mktbrowser/types' imported from .../runtime-capabilities.ts`.
  Isolated infrastructure checkout has no installed workspace links. No dependencies were installed.
- Rerun used ephemeral Node `registerHooks` only for `@mktbrowser/types`, mapping it to this same
  checkout's `packages/types/src/index.ts`, its declared package export. No source substitution,
  copied dependency tree or filesystem link. This validates scoped contracts, not install readiness.
- Old all-hosted route policy conflicted with approved probe by source inspection. Root updated
  it to preserve all 9 hosted build routes and allow exactly one bounded inventory exception.
  It was not observed as a failing assertion before the update because module loading failed first.
- First lint run found 17 `no-regex-spaces` errors. ESLint formatter changed literal indentation
  patterns to quantified spaces; subsequent lint and tests PASS.
- Reviewer identified missing multiline/list handling in the no-actions assertion. Fixed and added
  mutation checks; final tests PASS. Existing workflow had no executed actions.

## Coverage And Performance

Line/branch/function percentages: N/A, inline PowerShell not instrumented. A Node test-file
coverage percentage would not measure the actual probe and is not claimed. All specified denial
cases are exercised; success-path I/O failures, tool-version failures and real laptop resources
remain unmeasured. Slowest final case: WinPS5.1 parse 0.94 s. Repeated bounded runs showed no
observed flake; this is not a statistical flakiness guarantee. No probe scratch data was created.

## Recommendations

Run the exact-SHA no-checkout job once, inspect actual runner/host identity and redacted receipt,
then decide supported build tasks. Keep scratch-success, native tool inventory, clean VM and
product readiness as separate evidence. Do not rebuild the frozen candidate for this probe.

## Unresolved Questions

- Actual second-laptop resources/toolchain/scratch result pending remote execution by lead.
