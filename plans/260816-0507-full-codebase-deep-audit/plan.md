---
title: "Full Codebase Deep Audit — Subsystems Not Covered by the 16 Aug Sweep"
description: "Close the coverage gaps declared in audit-260816-0452 by auditing each remaining subsystem to a declared depth, with executable proof for trust boundaries."
status: draft
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

| Phase | Area | Depth | Why this rank |
| --- | --- | --- | --- |
| 00 | [Fix Re-Verification](./phase-00-fix-reverification.md) | D2 | Cheap. Confirms F1-F15 fixes landed before new work builds on them. |
| 01 | [Cryptographic Protocols](./phase-01-cryptographic-protocol-audit.md) | **D4** | Bespoke multi-generation protocol. Silent failure = trust collapse, unrecoverable. |
| 02 | [Local Control Surface & Proxy Containment](./phase-02-local-control-surface-and-proxy-containment.md) | **D4** | 24 MCP tools + SOCKS5 bridge. Failure = full browser control or identity leak. |
| 03 | [Windows Lifecycle](./phase-03-windows-lifecycle-installer-update-rollback.md) | D3 | Plan classifies installer/update/rollback P0. Crash-consistency is the risk. |
| 04 | [Release Authority & Supply Chain](./phase-04-release-authority-and-supply-chain.md) | D3 | Trust root. Small code, high blast radius. |
| 05 | [Data Layer & Business Logic](./phase-05-data-layer-and-business-logic.md) | D3 | 671-line schema, 12 migrations, rules engine. Failure mode is silent wrong answers. |
| 06 | [Breadth Completion](./phase-06-breadth-completion.md) | D2 | Frontend, redaction, deps, concurrency, docs accuracy. |

## Non-negotiable rules

- Read-only against source, except Phase 00 re-verification and D4 test files.
- New tests must fail first on the vulnerable path. A test that never went red proves nothing.
- No test may be weakened or skipped to go green. A legitimate red is a finding.
- No real credentials, no operational database, no publish/deploy, no migration runs.
- Every finding: severity, boundary, reproduction, impact, remediation, retest gate.
- Where a defect is only reachable in theory, say so — rank it, do not inflate it.

## Severity model

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

1. Should D4 tests land on the feature branches now, or wait for the audit baseline freeze?
2. Is Phase 06 (docs accuracy) in scope for audit, or does it belong to `docs-manager`?
