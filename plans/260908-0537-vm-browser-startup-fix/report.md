---
type: debugger
date: 2026-09-08
status: completed
---

# VM Browser startup repair

Date: 8 September 2026. Scope: local Windows Browser startup only. No Actions runs, pushes,
PR mutations, deployments, publishing, engine repinning, vendor activation or real accounts.

## Diagnosis

The original packaged managed-profile launch fails even after the owner frees 8.07 GiB host RAM.
Chrome publishes a fresh DevTools endpoint and owns its exact loopback listener. The repeated
Windows process-table queries exhaust the shared 15-second readiness budget.

An instrumentation-only copy of the exact baseline package isolates the sequence:

| Step | Observed time |
| --- | ---: |
| Prelaunch PowerShell/CIM query, killed at its child timeout | 5078 ms |
| Retry of prelaunch query | 2891 ms |
| Chrome port file reappears | about 540 ms after spawn |
| First post-spawn process query | 4746 ms |
| Native listener ownership query | 73 ms |
| Remaining time for the mandatory process identity refresh | 1633 ms |
| Refresh eventually completes, too late | 3413 ms |

The diagnostic package is NOT acceptance evidence. Original baseline and diagnostic failures are
retained. Its trace also shows failed-launch cleanup starting a second shell while the timed-out
discovery promise is still running. The lifecycle failure timestamp includes this cleanup; it is
not a discovery timer. A separate stage-label defect reports `ownership` while waiting for the
second `process` snapshot.

The baseline RPC trace contains exactly one managed launch, a 25.4-second HTTP/tool-error response,
and no replay. Relay retry semantics and signed-ticket handling require no change for this cause.
The previous intermittent CFT version-inspection failure did not reproduce in the baseline; do not
claim its separate ten-second helper timeout was repaired by this change.

## Correction

- Reuse a short-lived PowerShell worker for serialized, fresh CIM queries. Never cache process
  records. Every process/ownership revalidation still reads the OS again.
- Retire the worker after ten idle seconds, on invalid/oversized output, on error or timeout.
  Bounded JSON frames contain process data only; requests are a constant, not executable input.
- Preserve the existing 5/20-second normal/cold query policy, exact path checks, UTF-8 output,
  native netstat, repeated PID/command-line/listener snapshots and 15-second operator readiness.
- Correct the process-refresh and final-ownership diagnostic stage assignment.
- Add worker tests to the normal installer suite and critical coverage protection without changing
  coverage thresholds, dependency versions, engine pins or product contracts.

## Local verification

| Check | Result |
| --- | --- |
| Original failure reproduced with freed RAM | FAIL receipt retained |
| Wrong-stage regression before correction | Expected FAIL |
| Per-query respawn mutation | Expected FAIL; reuse regression detects it |
| Focused process/discovery/worker tests | PASS 32/32 |
| Full Node 22.23.2 installer suite | PASS 387; SKIP 1 opt-in live-host installer integration |
| Typecheck and lint | PASS |
| Critical coverage | PASS: 91.48% lines / 84.23% branches / 91.39% functions |
| Unpacked directory build | PASS |
| Exact packaged unmanaged CFT contract on host | PASS 1/1; separate verifier budget, not VM proof |
| Managed proxy lifecycle on VM | PASS 2/2 complete runs, including a verified guest reboot |
| GitHub Actions | NOT RUN: owner reports exhausted quota |

The live Windows process test observes its exact synthetic child, then closes it and proves the
next query no longer reports it. Worker tests exercise concurrency, fragmented UTF-8, empty tables,
malformed/error/extra/oversized frames, timeout/late-response isolation, queued expiry, spawn/exit,
idle retirement and explicit disposal. Review checks confirm no cached-table acceptance, no new
request-code interpolation, no credential logging, and no reduction in ownership checks.

## VM evidence

VM: `mkt-phase5-clean`, 6144 MB / 2 CPUs, unchanged clean-with-SSH/Defender snapshot.
Host free memory before the candidate boot: 8.31 GiB. No concurrent builds/tests during VM smoke.

First candidate run: `2026-09-07T23:16:29.754Z` to `23:17:42.823Z`, exit 0.
Signed launch/close, reopen/close, closed-port proxy rejection while remaining stopped, and restored
proxy launch/close all pass on the same disposable profile. Successful full launch RPC times are
10,989 / 8,968 / 7,776 ms, including non-readiness work. All use the normal 15-second readiness
budget; no packaged-verifier override. The one intentional bad-proxy tool error is expected.

An independent exact-source query measurement on the guest records first query 2547 ms, fresh
queries 28 / 46 ms, and a fresh post-child-exit query 37 ms with the child absent. This isolates
the avoided shell-startup cost and proves the fast observations are not cached process records.

Cleanup at `23:20:02Z`: zero Browser/Chrome/Node processes, zero query workers, zero smoke roots,
zero temporary firewall rules, no proxy handoff. Boot identity before the planned repeat:
`2026-09-07T23:14:28.0384020Z`.

Post-reboot candidate run: `2026-09-07T23:21:44.304Z` to `23:22:42.127Z`, exit 0.
The same complete signed lifecycle and broken-proxy refusal/recovery pass again. Boot identity
changes to `2026-09-07T23:20:17.5000000Z`, confirming a real guest reboot rather than an app restart.
Successful full launch RPC times are 13,600 / 6,816 / 13,021 ms.
Cleanup at `23:23:43Z` again reports all process/worker/root/rule counts zero and no handoff.
Four completed one-shot scheduled tasks are removed, then the VM is shut down normally.

## Artifact identity

- Source base: Browser `2c68a6d9ac4376a28699027ea882370baa236c40` plus the scoped working-tree fix.
- Candidate EXE: `697191a3db9e35f368f841639139f762b923ff7217d0acfdd492b2b183d29bf5`.
- Candidate ASAR: `a3047fc0b03ead9121b8f11dcea25ffea86a3d7a33f411c174eac535e6d06bc5`.
- Full candidate ZIP: `9240136bb3ef676d89ec8d6b56397d16e303f56cbc3b16aa8fa837e76f8cbe94`.
- CFT unchanged: `152.0.7977.64`, EXE
  `79832d1e60cbad9323c07339f9608bc0ce93cb9242b9b5481c04a0c536720980`.
- Managed smoke unchanged: `f2cd971e631fb883cc3b8ec0c882a95ca7663ef5024c9bdc761e9fcb37803842`.
- Baseline ASAR: `7a5af62dceb32315e9401380f1fb67eeae9566da23700f3218124edd14d9d930`.
- Instrumentation-only ASAR: `66778e9aa89e67ac8142cf07b76d3a5d11aa7f45bb085a0847fdcd6bbe63e0fb`.

Raw bounded receipts are ignored under `local-test-artifacts/vm-browser-startup-20260908/`.
Proxy credentials and observed IPs do not belong in this report or Git. The original proxy source
is read-only; generated handoffs are restricted, transferred and consumed/deleted.

## Remaining boundaries

This work does not make an antidetect/identity claim, reopen Lane C, erase `G2-IDENTITY=FAIL`, approve
real-account use, or promote a local/VM result into hosted CI. Existing release/installer tuple,
human operator, second-PC and canary gates remain separate. The older installer install/repair/
uninstall passes are historical and do not attest an installer for this new directory package.

## Local handoff

Source changes and this report remain uncommitted. Inspection found the machine's post-commit hook
dispatches a push-shaped local automation event. No commit is necessary for the requested repair;
leave that hook/global configuration unchanged and avoid triggering unrelated automation.
No push, PR update, Actions run, deploy or publish occurred.

The local generated ASAR extraction and negative-test scratch trees remain inside the ignored
evidence directory: recursive removal was policy-blocked. They contain no proxy handoff or
account data; executable scripts and failure receipts remain available for reproduction.

New installer/release verification and the hosted CI gate remain future work, not claimed PASS.
No unresolved owner question blocks this VM startup fix.
