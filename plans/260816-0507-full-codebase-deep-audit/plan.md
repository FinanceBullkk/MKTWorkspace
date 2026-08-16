---
title: "Full Codebase Deep Audit — Subsystems Not Covered by the 16 Aug Sweep"
description: "Close the coverage gaps declared in audit-260816-0452 by auditing each remaining subsystem to a declared depth, with executable proof for trust boundaries."
status: in_progress
priority: P1
effort: "6 phases; phases 01-02 carry most of the risk"
issue: null
branch: "MKTTool feat/mkt-browser-clean-break; MKTBrowser feat/mkb-03-compatibility-set"
tags: [audit, security, crypto, windows, review]
blockedBy: []
blocks: []
created: 2026-08-16
---

# Full Codebase Deep Audit

Follow-on to [`audit-260816-0452`](../reports/audit-260816-0452-mktworkspace-quality-and-security.md).
That pass was breadth-first: all gates run, whole-tree pattern sweeps, ~25 of ~700 source files read
in depth. It declared 13 unexamined areas. This plan audits them.

## Execution snapshot - 17 August 2026

- Phase 00 completed as remediate-then-verify; unresolved items remain explicit in the findings register.
- Phase 01 completed at D4: all 20 hypotheses were closed or subsumed by a recorded finding.
- Phase 02 completed at D4: all 20 hypotheses H21-H40 are closed with executable evidence.
  C10 was fixed during the Phase 03 remediation follow-up with deterministic injected inventory.
- Phase 03 completed at D3 with targeted D4 remediation. C21 is fixed; C22 is closed by source
  remediation plus the supported-topology decision of one Windows user per PC. The disposable
  two-account Windows exercise was waived on 17 August 2026 and is not a release gate. Power-loss,
  Authenticode, and clean-machine installer withdrawal remain named Phase 04 gates. Failed rollback
  attempts require fresh ADMIN approval.
- Phase 04 completed at D3 with D4 on the verification logic. No P0/P1/P2. Three P3 findings
  (C23-C25). Ten regression tests added and sabotage-proven; six sabotages showed a forged or
  out-of-window payload being fully accepted with the guard removed. No ceremony, no R2 access, no
  publish.
- Phase 05-06 have not started.
- Current merged status lives in [`findings-register.md`](./findings-register.md). Phase reports remain
  the detailed evidence record.

## Depth model

"How deep" is a per-area decision, declared up front so a finding's absence is interpretable.

| Tier | Name | What it means | Cost |
| --- | --- | --- | --- |
| **D1** | Inventory | Enumerate and classify. Bodies not read. | minutes |
| **D2** | Read-through | Every file in the area read once. Issues noted as encountered. | hours |
| **D3** | Adversarial trace | For each boundary, write concrete attack/failure hypotheses first, then trace the code to prove it stops each one. Findings carry a reproduction path. | half-session per boundary |
| **D4** | Executable proof | Every hypothesis becomes a test. It fails on the vulnerable path, or passes and stays in the suite as a regression guard. | full session per boundary |

D3 is the floor for anything on a trust boundary. D4 is reserved for boundaries where a silent
failure is unrecoverable — crypto and the local control surface.

**Rule:** hypotheses are written before the code is read. Reading first produces a list of what the
code already handles, which is the failure mode the 16 Aug pass avoided by using shape checks.

## Phases

| Phase | Area | Depth | Status | Why this rank |
| --- | --- | --- | --- | --- |
| 00 | [Fix Re-Verification](./phase-00-fix-reverification.md) | D2 | Completed | Cheap. Confirms F1-F15 fixes landed before new work builds on them. |
| 01 | [Cryptographic Protocols](./phase-01-cryptographic-protocol-audit.md) | **D4** | Completed | Bespoke multi-generation protocol. Silent failure = trust collapse, unrecoverable. |
| 02 | [Local Control Surface & Proxy Containment](./phase-02-local-control-surface-and-proxy-containment.md) | **D4** | Completed | 24 MCP tools + SOCKS5 bridge. Failure = full browser control or identity leak. |
| 03 | [Windows Lifecycle](./phase-03-windows-lifecycle-installer-update-rollback.md) | D3 + targeted D4 | Completed | C21/C10 fixed; C22 closed for the supported single-user topology; cross-user VM exercise waived. |
| 04 | [Release Authority & Supply Chain](./phase-04-release-authority-and-supply-chain.md) | D3 + D4 on verification | Completed | Trust root proved load-bearing by sabotage; three P3 residuals. |
| 05 | [Data Layer & Business Logic](./phase-05-data-layer-and-business-logic.md) | D3 | Not started | 671-line schema, 12 migrations, rules engine. Failure mode is silent wrong answers. |
| 06 | [Breadth Completion](./phase-06-breadth-completion.md) | D2 | Not started | Frontend, redaction, deps, concurrency, docs accuracy. |

## Non-negotiable rules

- Read-only against source during audit execution, except Phase 00 re-verification and D4 test files.
  Phase 03 product remediation was later explicitly authorized and is recorded as a follow-up.
- New tests must fail first on the vulnerable path. A test that never went red proves nothing.
- No test may be weakened or skipped to go green. A legitimate red is a finding.
- No real credentials, no operational database, no publish/deploy, no migration runs.
- Every finding: severity, boundary, reproduction, impact, remediation, retest gate.
- Where a defect is only reachable in theory, say so — rank it, do not inflate it.

## Severity model

Verification integrity rules:

- Read a command's own exit status. Do not pipe a required gate through `tail`, `Select-String`, or
  another command whose success can mask the gate's failure.
- Do not use `gh run watch --exit-status` as the authoritative CI verdict. Read the run's `status`
  and `conclusion` directly, then inspect the relevant step log.
- Every test-owned process, socket, and temporary directory must have deterministic teardown. Windows
  cleanup retries must be bounded and must still fail when the release window is exhausted.
- A CI rerun is diagnostic evidence, never closure. A pass-after-fail result is a flakiness finding.

Inherited from [`pre-mkb04` plan](../260813-1546-pre-mkb04-system-quality-audit/plan.md) so findings
merge into one register: P0 credential exposure / authz bypass / destructive loss / trust collapse;
P1 realistic compromise, proxy escape, broken rollback; P2 contained reliability or operator risk;
P3 hardening and quality.

## Deliverables

- `findings-register.md` — merged, severity-ranked, cross-referenced to the 16 Aug findings.
- One report per phase under `plans/reports/`.
- New regression tests from D4 phases, committed with the code they guard.
- Updated coverage statement: what is now examined, what remains.

## Exit

Every phase closed, or explicitly deferred with the residual risk named. This plan does not issue a
GO/NO-GO; it feeds Phase 02 of the pre-MKB-04 audit.

## Unresolved questions

None. Phase 06 docs accuracy is in scope, restricted to claims that carry the safety case; F6, F10,
and F15 were settled on 17 August 2026. See [`findings-register.md`](./findings-register.md) →
Decisions.
