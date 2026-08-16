---
title: "Pre-MKB-04 System Quality and Release-Readiness Audit"
description: "Remediate MKB-03, freeze a clean Windows baseline, then issue a strict evidence-backed GO or NO-GO verdict for MKB-04."
status: in-progress
priority: P1
effort: "8-15 working days plus human-gate scheduling"
issue: null
branch: "MKTTool feat/mkt-browser-clean-break; MKTBrowser main"
tags: [audit, security, windows, release, critical]
blockedBy: []
blocks: []
created: 2026-08-13
---

# Pre-MKB-04 System Quality and Release-Readiness Audit

## Decision

Current decision: **NO-GO for MKB-04**.

Reason: MKB-03 Phase 05 has not started because the owner root-key custody and recovery ceremony is
still open. Phase 06 now has a verified signed Relay retirement subset and resolved data ownership,
but Browser profile deletion, live Windows matrices, and the unfamiliar-operator rehearsal remain
open. Relay v11 is verified locally and a fresh Node 22 combined installer now builds, but v11 is not
published into the authenticated release channel. Publication and the remaining human and security
gates still block an unconditional GO. This plan creates the shortest credible route:

`remediate -> authorize focused commits -> freeze -> audit -> human rehearsal -> verdict`

No conditional GO. No risk acceptance can convert an open P0/P1 or mandatory skipped gate into GO.

## Lifecycle Architecture Decision - 14 August 2026

The destructive-uninstall ownership question is resolved by removing destructive identity cleanup
from uninstall entirely:

- **Repair/reinstall** is idempotent and preserves Browser profiles, the Browser MCP token, Relay
  configuration, Relay device identity, operator-domain credentials, and server binding.
- **Normal uninstall** removes only owned processes, binaries, shortcuts, autostart, and firewall
  state. It preserves every identity-bearing local datum regardless of which installer created it.
- **Retire/reset device** is a separate ADMIN workflow. The server revokes the `RelayDevice` and
  unpins accounts first, then issues a short-lived authorization bound to that device id, X25519
  public key, and a per-retirement finalization public key. The local Relay verifies it, writes a
  protected recovery receipt, removes Relay credentials/configuration, and returns a recipient-only
  completion proof. The server persists a durable signed completion and erases the one-use
  finalization seed, so ticket-key rotation cannot strand cleanup retry or final recovery. Browser profile deletion is a
  separate high-friction action and is never implied by Relay retirement.
- **Lost/unreachable device** uses immediate server-side revocation. Remote local wipe is not
  claimed. If the machine may have obtained operator-domain plaintext or ciphertext, rotate
  `VAULT_KEY_OPERATOR` after revocation.

Relay credentials and Browser profiles belong to different trust and recovery domains. Treating
them as one installer checkbox would make ordinary troubleshooting capable of destroying warmed
identities and would let Browser ownership silently absorb a pre-existing Relay installation.

## Scope

Audit the complete Windows delivery chain:

`MKTTool Web -> Relay -> MKT Browser -> browser engine`

Included:

- MKTTool authentication, authorization, enrollment, download, database, and Relay contracts.
- Relay ticket, secret, installer, migration, update, rollback, repair, and diagnostics behavior.
- MKT Browser Electron, IPC/MCP, managed profiles, engine bootstrap, firewall, packaging, and CI.
- Windows installation and end-to-end operation with disposable identities and a dedicated test proxy.

Excluded:

- macOS/MKB-07, MKB-06 UX redesign, production deployment, pilot operation, real accounts.
- Unattended Reddit/browser interaction, credential entry, OTP handling, or page-control automation.
- Authorized Facebook Graph API scheduling is outside the browser-chain prohibition.

## Non-Negotiable Rules

- Phase 00 is remediation. Its outputs are not audit evidence.
- Only a clean, committed, hash-indexed baseline may enter Phase 01.
- Phases 01-05 are read-only against source. Any fix returns work to Phase 00.
- A source or build-input change invalidates every dependent artifact and evidence record.
- Skipped, flaky, retried, environment-blocked, stale, or unverifiable gates remain open.
- No push, publish, tag, deploy, production migration, or operational-machine installation.
- Focused baseline commits require explicit owner authorization.
- Human tests use synthetic keys, disposable Windows accounts/profiles, and no real social credentials.
- Sanitized evidence must not contain secrets, tokens, proxy values, observed IPs, or sensitive paths.

## Phases

| Phase | Name | Status | Exit |
| --- | --- | --- | --- |
| 00 | [Pre-Audit Remediation](./phase-00-pre-audit-remediation.md) | In progress | MKB-03 complete; P0/P1 closed; commit authorization obtained |
| 01 | [Freeze Baseline](./phase-01-freeze-baseline.md) | Blocked | Clean commits and indexed artifact hashes |
| 02 | [Static Architecture and Security Audit](./phase-02-static-architecture-code-security-audit.md) | Blocked | Evidence-backed findings register complete |
| 03 | [Automated Verification](./phase-03-automated-verification-matrix.md) | Blocked | Every mandatory command green on frozen baseline |
| 04 | [Human Windows Gate Rehearsal](./phase-04-human-windows-gate-rehearsal.md) | Blocked | Every mandatory scenario passes with sanitized evidence |
| 05 | [Evidence Pack and Verdict](./phase-05-evidence-pack-and-verdict.md) | Blocked | Signed GO or exact NO-GO blockers |

## Cross-Plan Dependencies

- MKB-03 execution plan: `MKTTool/plans/260812-1301-mkb-03-windows-onboarding-and-installer/`.
- Phase 00 completes and updates MKB-03 Phases 05-06 before audit freeze.
- This audit supersedes the older statement that stopping after MKB-03 Phase 04 is acceptable for a
  pilot. MKB-04 now requires all six MKB-03 phases and all mandatory gates.

## Gate Model

| Severity | Meaning | MKB-04 effect |
| --- | --- | --- |
| P0 | Credential exposure, authorization bypass, destructive loss, remote control, trust collapse | Immediate NO-GO |
| P1 | Realistic compromise, proxy/fingerprint escape, broken rollback, unsafe installer/update, unrecoverable failure | NO-GO |
| P2 | Contained reliability, maintainability, observability, or operator risk | Fix or formally schedule before rollout |
| P3 | Minor hardening, documentation, or quality improvement | Backlog |

Every finding requires severity, affected boundary, evidence/reproduction, impact, remediation, owner,
dependent evidence, and retest gate.

## Evidence Invalidation

Each evidence item records:

- Evidence ID and UTC timestamp.
- MKTTool and MKTBrowser commit IDs.
- Dependency-lock and relevant configuration hashes.
- Installer, Relay archive, Browser package, and engine hashes where applicable.
- Command/scenario, environment fingerprint, expected result, observed result, and PASS/FAIL.

Invalidation propagates by dependency, not only by changed file. Example: a Relay contract change
invalidates Relay tests, Browser packaged-contract evidence, installer evidence, and end-to-end setup.

## Required Deliverables

- `audit-scope-and-baseline.md`
- `automated-verification-matrix.md`
- `human-windows-gate-matrix.md`
- `security-and-trust-boundary-review.md`
- `release-and-rollback-readiness.md`
- `findings-register.md`
- `go-no-go-verdict.md`
- `evidence/` containing sanitized manifests, transcripts, logs, screenshots, and hashes

## Final Decision

GO requires all of the following:

- Zero open P0/P1 findings.
- MKB-03 Phases 01-06 implemented and retested.
- Every mandatory automated gate passes once on the frozen baseline without retry-based acceptance.
- Every mandatory human Windows scenario passes.
- Update/rollback, migration recovery, repair, and uninstall gates pass.
- Documentation matches measured versions, hashes, commands, and readiness.
- Source and build inputs remain unchanged through verdict.

Anything else is NO-GO.

## Unresolved Questions

- Temporary authenticated HTTPS staging and focused commits still require explicit authorization at
  their execution gates.
