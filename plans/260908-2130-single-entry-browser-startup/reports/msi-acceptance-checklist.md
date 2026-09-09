# MSI Acceptance Checklist

## Start Condition

**VM installer/lifecycle gates PASS. MSI read-only preflight is ready.**
Earlier 0.3.13-0.3.16 candidates are superseded after observed activation/usability failures.
Exact 0.3.17 passes clean install 9/9, repair 13/13, uninstall 15/15 and independent Relay retention
21/21. Signed activation, active-profile tray/Open/shortcut/Quit and proxy failure/recovery pass.
Visible-manager profile use is verified on the prospective two-vCPU/4-GiB VM; earlier one-vCPU
launch timeouts remain recorded. Physical MSI performance is unobserved.

Before the installation checks, return the MSI preflight and arrange supported private candidate
activation. The signed sequence-21 package accepts state 0 only; existing nonzero state needs a
reviewed migration. The VM's private Web fixture is stopped and is not an MSI activation service.
Publication remains HOLD until exact-file MSI results are recorded and activation access is ready.
Use disposable profile data; the candidate does not authorize real-account use or posting.

Candidate: `20260909-browser-0.3.17-relay-17-browser-ip-observer-cft`.
Embedded Browser version: `0.3.17`. Bundled Relay: v17.
Installer size: 146047736 bytes.
SHA-256: `6d07fd4ef529b3505a8de385c7d0d3214258e8a020abbd00de51e8f9810a4ca8`.
The installer is unsigned; the separately signed compatibility manifest does not add an Authenticode signature.

## Before Installation

1. Copy the entire `msi-handoff` folder to MSI and run this read-only preflight from that folder:

```powershell
powershell.exe -NoProfile -File .\Inspect-MSI.ps1
```

   Return its JSON result. It records Windows, the installer hash, Browser/Relay versions and
   selected compatibility fields without changing identity, configuration or installed software.
   If Relay is stopped, compatibility remains unknown; do not treat it as fresh state.
   Also record whether signed compatibility activation already exists and its sequence. The
   prepared sequence-21 manifest accepts fresh state (0) only. If MSI has any active nonzero sequence,
   stop before engine activation and request the reviewed migration manifest for that exact state.
2. After preflight review and private activation access are ready, close any active disposable
   browser profile through its normal UI. Preserve existing identity/configuration.
3. Receive the exact installer through the agreed private transfer. Verify SHA-256 before running it:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '<received installer path>'
```

Stop on a hash mismatch or security detection. Record the exact message; do not disable Defender.

## Checks

| Step | Action | Expected result | Result |
|---|---|---|---|
| 1 | Run the combined installer normally | Installation completes; Browser opens; existing data/Relay identity remain intact | OPEN |
| 2 | Restart Windows, then open only MKT Browser | One Browser manager and one owned Relay; Setup detects Relay v17; no manual Relay launch | OPEN |
| 3 | Complete supported Setup/engine activation | No missing-pin error; a disposable profile can open using the assigned proxy | OPEN |
| 4 | Close the Browser manager with X while the disposable profile is open | Manager hides to the tray; profile remains open | OPEN |
| 5 | Tray > Open MKT Browser | Same manager returns; no duplicate manager or Relay | OPEN |
| 6 | Open the desktop Browser shortcut again | Existing manager activates; no duplicate process owner | OPEN |
| 7 | Tray > Quit MKT Browser | Manager, profile and Browser control stop; Relay remains available for vault operations | OPEN |
| 8 | Open MKT Browser again | Manager returns and reconnects; profile list remains | OPEN |
| 9 | Rerun the same installer for repair | Repair completes; shortcuts and launch work; profile data and Relay identity unchanged | OPEN |
| 10 | Uninstall MKT Browser through Windows Settings | Browser and its shortcuts are removed; profile data remains; Relay behavior follows the ownership case in step 11 | OPEN |
| 11 | Check Relay ownership result | Browser-owned Relay is removed; an independently installed Relay is retained. Record which ownership case applied | OPEN |
| 12 | Reinstall the exact file if continued testing is needed | Normal Browser/Relay startup and preserved data still work | OPEN |

For step 3, confirm the signed target identifies Browser 0.3.17, Relay 17 and CFT 152.0.7977.64.
Do not reuse the revoked VM session, install its test CA, change the hosts file, or manually edit
an engine pin. Candidate access must be arranged for the MSI state before this step.

Do not delete profiles, reset Relay identity, or edit configuration to make a failing step pass.
Report the failed step, visible error and what happened. Repair testing on MSI does not use the
destructive file-damage fixture used inside the disposable VM.

## Result To Return

- Machine: MSI; Windows version/build:
- Received installer hash matches: YES / NO
- Steps 1-12: PASS / FAIL / NOT RUN, with reason for each non-PASS:
- Browser version / Relay version:
- Existing compatibility activation: absent / sequence number / unknown
- Existing Relay ownership: Browser-owned / independent / unknown
- Profile data and Relay identity preserved:
- Unexpected windows, duplicate processes, security messages, or startup delay:

Also report whether Check Relay ever displays a notice. If it does, leave it open briefly and
confirm that the manager/tray still respond; then dismiss it. A notice must not freeze the application.

The lead must bind this response to the exact installer hash. A checklist alone is not acceptance evidence.
