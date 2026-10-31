---
phase: 2
title: "Static Architecture, Code, and Security Audit"
status: pending
priority: P1
effort: "2-3 days"
dependencies: [1]
---

# Phase 02: Static Architecture, Code, and Security Audit

## Overview

Audit complete reachable trust-boundary surfaces, not only changed files. Findings must be reproducible
and tied to explicit retest gates.

## Audit Domains

### Product Invariants

- One Reddit account, one static proxy, one managed fingerprint/profile.
- No unattended Reddit/browser action, credential entry, OTP, cookie, raw CDP, or page-control automation.
- Facebook Graph API scheduling remains an authorized non-browser path.

### Trust Boundaries

- Web cannot access operator secrets or local browser state.
- Relay binds loopback only and retains rejected `/health` response bodies where required by contract.
- Electron never receives `VAULT_KEY_OPERATOR`.
- Tickets remain signed, device-bound, recipient-encrypted, expiring, replay-protected, ownership-checked,
  capability-scoped, and revocable.

### Authentication and Authorization

Build a complete surface table for every reachable route/action involved in download, enrollment,
ADMIN grants, reconciliation, ticket issue, update, rollback, repair, and completion proof:

`surface -> caller -> authentication -> authorization -> ownership -> capability -> failure -> tests`

### Secret and Database Safety

- DPAPI migration ordering, plaintext deletion, crash recovery, backups, uninstall, temporary files,
  diagnostics allowlist, error redaction, configuration parsing, and tests.
- Additive migrations, legacy grants, idempotency, transaction boundaries, `_test` guards, upgrade and
  restore instructions, and production-shaped compatibility.

### Relay and Browser Correctness

- Ticket/capability checks, health negotiation, retry limits, timeouts, correlation, device binding,
  startup, and old-version refusal.
- Electron sandbox/CSP/navigation, IPC/preload/MCP inventory, token separation, managed locks,
  proxy-before-launch, exact-engine firewall verification, and fail-closed behavior.

### Supply Chain and Maintainability

- Pinned runtimes/dependencies, Relay authenticity, engine source/checksum/license, dependency advisories,
  updater/publisher absence, release credential separation, NOTICE/SBOM, and artifact contents.
- Oversized/high-complexity modules, duplicated contracts, weak errors, platform assumptions, flaky timing,
  missing seams, and dead compatibility code.

### Documentation Truth

Reconcile README, roadmap, architecture, changelog, MKB-03 plan, CI claims, versions, hashes, test counts,
open gates, and readiness language.

## Finding Schema

Each entry in `findings-register.md` includes:

- ID, severity, title, status, owner.
- Boundary and affected components.
- File/line or artifact/evidence reference.
- Reproduction or reasoning chain.
- Likely impact and exploit/failure preconditions.
- Required remediation.
- Dependent evidence invalidated by the fix.
- Exact retest gate.

## Success Criteria

- [ ] Every reachable security-sensitive surface appears in the surface table.
- [ ] Every finding follows the required schema.
- [ ] Findings are deduplicated and severity-calibrated.
- [ ] P0/P1 findings immediately set verdict to NO-GO.
- [ ] Security and release assessments written without changing source.

## Risk Assessment

- Diff-only review misses old vulnerable endpoints. Audit reachable surfaces first, then use diffs to focus
  regression analysis.
- Dependency scans may require network access. Environment-blocked scans remain open gates.

## Unresolved Questions

None.
