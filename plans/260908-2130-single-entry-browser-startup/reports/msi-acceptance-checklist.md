# MSI Acceptance Checklist

## Start Condition

Do not run this checklist until the lead confirms the exact candidate has passed its VM gates.
This document is prepared in advance. Publication remains HOLD until the MSI results are recorded.
Use disposable profile data; the candidate does not authorize real-account use or posting.

Candidate: `20260909-browser-0.3.13-relay-16-single-entry-5ff43b2`.
Embedded Browser version: `0.3.13`. Bundled Relay: v16.
Installer size: 145073829 bytes.
SHA-256: `25e8fc156c0769245623dfc7b082cd9f88886b3516fbca24ea9509114928e8a3`.
The installer is unsigned; the separately signed compatibility manifest does not add an Authenticode signature.

## Before Installation

1. Record the MSI Windows version and the current Browser/Relay versions.
   Also record whether signed compatibility activation already exists and its sequence. The
   prepared sequence-17 manifest accepts fresh state (0) only. If MSI has an active sequence 16,
   stop before engine activation and request the reviewed migration manifest for that exact state.
2. Close any active disposable browser profile through its normal UI. Preserve existing identity/configuration.
3. Receive the exact installer through the agreed private transfer. Verify SHA-256 before running it:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '<received installer path>'
```

Stop on a hash mismatch or security detection. Record the exact message; do not disable Defender.

## Checks

| Step | Action | Expected result | Result |
|---|---|---|---|
| 1 | Run the combined installer normally | Installation completes; Browser opens; existing data/Relay identity remain intact | OPEN |
| 2 | Restart Windows, then open only MKT Browser | One Browser manager and one owned Relay; Setup detects Relay v16; no manual Relay launch | OPEN |
| 3 | Complete supported Setup/engine activation | No missing-pin error; a disposable profile can open using the assigned proxy | OPEN |
| 4 | Close the Browser manager with X while the disposable profile is open | Manager hides to the tray; profile remains open | OPEN |
| 5 | Tray > Open MKT Browser | Same manager returns; no duplicate manager or Relay | OPEN |
| 6 | Open the desktop Browser shortcut again | Existing manager activates; no duplicate process owner | OPEN |
| 7 | Tray > Quit MKT Browser | Manager, profile and Browser control stop; Relay remains available for vault operations | OPEN |
| 8 | Open MKT Browser again | Manager returns and reconnects; profile list remains | OPEN |
| 9 | Rerun the same installer for repair | Repair completes; shortcuts and launch work; profile data and Relay identity unchanged | OPEN |
| 10 | Uninstall MKT Browser through Windows Settings | Browser and its shortcuts are removed; preserved data remains; independent Relay stays installed with standalone startup restored | OPEN |
| 11 | Check Relay ownership result | Browser-owned Relay is removed; an independently installed Relay is retained. Record which ownership case applied | OPEN |
| 12 | Reinstall the exact file if continued testing is needed | Normal Browser/Relay startup and preserved data still work | OPEN |

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

The lead must bind this response to the exact installer hash. A checklist alone is not acceptance evidence.
