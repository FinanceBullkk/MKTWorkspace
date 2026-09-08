---
type: debugger
date: 2026-09-08
---

# Windows Runner Shell Loader Regression

## Summary

Run `34183122353` failed before entering the inventory script. Its default Windows PowerShell
dot-source loader was blocked by execution policy. Local real-shell reproduction confirms this
failure and the process-only `RemoteSigned -File` correction. The remote run remains FAIL;
corrected remote execution is not claimed here.

## Findings And Timeline

Evidence: `local-test-artifacts/second-laptop-runner-20260908/run-r1.log`.

- `03:19:48.216Z`: runner `mkt-ci-windows`, machine `MSI`, initialized successfully.
- `03:19:48.452Z`: shell resolved to Windows PowerShell `-command ". '{0}'"`.
- `03:19:49.171Z`: generated runner-temp `.ps1` could not load: "running scripts is disabled".
- `03:19:49.172Z`: `PSSecurityException`, `UnauthorizedAccess`; no script-entry receipt.
- `03:19:49.212Z`: exit 1. No resource, toolchain or scratch success evidence.
- By `10:25 +07:00`: local regression red/green complete, current test suite PASS 25/25.

Competing causes checked:

1. Wrong SHA/runner or script guard failure: eliminated as this run's cause. Loader failed at
   dot-source before script entry, with no guard error. Existing 18 rejection cases still pass.
2. PowerShell syntax incompatibility: eliminated. Complete inline script parses with real
   Windows PowerShell 5.1; loading a trivial local file under Restricted reproduces the same failure.
3. Execution-policy loader boundary: confirmed. Unique harmless `.ps1`, explicit process-scoped
   Restricted and dot-source produce exit 1/PSSecurityException without the entry marker. The
   exact same file with `powershell -NoLogo -NoProfile -NonInteractive -ExecutionPolicy RemoteSigned
   -File {0}` produces exit 0 and reports effective RemoteSigned. A terminating throw through this
   custom shell returns exit 1. No global or CurrentUser policy mutation occurs; all policy scopes
   are compared before and after. Machine/UserPolicy on the remote runner remains unmeasured.

## Changes And Validation

Owned implementation: `D:/mkt-self-hosted-20260908/MKTBrowser/scripts/self-hosted-runner-preflight.test.cjs`.
Root separately updates the workflow shell. No dependency installation, build, application launch,
credential access, Git operation or remote dispatch performed by this subtask.

- Added real-file shell-loader and terminating-throw regressions, using unique temporary directories
  and nonrecursive cleanup; exact shell declaration now asserted.
- Red state: old `shell: powershell` yielded 24 PASS / 1 FAIL, the precise shell assertion.
- Green state: Node 22.23.2 `--test scripts/self-hosted-runner-preflight.test.cjs`: 25 PASS,
  0 FAIL, 0 SKIP, 7.34 seconds.
- `node --check` PASS. Scoped ESLint PASS using the pre-existing workspace dependency runtime and
  matching workspace config. `git diff --check` PASS; only existing LF-to-CRLF notices.
- Final formatting-only pass: project-cwd Prettier writes the owned test only; Prettier check,
  ESLint, Node syntax and final 25/25 tests all PASS (7.72 seconds, zero failures/skips).
- Full application build/coverage not run: changes limited to shell invocation and its test.
  These local tests are not second-laptop, clean-machine, installer or product-readiness evidence.

## Recommendations

Keep exact custom-shell assertion and executable loader regression together; parsing alone misses
this boundary. Inspect the next bounded remote probe's actual exit status and receipt before any
substantive workload. Retain the historical FAIL and do not broaden persistent execution policy.

## Unresolved Questions

- Whether remote MachinePolicy/UserPolicy overrides the process-only setting: requires the corrected
  remote run. No persistent policy change or override is authorized by this test.
