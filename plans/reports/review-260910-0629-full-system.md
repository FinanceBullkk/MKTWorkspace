# Full MKTTool and MKTBrowser Code Review

> Historical review snapshot: findings below were recorded against older checked-out branches, not the accepted installer or the current default branches. See [repair closure](review-260910-quality-repair-closure.md) for reconciliation, verification and delivery status.

Date: 2026-09-10. Read-only review of MKTTool HEAD `bfd51ac` and MKTBrowser HEAD `5ff43b2`.

## Findings

- **P1 Relay crash on malformed request:** `MKTTool/relay/src/relay-http-server.ts:145-157` calls `handleRequest` without a rejection boundary; malformed request targets can make `new URL()` throw and terminate the Relay. Parse request-target defensively and return 400; attach an outer async error handler.
- **P1 stale profile completion:** `MKTTool/src/lib/accounts/account-profile-actions.ts` reads ownership/device and later updates unconditionally. A concurrent reassignment or revocation can be overwritten. Use a revision/conditional transaction.
- **P1 multi-device profile creation dead end:** `MKTTool/src/components/vault/antidetect-profile-card.tsx:191` omits `deviceId`, while recipient resolution rejects multiple active devices. Pass verified local device identity or require a device selector.
- **P1 Browser shutdown race:** `MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts:1552-1554` can finish before a launch enters the tracked maps. Await/cancel launch promises during shutdown.
- **P1 Windows archive collision:** `MKTBrowser/packages/profile-manager/src/archive.ts:202-211` checks profile IDs case-sensitively before writing Windows paths. A case-only alias can overwrite an existing profile directory.
- **P1 malformed archive state:** `MKTBrowser/packages/profile-manager/src/archive.ts:190-239` trusts authenticated JSON without schema validation. Invalid fingerprint/tags/files can be persisted and crash listing.
- **P2 archive cleanup:** failed extraction leaves orphan profile directories; extract to staging and remove on every failure.
- **P2 settings lost update:** `MKTBrowser/packages/settings-store/src/index.ts:135-138` permits concurrent read-merge-write loss. Serialize updates and use atomic/versioned writes.
- **P2 secret corruption:** `MKTTool/src/components/vault/account-vault-form.tsx:113` trims password/TOTP values before encryption. Preserve secret bytes or apply explicit field rules.
- **P2 login privacy leak:** `MKTTool/src/lib/auth/require-actor.ts:84-91` is reflected by `src/proxy.ts:41-43` into `error_description`, exposing a removed user's email in URLs/history.
- **P2 uninstall idempotency:** `MKTBrowser/apps/desktop/build/windows-startup-coordination.ps1:49` fails `RemoveBrowser` when Startup is already absent.
- **P1 interrupted-update recovery:** Browser exits on activation marker before Relay companion startup, while installer takeover removed Relay's independent Startup entry. Recovery after power loss can remain blocked until manual repair.

## Verification

- MKTTool full Vitest + coverage: 233 files, 2,153 tests passed; Statements 81.01%, Branches 76.59%, Functions 82.34%, Lines 83.59%.
- MKTTool narrow auth/profile checks: 19/19 passed.
- MKTBrowser release/contract checks: 33/33 passed; startup/tray/Relay companion checks: 30/30 passed.
- Real reproductions: Windows archive case collision, malformed archive acceptance, concurrent settings lost update, and missing Startup uninstall failure.
- No source edits, migrations, production actions, installer acceptance, clean-VM run, live OAuth, or multi-process deployment test.
