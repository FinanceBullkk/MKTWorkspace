---
title: Separate Windows laptop runner
status: in-progress
priority: P1
effort: small
branch: codex/second-laptop-runner-probe
tags: [runner, windows, infrastructure]
created: '2026-09-08T02:55:00Z'
verifiedAt: '2026-09-08T03:31:30Z'
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

Tracker: 3/4 steps complete. Probe delivery and measured inventory complete; substantive workload
enablement not implemented. This count describes the runner slice, not product release readiness.

## Scope And Safety

- Preserve frozen product commits Browser `eacd1cc` and MKTTool `b4ef969`, original checkouts,
  signed manifest and selected installer bytes. No default-branch integration merely to run a probe.
- Match explicit self-hosted Windows/X64 repository labels; unknown Linux/shared runners are not used.
- The first job inspects resources, tool availability and a unique disposable write location only.
  No dependency installation, build, application launch, credential access, full environment dumps,
  signing, deployment, GitHub artifact/cache upload, machine changes, or arbitrary command inputs.
- No checkout/actions/secrets in the executed probe; minimize token permissions and bound timeout/concurrency.
  A missing or queued job is OPEN; online registration alone is not execution evidence.
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

## Execution Checkpoint

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

Decision: only bounded light checks are suitable to plan now; no substantive workload has been
enabled or executed. Heavy build remains disabled with 0.79 GiB free RAM. Browser needs explicit
Node 22 rather than the default Node 24. Missing-on-PATH tools are unverified, not proof that
software is absent from disk. Database contract readiness remains OPEN.

No additional repository dispatch is needed to rediscover this machine's hardware inventory.
Execution through the separate MKTTool runner registration remains OPEN; the Browser job does
not prove that registration or an MKTTool build. Source checkout, dependency provisioning,
substantive build/test and output-transfer implementation remain OPEN.

Evidence and hashes: [runner inventory receipt report](reports/pm-260908-1031-runner-inventory.md).
Original local test details: [mapped probe tests](reports/tester-260908-1006-runner-probe.md) and
[shell-loader regression](reports/debugger-260908-1021-shell-loader-regression.md).

## Risks And Next Actions

| State / risk | Owner | Definition of done |
|---|---|---|
| Shell-loader blocker resolved for this invocation | Main runner owner | r2 successful exact-SHA execution retained; r1 FAIL and process-only policy boundary preserved |
| Insufficient free RAM for heavy builds | Laptop owner / main runner owner | Remeasure capacity after owner-controlled workload changes; establish a safe budget before enabling a heavy job |
| Supported toolchains not ready | Main runner owner | Resolve explicit Node 22 and required package/DB tools, verify versions and hashes in isolated inputs; no global replacement by inference |
| Full source/build/output workflow absent | Main implementation agent | Complete remaining step with dedicated clean checkout, exclusive scratch, exact-SHA checks, bounded execution and real output/hash/readback outside GitHub artifacts |
| Persistent host is not clean-machine acceptance | Main release owner | Finish original release plan's exact installer/VM and remaining operator/network/canary gates independently |

Plan wording clarified: completed inventory/decision separated from unimplemented execution in
the final step. This prevents a passing probe from closing build or artifact-transfer work; no
new broad plan or change to frozen product scope. Main agent must finish this remaining step and
the original release plan before claiming the corresponding delivery complete.

## Related Work

The original release plan is ../260908-0740-local-vm-product-release/plan.md. Its Phase 3/4 stay open.
The referenced VM checkpoint has raw clean 9/9 with a FAIL wrapper; no corrected bound clean
result is established by this runner work. It cannot close human/network/canary acceptance.
Main verifier reconfirmed original product HEADs `eacd1cc` / `b4ef969` clean and infrastructure
remote HEAD `0d9d343`. Selected installer unchanged, SHA-256
`255c1a1c0128dabc4ef1fc3c51a864cc2dd2c790b98fb9af2ff462f885e06347`.

## Questions

No owner choice is pending for the completed probe. Remaining facts: safe heavy-work capacity,
explicit supported toolchains, actual MKTTool-registration execution and full build/output delivery.
