# Relay v16 local reinstall evidence

Date: 2026-09-01 (ICT)
Scope: one owner machine; aggregate technical evidence only
Status: **P5-03 PASS for this machine / fleet floor remains 13**

## Before

- Relay `/health`: `relayVersion=15`.
- Browser `/health` state: `appVersion=0.3.12`, contract compatible, CloakBrowser
  `151.0.7922.108.2` ready.
- MCP `list_profiles`: 18 profiles, 0 running.
- License lease journal: 17 records; `active=0`, `cooling=0`, `pendingRecovery=0`.
- No managed profile browser process was running. Browser and Relay were closed through their normal
  window lifecycle before installation.

## Candidate

- Installer: MKT Browser `0.3.13`, Windows x64.
- Installer size: `145,140,593` bytes.
- Installer SHA-256: `e5623b8a5275ca2ca917caebc9b4baa9640379747da8c9d5ba0fccbe256876cc`.

## After

- Installed Relay receipt: `16`.
- Installed Browser file version: `0.3.13`.
- Relay `/health`: `relayVersion=16`, `ok=true`, `configured=true`.
- Browser `/health`: `ready=true`, `appVersion=0.3.13`, contract version `4`,
  `contractCompatible=true`, CloakBrowser `151.0.7922.108.2` ready.
- License capacity after startup: `total=1`, `free=1`, `active=0`, `pendingRecovery=0`, `cooling=0`.

The first launch attempt inherited `ELECTRON_RUN_AS_NODE=1` from the Codex shell and exited before
starting Electron. Re-launching with that shell-only variable cleared produced the healthy Browser
state above; this is a host automation-environment detail, not an installer or product failure.

## Fleet disposition

This proves one real owner-machine reinstall only. The second owner machine remains unobserved, so
`MIN_RELAY_VERSION=13` is intentionally unchanged and no v15 tuple is revoked yet. Repeat the same
preflight and post-install health observation on the second machine before any floor change.

## Unresolved questions

- Second owner-machine v16 health observation.
- Full stranded-version probe and v15 revocation after both observations.
