---
phase: 0
title: "Pre-Audit Remediation"
status: in-progress
priority: P1
effort: "5-10 working days"
dependencies: []
---

# Phase 00: Pre-Audit Remediation

## Overview

Finish MKB-03 and close known release blockers before evidence collection. This phase may modify code;
its test results are development validation only.

## Entry State

- MKTTool and MKTBrowser contain uncommitted MKB-03 changes.
- MKB-03 Phases 01-04 are implemented but mandatory human retest remains open.
- MKB-03 Phase 05 update/rollback and Phase 06 repair/gate work are unimplemented.
- Latest human test was `failed-with-workarounds`; firewall, fallback, and reconciliation fixes require
  clean-baseline retest.
- MKTBrowser lint currently succeeds without workspace lint tasks.
- Documentation contains stale Relay-version and readiness claims.

## Requirements

- Review dirty changes without mixing unrelated work.
- Preserve `1 Reddit account = 1 static proxy = 1 managed fingerprint/profile`.
- Keep Relay loopback-only; never place `VAULT_KEY_OPERATOR` on Web or Electron.
- Complete MKB-03 Phase 05 signed compatibility-set update and rollback behavior.
- Complete MKB-03 Phase 06 conflict detection, repair, uninstall ownership, and rehearsal tooling.
- Close known WebRTC, engine fallback, device reconciliation, progress, and guidance findings.
- Add real lint/CI guards; missing workspace commands must fail rather than silently pass.
- Reconcile Relay versions, archive hashes, commands, and readiness language across docs and manifests.
- Run focused development tests after each remediation slice.

## Current Checkpoint - 14 August 2026

Verified development work:

- Both dirty repositories were reviewed without staging, committing, publishing, deploying, or
  installing an operational artifact.
- MKTTool passed 1,356 tests, lint, typecheck, Prisma validation, and production build. One real Windows DPAPI
  atomic-replace test uses a measured 15-second local timeout rather than weakening the global test
  timeout.
- MKTBrowser now has real workspace lint commands, a fail-closed workspace quality contract, Windows
  CI/package gates, and mandatory runtime/firewall tests.
- The Windows installer conflict detector runs before old-version uninstall or application/registry
  mutation for both interactive and silent paths. It uses standard-user `Get-Process` and `netstat`
  inspection instead of CIM calls that failed with access denied.
- Read-only live inspection passed under the current standard user. Disposable fixtures proved that
  repair removes only exact-target owned shortcut duplicates and preserves a different installation.
- Ownership-aware Relay cleanup uses exact executable paths, preserves `relay-config.json`, and passed
  a disposable process/shortcut cleanup fixture without touching the live Relay.
- Destructive ownership is resolved: normal uninstall preserves identities; signed ADMIN retirement
  revokes first, writes a DPAPI recovery receipt, deletes only Relay identity, persists a durable
  completion receipt independent of later ticket-key rotation, and leaves Browser/MultiZen data alone.
- Relay v11 now gates retirement before server revocation, preserves a non-secret rollback floor
  through cleanup, and passed its packaged crypto plus retirement smoke path. The local unpublished
  ZIP is 34,181,782 bytes with SHA-256
  `6c8582b1bf6141efe35efaa5de4db57c9f2acbdc235891836483f7f7220448f6`.
- A disposable Node 22.23.0 toolchain passed the complete installer suite, real lint, and typecheck.
  Packaging contracts now pass 23/23 after regression coverage was added for fresh-bundle creation,
  Windows Corepack invocation, and the NSIS custom-header contract.
- A fresh local combined installer compiled successfully after execution and adversarial review fixed
  four blockers: a stale-bundle packaging entrypoint, direct `.cmd` spawning under Node 22, an
  undefined executable-name constant, and NSIS include/registry definitions used before
  electron-builder declared them. The unsigned installer is
  146,004,070 bytes with SHA-256
  `758d155cf06b15205186fef8b631daae7b5831a010feb51e17f559054cfaf5f7`.
- The fresh installer embeds the exact verified Relay v11 ZIP and manifest. Post-build legacy-profile
  and settings tests pass, proving the packaging pipeline restored the Node ABI and workspace links.

Open remediation gates:

- Phase 05 ceremony tooling is implemented and verified: delegated-key DPAPI storage, offline root
  backups, paper fingerprints for the tool bundle and both authorities, signed delegation, backup
  read-back, recovery from copy B, and a public verifier receipt. Production key material was not
  created. Implementation still cannot
  begin until the owner runs the physical ceremony on an offline host with two separate media.
- Phase 06 still needs separate high-friction Browser profile deletion, the live legacy/permission/
  port/repair/uninstall/update/rollback matrices, dedicated-profile network tests, and the
  unfamiliar-operator rehearsal.
- Relay v11 must be published to its immutable authenticated URL. The fresh installer used the
  reviewed local archive override, so it proves reproducible packaging but not release-channel
  availability or an operational distribution.
- MKTBrowser is clean and committed locally at `a39cc23`. MKTTool has focused local commits through
  `7b11c14` plus the new uncommitted ceremony-tooling slice. Neither repository was pushed. Phase 01
  freeze remains blocked on the physical ceremony, remaining Phase 06 gates, and explicit focused
  commit authorization for this slice.

## Implementation Steps

1. Inventory both dirty trees and classify every path as Phase 01-04 fix, Phase 05, Phase 06, docs, or
   unrelated user work.
2. Review and finish current onboarding, enrollment, installer, firewall, engine fallback, settings,
   and packaged-contract changes.
3. Implement MKB-03 Phase 05 exactly from its existing plan: signed manifest chain, protected sequence,
   atomic compatibility-set activation, downgrade rejection, authorized rollback, rollback floor, and
   fault-injected convergence.
4. Implement Phase 06: conflict detection, safe blocked-layer messages, idempotent repair, ownership-aware
   uninstall, legacy preservation, and reusable gate rehearsal support.
5. Add meaningful lint scripts for applicable MKTBrowser workspaces and run them in Windows CI.
6. Add CI checks that combined-installer creation cannot silently skip missing test/lint commands.
7. Run narrow tests for each changed boundary, then full pre-freeze validation.
8. Update MKB-03 plan, roadmap, architecture, changelog, README, versions, and hashes to measured truth.
9. Present exact proposed commit boundaries and request explicit authorization.
10. Create focused commits only after authorization. Do not push.

## Development Validation

- MKTTool focused tests: enrollment resume/reconciliation, authorization, tickets, replay/expiry/
  revocation, DPAPI migration fault injection, diagnostics redaction, installer encoding/shortcuts,
  updater compatibility, rollback floors.
- MKTBrowser focused tests: W02, MKB-01/01E/02, packaging, firewall, engine paths, bootstrap/fallback,
  settings, update, rollback, repair, uninstall, and packaged contract.
- Fresh combined installer compilation passed under Node 22 with the local verified Relay v11
  archive. Building did not publish or install it.

## Success Criteria

- [x] All dirty files reviewed and disposition recorded.
- [ ] No unrelated work included in remediation commits.
- [ ] MKB-03 Phases 01-06 implemented.
- [ ] Known P0/P1 findings closed by tests and targeted local validation.
- [x] MKTBrowser lint performs real checks and Windows CI runs it.
- [x] Documentation reports one consistent Relay version and artifact set.
- [x] Focused and full pre-freeze validation passes.
- [ ] Owner explicitly authorizes focused commits.
- [ ] Both repositories are committed but not pushed.

## Risk Assessment

- Phase 05 update security is high risk because unsigned installation leaves manifest validation as the
  update authority. Keep offline root, delegated signing key, and R2 credentials separate.
- Existing dirty trees may contain user work. Never discard or absorb paths without ownership evidence.
- Any human test performed here must be repeated after Phase 01 freeze.

## Unresolved Questions

- None in the destructive-ownership design. Browser profile deletion remains an unimplemented gate,
  not an ownership ambiguity.
