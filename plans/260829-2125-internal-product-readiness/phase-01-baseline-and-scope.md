---
phase: 1
title: "baseline-and-scope"
status: partial
priority: P1
effort: "1 day"
dependencies: []
---

# Phase 1: baseline-and-scope

> **Historical predecessor phase — superseded by the 30 August consolidation.** The day-0 vendor
> request/owner fields below were never actionable: Q16 confirms no CloakBrowser channel, so Lane C is
> CLOSED with no request or date. Q15 confirms self-serve owner-machine reinstalls; see the successor
> plan for current P4a/P5 truth.

## Overview

Freeze the release contract, ownership, and evidence ledger before anyone rebuilds or deploys
anything. This phase converts the audit snapshot into a reproducible baseline and prevents a
passing local test or a stale plan checkbox from being mistaken for release authorization.

## Requirements

- Functional: identify the exact MKTTool, MKTBrowser, Relay, engine, installer, and production
  versions/SHAs that a candidate must contain.
- Functional: split the Web/Facebook lane from the Browser/Relay lane and record explicit NO-GO
  conditions for real accounts.
- Non-functional: preserve all unrelated dirty work; do not modify source, publish artifacts, or
  deploy during baseline capture.
- Evidence: use sanitized records only; no secrets, credentials, cookies, OTPs, tickets, proxy
  URLs, page content, or decrypted vault data.

## Architecture

Create a plan-scoped release manifest and gate ledger. The manifest is the single join key for all
later evidence:

```json
{
  "candidateId": "YYYYMMDD-browser-<semver>-relay-<n>",
  "mktTool": {"sourceSha": "<40-hex>", "treeSha": "<40-hex>"},
  "mktBrowser": {"sourceSha": "<40-hex>", "treeSha": "<40-hex>", "version": "<semver>"},
  "relay": {"version": 16, "archiveSha256": "<64-hex>", "exeSha256": "<64-hex>"},
  "installer": {"version": "<semver>", "sha256": "<64-hex>", "sizeBytes": 0},
  "engine": {"channel": "licensed", "version": "<version>", "sha256": "<64-hex>"},
  "deployment": {"railwayService": "mkttool-web", "commitSha": "<40-hex>"},
  "gateLedgerRef": "./gate-ledger.md"
}
```

The version and hashes above remain unset until the release owner locks them. The old
published v15 hashes remain a negative-evidence record, never a candidate value.

## Related Code Files

| Repository/path | Action | Purpose |
|---|---|---|
| `plans/reports/audit-260829-1607-internal-product-readiness.md` | Read/reference | Current NO-GO findings and exact negative evidence. |
| `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md` | Read/reference | Authoritative gate definitions, evidence contract, and invalidation rules. |
| `MKTTool/docs/development-roadmap.md` | Read/update later | Current internal-beta boundary and deferred scope. |
| `MKTTool/docs/internal-beta-release.md` | Read/update later | Operator-facing release procedure and old hashes to invalidate. |
| `MKTTool/README.md` and `MKTBrowser/README.md` | Read/reference | Runtime boundary, commands, and platform/licensing constraints. |
| `plans/260829-2125-internal-product-readiness/reports/release-manifest.json` | Create | Sanitized candidate join key. |
| `plans/260829-2125-internal-product-readiness/reports/gate-ledger.md` | Create | Status, owner, evidence, and re-run history for every gate. |
| `plans/260829-2125-internal-product-readiness/reports/baseline-capture.md` | Create | Immutable baseline and dirty-tree notes. |

## Implementation Steps

1. Capture repository identity without touching files:
   `git -C MKTTool status --short --branch`, `git -C MKTBrowser status --short --branch`,
   `git rev-parse HEAD`, `git log -1 --format=%H`, and the relevant nested-repository remotes.
   Record that the root and both nested repos are dirty and list only owned paths for future work.

   Historical starting state (2026-08-30) — reconcile, do not treat as current:
   - MKTTool `ci/self-hosted-runners` @ `1ade2c4`. The relay fix `57e14fa` is an ancestor.
   - MKTBrowser `feat/installed-contract-on-clean-runner` @ `3f37653`. The audit's candidate
     baseline `6d1b0a2` is an ancestor, **one commit behind HEAD**; the only commit between them is
     `3f37653 docs(release): record internal beta candidate` (docs-only). **Decide explicitly** which
     of the two is the manifest join key and write the reason down — do not inherit the audit number
     by default.
   - Root workspace is on `codex/fingerprint-engine-phase0`. The branch named in this plan's
     frontmatter does not exist in any repo yet; either create it here or replace the frontmatter
     value with the three real per-repo branches.
2. Verify the audit baseline from the recorded artifacts: MKTTool 1,922 tests and coverage floor;
   MKTBrowser managed 135/135 and 31/31, packaging 34 plus one skipped live test; published
   installer 0.3.12 SHA and embedded Relay archive/EXE SHAs; exact restart failure; Railway commit;
   G1/G2/G3/G4/G5 statuses; Prisma advisory chain.
3. Generate `candidateId` and a first manifest with `status: draft`, `lane: A|B|C`, and an
   `evidenceInvalidationReason` for every inherited/stale result. Do not copy old PASS checkboxes
   without their source/artifact hashes.

   **Reconcile the acceptance matrix's self-contradiction on `G3-RECOVERY` before anything cites it.**
   `acceptance-matrix.md:64` records `PASS`, `:434` says the gate is closed, and `:540` says it
   "remains `OPEN` on the real power-cycle/licence-key". The safe reading — and the one this plan
   uses — is historical PASS on a dirty-source artifact, FAIL/OPEN on the exact published installer.
   Write that reconciliation into the ledger with the line references so nobody later promotes line
   64 as closure.
> **Superseded procedure notice (30 August 2026):** The vendor/resource-booking steps below are
> retained as predecessor design only. Q16 confirms that no CloakBrowser channel exists, so no
> request, SLA, vendor wait, or Lane C scheduling is actionable. Q15's current path is self-serve
> reinstalls on the owner's machines with no notification channel.

3b. **(Historical; do not execute under Q16.) Start the two longest-lead external tracks on day 0.**
   Neither blocks any other Phase 1 work, and both were on the predecessor design's critical path
   for Lane C:
   - **Vendor identity request** (Phase 7 step 0): send CloakBrowser the sanitized 27 August
     collision evidence and ask whether a licensed build isolates fonts/audio/WebGL per profile on
     one host, on what channel, and by what date. This is the only lever that can move
     `G2-IDENTITY` from FAIL, and nothing in Phases 1–8 substitutes for it.
   - **Vendor test entitlement, disposable proxy/profile pairs, and the clean second PC** used by
     Phase 6. Book them now; do not discover in P6 that they take weeks.

   In the predecessor design, record owner, request date, and SLA for each. Under the current Q16
   decision there is no recipient or request date: Lane C is **CLOSED**, not waiting on an answer.

4. Define the release authority: named release owner, technical approver, security approver,
   operator lead, vendor contact, network provider, and rollback approver. Assign one owner to
   each gate and define who may change a status. The ledger must include owner, due date, evidence
   reviewer, escalation contact/SLA, and expiry for any temporary exception.
5. Record the HOLD scope: no custom engine promotion, no TikTok/Reddit posting automation, no
   CAPTCHA/OTP/credential automation, no page/raw-CDP tools, no macOS, no updater, and one seat/
   one profile at a time.
6. Set the phase dependency graph and parallel work groups. P2, P4 scaffolding, and P5 may start
   after this phase; P3 waits for the exact P2 artifact and the P5 copy/config change set;
   **P7 Stage A runs right after P3, in parallel with P4, and gates P6**; P6 waits for a frozen
   engine pin plus the P4 signed bundle; P7 Stage B follows P6; P8 waits for all required gates of
   its lane.
7. Establish evidence storage and retention. Hash every JSON/Markdown record, redact sensitive
   fields before writing, and keep host and clean-VM results in separate sections.
8. Run a secret scan over the new plan evidence and verify no plan file contains a token, cookie,
   credential, proxy URL, OTP, ticket, or private key. Mark this phase complete only after the
   release owner signs the baseline.

## Test Scenario Matrix

| ID | Scenario | Method | Expected result | Evidence |
|---|---|---|---|---|
| P1-01 | Repository identity | Read-only Git commands in all three repos | SHAs, branches, remotes, and dirty paths recorded | `baseline-capture.md` |
| P1-02 | Audit reproducibility | Recompute/hash referenced artifacts and inspect JSON | Every inherited result has a source/artifact tuple | Manifest + ledger |
| P1-03 | Stale evidence quarantine | Compare old v15 installer tuple with candidate tuple | Old tuple is marked invalid/negative, never promoted | Ledger entry |
| P1-04 | Scope guard | Review planned files/commands against HOLD list | No deferred feature appears as a release prerequisite | Scope section + review signoff |
| P1-05 | Evidence redaction | Secret scanner and manual schema review | Zero sensitive values in plan-scoped evidence | Scan output |
| P1-06 | Clean-VM distinction | Label host vs disposable VM results | No host PASS is represented as clean-VM PASS | Ledger labels |

### Gate-owner record (required ledger columns)

| Gate | Primary owner | Evidence reviewer | Due/expiry | Escalation/SLA | Status-change authority |
|---|---|---|---|---|---|
| G0 source/artifact | Release Owner | Build Owner | Fill in | Fill in | Release Owner |
| G0 disposable pairs | Release Owner | Network Owner | Fill in | Fill in | Release Owner |
| G1 human input | Operator Lead | Security Owner | Fill in | Fill in | Operator Lead + Release Owner |
| G2 network | Network Owner | Security Owner | Fill in | Fill in | Network Owner + Release Owner |
| G2 identity | Identity/Vendor Owner | Product/Security | Fill in | Fill in | Product Owner |
| G3 license/recovery | Vendor/Relay Owner | Security Owner | Fill in | Fill in | Relay Owner + Vendor |
| G4 second PC | Operations Owner | Release Owner | Fill in | Fill in | Operations Owner |
| G5 canary | Operations Owner | Product/Security | Fill in | Fill in | Product Owner |
| Distribution signing | Release Owner | Security Owner | Fill in | Fill in | Product Owner |

## Function / Interface Checklist

| Contract | Required check |
|---|---|
| `candidateId` | Stable, unique, included in every later evidence filename and manifest. |
| Release manifest schema | Source SHAs, versions, archive/EXE/installer/app.asar/engine hashes, deployment SHA, and owner are mandatory. |
| Gate status enum | `PASS`, `FAIL`, `OPEN`, `BLOCKED`, `DEFERRED`, `NOT_APPLICABLE`; never use a blank or optimistic status. |
| Evidence record | Includes command, timestamp, machine label, inputs, result, artifact hash, and redaction statement. |
| Invalidation rule | Any source/artifact/engine/host/proxy/firewall/schema/order change forces downstream re-run. |
| Lane authorization | A, B, and C have separate exit criteria and approvers. |

## Dependency Map

| Dependency | Direction | Reason |
|---|---|---|
| Acceptance matrix | P1 → all | Gate definitions and evidence contract are authoritative. |
| Existing stabilization plan | P1 → P2/P3/P6 | Supplies prior commands/evidence, but stale hashes are not reusable. |
| P1 manifest | P1 → P2–P8 | Every artifact and test must bind to one candidate ID. |
| Release owner/external resources | P1 → P4/P6/P7/P8 | CI, vendor, network, identity, and canary cannot be closed without named owners. |

## Historical success criteria (superseded by the 30 August consolidation)

S0 evidence for the checked items is in `reports/baseline-capture.md`,
`reports/release-manifest.json`, and `reports/gate-ledger.md`. Commands and timestamps are recorded
there; owner-only fields and external bookings remain OPEN, so the phase is not signed complete.
The checklist is retained to show the predecessor acceptance contract; it is not a current task queue.

- [x] Baseline capture records current SHAs, dirty paths, audit hashes, Railway deployment, and all
  open/failed gates.
- [x] Candidate manifest and gate ledger exist and are sanitized; the release-owner/security
  signoff fields remain OPEN in the authority record.
- [ ] Lane A/B/C exit rules and HOLD scope are explicit and accepted.
- [x] Old v15 installer/restart evidence is quarantined as negative evidence.
- [x] MKTBrowser join key (`6d1b0a2` vs `3f37653`) is chosen with a written reason, and the plan's
  branch frontmatter names branches that actually exist.
- [x] `G3-RECOVERY`'s contradictory matrix entries are reconciled in the ledger with line references.
- [x] Historical vendor identity/resource track is documented; under current Q16 there is no
  CloakBrowser channel, no request/SLA/entitlement booking, and Lane C is **CLOSED**, not waiting.
- [ ] P2, P4, and P5 owners can work in parallel without changing the frozen baseline.

## Risk Assessment

- **Baseline drift:** another agent or a deployment changes bytes during testing. Mitigate by
  freezing SHAs in the manifest, using clean worktrees/VM snapshots, and invalidating evidence on
  any change.
- **Scope creep:** identity experiments or automation are treated as release work. Mitigate with
  the HOLD list and a separate engine-lab plan.
- **Secret leakage in evidence:** diagnostic output contains credentials or cookies. Mitigate with
  schema allowlists, redaction before persistence, and a mandatory scan.
- **False closure:** a historical PASS is copied forward. Mitigate by requiring exact tuple matching
  and owner signature for every status.
