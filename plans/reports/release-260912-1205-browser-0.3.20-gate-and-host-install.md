# Browser 0.3.20 — local gate, two-build equivalence, host install

Date: 2026-09-12. **Clean-VM acceptance OPEN. Not published. Not promoted to operators.**

Cut to carry MKTBrowser#23, which fixes the repair/upgrade preflight's WOW64 process lookup found
during the 0.3.19 clean-VM acceptance run. 0.3.19 stays in the bucket under its own immutable key.

## Frozen source

| Repo | Commit | Tree |
|---|---|---|
| MKTBrowser | `304bdbc7009341cf6c458ab791fe6b0945ddae54` (merge PR #23) | `70f7d21ebeccbd3012986649530fdb903dce128e` |
| MKTTool | `7a09934a7e2fffce03b6a07cfd67d6fc1dc5bec9` (merge PR #80) | `ccd2dd0aa3e3ed66d54a1701f1a810f44b3db10c` |

Both working trees clean at freeze. Runner recorded identical `before`/`after` source snapshots
across all seven commands.

## Candidate tuple

```
id             20260911-browser-0.3.20-relay-17-repair-host-bitness-cft
browserVersion 0.3.20
relayVersion   17   (unchanged, sha256 d8bf25dc…6359cf, 34289393 bytes)
engine         cft / chrome-for-testing 152.0.7977.64 (unchanged)
```

The `20260911` prefix is the date the tuple was reviewed and merged, not the build date. Changing
it would require a fresh freeze in both repositories for no gain, so it was left as reviewed.

## Local quality receipt

`D:\mkt-release-evidence\quality-260912-0320\quality-receipt.json`, runId `aec16958`,
04:50:56Z → 04:55:13Z, status `completed`, failure `none`. All seven commands exit 0:
`verify:node`, `audit:production`, `test:installer`, `test:critical-coverage`, `typecheck`,
`lint`, `build`.

`test:installer`: **502 tests, 501 pass, 0 fail, 1 skipped** — five more than 0.3.19, which is the
new `windows-install-conflict-detection-process-path` suite (4 behavioural tests across both
PowerShell hosts) plus one source guard.

**Skip adjudicated:** the opt-in `explicit machine integration gate`, requiring
`MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION=1`. It needs MKT Browser, Relay and MultiZen closed on
the machine running it; the owner's Relay was running, and closing it is not permitted. Unobserved
evidence, not a pass — same adjudication as 0.3.19.

## Two-build equivalence

Clean detached worktrees at the frozen commits, independent `yarn install --immutable` each
(Node 22.23.2, Yarn 4.5.0): `D:\mkt-build-0320\b`, `D:\mkt-build-0320\c`, plus
`D:\mkt-build-0320\MKTTool` @ `7a09934` as the frozen sibling.

```
normalized payload manifest: 129 files
sha256 2760f4a4423791b2ddc0b6ad17b075a529fc0a39a3a6613d6bd753880a9eb30a
compare: identical, exit 0
```

Byte-identical between builds: `app.asar` (`484e7353…2e97f9`) and the repaired
`windows-install-conflict-detection.ps1` (`911db3c6…ed22a`). The NSIS wrapper differs, as for every
prior candidate.

## Retained exact installer

```
D:\mkt-release-evidence\candidate-0.3.20\
  MKTBrowser-20260911-browser-0.3.20-relay-17-repair-host-bitness-cft.exe
size   146053318
sha256 2b511a42d30e7eddb1e3ad26438a7a145da02c03ea1fc650c951bdf0aa0214fb
```

From build `b`. Must not be rebuilt between acceptance and publication. A byte-identical copy named
`MKTBrowser-win-x64.exe` is staged in `publish-staging\`.

Bound artifacts: control contract v4 (`0ac35dc1…08dc77`), Relay v17 (`d8bf25dc…6359cf`),
engine CFT `152.0.7977.64` (`b0db25de…8004`).

## The fix, verified on two machines

The repair/upgrade preflight resolved a running 64-bit Relay to nothing under the 32-bit
PowerShell host NSIS actually launches, and refused. Read-only runs of both detectors, 32-bit host:

| detector | clean VM | owner's host |
|---|---|---|
| as shipped in 0.3.19 | "ownership could not be verified" (exit 21) | "ownership could not be verified" |
| 0.3.20 | "Existing-install inspection passed" (exit 0) | "Existing-install inspection passed" |

## Host install — PASS

Installed the retained exact installer on the owner's working machine, **over 0.3.18, with the
Relay running** — the exact condition 0.3.19's preflight refused. Installer exit code 0.

| | |
|---|---|
| version | 0.3.18 → **0.3.20**, 148 files |
| Relay | still running, `relay-installed-version.txt` = 17 |
| `profiles.db` | preserved — 18 profiles listed after upgrade |
| `settings.json` | preserved (`browserEngine: cloakbrowser`) |
| engine pin | preserved — `active-engine.json`, sequence 1 |
| HKCU uninstall entry | updated to `MKT Browser 0.3.20` |
| Startup | `MKT Browser.lnk` intact |

Runtime after launch (MCP `get_runtime_info`):

```
appVersion 0.3.20   contractVersion 4   profileSchemaVersion 3
engine     { kind: "cloakbrowser", version: "151.0.7922.108.2", status: "ready" }
licenseCapacity { total: 1, free: 1, active: 0 }
```

Relay status page reports **"MKT Browser connected"** and a configured device.

### Profile launch — PASS (added 2026-09-12 17:00 +07)

The one workflow that matters was initially left untested to protect the single licence seat. Run
afterwards on the host, on a throwaway profile `smoke-0320-verify`:

```
launch_profile -> no error, 5.6 s
  cdpEndpoint http://127.0.0.1:52566   pid 5928
CDP /json/version -> "Browser": "Chrome/151.0.7922.108"
CDP /json/list    -> page https://duckduckgo.com/ , title rendered in Korean
close_profile     -> closed; licence { total 1, free 1, active 0, cooling 0 }; engine process gone
```

The Korean title matches the profile's generated `ko-KR` / `Asia/Seoul` fingerprint, so emulation
was applied to the real target, not just recorded. Launch, CDP attach, page load, clean shutdown and
seat return all work on 0.3.20. The seat was returned, not leaked.

The throwaway profile remains in the list — the MCP surface has no delete tool, so it must be
removed from the UI if unwanted.

**This host runs the `cloakbrowser` engine, not the candidate's pinned `cft` build.** The active
compatibility set (sequence 1) pins CloakBrowser and Settings selects it, so the candidate's
CFT pin was not exercised here. Host evidence, not clean-VM evidence, and not engine-pin evidence.

Backup taken before the upgrade: `D:\mkt-host-backup-20260912\` — 3513 files, 301.3 MB, holding
`profiles.db`, `settings.json`, `active-engine.json`, the Relay DPAPI device key and Startup
shortcuts. The engine cache (578 MB) was excluded deliberately; it is re-downloadable and the
install does not touch it.

## OPEN — not done, not waived

- **Clean-VM acceptance of 0.3.20.** Not run. The host install above is human/host evidence on a
  machine that is not a restored clean fixture.
- **Signed compatibility manifest for 0.3.20.** Not created. `sign-compatibility-manifest.ts` is
  refused by the auto-mode classifier; the owner runs it.
- **Publication.** Nothing uploaded. The 0.3.20 object does not exist in the bucket.
- **Operator promotion.** `MKT_WINDOWS_INSTALLER_APPROVED_TUPLE_JSON` unchanged on Railway, so the
  deployment still carries no approved release tuple.
- **Pinned CFT engine.** Never exercised on any machine — the VM is unpaired and the host runs
  CloakBrowser.
- **Browser-page network, unfamiliar-operator, second-PC, seven-day canary.** Unchanged, all OPEN.

## Unresolved questions

1. Should 0.3.20 clean-VM acceptance repeat the full matrix, or only the repair path that 0.3.19
   failed? The uninstall path passed on 0.3.19 and its code is unchanged here.
2. The host cannot exercise the candidate's CFT pin while its active set pins CloakBrowser. Is a
   CFT candidate acceptable on evidence from a CloakBrowser host plus an engine-less VM?
3. The opt-in machine integration gate has now been skipped on two consecutive releases for the
   same reason. Should it move to the VM fixture, where closing the product is free?
