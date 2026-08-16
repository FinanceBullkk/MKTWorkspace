---
title: MKB-03 local onboarding fixes implementation report
date: 2026-08-13
status: automated-verification-passed-human-retest-open
platform: Windows x64
---

# MKB-03 Local Onboarding Fixes

## Outcome

All P0, P1, and P2 findings from the 13 August local human test have code fixes. Automated tests,
typechecks, builds, packaged runtime verification, and combined NSIS installer compilation pass.
No installer was launched, no firewall state was changed, no local profile/test state was removed,
and no real account was used.

This is not evidence that BrowserLeaks is clean on the target machine. The human gates below remain
open and must pass before real-account use or team rollout.

## Implemented Fixes

### P0 - Mandatory per-engine WebRTC containment

- Windows CFT and CloakBrowser runtimes now use separate stable executable paths:
  `chromium\cft\runtime\chrome.exe` and `chromium\cloakbrowser\runtime\chrome.exe`.
- Runtime updates use staging, an atomic directory swap, rollback recovery, and a version marker.
- The per-user NSIS installer elevates only a hash-pinned PowerShell firewall transaction. It creates
  separate outbound UDP block rules for the exact stable CFT and CloakBrowser paths.
- Each proxied launch verifies its selected engine's exact program path, single rule, UDP protocol,
  outbound direction, block action, all-profile coverage, and enabled Domain/Private/Public firewall
  profiles before browser startup. Any uncertainty returns `PROXY_REJECTED` without spawning Chrome.
- The packaged verifier no longer has a proxy/firewall bypass. It asserts that an unprotected managed
  proxy launch is rejected, then uses an unproxied disposable profile for the real browser lifecycle.
- Installer removal deletes only rules in the owned MKT Browser firewall group. Profile data remains.
- Proxy-geo probe failures no longer log raw error messages that could contain endpoints or secrets.

Trade-off: the application remains per-user, while the required machine-wide Windows firewall rules
need one UAC approval during install/uninstall. This is smaller than an always-running elevated helper,
keeps privilege out of normal launches, and remains stable across runtime versions.

### P1 - Download modal recovery

- A failed CloakBrowser download exposes `Switch to Chrome for Testing` in the blocking modal.
- The action persists only `browserEngine: "cft"` through `SettingsStore`, preserves all other settings,
  profiles, and Relay state, swaps the driver bootstrap, and starts CFT download.
- Concurrent clicks share one in-flight operation. A persistence failure rolls the driver back, and
  settings are published to memory only after the file write succeeds.
- The CFT button appears only for a CloakBrowser error and labels CFT as a compatibility fallback,
  not the primary antidetect runtime.

### P1 - Stale setup device hint

- `mkttool.setup.device-id` is used only as a resume hint. A fresh `/setup` stays `unchecked` until the
  user presses `Confirm this PC`, preserving the browser local-network permission gesture.
- A saved hint triggers a live Relay identity probe. The hint is cleared for a reset/not-enrolled,
  revoked, conflicting, or different-owner authority; it is replaced only by a live same-owner device.
- Different-owner and revoked identities remain fail closed in the setup state machine and are never
  auto-adopted or granted an operator key.
- Coverage includes missing, reset/revoked, replaced, same-owner, different-owner, and unknown-owner
  states.

### P2 - Progress and status guidance

- Unknown download length renders `Connecting...` with attempt/max-attempt and resume state instead of
  `0.0 MB / 0.0 MB - 0%`.
- Relay status guidance now makes `/setup` the primary path. Manual operator-key entry is explicitly
  recovery/legacy, while the page keeps the statement that the server does not hold the operator secret.

## Main Files Changed

MKT Browser:

- `.gitignore`
- `README.md`
- `apps/desktop/build/installer.nsh`
- `apps/desktop/build/windows-webrtc-firewall.ps1`
- `apps/desktop/src/main/ChromiumBootstrap.ts`
- `apps/desktop/src/main/ChromiumBrowserDriver.ts`
- `apps/desktop/src/main/chromium-runtime-path.ts`
- `apps/desktop/src/main/windows-webrtc-firewall.ts`
- `apps/desktop/src/main/index.ts`
- `apps/desktop/src/renderer/src/components/onboarding/ChromiumBootstrapModal.tsx`
- `apps/desktop/src/preload/index.ts`
- `apps/desktop/src/shared/ipc-exposure-policy.ts`
- `packages/settings-store/src/index.ts`
- `packages/types/src/index.ts`
- targeted contract, packaging, settings, runtime-path, and firewall tests
- `scripts/verify-packaged-runtime-contract.cjs`

MKTTool:

- `relay/install-relay.ps1`
- `relay/setup.bat`
- `relay/src/installer-shortcut-contract.test.ts`
- `src/components/relay/relay-enroll-card.tsx`
- `src/lib/setup/reconcile-saved-setup-device.ts`
- `src/lib/setup/reconcile-saved-setup-device.test.ts`
- `relay/src/relay-status-page.ts`
- `relay/src/relay-status-page.test.ts`
- `README.md`
- `docs/development-roadmap.md`
- `docs/project-changelog.md`
- `docs/system-architecture.md`

Note: Relay status and the initial reconciliation helper were already recorded in local commit
`5304630 fix(setup): resume enrollment from live relay`. It was audited and preserved; no history was
rewritten. MKTTool tracks `origin/feat/mkt-browser-clean-break` at the Techieslab repository.

## Automated Evidence

MKT Browser, Node 22.23.1:

- Node guard: 2/2 pass.
- W02: 8/8 pass.
- MKB-01: legacy import 4/4 and runtime contract 4/4 pass.
- MKB-01E: 7/7 pass.
- MKB-02: profile manager 3/3, MCP managed mode 10/10, desktop managed contracts 6/6 pass.
- Packaging guards: 10/10 pass.
- MKB-03 focused browser contracts: 19/19 pass before the final audit changes.
- Final security/bootstrap/firewall regression set: 13/13 pass.
- Settings persistence regression: 1/1 pass.
- Root typecheck: pass.
- Lint command: pass/no-op because workspaces define no lint tasks.
- Desktop production build: pass.
- Packaged runtime/profile lifecycle verification: pass. The packaged binary rejected an unprotected
  managed proxy launch and completed a real disposable unproxied Chrome launch/close lifecycle.
- Combined per-user NSIS installer: pass after standalone retry. Immediate post-build attempts sometimes
  hit transient `EBUSY` on generated `resources/companion/cs.js`; workspace links were restored and a
  clean standalone retry succeeded without stopping the installed app.

MKTTool:

- Focused setup/reconciliation/Relay status suite: 38/38 pass.
- Relay installer shortcut/config/secret contracts: 14/14 pass, including an isolated locked legacy
  shortcut fixture that preserves `relay-config.json` and completes installation.
- Relay v10 packaged executable smoke: pass for live health, signed enrollment, DPAPI-backed operator
  setup, encryption round trip, launch-ticket rejection/replay/expiry, and credential reveal policy.
- Full Vitest: 141 files, 1328 tests pass.
- Typecheck: pass.
- ESLint: pass.
- Next production build: pass; existing warning remains: `Dynamic filesystem access causes tracing of
  the whole project`.

Final static checks:

- `git diff --check`: pass in both repositories.
- Secret-marker scan of diffs: 0 matches in both repositories.
- Temporary `[DEBUG-*]` markers: 0 matches.

## Installer Artifact

- Path: `E:\MKTWorkspace\MKTBrowser\apps\desktop\release\installer\MKTBrowser-win-x64.exe`
- Size: 145,997,882 bytes
- SHA-256: `95F545DC2095E822B8F979F3C4079959F1C45AECD7C607D79226631E682EE3FF`
- Embedded Relay: version 10, 34,178,847 bytes, SHA-256
  `5BE9F74E7586F993B141F14529022E017D7CC36E5EFB70E6838B3ACB87048272`.
- The artifact is unsigned and was not installed or published.

## Relay Installer Follow-up

The first combined-installer human retry reached Relay installation but failed at
`Move-Item -Path $stagingPath -Destination $linkPath -Force`. The destination was the existing
Unicode Relay shortcut and Windows held it open.

- The installer now creates `MKTTool Relay.lnk` directly through `WScript.Shell`. The stable ASCII
  name avoids both the COM ANSI-path failure and the locked-destination staging rename.
- An exact existing shortcut is treated idempotently and is not rewritten.
- New shortcut writes use a bounded retry budget for Windows sharing/lock errors; unrelated errors
  still fail closed.
- Legacy `Cầu nối MKTTool.lnk` entries are inspected by target before removal. Unrelated shortcuts
  are preserved. A still-locked owned legacy shortcut produces a warning and no longer aborts the
  otherwise complete Relay installation.
- All installer output is English/ASCII, so the NSIS details pane no longer renders Vietnamese as
  mojibake on an English Windows code page.
- `relay-config.json`, DPAPI state, profiles, and existing Relay ownership are preserved.

## Adversarial Review

- Privilege boundary: only the installer firewall transaction elevates. Normal app/runtime updates do
  not request Administrator rights.
- Runtime upgrades: rules target stable per-engine paths; atomic replacement keeps the path unchanged.
- Rollback: failed swaps restore the previous runtime when possible; startup recovers an interrupted
  swap when only `runtime.rollback` remains.
- Stale rules: installer verifies candidates before replacing final rules, then removes only owned stale
  MKT Browser rules. Uninstall removes only the owned group.
- Engine separation: CFT and CloakBrowser have different paths, rule names, and pre-launch checks.
- Fail closed: proxied launch has no verifier or environment bypass. Rule/path/firewall uncertainty
  blocks before proxy probing, bridge startup, or Chrome spawn.
- Switch race: double-clicks share one operation; running profiles block engine replacement; persistence
  failure restores the previous driver bootstrap and leaves the previous setting cached.
- Owner binding: localStorage cannot authorize a device. Relay/server authority controls adoption and
  operator-key delivery; revoked/conflicting/different-owner states remain repair-only.
- Failure messages: user-facing errors disclose engine labels and remediation only, not IPs, proxy
  endpoints, credentials, device secrets, or operator keys.
- Shortcut locks: a locked legacy shortcut cannot block fresh installation. Cleanup is target-bound;
  a persistent lock may leave the legacy and ASCII shortcuts together until a later reinstall or
  uninstall, but it does not delete unrelated links or local Relay state.

## Human Retest - Fresh UI-Only Journey

Use only disposable profiles and test proxies. Do not use a real account.

1. Close the existing installer window if any, then run the artifact above from Windows Explorer.
2. Approve the single UAC prompt for WebRTC protection. Do not run manual firewall PowerShell.
3. Open MKTTool on the same PC, sign in with the authorized test user, and open `/setup`.
4. Complete setup using visible buttons only. Do not use DevTools, edit localStorage, or edit JSON.
5. Confirm the fresh journey reaches `Ready` without losing existing profile data or Relay state.
6. Reproduce/force a CloakBrowser download failure. In the modal, click `Switch to Chrome for Testing`.
7. Confirm CFT download starts, the modal labels it compatibility-only, and unrelated settings remain.
8. Reset/revoke the disposable Relay identity, return to `/setup`, and confirm recovery requires no
   localStorage deletion. Separately confirm a different-owner identity stays at `Needs repair`.
9. Create/launch one disposable managed profile with a test static proxy.
10. Verify HTTP egress matches the assigned proxy without recording the IP in the report.
11. In BrowserLeaks, test the root document, a newly opened tab, and an iframe. Confirm no operator
    public IPv4, public IPv6, or local candidate is exposed.
12. Restart MKT Browser and repeat HTTP plus all BrowserLeaks checks.
13. Trigger/install a browser runtime update and repeat HTTP plus all BrowserLeaks checks. Confirm the
    executable remains under the stable engine path.
14. Validate fail closed through UI: use an installer/firewall recovery scenario that makes protection
    unavailable, then confirm the proxied profile does not open and the message directs the operator to
    rerun the installer. Do not manually edit rules as the normal recovery path.
15. Repeat proxy and BrowserLeaks checks separately for CFT and CloakBrowser. One engine does not clear
    the other engine's gate.
16. Confirm uninstall/reinstall preserves profile data and reinstalls protection with the visible UAC
    journey.

## Residual Risks and Open Human Gates

- BrowserLeaks no-leak evidence for CFT and CloakBrowser is still open.
- HTTP proxy egress after restart and runtime update is still open.
- Fresh-account UAC, SmartScreen, and browser local-network-access prompts are still open.
- Real Windows network-profile changes and disabled-profile behavior need human validation.
- Installer rollback/uninstall preservation needs human validation.
- A persistently locked legacy Startup shortcut may remain beside `MKTTool Relay.lnk`; verify after
  reboot that only one Relay process owns port 47821 and that onboarding remains healthy.
- Relay v10 is embedded and checksum-verified in this local installer but has not been published to
  the immutable server URL. Future clean builds must use the verified local archive until explicit
  publish authorization is given.
- The installer is unsigned and not approved for distribution.
- The immediate post-build installer command intermittently encounters a transient generated-output
  file lock; standalone retry succeeds, but CI reliability should be observed.

## Unresolved Questions

1. Should the transient NSIS `EBUSY` retry be automated inside the packaging helper if it reproduces in CI?
2. After both engine-specific BrowserLeaks gates pass, is CFT allowed only for technical compatibility
   testing, or for any operational low-risk workflow?
