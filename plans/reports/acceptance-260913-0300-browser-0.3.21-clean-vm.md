# Browser 0.3.21 — clean-VM acceptance (targeted: install / repair / uninstall / cleanup)

Date: 2026-09-13. **Verdict: the audit fixes work. One regression found and fixed, not yet
re-verified on the VM.** Not published, not promoted.

## Scope, and why it is not the full matrix

The 0.3.21 changes are confined to two places: the Relay payload install (F1 hash re-verification,
F2 safe extraction) and the uninstall cleanup (F4 engine cache). This run exercised exactly that
path — steps 2, 6, 7, 8 of the standard matrix. Steps 3-5 were not run: the pinned engine still
cannot be provisioned (compatibility set unpublished, the same blocker as 0.3.19), so proxy
failure/recovery stays BLOCKED regardless of this candidate, and nothing in 0.3.21 touches it.

## Fixture

VM `mkt-phase5-nvme-20260908` @ snapshot `nvme-stable-clean-20260908`, restored explicitly before
the run (4 GiB, 2 vCPU, NVMe). Defender verified live in-guest: real-time ON, engine
`1.1.26080.3`, signatures `1.459.105.0`. All three firewall profiles enabled. Windows 11 Home.

Never-installed baseline confirmed before anything was copied in: no install directory, no product
root, no engine cache, no Relay, no uninstall registry key.

Guest access `ssh -i local-test-artifacts\vm\mkt-vm-key -p 2222 mktqa@127.0.0.1`; interactive work
dispatched into session 1 via `schtasks /it`; UAC answered with
`VBoxManage controlvm ... keyboardputscancode` (Left `e0 4b e0 cb`, Enter `1c 9c`).

## Binding hashes

| Component | Value | Result |
|---|---|---|
| installer | `9a5832f470d98069435fb3a2a5cc318e1d1f8c033b6e6ab292e8a8f0a3c791a2` | **re-hashed in-guest, matched** |
| installer size | 146056522 | matched |
| browser `app.asar` | `8cf9b82959917ff5332a30f993af3a04312a320aa9f08274a30d4e7db383a99c` | from the retained build |
| relay v17 | `d8bf25dc…6359cf` | **version 17 confirmed installed and running** |
| control contract | v4 (`c46214d9…847d59`) | appVersion 0.3.21 |
| engine CFT 152.0.7977.64 | `b0db25de…8004` | **never provisioned — not verified** |

The exact retained installer was used. Nothing was rebuilt for this run.

## Results

### Step 2 — install: PASS

Silent install dispatched into session 1. One UAC elevation, approved by scancode injection.

| | |
|---|---|
| Browser | installed, `MKT Browser v0.3.21` |
| **Relay** | **v17 installed and running (1 process)** |
| firewall | both rules present (Chrome for Testing, CloakBrowser) |
| Startup | `MKT Browser.lnk` created |
| registry | `RelayOwned=1`, `RelayStartupManaged=1`, `Publisher=Techieslab` |
| packaged resources | `app.asar`, `app.asar.unpacked`, `companion`, `installer`, `relay`, `elevate.exe` |

**This is the end-to-end proof of F1 and F2.** The Relay reached v17-installed-and-running, which
means the payload passed the new size/SHA-256 check against the manifest shipped beside it and came
through the new entry-by-entry extractor before `install-relay.ps1` ran. Had either rejected it, the
installer would have aborted with `MKTTool Relay installation failed`.

**Installer exit code not captured** — the `cmd` wrapper wrote an empty file. Per the standing
method note, guest state is the evidence and the wrapper's code is not the installer's.

### Step 6 — repair over an existing install, Relay running: PASS

The condition 0.3.19's preflight refused and 0.3.20 fixed. The repair reached its UAC prompt, which
by itself proves the preflight passed with the Relay alive; it then completed with the Relay still
running, Relay still v17, firewall rules intact, operator data byte-identical.

Two UAC prompts, not one — consistent with the previous version's uninstaller running first.

### Step 7 — uninstall: PASS

| | |
|---|---|
| install directory | removed |
| **engine cache** | **removed** |
| product root | preserved |
| `profiles.db` | `da63a52b…ab6cfc` — **identical to pre-repair** |
| `settings.json` | `b8e68c02…29cd57` — **identical** |
| `active-engine.json` (pin, sibling dir) | `51f2a68f…2c8315` — **identical** |
| Relay executable | removed (owned) |
| Startup shortcut | removed |
| uninstall registry key | removed |
| firewall rules | 0 |

All three preserved files were hashed before the repair and compared after the uninstall. Operator
data is provably untouched, which is the property F4 had to keep.

### Step 8 — cleanup: PASS

Nothing stranded: no install directory, no firewall rules, no Startup entry, no registry key, no
Relay executable. `%LOCALAPPDATA%\MKTTool-Relay\` remains as a directory (config, not the
executable) — that matches what `windows-relay-cleanup.ps1` is written to do.

## Regression found — engine cache destroyed on upgrade

**The repair in step 6 deleted the engine cache.** Profiles, settings and the pin survived, so this
was the new cleanup running correctly at the wrong moment.

Cause: electron-builder installs a new version by running the **previous** version's uninstaller
first, so `customUnInstall` — and therefore the F4 cleanup — fires on every upgrade, not only on a
user-initiated uninstall. An operator moving to a new version would lose the engine download (578 MB
on the owner's host) and have to fetch it again. The owner asked for cleanup on uninstall, not on
upgrade.

Fixed in PR #27 by guarding the block with `isUpdated`, the flag the installer passes to that
uninstaller; the NSIS template guards app-data deletion the same way. Firewall, Relay and Startup
cleanup deliberately stay outside the guard, with a test asserting it.

Full gate on the fix: all seven commands exit 0, `test:installer` **527/526/0/1**.

**This is what the clean-VM gate is for.** Every local gate passed on the defective build: 526 tests,
two-build equivalence, packaged contracts. Nothing short of installing and upgrading on a restored
fixture would have shown it.

## Fixture disclosure

The pinned engine cannot be provisioned, so `chromium\` was empty after first run and the removal
path would never have been exercised. A **synthetic** engine cache was staged at the real path and
shape (`chromium\{cft,cloakbrowser}\runtime\` with dummy `chrome.exe`, `icudtl.dat`, `locales\`),
8.4 MB for the repair observation and 6.3 MB for the uninstall. `settings.json` and
`active-engine.json` were likewise staged. `profiles.db` was genuine first-run data.

So: the directory shape, location and removal behaviour are real; the bytes are not a real engine.
Removal of an actually provisioned engine remains unverified.

## OPEN — not done, not waived

- **The #27 guard fix has no VM evidence.** This run proved the defect, not the correction. Needs a
  new candidate, then install → upgrade over it → confirm the cache survives → uninstall → confirm
  it goes.
- **Engine never provisioned.** Steps 3-5 unrun; proxy failure/recovery still BLOCKED.
- **Pinned CFT engine** still never exercised anywhere.
- **Publication, operator promotion, signed compatibility manifest.** None done.
- **Relay release token** still returns 401; the two-build used a hash-verified cached archive.
- **Browser-page network, unfamiliar-operator, second-PC, seven-day canary.** A VM on this host is
  not independent physical hardware. All remain OPEN.

## Method notes for the next session

- The NSIS uninstaller copies itself to temp and returns immediately, so a wrapper's marker file
  lands long before anything is removed. Poll real guest state (install dir, processes, firewall
  count), never the marker.
- Repair/upgrade raises **two** UAC prompts; a dispatcher that answers one will stall.
- `installer.nsh` must stay ASCII-only — an existing assertion catches em dashes in comments.
- Hash operator files **before** dispatching anything, while nothing holds them; `profiles.db` is
  locked while the Browser runs and `Get-FileHash` fails on it.
- A PowerShell heredoc containing `Remove-Item` next to a `/S` argument tripped a host guard; using
  a fresh filename instead of deleting avoided it.

## Unresolved questions

1. Should the engine cache survive an uninstall too, when a reinstall is likely? The guard now
   distinguishes upgrade from uninstall, but nobody has said whether "uninstall" should mean
   "discard hundreds of megabytes the operator may want back in ten minutes".
2. Is a synthetic engine fixture acceptable standing evidence for the removal path, or must this
   wait for a published compatibility set?
3. The Relay download token has now blocked one build. Restore it, or document the cached-archive
   path as the supported route?
