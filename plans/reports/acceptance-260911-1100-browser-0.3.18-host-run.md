# Browser 0.3.18 — host acceptance run (NOT a clean-VM gate)

Date: 2026-09-11. Host: the owner's working Windows 11 machine, by explicit owner decision after
the clean-VM alternative and its evidence advantage were put to them.

**This is not clean-VM acceptance and must never be recorded as one.** The host already carried
MKT Browser 0.3.13, a live Relay identity, engine caches and real profiles. A first run here is not
a first run. Clean-VM acceptance on `mkt-phase5-nvme-20260908 @ nvme-stable-clean-20260908`
remains OPEN.

## Installed artifact is the audited one

| Check | Result |
|---|---|
| Installer sha256 before running | `e3e50666…be0fc` — matches the retained, published artifact |
| Installed `resources/app.asar` | `b1d7e827420cad2451ca231fdd0a0f05895da075ee03587df8a7ac0db120314c` — **identical to the two-build payload and to the published metadata** |
| Bundled `resources/relay/MKTTool-Relay.zip` | `d8bf25dc…6359cf` — exact pin match |
| `relay-installed-version.txt` | 17 |
| Installed product version | 0.3.18 |

The bytes running on this machine are provably the bytes that were built, compared across two
independent builds, and published.

## Passed

- **First run.** Launched, stayed alive past 25 s, window present, 4 processes. `ELECTRON_RUN_AS_NODE`
  had to be cleared first — known host trap, not a product defect.
- **Startup single-entry takeover.** Before install: `MKT Browser.lnk` + `MKTTool Relay.lnk`.
  After install: `MKT Browser.lnk` only, target `MKTBrowser.exe --background`. The Browser now owns
  Relay startup, which is the intended single-entry design.
- **Packaged runtime and profile lifecycle contract.** `verify-packaged-runtime-contract.cjs`
  against the installed executable: passed 1/1 iterations, on an isolated temp data root so the
  owner's profiles were untouched.
- **Uninstall and cleanup, with the Relay stopped.** Exit 0. Install directory emptied, Startup
  entry removed, `HKCU` uninstall entry removed, `MKTTool-Relay.exe` removed — and operator
  identity deliberately preserved: `protected-secrets/`, `relay-device-key.json`,
  `relay-config.json`, `spent-tickets.json` all kept. User profiles and `settings.json` kept.

## FINDING — uninstall fails while the Relay it owns is running

Reproduced twice, both before stopping the Relay:

```
"Uninstall MKTBrowser.exe" /S            -> exit 0, nothing removed, no message
"Uninstall MKTBrowser.exe" /S _?=<dir>   -> exit 2, modal error:

  MKTTool Relay could not be removed safely.
  The owned MKTTool Relay executable is still present.
  At ...\Temp\nscEB9F.tmp\windows-relay-cleanup.ps1:57 char:3
  + throw "The owned MKTTool Relay executable is still present."
```

Stopping `MKTTool-Relay.exe` and re-running the same command gave exit 0 and a clean removal, so
the running executable is the sole cause.

Two distinct problems:

1. **The uninstaller does not stop the Relay it owns before removing it.** The install starts the
   Relay, so the ordinary sequence — install, use, uninstall — hits this every time unless the
   operator kills the Relay by hand first. Refusing rather than deleting a running executable is
   correct; not stopping it first is the gap.
2. **Plain `/S` reports success while doing nothing.** Exit 0, no output, no removal. Any script,
   MDM push or packaged flow reading that exit code would record a successful uninstall that never
   happened. This is the more serious half: the `_?=` form at least surfaces exit 2 and a dialog.

Neither was caught by `test:installer`, whose startup-coordination suite covers shortcut ownership
rather than a live running Relay.

## Not exercised

- **Signed CFT activation.** Not run. See the seat note below — it does not need the licence, but
  it does need the signed compatibility manifest published to the update channel, which has not
  been done.
- **Proxy failure and recovery.** Needs profile-driven runs against a live proxy; skipped rather
  than run against the owner's real profiles.
- **Repair.** Not run.
- **Pinned-engine verification.** The host supplies CFT `152.0.7977.83`; the candidate pins
  `152.0.7977.64`. The contract verifier refused the mismatch, and was re-run with the host engine
  declared. So the runtime contract passed, but **not against the pinned engine**. On a clean VM the
  fixture would be the pinned build. This is a concrete example of why the host is weaker evidence.

## The CloakBrowser seat was not needed and was not spent

The owner authorised burning the last free seat. It turned out to be unnecessary and was left
untouched. `activate-licensed-engine-pin.ts` writes `engineKind: "cloakbrowser"` and is the only
path that reads `CLOAKBROWSER_LICENSE_KEY`; this candidate is `engineKind: cft`, and
`compatibility-engine-pin.ts` handles both kinds without a licence. "Signed CFT activation" means
consuming the signed compatibility manifest, not a vendor activation.

## Host state restored

Backed up before any change to `D:\mkt-host-acceptance-20260911\backup`: the 0.3.13 installation
(131 files), `%LOCALAPPDATA%\MKTTool` (7008 files, 1.05 GB, including profiles and `settings.json`),
`%LOCALAPPDATA%\MKTTool-Relay` including both DPAPI keys, and both Startup shortcuts.

After the run: 0.3.18 installed, `MKT Browser.lnk` restored, `MKTTool-Relay.exe` restored and
running, profiles and `settings.json` intact. Nothing had to be recovered from the backup.

## Unresolved questions

1. Should the uninstaller stop the Relay it owns, or should it keep refusing and tell the operator
   to close it? Either is defensible; silently succeeding under `/S` is not.
2. Is the plain-`/S` silent no-op a packaging defect or an NSIS invocation the product never
   intended to support? If the latter, the documented uninstall path should say so.
3. Does the compatibility manifest for sequence 22 get published to the update channel before or
   after clean-VM acceptance? Signed CFT activation cannot be exercised until it is.
