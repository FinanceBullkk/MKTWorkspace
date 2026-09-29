---
date: 2026-09-24
scope: MKTBrowser cold-start/TLS/profile final source validation
status: fail
---

# Browser Final Validation

## Scope

Read-only final validation after the cold-start/TLS/profile source fixes. No build, VM, SEA,
credential, release, deploy, or native-module rebuild was run.

## Results

| Command | Verdict | Evidence |
| --- | --- | --- |
| `corepack yarn test:installer` | FAIL | 119 executed: 116 pass, 3 fail, 0 skipped; 7.695s |
| `corepack yarn typecheck` | PASS | 6 TypeScript project checks; 7.662s |
| `corepack yarn lint` | PASS | workspace-quality PASS; JavaScript syntax checked in 69 files; 15.340s |
| `corepack yarn verify:node` | FAIL | Corepack used Node 24.14.1; repository requires Node 22 |

`test:installer` stopped at `packages/profile-manager` legacy-import tests, so its remaining
chained suites, including packaging/wrapper coverage, were not invoked. This is not a runner
skip: only the executed Node test totals above are counted.

## Failed Tests

- `packages/profile-manager/src/legacy-multizen-import.test.ts`: 3 failures:
  `copies legacy profiles without changing the MultiZen source tree`, `refuses to overwrite an
  existing MKT Browser data directory`, and `refuses an import when a database profile directory
  is missing`.
- All fail before assertions because `better_sqlite3.node` was compiled for NODE_MODULE_VERSION
  127 while the executing Node requires 137.
- The affected `packages/profile-manager` source is absent from the current diff. This is an
  environment/toolchain failure rather than evidence of a current wrapper/TLS/profile regression,
  but it blocks the requested suite.

## Toolchain

- Shell Node: `v24.21.0` / ABI 137. Corepack's Node: `v24.14.1`.
- Checked-in verifier requires Node 22 exactly.
- Existing local launcher verified: `C:\Users\anhha\AppData\Local\Volta\tools\image\node\22.23.2\node.exe`.
- Safe Node 22 validation chain passed without an installer rerun:
  `& <node22> C:\Program Files\nodejs\node_modules\corepack\dist\corepack.js yarn verify:node`.

## Coverage And Build

- Coverage: SKIPPED; no coverage command was in the requested final gate.
- Build/package/VM/SEA/public TLS/second-PC/canary: SKIPPED by scope. No release inference.

## Recommendations

1. Rerun `test:installer` under the verified Node 22.23.2 launcher; do not rebuild native modules
   under Node 24.
2. If that rerun passes, treat source validation as separate from the remaining exact SEA, live
   launch-path environment, clean-VM, public TLS, and rollout gates.

## Unresolved Questions

- Await owner/lead direction to rerun the installer suite under the verified Node 22 launcher.
