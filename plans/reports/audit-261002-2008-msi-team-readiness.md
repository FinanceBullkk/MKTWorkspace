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

## Candidate-only publication continuation - 2 October 2026

- The retained Build A was copied from MSI and rehashed locally: 148,993,705 bytes, SHA-256
  `2144a3c2472a7ac746561200cd7d172f2937e00f1207491a0dabc86c0615c34f`.
  Relay ZIP, Browser `app.asar`, control contract, and CFT ZIP were likewise matched to the
  frozen tuple. The existing CFT ZIP cache matched its official 202,713,690-byte SHA-256.
- A signed pilot compatibility manifest was first published as v22 sequence 32. A broader R2
  sequence audit then found a prior v20 sequence 32. **The v22 sequence 32 objects are
  quarantined and must never be activated.** The collision was found before Web deployment,
  environment promotion, or installed activation. Immutable objects were preserved as evidence.
- The corrected pilot is **v22 sequence 33**, signed by the existing delegated DPAPI key.
  Its seven immutable R2 objects (installer, Relay, Browser, control contract, engine,
  revocations, manifest) passed complete preflight, conditional publication, and full GET/hash
  read-back. Signed manifest SHA-256 is
  `7d69b2edb3f43a287f969776444799392175bd26b478ddfa3d1100f66dbbe172`;
  publisher log SHA-256 is
  `df0dd95c75c0bdb1bd1b1e8b8b9fc0aa18141434b582ce84252110eff7c31fb4`.
- The exact installer was separately published to its immutable candidate key and fully read
  back: 148,993,705 bytes, matching Build A SHA-256. Publisher log SHA-256 is
  `d43b1a9c37952fb14de2ec7856ffc66faaff12bff92171b9fb92f81d75d8bfce`.
  Railway still approves the previous Browser 0.3.29 / Relay v21 tuple, so the new installer
  is **not available through the operator download route**.
- A source correction at MKTTool commit `adcccaab692cd8b7abc9e9a21c8641fd5d78f11b` was
  pushed only to `release/relay22-next1636`. It selects the exact approved 0.3.29 object
  while 0.3.30 is piloted, and maps compatibility sequences 26-31 to v18, 32 to v20, and
  33 to v22. A full R2 read-back of the approved 0.3.29 installer through this code matched
  148,990,003 bytes and SHA-256
  `fd3bb30eada3fcd6db2046e9935cb3579121e7ad8a9a7041414ba7c9e9906238`.
  Signed v18 sequences 26/31, v20 sequence 32, and v22 sequence 33 validated against R2.
- Focused source regressions passed 30/30; typecheck and lint passed. A no-DB run passed
  2,125 tests with one configured skip after a first run failed two Prisma tests because the
  checkout lacked `TEST_DATABASE_URL`. That first failure is retained. A host build attempt
  failed on a borrowed `node_modules` junction containing Next.js 16.3.3; it is not a result
  for the candidate's locked 16.3.6 dependencies. Exact-commit MSI quality and build are in
  progress in a clean worktree with fresh disposable PostgreSQL 17 `_test` databases.

### Additional open gates

- MSI exact-commit quality receipt and temporary PostgreSQL cleanup are pending.
- Production Web still runs hotfix `34354b9` / Relay v21. Candidate Web commit `adcccaa`
  is not deployed; Railway's prior installer approval and compatibility target mapping were
  not changed.
- Build A remains uninstalled. Signed CFT activation, clean VM, managed proxy recovery,
  non-admin Google/Vaultwarden onboarding, exact second-PC journey, and seven elapsed canary
  days remain open. Native identity-isolation gate remains historical FAIL.

## MSI exact-commit gate continuation - 2 October 2026

- MKTTool `adcccaab692cd8b7abc9e9a21c8641fd5d78f11b` passed the official PostgreSQL 17
  quality stage, 10/10 required checks and 2,483/2,483 tests. Receipt SHA-256:
  `715881ba3fa6e1f7a8e7e60684a1f5b5168718e118b3df2417b88865c6024b63`.
  The exact-commit security stage passed; receipt SHA-256:
  `6456ec95ea2ac21af662d8314650586d220346b6b18fac25f0ba5f32c540e218`.
- The same commit passed the official PostgreSQL 16 UTF-8 contracts stage, 3/3 required
  checks. Receipt SHA-256: `d2e86465bbcd61e078ab6cccc280e17352d95fece4be29bea7630341fddf3830`.
  Disposable PostgreSQL 17 and 16 servers were stopped; MSI ports 6543 and 6544 were
  independently observed closed. These receipts set `releaseApproved=false`.
- The powered-off clean VM was exported on the local host to
  `D:\MKTRelease\261002-team-readiness\vm\mkt-windows-gate-clean.ova`:
  11,556,994,048 bytes, SHA-256
  `d6e9ccd92528aba6ed5e92c5b02d0f6168b222e135c811aef7287722f16cb5ff`.
  MSI VirtualBox 7.2.16 is installed. OVA transfer is in progress; no guest result yet.
- The exact-commit packaged Relay stage passed 5/5 on MSI: dependencies, Relay tests,
  SEA/TLS fixture, build and verification. Receipt SHA-256:
  `8d702c5d193c0aad9d9e8f5739fa3cc84526f5b5fbbf5e60deee7cb0b1ae8c67`.
  Its CI-origin ZIP SHA-256 is `0f255259941b449b31f306eb7183065f87f16b4694eb77ddee7836735b706e1c`;
  this fixture build is separate from the retained production-origin v22 ZIP.

### Still open

- Clean VM import, exact Build A installation, signed sequence 33 activation, packaged
  Relay, proxy failure/recovery, repair, uninstall, and cleanup.
- Candidate Web `adcccaa` is still only on `release/relay22-next1636`. Live Web health
  remains ready on `34354b9` with Relay v21. The 0.3.30 candidate is not operator-promoted.
- Non-admin operator onboarding, exact physical second-PC journey and seven elapsed canary
  days. The v22 sequence 32 collision remains quarantined; only sequence 33 is the pilot.

## Production pilot and clean-VM correction - 2 October 2026

- MKTTool `adcccaab692cd8b7abc9e9a21c8641fd5d78f11b` was fast-forward pushed to
  `master`. Railway deployment `fdde4025-9bf3-447c-9f0f-fd4f3cf075af` reported
  `SUCCESS` for that exact SHA. Live `/api/healthz` returned `ready`, Relay v22 and
  database, release metadata, R2 and operator fingerprint all `ok`. The production
  approved installer tuple remained Browser 0.3.29 / Relay v21; the sequence map still
  targeted 26 from a fresh device. No Browser 0.3.30 operator promotion occurred.
- The first exported OVA was a powered-off `mkt-windows-gate` VM from the older August
  baseline. It transferred intact and imported on MSI, but the guest displayed an
  expired `gateop` password and offered no working SSH banner. It cannot count as the
  current clean Defender-enabled gate. The imported disposable VM was shut down through
  ACPI and removed by its exact verified name/path. Its MSI OVA was removed; the existing
  MSI Browser and Relay data were untouched.
- The correct `mkt-phase5-clean` VM is powered off at snapshot
  `clean-with-ssh-defender-20260825` (`326357d7-35b1-4c91-92ca-856fb0f35e9b`),
  with the existing guest SSH forwarding and Defender baseline. Its export to a new
  OVA is in progress. Clean install and signed activation are still `OPEN`.

## Unresolved questions

- Which non-admin Google account and final team roster will perform pilot sign-in and
  allowlist validation? No credentials or keys should be sent in chat.
- Will the correct clean VM, exact Build A and signed sequence 33 complete normal
  first run, repair and uninstall? The old August VM result does not answer this.
- When can the exact candidate begin the seven elapsed canary days after machine and
  operator gates pass?

## Snapshot VM correction - 3 October 2026

- The owner supplied a pilot Google address for MSI. Production configuration recognizes it
  as allowlisted and non-admin. This is configuration evidence only; Google sign-in and local
  operator-key entry remain OPEN. The final team roster is still unconfirmed.
- The second transferred OVA, `mkt-phase5-clean-defender.ova`, was 17,004,927,488 bytes,
  SHA-256 `9594da02e0be12b86a2ba4709874e14611a16a95f28797a5b392204689ec81f9`.
  Although guest SSH and Defender worked, the imported current state already contained
  Browser 0.3.23 and Browser/Relay data. It cannot prove a clean install. That MSI VM is off.
- On the source host, VirtualBox cloned the actual
  `clean-with-ssh-defender-20260825` snapshot
  (`326357d7-35b1-4c91-92ca-856fb0f35e9b`) into the separate powered-off VM
  `mkt-phase5-clean-snapshot-261003`. The clone uses 6 GiB RAM and a 20,049,821,696-byte
  VDI, SHA-256 `c6c3d187288820a6f8f1e379ffd71abedc9f35c04d78303d3e4ed2e394432fad`.
  Its stale source-host virtual DVD was detached from the clone. The original VM and its
  snapshot were not modified. Direct transfer of the clone to MSI is in progress; no guest
  preflight or Build A installation result follows yet.
- Automatic approval review rejected removal of the task-created local OVA files with
  reason `blocked by policy`; they were retained. With 11.8 GiB free on source D: after
  cloning, an additional local OVA export was not attempted.

## Exact snapshot gates and MSI pilot staging - 3 October 2026

- The snapshot clone transferred directly to MSI without an extra OVA. MSI read back the
  20,049,821,696-byte VDI at the same SHA-256
  `c6c3d187288820a6f8f1e379ffd71abedc9f35c04d78303d3e4ed2e394432fad`.
  Its VM config and NVRAM also matched source hashes. The MSI VM registered with 6 GiB RAM;
  no other VM was running. Initial live guest preflight found Windows 11 Home, Defender
  real-time enabled, no Node, zero product paths/processes/uninstall entries, and a logged-in
  desktop session. This finally establishes a clean receiving machine.
- Exact retained Build A, SHA-256
  `2144a3c2472a7ac746561200cd7d172f2937e00f1207491a0dabc86c0615c34f`,
  was hashed again inside the guest. The process-local PowerShell `ExecutionPolicy Bypass`
  was required to execute the test harness; the first call was blocked before installation
  and did not change persistent policy. The clean install gate then passed **9/9** with
  Defender enabled, unsigned Authenticode observed, exact Browser `app.asar` and Relay
  archive hashes, firewall rules, loopback control port, self-provisioned token and profile
  store. Local-only receipt SHA-256:
  `ced485738088f2bc373ebad1a23936fb6deaca171a2c8e999440d9cdb051a0a7`.
- The historical repair harness expected its own fresh snapshot. Calling it after the clean
  install produced **FAIL**, 4/13 attempted, with failed clean preflight and an initial
  reinstall timeout. That receipt remains at
  `local-test-artifacts/team-readiness-261002/repair-initial-failed-evidence.json`,
  SHA-256 `e67a22415d10cc40193d8c71a1a0abc108de3a6ee1388c98dfa73f94a8c4f48e`.
  A separate installed-state repair harness (SHA-256
  `b0eb9f7cb20d6c399f2026bc6d4bec1943547a385e1f239e4a5074052f925429`)
  passed **13/13**: deliberate owned-file/shortcut/metadata damage was repaired, token,
  profile DB and marker hashes stayed unchanged, and Browser served its control port again.
  Receipt SHA-256: `4865719800f34895c26c1c9a478652ed0415bd189f906a9af8bf1fcec43b8242`.
- The first exact uninstall run passed 14/15 but is **FAIL** because its Defender preflight
  read false; receipt SHA-256
  `7108a5482d293e9d6d289b1a6aca169c280ed8895152f654f5e1733e492510ed`.
  Direct Defender status later reported Normal/real-time enabled three times; no 5000/5001
  enable/disable event appeared in the preceding 45 minutes. After reinstalling the same
  bytes and verifying Browser/Relay hashes with Defender enabled, the unchanged uninstall
  harness passed **15/15**. It observed terminal removal of payload, shortcuts, registry,
  owned firewall rules, Relay EXE and processes while preserving operator and unrelated
  Relay state. Rerun receipt SHA-256:
  `68b4c1fdd48c73bd92e2d417f8c594e1b53d0ed4c6b2d923535af0cc2aa4a3bb`.
  The earlier FAIL is retained; these are separate measurements.
- **FAIL, VM clock stability:** guest UTC drifted roughly 30-40 seconds behind the MSI host
  after initially near-synchronized boot. VirtualBox logged `AMD-V is not available` and
  NEM fallback. Guest-only Windows Time started but `w32tm /resync` found no time data;
  the service was returned to its prior stopped state. No signed CFT activation was
  attempted under this unstable clock. The guest was shut down normally and the MSI VM
  is powered off; MSI host free RAM returned to about 7.6 GiB. Installer lifecycle PASS
  does not close signed activation or normal operator first-run.
- On the physical MSI host, only MKTBrowser processes were stopped; Google Chrome processes
  were untouched. A private pre-repair backup of 61 Browser and 8 Relay files matched the
  source file hashes, manifest SHA-256
  `140e69bb506a4930ee8223d4811e5b7ff97bed7a7407006c178c0de368a4d4ce`.
  Exact Build A repair passed with exit 0, Browser 0.3.30, matching installed Browser/Relay
  hashes, two firewall rules and all 69 backed-up files unchanged. Receipt SHA-256:
  `698ed2110a87611b411ae8d2fc578d934d1c364301d91256b6ba723848d743a4`.
  Browser and Relay were launched in MSI desktop session 1; ports 47822/47821 served.
  Relay v22 health remained HTTP 400, `configured=false`. No key or credential was
  displayed, copied into Git, or supplied in chat.

### Current release boundary

- MKTTool Web/Relay v22 remains production-ready for the controlled Web workspace.
  Browser 0.3.30 is candidate-only and **HOLD** for team distribution. The production
  approved download remains Browser 0.3.29 / Relay v21; fresh compatibility target
  remains sequence 26. Only signed v22 sequence 33 may be used for the pilot;
  collision sequence 32 remains quarantined.
- Signed CFT activation, managed profile launch with bad-proxy rejection/recovery,
  browser-page network containment, actual non-admin Google/Vaultwarden onboarding,
  exact physical second-PC journey, unfamiliar-operator walkthrough and seven elapsed
  canary days remain **OPEN**. Native fingerprint/identity-isolation acceptance remains
  historical **FAIL**; the product claim is profile management with proxy binding.

## Current unresolved questions

- Can the pilot operator complete Google sign-in, PC enrollment and local-only key paste
  on MSI without sending a key or password through chat?
- Which stable clock environment can complete signed sequence 33 CFT activation on a
  genuinely clean VM, and can the exact physical MSI complete managed proxy recovery?
- What is the final team email roster, and when can the exact tuple enter a seven-day
  canary and receive explicit operator-promotion approval?
