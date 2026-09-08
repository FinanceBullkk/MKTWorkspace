---
title: Diagnose and repair VM browser startup
status: completed
created: 2026-09-08
priority: P1
effort: medium
branch: codex/profile-manager-scope
tags: [browser, windows, startup]
---

# VM browser startup repair

## Scope

Owner requests fixing the startup failures from the
[finishing pass](../260908-0334-profile-manager-readiness/finishing-pass-report.md).
Local/VM work only: NO GitHub Actions, reruns, PR updates, or pushes that trigger CI.
Keep the 15-second operator budget, ownership/freshness checks, proxy fail-closed behavior,
engine pins, signed tickets, and product/release boundaries unchanged unless a measured defect
requires a reviewed correction. No real accounts or new identity research.

## Phases

- [x] Scout Browser discovery and Relay retry call chains; preserve original failure receipts.
- [x] Measure guest metadata, process/listener queries and exact packaged managed launch.
- [x] Confirm cause, add a failing regression and implement a minimal correction.
- [x] Run focused tests, local checks, packaged/VM reproduction and cleanup; review changes.
- [x] Record before/after evidence, remaining gates and local delivery without running Actions.

## Baseline

- Browser checkout `2c68a6d9`; existing candidate built from `ad0c7182` differs only in docs/CI.
- MKTTool checkout `c408315a`; final fixture bundle `f2cd971e631fb883cc3b8ec0c882a95ca7663ef5024c9bdc761e9fcb37803842`.
- Prior attempt 1 lifecycle log: `LAUNCH-FAILED` / `DevToolsPortDiscoveryError` at 17.63 s;
  pending port is null until full ownership discovery succeeds. That timestamp includes cleanup.
- Prior attempt 2: CFT version inspection failed before launch (10-second helper child deadline).
- Separate exited-process cleanup race was corrected in the final fixture; not a confirmed
  cause of either earlier failure.
- User freed memory again: host free 8.07 GiB. Start the same 6 GB / 2 CPU disposable VM;
  no parallel builds/tests during measurements. Source proxy list remains read-only.

## Hypotheses and measurements

| Hypothesis | Discriminating evidence |
|---|---|
| Child PowerShell/CIM overhead exhausts readiness time | Per-call latency and actual discovery failure stage |
| Chrome itself never exposes a valid fresh port | Port-file appearance versus process/listener observations |
| Resource contention causes intermittent inspection failures | Host/guest memory and cold/idle samples under identical code |
| Generic MCP failure replays a launch | Classified HTTP/RPC response, elapsed time and same operation ID |

The source already uses native netstat and repeated process/owner snapshots; do not revert them.
An initialized provider in one PowerShell process does not establish another child is warm.
Never attach merely because a port is reachable. Do not promote unit/VM results into hosted PASS.

## Confirmed diagnosis

- Baseline reproduced with 8.07 GiB initially free on host: the primary Chrome process and listener
  match, but the second process snapshot expires. RPC has one launch and a non-retryable tool error.
- Instrumented exact baseline ASAR (diagnostic only) proves: baseline query killed after 5078 ms,
  retry 2891 ms, Chrome port reappears in about 540 ms, first process snapshot 4746 ms,
  native ownership 73 ms, refreshed process query has only 1633 ms left and expires.
- The expired query finishes at 3413 ms while cleanup starts another PowerShell child. Historical
  lifecycle elapsed values include cleanup and are not readiness measurements.
- Replacing CIM with direct System.Management in a standalone comparison saves only about 0.1-0.4 s;
  it does not remove repeated PowerShell startup. Do not use that speculative replacement.
- Correction: short-lived, serialized PowerShell query worker; a fresh CIM query for every request,
  no process-table cache, bounded output/deadlines, retire on timeout/error/idle. Keep all repeated
  process/listener snapshots. Fix the independently reproduced wrong-stage diagnostic.
- Added stage regression fails against unchanged source (ownership reported instead of process).
- Guest cleanup is empty (processes, smoke roots/rules, handoff). Shut down normally for local work.

## Local implementation and checks

- New bounded query worker serializes requests and runs fresh CIM queries inside one short-lived
  PowerShell. Retires on error, timeout, or 10 seconds idle; stdin EOF ends the loop on parent exit.
- Normal/cold query budgets remain 5/20 seconds. Driver readiness stays 15 seconds; all repeated
  identity and native listener snapshots remain unchanged. No new dependency or shell input path.
- 11 worker tests cover freshness, concurrency, framing, UTF-8, errors, bounds, timeout/late reply,
  queue expiry, spawn/exit, idle and disposal. Live Windows test verifies disappearance after exit.
- Two diagnostic stage tests cover refreshed process and final listener deadlines. Process-stage
  regression fails before correction; isolated per-query respawn mutation is also rejected.
- Node 22.23.2 installer suite: 387 PASS, 1 explicit live-host installer SKIP. Typecheck/lint PASS.
- Critical coverage: 91.48% lines, 84.23% branches, 91.39% functions; unchanged floors PASS.
- Directory build PASS. Candidate ASAR: `a3047fc0b03ead9121b8f11dcea25ffea86a3d7a33f411c174eac535e6d06bc5`.
- Candidate archive: `9240136bb3ef676d89ec8d6b56397d16e303f56cbc3b16aa8fa837e76f8cbe94`.
- Review checks: no cached tables, no interpolated request code, no credentials in frames/logs;
  old-child callbacks cannot resolve a new query; empty enumeration remains distinct from failure.

## Final result

- Managed real-proxy lifecycle PASS twice, including a verified guest reboot: initial launch/close,
  same-profile reopen/close, broken-proxy refusal with stopped state, recovery/close.
- All six successful launches use normal operator readiness, not the wider packaged verifier.
- Exact-source VM process queries: first 2547 ms, subsequent fresh queries 28/46 ms, post-exit query
  37 ms with the synthetic child absent. No process-table caching.
- Both cleanup receipts: zero Browser/Chrome/Node/query-worker processes, zero smoke roots/rules,
  no handoff. Four completed one-shot tasks removed; VM shut down normally.
- [Detailed evidence, hashes and remaining gates](report.md).
- Source and documentation remain local, uncommitted. The machine's post-commit hook dispatches a
  push-shaped local automation event; avoid it under this task's no-trigger boundary. No hooks or
  global settings changed. No Actions, push, release, production change or license activation.

## Evidence and stop conditions

Generated receipts: `local-test-artifacts/vm-browser-startup-20260908/`.
Write tracked documentation only under workspace plans/docs. Redact credentials and observed IPs.
Preserve unrelated `plans/reports/ci-260906-2341-mktbrowser-artifact-quota.md`.
If three attempted fixes fail, reassess the design before more changes. Do not use blind retries.
