# P0 Baseline Report

**Run ID:** `P0-G0-20260821-01`

**Captured:** 21 August 2026, Asia/Saigon

**Scope:** Local source, build, artifact, owner-approved installation, and process evidence only. No
publishing, production deployment, real-account action, proxy credential access, or license protocol
capture was performed.

## Verdict

The source and Node 22 build baseline is reproducible. MKTTool is green, the MKT Browser installer
suite is green with one explicitly skipped pre-install machine integration test, the Windows package
builds, and its packaged lifecycle verifier passes. The owner-approved combined installer is now
installed: Browser and Relay hashes match the packaged payloads, both fixed ports have exact expected
owners, and sanitized health checks report Relay v15, Browser `0.3.12`, contract v4, and the pinned
CloakBrowser engine ready.

Phase 1 remains blocked only because two disposable proxy/profile assignments are not yet approved.
All packaged human, real-proxy, license-protocol, second-PC, and canary gates remain open.

## Source Identity

| Repository | Branch | HEAD | State at capture |
|---|---|---|---|
| Workspace | `master` | `2dcce0c14bca8b9f4a13c61646ed6248da49c3d2` | Dirty: one pre-existing audit-plan edit, this untracked P0 plan, and 18 pre-existing untracked reports |
| MKTTool | `master` | `d890d097f91ccaa0378a12d1385200acbd4591a4` | Clean; 8 commits ahead of `origin/master` |
| MKTBrowser | `feat/cloakbrowser-licensed-engine-channel` | `b1c7cec2ff266f0d667338d6a2b3cd4eb8832a5e` | Dirty only in the five P0-owned paths listed below |

MKTBrowser dirty diff SHA-256:
`17d82c5e2faf4fb2e68e9fa91182fbf3764eb8d773a4d1fa5693e97514375655`.

P0-owned dirty paths:

- `apps/desktop/package.json`
- `apps/desktop/scripts/package-windows-quality-gates.test.cjs`
- `apps/desktop/src/main/ChromiumBrowserDriver.ts`
- `apps/desktop/src/main/chromium-bootstrap-contract.test.ts`
- `scripts/verify-packaged-runtime-contract.cjs`

The 18 workspace-root reports and the existing
`plans/260813-1546-pre-mkb04-system-quality-audit/plan.md` edit remain user-owned and untouched.

## Toolchain

| Item | Value | Result |
|---|---|---|
| Packaging Node | `v22.18.0` from `local-test-artifacts/node22-corepack/node.exe` | Pass |
| Corepack/Yarn | Corepack beside Node 22; Yarn `4.5.0` | Pass |
| Host Node | `v24.14.1` | Recorded only; not used for the Browser package build |
| Platform | Windows x64, build `10.0.26200` | Supported v1 platform |

## Verification

| Repository | Command or gate | Result |
|---|---|---|
| MKTTool | `npm test` | Pass: 201 files, 1,878 tests |
| MKTTool | `npm run typecheck` | Pass |
| MKTTool | `npm run lint` | Pass |
| MKTTool | `npm run build` | Pass; two known Turbopack dynamic-filesystem tracing warnings |
| MKTBrowser | `yarn verify:node` under Node 22 | Pass |
| MKTBrowser | `yarn typecheck` under Node 22 | Pass |
| MKTBrowser | `yarn lint` under Node 22 | Pass with 0 errors and 3 existing React hook warnings |
| MKTBrowser | `yarn test:installer` under Node 22 | Pass: 218 tests, 217 passed, 0 failed, 1 explicit pre-install machine integration skip |
| MKTBrowser | desktop Windows directory build under Node 22 | Pass; installer tests and lint ran before artifact creation |
| MKTBrowser | `yarn verify:packaged-contract` under Node 22 | Pass: managed invalid-proxy refusal plus disposable profile lifecycle |
| MKTBrowser | Focused packaging command regression | Pass: 5 tests, 0 failed |
| MKTBrowser | Pre-install `test:packaging:windows-machine` with Browser and Relay closed | Pass: 4 tests, 0 failed |
| Installed runtime | Browser authenticated `/healthz`; anonymous control | Pass: `200`/`ok:true`; anonymous request rejected with `401` |
| Installed runtime | Relay `/health` sanitized metadata | Pass: v15 configured; Browser `0.3.12`, contract v4 compatible, CloakBrowser `151.0.7922.108.2` ready |
| MKTBrowser | `git diff --check` | Pass |

## TDD Regression Closed

The packaged verifier originally returned `ENGINE_UNAVAILABLE` for its CFT disposable fixture
because every launch attempted to reserve a CloakBrowser key from an empty pool. The verifier's
expected `PROXY_REJECTED` assertion was retained.

The fix scopes key rotation to `cloakbrowser`. After rebuilding the directory package, the same
public managed-launch call reached the proxy boundary and returned `PROXY_REJECTED`; the complete
packaged runtime and profile lifecycle contract then passed.

The live Windows gate command then failed before starting because Yarn 4 expanded PowerShell's
`$env` expression and reported `Unbound variable "env"`. The regression test locked the command
shape, the script now single-quotes the PowerShell command, the focused suite passed 5/5, and the
actual pre-install machine gate passed 4/4.

A post-install rerun of that pre-install gate returned its documented exit `20` because the newly
installed Browser and Relay were active. This is an expected precondition refusal, not a runtime
regression; post-install verification used exact file hashes, process ownership, and authenticated
health instead.

## Artifact Inventory

| Artifact | Version | Bytes | SHA-256 | Disposition |
|---|---:|---:|---|---|
| Installed Browser executable | `0.3.12` | 221,933,568 | `bcc0367a8b9d3fcd711e04abbce0d7ff48c8c2a10f7f1d80201c7bcb4e13275c` | Exact match for both unpacked Browser copies; listening on `127.0.0.1:47822` |
| Frozen combined installer | `0.3.12` | 146,130,712 | `f1c44eee51729433574be1b9be72760e7054f3c66bb895869af4fc2819f6206d` | Owner-approved installer used for this installation; rollback input for later P0 phases |
| Directory Browser | `0.3.12` | 221,933,568 | `bcc0367a8b9d3fcd711e04abbce0d7ff48c8c2a10f7f1d80201c7bcb4e13275c` | Exact match for the installed Browser |
| Relay v15 archive | `15` | 34,285,450 | `cfeefc7f1284492a64f5cf8b29603b3e9a36e5d488ac676d2d109b2c4364b261` | Pinned archive embedded by the combined installer |
| Installed Relay executable | `15` from health | 92,400,128 | `eb37eb544ef87b772185272aa2de4cf23000f2e2fbd92f6bde99a20e47b210d1` | Exact match for `MKTTool-Relay.exe` inside the pinned v15 archive; listening on `127.0.0.1:47821` |
| Licensed engine pin | `151.0.7922.108.2` | 537,518,332 | `7b16ae3070bfcbed9cd381d03d1a8d57a8baf8f4540650397d620eb8dbe89561` | Runtime health reports this exact version ready |
| Historical setup executable | `0.3.1` | 112,004,584 | `539e4dee3d85bb26fec00dbf8509ff81c5710fc32c4e90a2421e6fc0b4e514fc` | Inventory only; not an approved rollback because it predates current fixes |

The frozen combined installer plus its matching unpacked Browser and Relay v15 payload is the
identified rollback input for changes made in later P0 phases. No rollback was executed.

## Port and Process Snapshot

| Port | State | Owner | Evidence |
|---:|---|---|---|
| `47821` | Listening on loopback | PID `7312`, installed `MKTTool-Relay.exe` v15 | Path and executable hash match the archive entry; sanitized health is ready |
| `47822` | Listening on loopback | PID `34028`, installed `MKTBrowser.exe` `0.3.12` | Path and executable hash match the installed Browser row; authenticated health is ready |

The owner completed the installer wizard. Verification did not terminate the installed Browser or
Relay after setup.

## Open Gates

- Owner approval of disposable pairs `P0-A` and `P0-B`, each bound to a different static proxy.
- Packaged input, manual-login, proxy, DNS, WebRTC, fingerprint, storage, and license evidence.
- Second-PC setup, hard-kill/restart/reboot recovery, seven-day canary, and GO/NO-GO decision.
