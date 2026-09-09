---
title: Separate Windows laptop runner
status: in-progress
priority: P1
effort: small
branch: codex/second-laptop-runner-probe
tags: [runner, windows, infrastructure]
created: '2026-09-08T02:55:00Z'
verifiedAt: '2026-09-08T04:23:40Z'
---

# Separate Windows Laptop Runner

Owner confirmed `admin-laptop` is a second physical machine and approved this route on
8 September 2026. Use ck:cook --auto and ck:git. The existing signed Browser candidate and
clean-VM acceptance remain separate and unchanged.

## Steps

- [x] Review a minimal manual self-hosted probe and dispatch path on an isolated infrastructure branch.
- [x] Implement, test, review, commit and push the probe; dispatch the selected Browser runner and verify the exact job identity.
- [x] Read actual identity/resources/toolchain/scratch results and decide the supported workload boundary.
- [ ] Implement suitable isolated source checkout/build/test and output transfer outside GitHub artifact storage, after prerequisites are verified; retain real execution and delivery receipts.

Tracker: 3/4 broad steps complete (75%). The bounded light source-contract lane is complete,
4/4 phase checklist items; the final broad step remains partial because full build, required
toolchains and real artifact transfer/readback are OPEN. Neither count is product release readiness.

## Scope And Safety

- Preserve frozen product commits Browser `eacd1cc` and MKTTool `b4ef969`, original checkouts,
  signed manifest and selected installer bytes. No default-branch integration merely to run a probe.
- Match explicit self-hosted Windows/X64 repository labels; unknown Linux/shared runners are not used.
- The first job inspects resources, tool availability and a unique disposable write location only.
  No dependency installation, build, application launch, credential access, full environment dumps,
  signing, deployment, GitHub artifact/cache upload, machine changes, or arbitrary command inputs.
- No checkout/actions/secrets in the executed probe; minimize token permissions and bound timeout/concurrency.
  A missing or queued job is OPEN; online registration alone is not execution evidence.
- Explicit `source-contracts` mode adds only an isolated checkout and pinned portable Node tests.
  Its contents-read checkout token is not persisted; inherited Git selectors fail closed before checkout.
  No package-manager installation, global tool replacement, heavy build or artifact publication.
- Existing hosted diagnostics must not run in probe mode. Keep their historical failures/skips.
- A persistent personal runner is not a clean machine. Serialize laptop jobs; never assume
  repository-local concurrency coordinates two separate runner registrations on one physical host.
- Before substantive build/test, validate clean dedicated inputs, supported toolchains and exclusive
  scratch/output ownership. Output paths/hashes and readback must be real, not declared success.
- The latest Browser failure was GitHub artifact storage quota, not proven compute-minute exhaustion.
  Changing the execution host does not repair artifact storage; never publish a new candidate implicitly.

## Validation

Review: 9/10, no blockers. Browser first, reuse registered `release.yml` on the isolated branch;
retain its existing `windows` job with a job-level false condition, with no secret mapping.
Required `expected_sha` enters via env, must be 40 hex characters and equal `GITHUB_SHA` before
scratch/tool execution. The dispatcher checks exact branch/SHA and runner identity after execution.

Inspect YAML dispatch/job gating, exact labels, permissions and action pins. Parse/test PowerShell
with the supported shell and validate negative/missing input behavior without claiming a local host
check ran on the laptop. Inspect real dispatch jobs and redacted summary logs; retain SHA/run links.

## Historical Probe Checkpoint

Browser infrastructure commit `c0e97ef2c168dfa7fc3907536d23178e07503130` delivered four files on
`codex/second-laptop-runner-probe`. Local mapped contracts passed 54/54; its final probe-test
rerun passed 23/23 without skips. Process-only shell correction
`0d9d3434d53972a6c9c846baddf22bd9b6e41499` is also pushed: fresh 25/25 regression tests,
lint/format/Node syntax/Windows PowerShell parsing PASS; review 9/10, no blockers. These suites
overlap; do not add their counts together or present them as laptop execution. No product rebuild.

Dispatch `34183122353` selected the exact ref/SHA and `mkt-ci-windows` runner 21 on machine `MSI`.
The sole inventory step failed before script entry: Windows PowerShell refused its generated
`.ps1` under the runner's effective execution policy. Retained hosted job was SKIPPED with no
assigned runner. Preserve this FAIL; no resource/scratch PASS was produced. The local real-shell
red/green regression confirmed process-only `RemoteSigned -File`; no persistent policy changed.

Corrected run `34183629510` PASS, job `101927526180` completed in 15 seconds on expected
`mkt-ci-windows`, runner 21, machine `MSI`, exact correction SHA/ref. Run/job metadata and logged
receipt cross-validated. The retained `windows` job was SKIPPED with no runner assigned, not a
hosted-check PASS. Main owner confirmed zero API artifacts; no GitHub artifact upload occurred.

| Actual inventory | Observed result |
|---|---|
| Hardware / OS | MSI Modern 14 B5M; Windows 11 Home Single Language 10.0.26200; 12 logical processors |
| Memory | 7.36 GiB total; 0.79 GiB free at measurement |
| Scratch / disk | D: 67.4 GiB free; unique scratch write/read/cleanup PASS |
| PowerShell / Node / Git | 5.1.26100.9168; Node v24.16.0; Git 2.54.0.windows.1 |
| Other tools on PATH | npm/Corepack present; psql, Yarn, pwsh and MSBuild not found |

Initial decision: enable bounded light checks only, with explicit Node 22 rather than default
Node 24. The 0.79 GiB reading was below the later light-lane threshold; the actual source job
remeasured capacity before execution. Missing-on-PATH tools are unverified, not proof that
software is absent from disk. Database contract readiness remains OPEN.

No additional repository dispatch is needed to rediscover this machine's hardware inventory.
Execution through the separate MKTTool runner registration remains OPEN; the Browser job does
not prove that registration or an MKTTool build. Full dependency provisioning, heavy build and
real artifact output-transfer implementation remain OPEN.

Evidence and hashes: [runner inventory receipt report](reports/pm-260908-1031-runner-inventory.md).
Original local test details: [mapped probe tests](reports/tester-260908-1006-runner-probe.md) and
[shell-loader regression](reports/debugger-260908-1021-shell-loader-regression.md).

## Completed Light Source Lane

Infrastructure commit `3e34e721c1a86d4457419136cd67afa8a310dcae` pushed/read back on the same
branch. Local infrastructure tests PASS 43/43, zero skips; independent review's inherited-Git-selector
bug fixed with pre-checkout rejection. These are local implementation tests, not laptop test totals.

Actual run [34186377885](https://github.com/Techieslab-app/MKTBrowser/actions/runs/34186377885)
PASS; source job `101935468119` PASS on runner 21 `mkt-ci-windows`, machine `MSI`, exact SHA/ref.
Its receipt completed `2026-09-08T04:18:47.9622113Z` and records:

| Bounded source execution | Result |
|---|---|
| Capacity | 2.01 GiB free RAM; 67.38 GiB free disk; unchanged 1.25/2 GiB minimums |
| Runtime | Official pinned portable Node 22.23.2; archive size/hash verified; no global Node replacement |
| Source | Clean before/after; tree `2df326c8ba82f8da52c1c65fc5c8530074a1b117` |
| Fixed source tests | 20/20 PASS; zero failures/skips/cancellations; 128 MiB heap, 180-second bound |
| Containment / cleanup | Eight commands exit 0, whole-tree termination confirmed; cleanup PASS |
| Hosted / storage boundary | Retained `windows` SKIPPED, no runner; main verified Actions artifacts API count 0 |

Receipt/TAP retained outside checkout on MSI. The local receipt is extracted from the GitHub log,
not copied original remote receipt bytes; its hash proves only that extracted file. No real product
artifact was transferred or published. Exact paths/hashes and provenance are in the
[delivery report](../reports/project-manager-260908-1122-runner-source-contracts.md).

## Risks And Next Actions

| State / risk | Owner | Definition of done |
|---|---|---|
| Shell-loader blocker resolved for this invocation | Main runner owner | r2 successful exact-SHA execution retained; r1 FAIL and process-only policy boundary preserved |
| Light-lane Node/capacity/Git isolation blockers resolved | Main runner owner | Exact-SHA Node 22.23.2 execution PASS retained; future runs retain capacity/identity/isolation guards |
| Heavy-work capacity unresolved since inventory | Laptop owner / main runner owner | Remeasure capacity after owner-controlled workload changes; establish a safe heavy-job budget; 2.01 GiB light-run reading is not heavy-build approval |
| Package/DB/build toolchains still OPEN | Main runner owner | Verify required tools and dependencies in isolated inputs; portable Node resolves only the dependency-free lane |
| Broad step 4 partial: build and real output transfer OPEN | Main implementation agent | Finish supported build plus immutable output/hash/readback outside GitHub artifacts; retain exact source/artifact receipts |
| Separate MKTTool registration unexecuted | Main runner owner | Run a bounded exact-SHA Tool job on its registration with actual identity/result receipt; coordinate physical-machine exclusivity |
| Persistent host is not clean-machine acceptance | Main release owner | Finish original release plan's exact installer/VM and remaining operator/network/canary gates independently |

Scope refinement: the final broad step now contains a completed dependency-free test slice;
heavy work remains deferred for capacity/toolchain validation. This adds useful execution without
changing frozen product scope or shrinking build/transfer acceptance. Main agent must finish the
remaining implementation plan tasks and original release gates before claiming delivery complete.

## Related Work

The original release plan is ../260908-0740-local-vm-product-release/plan.md. Its Phase 3/4 stay open.
The release plan's 11:14 ICT checkpoint records corrected clean VM r2 PASS 9/9, bound wrapper PASS
and child exit 0; receipt SHA-256 `0a9d9fe3c44cc7c8985cf796f6690f517109bff56418f41626e77471e294a492`.
The first wrapper FAIL remains historical. Supported activation is OPEN after a guest heartbeat
stall; repair/uninstall and cleanup remain separate verification, not closed by this runner PASS.
Network, unfamiliar-operator, second-PC product acceptance and seven actual canary days remain OPEN.
Frozen product HEADs remain `eacd1cc` / `b4ef969`; infrastructure delivery does not rebuild them.
Selected installer SHA-256 remains
`255c1a1c0128dabc4ef1fc3c51a864cc2dd2c790b98fb9af2ff462f885e06347`.

## Questions

No owner choice pending for the completed light lane. Unresolved: safe heavy-work capacity,
required package/DB tools, actual MKTTool-registration execution and full build/output delivery.
