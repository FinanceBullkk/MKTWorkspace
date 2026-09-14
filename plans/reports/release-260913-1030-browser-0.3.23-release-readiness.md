# Browser 0.3.23 Release Readiness

Date: 2026-09-13

## Summary

Candidate `20260913-browser-0.3.23-relay-17-relay-payload-hash-fix-cft` is the cleanest Browser
candidate so far, but rollout remains **NO-GO**. Packaging, immutable publication, live route
read-back, and exact installer lifecycle checks pass. Exact engine activation and full clean-VM
acceptance remain open, so the operator tuple was not changed.

## Verified

| Gate | Result | Evidence |
|---|---|---|
| Source tuple | PASS | Browser `b0b5c8f57b3add2c45bf0b6dbbde7ad9d4a2aa65`; MKTTool `1fefe2cbc8babb5df52ff5971c941a1c144eefd9`; Relay 17 |
| Frozen-source seven-command quality | PASS (scope-limited) | 7/7 commands exit 0; installer suite `82 pass, 1 skip` (machine-integration); receipt `quality-frozen-b0b5c8f-1fefe2c-r2/quality-receipt.json`, SHA-256 `d98053974e7266527f5db87fe68e81100d3c3d308c203fc4f985e9904eb6f53c` |
| Build A/B equivalence | PASS | 129 normalized files; `app.asar` byte-identical, 51,770,195 bytes |
| Exact installer | PASS | 146,056,721 bytes; SHA-256 `a0adfcc0727bd2241d32cad426e06931f64836d1e1f44786f0eb9a46504ba549` |
| CFT archive | PASS | 202,713,690 bytes; SHA-256 `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004` |
| Sequence 23 publication | PASS | Immutable R2 objects, full read-back; transition from sequence 22 |
| Sequence 24 publication | PASS | Immutable R2 objects, full read-back; direct transition from operator sequence 21 |
| Sequence 25 publication | PASS | Immutable R2 objects, full read-back; fresh-install transition from sequence 0 |
| Live sequence 23 routes | PASS | All five artifacts HTTP 200, exact size/SHA-256; `candidate-0.3.23/live-route-readback.json` |
| Live sequence 24 route | PASS | Manifest HTTP 200; installer HTTP 200, exact size/SHA-256 |
| Relay network token | PASS | `/api/relay/download/v17` full GET, 34,289,393 bytes, SHA-256 `d8bf25dcb446d779bd5461419ea7562044e280ac1d16592a71a52f156f6359cf` |
| Railway | PASS | Deployment online; active sequence 25; mapping `0 -> 25`, `21 -> 24`, `22 -> 23`; live manifest HTTP 200 |
| Exact clean-VM installer lifecycle | PASS (scope-limited) | Restored snapshot `326357d7-35b1-4c91-92ca-856fb0f35e9b`; clean `9/9`, repair `13/13`, uninstall `15/15`; bound receipts `childExitCode=0` |

Post-publication verification: Railway deployment `a4bbb73a-12c7-4a25-9c85-24bb4e505f83` is
`SUCCESS` on MKTTool commit `1fefe2c`; `/api/healthz` is HTTP 200 and the authenticated manifest
route returns sequence 25 with transition `0 -> 25`. The earlier claim that VBoxManage was absent
was incorrect: the executable exists at `C:\Program Files\Oracle\VirtualBox\VBoxManage.exe`.
The later installer-only runs below supersede the earlier no-VM-run checkpoint.

The sequence-24 publisher was re-run after the R2 `HEAD` fix. All seven existing immutable objects
were accepted and full GET/hash verification passed; no object was overwritten.

The first 0.3.23 VM bundle used a Windows PowerShell 5.1 process-wrapper defect that recorded
`childExitCode: null` even when the child matrix passed. The wrapper was corrected by retaining the
process handle before `WaitForExit`; the corrected bundle hash is
`d9b88489494523045fd0eb85c1f7ed41808d7c551888f890c30a29b769a0627d`. Clean, repair, and uninstall
were then rerun with the corrected wrapper. These receipts are local-only evidence and do not attest
the candidate or change publication/promotion state. The retained candidate descriptor and the exact
frozen-source quality receipt both bind Browser `b0b5c8f` and MKTTool `1fefe2c`; later Browser
`50a4c6c` and MKTTool `8a41e26` changes are documentation-only.

Evidence root: `local-test-artifacts/local-release-20260913/vm-gate/` (ignored, retained locally).
Each bound receipt has `releaseReady: false`; local raw hashes match its `rawEvidence.sha256`.

| Gate | Completed UTC | Bound receipt SHA-256 |
|---|---|---|
| Clean, 9/9 | 05:01:41Z | `0d2d3a4e5e08ff66aa117c24ea3b4d088fdee99002bb8d87a7354dd4dc376cbd` |
| Repair, 13/13 | 05:20:14Z | `89de8c9f5b740b1cbda2c74599ecfe100963dc8b9873089a2f6160383d484155` |
| Uninstall, 15/15 | 04:55:27Z | `a57bbc3441edd5af4ebea7d0db3272f7ef2711ee5f9341162eb2acf3ed1c3a3c` |

Earlier clean/repair wrapper failures remain historical failures; a later PASS does not rewrite
them. A repair retry carrying copied output files was rejected by the no-overwrite guard, not a
new repair result. The final fresh repair run above completed with exit 0. No real engine was
provisioned by these installer-only scripts. ACPI shutdown did not finish within the observed
window; the disposable VM was powered off at 05:26:54Z after collecting receipts. No host user
application was closed; the repaired guest is retained powered off, not a final fixture-cleanup PASS.

## Download Token And Security Follow-Up

At 05:28Z, a fresh 32-byte random release-download token replaced the production value and Windows
User-scope `MKTTOOL_RELEASE_TOKEN`. Railway deployment `20102b61-5db3-468b-935b-5143c1dbae43`
completed successfully on `8a41e263f6f2439883d2f3052bb21c7f0df3509f`. An old inherited process
environment still returned HTTP 401; explicitly refreshing from User scope returned HTTP 200,
34,289,393 bytes and exact Relay v17 SHA-256. Existing build shells must refresh their environment.
Health read-back at 05:34:52Z returned ready with database, release metadata and R2 OK.

The earlier diagnostic agent reported that a human-readable Railway variable listing printed
production secrets into tool output. Rotating the release-download token closes only that token's
exposure. Other exposed credentials have not been inventoried, rotated or revoked; this security
follow-up remains OPEN. Do not blindly replace vault/signing keys: preserve encrypted data and
enrolled-device trust with a coordinated recovery/rotation procedure. No secret values are in this
report or the documentation commits.

## Open / Blocking

- Exact installer on clean VM has not passed signed CFT activation, first-run engine behavior,
  packaged Relay lifecycle, or proxy failure/recovery. Lifecycle install/repair/uninstall now pass;
  prior cache test remains a synthetic fixture.
- Sequence 25 now covers fresh sequence-0 selection. The live route is verified, but exact installer
  activation remains unexercised.
- The publisher now tolerates R2 `HEAD` responses that report zero content length, relying on the
  required full GET/hash verification; regression test passes (14/14).
- Current disposable VM has a measured UTC clock-drift failure; host free RAM has measured
  0.76-3.29 GiB during this continuation, below the safe reserve for a 4 GiB guest. No VM was
  started under that pressure; no clock, ticket, Defender, or source gate was weakened.
- Both registered self-hosted Windows runners (`mkt-ci-windows`, `mkttool-ci-windows`) are offline;
  hosted CI is not a substitute for exact installer acceptance or an independent operator machine.
- Machine-integration gate remains skipped for the fourth consecutive release.
- Unfamiliar-operator, second physical Windows PC, and seven-day canary remain unobserved.
- Installer remains unsigned; SmartScreen/UAC acceptance is not closed.
- Other credentials exposed by the earlier diagnostic output remain a security closeout blocker.
- Operator promotion remains **NO-GO**. The approved operator tuple is still Browser `0.3.17` /
  Relay `17` / sequence `21`.

## Product decisions

1. Engine cache survives in-place upgrade.
2. Uninstall removes engine cache but retains operator/profile data.
3. Network Relay download is the supported build path; cached archive is emergency fallback only.
4. Machine-integration may move into the exact VM fixture only when the same real installer and CFT
   bytes are exercised; relabeling a synthetic test is not evidence.

## Next required action

Use a stable second Windows test machine (or restore the VM after resolving clock/resource limits),
run the exact retained installer through signed activation and proxy failure/recovery, then perform
the owner-operated/unfamiliar-operator and canary checks. Do not promote before those receipts exist.

## Unresolved questions

- Which independent Windows machine will host the exact acceptance run?
- Who will perform the unfamiliar-operator walkthrough and start the seven-day canary?

## Current-machine uninstall and reinstall - 13 September 2026

The retained 0.3.20 installation was removed on this Windows host and the exact 0.3.23 installer
(`a0adfcc0727bd2241d32cad426e06931f64836d1e1f44786f0eb9a46504ba549`) was installed again.

| Check | Result | Evidence |
|---|---|---|
| Initial silent uninstall | BLOCKED | The non-elevated run stopped at WebRTC rule removal, code 1; no data was removed |
| Elevated official uninstall | PASS | Program directory and uninstall registry entry removed; owned WebRTC rules absent |
| Engine-cache cleanup | PASS | `MKTTool\\MKTBrowser\\chromium` removed; profile/operator data left in place |
| Operator data preservation | PASS | `settings.json`, `profiles.db`, and `mcp-token` SHA-256 values unchanged across uninstall |
| Exact 0.3.23 reinstall | PASS | `MKTBrowser.exe` reports file version `0.3.23`; Relay executable restored |
| WebRTC protection after reinstall | PASS | Two enabled outbound-UDP rules recreated for CFT and CloakBrowser |
| Relay and Browser local health | PASS | Relay `/health` HTTP 200; Browser MCP port `47822` listening |
| Real engine activation | **OPEN** | Existing signed local pin still selects CloakBrowser `151.0.7922.108.2`; download returns HTTP 403 |

The screenshot shown during this run is therefore a genuine first-run blocker, not an installer
failure. The supported CFT fallback is locked while the stale signed compatibility set is active;
manually editing or deleting `active-engine.json` would bypass the product trust path and was not
done. Operator promotion remains **NO-GO** until ADMIN-authorized compatibility activation installs
the published CFT pin and the exact engine completes a real first launch.

## Unresolved questions

- Which ADMIN-authorized compatibility update will replace the stale CloakBrowser pin on this PC?
- Can the owner provide a second Windows machine (or a VM with adequate RAM/clock) for independent acceptance?

## Follow-up after owner chose to skip web sign-in - 13 September 2026

The local MKT Browser was checked without using the web ADMIN flow. Retrying the built-in runtime
download reached the same signed CloakBrowser `151.0.7922.108.2` URL and failed after five attempts
with HTTP 403. The Settings page shows Chrome for Testing as a compatibility-only option, but both
engine choices are disabled while the signed compatibility set remains active. No local config or
engine pin was edited. Existing 19 profiles and the Relay/MCP shell remain visible, but profile
launch cannot be accepted until a trusted runtime is provisioned.

## Follow-up: trusted engine provisioned on current Windows host - 13 September 2026

The expired signed URL was replaced through the supported licensed-engine activation writer; no pin file was edited
manually and no signature check was bypassed. The compatibility updater now records sequence `2`, CloakBrowser
`151.0.7922.108.6`, `540036860` bytes, SHA-256
`5bd3951f470fff79998a437a139e3e8d68478bc2663402aca1666faf4eadac37`, and a fresh URL dated `20260913T111358Z`.
The runtime was downloaded and installed at the owned stable path, and six live engine processes were observed from
that path while the MKT Browser profile session was running.

The operator-facing download error was also hardened to redact signed URLs and to show a generic refresh message.
The focused contract test passes `7/7`; the source change is committed in MKTBrowser as `1dbe33f`.

This closes the 403-on-this-host incident and proves a real local engine launch. It does not close independent-machine,
unfamiliar-operator, proxy failure/recovery, signing, or seven-day canary gates; rollout remains **NO-GO**.

## Host acceptance continuation - 14 September 2026

Owner directed this build host to serve as the test machine. This host is not independent physical
hardware, so nothing below closes the second-PC gate; these are host-acceptance receipts only.

| Gate | Result | Evidence |
|---|---|---|
| Packaged Relay lifecycle (exact shipped archive) | PASS | `resources\relay\MKTTool-Relay.zip` from the installed 0.3.23; archive SHA-256 `d8bf25dcb446d779bd5461419ea7562044e280ac1d16592a71a52f156f6359cf` (matches the published Relay v17 hash); extracted EXE SHA-256 `827fc9330e5845b13d41827e3c1528439e85ff38bb6ea2ca3b72355b15ccc31e`; Node `v24.21.0` |
| Proxy failure/recovery on exact installer | BLOCKED - not run | Every unassigned production proxy rejects proxy authentication before the browser stage |

### Packaged Relay lifecycle

`npm run relay:verify` was run against the archive the exact installer placed on this host, not a
rebuilt one. All checks passed: unconfigured start, web-origin-restricted configuration, rejection
of a foreign origin, server-signed bootstrap, operator-key handoff the web app cannot read,
credential sealing round-trip, TOTP normalisation and all-or-nothing failure, forged-ticket
rejection, single-use ticket enforcement persisted to `spent-tickets.json`, survival of restart and
of forced termination, corrupt-journal fail-closed, expired-ticket rejection, secret-ticket path
separation, and the three-step retirement/recovery/finalisation close. One temporary extraction
directory could not be removed by the harness; it is disposable.

Note: the harness ran on Node 24, not the Node 22 used for MKTBrowser native builds. The subject is
a prebuilt SEA executable, so the harness Node version does not enter the artifact.

### Proxy gate blocker: production proxy inventory fails authentication

The gate never reached the browser. Five unassigned proxies were tried - `okne`,
`proxy-82-25-225-70-5718`, `proxy-82-25-225-8-5656`, `proxy-82-26-234-168-6316`,
`proxy-82-29-239-125-5273`. Each one:

- decrypted correctly from the production vault (so this is not a vault-key fault);
- answered a raw TCP connect on its endpoint (so the host is reachable and the port is open);
- rejected the independent exit-IP probe with **proxy authentication rejected**.

This is an inventory/credential condition, not an MKT Browser defect. It is also a team-impacting
condition in its own right: with the current stored credentials, no profile can launch through a
vault proxy from this host.

The designated test proxy label `MKB-00 TEST` no longer exists in either the production or the
local database, so the documented invocation cannot be run as written.

### Environment findings

- `PRODUCTION_DATABASE_URL` carries `sslmode=require`. Current `pg` / `pg-connection-string` treat
  `require` as `verify-full`, so Prisma now fails the production connection with
  `self-signed certificate in certificate chain`. Worked around for this session by exporting the
  same URL with `uselibpqcompat=true` appended; `.env` was not modified and no secret was printed.
  Any local tool that reaches production over this URL is broken until the string is corrected.
- The stale MKT Browser session from 13 September (started 18:14, six CloakBrowser engine
  processes) was still holding the engine seat. The owner closed it; no user application was closed
  by an agent.

### Tooling change

`scripts/smoke-test-mkt-browser-correct-proxy.ts` reported only `(unreachable)` and swallowed the
probe detail, which cannot distinguish a dead proxy from a rejected credential. Both probe failures
now carry their detail through the existing redaction path. `npm run typecheck` exits 0 and the
focused contract suite passes `38/38`.

### Status after this continuation

Operator promotion remains **NO-GO**. The approved operator tuple is still Browser `0.3.17` /
Relay `17` / sequence `21`. Still open: proxy failure/recovery, signed CFT activation, installer
signing, independent second PC, unfamiliar-operator walkthrough, seven-day canary,
machine-integration, and the outstanding credential-exposure closeout.

### Unresolved questions

- Were the proxy provider credentials rotated, or does the provider require IP allow-listing that
  this host is not on?
- Which proxy label should replace `MKB-00 TEST` as the dedicated gate proxy?
- Should `PRODUCTION_DATABASE_URL` be corrected in `.env` (and any deployed copy) to
  `uselibpqcompat=true&sslmode=require`, or pinned to `verify-full` with the provider CA installed?

## Proxy gate on this host - why it cannot close here - 14 September 2026

The owner supplied ten live Webshare proxies, which removed the vault-credential blocker. All ten
answered a TCP connect and returned a distinct exit IP through `curl`, and the gate's own
independent probe passed. The gate then advanced through three previously hidden layers and stopped
at a fourth that is structural, not a defect.

| Layer reached | Outcome | What it actually was |
|---|---|---|
| Proxy reachability | PASS | 10/10 Webshare proxies alive, distinct exit IPs. Confirms the production vault proxies, not the network, are the earlier failure |
| Engine selection | FIXED in harness | The `--engine-cache` path copied the cache but never declared which engine it held, so the app defaulted to `cft` and hunted a runtime the root did not have |
| Licensed engine seat | FIXED in harness | The child environment strips `CLOAKBROWSER_*` by design, so the disposable root had an empty seat pool. A real install carries the key in settings; the harness now does the same |
| WebRTC containment | BLOCKED - by design | `assertWindowsWebRtcFirewallProtection` requires a firewall rule whose program path is exactly the engine binary about to launch |

### The blocking mechanism, verified

A proxied launch is fail-closed on WebRTC containment. `ChromiumBrowserDriver` refuses unless a
Windows firewall rule named `MKT Browser WebRTC UDP Block (CloakBrowser)` names the exact binary.
This host has exactly one such rule and it names the installed engine:

```
C:\Users\anhha\AppData\Local\MKTTool\MKTBrowser\chromium\cloakbrowser\runtime\chrome.exe
enabled=True direction=out action=block protocol=17(UDP) profiles=all
```

The gate deliberately runs against a disposable root, so the engine it launches is a copy under a
temp directory. That copy's path matches no rule, the check fails, and the product answers
`PROXY_REJECTED`. That refusal is correct: launching a proxied profile without UDP containment would
leak the operator's real IP through WebRTC.

The harness can provision a rule for its own staged runtime - `provisionDisposableCftFirewall` -
but that function refuses to run outside a positively identified VirtualBox guest, and only for a
pinned CFT runtime. Creating a host firewall rule for a temp binary was not attempted.

**Therefore the proxy failure/recovery gate cannot be closed on this build host.** It needs the
disposable VM (pinned CFT plus `--disposable-vm-firewall`), or a deliberate design change.

### Product findings worth acting on regardless of the gate

1. With no CloakBrowser licence key configured, a proxied launch is refused as `ENGINE_UNAVAILABLE`
   and the operator is told to "wait for the engine to finish". Nothing is loading; the pool is
   empty. The same response simultaneously reported `engine.status: "ready"`. An operator in that
   state waits on nothing.
2. `PROXY_REJECTED` reaches the operator as "check whether the account proxy is alive" even when the
   proxy is verified alive and the real cause is missing WebRTC containment. The remedy sends the
   operator to the wrong place.

Both are message-layer defects, not launch-path defects. Neither is fixed in this continuation.

### Harness changes

`scripts/smoke-test-mkt-browser-correct-proxy.ts` and `scripts/mkt-browser-cft-smoke-runtime.ts`:
declare the engine the copied cache holds; carry the licence key into the disposable settings the
way a real install does; surface the probe-failure detail and the launch diagnostic instead of
discarding them. `npm run typecheck` exits 0; focused contract suite `38/38`.

One change was made and reverted: capturing the engine's stdout to a file. A packaged Electron GUI
app writes nothing there, and holding the handle across `spawn` hung the run for 30 minutes. That
run produced no verdict and is not evidence of anything.

### Unresolved questions

- Close the proxy gate inside the VM with pinned CFT, or extend disposable firewall provisioning to
  a controlled host path?
- The CFT engine is compatibility-only and currently disabled while the signed CloakBrowser set is
  active. If the gate must run on CFT in the VM, is it still testing what the team will run?
- Fix the two operator messages (empty seat pool, and containment failure reported as a dead proxy)
  before or after the independent-machine acceptance?

## The proxied-launch gate is structurally unreachable as designed - 14 September 2026

Extending disposable WebRTC provisioning to the cached engine exposed a larger problem: the gate
cannot pass on any machine where MKT Browser is installed, which is every machine where it could
run. Verified on this host:

```
'MKT Browser WebRTC UDP Block (Chrome for Testing)' -> count=1
    ...\MKTTool\MKTBrowser\chromium\cft\runtime\chrome.exe
'MKT Browser WebRTC UDP Block (CloakBrowser)'       -> count=1
    ...\MKTTool\MKTBrowser\chromium\cloakbrowser\runtime\chrome.exe
```

The installer creates one rule per engine, naming the installed binary. Two independent checks then
close the door on a disposable root:

1. `assertDisposableVmFirewallHost` refuses to provision when a rule with that display name already
   exists - it must never replace an installer rule. After install, one always exists.
2. Even without that guard, the desktop requires **exactly one** rule with the engine's display
   name. Adding a second for the staged copy would fail its `rule-count` check.

So a gate that stages the engine into a temp root can never satisfy containment, and containment is
mandatory for any proxied launch. This explains why `--disposable-vm-firewall` appears in the source
and in no bundle anywhere: the path has never been executed.

### Proposed fix - run the gate against the installed root inside a disposable guest

Disposable-root isolation exists to protect a machine that holds real operator data. A restored
clean guest holds none, so the isolation buys nothing there and costs the only configuration in
which containment can be satisfied. On a clean guest the gate should drive the installed product at
its own root, where the installer's own rule legitimately covers the engine being launched - which
is also the path an operator actually runs.

This needs a guest-only mode (no `--user-data-dir` override, no engine copy, no settings rewrite,
its own cleanup), hard-gated to a positively identified VirtualBox guest so it can never touch a
real operator machine. Not written: it manipulates a real product root and cannot be exercised until
the VM can run, and shipping unexercised code on that path is worse than shipping none.

### VM run blocked on memory

Host free RAM measured 4.10 GiB. The stable guest `mkt-phase5-nvme-20260908`
(`nvme-stable-clean-20260908`, a clone of `326357d7` with sleep disabled and timesync fixed) is
configured for 4 GiB, and `mkt-phase5-clean` for 6 GiB. Starting either leaves no headroom, and the
snapshot list already records what that produces - `single-entry-activation-stall-20260909`,
`r2-clean-bootstrap-stall-20260908`. No VM was started. No user application was closed.

### Ready for the guest when it can run

`local-test-artifacts/local-release-20260914/proxy-gate/proxy-gate-smoke.cjs` - the gate bundled to
a single 135,964-byte CommonJS file (Prisma left external; the guest runs `--proxy-file`). Validated
on this host: it reaches the same containment refusal as the repo script, so the bundle is sound.

### Fixed and verified this session

| Change | Verification |
|---|---|
| Relay no longer asserts a wrong cause on `ENGINE_UNAVAILABLE` / `PROXY_REJECTED` | relay suite `763/763`; the new wording was observed in a real failing run |
| Gate declares the engine its cached runtime holds | `80/80` scripts suite; engine reported `cloakbrowser ... status: ready` |
| Gate carries the licence key into disposable settings the way a real install does | seat acquired; launch advanced past `ENGINE_UNAVAILABLE` |
| WebRTC provisioning generalised from CFT-only to per-engine | new tests for the CloakBrowser rule identity and cross-engine refusal |
| Probe and launch failures carry their detail instead of discarding it | this is what made every step above diagnosable |

`npm run typecheck` exits 0 across all of them.

### Unresolved questions

- Approve the guest-only installed-root mode for the proxied-launch gate, or keep the gate
  unreachable and accept proxy failure/recovery as permanently unverified?
- Which guest: the 4 GiB `mkt-phase5-nvme` (timesync fixed) or the 6 GiB `mkt-phase5-clean`
  (Defender-verified snapshot `326357d7`)? The first fits this host's memory; the second carries the
  Defender evidence.
- The guest snapshot has no Node and no engine. Ship this host's provisioned CloakBrowser cache
  (516 MB) into the guest, or resolve guest-side engine activation first?
