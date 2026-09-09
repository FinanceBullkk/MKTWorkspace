---
type: project-manager
date: 2026-09-08
status: in-progress
verifiedAt: 2026-09-08T02:35:49Z
---

# Local VM release implementation checkpoint

## Outcome

The owner selected local validation plus clean-VM acceptance as the release path. GitHub remains
source hosting and optional manual diagnostics. This policy change does not convert historical
Actions failures/skips into passes or waive product acceptance.

Four frozen product commits are now pushed to the exact reviewed feature heads; remote equality
and clean product worktrees verified at 09:28. Browser b quality, b/c packages/128-entry normalized
comparison, all MKTTool local stages and packaged host contract r2 (5/5) PASS. Signed candidate
staging/preflight PASS without publication. Pilot runtime binding and real synthetic ADMIN session
PASS; Next startup and authenticated transport remain OPEN. First clean-VM raw checks PASS 9/9,
but its bound wrapper is FAIL (`childExitCode: null`). No full clean-VM or ready-to-use claim.

This checkpoint update only reads evidence and edits plan reports. GitHub Actions is not a
substitute for local evidence; historical failed/skipped runs remain unchanged. No merge, deploy
or publication recorded. Source push is delivery only, not release approval.

## Progress against plan

| Phase | Current status | Completed evidence / remaining definition of done |
|---|---|---|
| 1. Release contract | Completed | Reviewed contract and owner decision; plan metadata/table and success checkbox reconciled |
| 2. Local release gate | Completed | Browser b quality, b/c normalized equivalence and all four MKTTool stages PASS. Main validation owner confirmed combined local evidence; runtime acceptance remains separate |
| 3. Supported CFT provisioning | In Progress | Signed exact b candidate staged and crypto/artifact preflight PASS; b/c provenance correction retained. Real supported ADMIN repair/update activation OPEN |
| 4. Exact VM delivery | In Progress | Host packaged contract r2 PASS 5/5; source pushed. VM raw 9/9 but bound receipt FAIL; corrected clean rerun, installed lifecycle/network/repair/uninstall OPEN |

Phase-file acceptance: 4/12 checked, 2/4 phases completed. Swept all four phase files. Phase 2's
combined criterion is now checked against the complete local evidence, not two-build evidence
alone. Phase 3 and Phase 4 in progress. No Phase 3/4 acceptance checkbox changed at this checkpoint.

## Frozen source and selected bytes

| Repository | Two commits pushed to reviewed feature branch | Frozen tree |
|---|---|---|
| MKTBrowser | `17e78e7ca95896c432e4d38ce69dfa43300c42d7`, HEAD `eacd1cc23b1a68537dee076e3899d4bf5c89dc5c` | `c91dd9e25b4abaa340a058cad12d996438aa7ec3` |
| MKTTool | `51bfe7c4e9dbbb9357e2b6a736b402938fc8bc1d`, HEAD `b4ef969b5cac9473da77ef3db1bbb941b46cdd9c` | `c7c8ab1ce2cddc0fe757316ef68b0474ace13108` |

Chosen directory: `D:\mkt-local-release-20260908\b\MKTBrowser\apps\desktop\release\installer`.
Do not rebuild or substitute c's installer after selecting b.

| Exact artifact | Bytes | SHA-256 |
|---|---:|---|
| `MKTBrowser-win-x64.exe` | 145066456 | `255c1a1c0128dabc4ef1fc3c51a864cc2dd2c790b98fb9af2ff462f885e06347` |
| `win-unpacked/resources/app.asar` | 51745263 | `0f1fca7db867ad3a5057ea9e7b36dcb2c54a7f7dff1a54cb741a60d709e9fcd3` |
| Pinned `MKTTool-Relay.zip`, v16 | 33342752 | `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` |
| `windows-control-contract.json`, v4 | 153 | `b3d0b07981958b5f972da83f32f50475c8d95ccca005ce72525d0714a275dcaa` |

Both b/c normalized manifests: 128 entries, digest
`eb783176c2a600022ca6b6bcae3a90dcbea0e8c87d4a9ebad66bf1e00694017d`.
This proves normalized payload equivalence, not byte-identical NSIS installers. The signed browser
artifact is the selected `app.asar`, not a fabricated Browser ZIP. Installer/ASAR hashes were
remeasured at the earlier artifact-selection checkpoint; this low-resource update reads receipts
only, not large artifact files. Other tuple fields match packaging evidence.

Signed manifest SHA-256: `bb65c942320ed214b9c837c9b2c6414983f3abc8914b6906acdf4f29a7891554`,
3,415 bytes. `candidate/preflight-staging-receipt.json` records seven PASS checks, no network writes
and no publisher invocation. Its additive `preflight-staging-correction.json` verifies final b/c
source evidence and identical normalized payload; signed manifest bytes remain unchanged. Read both
receipts; do not replace original provenance history with the correction.

## Implemented changes

- Browser quality runner executes fixed Node 22/Yarn 4.5.0 commands, records both repositories'
  commit/tree/lockfile identities, hashes logs/toolchain, and rejects missing/failed/tampered steps.
  Its receipt remains `acceptance=OPEN`, `releaseReady=false`, `testSkips=NOT_EVALUATED`.
- MKTTool runner separates quality, PostgreSQL contracts, security and Windows Relay stages. It
  selects explicit Node 22/24, isolates child environment, checks clean source before/after,
  bounds serial processes/logs, rehashes evidence, and emits `releaseApproved=false`.
- MKTTool database preflight accepts only explicit loopback targets, enforces dedicated distinct
  `_test` build/test databases and expected PostgreSQL major, and refuses existing schema objects.
  Full install stages require fresh checkouts without shared `node_modules` or local `.env` files.
- Successful command exit is not process-tree cleanup evidence. MKTTool records
  `cleanupConfirmed=null`; timeout termination is best effort and never passes a stage.
- Reviewed engine tuple is official CFT `152.0.7977.64`, archive size `202713690`, SHA-256
  `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004`. Wrong tuples and known-bad
  historical Relay/installer values remain rejected; no packaged unpinned fallback is enabled.
- Setup candidate ID is `20260908-browser-0.3.13-relay-16-cft`. Its immutable key is
  `MKTBrowser-20260908-browser-0.3.13-relay-16-cft.exe`; the old fixed installer object stays
  quarantined and is neither overwritten nor used as fallback.
- Compatibility publication preflights signed inputs, revocations, all five local artifacts,
  control contract and all remote keys before the first PUT. Conditional creation prevents
  overwrite; matching remote objects require full GET/hash verification; manifest publishes last.
- Existing install/pair/ADMIN `repairMissingState` remains the supported first-provisioning path.
  Signing and activation are separate from fresh CFT settings selection.
- Technical workflow entry points now use manual diagnostics. Retained Relay and production
  verification conditions account for dispatch; individual manual jobs can still have explicit skips.
- Source-free HTTPS/server/auth helpers live only in ignored evidence. They preserve frozen source,
  use a separate empty `_test` DB and a real synthetic ADMIN session, and do not approve `/setup`.
  Runtime binding and real auth now PASS. Next startup, guest requests and installed activation
  remain OPEN; helper syntax and synthetic session are not OAuth or human acceptance.
- Pilot review fixes bind the exact passing quality-r2 receipt to a prospective complete `.next` /
  `node_modules` snapshot. Auth/Next verify it; Next additionally requires a private successful
  fixture marker bound to config bytes, DB identity and exact owned user/session rows. Session
  output observes real post-validation DB expiry; initial one-hour cookie is not a server TTL.
- The Windows snapshot resolver uses native realpath; auth worker retains a bounded 300-second
  deadline. Parent corrected PostgreSQL identity rendering from `inet_server_addr()::text`
  (`127.0.0.1/32`) to `host(inet_server_addr())` in auth and Next helpers; product source unchanged.

## Verification observed at this checkpoint

| Check | Result | Limit |
|---|---|---|
| Browser b fixed quality commands | PASS 7/7 | verify:node, audit:production, test:installer, critical coverage, typecheck, lint, build; receipt retains acceptance OPEN |
| Browser b installer/runtime unit suites | PASS 403, SKIPPED 1 | Skipped live Windows process/listener/startup integration is OPEN, not a clean-machine pass |
| Browser b critical suite | PASS 121/121, no skips | Lines 91.48%, branches 84.23%, functions 91.39% |
| Browser b/c separate locked dependency installs | PASS 2/2 | Separate fresh Browser checkouts; actual Yarn/Corepack/helper bound before and after |
| Browser b/c separate package commands | PASS 2/2 | Exact Relay archive and explicit engine-release file; no VM claim |
| Browser b/c normalized comparison | PASS, 128 identical entries | Digest above; permitted normalization unchanged |
| MKTTool fresh security stage | PASS | Six-root scan 779 files; production audit PASS, no high/critical advisories and 0 lower-severity entries ignored |
| MKTTool runner unit fixtures | PASS 15/15 on each Node 24 and 22.23.2 | Prior focused evidence; not full fresh quality stage |
| MKTTool PostgreSQL quality, r2 | PASS 10/10 commands | 2097/2097 tests; critical run also 2097/2097, lines 83.15%, branches 75.89%, functions 81.64%; cluster stopped/password removed |
| MKTTool contracts stage | PASS 3/3 commands | Final local receipt, not installed-product evidence |
| MKTTool Windows Relay stage | PASS 4/4 commands | Dependencies/tests/build/verify; not managed Browser lifecycle evidence |
| Host packaged contract r2 | PASS 5/5 | Exact b packaged executable/ASAR; complete CFT test runtime. Fixture-only, installed activation OPEN |
| Signed candidate local preflight/staging | PASS 7/7 checks | Exact manifest hash above; b/c correction sidecar PASS; no network writes or public promotion |
| Pilot PostgreSQL 17.10 setup | PASS | Isolated `mkt_candidate_pilot_test`, port 55418; setup receipt records cluster running and production 5432 untouched; owned cleanup OPEN |
| Prospective pilot runtime binding | PASS, 42,782 entries | Main-owner execution; exact snapshot/binding hashes in pilot runbook; not retroactive quality-receipt coverage |
| Pilot auth r2 | PASS user/session/ADMIN/observer | Real Better Auth fixture; OAuth=false, humanGate=false, refreshable product session; cleanup OPEN |
| Pilot HTTPS / Next | HTTPS listener live per main owner; Next OPEN | Local 127.0.0.1:443 only; guest TLS and authenticated request evidence not yet observed |
| First exact-candidate clean VM | Raw PASS 9/9; bound FAIL | `childExitCode: null`; retained `vm-clean-first`; no clean-gate promotion until corrected fresh run |
| Installed supported activation and publication | OPEN | Host/fixture/partial VM results do not close these gates |
| Source-free pilot helpers after review fixes | PASS 7 JS syntax / 13 filesystem-only tests, zero skips; 11-file secret scan PASS | Includes bounded Next junctions and marker tampering; no auth, server, DB or TLS runtime execution by helper author; independent followup OPEN |

Evidence root: `E:\MKTWorkspace\local-test-artifacts\local-release-20260908`.
Browser receipts: `browser-b-quality.json`, `browser-b-quality-commands/quality-receipt.json`,
`browser-{b,c}-install.json`, `browser-{b,c}-installer.json`, `browser-{b,c}-payload.json`.
MKTTool receipts: `mkttool-security/receipt.json`, `mkttool-quality-r2/receipt.json`,
`mkttool-quality-r2.cluster-receipt.json`, `mkttool-contracts/receipt.json`, `mkttool-relay/receipt.json`.
Quality r2 SHA-256: `c40685f35c1a340cc88b026f395fb4432c2418bb36db7f9b07a421920015cdda`.
Contracts SHA-256: `ee9c85d0abf41687dd3e292cbaa2afab3844911410c9ed5f4e67f565464b54cc`.
Relay SHA-256: `2f2b49b0d446dab4dd9d75a8cd05086bc5b7a734c3c0902b804c6379f9230104`.
New evidence: `candidate-packaged-contract-r2.json`, `candidate-packaged-contract-r2-timings.json`,
`candidate/preflight-staging-receipt.json`, `candidate/preflight-staging-correction.json`,
`pilot-database-receipt.json`, safe `pilot-auth-r2.log`, `vm-clean-first/clean-raw-evidence.json`
and `vm-clean-first/clean-bound-evidence.json`. Raw clean receipt SHA-256:
`30c4b5e89df0f74bcd3c4992bed9f5a0d6dca74fced656264afe826b26efad2f`; failed bound receipt:
`e208dd89a5b3445da0aa4284004f0041588f3cbbf560cdca7eb9e2df21f7f909`.

## Preserved failures and scope adjustments

- Exploratory a's first packaging attempt remains FAIL: `MKT_BROWSER_ENGINE_RELEASE_FILE` was
  missing. Do not infer success from an EXE being left on disk. Its receipt/log remain retained.
- Exploratory a is not the two-build acceptance pair. b/c prospectively bind the actual Yarn CLI,
  Corepack executable/library/cache metadata and external command helper; a's earlier observations
  do not retroactively establish those bindings.
- First PostgreSQL helper attempt remains FAIL: inherited child pipes prevented expected process
  completion. Root corrected the external helper and started fresh r2. Original receipt records
  `clusterStopped=true`, `passwordRemoved=true`; this closes that attempt's cluster/password
  cleanup only, not the quality gate or generic descendant-process cleanup.
- Candidate-only test transport now uses guest-only hosts override and scoped test CA against an
  isolated local server. Reason: test exact production-bound signed URLs without publishing a
  candidate or exposing it to operators. Impact: local HTTPS transport is fixture evidence, not
  production-route, OAuth or human acceptance. No TLS bypass or product trust weakening authorized.
- First pilot binder attempt remains FAIL: real Next output uses three internal dependency
  junctions. Narrow helper fix records `.next/node_modules` links only to the same checkout's
  independently hashed dependency packages; other redirects/cycles rejected. No runtime binding
  output existed from the failed attempt; later main-owner binding PASS 42,782 entries.
- First packaged host contract remains FAIL: incomplete exe-only CFT fixture and restrictive
  extracted-runtime ACL prevented startup. Parent/reviewer probes identified the fixture defects;
  completed runtime plus bounded read/execute access enabled r2 PASS 5/5. No frozen payload edit.
- First pilot auth remains FAIL before database writes: PostgreSQL returned CIDR-form loopback
  text. Main owner verified canonical `host(inet_server_addr())`, corrected both external guards,
  then real auth r2 PASS. Initial failure is not overwritten or counted as a pass.
- First clean-VM wrapper remains FAIL despite raw 9/9 checks: child exit code missing. Parent
  requested normal VM shutdown; harness owner `finish_scoped_git` repairs exit capture before
  fresh clean rerun. No synthetic exit-code replacement or wrapper bypass is acceptance evidence.

No new source/helper edits, tests/builds, VM/DB commands or Git mutations executed by this
checkpoint task. Only existing active-plan files/report changed; unrelated root quota report preserved.

## Risks and next actions

| Risk / blocker | Owner | Concrete next action / definition of done |
|---|---|---|
| Local-gate validation gap resolved | Main validation owner | Phase 2 complete against all four MKTTool stages and b/c evidence; preserve receipt limits and remaining Phase 3/4 gates |
| Source or artifact drift after freeze | Main agent | Keep b bytes and both source identities unchanged; payload-changing edits invalidate downstream evidence |
| Signed first provisioning has remained open across sessions | Release / VM owner | Signing/preflight now PASS; complete real ADMIN repair on restored exact-candidate VM, retain supported updater receipt; no manually written pin |
| Local candidate transport not exercised | Main agent | Prove guest TLS trust, actual authenticated action/artifact requests and isolated DB use without public promotion |
| Pilot session active; server path incomplete | Main agent | Auth and runtime binding PASS; verify marker-bound Next, guest TLS/authenticated requests, then exact fixture session revocation/owned DB disposal |
| Packaged host fixture defect resolved | Main agent / reviewer | r2 PASS 5/5; retain first failure/probe receipts and fixture-only limitation; no installed-activation substitution |
| Clean-VM child-exit binding failed | `finish_scoped_git` / VM owner | Fix harness, retain raw/bound first attempt, rerun on fresh clean snapshot and require zero child exit plus bound PASS |
| Live-host integration unit test skipped | VM verification owner | Observe real process/listener/startup behavior on exact restored guest and retain its own receipt |
| Install/network/repair/uninstall and cleanup missing | VM verification owner | Exact installed managed lifecycle, bad-proxy refusal/recovery, page IP/DNS/WebRTC observations, repair/uninstall and owned cleanup receipts |
| Human, independent hardware and elapsed canary unavailable | Owner / operator | Record unfamiliar-operator walkthrough, second physical PC and seven actual canary days separately; no same-host or synthetic substitution |
| Source delivered; publication not performed | Main agent / release owner | Both exact feature heads pushed/verified; after remaining gates use immutable preflight/full GET/hash publication and report actual deployment state |

Read [local runbook](local-release-runbook.md), [pilot helper runbook](pilot-helpers-runbook.md),
and [verified source-push receipt](pm-260908-0928-feature-branch-push.md).
Main agent must finish the implementation plan and unfinished acceptance tasks before declaring
ready to use. Passing command counts are not completion of Phase 4.

## Unresolved questions

No new owner choice required. Remaining questions are runtime facts owned by the next actions,
not permission requests: corrected bound clean-VM result, authenticated transport, exact supported
activation, owned cleanup and release decision.
