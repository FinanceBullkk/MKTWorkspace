# U1 Commit Classification

Date: 2026-08-30 | Snapshot: before any U1 Git mutation | Status: COMPLETE

## Scope and counts

- MKTTool: 79 changed paths (77 run-work, 2 user-owned)
- MKTBrowser: 26 changed paths (23 run-work, 3 user-owned)
- Total: 105 changed paths
- Build output: none observed
- Junk: no `node_modules.bak-*` directory exists in the workspace snapshot

Classification is based on the phase-01 inventory and the pre-branch `git status --porcelain=v1` snapshot. User-owned paths are excluded from all staging, deletion, stash, formatting, and commit operations.

U1-generated path (not part of the 105-path snapshot): `MKTTool/.gitignore` will receive the required `node_modules.bak-*` ignore rule and is classified as run-work for the dependency-safety commit.

## MKTTool

### User-owned — never touch

- `AGENTS.md`
- `AGENTS.md.bak-260828`

### Run-work — explicit-path staging allowed

- `.env.example`
- `README.md`
- `docs/codebase-summary.md`
- `docs/development-roadmap.md`
- `docs/domain-glossary.md`
- `docs/huong-dan-van-hanh-cho-team.md`
- `docs/internal-beta-release.md`
- `docs/system-architecture.md`
- `package-lock.json`
- `package.json`
- `prisma/schema.prisma`
- `prisma/migrations/20260830030000_add_better_auth_rate_limit/`
- `relay/src/main.ts`
- `relay/src/relay-config.ts`
- `relay/src/relay-identity.ts`
- `relay/src/spent-ticket-journal.test.ts`
- `relay/src/spent-ticket-journal.ts`
- `scripts/build-relay-executable.ts`
- `scripts/publish-relay-release.ts`
- `scripts/publish-windows-installer.ts`
- `scripts/relay-executable-harness.ts`
- `scripts/smoke-test-relay-executable.ts`
- `scripts/restore-database-verify.ts`
- `scripts/verify-better-auth-rate-limit.ts`
- `src/app/accounts/[id]/account-vault-actions-panel.tsx`
- `src/app/accounts/[id]/page.tsx`
- `src/app/accounts/page.tsx`
- `src/app/api/setup/windows-installer/route.ts`
- `src/app/api/healthz/`
- `src/app/api/release/`
- `src/app/layout.tsx`
- `src/app/setup/page.tsx`
- `src/components/mktbrowser-ui/AppShell.tsx`
- `src/components/mktbrowser-ui/Constellation.tsx`
- `src/components/mktbrowser-ui/profile-launch-ui.test.ts`
- `src/components/proxies/new-proxy-sheet.tsx`
- `src/components/setup/onboarding-stepper.tsx`
- `src/components/setup/relay-download-section.tsx`
- `src/components/setup/smartscreen-guidance.tsx`
- `src/components/setup/workspace-setup-checklist.tsx`
- `src/components/tiktok/new-tiktok-profile-sheet.tsx`
- `src/components/vault/account-readiness-badge.tsx`
- `src/components/vault/antidetect-profile-card.tsx`
- `src/components/vault/first-login-card.tsx`
- `src/lib/accounts/account-first-login-actions.ts`
- `src/lib/accounts/account-owner-actions.ts`
- `src/lib/accounts/account-profile-actions.ts`
- `src/lib/accounts/account-readiness.ts`
- `src/lib/antidetect/adspower-adapter.ts`
- `src/lib/antidetect/antidetect-browser-adapter.ts`
- `src/lib/antidetect/mkt-browser-contract.test.ts`
- `src/lib/antidetect/profile-fingerprint-plan.ts`
- `src/lib/auth/auth-server.ts`
- `src/lib/auth/entry-point-guard-names.ts`
- `src/lib/auth/trusted-proxy-config.test.ts`
- `src/lib/auth/trusted-proxy-config.ts`
- `src/lib/auth/trusted-proxy-resolution.test.ts`
- `src/lib/db/restore-database-verification.ts`
- `src/lib/proxies/proxy-bulk-actions.ts`
- `src/lib/relay/current-device-browser-health.ts`
- `src/lib/relay/profile-launch-readiness.ts`
- `src/lib/relay/relay-endpoints.ts`
- `src/lib/relay/relay-release-metadata.ts`
- `src/lib/relay/relay-status-label.ts`
- `src/lib/release/release-provenance.test.ts`
- `src/lib/release/release-provenance.ts`
- `src/lib/setup/publish-refuses-an-installer-below-the-floor.test.ts`
- `src/lib/setup/setup-checklist.ts`
- `src/lib/setup/setup-state-machine.ts`
- `src/lib/setup/windows-installer-release-metadata.ts`
- `src/lib/setup/windows-installer-release-r2.test.ts`
- `src/lib/setup/windows-installer-release.test.ts`
- `src/lib/setup/windows-installer-release.ts`
- `src/lib/tickets/ticket-replay-guard.test.ts`
- `src/lib/tickets/ticket-replay-guard.ts`
- `src/lib/tickets/ticket-types.ts`
- `src/lib/tickets/ticket-verifier.ts`

## MKTBrowser

### User-owned — never touch

- `apps/desktop/src/main/ChromiumBrowserDriver.ts`
- `packages/mcp-server/src/server.ts`
- `packages/types/src/index.ts`

> **Q14 supersession note (09:20).** The three paths listed above were initially classified as
> user-owned and excluded from U1. The owner subsequently authorized exactly those three paths in one
> dedicated MKTBrowser safety commit `1decde437cf6495652b9d7bdbb76290ab2130411`; this exception does
> not apply to MKTTool `AGENTS.md` or `AGENTS.md.bak-260828`, which remain untouched.

### Run-work — explicit-path staging allowed

- `.github/workflows/release-candidate.yml`
- `README.md`
- `apps/desktop/package.json`
- `apps/desktop/relay-release.json`
- `apps/desktop/scripts/fetch-pinned-relay.cjs`
- `apps/desktop/scripts/package-windows.cjs`
- `apps/desktop/src/main/index.ts`
- `apps/desktop/src/main/license-key-pool.ts`
- `apps/desktop/src/main/proxyGeo.ts`
- `apps/desktop/src/main/one-seat-license-ui-contract.test.ts`
- `apps/desktop/src/renderer/src/App.tsx`
- `apps/desktop/src/renderer/src/components/onboarding/ChromiumBootstrapModal.tsx`
- `apps/desktop/src/renderer/src/components/onboarding/FirstRun.tsx`
- `apps/desktop/src/renderer/src/components/profile/EmptyState.tsx`
- `apps/desktop/src/renderer/src/components/profile/FingerprintForm.tsx`
- `apps/desktop/src/renderer/src/components/profile/ProfileEditSheet.tsx`
- `apps/desktop/src/renderer/src/components/screens/AdditionalLicenceKeys.tsx`
- `apps/desktop/src/renderer/src/components/screens/Settings.tsx`
- `package.json`
- `packages/settings-store/src/index.ts`
- `scripts/emit-release-provenance.cjs`
- `scripts/emit-release-provenance.test.cjs`
- `scripts/version-coherence-contract.test.cjs`

## Junk/build-output handling

No `node_modules.bak-*` directory was present at snapshot time, so no deletion was performed. Existing `node_modules/` remains ignored and untouched. No release artifact or evidence file containing credentials was staged.

## Unresolved questions

- None for classification. Q14's dedicated-commit exception is complete; the two protected MKTTool
  files remain outside all commits.
