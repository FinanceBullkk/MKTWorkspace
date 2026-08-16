---
phase: 3
title: "Automated Verification Matrix"
status: pending
priority: P1
effort: "1-2 days"
dependencies: [1, 2]
---

# Phase 03: Automated Verification Matrix

## Overview

Run all automated gates against the frozen commits and indexed artifacts. Capture command, duration,
exit status, environment, transcript hash, artifact outputs, and source-state checks.

## MKTTool and Relay

Use `mkttool_audit_migrate`, `mkttool_audit_test`, and synthetic keys:

```powershell
npm ci
npm run db:generate
npx prisma migrate deploy
npm run lint
npm run typecheck
npm test
npm run build
npm run relay:build
npm run relay:verify
npm run mkt-browser:smoke
```

Also run focused tests for:

- Enrollment resume/reconciliation and ownership authorization.
- Ticket replay, expiry, revocation, recipient/device binding, and capability rejection.
- DPAPI migration fault injection and diagnostic redaction.
- Installer encoding, shortcuts, startup, and old-version refusal.
- Signed update manifests, downgrade rejection, interruption convergence, rollback authorization/floors.
- Repair/uninstall ownership and legacy-data preservation.

Restore a sanitized production-shaped backup into `mkttool_audit_restore`, verify restoration first, then
run the upgrade path including pending legacy `operatorKeyGrant` rows. Never alter live data.

## MKTBrowser

Use Node 22 and Yarn 4.5.0:

```powershell
corepack yarn install --immutable
corepack yarn verify:node
corepack yarn workspace @mktbrowser/desktop test:w02
corepack yarn workspace @mktbrowser/desktop test:mkb01
corepack yarn workspace @mktbrowser/desktop test:mkb01e
corepack yarn workspace @mktbrowser/desktop test:mkb02
corepack yarn workspace @mktbrowser/desktop test:packaging
corepack yarn typecheck
corepack yarn lint
corepack yarn workspace @mktbrowser/desktop build
corepack yarn verify:packaged-contract
corepack yarn workspace @mktbrowser/desktop build:win
```

`lint` passes only if applicable workspaces execute real lint checks. A missing command is a failure.

## Artifact Inspection

- Inspect `app.asar`, PE metadata, license/NOTICE, SBOM, source maps, private keys, secrets, development
  endpoints, legacy identities, forbidden updater/publisher/heartbeat markers, ports, and data roots.
- Verify restricted MCP inventory and absence of page/cookie/raw-CDP tools.
- Verify deterministic managed create/retry, atomic launch, locks, denials, diagnostics, close, and exit.
- Verify CloakBrowser/CFT checksums, stable runtime paths, atomic replacement, independent firewall rules,
  fallback behavior, and failure cleanup.
- Verify installer contents and Relay archive version/hash match the baseline manifest.

## CI Parity

- Every locally mandatory command must exist in Windows CI.
- CI must not silently pass because a workspace lacks `test` or `lint`.
- Normal push/PR CI covers required guards; manual-only installer creation is documented as a release gate.
- Workflow permissions and release credentials remain least privilege and separated.

## Acceptance Rules

- One unexplained retry, flaky result, skip, stale artifact, or environment block keeps the gate open.
- Diagnostic reruns may investigate failure but cannot turn the original gate into PASS. Fixes restart at
  Phase 00; environment corrections require a fresh recorded run.

## Success Criteria

- [ ] Every command passes against frozen commits.
- [ ] Focused security/recovery tests pass.
- [ ] Restore and production-shaped migration rehearsal passes.
- [ ] Artifact inspection finds no prohibited material.
- [ ] CI parity passes.
- [ ] Source state is unchanged after every command group.
- [ ] Results and hashes recorded in `automated-verification-matrix.md`.

## Risk Assessment

- `npm test` destroys the `_test` schema. Verify the parsed database name immediately before execution.
- Package builds may mutate native dependencies. Confirm repository state and Node ABI restoration after build.

## Unresolved Questions

None.
