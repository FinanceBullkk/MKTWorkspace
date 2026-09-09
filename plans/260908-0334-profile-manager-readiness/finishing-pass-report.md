---
type: tester
date: 2026-09-08
status: blocked
---

# Profile-manager finishing pass

## Summary

Browser is NOT ready for team distribution or real accounts. Local package/Relay contracts and
clean install/repair/uninstall pass. Managed real-proxy lifecycle verification failed on the VM;
the required hosted Browser package gate remains blocked by organization artifact quota.
Antidetect research stays closed. This is a profile/proxy manager, not identity-isolation proof.

## Verified candidate

| Field | Value |
|---|---|
| Browser source | `ad0c7182a4e7d53761b8ffee2ffd9292f24858da`, README-only build-time diff |
| Version | Browser `0.3.13`, exact bundled Relay v16 |
| Installer SHA-256 | `2a614301d5223a3bd77943d66c18f0fe6c0187381da1cf360be011f310e92f9e` |
| app.asar SHA-256 | `7a5af62dceb32315e9401380f1fb67eeae9566da23700f3218124edd14d9d930` |
| Relay ZIP SHA-256 | `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` |
| Relay EXE SHA-256 | `300646e1ea35aa47ece1b0d608d9b9681ee5bde82dd084bcdc5145345d07b60e` |
| CFT fixture | `152.0.7977.64`; EXE SHA-256 `79832d1e60cbad9323c07339f9608bc0ce93cb9242b9b5481c04a0c536720980` |
| Publication | Unsigned, unattested, unpublished; no production engine pin changed |

Installer size: 145,148,544 bytes. Build-time diff SHA-256:
`7c3b00be173218fb71220cab6539450ed9a0d97444997a595b7d42ffb1990040`.
This local tuple does not replace historical P4b or attest a CFT release.

## Results

| Surface | Status | Evidence |
|---|---|---|
| Browser local | PASS | Node 22.23.2; workspace contract/lint/typecheck; 374 installer tests |
| Live host test | SKIPPED / OPEN | Explicit opt-in machine integration not enabled on developer host |
| Critical coverage | PASS | 90.87% lines; 83.06% branches |
| Packaged CFT contract | PASS | 1/1, 6.544 s; unmanaged lifecycle/persistence and managed rejection |
| Exact bundled Relay executable | PASS | 35 crypto, origin, replay, restart/crash, corruption and retirement checks |
| Clean VM install | PASS | 9/9 on product-free snapshot before Node fixture copy |
| Repair | PASS | 13/13 after separate restoration of the same clean snapshot |
| Uninstall | PASS | Initial 15/15 and post-repair 15/15; profile/token/unrelated Relay state retained |
| Defender | PASS | Enabled; no detections in clean-install or repair windows |
| Independent real proxy | PASS | One supplied dedicated entry; direct/proxy probes succeed with distinct exits |
| Managed VM lifecycle | FAIL | Attempt 1 DevTools discovery failure; attempt 2 CFT inspection failure |
| Test harness | PASS | Final 38/38; typecheck/lint; Windows read-only cleanup check |
| MKTTool hosted CI | PASS | Run 34164096990: test/coverage/build, dependency audit, PostgreSQL contracts, Windows Relay |
| MKTTool hosted secret scan | PASS | Run 34164096945 on source c408315a |
| Browser hosted CI | BLOCKED | Run 34002472571 attempt 5 package upload quota failure; packaged-contract skipped |
| Browser-page IP/DNS/WebRTC | OPEN | Not measured by the independent prelaunch proxy probe |
| Operator acceptance/canary | OPEN | No unfamiliar-operator observation or seven actual canary days |

VM: `mkt-phase5-clean`, 6 GB / 2 CPUs. Snapshot:
`326357d7-35b1-4c91-92ca-856fb0f35e9b` (`clean-with-ssh-defender-20260825`).
Defender engine `1.1.26080.3`, signatures `1.459.99.0`. The initial explicit signature-update command
failed with `0x80070652` while Windows update was active; background update completed by collection.
That initial command is not relabeled PASS.

## Failed managed verification

Both VM attempts used reviewed bundle SHA-256
`7393d947ce82e95e5ea93bd7a425566e2253fa810aba4ce05c0b496a3a500b65`.

1. The independent proxy and CFT pins passed. Signed profile creation reached an actual browser
   launch, but the lifecycle log recorded `LAUNCH-FAILED` / `DevToolsPortDiscoveryError` at 17.63 s.
   No complete open/close/reopen/rejection/recovery pass was obtained. PowerShell 5.1 native stderr
   handling interrupted the fixture wrapper before it wrote a final result; that wrapper was fixed
   to capture separate native streams, without changing product timeouts or checks.
2. The single diagnostic repeat again passed the independent proxy probe, then failed closed during
   CFT executable version inspection. Its recorded exit code is 1; finish time
   `2026-09-07T21:32:05.0055693Z`. No further complete lifecycle retry was run.

The helper also had a separately reproduced exiting-process race: a confirmed exited process can
lose `Path`/`StartTime` between inspection calls. The correction tolerates only confirmed exits and
still requires final exact-owned zero-process verification. Six Windows-backed synthetic cases
and a read-only actual Windows check cover it. Neither VM failure is attributed to that race.
The final helper correction is later than the VM bundle and has local, not full-VM, evidence.
The final DB-free bundle builds successfully with SHA-256
`f2cd971e631fb883cc3b8ec0c882a95ca7663ef5024c9bdc761e9fcb37803842`; it was not run in the guest.

Attempt-1 logs were preserved before removing only its verified firewall rule and disposable root.
After attempt 2, read-only inspection found zero Browser/Chrome/Node processes, zero smoke roots and
rules, and no proxy handoff. Generated host credential copies were removed after transfer; the
owner's original proxy file was not changed. No real accounts, database import, or production data.

The positive-path harness uses the real Relay handler in-process with signed disposable tickets and
the packaged Browser. It is not packaged Relay HTTP transport or browser-page network proof.

## Hosted blocker

[Browser run 34002472571](https://github.com/Techieslab-app/MKTBrowser/actions/runs/34002472571):
quality succeeds, package builds but artifact upload fails, packaged-contract is skipped, required
PR gate fails. [PR 17](https://github.com/Techieslab-app/MKTBrowser/pull/17) remains open/unmerged.
The retention-only 7-to-1-day change was reviewed; source/hash/fresh-job gates were not weakened.

The bounded post-cleanup retry is exhausted. Browser retained artifacts total 56,122 bytes;
MKTTool has none. Billing access returned 404 requiring `admin:org`; Packages access returned 403
requiring `read:packages`. An organization administrator must resolve storage/billing/access before
another hosted attempt. Local or VM evidence cannot substitute for this gate.

## Delivery

- Browser README-only scope decision committed/pushed as
  `2c68a6d9ac4376a28699027ea882370baa236c40`, branch `codex/profile-manager-scope`, based on main
  `f9cb75f7d1ba6415c4deb6b2bea31ac90d02cf8c`. It does not contain the PR 17 retention commit.
- MKTTool harness committed as `afaf62ed2e435cc9e3377189d04b2652735f063d`, documentation as
  `c408315aadeea74639df38d367bec644be32be07`; branch `codex/profile-manager-finishing-pass`,
  [PR 68](https://github.com/Techieslab-app/MKTTool/pull/68) into unchanged master `81113247`.
  [Secret scan run 34164096945](https://github.com/Techieslab-app/MKTTool/actions/runs/34164096945)
  PASS. [CI run 34164096990](https://github.com/Techieslab-app/MKTTool/actions/runs/34164096990)
  PASS: check (tests, coverage, build), dependency audit, PostgreSQL contracts and Windows Relay.
  Production deployment verification is intentionally skipped for a PR, not deployment evidence.
- The disposable VM shut down normally and was verified `poweroff`; host free memory was 5.51 GiB.
- No merge, deploy, signing, publication, vendor activation, or paid license consumption.

Raw generated receipts are under `local-test-artifacts/profile-manager-readiness-20260908/`:
candidate source, package/Relay logs, clean-install/repair/uninstall JSON, both proxy attempt logs,
attempt-2 result and cleanup JSON. Tracked evidence intentionally excludes credentials and IPs.

## Next steps and unresolved questions

1. Organization admin resolves artifact quota/billing access; then rerun the failed Browser gate once
   on the unchanged reviewed source and inspect every required job before considering PR 17.
2. Diagnose managed launch timing and CFT inspection on an adequately resourced clean environment;
   preserve the operator timeout and ownership checks. Full lifecycle and browser-page routing
   remain unproven. The current evidence does not establish a proxy leak or an engine vendor fault.
3. Bind one explicitly approved releasable installer/engine/Relay/hosted tuple before distribution.
   CFT compatibility does not silently replace the historical engine release record.
4. Only after those gates close, observe unfamiliar-operator first use and seven actual days of the
   bounded disposable-data canary. Current authority remains admin-led demonstration, one profile
   at a time; `G2-IDENTITY=FAIL` stays historical and Lane C stays CLOSED.
