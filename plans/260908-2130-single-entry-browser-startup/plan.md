---
title: Single-entry Browser startup
description: Coordinate the installed Relay and Windows tray lifecycle while reporting truthful Web readiness.
status: in-progress
priority: P1
effort: 4h
branch: codex/single-entry-browser-startup
tags: [browser, relay, windows, readiness]
created: 2026-09-08
---

# Single-entry Browser startup

## Scope and approval

Owner approved opening MKT Browser as the single entry point, coordinated installed Relay
startup, Windows background/tray behavior with explicit Quit, and truthful Web profile errors.
Execution follows ck:cook/ck:fix autonomous mode under standing authorization. No database,
device ownership, signed-ticket, engine, proxy isolation, or posting-scope changes.

## Pre-change diagnosis

- Browser window-all-closed currently quits on Windows; no tray or single-instance handling.
- Both installers create independent Startup links; Browser does not start an absent Relay.
- Web profile card labels every rejected profile-list request as an old Relay, including v16
  Browser-offline responses. Existing health has a distinct Browser readiness contract.

## Reviewed implementation contract

- Normal Windows Browser launch checks/starts only the installed current-user Relay through
  fixed owned paths and existing conflict checks. Never kill conflicts, rewrite configuration,
  enroll, consume tickets, or relaunch after retirement in a background restart loop.
- One Browser process per normal data root. Reopening shows the existing window and can retry
  companion startup. Disposable data roots and compatibility smoke stay isolated.
- Closing the normal Windows manager window hides it only when a usable tray exists. Tray can
  reopen it or explicitly Quit MKT Browser. Quit retains graceful profile/MCP cleanup; Relay
  remains independent for vault operations. Never hide a window if tray creation fails.
- Windows login may start Browser minimized to tray through an explicit installer flag.
- Combined install takes over only the verified canonical Relay Startup shortcut, after saving
  Browser's background shortcut. Preserve standalone desktop entry and restore standalone login
  startup when Browser uninstall retains independently installed Relay. Foreign links fail closed.
  If standalone repair recreates a direct Relay login entry, an absent Relay is not auto-spawned:
  direct the operator to combined repair. Named mutex/in-flight dedupe serialize our launcher only;
  arbitrary manual concurrent starts of the legacy Relay executable remain unsupported, not proven
  safe. Wait for exact-path starting processes and never spawn to resolve timeout.
- Acquire Browser single-instance lock after canonical data-root selection and before state init;
  queue activation until window exists. Explicit Quit and OS session end bypass tray interception;
  graceful cleanup is once-only. No production launch behavior in disposable/smoke runs.
- Web verifies the actual create-profile version floor; current Relay runtime/transport errors
  get their own safe cause and next action, plus retry. Unknown is never Ready or outdated.
- No rebuild/overwrite of the frozen installer. A changed Browser payload requires a new
  candidate with its own packaging/acceptance evidence before installed-user delivery.

## Phases

- [x] Scout and diagnose startup, installer, health, and profile-card paths.
- [x] Review plan and finalize file ownership (reviewer race/uninstall/shutdown findings incorporated).
- [x] Implement Windows lifecycle and installed Relay coordination with regression tests.
- [x] Implement Web readiness/error/retry fix with regression tests.
- [x] Run targeted local tests, typecheck, lint, and independent review.
- [x] Update docs; commit/push scoped source and verify the Web implementation deployment.
- [x] Package build A and record exact environment/release blockers; acceptance remains OPEN.
- [x] Complete build B comparison and release identity reconciliation (9 September addendum).
- [x] Complete exact 0.3.17 VM lifecycle, supported activation, repair/uninstall and independent Relay acceptance.
- [x] Complete owner-run MSI acceptance with supported private activation access.
- [x] Publish the exact accepted bytes, deploy approved metadata, and verify authenticated full download.

## Ready-To-Use Continuation - 9 September, 03:30

### Current continuation - 9 September, 09:08

Exact 0.3.16 is rejected for activation after browser-page ipapi returns a Cloudflare challenge.
Its clean install, native nonblocking notice/MCP, empty-session tray and cold-login passes remain
valid for that exact artifact. Browser 0.3.17 replaces the browser IP observer with ipify, retaining
independent proxy-IP equality and failing closed on invalid bodies and redirects. The same CFT and
proxy reach ipify using normal TLS in a separate diagnostic; this is not installer acceptance.

- [x] Capture exact 0.3.16 smoke failure and distinguish remote HTTP 403 from TLS failure.
- [x] Verify alternate browser-page IP measurement against the independent Node proxy probe.
- [x] Run nine failing regressions before the correction, then pass all 12 smoke regressions.
- [x] Revoke the synthetic session, stop owned fixture services, shut down VM, preserve failure snapshot.
- [x] Freeze 0.3.17 / Relay 17, run independent A/B and sign sequence 21 metadata.
- [x] Repeat exact-installer VM activation, lifecycle, repair/uninstall and retained Relay acceptance.
- [x] Deliver new MSI checklist and exact installer; record owner-run results before publication.

Historical continuation follows:

Owner requested closing the remaining usability blockers and authorized foreground VM mouse use.
Keep exact A. First bind a fresh isolated candidate-only HTTPS/auth fixture to signed sequence 17
using the unchanged quality-verified MKTTool runtime; never reuse an expired enrolled device/session
or inject an engine pin. Verify supported enrollment and ADMIN repair through the installed Relay.
Then test real profile/proxy lifecycle, tray reopen/Quit and retained independent Relay behavior.
Only after VM acceptance hand exact A and its checklist to the owner for physical MSI testing.

- [x] Prepare fresh private fixture, exact sequence-17 artifacts and verified runtime binding.
- [ ] Validate sustained guest clock/Defender, complete supported enrollment and signed CFT repair.
- [ ] Close normal profile/proxy and tray/ownership acceptance with observed evidence.
- [ ] Deliver the frozen MSI test package; record human results before publication.

### Activation Defect - 9 September, 04:10

Exact A/Relay v16 is rejected for promotion: signed sequence 17 stages, then the Windows process
stop command exits 1 when runtimes are already absent. VM reproduction and two new actual Windows
process regression cases fail before the fix. After the fix, all 450 Relay tests, typecheck and lint
pass. Preserve A and sequence17 receipts. Build replacement Relay/Browser payloads under new versions,
freeze a new tuple, then repeat VM and physical MSI acceptance. No manual engine-pin injection.

- [x] Reproduce the activation stop defect and validate the source correction.
- [x] Correct SEA checkout-path variance; Relay A2/B2 EXE, ZIP and metadata match byte-for-byte.
- [x] Verify retained Relay 17 archive through actual packaged cryptographic/enrollment/retirement checks.
- [x] Freeze replacement Relay and Browser versions and build independent A/B payloads.
- [x] Sign and verify replacement sequence 18 metadata and all five artifacts.
- [ ] Complete replacement VM activation/lifecycle acceptance (clean install 9/9 PASS).

Replacement source checkpoints: MKTTool `a2a321f`, Browser `cea4611`. Retained Relay is built from
`78a8a84`; later MKTTool edits only reconcile metadata/tests/docs. Preserve that separate provenance.
First full quality attempt on `41f73d6` failed five stale-v16 test fixtures (2,160 tests passed).
Corrected final Web quality passes 2,168/2,168 tests without skips; security and database contracts
pass. Browser quality passes seven commands; A2/B2 delivered payloads match across 129 normalized
files. Signed sequence 18 and exact installer are frozen; see the replacement build checkpoint.

Replacement clean VM install passes 9/9 with verified source/tuple/receipt binding. The private CA
launcher initially stopped before mutation because its limited token cannot inspect the installer-
started elevated Relay. Preserve R3 FAIL evidence; R4 uses the matching elevated context with exact
PID/start-time/owner/hash guards. This fixture preparation is separate from product acceptance.

### Engine Cache Defect - 9 September, 05:40

Replacement 0.3.14 / Relay 17 is rejected for promotion. Supported signed sequence 18 completed
staging and stopped owned processes successfully, then reached smoke. The exact packaged Browser
failed: Relay had installed the pinned CFT runtime and `.mkt-runtime.json`, but Browser required a
separate `current.json` download index. It attempted an unauthenticated download of the signed
candidate URL and received HTTP 401. A bounded diagnostic captured this exact error without changing
protected compatibility state; it is not acceptance evidence. Failure snapshot:
`6bec61e3-f4f2-42c6-942e-d91bdc147417`. Synthetic session revoked; fixture services/database stopped;
VM shut down. A private test CA remains only in the preserved failure snapshot until clean restore.

- [x] Isolate and reproduce the missing-cache-index failure on the exact packaged Browser.
- [x] Validate Browser recognition of the already activated runtime against the signed engine version.
- [x] Freeze 0.3.15 with the unchanged byte-identical Relay 17; build and compare a new A/B pair.
- [x] Use a currently verified observer proxy for fresh VM acceptance; original proxy returned RateLimited.
- [ ] Complete exact VM lifecycle/repair/uninstall, then deliver the MSI checklist and record its result.

Cache correction committed as Browser `6f4b771`, Web candidate metadata `e25f6ce` before new freeze.
Four focused tests include the actual bootstrap and explicit Retry bypass; 84 metadata and five
version-coherence tests pass. Critical coverage passes at 91.57% lines, 84.57% branches, 91.43%
functions; the new cache module has full coverage. Initial coherence run caught three stale 0.3.14
assertions; corrected exact 0.3.15 assertions pass without weakening. New isolated build/evidence
root: `D:/mkt-engine-cache-fix-20260909`. These are source checks, not installed acceptance.

Fresh audit then found new production advisories in Next.js and sharp. Web `b614ba2` upgrades
Next.js/ESLint config to 16.3.3 and locks sharp 0.35.4; frozen security now passes. New Web quality
and database-contract runs pass (2,168/2,168 full tests and coverage, zero skips). Browser builds remain at `6f4b771`, with build-sibling
`e25f6ce`; fixture runtime will record `b614ba2` separately and verify candidate metadata equality.
Do not reuse the vulnerable prior Web runtime for acceptance. No source push or deployment yet.

0.3.15 A/B comparison passes across 129 normalized files, zero differences. Signed sequence 19
and five artifact hashes pass; clean VM installation passes 9/9 with exact receipt binding.
During supported enrollment, VirtualBox paused with `DrvVD_DISKFULL`: host C: reached zero free
bytes. Preserve the active guest and disk-full log; recover host space before resuming. The last
Confirm this PC click has an unknown result until readback. Activation/profile/tray acceptance
remains OPEN. See `reports/engine-cache-build-checkpoint.md` for current tuple and evidence.

## Execution boundaries

### Browser IP Observer Candidate - 9 September, 10:10

Current candidate is 0.3.17 / Relay 17, sequence 21, installer
`6d07fd4ef529b3505a8de385c7d0d3214258e8a020abbd00de51e8f9810a4ca8`.
0.3.16 is rejected because its Chromium observer receives an ipapi Cloudflare challenge.
0.3.17 uses an IP-only observer, still compared against the independent proxy probe.
Source regression, frozen quality/security/contracts, independent 129-file A/B comparison,
and signed metadata all pass. Exact clean installation passes 9/9. Cold login starts the
Browser tray/MCP and Relay at normal priority with Defender enabled. A guest transport/AHCI
stall recovered after soft shutdown; that interruption is not a product PASS.

- [x] Freeze 0.3.17 and retain independent A/B comparison, metadata and quality receipts.
- [x] Verify clean install, normal-login Browser/Relay startup, and read-only MCP responses.
- [x] Enroll disposable PC and bootstrap its operator key through supported Web/Relay UI.
- [x] Complete sequence-21 signed activation; exact hashes, installed artifacts and post-activation smoke verified.
- [x] Verify native active-profile close-to-tray, tray reopen, shortcut reuse and Quit retaining the same Relay.
- [x] Resolve visible-manager launch contention with separately measured two-vCPU acceptance; complete proxy failure/recovery plus unanswered notice.
- [x] Verify uninstall 15/15 on the exact activated installer; retain initial harness race separately.
- [x] Verify repair 13/13 from a clean restore, with exact receipt and installer hashes.
- [x] Verify independent Relay retention 21/21 from a separate clean restore.
- [x] Finish final clean snapshot readback and leave VM powered off.
- [x] Prepare exact MSI installer, checklist and read-only preflight; request owner machine state.
- [x] Record physical MSI preflight: exact hash; Browser 0.3.1; independent Relay present but health unavailable.
- [x] Enable MSI Defender protection, start Relay v16, and read clean compatibility state 0.
- [x] Install exact 0.3.17 candidate normally and verify Browser/Relay/version/ownership readback.
- [x] Reconcile MSI compatibility state and private activation access; record owner results before publication.
- [x] Publish immutable installer, verify production tuple, and read the complete authenticated download.

The private fixture uses the exact quality checkout, guest-only CA and isolated database.
Sequence 21 activation passes at 03:11:39Z. Native tray/shortcut/active-profile Quit passes at
03:43:53Z. Visible-manager launch times out on one virtual CPU; hiding the manager makes the same
profile launch successfully. Its GPU process consumes 2.828125 CPU seconds in a 5-second visible
sample, versus zero hidden. A separate two-vCPU trial follows normal guest shutdown to distinguish
VM resource contention from product failure. That trial passes two native visible-manager launches
and proxy failure/recovery; failed one-vCPU launches stay recorded. Exact repair 13/13, uninstall
15/15 and independent Relay retention 21/21 pass with bound receipts. Final clean guest/host
readback passes at 04:30:37Z; VM is powered off and fixture listeners are absent. Physical MSI
acceptance later passed with the exact installer, including repair, uninstall, retained Relay and
reinstall. Publication and authenticated download also pass; remaining unfamiliar-operator,
second-independent-PC and seven-day canary evidence stays OPEN.
Current evidence: `reports/ip-observer-build-checkpoint.md` and
`reports/release-acceptance-20260909.md`.

### Blocking Relay Dialog - 9 September, 07:30

0.3.15 is rejected: native Check Relay opens synchronous `dialog.showErrorBox`, freezing MCP and
tray handling until OK. MCP initialize timed out at 12,287 ms while open and returned in 351 ms
after dismissal. Keep ownership checks intact. Delayed empty-session Quit readback confirms no
Browser process/control port and retained Relay; active-profile Quit remains OPEN. The synthetic
session is revoked and guest ACPI shutdown requested before building. Details and storage-recovery
receipts are in `reports/engine-cache-build-checkpoint.md`.

- [x] Reproduce and record main-thread blockage tied to the native Relay failure dialog.
- [x] Fix nonblocking, deduplicated notification and validate pending-dialog lifecycle regression.
- [x] Commit and freeze replacement version, metadata, and independent A/B payloads.
- [ ] Repeat clean exact-installer VM activation/lifecycle/repair/uninstall acceptance.
- [ ] Deliver the accepted bytes and physical MSI checklist; await owner results before publication.

Browser `a5a6732` and Web metadata `3e5ecd9` committed locally before the 0.3.16 freeze; no push or
deployment. Browser notification/companion/tray tests pass 24/24, version coherence 5/5, full lint
and typecheck pass. Web metadata 67/67 and full lint pass. Source review retains the exact ownership
checks and observes that dialog lifetime is independent of the Relay in-flight guard. New root:
`D:/mkt-relay-notice-fix-20260909`. Retired isolated dependencies removed with clean-source and
retained-installer readback; original artifacts remain. Rejected guest snapshot
`b23b00c2-e8a3-40bf-b3c6-e2d250979dfb` preserves 0.3.15 diagnostics before moving its offline disk.

0.3.16 A/B reproduces all 129 normalized files. Exact A SHA-256:
`fd2617b06be6ba5de0b8797d07d528c81537e60cacb1d25aefad2b44c9863eb4`.
Signed sequence 20 and all five artifacts verify; fresh activation from 0 only. Web security PASS;
initial full Web quality FAIL on four database timeout/cleanup cases; unchanged quiet-host R2
passes all commands and 2,168/2,168 tests and coverage without skips. Clean VM install passes 9/9.
Native unanswered Relay notification no longer blocks MCP (121 / 6 / 1,330 ms), tray access or
manager reopen. Empty-session Quit settles with no Browser processes/control port and retains
the same Relay PID/listener. Cold login and supported sequence-20 activation continue; active
profile, repair/uninstall and physical MSI gates remain OPEN. See
`reports/nonblocking-relay-build-checkpoint.md` for current authoritative state.

Main: desktop index + tray lifecycle. Companion worker: launcher helper, tests and packaging
resources only (not index). Web worker: MKTTool profile card/helper/tests only. Documentation and
Git preparation: existing Browser README, five existing MKTTool docs, and this root plan only.
Only one destructive-test process, validated loopback database ending _test. Prefer DB-free tests
for this change. The 8 September low-resource pause ended after reserves were remeasured and
build B completed with the guest off. On 9 September the owner requested background work while
using the host; foreground VM interaction was subsequently authorized for tray checks. Build A is retained in the separate
owned build root; never close user apps or run heavy builds while the VM runs. Keep source, local,
VM, hosted, deployment and MSI acceptance evidence separate.

## Evidence

| Gate | Status | Evidence and limit |
|---|---|---|
| Browser lifecycle | PASS | 11 local lifecycle tests; canonical-root explicit arguments cannot bypass the normal instance lock. |
| Browser source quality | PASS | Fresh full lint and typecheck; independent re-review has no findings after three P2 corrections. |
| Browser dependency audit and critical coverage | PASS | Production audit returned no suggestions. Critical coverage: 121/121 tests, zero skipped, 14 protected modules; 91.48% lines, 84.23% branches, 91.39% functions. Read-only simplification review found no warranted changes. |
| Browser installer source suites | PASS / OPEN | Full `test:installer` command exited 0 in root session 91088. Real Windows machine integration was skipped and remains OPEN; this did not build or install an artifact. |
| Cross-repository test input | PASS for named input only | `MKTTOOL_ROOT=E:/MKTWorkspace/local-test-artifacts/startup-frozen-sibling-b4ef969b`, authentic MKTTool source `b4ef969b5cac9473da77ef3db1bbb941b46cdd9c`. Current MKTTool master lacks that candidate metadata; no implicit fallback or master-coherence claim. |
| Web source quality | PASS | Fixture typecheck and stale setup-link contract repaired; fresh typecheck and lint passed. Five DB-free files: 47/47 PASS. Actual Chromium fixture passed exact outdated download href, rendering, retry, recovery, and no-mutation checks; synthetic fixture is not MSI acceptance. |
| Initial hosted Web gate | FAIL, corrected by later run | PR CI `34237885978`: stale setup-link source-location assertion after extraction. 1 failed / 2,122 passed / 17 skipped. Exact helper/rendered-href test migration subsequently passed locally and on CI; no dummy literal or weakened assertion. |
| Documentation | PASS with residual warnings | Six existing documents updated; scoped diff checks passed. Validator confirmed 131 links, with heuristic code/config warnings and pre-existing README/changelog size debt left scoped out. |
| Source commits and pushes | PASS | Browser `5ff43b27f54d754388acc2c04005216e3db5b426` and Web implementation `e540db163bc264748a065167b4b0683b7b17ba65` plus test correction `9b63442b74a8b22b84ac47c4a4958659b991f49c` pushed to separate repositories' `codex/single-entry-browser-startup` branches. Explicit staging, scoped secret scans, diff checks; Browser main unchanged. |
| Web PR CI | PASS | PR [#70](https://github.com/Techieslab-app/MKTTool/pull/70), corrected CI `34244893863` and secret scan `34244893848` SUCCESS. Full tests and coverage each: 2,124 passed / 17 skipped, 228 files passed / 3 skipped. Coverage: 81.01% statements, 76.59% branches, 82.34% functions, 83.59% lines; Next build PASS. PR-only deploy verification skipped, not deployment evidence. |
| Web merge / implementation deployment | PASS | PR #70 merged to `8e80fcffe9f6488310c058743df70b1aa3bb95d5` after all five applicable checks passed. Railway `e68597cb-4679-4115-85cf-605baff7d6d9` SUCCESS for that exact commit; GitHub deployment `6331220213` success at 15:37:40Z. Health at 15:38:22Z: HTTP 200, ready, database/release metadata/R2 OK, Relay 16. Post-merge CI `34245676858` SUCCESS with the same full-test/coverage counts; Relay executable post-merge is policy-skipped, retaining separate PR PASS evidence. |
| Final Web documentation sync | DEPLOYED | Two existing docs updated at `2a794a705e76f5a03a0ae47a99829b10253933a3`, pushed to master and feature branch; secret scan `34246339716` SUCCESS. Railway `7d41a501-178d-49d0-9306-c191e4cc941b` and GitHub deployment `6331339946` SUCCESS for that exact docs-only SHA. Health 15:42:55Z: HTTP 200, ready, database/release metadata/R2 OK, Relay 16. Behavioral CI remains the separate `8e80fcff` result. |
| Accepted Browser package A | PASS | Retained Browser 0.3.17 / Relay 17 installer is 146,047,736 bytes, SHA `6d07fd4ef529b3505a8de385c7d0d3214258e8a020abbd00de51e8f9810a4ca8`; exact file was not rebuilt after acceptance. |
| Build B and release identity | PASS | 129 normalized payload files, zero differences; candidate `20260909-browser-0.3.17-relay-17-browser-ip-observer-cft`; signed compatibility sequence 21 binds CFT 152.0.7977.64. [Current acceptance](reports/release-acceptance-20260909.md). |
| Clean VM and lifecycle | PASS | Signed activation, profile/proxy launch, active-profile tray close/reopen, shortcut reuse, Quit, repair, uninstall, independent Relay retention, and cleanup passed with bound receipts. |
| MSI acceptance | PASS | Owner-operated physical MSI passed install, Windows restart/Relay startup, activation, profile/tray/Quit, repair, uninstall, independent Relay retention, and reinstall with state preservation. |
| Publication and production | PASS | Immutable R2 conditional create and full-byte read-back passed; production deployment `54091ee1-f46e-4b8d-8bdb-d6d111ba5cd7` serves complete approved metadata; authenticated full download returned HTTP 200 and the accepted size/SHA. |

## Integration dependencies and rollback

- MKTTool startup Web changes started at the then-production `5d059cd8`; the focused
  Web PR need not merge unrelated release infrastructure. Master push/PR still triggers CI and
  master source integration can trigger Railway independently of Actions. Merge only after checks
  pass, then verify the exact deployment; do not describe merge alone as deployed.
- Browser source branch starts at `eacd1cc2`; product `origin/main` is five commits behind, while
  local `master` tracks the upstream baseline. Push the startup branch only; do not merge Browser
  main or trigger speculative hosted Windows builds during this task.
- Optional Browser workflows check out MKTTool `master`, but candidate metadata is in the separate
  two-commit release branch (`51bfe7c`, `b4ef969`). That branch diverges from master and needs its own
  reviewed integration before those hosted coherence gates can pass. Never copy candidate data
  into Web master or widen this PR solely to silence a test.
- Source rollback: revert the scoped startup commit(s), preserving unrelated history. Web rollback
  requires a verified prior deployment/source state. Binary rollback continues to use the existing
  signed exact-tuple controls; source integration neither changes nor promotes the frozen installer.
