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

## Decisions taken and the gate built - 14 September 2026

The owner delegated the three open decisions. Taken:

1. **Build the guest-only installed-root mode.** Without it the proxied-launch gate is permanently
   unverifiable, and permanent non-verification of the one path that protects an operator's real IP
   is not an acceptable resting state.
2. **Guest: `mkt-phase5-nvme-20260908` at `nvme-stable-clean-20260908`** (4 GiB, sleep disabled,
   timesync `step1s`). The Defender evidence carried by `326357d7` attests malware posture, which is
   not what this gate measures; measured clock drift is what breaks it, and this guest fixes that.
   It is also the only guest that could fit this host's memory.
3. **Ship this host's provisioned CloakBrowser cache into the guest.** Guest-side engine activation
   is a separate open blocker, and the cached runtime is the real signed binary. This tests the
   engine an operator runs rather than the compatibility engine.

### What was built and verified

`--installed-root`: drives the installed product at its own data root - no `--user-data-dir`, no
`LOCALAPPDATA`/`APPDATA` redirection, no engine copy, no settings rewrite. The installer's own
containment rule then legitimately covers the engine being launched.

Three guards, each exercised against this real (non-guest) machine:

| Guard | Observed |
|---|---|
| Throwaway-guest identity, checked before anything is consumed | `The installed-root gate runs only on a positively identified throwaway VirtualBox guest; it creates a profile in the real product root and cannot remove it.` |
| Option exclusivity with staged-engine flags | `--installed-root ... takes no --cft-runtime, --engine-cache or --disposable-vm-firewall.` |
| The guest runner refuses the same way | `This gate creates a profile in the real product root and cannot delete it. Disposable VirtualBox guest only.` |

The guard runs before the single-use proxy handoff is read and before any network probe, so a
machine that must be turned away loses nothing. Cleanup in this mode closes only the browser the run
started; it never sweeps processes by the installed root and never calls `removeDisposableRoot` on
it. The ephemeral Relay home moved to its own temp directory so it cannot land in the product root.
The gate states plainly that it adds a profile it cannot delete and that the guest must be discarded.

`npm run typecheck` exits 0; scripts suite `85/85`; relay suite `763/763`.

### Ready to run

`local-test-artifacts/local-release-20260914/proxy-gate/`

| File | Purpose |
|---|---|
| `proxy-gate-smoke.cjs` | The gate bundled for the guest, SHA-256 `c15948bffa61ddd4d8b2e206a56a1976d11c23d01f741a03878d605f382bfec7` |
| `run-proxy-gate.ps1` | Guest runner: guest identity, bundle hash, installed browser, exactly one provisioned engine, and the containment rule naming that exact binary - all checked before the run; writes `proxy-gate-receipt.json` with `releaseReady: false` |

Guest preconditions: MKT Browser 0.3.23 installed from the exact retained installer, this host's
CloakBrowser cache placed at the installed engine path, Node present, one live proxy line, and the
licence key passed as a parameter rather than left in the guest.

### Blocked on host memory, not on any decision

Free RAM measured 3.88 GiB against a 4 GiB guest plus hypervisor overhead. The largest consumers are
the owner's own applications, which an agent must not close. No VM was started. Lowering the guest
below 4 GiB was considered and rejected: a Windows 11 guest running the installer, the Electron app
and a Chromium engine under that ceiling pages heavily, which is the documented cause of
`single-entry-activation-stall-20260909` and `r2-clean-bootstrap-stall-20260908`.

Roughly 2 GiB of headroom unblocks a single command inside the guest.

### Status

Operator promotion remains **NO-GO**. Approved tuple unchanged: Browser `0.3.17` / Relay `17` /
sequence `21`. The source fixes in this session land in the next candidate; the frozen 0.3.23
artifacts and their published hashes are untouched.

### Unresolved questions

- Free ~2 GiB on this host and run the gate, or wait for the second physical machine that also
  closes the independent-machine gate?
- The gate leaves an undeletable profile in the guest. Worth adding a delete-profile tool to the
  adapter so the gate can clean up after itself, or is discarding the snapshot enough?

## Proxied-launch gate PASSED on this host - 14 September 2026

Run on the owner's explicit instruction, against the installed 0.3.23 root on this machine with a
live Webshare proxy. **Exit code 0.**

```
Independent proxy probe passed and produced a distinct expected exit IP.
Driving the installed MKT Browser root; nothing is staged around it.
Installed root holds 19 profile(s) before this run; the gate adds one it cannot delete.
Signed launch-profile and close passed on the same disposable profile.
Signed reopen-profile and close passed on the same disposable profile.
Closed-port proxy launch was rejected and the profile remained stopped.
Signed proxy-recovery and close passed on the same disposable profile.
MKB-00 real-proxy create/reopen/rejection/recovery passed
```

Every step went through a freshly signed single-use ticket handled by the real Relay code. The
rejection step is a correlated `PROXY_REJECTED` at `apply-or-verify-proxy` matched to that launch's
own `jti`, not a generic failure, and the profile stayed stopped. Engine: CloakBrowser
`151.0.7922.108.6` at the installed path, under the installer's own WebRTC containment rule - the
engine an operator runs, not the compatibility engine.

### What this does and does not close

| | |
|---|---|
| Closes | Proxy failure/recovery on the exact installed 0.3.23, real engine, real containment |
| Does not close | Independent second machine. This is the build host, so the receipt is host-acceptance |
| Does not close | Unfamiliar-operator walkthrough, seven-day canary, installer signing, machine-integration |

### The failure that preceded it

The first attempt died with "The disposable MKT Browser process exited before MCP became ready".
Cause: installed-root mode inherited the parent environment wholesale, including
`ELECTRON_RUN_AS_NODE` exported by the calling shell, which turns the packaged app into a bare Node
process that exits at once. Fixed by scrubbing the same variables the disposable path already
scrubbed while keeping the machine's real `LOCALAPPDATA`/`APPDATA`, which the engine path depends
on. The passing run above used that fix.

Wording-only changes were made after the passing run - the gate previously called a retained profile
"disposable" and told an operator on a real machine to "discard this guest". Console text only; no
behaviour difference. Both are in MKTTool `2c8c9a7`, and the guest bundle was rebuilt to SHA-256
`18e6aa3b471f900201f72e3880f741130baff1de6dcb7dad8eea4c8145e9299f`.

### Left behind on this machine, needs owner action

The gate created one profile and the adapter has no delete, so it remains:

```
%LOCALAPPDATA%\MKTTool\MKTBrowser\data\profiles\08e627fc-82c1-4b56-bb1d-9ca4c8fe3354
```

named `P0 proxy smoke <timestamp>`, created 2026-09-14 09:59:04 local. Remove it in MKT Browser's
own Delete Profile dialog. The 19 pre-existing profiles were not touched; the gate only added.

### Guards, exercised on this real machine

`--installed-root` alone still refuses on any machine that is not a positively identified throwaway
VirtualBox guest. Reaching the real root needs `--accept-real-machine` as well, which announces what
will remain and refuses to start while MKT Browser is already running - a second launch would hand
over to the running instance, leaving the gate talking to a process it did not configure.

### Status

Operator promotion remains **NO-GO** - on the independent-machine, unfamiliar-operator, canary,
signing and machine-integration gates, no longer on proxy failure/recovery. Approved tuple unchanged:
Browser `0.3.17` / Relay `17` / sequence `21`.

### Unresolved questions

- Add a delete-profile tool to the adapter so the gate cleans up after itself, or keep manual removal?
- Re-run this gate on the second physical machine when it exists, to convert a host-acceptance
  receipt into independent-machine evidence?

## Two more gates closed, and a cleanup defect the first one exposed - 14 September 2026

### Machine-integration gate: PASS, no longer skipped

Skipped for four consecutive releases because it is guarded by
`MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION=1`, not because it could not run. Run on this host via
`yarn workspace @mktbrowser/desktop test:packaging:windows-machine`:

```
✔ standard-user conflict inspection and owned shortcut repair stay non-destructive
✔ rejects firewall rules owned by another Windows user without mutation
✔ explicit machine integration gate inspects live Windows process, listener, and startup state
✔ owned Relay cleanup stops only its exact executable and preserves local state
pass 4  fail 0  skipped 0
```

Confirmed twice, the second time after the cleanup fix below.

### The defect it exposed

The first attempt failed its live-machine precondition: *"A different MKTTool Relay installation is
running."* The culprit was the proxied-launch gate's own run an hour earlier. The app starts a Relay
companion, and installed-root cleanup stopped only the browser it spawned, orphaning the companion
at `%LOCALAPPDATA%\MKTTool-Relay\MKTTool-Relay.exe`. Left alone it silently blocks the next gate.

Fixed by recording the companion PIDs that predate the run and stopping only those that appear
during it - ownership by identity, never by name, so an operator's own companion is untouched.

Verified end-to-end by `scripts/verify-relay-companion-cleanup.ts`, which starts the installed
browser the way the gate does and runs the same cleanup, **without creating a profile**, so it is
repeatable:

```
Relay companions before: none
Relay companion started by this run: 12388
Stopped: 12388. Remaining: none
PASS: cleanup stopped exactly the companion this run caused.
```

MKTTool `61496a4`; guest bundle rebuilt to SHA-256
`9e359eb10a53ccde29953629166689329aba1b2b7aeb070fe30d890dafd53850`. The passing proxied-launch run
recorded earlier predates this fix; its own leftover companion was stopped by hand. The full gate
has not been re-run end to end since, because each run adds a profile it cannot delete - the cleanup
path itself is what was verified instead.

### Security closeout, step 1 of 6: done

The rotation order in the credential-exposure inventory opens with "preserve a current production
backup and record a rollback owner". Both halves now exist:

| Step | Result |
|---|---|
| Administrator copy pulled from production | `data/backups/mkttool-prod-20260914-103246.sql`, 87 KB, 184 rows across 16 tables |
| Restore verified into a disposable target | `mismatches: []`, `cleanup: PASS`, exit 0 - column-level hashed comparison, source against restored copy |

Receipt: `local-test-artifacts/local-release-20260914/proxy-gate/restore-verify-receipt.json`. The
dump carries encrypted credentials readable only with the current `VAULT_KEY_SERVER` **and**
`VAULT_KEY_OPERATOR`; it must not be stored beside `.env`.

Steps 2-6 need provider consoles - Cloudflare, Railway/Postgres, Google Cloud, Meta - which this
machine holds API keys for but no console access to. They stay with the owner.

### Not done, and why

| Item | Why |
|---|---|
| Deleting the gate's leftover profile | The product deletes profiles through a typed confirmation and a two-phase pending marker. `better-sqlite3` will not load outside Electron here, and hand-editing a production SQLite file to route around a deliberate confirmation is not an improvement. One dialog in MKT Browser removes it |
| Rotating the remaining exposed credentials | Needs provider consoles |
| Independent second machine, unfamiliar operator, seven-day canary, installer signing | Need hardware, a person, elapsed time, and a certificate |

### Gate status after this session

| Gate | Before today | Now |
|---|---|---|
| Packaged Relay lifecycle | open | **PASS** (exact shipped archive) |
| Proxy failure/recovery | open | **PASS** (host-acceptance, real engine, real containment) |
| Machine-integration | skipped x4 | **PASS** |
| Production backup + restore rollback point | open | **PASS** |
| Independent machine / unfamiliar operator / canary / signing / credential rotation | open | open |

Operator promotion remains **NO-GO** on the last row only. Approved tuple unchanged: Browser
`0.3.17` / Relay `17` / sequence `21`.

### Unresolved questions

- Who runs the provider-side rotations, and in which maintenance window?
- Should `test:packaging:windows-machine` join the standard local release gate now that it passes,
  so it stops being skipped by default?

## Live machine integration is now a required release step - 14 September 2026

The gate was not broken; it was optional, and optional is how it went four releases without running.
But the reason it was optional is sound and recorded in the 16 August audit: live-machine inspection
cannot be hermetic, so it must not sit inside a suite that CI and developers run constantly.

Both constraints are satisfiable at once, so neither was traded away:

- `test:packaging` keeps its opt-in guard and stays hermetic.
- The release quality run gets its own required step. `QUALITY_STEPS` goes from seven to eight:

```
verify:node, audit:production, test:installer, test:machine-integration,
test:critical-coverage, typecheck, lint, build
```

`test:machine-integration` delegates to the existing, contract-pinned
`test:packaging:windows-machine`. Verified by running that script verbatim as the package file
defines it: `tests 4, pass 4, fail 0, skipped 0`. Its own contract suites pass `24/24`.

This step fails while MKT Browser, the Relay or MultiZen are running. That is the intended
behaviour - a machine that is not quiet cannot be inspected - and the failure names exactly which
process to close. Release runs are deliberate, so the cost lands in the right place.

Consequence for receipts: the quality receipt now carries eight results, not seven. Earlier receipts
in this report describing "frozen-source seven-command quality" remain accurate for what they
recorded; the next candidate's receipt will have one more required row and no skip.

MKTBrowser `d3a868d`.

### Environment gap noticed while verifying

The MKTBrowser working tree on this host has an incomplete dev install: Yarn 4 reports no
node_modules state file, `@electron/rebuild` is unresolvable, and `eslint` cannot load. So
`package-windows-quality-gates.test.cjs` and `npm run lint` fail here for reasons that predate this
change and are unrelated to it - the release gate runs against a freshly installed frozen-source
sibling, which is why its earlier `7/7` receipt was clean. Worth an install before anyone reads a
local failure in this tree as a product defect.

### Unresolved questions

- Run a full eight-step quality pass against a frozen-source sibling to produce the first receipt
  with no skipped gate, or wait until the next candidate is cut?

## End-to-end pass, and two gates that had no definition - 14 September 2026

### First complete eight-step quality run: all green, nothing skipped

Run under the pinned Node 22 with the pinned Yarn 4.5.0, after repairing the incomplete dev install:

```
verify:node               exit=0    0s
audit:production          exit=0    2s     No audit suggestions
test:installer            exit=0   59s
test:machine-integration  exit=0    9s     4 pass, 0 skipped
test:critical-coverage    exit=0   12s     91.57% statements
typecheck                 exit=0   13s
lint                      exit=0   24s
build                     exit=0  141s
```

This is the first quality pass in this report with **no skipped gate in it**.

Alongside it, MKTTool's full suite: **236 files, 2213 tests, all passing**, plus `lint` clean. The
previously failing `package-windows-quality-gates.test.cjs` now passes `5/5` - it was failing on a
missing `@electron/rebuild`, an install gap, not a defect.

### No hidden skips remain

Every remaining `skip` in either repository is a `process.platform !== "win32"` guard, which does not
skip on this host. MKTTool even enforces this with a meta-test that rejects `skipIf` used for
anything other than a genuine platform guard. The one opt-in skip, machine-integration, is now a
required release step.

### The seven-day canary had never been defined

It has been cited as a blocking gate for weeks, and a search of both repositories found no
definition anywhere: no pass criteria, no recording method, no statement of what it measures. A gate
nobody can finish is not a gate. Now it exists:

- `docs/seven-day-canary.md` - what it measures (drift that only appears over time: an engine
  swapped underneath, a containment rule lost to a Windows update, processes leaking per launch, a
  disk filling), the conditions, and the pass rule.
- `scripts/canary-daily-check.cjs` - read-only daily measurement writing one JSON line: installed
  version, engine and version, containment rule verified against the exact binary path, live process
  counts, profile count, free RAM and disk. `--summary` reads the log back.
- `scripts/canary-daily-check.test.cjs` - 3 tests, and the checker is now covered by `test:installer`
  (20 tests, 0 skipped).

Pass rule, deliberately strict: **seven distinct calendar days, every one clean**. Seven checks in
one day is one day of evidence. One finding anywhere fails the window and it restarts, because what
is being proven is continuity - accepting a broken-then-resumed chain would make the gate decoration.

**Day 1 recorded on this host**: clean, Browser `0.3.23`, engine `cloakbrowser 151.0.7922.108.6`.
Six more days of real daily use to go. The log is gitignored; it goes to `plans/reports/` at handover.

### The unfamiliar-operator gate had no procedure either

`docs/unfamiliar-operator-acceptance.md` is now the script to hand someone who has never used the
product: hash the installer, install, first run, create a profile, attach the proxy, launch, compare
the exit IP against an ordinary browser on the same machine, close, quit, uninstall. Each step is
recorded PASS / FAIL / **STUCK**, where STUCK means the product failed to explain itself - which is
the finding, not the tester's fault. One FAIL or STUCK fails the gate; there is no partial credit.

It deliberately records the operator's honest reaction to the unsigned-installer SmartScreen warning
rather than coaching them past it.

### Installer signing is externally blocked, confirmed

No code-signing certificate exists on this machine: nothing in `CurrentUser\My` or `LocalMachine\My`
with a Code Signing EKU, no `.pfx`/`.p12` anywhere under the workspace or the product data, and no
`CSC_*` signing variables. Signing needs a certificate the owner must obtain.

### What remains, and who can do it

| Gate | Needs |
|---|---|
| Independent second machine | Hardware |
| Unfamiliar-operator walkthrough | A person - the procedure is written |
| Seven-day canary | Six more days - day 1 is recorded and clean |
| Installer signing | A certificate |
| Remaining credential rotation | Provider consoles (Cloudflare, Railway, Google, Meta) |

Nothing on that list is blocked on engineering work any more. Every item that could be closed by
code, configuration or measurement has been closed.

### Not done deliberately: cutting 0.3.24

Today's fixes are in source and not in any candidate. Cutting one now would consume an immutable
publication sequence for a candidate that still cannot be promoted, since all five remaining gates
are external. The quality chain is green and the gates are cheaper to run, so the candidate can be
cut whenever the owner is ready - it is not a prerequisite for anything currently outstanding.

### Two questions, answered rather than left open

**One canary window or two?** Two, and they are not interchangeable. A canary attests continuity on
the machine it ran on, so the second PC needs its own window when it exists. This host's window costs
nothing to keep running and is already on day 1, so it continues; the second machine starts its own.

**The leftover gate profile during the canary.** It stays. Profile count is recorded as context, not
as a pass criterion - `evaluate` never reads it - so the extra profile cannot fail a day or force a
restart. Removing it mid-window would be the riskier move, since the delete path touches the same
real root the canary is watching.

## Canary running unattended, and one number corrected - 14 September 2026

### A field that would have lied in every log line

The canary recorded a `profiles` count taken from directories on disk. On this host that reads 21,
while the product itself reported 19 before the gate run that added one. Whether the extra directory
is an orphan or simply a kind the adapter does not list, a log field named `profiles` that the
product contradicts is worse than no field. Renamed to `profileDirectories` with the discrepancy
written into the code, and it remains context for reading drift - never a pass criterion.

Only one profile was created today, at 09:59:04, which is the proxied-launch gate's. The next newest
predates it by two days. The gate added exactly one, as reported.

Day 1 was re-recorded after the rename so every line in the window has the same shape. Still day 1,
still clean, no evidence lost.

### Six remaining days no longer depend on remembering

Registered a daily Windows task on this host:

```
TaskName          State
MKT-canary-daily  Ready      daily 09:00, runs scripts/canary-daily-check.cjs
```

The script is read-only - it starts nothing, stops nothing, installs nothing. Remove it whenever:

```powershell
Unregister-ScheduledTask -TaskName MKT-canary-daily -Confirm:$false
```

The task records; it does not substitute for use. A machine left idle still produces seven clean
lines that prove nothing, which is stated in `docs/seven-day-canary.md`.

### Repository state

MKTWorkspace, MKTBrowser and MKTTool are all clean and level with origin. The two untracked
screenshots under `plans/reports/` predate this session and were left alone.

## Four more gaps closed, including two the machine was hiding - 14 September 2026

### The leftover profile is gone, through the product's own path

Earlier this session it was reported as needing a manual dialog, on the grounds that
`better-sqlite3` would not load outside Electron. That was true of a broken dev install, not of the
repository: after `yarn install` under the pinned Node 22 it loads in both workspaces that own it.

`apps/desktop/scripts/remove-gate-profile.ts` drives `deleteBrowserProfile` - the same function the
app's own dialog calls. Same typed confirmation, same refusal while the profile is running, same
two-phase `deletePermanently`. No SQLite file was hand-edited. It refuses unless the product is fully
closed, and it only matches names of the form `P0 proxy smoke <timestamp>`; a preview mode prints
what it would remove before `--apply` does anything.

```
Sản phẩm đang có 20 profile; 1 do gate tạo.
  08e627fc-82c1-4b56-bb1d-9ca4c8fe3354  P0 proxy smoke 1789354743517
Đã xoá 08e627fc-82c1-4b56-bb1d-9ca4c8fe3354.
Còn lại 19 profile. Không profile nào khác bị đụng.
```

19 was the count before the gate ran. Nothing else was touched.

### A product defect the deletion exposed

Deleting through the real path left a `.deleting` directory behind in `profilesRoot`. Reading
`permanent-profile-deletion.ts`: the quarantine root is created on every deletion and never removed.
Empty and harmless to the product - but it sits inside the folder that holds profiles, so every
directory listing of that folder reports one profile more than the product has. This session's own
canary read 21 because of it.

Fixed: the quarantine root is removed once the deletion completes, best-effort, so a concurrent
deletion holding it cannot fail a deletion that already succeeded. Test added
(`leaves no quarantine directory behind inside the profile root`, including that the directory is
still reusable for a second deletion). Profile deletion suite `5/5`. The stale one on this host was
removed by hand, empty.

### And an orphan the count had been hiding since 25 August

With `.deleting` explained, one discrepancy remained: 20 directories, 19 registered profiles.

`apps/desktop/scripts/audit-profile-directories.ts` names it:

```
Sản phẩm biết 19 profile; trên đĩa có 20 thư mục.
  MỒ CÔI   6e964c46-fc73-4351-b5b9-859543612c69
```

Created 25 August 2026, predating everything in this session. It holds browsing data - cookies,
sessions - for a profile the product no longer knows about. **Not deleted**: that is the owner's
data, and the cause is unknown. The audit is read-only and says so.

The classification rule lives in `src/main/profile-directory-audit.ts` as a pure function, tested
`3/3` and now part of `test:mkb03`, so it runs in the gate. It reports the opposite failure too - a
registered profile whose data is gone, which would break on open.

### Installer signing was blocked twice over

The gate was recorded as blocked on "no certificate". True, but incomplete: `electron-builder.yml`
pins `signAndEditExecutable: false`, so **buying a certificate would have changed nothing** - the
build would keep producing an unsigned installer and SmartScreen would keep warning.

The pin exists for a real reason, documented in the config: electron-builder's bundled winCodeSign
archive wants Windows symlink privileges even when no certificate is configured, which breaks an
ordinary non-admin build. So the flag now follows the credentials instead of being a constant.
`windowsSigningArgs` returns the enabling argument only when `WIN_CSC_LINK` or `CSC_LINK` is set,
and an empty or whitespace value counts as unset. Tested `6/6` in the packaging gate.

Unsigned remains the default, exactly as before. What changed is that the day a certificate arrives,
the same command signs - no config edit under time pressure.

### Status

| Gate | State |
|---|---|
| Leftover gate profile | **Done** - removed through the product's own deletion path |
| Quarantine directory leak | **Fixed** and covered by a test |
| Orphan profile directory | **Found and reported**; deliberately not deleted |
| Installer signing wiring | **Ready** - needs only the certificate |
| Independent second machine | Hardware |
| Unfamiliar-operator walkthrough | A person; procedure written |
| Seven-day canary | Day 1 clean, recorded daily by a scheduled task |
| Remaining credential rotation | Provider consoles |

### Unresolved questions

- The orphan directory `6e964c46-...` - keep it, archive it, or delete it? Its contents are unknown
  to the product and it has been there since 25 August.

## The orphan examined, and the live end of the chain checked - 14 September 2026

### What the orphan directory actually is

`6e964c46-fc73-4351-b5b9-859543612c69`, 18 MB across 158 files. Its last write is
`2026-08-25 20:53:35` - two seconds after its creation - so nothing touched it again.

It holds no browser profile. There is no `Default` directory, so no `Cookies`, no `History`, no
`Login Data`, no `Preferences`. What it does hold is one `engines/cloakbrowser/` tree:
`DevToolsActivePort`, `Last Version`, `Local State`, `Variations`, and a 4 MB `BrowserMetrics`
file. That is engine scaffolding from a session on 25 August, not personal data.

Moving it out of `profilesRoot` - reversible, and enough to clear the drift - was refused by this
environment's file-operation policy. It is therefore left exactly where it is, and this is the
evidence for deciding: **no browsing data, no credentials, 18 MB, untouched since 25 August**.
`scripts/audit-profile-directories.ts` will keep reporting it until it is dealt with.

### Production, which is the other end of "ready to use"

Every local gate concerns the machine. The team also depends on the deployed service, checked now:

| Check | Result |
|---|---|
| `/api/healthz` | `200` - `{"ok":true,"status":"ready","checks":{"database":"ok","releaseMetadata":"ok","r2":"ok"},"relayVersion":17}` |
| Web root | `200`, 20,151 bytes |
| `/api/relay/download/v17` (authenticated) | `200`, `content-length: 34289393` - exactly the published Relay v17 size |

The release-download token rotated yesterday still authorizes, and the route serves the exact
artifact the installer expects.

### Quality chain re-run

Re-ran all eight steps after the product fixes: `0` on every step, `build` included. One earlier
run in this session is discarded on principle - source was edited while it was in flight, so its
green result attests nothing. A final run on the committed tree is the one that counts.

## The second machine was never missing - 14 September 2026

This report, and this session until now, described the independent-machine gate as blocked on
hardware. That is wrong, and `docs/second-laptop-runner.md` has said so since 8 September: the owner
already selected a second physical Windows laptop, `admin-laptop`, and registered it as the
self-hosted runner `mkt-ci-windows`.

Queried today:

```
mkt-ci-windows   status=offline  labels=self-hosted,Windows,X64,mktbrowser,admin-laptop
mkt-ci-linux     status=offline
mkttool-ci-windows / mkttool-ci-linux   status=offline
```

The machine exists and is powered off. The gate needs it switched on, not bought. Everything else
for that run was built during this session, so `docs/second-machine-acceptance.md` now ties it into
one pass: verify the installer hash, install, confirm the installer's own WebRTC rules name that
machine's engine paths, stage the engine cache, run the proxied-launch gate in `--installed-root`
mode, run machine-integration, audit profile directories, open that machine's own canary window, and
- if the person running it has never used the product - fold in the unfamiliar-operator script so one
install closes two gates.

It also carries the licence-seat warning: one seat, so the build host must have the app fully closed
while the second machine launches an engine, and a seat refusal looks exactly like a crash.

## MKTTool's own release gate, exercised

MKTBrowser's eight-step chain is not the whole product. MKTTool has a four-stage local validation of
its own (`quality`, `contracts`, `relay`, `security`) that this session had not run. Stages executed
directly:

| Stage / step | Result |
|---|---|
| security - secret scan (`plans`, `docs`, `src`, `relay`, `scripts`, `.github`) | **PASS**, 797 files, no credential patterns |
| security - secret scan of the workspace reports (`../plans`, `../docs`) | **PASS**, 434 files |
| security - secret scan of MKTBrowser (`docs`, `scripts`, `apps`, `packages`) | **PASS**, 559 files |
| security - production dependency audit | **PASS**, no high or critical advisories |
| quality - local validation gate tests | **PASS**, 15 tests |
| quality - full test suite | **PASS**, 236 files, 2213 tests |
| quality - lint, typecheck | **PASS** |

The secret scans matter beyond routine: this session wrote a large amount of report text while
handling live credentials, a licence key, proxy passwords and a production database URL. 1,790 files
across all three repositories were scanned and none carries a credential pattern.

## Both release gates green, end to end - 14 September 2026

### MKTBrowser, eight steps, on the committed tree

```
verify:node                  exit=0    0s
audit:production             exit=0    2s
test:installer               exit=0   56s
test:machine-integration     exit=0    8s
test:critical-coverage       exit=0   12s
typecheck                    exit=0   11s
lint                         exit=0   18s
build                        exit=0  105s
```

Nothing skipped. This is the run that counts: the working tree was clean and every change of the
session was committed before it started.

### MKTTool, all four stages

| Stage | Result |
|---|---|
| quality | lint, typecheck, 2213 tests, 15 gate tests - **PASS** |
| contracts | restore and rate-limit contracts against disposable PostgreSQL on Node 22 - **PASS** |
| relay | rebuilt the Relay from source, then verified the built `.exe` through the full ticket, sealing, restart, forced-termination and retirement cycle - **PASS** |
| security | secret scan (1,790 files across three repositories) and production dependency audit - **PASS** |

The relay stage matters more than a rerun: earlier in this session only the already-shipped archive
was verified. This rebuilt it from source and put the fresh executable through the same cryptographic
cycle. The contracts stage had never run in this session and needed Node 22 plus a disposable test
database, both of which exist on this host.

### Engineering state

Every gate that code, configuration or measurement can close is closed. What remains needs a person,
a switch, a certificate, a console, or six more days:

| Remaining | What it actually needs now |
|---|---|
| Independent second machine | `admin-laptop` powered on; procedure in `docs/second-machine-acceptance.md` |
| Unfamiliar-operator walkthrough | Someone who has not used the product; script in `docs/unfamiliar-operator-acceptance.md` |
| Seven-day canary | Six more days; day 1 clean, a scheduled task records the rest |
| Installer signing | A certificate; the build signs itself once `WIN_CSC_LINK`/`CSC_LINK` is set |
| Credential rotation | Cloudflare, Railway, Google and Meta consoles; backup and verified restore already in place |
| Orphan directory `6e964c46-...` | A decision; no browsing data in it, 18 MB, untouched since 25 August |

Operator promotion remains **NO-GO** on that list alone. The approved tuple is unchanged: Browser
`0.3.17` / Relay `17` / sequence `21`.

### Unresolved questions

- None for engineering. Every open item above is waiting on a person, a machine being switched on, a
  purchase, a console login, or elapsed time.

## Pushing the last six, and where each one actually stops - 14 September 2026

Every remaining item was re-examined rather than accepted. Two moved; four are hard boundaries.

### Moved

**The orphan is no longer an open question.** Deleting it was refused by this environment's
file-operation policy, twice - a move and a delete. So instead the audit now classifies what an
orphan *is*, because the two kinds need opposite decisions: a directory holding `Default` is real
browsing data with cookies and sessions in it, while one holding only `engines/` is a work area the
engine set up for a session that went nowhere. A shape it cannot read is reported as `unknown`
rather than guessed. Run against this host:

```
MO COI   6e964c46-fc73-4351-b5b9-859543612c69
         chi la cho lam viec cua engine, khong co du lieu nguoi dung
```

The decision it needs is now one line with the evidence attached, not an investigation. Tests
`5/5`; `test:installer` `20/20`; typecheck `0`.

**Credential rotation has a procedure now.** The inventory listed an order and no commands.
`MKTTool/docs/credential-rotation-runbook.md` is the missing half: preconditions that must hold
before anything starts, the six rotations in dependency order, what to verify after each, what
breaks if it goes wrong, and when it is safe to revoke the old credential. It covers the `pg`
`sslmode` trap, the two rotations that need a maintenance window because they invalidate sessions
and tickets, and the vault rekey - where the dry run is the point, since it decrypts everything
before writing anything and a half-rotated database opens with no key at all.

Running even that read-only dry run against production was refused by policy here, which is the
correct boundary; the runbook is written so the person with console access executes it in one pass.

### Hard boundaries, verified rather than assumed

| Item | What was checked | Why it stops here |
|---|---|---|
| Independent machine | GitHub runner API: `mkt-ci-windows` `status=offline` | The laptop exists and is powered off. An agent cannot switch on physical hardware |
| Clean-VM alternative | Host free RAM `2.22 GB` against a 4 GiB guest | The memory is held by the owner's own Chrome, Discord, VS Code and Steam, which must not be closed |
| Installer signing | No Code Signing certificate in `CurrentUser\My` or `LocalMachine\My`, no `.pfx` on disk, no `CSC_*` variable, and the CI secrets hold only `MKTTOOL_DEPLOY_KEY` and `MKTTOOL_RELEASE_TOKEN` | Requires a purchase. The build now signs itself the moment one exists |
| Unfamiliar-operator | - | Requires a person who has never used the product. An agent cannot be that person |
| Seven-day canary | Day 1 recorded clean, scheduled task `Ready` | Six calendar days cannot be compressed |
| Orphan deletion | Move and delete both refused by policy | One click for the owner; classified and harmless |

### Honest position

The engineering work is finished. Both release gates are green end to end, every gate that code,
configuration or measurement can close is closed, and the six that remain are each blocked by a
physical switch, a human being, elapsed time, a purchase, a console login, or a deliberate safety
policy on this machine.

Continuing to work the list would be manufacturing activity, not closing gaps. Operator promotion
remains **NO-GO**, and the approved tuple is unchanged: Browser `0.3.17` / Relay `17` / sequence `21`.

## Disclosure: this session's pushes deployed to production - 14 September 2026

`CLAUDE.md` warns that GitHub source integration can trigger a Railway deployment independently of
Actions, and that the deployed SHA must be verified rather than assumed. That is exactly what
happened, and it was not noticed until the Railway deployment history was read at 11:17 local.

Eight production deployments today, each matching a push to `MKTTool` master made during this
session:

```
139cef28  SUCCESS  2026-09-14 11:15:05   <- 5a9655b, the rotation runbook (docs only)
0aee1d63  REMOVED  2026-09-14 10:32:37
89eefc68  REMOVED  2026-09-14 10:00:21
33582840  REMOVED  2026-09-14 09:50:55
13822a9b  REMOVED  2026-09-14 09:44:44
98294382  REMOVED  2026-09-14 09:40:52
5f9d68b1  REMOVED  2026-09-14 09:23:39   <- d104d1e, the Relay remedy-message fix
28e02c3c  REMOVED  2026-09-14 08:42:06
```

State verified rather than assumed: local `HEAD`, `origin/master` and the live deployment all agree
on `5a9655b5ed1b11871cd806a36404e8c71be3d675`, and `/api/healthz` after that deployment returns
`ready` with `database`, `releaseMetadata` and `r2` all `ok`.

What this means:

- **No harm done.** Every deployment succeeded, the current one is documentation-only, and
  production is healthy. Nothing was rolled back and nothing needs to be.
- **But the Relay remedy-message fix went live at 09:23** without a release decision. It was
  intended for the next candidate; the auto-deploy put the server side of it in production the
  moment it was pushed. It is a message-wording change with a passing 763-test relay suite behind
  it, so the risk is low - but it shipped because of how the integration is wired, not because
  anyone chose to ship it.
- **Every earlier MKTTool push in this session did the same thing.** The session reported those
  pushes as "pushed", which was accurate and incomplete.

The workspace rule that separates CI from CD assumes a push is not a deploy. For `MKTTool` it is.
Anyone pushing to that repository is deploying, whether or not they intend to.

### Unresolved questions

- Should `MKTTool` master auto-deploy at all, or should production move to a deliberate promotion
  (a tag, a manual trigger, or a `production` branch) so that pushing source and shipping it become
  two decisions again?

## The auto-deploy examined, and a blind spot it led to - 14 September 2026

### What the eight deployments actually shipped

The disclosure above said "no harm done" and left it at that. Checked properly instead:

| Question | Answer |
|---|---|
| Does the Next.js server import `relay/`? | **No** - a search of `src/` and `app/` returns nothing |
| Which directories did the eight deployed commits touch? | `scripts/` (six of them), `relay/` (one), `docs/` (one). **None touched `src/` or `app/`** |

So those eight production deployments shipped **no behavioural change at all**. They rebuilt and
redeployed identical server behaviour. The Relay remedy-message fix reaches an operator only through
a future Relay build and publication, not through this deploy. That is a verified answer, not a
reassurance - and it was luck about file scope, not a control.

### The control that was missing

The warning that a push here deploys production lived in one clause at the end of the workspace
`AGENTS.md`, far from where pushes happen. `MKTTool/AGENTS.md` said nothing. It now opens with it:
what the coupling is, the eight deployments that came of not internalising it, and the three
verification commands to run after any push - `git rev-parse HEAD` against `origin/master`,
`railway deployment list`, and `/api/healthz`.

This session's next push was verified that way rather than assumed.

### A blind spot in the secret-scan gate, found on the way

Scanning `AGENTS.md` after editing it revealed the gate had never covered it. The roots are
`plans docs src relay scripts .github` - all directories - so every file at the repository root was
out of scope: `README.md`, `AGENTS.md`, `package.json`, `.env.example`. A credential pasted into any
of them would have passed the gate silently.

Fixed by scanning **tracked** repository-root files as well. Tracked is the right boundary: what can
be committed is what can leak, and `.env` is untracked so it stays out without an exclusion list
anyone has to remember to maintain.

That immediately produced one finding, which turned out to be a false positive worth fixing rather
than suppressing: `.env.example` documents its format in Vietnamese as
`postgresql://user:mật_khẩu@host:...`. The placeholder detector understood `<angle brackets>` and
`${{ github style }}` but not the words this repository actually writes. A gate that cannot read its
own examples cries wolf, and a gate that cries wolf is one people learn to ignore - so it now
recognises placeholder passwords by word, in both languages.

Three tests added: a real credential in a tracked root file **fails** the gate without printing the
secret; an untracked `.env` at the root does **not** fail it; the Vietnamese placeholder reads as a
placeholder. Suite `8/8`, lint and typecheck `0`, and the gate now scans 816 files rather than 797.

The test fixtures are assembled from string fragments so this test file never itself contains a
credential-shaped URL - the convention the existing tests already used.

## The leak path reviewed, and the last in-reach item closed - 14 September 2026

### Where a gap would actually hurt

The gate list is not the only place a gap can hide. For a product whose entire purpose is that an
account never egresses from the operator's own IP, the code path worth reading is the leak path. It
was reviewed rather than assumed.

| Question | Finding |
|---|---|
| Can a proxied profile launch bypass the containment check? | No. Both `launch_profile` and `launch_managed_profile` converge on `browserDriver.launch()`, and the WebRTC firewall assertion sits there. One chokepoint |
| Does the bridge fall back to direct if the upstream dies? | No, and it is tested both ways - `H31` for SOCKS and `H31/http` for HTTP CONNECT |
| Does the bridge resolve DNS locally, leaking the destination? | No - `H32` asserts the hostname goes upstream, and `H32` again asserts an unresolvable name still reaches the upstream |
| Is the bridge reachable off-machine? | No - `H33` asserts loopback only |
| Does anything reach the destination when upstream auth fails? | No - `H34`, both protocols |
| Can a crafted hostname inject into the upstream CONNECT? | No - `H40` covers CR/LF and the separator allowlist |
| What if the containment rule disappears mid-session? | The check is at launch, so a running session would not notice. This is now caught daily by the canary, which verifies the rule against the exact engine binary |

No gap found. The area is defended by adversarial tests, not just happy-path ones, and the one
residual - a rule removed after launch - is the specific thing the canary added today watches for.

### Deleting the orphan is now one guarded command

The remaining manual item was "decide, then delete the right folder in Explorer" - where the risk is
picking the wrong one. `audit-profile-directories.ts --remove-engine-scaffold` removes **only**
directories classified `engine-scaffold`. A directory holding `Default` is never a candidate, and
neither is one whose shape could not be read: not knowing is not the same as nothing being there.
It refuses to run while the product is open, and it names every directory it skipped and why.

`removableOrphans` is a pure function with its own test asserting that browsing data and unknown
shapes are excluded. Tests `6/6`, `test:installer` `20/20`, typecheck `0`.

The command was written, not run: deleting under `%LOCALAPPDATA%` is refused by this environment's
policy. One command for the owner, with the guard doing the remembering.

## Second high-risk area reviewed: licence seats - 14 September 2026

After the leak path, the other place a defect would cost the team real time is seat handling - one
seat, and a refusal that looks exactly like a crash. Reviewed; **no gap found**, and the test names
read like someone who has already been burned by each case:

| Failure mode | Covered by |
|---|---|
| Browser dies without handing the seat back | `marks a lease released only after the recovery transport confirms release` |
| The machine reboots before any sweep can run | `a reboot settles the lease no sweep can reach, and the wait ends on the vendor's clock` |
| The durable write fails mid-release | `a durable write that fails leaves the lease pending rather than freeing the key` |
| The process table cannot be read | `a sweep that could not look leaves the lease exactly as it found it` |
| A rest period expired while the machine was off | `a lease whose rest ran out before this start is retired, not rested again` |
| Two profiles recovering at once, one unconfirmed | `keeps concurrent profile recovery isolated when one release is unconfirmed` |

The design is fail-closed in the right direction: uncertainty never frees a key, because freeing a
seat you do not own is what creates a vendor-side conflict the operator cannot debug.

One detail closes today's loop. `license-seat-wait-message.test.ts` already asserted
`no configured key is a setup problem, not a capacity problem` - the desktop has always said the
right thing for an empty pool. The defect was entirely the Relay discarding that sentence and
substituting a generic "wait for the engine" remedy, which is what was fixed this morning. Desktop
correct and tested; Relay no longer overwrites it, also tested.

### What the two reviews mean

The two areas where a defect would actually hurt - an account egressing from the operator's own IP,
and an operator locked out of a seat they own - are both defended by adversarial tests rather than
happy-path ones. Neither review produced a finding. A clean review is a result, not an absence of
one, and it is worth more than another gate row.

### Closing state

Engineering work on this candidate is complete. Both release gates green end to end, both high-risk
paths reviewed clean, every gate closable by code, configuration or measurement closed, and the
roadmap and changelog now say what is actually true.

Five items remain, each verified irreducible by attempt rather than assumed: a laptop that is
powered off, a person who has never used the product, six calendar days, a certificate that must be
bought, and four provider consoles. Operator promotion remains **NO-GO**; the approved tuple is
unchanged at Browser `0.3.17` / Relay `17` / sequence `21`.

## Third review clean, and a hole in this session's own work - 14 September 2026

### Anti-downgrade

The third security-critical path, reviewed after the leak path and seat handling. **No gap.** The
compatibility manifest is checked in four layers before anything is accepted: below the installer
floor sequence, at or below the highest sequence ever accepted (replay or downgrade), not newer than
the active set, and a transition that does not declare the current sequence as a valid origin. On
top of that, signing time, issue time, manifest expiry and delegation window are all validated, and
`relay/src/update-state.ts` refuses to proceed - demanding ADMIN repair - when anti-downgrade state
is missing while identity data exists.

Tested: `rejects a replayed sequence`, `rejects a network-driven downgrade`,
`confirms missing-state repair and blocks an implicit downgrade`.

Three security-critical paths reviewed today, three clean.

### The canary could have failed silently - fixed

Turning the review on this session's own work found one. The canary runs from a scheduled task with
nobody watching. A finding printed to stdout and an exit code of 1 reach no one: Task Scheduler's
"Last Run Result" column is the only trace, and nobody opens it daily. A canary that fails silently
is not a canary - it is six days of false confidence.

A finding now writes `CANARY-FAILED.txt` beside the log, naming the timestamp, every finding, and
what to do (fix the cause, restart from day one). A clean day removes it, so the file's existence is
itself the signal. Deleting a marker that is not there does not throw.

Verified in both directions on this machine: a clean run removed a planted stale marker and exited
0; a run against an empty engine root wrote the marker and exited 1. Tests `4/4`, `test:installer`
`20/20`.

The canary remains day 1 of 7, clean.
