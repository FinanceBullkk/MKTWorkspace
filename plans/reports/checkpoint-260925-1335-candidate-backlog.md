---
date: 2026-09-25
status: completed
scope: Candidate source, local validation, artifact provenance and handoff before Browser packaging
candidate: 20260925-browser-0.3.27-relay-20-cold-start-tls-profiles-cft
localCheckpoint: PASS
acceptance: OPEN
releaseVerdict: NO-GO
---

# Candidate Backlog Checkpoint

## Scope And Current Verdict

Close unfinished source changes, commit-bound local gates, Relay artifact provenance and stale
handoff documentation before proceeding to replacement Browser packaging or VM acceptance.
This checkpoint does not start a Browser installer build, VM, upload, deployment or promotion.

The previous session stopped at 10:06 local time on 25 September after a model quota error
(503/429), leaving the replacement pins uncommitted. Its startup completion banner was not a
delivery verdict. This report supersedes the earlier handoff for the current checkpoint only;
historical failures and accepted bytes remain unchanged.

The source/local-validation backlog is closed. All required local commands pass on the frozen
source, all observed skips are covered by the dedicated machine gate, and cleanup is verified.
Replacement installer and product acceptance remain OPEN; release remains NO-GO.

## Frozen Source

| Repository | Commit | Tree |
| --- | --- | --- |
| MKTTool | `a32c293fc9a25c3d17873a31e9a5a62d711e2f3e` | `fd4b7a04d90b0aecb240bd846004de8a61335f01` |
| MKTBrowser | `67e8f16b35a3b8427cf5d5d98aebdc413eee2447` | `8820784941a838f5ca26387fde2608e396460e7e` |

Both product worktrees are clean after explicit-path commits. The source patch aligns Browser
0.3.27 and Relay 20, pins the repaired exact payload and rejects the retained failing v20 archive.
A dedicated generated-provenance regression exercises the quarantine guard independently of the
normal pin equality checks. README/roadmap/changelog now distinguish the replacement from the
abandoned tuple. Final focused tests pass: Browser 23/23, MKTTool 25/25; scoped ESLint and
whitespace checks pass. Independent bounded review found no blocking source defect.

The initial candidate commit is `10ffb7c`; dependency commit `38b5ed0` updates only development
`js-yaml` 4.3.1 to 4.3.2 for GHSA-2883-xcg3-v3hh. Full npm audit then reports zero
vulnerabilities. The final packaging commit normalizes delivered script line endings, updates
the archive pin, and fixes test-fixture cleanup. Browser source binding now hashes the new
packaging helper. The Relay executable remains unchanged. Frozen lock hashes:
MKTTool `76c5eaeafe462eec9fa849c525cb10577f1b7b5202b55c4188d644f3a700d1f0`;
Browser `6dd698a892036b4c910fac19e28d4eb31769d897a81cd046b941fd5c8fa7d1f6`.

## Validation Ledger

Evidence root: `D:\MKTWorkspace-local-validation\260925-1335-checkpoint`.
All new isolated checkouts, dependency installs, generated outputs and command logs use D:.

| Gate | Status | Evidence |
| --- | --- | --- |
| Source review and candidate regressions | PASS | Scoped commits and Browser 23/23 + Tool 25/25 tests above |
| MKTTool full quality and database suite | PASS | `r2/tool-quality/receipt.json`; 10/10 stages, 2,457/2,457 tests, zero skips; SHA-256 `ed45665aa37ffbca079d01c45027d777f4b44cd579ebdaed05f09870059e1e3c` |
| MKTTool PostgreSQL contracts | PASS | `r2/tool-contracts/receipt.json`; 3/3 steps, PostgreSQL 16.12 restore/rate-limit contracts; SHA-256 `5e19217fd471b872879d64992cec8fd763058c631704d0caefe961fbc8562cbd` |
| MKTTool security | PASS | `r2/tool-security/receipt.json`; 2/2 steps, 854 scanned text files and zero dependency vulnerabilities; SHA-256 `60f8f759eac9eebef986e7f956a494165ee4a8efdfcef3bc75ea65db12ef96eb` |
| MKTTool Relay runner | PASS | `r2/tool-relay/receipt.json`; 5/5 steps, Relay 532/532 and TLS fixture 12/12; SHA-256 `34a3e9523645f62523a7ee49dffe82faf9043b885914bababef4560cbe778142` |
| Production-origin Relay rebuild and exact smoke/TLS | PASS | `r2/relay-exact/receipt.json`; exact pin/commit, packaged smoke and direct-child TLS/handoff 3/3; SHA-256 `a96788271db870840eb14503dc3c46ce66c2a47e56445e168b422b8adafc2fbe` |
| Browser full quality and skip adjudication | PASS | `r2/browser-quality-serial/quality-receipt.json`; 8/8 commands, installer 719 PASS + 1 covered machine skip, dedicated machine 4/4; SHA-256 `e8d3281ce42550cd511d3b2a8db449303ed999c83c62f8437a7d1559d5775f24` |
| Toolchain receipts and cross-repository source binding | PASS | `r2/source-binding-serial.json`; SHA-256 `077e2e8078a9dc2537c17e99b9de9ad6b416bef472548c2295a149aafe0de95f`; post-quality verification passes in `r2/source-binding-after-quality.json` |
| Test-environment cleanup | PASS | `r2/cleanup-verification.json`; SHA-256 `c36dbb5edbbbd8e2abca6d50e483570b3df0459cfce39ece2c8dcc600e3f44f6`; task clusters stopped and fixture state cleared |
| Plan/report reconciliation | PASS | This report, the five-phase repair plan and the local-VM release plan agree on local PASS and acceptance OPEN |

The final `a32c293` quality gate passes migrations, lint, typecheck, runner regressions 15/15,
full tests and coverage 2,457/2,457 across 254 files, with zero skips, followed by the Next
production build. Coverage: statements 82.66%, branches 79.75%, functions 83.20%, lines 85.03%.
An independent check verifies all 15 Tool command-log hashes and unchanged source/lock identities.
Both disposable database clusters are stopped after all task databases were dropped. Cleanup
receipts: `r2/pg17-cleanup.json` SHA-256
`154ff356d84c9507d9da50148771964398327ce5905db46c5e024a68c25c1709`, and
`r2/pg16-cleanup.json` SHA-256
`ea86a12ac6098779e9c7d4bc41c7bdc01e52e9974373627fe18b97dbcec973fa`.

The final Browser gate uses Node 22.23.2 / Yarn 4.5.0 and passes Node verification, production
audit, installer tests, machine integration, coverage, typecheck, lint and build. Coverage:
lines 89.76%, branches 84.50%, functions 89.77%. Immutable dependency installation passes;
`r2/browser-install-serial/receipt.json` SHA-256
`a47d3b2251793b63e4170b9c37b553df8607fb34d6a3541b9244ad3ab1ade6d6`.
Installer tests report 719 PASS and one opt-in machine skip. The build repeats that same skip;
the dedicated machine gate executes the exact test and passes all four tests with zero skips.
`r2/browser-skip-adjudication-final.json` checks all eight command logs, covers both occurrences
and records zero unexplained skips; SHA-256
`d6e91fd1cd95440c3faa1125fa1e11f391d6d2c5a146c27db0173925ab1f7807`.

The quality build creates an Electron 42.8.1 technical directory package at
`r2/MKTBrowser/apps/desktop/release/win-unpacked`, with `includeRelay=false`. It creates no
installer, shortcuts or uninstall entry and is not the accepted replacement candidate.
Source/artifact binding is verified again after quality; the original receipt remains unchanged.

Independent final reconciliation verifies source identities, every command-log hash, retained
Relay bytes, Browser skip coverage and cleanup. Final ledger: `r2/verified-ledger.json`,
SHA-256 `7d29ad9bbd124ac073085b8e66c1821342959c844675365570682c9bb13466b7`.

### Browser Test Scheduling Failure

The first Browser r2 run passes Node verification and production audit, then fails the concurrent
tokenized-wrapper fixture's 15-second watchdog. Preserve `r2/browser-quality/quality-receipt.json`
(SHA-256 `e8db2e886869dfbbd604b56e9137b6cdfe57f2738ac5e870c1e4a3ec25bf66b2`) and its failed
installer log. The second synthetic Yarn observer writes its result about 16 seconds after fixture
creation while multiple PowerShell-heavy test files run concurrently. The unchanged two-wrapper
test passes in about 9 seconds when isolated (`r2/browser-wrapper-isolated-diagnostic.log`).

The correction serializes packaging test files with Node `--test-concurrency=1`, retains the
two concurrent wrappers inside their test, and keeps all assertions/watchdogs unchanged. The
complete packaging diagnostic and then all eight official quality steps pass on frozen source.
The new official receipt closes the current local gate; the earlier FAIL remains historical.

The complete serial packaging diagnostic passes 109/110 with only the explicit machine test
deferred to its dedicated gate; the concurrent-wrapper case takes 8,142 ms with unchanged bounds.
Diagnostic log SHA-256: `ae14261b3b67ef8947e9ec8f05155c860dae11dfda9bff35f78685d4d6dcf834`.
Browser `67e8f16` changes only the packaging test-file scheduling and README. Tool source, Relay
bytes, dependency locks and the mirrored Browser runtime contract are unchanged, so the Tool and
exact Relay receipts remain valid; the Browser eight-step gate and source binding are refreshed.

### Preserved Pre-Normalization Results

The `38b5ed0` quality gate used PostgreSQL 17.10 on loopback port 55427. It passed migration,
lint, typecheck, runner regressions 15/15, full suite 2,446/2,446, coverage 2,446/2,446 and
Next production build. Every test executes; the missing-table database block is closed for this
source. Coverage passes all thresholds: lines 85.03%, branches 79.71%, functions 83.20%,
statements 82.62%. Receipt: `tool-quality-final/receipt.json`, SHA-256
`f2844510aa7fefc490d0faac57bc3e1c8c5cdfcf5b330a06d7ebb0c122afa204`.
Security passed 2/2 (`tool-security-final/receipt.json`, SHA-256
`1d77d6719b7c93c4411ad5f3535e04c319d940684aa0a7fc7253e06718c7735b`), contracts 3/3
(`tool-contracts-final/receipt.json`, SHA-256
`52bb0f791e6c72b186c1bb9179f6ac30036f3c692b5432ddf57b8ecbfaae4b20`), and Relay 5/5
(`tool-relay-final/receipt.json`, SHA-256
`fff816a31789b06c86c2e27aa94c94089a9fa24de5005f1a6afda037f3691bd3`). These remain
valid for that predecessor only. The previous missing-table failure remains historical.

The first quality run at `10ffb7c` passed all ten commands, but had one optional cross-repository
mirror skip because its sibling checkout was absent. That predecessor receipt is retained at
`tool-quality/receipt.json`, SHA-256
`1d2bc352d0086ccb9caa2546e741300e63e92b94221e3b51e659ca0c2e069d3f`.
The subsequent run used adjacent frozen `MKTTool` and `MKTBrowser` directories; the full suite
executes that mirror test successfully. No test or threshold was weakened.

## Artifact Identity

### Reproducibility Blocker Discovered During Final Validation

The first final-source rebuild kept the expected EXE hash but produced ZIP
`c66a39353252ffa7b6ad9b936f5aad02634c729560f3b49793f4cbfe5b55526b`, 35,123,164 bytes.
The exact-artifact gate correctly blocked the earlier pin; its immutable receipt remains at
`relay-exact/receipt.json`, SHA-256
`02387e4eef2a70ee4e17bd6b67f905bd2b1b332e64f0b9f7bbc8e6b7c8a744bb`.
Entry comparison found only line-ending differences: the original installer PowerShell file
had mixed LF/CRLF and its launcher had LF, while clean Git checkout produced CRLF.
`relay-line-ending-diagnosis.json` records every entry hash; both ZIPs and sidecars are retained.

Checkpoint amendment: normalize the three delivered Windows text scripts to CRLF while keeping
the PowerShell BOM, add regression coverage across LF/CRLF/mixed source, repin both unpublished
candidate contracts, then freeze and rerun final local validation. No historical receipt is
rewritten, and the Browser installer/VM boundary does not change.

Final expected Relay archive: `c66a39353252ffa7b6ad9b936f5aad02634c729560f3b49793f4cbfe5b55526b`,
35,123,164 bytes. Expected executable:
`630c134f879b253fa4174905604042d0b1f7089624cf045c57e883c744666b88`, 94,620,160 bytes.
Web origin: `https://mkttool-web-production.up.railway.app`; compatibility floor: 26.
The original mixed-line-ending artifact metadata records predecessor `b2e0707`; final-source
metadata records `a32c293fc9a25c3d17873a31e9a5a62d711e2f3e` and passes source binding.

The final rebuild now records that exact commit and matches the expected ZIP and EXE hashes/sizes.
Retained delivery inputs are `r2/relay-exact/MKTTool-Relay.zip`, `.exe`, and `.metadata.json`.
The separate `ci.invalid` diagnostic archive/EXE/metadata are retained under `r2/relay-diagnostic`.
Exact packaged smoke passes; direct-child scoped TLS accepts the trusted fixture chain and rejects
missing intermediates/wrong hostnames, 3/3. This is not normal-parent scoped-trust or public-TLS
acceptance. Final metadata SHA-256:
`7c91ca0b62353d4d0aca638c51ed4e7857569babcc34c62e5c30600ce4a03dd1`.
Toolchain receipts match pre/post build: `r2/windows-node22-toolchain.json` SHA-256
`0c04fba6eb21d3591f7b42b4c1cc68f4470c8a76dd2624fa42233a64e59cf08d` and
`r2/relay-build-toolchain.json` SHA-256
`77b495fa98a9ea05c2604005001468b1ff946c8ddca140138a8ade78ef1b4ac6`.

The abandoned 0.3.26 tuple has real local quality and two-build evidence (129 matching normalized
payload files, receipt under `260925-browser-fae1c77-relay-v20-build-artifacts`). It bundles archive
`9cc71eba405c8ea5ff9f288491ea0b827c7403b3c43541d1fa18c48a87126d69`, which failed terminal
TLS/update handoff. Its signed local sequence-26 manifest is historical, unpublished material.
Neither the build comparison nor that manifest applies to 0.3.27. The failing archive and historical
receipts are retained and must not be reused as replacement inputs.

## Remaining Delivery Gates

After this checkpoint, create two isolated Browser 0.3.27 builds, compare normalized delivered
payloads, retain one exact installer and sign metadata for those bytes. Then perform the frozen
cold-page/profile/lifecycle matrix in the clean Defender-enabled VM and measure public TLS.
Human permission, unfamiliar operator, physical second-PC and elapsed seven-day canary remain
separate observations. `G2-IDENTITY=FAIL` remains outside the profile-manager acceptance claim.

The lost historical `/profiles` response body cannot be reconstructed from a later reproduction.
Its original cause remains unknown; new diagnostics must capture the new candidate's safe code
and stage before asserting the result.

## Git And Environment Boundaries

Local product commits made for this checkpoint:

| Repository | Commit | Change |
| --- | --- | --- |
| MKTTool | `10ffb7c` | Replacement candidate pins and documentation |
| MKTTool | `38b5ed0` | Development js-yaml advisory fix |
| MKTTool | `a32c293` | Deterministic Windows script bytes, Relay repin and fixture cleanup |
| MKTBrowser | `c5c0b30` | Replacement pins, quarantine regression and documentation |
| MKTBrowser | `605e54b` | Reproducible Relay pin and normalization-helper source binding |
| MKTBrowser | `67e8f16` | Serialize packaging test files; preserve assertions and deadlines |

No push, Railway deployment, upload, candidate publication or operator promotion is part of this
checkpoint. MKTTool master pushes deploy production; accumulated local commits stay local until
the separate delivery gates are satisfied. Unrelated licence/fast-switch documents and untracked
historical logs in the root worktree are preserved and excluded from checkpoint commits.

The host had only 184 MiB free on E: and about 92 GiB on D: at preflight. VM was off. Run heavy
checks sequentially and remeasure memory before the next Browser packaging/VM phase; never close
user applications to make capacity. E: had about 118 MiB free at final validation; all new heavy
outputs remain on D:.

Both task database clusters are stopped and task databases dropped. Cleanup observes no task
database listeners, fixture processes, tagged TLS certificates or active temporary fixture
directories. Four old nine-byte installer fixtures and 93 Browser test directories were moved
intact to `r2/retained-pre-fix-fixtures` and `r2/retained-browser-test-fixtures`; their retention
receipts preserve ownership and paths. Tool caches and a historical npm debug log remain retained.

## Checkpoint Decisions

- Preserve the original mismatching archive and blocked receipt; fix reproducibility at packaging
  input normalization, then refresh final-source gates and exact artifact provenance.
- Serialize PowerShell-heavy test files to remove measured host contention while retaining the
  concurrent-wrapper regression and its original deadlines.
- Cover every observed opt-in skip through the dedicated machine gate and record both occurrences
  from installer and build logs; no unexplained skip counts as PASS.
- Close source/local-validation bookkeeping without advancing installer, VM or publication gates.

## Unresolved Questions

- No source/local-validation question remains open for this checkpoint.
- Installed cold timing, public TLS and real profile/proxy recovery require the next acceptance phase.
