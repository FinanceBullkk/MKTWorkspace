# Runner Light Source Contracts Delivery

Verified 8 September 2026, 11:23 ICT. Plan: `../260908-0955-second-laptop-runner/plan.md`.

## Progress

| Commitment | State | Evidence |
|---|---|---|
| Probe review, delivery, inventory decision | Complete | Plan steps 1-3; historical r1 FAIL and corrected r2 PASS preserved |
| Bounded source-contract phase | Complete, 4/4 | Exact-SHA laptop execution; 20/20 tests PASS; cleanup PASS |
| Broad build/test/output step | Partial | Light test slice done; full build/toolchains/artifact readback OPEN |
| Full runner plan | In progress, 3/4 broad steps (75%) | No scope reduction to manufacture completion |
| Product release | OPEN | Runner execution is not clean-machine or operator acceptance |

## Verified Delivery

- Infrastructure commit `3e34e721c1a86d4457419136cd67afa8a310dcae`; branch
  `codex/second-laptop-runner-probe`. Main verified push/readback; job metadata matches SHA/ref.
- Local implementation validation: 43/43 PASS, zero skips. Independent review corrected inherited
  Git-selector handling before checkout; report retains original 42-test run plus new regression.
- [Run 34186377885](https://github.com/Techieslab-app/MKTBrowser/actions/runs/34186377885):
  preflight and source job `101935468119` successful; runner 21 `mkt-ci-windows`, machine `MSI`.
- Source receipt finished `2026-09-08T04:18:47.9622113Z`; source tree
  `2df326c8ba82f8da52c1c65fc5c8530074a1b117`; clean before/after, exact Node/source identities.
- Official portable Node 22.23.2, 35,683,585-byte archive SHA-256
  `1177b4137ba5adaa56354ae40f1080c7450e8ae09cecb47da459d1c52ac99f97`.
  Node executable SHA-256 `0d0f5e39f9f3d9587bc19f73eab3c2c9c4903fd02d6dbf9c853dd81b3d95fad4`.
- Fixed source tests 20/20 PASS, zero failures/skips/cancellations; eight commands exit 0,
  no timeout/output-limit failure, whole-tree termination confirmed; cleanup PASS.
  Free RAM 2.01 GiB / disk 67.38 GiB; 1.25/2 GiB minimums unchanged; heap 128 MiB / timeout 180s.
- Retained hosted `windows` job SKIPPED, no runner. Main verified artifacts API count 0;
  no GitHub artifact/cache upload, product artifact transfer or publication.

Local infrastructure tests and laptop source tests are different evidence; do not sum them.

## Evidence Provenance

Local base: `E:/MKTWorkspace/local-test-artifacts/second-laptop-runner-20260908/`.

| File | SHA-256 |
|---|---|
| `run-source-r1.log` | `cdbbcd0cd5ab8d92f1eb0d79a16100868623f71b95e7fe86eb0d4587b0c38daf` |
| `jobs-source-r1.json` | `ffe07a163b7619fb1cb29a1a3a7b77d2f2fe474b55c4b017743eac3f24977e6d` |
| `receipt-source-r1-from-log.json` | `2233f9ae10a54c0915190899b3256139cc04cb3bd80e7d69557df066428a40ae` |

The receipt is a local log extraction, not original MSI receipt bytes. Its SHA proves only the
extracted file. Receipt reports TAP SHA-256
`142533749d513d8e94b2adc5283e667c1cbdb69f94be39ca4e5dfe98b02fb053`; original TAP/receipt retained at
`D:/GitHubActionsRunners/MKTBrowser/_work/mkt-source-34186377885-1-e6fed9ec443f4d368dc89e7f8bae0770-evidence`.
This is not a full original-file output-transfer/readback receipt. Receipt explicitly records
`acceptance: OPEN`, `releaseReady: false`.

## Scope, Risks And Next Actions

Scope refinement: bounded dependency-free tests delivered first because measured capacity does
not establish a safe heavy build. No frozen product source, installer or release scope changed.

| State / issue | Owner | Next action / definition of done |
|---|---|---|
| Resolved: light runtime and capacity | Main runner owner | Preserve exact pins/guards; actual lane PASS retained, no global tool changes |
| Resolved: inherited Git selector bug | Main runner owner | Precheckout fail-closed rejection and actual PowerShell regression retained |
| OPEN since inventory: heavy capacity/tools | Laptop owner + main runner owner | Remeasure safe heavy budget; verify package/DB/build toolchains before enabling workload |
| OPEN: full build and output delivery | Main implementation agent | Complete remaining broad step with exact-source build and immutable artifact hash/readback outside GitHub storage |
| OPEN: MKTTool runner registration | Main runner owner | Bounded exact-SHA Tool execution receipt; coordinate jobs sharing MSI |
| BLOCKED/OPEN: supported product activation | Main release owner | Diagnose guest heartbeat stall; finish supported activation/lifecycle, repair/uninstall and cleanup on exact tuple |
| OPEN: acceptance beyond this host | Main release owner + operator | Real browser-page network, unfamiliar operator, second-PC product use and seven actual canary days |

Release-plan checkpoint independently records clean VM r2 PASS 9/9, bound wrapper PASS, child
exit 0; bound receipt SHA-256 `0a9d9fe3c44cc7c8985cf796f6690f517109bff56418f41626e77471e294a492`.
Original wrapper FAIL remains historical. Main continues repair separately; no final repair verdict
claimed here. Persistent MSI is not clean-machine acceptance.

Main agent: finish the implementation plan's remaining tasks and original release gates. This is
essential before any corresponding delivery/readiness claim; source-test success is not completion.

## Sync Scope

Swept all phase files in this runner plan: only `phase-04-light-source-contracts.md` exists.
Reconciled four checks; retained broad step 4 unchecked and plan `in-progress`. Native Task
tools unavailable; `ck plan parse` finds no phase table/IDs, so direct scoped file sync used.
Validation: checkbox/receipt/job assertions PASS; `ck plan validate --strict` reports 0 errors,
one existing-format warning (`no-phases-found`, overview uses broad-step checkboxes, not a phase table).
No Git operations or other plan edits by this PM task. Cross-product docs remain main-owner scope.

## Unresolved Questions

No owner choice pending for the completed lane. Unverified facts: safe heavy-work budget,
required package/DB/build tools, separate Tool-registration execution and original artifact readback.
