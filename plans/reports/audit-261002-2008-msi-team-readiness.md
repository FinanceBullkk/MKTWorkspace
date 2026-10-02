# MSI validation and team readiness — 2 October 2026

## Scope and source

- MSI Windows 11 physical PC, key-only SSH. Isolated source copies under `D:\MKTRelease\261002-team-readiness\source`; evidence under `D:\MKTRelease\261002-team-readiness\evidence`.
- MKTBrowser `52325793fc564ffcfffe7bfb10c8139363eb56b2`; MKTTool `a2f41fe11d8703657be1554ccf6391cf8b869b92`. Both source commits remain three commits ahead of their remote branches. The MKTTool Next.js patch below is uncommitted and was tested in a separate copied checkout.
- No candidate was installed, published, pushed, or deployed in this run. Existing MSI Browser/Relay was restored after machine tests.

## PASS

| Gate | Evidence |
| --- | --- |
| Browser local quality | Official runner completed 8/8: Node 22.23.2, Yarn 4.5.0, production audit, installer suite, machine integration, critical coverage, typecheck, lint, and Windows directory build. `browser-quality/quality-receipt.json` and hashed command logs. Receipt itself correctly keeps release acceptance `OPEN`. |
| Browser installer A and B | Independent clean source copies and locked installs; both packaging commands exited 0 using the exact pinned local Relay v22 archive and CFT engine release file. A retained EXE SHA-256 `2144a3c2472a7ac746561200cd7d172f2937e00f1207491a0dabc86c0615c34f`, 148,993,705 bytes. B SHA-256 `d66fe2412358f0376cc007354b3499df02a7979e9401a3a72243afdbc3a1fd58`, 148,993,621 bytes. Normalized delivered payloads matched: 130 files, SHA-256 `294a4a557db6a51bd40ead0ab90b9a4d0c5f095005fb72299464d8abbfd790af`. Retained A is `evidence/MKTBrowser-A-win-x64.exe`; exact bytes were not installed or published. |
| MKTTool patched source checks | Next.js changed from 16.3.3 to 16.3.6 in `package.json` and lockfile in the main checkout, then copied to an isolated MSI checkout. Production audit, typecheck, lint, and no-DB suite passed with Node 24.21.0: 221 files / 2,123 tests. Original committed source secret scan passed. |
| MSI restoration | Existing Browser/Relay processes and listeners on 47822/47821 returned. Both isolated Browser checkout trees are clean; retained A hash was rechecked. |

## FAIL / BLOCKED / OPEN

| Gate | Result | Evidence or next action |
| --- | --- | --- |
| Original MKTTool production audit | FAIL | Next.js 16.3.3 was affected by critical `GHSA-vcvr-r3jv-pc5j` (`next/og` ImageResponse RCE). The uncommitted 16.3.6 patch passed a fresh production audit; it is not deployed. |
| MSI's default Node 24.16.0 no-DB suite | FAIL | 1/2,123: Ed25519 point validation observed an OpenSSL behavior change on that runtime. The full suite passed on the candidate's Node 24.21.0. Do not count the 24.16.0 run as pass. |
| PostgreSQL 17 quality and PostgreSQL 16 contracts | BLOCKED | MSI has no PostgreSQL client/service. Docker Desktop did not reach a running engine and temporarily lowered free RAM; it was stopped. No migration or database contract test was run. |
| Production Relay v22 fetch | BLOCKED | Direct packaging without the local pinned archive received HTTP 401. Offline packaging passed with the archive whose SHA-256 matches the v22 manifest. Production health still reports Relay v21. |
| Browser clean VM, signed CFT activation and normal profile launch | OPEN / prior FAIL | New A installer was not installed. The previous exact-candidate MSI first run reported `Setup failed` and lacked the signed engine pin and configured Relay; this run did not resolve that workflow. |
| Team onboarding and promotion | OPEN / NO-GO | Allowlist and each operator sign-in, Vaultwarden collection visibility, non-admin key paste, managed profile/proxy journey, clean VM, canary, and exact production tuple approval remain unobserved. Native identity isolation remains historical `FAIL`; product scope is a profile manager with proxy binding. |

## Delivery boundary

Production Web health was `ready` with database and R2 `ok`, but served Relay v21. Neither repo was pushed. The local Next.js security patch is uncommitted; pushing the current MKTTool branch would also deploy the three ahead candidate commits, so it needs its own release decision and gates. Browser A/B build equivalence is technical evidence only and does not authorize team distribution.

## Unresolved questions at initial audit

- Which isolated PostgreSQL 16 and 17 environment will close the mandatory contracts and quality gates?
- Which exact operator, disposable account/proxy, and signed activation path will be used for clean VM and unfamiliar-operator acceptance?
- When should the Next.js security patch be integrated with the pending MKTTool production branch?

## Continuation — 2 October 2026

The earlier BLOCKED entries above describe the initial audit, not the final machine-test state. PostgreSQL 17.10 and 16.15 were run only on MSI loopback ports 6543 and 6544 with disposable `_test` databases. Both temporary Scheduled Tasks were stopped and unregistered; both ports were closed. The original installed Browser and Relay were restored on ports 47822 and 47821. Test data and logs remain outside Git under `D:\MKTRelease\261002-team-readiness`.

### PASS

| Gate | Bound result |
| --- | --- |
| Security hotfix | Isolated MKTTool commit `34354b94d5e67eb6feb548750722d4f1019a0201` upgrades Next.js to 16.3.6. MSI PostgreSQL 17 quality PASS 10/10 (`mkttool-hotfix-quality/receipt.json`, SHA-256 `80a3fc224c24f10326a90bdd90650771d0f53d4fcd9fe405eb030bb69c4ab4d4`); local security PASS (`next-1636-hotfix-security-261002/receipt.json`, SHA-256 `17b29ff6284aaec932b136d0cf279a9958dade3169e5f0de61fb1eb3a0b5c2ca`). Full suite: 2,469/2,469. |
| Hotfix production deployment | Pushed only `34354b9` to MKTTool `master`. Railway deployment `a2261a7e-022b-45dc-ab8d-cd23fbdafe92` reported SUCCESS for that exact SHA; live `/api/healthz` reported `ready` with database, release metadata, R2, and operator fingerprint `ok`. Production still served Relay v21. |
| Integrated Web/Relay candidate | Original Relay v22 candidate commits were cherry-picked onto the hotfix in isolated commit `2d17c3298a85d2ffe63841f547220a4f02b24c12`, pushed only to `release/relay22-next1636`. MSI quality PASS 10/10 (`6b548ab1c9acd6670922310fcf2e4f85802a6baec46a51d1b83b33ff7d30ba6a`), 2,480/2,480 tests; PostgreSQL 16 UTF-8 contracts PASS (`99e2f5e5c76af82c9f8c3e20b7fae5514572c3704c54d181f941bb0f7b09380f`); packaged Relay stage PASS (`c96cdeb73e6e7ab9fc108c2f42324ce9dae2c5cecdf7317c2ce4902270d1097b`); local security PASS (`3514d08021a4626363b2b1b0e3f7652300bbad259ad44681dd3a6e4708dfd984`). No candidate Web deployment. |
| Browser source and exact installer provenance | Pushed Browser source `52325793fc564ffcfffe7bfb10c8139363eb56b2` to `main`. Retained Build A SHA-256 remains `2144a3c2472a7ac746561200cd7d172f2937e00f1207491a0dabc86c0615c34f`; A/B normalized payload match remains 130/130. Source binding and provenance were generated for Browser `5232579`, original Relay source `a2f41fe`, archived Relay v22 and the retained installer. A new MSI rebuild from original Relay source produced the exact archived ZIP SHA-256 `43a494110cf9d3004b26079c521b8579ad97fdaaa3ed71deb5932d0d0e4b494c`, EXE SHA-256 `55cc1b51cd559e73fcead09a8dd38954ab787f1ef8035d3b31524cc6bf40d78d`, and identical metadata sidecar. |

### Preserved failures and remaining gates

- PostgreSQL 16's first disposable cluster used WIN1252 and failed a UTF-8 migration. A first official retry on a clean UTF-8 cluster also failed the rate-limit subtest; a direct diagnostic then passed its 120 concurrent requests, persistence and cleanup. The exact integrated candidate's separate official contracts run passed. Keep both earlier FAIL receipts; do not recast them as PASS.
- Browser Build A has not been installed, signed into a candidate compatibility manifest, uploaded, or operator-promoted. The prior MSI installation used different bytes and reported `Setup failed` with unconfigured Relay and missing signed CFT activation.
- A local, unsigned freeze record now exists at `local-test-artifacts/team-readiness-261002/release-manifest-frozen.json` (SHA-256 `00bc841c6a9bf0320e41352336e7ee9685295daf412822e459b4cd9e8494fbba`). Its `releaseReady=false` and `operatorPromotion=HOLD` are intentional. The generated provenance initially counted the 60-day unsigned-artifact window from its later generation time; a separate publication input conservatively moves expiry back to 60 days after retained A's observed file timestamp, preserving the original generator output for audit. Neither record is a signed compatibility manifest or publication evidence.
- The existing clean VirtualBox VM is 6 GiB; local host free RAM was 4.05 GiB, below its allocation. No VM was started. Exact clean install, signed CFT activation, managed profile/proxy recovery, repair/uninstall, and page-network evidence remain OPEN.
- Candidate Web commit `2d17c32` is on a remote branch only; production Web remains at hotfix `34354b9` with Relay v21. The original MKTTool main checkout still has the preserved dirty Next.js package patch and three earlier local commits; do not push it directly.
- Unfamiliar non-admin Google/Vaultwarden onboarding, second-PC exact installer journey, and seven elapsed days of canary remain OPEN. No team-wide installer distribution is authorized by these machine receipts.

## Current unresolved questions

- Which clean Defender-enabled machine can run the retained Build A and signed CFT flow with enough RAM, without closing user applications?
- Which allowlisted non-admin operator will perform the Google sign-in and local Vaultwarden key paste for unfamiliar-operator acceptance?
- When will the owner review the exact installer/Relay/engine/deployed-Web tuple for operator promotion after candidate-only and installed acceptance?
