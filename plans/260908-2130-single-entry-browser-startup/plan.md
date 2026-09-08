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
- [ ] Complete build B comparison, release identity reconciliation, and exact-installer acceptance.

## Execution boundaries

Main: desktop index + tray lifecycle. Companion worker: launcher helper, tests and packaging
resources only (not index). Web worker: MKTTool profile card/helper/tests only. Documentation and
Git preparation: existing Browser README, five existing MKTTool docs, and this root plan only.
Only one destructive-test process, validated loopback database ending _test. Prefer DB-free tests
for this change. Free RAM later fell to about 0.5 GiB; C: remains about 13.3 GiB, below the
existing VM reserves. Owner cannot free resources now: keep build B packaging and the guest
stopped. Build A is retained in the separate owned build root; never close user apps. Keep source, local, VM,
hosted, deployment and MSI acceptance evidence separate.

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
| New Browser package A | PASS / NOT ACCEPTED | Frozen quality 7/7 commands and installer packaging PASS. Retained installer SHA `25e8fc156c0769245623dfc7b082cd9f88886b3516fbca24ea9509114928e8a3`; normalized 129-file payload and clean-source provenance recorded. [Exact checkpoint](reports/browser-candidate-checkpoint.md). Old frozen installer unchanged. |
| Build B and clean VM | BLOCKED / OPEN | Fresh dependency install B PASS. Packaging B, payload comparison, VM startup/repair/uninstall and physical MSI acceptance not run because of resource reserves; owner cannot free them now. No upload, promotion or binary delivery. |
| MSI acceptance | OPEN | No physical-PC test of this startup change. |

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
