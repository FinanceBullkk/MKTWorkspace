---
title: Profile manager internal-use finishing pass
status: blocked
priority: P1
effort: medium
created: 2026-09-08
branch: multi-repository
tags: [proxy, relay, browser, readiness]
---

# Profile manager internal-use finishing pass

## Approved scope

The owner approved this finishing pass after accepting the
[8 September product direction](../../MKTTool/docs/project-overview-pdr.md#product-direction-decision---8-september-2026).
Deliver usable proxy/Relay/manual-profile operations with honest release evidence. Preserve
Lane C CLOSED and recorded identity FAIL. CFT is evaluated as the existing compatibility runtime;
no new antidetect research, vendor contact, real-account testing, or posting automation.

The plan is reviewed against the accepted three-step sequence, current artifact-quota report,
and release boundaries. Prior documentation edits are owned work; preserve the unrelated
untracked `plans/reports/ci-260906-2341-mktbrowser-artifact-quota.md`.

## Phases

| Phase | Scope | State |
|---|---|---|
| 1 | Recover Browser hosted CI and land retention fix | BLOCKED - organization artifact quota |
| 2 | Validate packaged CFT profile/Relay/proxy behavior | PARTIAL - local contracts pass; managed VM lifecycle failed |
| 3 | Clean-machine acceptance and controlled handoff | PARTIAL - installer gates pass; release/human gates open |

### Phase 1 - CI

- [x] Confirm failure is artifact upload quota and inspect PR #17.
- [x] Recheck local lint, typecheck, installer contracts; record explicit skips.
- [x] Inspect current retained artifacts and retry failed PR jobs once after quota recalculation.
- [ ] If required checks pass, merge the reviewed retention change without weakening gates.
- [ ] Verify resulting main CI; if quota persists, diagnose access/billing boundary before retry.

### Phase 2 - Packaged behavior

- [x] Inventory exact Node 22, CFT runtime, installer, Relay, proxy harness, and VM resources.
- [x] Build or obtain the current package and bind source/version/hash to each result.
- [ ] Verify managed create/open/close/reopen and persistence with disposable profiles.
- [ ] Verify Relay handoff and proxy failure behavior; separate local fixtures from real egress.
- [ ] Verify actual proxy/IP/DNS/WebRTC where resources permit; unavailable evidence stays OPEN.
- [x] Review and fix concrete harness regressions, then rerun affected local gates (38/38).

#### Reviewed harness-only adjustment

Owner supplied a local dedicated proxy-list path on 8 September; select one entry in memory,
never print credentials, preserve the source file, and consume only a generated handoff copy.
Extend the existing correct-proxy smoke and focused helper/tests (MKTTool scripts only):

- Require explicit CFT directory, version and executable SHA-256; verify before and after staging.
- Isolate child LOCALAPPDATA/APPDATA as well as user-data-dir; no operational activation state.
- Retain real-proxy distinct-egress checks; no synthetic results promoted as network evidence.
- Provision the exact-path CFT UDP block only with explicit disposable-VM opt-in and positive
  VirtualBox detection, after installer uninstall removed its rules. Remove only the owned rule.
- Exercise fresh signed create/open, close/reopen with the same profile ID, then a closed-port
  proxy rejection and recovery using new tickets. Preserve rejection/replay/expiry contracts.
- Tests cover option validation, pins, environment isolation, bounded cleanup and launch sequence.
  Production code, engine pin, licensing, accounts and databases stay unchanged.

This adjustment is reviewed against the existing harness, driver firewall contract and accepted
three-phase scope. The VM installer gate runs before any Node fixture is copied into the guest.

### Phase 3 - Handoff

- [x] Verify installer/repair/uninstall and retained profile data on a disposable clean machine.
- [x] Record operator-first-use and canary requirements without fabricating human observations.
- [x] Update living roadmap/release guidance and record exact closed and open gates.
- [x] Commit/push scoped validated Browser README and MKTTool harness/docs without merging.
- [ ] Publish only an eligible, identified artifact (BLOCKED; no publication in this pass).

## Acceptance and stop conditions

- Hosted GitHub checks are the CI gate; local or VM results never replace them.
- A passing CFT lifecycle test proves compatibility, not fingerprint isolation or real-proxy routing.
- Do not overwrite the historical Browser tuple or silently repin its engine.
- Never alter operational profiles, credentials, databases, VM snapshots, or firewall state merely
  to make a test pass. Use owned disposable resources and preserve identity/data on repair.
- A required owner/human input or external service restriction is an explicit blocker; finish
  independent work and report the exact next action. Elapsed canary days cannot be accelerated.
- Update every phase checklist from evidence before reporting ready for the stated use scope.

## Evidence

Evidence and the final status report are stored under this plan. Large/generated artifacts stay
under `local-test-artifacts/`; no credentials, raw proxy endpoints, cookies, or operational data
enter tracked reports. Local, VM, hosted, real-network, and human gates are reported separately.

- Fresh local prerequisites at Browser `ad0c7182`: Node 22.23.2 / Yarn 4.5.0;
  workspace contract, lint, and typecheck PASS. Installer suites: 374 PASS, 0 FAIL,
  1 live-machine integration SKIP (not enabled on the developer host).
- Run `34002472571` failed jobs retried once on 8 September after quota cleanup and
  the recalculation window elapsed. Attempt 5 failed again at artifact upload;
  packaged-contract SKIPPED. PR #17 remains unmerged. No repeated quota retries.
- Current actor cannot inspect organization billing (404 / admin:org scope needed)
  or Packages (403 / read:packages scope needed). MKTTool has zero retained Actions
  artifacts; Browser retained artifacts total only 56,122 bytes. An organization
  administrator must resolve quota/billing before another hosted retry.
- Disposable VM available: `mkt-phase5-clean`, clean snapshot
  `326357d7-35b1-4c91-92ca-856fb0f35e9b`, powered off at inventory.
- Existing proxy smoke defaults to the licensed engine in its isolated settings root.
  The finishing fixture explicitly selected hash-pinned CFT and a disposable proxy handoff;
  browser-page egress evidence remains OPEN. Existing packaged verifier covers unmanaged
  lifecycle and managed rejection, not a successful Relay/proxy managed launch.
- Initial local installer command built the executable but failed its metadata step
  because MKT_BROWSER_ENGINE_RELEASE_FILE was unset. Outputs were preserved separately;
  rerun uses the repository's existing windows-engine-release.json without repinning.
- Owner freed host memory: 8.37 GiB available. Exact disposable clean snapshot restored
  and VM started headless. No owner applications were stopped by the agent.
- Identified local installer built successfully: 145,148,544 bytes, SHA-256
  `2a614301d5223a3bd77943d66c18f0fe6c0187381da1cf360be011f310e92f9e`;
  app.asar `7a5af62dceb32315e9401380f1fb67eeae9566da23700f3218124edd14d9d930`.
  Browser source ad0c7182 with README-only working diff; no publication or new engine pin.
- CFT packaged verifier PASS, 1/1 iteration, 6.544 s, CFT 152.0.7977.64 with exact executable
  SHA-256 checked. Browser critical coverage PASS: lines 90.87%, branches 83.06%.
- Exact bundled Relay v16 executable PASS, 35 checks, including crypto/replay/restart/crash/
  corruption/retirement. Test environment isolated from operational Browser tokens.
- Disposable VM clean install PASS 9/9; initial uninstall PASS 15/15, preserving profile/token
  and unrelated Relay state. Fresh-snapshot repair PASS 13/13; post-repair uninstall PASS 15/15.
  Defender enabled with no clean-install or repair detection.
- One owner-supplied dedicated proxy passed independent direct/proxied distinct-exit probes.
  Managed attempt 1 failed at DevTools discovery (17.63 s); diagnostic attempt 2 failed during
  CFT version inspection. No successful managed lifecycle or browser-page egress claim.
- Both attempts used bundle SHA-256 `7393d947ce82e95e5ea93bd7a425566e2253fa810aba4ce05c0b496a3a500b65`.
  After attempt 2: no Browser/Chrome/Node, disposable roots/rules, or credential handoff remains.
  The source proxy list was read only; generated host handoff copies were removed after transfer.
- Separately reproduced and corrected an exited-process cleanup race; final 38/38 focused tests,
  typecheck, scoped lint and actual Windows read-only helper check PASS. This is not established
  as the cause of either VM failure and does not convert their results into PASS.
- [Final evidence and handoff report](./finishing-pass-report.md) separates technical receipts,
  Git delivery, remaining blockers, and the next eligible verification steps.
- Browser scope branch is pushed at `2c68a6d9`; MKTTool PR #68 is pushed at `c408315a` with
  harness commit `afaf62ed`. MKTTool secret scan `34164096945` PASS; CI `34164096990` PASS
  (tests/coverage/build, audit, PostgreSQL contracts and Windows Relay; PR deploy check skipped).
  No merge/deploy/release. The disposable VM is confirmed powered off after normal shutdown.
