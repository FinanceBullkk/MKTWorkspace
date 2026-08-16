# Phase 03 - Windows Installer, Update, Rollback, and Uninstall

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Depth achieved: **D3 adversarial trace**
Status: **COMPLETE - H41-H54 classified; C21/C10 fixed, C22 source-remediated with its Windows VM gate pending. No install, uninstall, firewall mutation, or publish performed.**

## Findings

### C21 - P1 - Failed ADMIN rollback smoke strands the device on the rejected tuple (fixed in follow-up)

Boundary: compatibility rollback convergence.

`activateUpdate()` catches activation or smoke failure and restores the prior current set. The
parallel `activateRollback()` path has no recovery block. It restores the retained set, activates
its engine pin, marks `phase: "smoke"`, and then lets a smoke exception escape.

Reproduction:

1. Start with protected state `current = sequence 2`, `retained = sequence 1`.
2. Prepare a valid one-use ADMIN rollback to sequence 1.
3. Let every restore complete, then make post-activation smoke fail.
4. Disk now contains sequence 1, while protected state still says current 2 and keeps a pending
   rollback in `smoke` with every artifact marked activated.
5. Every Relay start retries the same rejected rollback. New update or rollback preparation is
   refused because a transition remains pending.

Impact: the newer known-good tuple is not restored; normal operation and later transitions remain
blocked until manual repair. This is a broken rollback under the plan severity model.

Evidence: `MKTTool/relay/src/compatibility-transition-runner.ts:62`,
`MKTTool/relay/src/compatibility-transition-runner.ts:81`, and
`MKTTool/relay/src/local-updater.ts:145`.

Remediation: give rollback activation the same bounded recovery guarantee as update activation.
On any restore or smoke failure, reverify and restore the original `current` set, reactivate its
engine pin, clear the pending transition only after the original tuple is coherent, restart owned
processes, and record the rollback authorization as consumed even when the attempt fails. A later
retry requires a fresh ADMIN authorization.

Retest gate: inject failure at each rollback restore step and at every smoke step. After each
failure and simulated restart, assert exact sequence-2 bytes and pin are active, `pending` is null,
processes restart, the failed authorization id is rejected as already used, and only a fresh ADMIN
authorization can prepare another attempt. Include the currently missing rollback-smoke-failure
regression.

### C22 - P2 - Per-user installs share machine-wide firewall ownership (source-remediated; VM gate pending)

Boundary: Windows firewall lifecycle across multiple local Windows accounts.

The NSIS application install is per-user, but the elevated firewall transaction uses two fixed
display names and one fixed machine-wide group. Install repairs and promotes those global names.
Uninstall removes every rule in the group, without a user SID or installed path in the ownership
identity.

Reproduction:

1. Standard user A installs to A's LocalAppData and creates the two fixed rules.
2. Standard user B installs to B's LocalAppData. The fixed names now conflict with rules whose
   program paths point into A's profile; repair can abort or replace A's rules.
3. Either user uninstalls. `Get-NetFirewallRule -Group $group | Remove-NetFirewallRule` removes the
   other user's protection too.

Impact: one user's install/uninstall can make another user's MKT Browser fail to launch. The runtime
checks the exact program path and fails closed, so this trace does not show silent direct egress;
the impact is cross-user availability and operator confusion.

Evidence: `MKTBrowser/apps/desktop/electron-builder.yml:111`,
`MKTBrowser/apps/desktop/build/windows-webrtc-firewall.ps1:10`, and
`MKTBrowser/apps/desktop/build/windows-webrtc-firewall.ps1:42`.

Remediation: support exactly one Windows operating-system user for MKT Browser and Relay on each PC.
Before mutating firewall state, the installer must detect an existing installation/rule group owned
by a different Windows user path and stop with a clear safe action. It must not repair, replace, or
remove that other user's rules.

Retest gate: install under disposable standard account A, then attempt installation under account B.
B must fail before mutation, A's rules and launch must remain intact, and B may install only after A
uninstalls cleanly.

### C10 - P3 - Packaging fixture remains dependent on live machine state (fixed in follow-up)

The 27-test packaging suite passed only after confirming no real MKT Browser, Relay, or MultiZen
process was running. Its Windows ownership fixture invokes the production conflict detector, which
enumerates machine-wide process names, listeners, and startup state. A real `MKTBrowser.exe` at a
different path changes the fixture result before its disposable process is created.

This is not a product lifecycle failure, but it is a verification-integrity failure: identical
source can pass or fail based on operator-machine state.

Evidence: `MKTBrowser/apps/desktop/build/windows-install-conflict-detection.ps1:158` and
`MKTBrowser/apps/desktop/scripts/windows-installer-ownership-fixtures.test.cjs:63`.

Retest gate: move process/listener/shortcut classification behind injected inventory for the
deterministic suite. Keep any real-machine detector exercise as an explicit integration gate with
preconditions and a distinct result.

## Hypothesis Classification

| ID | Classification | Evidence and residual gate |
| --- | --- | --- |
| H41 | Closed against unsafe activation | Staging is fully size/hash verified before pending state. Interrupted activation re-verifies the selected set and either replays it or restores protected `current`. Real reboot remains a human observable. |
| H42 | Closed against marker-driven partial activation; power-loss durability not statically proven | Protected state and public marker use temporary-file rename; state has read-back verification. No path trusts the marker as artifact authority, and missing/corrupt artifacts fail before activation. No file or directory `fsync`/`FlushFileBuffers` exists, so abrupt-power-loss availability remains a human gate. |
| H43 | Closed | Preparation exclusion is in-memory, so process death clears it. Once preparation commits, protected `pending` state blocks another transition. The separate helper file lock records owner PID and expires after five minutes when the owner is gone. |
| H44 | Closed for update failure and successful rollback | Update state changes `current` only after smoke succeeds. Update failure restores current bytes and clears pending. Successful ADMIN rollback swaps current/retained while preserving the monotonic high-water mark. Rollback smoke failure is C21/H45. |
| H45 | Fixed in follow-up (C21) | Failed rollback smoke restores the newer current tuple and pin, clears pending, restarts processes, and consumes the authorization. |
| H46 | Closed | Normal uninstall has no path to Browser userData or Relay config/protected secrets. It removes owned binaries, shortcuts, autostart, and firewall state only. |
| H47 | Closed statically and by disposable repair fixture | Browser data is outside the install directory. Relay install overwrites only the executable, preserves existing `relay-config.json`, and leaves protected secrets in place. Human gate must hash real identity roots across two repairs. |
| H48 | Closed | `RelayOwned` is derived before Relay install, preserved through legacy-upgrade repair, and controls exact Relay executable/shortcut cleanup. A pre-existing Relay is preserved. |
| H49 | Closed | Relay writes a DPAPI-protected receipt before secret deletion. The server stores the signed finalization authorization in the same transaction that erases the one-use seed. Local finalization verifies against the per-retirement public key retained in the receipt, then deletes the receipt. |
| H50 | Closed | Pinned Relay fetch requires positive version and size, lowercase SHA-256, HTTPS URL ending in `/v{version}`, and verifies local, cached, resumed, and downloaded bytes. No latest fallback exists. |
| H51 | Source-remediated; VM gate pending (C22) | Foreign per-user engine paths are rejected in preflight and again before elevated install/uninstall mutation. |
| H52 | Could not close statically | `rcedit` runs in `afterPack`, before any future signing step, so its ordering does not invalidate a later signature. Current Windows signing is disabled, so Authenticode validity belongs to Phase 04. Final installed ACLs require a two-account human check. |
| H53 | Accepted same-user residual; cross-user ACL requires human gate | Install and engine roots are per-user LocalAppData. Launch checks the stable exact path and firewall rule but deliberately does not hash the 280 MB engine on every launch. Same-user tampering is outside the documented boundary; a second standard account must be proven unable to write the Browser, `app.asar`, Relay, and engine files. |
| H54 | Existing-install path closed; clean-machine withdrawal deferred to Phase 04 | Protected compatibility state is initialized once, survives repair/uninstall/retirement, and is not lowered by a later installer. Missing state plus identity data routes to ADMIN repair. A truly clean machine running a withdrawn older installer has only that installer's embedded floor and bundled revocations; distribution/revocation authority must close this in Phase 04. |

## State Transition and Interruption Trace

| Interruption point | Durable/on-disk result | Next start |
| --- | --- | --- |
| During artifact download | Partial staging directory; no pending state or marker | A new preparation deletes and rebuilds that sequence's staging directory. Current tuple remains active. |
| After complete staging, before protected pending write | Complete unreferenced staging set | No activation occurs. A later preparation replaces the staging directory. |
| After protected pending write, before marker write | Verified staging + protected pending; marker may be absent | Startup recreates marker from protected state, re-verifies every artifact, then converges. |
| After stop or between artifact activations | Pending phase and activated-artifact list were persisted before each apply | Startup re-verifies staging and replays idempotent activation. Missing staging restores protected current. |
| Between engine runtime renames | `runtime`, `runtime.partial`, and `runtime.rollback` may be split | Replay re-extracts the signed artifact; activation failure falls into current-set restoration. Browser also refuses launch while the compatibility marker exists. |
| During update smoke | New bytes/pin active; protected current still names the old set | Smoke failure restores protected current, clears pending/marker, and restarts owned processes. |
| After staging promotion, before state completion | New set may be under `sets/{sequence}` while protected current remains old and staging is absent | Startup takes the missing-staging recovery path and restores protected current. The unused promoted directory is inert. |
| During ADMIN rollback restore | Pending rollback remains bound to protected retained set and one-use authorization | Startup re-verifies retained bytes and replays rollback. |
| During ADMIN rollback smoke | Retained bytes may be active when smoke rejects them | Recovery restores current bytes and pin, consumes authorization, clears pending, restarts processes, then surfaces the smoke error. |
| After state/marker completion, before process restart | Coherent tuple committed; processes may remain stopped | Next normal startup uses committed state. Availability may need manual launch, but no mixed tuple is accepted. |

## Destruction Scope

| Operation | Paths/state it may change | Identity-bearing state preserved |
| --- | --- | --- |
| Repair/reinstall | Selected Browser install directory; exact Browser startup shortcut; machine-wide firewall rules; Relay executable and exact owned Relay shortcuts; installer ownership registry values | `%LOCALAPPDATA%\MKTTool\MKTBrowser` data including profiles, MCP token, engine cache; Relay `relay-config.json`; Relay DPAPI protected secrets; compatibility state; server binding |
| Normal uninstall | Browser install directory and Browser autostart; firewall group; exact Relay executable/owned shortcuts only when `RelayOwned = 1` | Browser userData root; Relay directory contents other than the owned executable; Relay config, protected secrets, compatibility state, device identity; all profile data |
| Planned Relay retirement | Server revocation and account unpinning; local operator key, grant state, device private key, `relay-config.json`; retirement guard/tombstone; protected receipt until finalization | Browser profiles/token/engine data; MultiZen data; compatibility update state; durable server completion record and signed finalization authorization |

The trace matches the 14 August decision: uninstall is not retirement, and Browser profile deletion
is not implied by either operation.

## Human Windows Watch List

1. Power-cut/reboot after staging, marker creation, each activation, engine swap, smoke, staging
   promotion, each rollback restore, and rollback smoke. Observable: Browser never opens a profile
   while marker/state disagree; next boot reaches one complete tuple or explicit repair.
2. Run repair twice. Hash Browser profile DB/root, MCP token, Relay config, DPAPI blobs, and protected
   compatibility state before/after; every identity hash must remain unchanged.
3. Uninstall an installer-owned Relay, then a pre-existing Relay case. Observable: only the owned
   executable and exact shortcuts differ; config/protected secrets and Browser data remain.
4. Complete retirement, rotate the normal ticket key, restart, retrieve server finalization after
   the one-use seed is erased, and finish local finalization. Browser data must remain unchanged.
5. Use two standard Windows accounts to verify C22 remediation: account B must stop before mutation and leave account A's rules intact.
6. From a second standard account, attempt writes to installed Browser, `app.asar`, Relay executable,
   both engine `chrome.exe` paths, and identity roots. Executable writes must be denied; identity
   roots must not be readable or writable cross-account.
7. After Phase 04 signing, run `Get-AuthenticodeSignature` on installer and installed executables.
   Every required signature must be valid after all resource edits.
8. Reinstall an older installer over a device with retained state and try a withdrawn installer on a
   truly clean VM. Existing state must refuse downgrade; clean-VM withdrawal is a Phase 04 release
   authority observable.

## Verification - Audit Snapshot

| Gate | Result |
| --- | --- |
| MKTBrowser `test:packaging` under Node 22 | PASS - 27/27 |
| MKTTool focused lifecycle suite | PASS - 10 files, 72/72 |
| Real MKT Browser/Relay/MultiZen processes before tests | None running |
| Source/product changes | None |
| Installer/uninstaller execution | Not performed |
| Publish/deploy/credentials | Not used |

This snapshot records the original read-only audit before the remediation follow-up below.

## Not Examined

- No real installer, repair, uninstall, reboot, power interruption, firewall mutation, ACL mutation,
  Authenticode signing, R2 publication, or operational-machine transition was run.
- Phase 04 owns root/delegation authority, installer withdrawal, signed minimum-floor policy, and
  final Windows signature evidence.
- Existing user changes in `MKTBrowser/packages/mcp-server/src/server.ts` and
  `MKTTool/docs/diagram-design-architecture.html` were not touched.

## Owner Decisions

1. Supported topology is one Windows operating-system user running MKT Browser and Relay per PC.
   A second Windows-user installation must be rejected before firewall mutation.
2. A rollback authorization is consumed by the first rollback attempt, including a failed attempt.
   After restoring the current tuple, another attempt requires fresh ADMIN approval.

## Remediation Follow-up

Authorized after the read-only audit on 2026-08-16.

| Finding | Result | Regression evidence |
| --- | --- | --- |
| C21 | Fixed | Shutdown failure, every artifact-restore failure, and rollback smoke failure restore the original current tuple and sequence-2 engine pin, clear pending, restart owned processes, consume the failed authorization, reject its reuse, and accept only a fresh authorization. |
| C22 | Source-remediated; VM gate pending | Firewall ownership is checked in installer preflight and again inside elevated install/uninstall before mutation. A foreign per-user engine path exits with code 17. |
| C10 | Fixed | Default packaging fixtures inject process, listener, and shortcut inventory. Live-machine inspection is separated behind `test:packaging:windows-machine`. |

Follow-up verification:

| Gate | Result |
| --- | --- |
| MKTTool full tests | PASS - 186 files; 1697 passed, 6 expected fail |
| MKTTool typecheck / lint | PASS / PASS |
| MKTBrowser packaging | PASS - 29 passed, 1 explicit live-machine gate skipped |
| MKTBrowser W02 | PASS - 8/8 |
| MKTBrowser MKB03 | PASS - 30/30 under pinned Node 22 |
| MKTBrowser desktop lint | PASS |
| Installer/uninstaller/firewall execution | Not performed; disposable two-account Windows VM gate remains |

## Unresolved Questions

None for Phase 03.
