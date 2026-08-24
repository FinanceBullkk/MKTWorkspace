# Local Candidate Built, and How to Make the Next VM Run Produce Evidence — 24 August 2026

## Status of this build

**This is a LOCAL candidate. It is not attested and must not be distributed.**

Phase 4 requires an attested candidate to come from the `release-candidate` CI workflow, which
builds the same frozen tree twice on independent clean runners and compares the staged payload. That
has not happened for this tree. What is below is one local build, useful for a VM test and nothing
else.

| Item | Value |
|---|---|
| Source commit | `7849947` |
| Tree | `b060da0` |
| Working tree at build time | clean |
| Installer SHA-256 | `ad1af433cea4070b5860a3c841d170bb1ef91ec3df33e2c11309acd0ba5d945c` |
| Installer size | 146,103,681 bytes |
| `app.asar` SHA-256 | `1097ab0ff18cd8d5b8be6ec185522c1ff70a64efa44cbcb6065a366df069388c` |
| Relay | v15, `cfeefc7f...` |
| Engine | cloakbrowser `151.0.7922.108.2`, `7b16ae30...` |
| Contract / profile schema | 4 / 3 |
| App version | 0.3.12 |

Supersedes the 23 August attested candidate `cce7b897` / `d18c8d79...`, which now trails eight
Browser fixes. That older artifact stays quarantined.

Build note: `build:win` needs `MKT_BROWSER_ENGINE_RELEASE_FILE` pointed at the tracked
`apps/desktop/windows-engine-release.json`, exactly as `release-candidate.yml` does. Without it
packaging produces the installer and then fails while emitting compatibility evidence, which reads
like a build failure but is not — the `.exe` is already on disk at that point. Worth knowing before
someone concludes the build is broken.

## What changed since the quarantined candidate

| Area | Commit | Effect |
|---|---|---|
| Licence seat persistence | `3ecc68f` | Held seats survive a restart; journal finally written; wait message explains a resting seat |
| Defender: COM removed | `8595027` | Firewall reads moved off `HNetCfg.FwPolicy2` to NetSecurity cmdlets |
| Defender: execution policy | `7849947` | Nine call sites moved from `-ExecutionPolicy Bypass` to `RemoteSigned` |

`RemoteSigned` was measured before being adopted: a script copied into a temp directory and run
under it reached exit 0, identical to `Bypass`, and NSIS-written files carry no Mark-of-the-Web.

## The VM run

Signing is ruled out by owner decision, so shape reduction is the only lever left and will likely
take more than one attempt. **A run that returns only pass/fail wastes the cycle.** Capture which
stage trips.

### Procedure

1. Clean guest from a snapshot that has never held the product. Defender on, real-time protection
   on, **no exclusions and no allow-listing** — a suppressed detection proves nothing.
2. Copy `scripts/collect-defender-detection-evidence.ps1` and the installer into the guest.
   Verify the installer hash in the guest against the value above before running anything.
3. In an **elevated** shell:
   ```
   powershell -ExecutionPolicy RemoteSigned -File collect-defender-detection-evidence.ps1 -Mark
   ```
4. Run the installer normally. Let it finish or fail on its own; do not intervene.
5. Still elevated:
   ```
   powershell -ExecutionPolicy RemoteSigned -File collect-defender-detection-evidence.ps1 -Collect -OutFile defender-evidence.md
   ```
6. Also record the install outcome: file count under the install dir, whether
   `MKTTool-Relay.exe` exists, `Get-NetFirewallRule -Group "MKT Browser WebRTC Protection"` count,
   whether the startup shortcut exists, and the uninstall Publisher value.

### Reading the result

| Outcome | Meaning | Next change |
|---|---|---|
| No detection, install completes | COM + execution-policy removal was enough | Move to combined install/repair/uninstall gates |
| Detection, `Path` is a temp NSIS plugin dir, `Process Name` is `powershell.exe` | The stager *shape* is the trigger, not any script's contents | Relocate `customInstall`/`customUnInstall` scripts to `$INSTDIR\resources`; the pre-install conflict check cannot move |
| Detection naming a specific `.ps1` | That script's contents still match | Change that script — the two `WScript.Shell` `.lnk` readers are the remaining COM users |
| Detection at the elevated stage only | `runas` + system modification is the weight | Consider a non-PowerShell path for firewall work |

The third column is why step 3-5 matters. Without the `Path` and `Process Name` fields, every one of
those rows looks identical from the outside.

## Honest limits

- Not attested, not reproducibility-checked. One local build.
- No evidence yet that any of the three Defender changes works. They remove two named triggers; the
  behavioural engine's actual verdict is unmeasured.
- The seat-persistence work in this build is unit-tested only. Its own human gate — kill a browser,
  restart the app, confirm `cooling` with a correct remaining time — has not run.
- Three parts of the stager shape are unchanged by design: temp-staged scripts for the pre-install
  check, `runas` elevation, and the startup shortcut. The first two are reducible; the third is the
  product's function.

## Unresolved

1. Should the VM run use this local build, or should CI produce a two-runner attested candidate
   first? Attesting a build that may need another shape change wastes an attestation; testing an
   unattested build means the eventual attested one is not the artifact that passed. Recommend
   testing locally first, attesting once the Defender verdict is clean.
2. If Defender still trips, is relocating scripts to `$INSTDIR` acceptable given it makes uninstall
   depend on an intact install directory? The current temp-staging is robust against a partial
   install; that robustness would be traded away.
3. `MKTTOOL_RELEASE_TOKEN` was not needed for this local build because the Relay archive was already
   staged. A truly clean build environment will need it.
