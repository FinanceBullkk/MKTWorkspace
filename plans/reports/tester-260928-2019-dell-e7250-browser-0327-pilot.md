---
type: tester
date: 2026-09-28
status: partial
---

# Test Report: Dell E7250 Browser 0.3.27 Pilot

## Summary

Browser `0.3.27` and Relay `20` install correctly on the 4 GB Dell Latitude E7250. Browser login startup, Browser MCP, exact packaged bytes, loopback binding, and Defender checks pass. The first Relay automatic-start attempt failed while Zalo consumed about 1 GB and free RAM was below 660 MiB. A second real reboot with Zalo closed passed: Relay was healthy by 92 seconds uptime and remained healthy at 157 seconds.

Manual Relay launch from the logged-in desktop session also succeeds and remains healthy. This eliminates missing files, wrong hashes, unsafe paths, shortcut drift, and a generally broken Relay executable. The controlled reboot strongly links the first failure to login-time resource contention, but exact companion timing remains uninstrumented.

## Candidate

| Item | Value |
|---|---|
| Evidence root | `D:\MKTWorkspace-local-validation\260928-1816-browser-0327-acceptance` |
| Browser source | `67e8f16b35a3b8427cf5d5d98aebdc413eee2447` |
| MKTTool source | `a32c293fc9a25c3d17873a31e9a5a62d711e2f3e` |
| Browser / Relay | `0.3.27` / `20` |
| Installer | `MKTBrowser-0.3.27-build-a.exe` |
| Installer SHA-256 | `e690602ea5f134174fa105263cafae843670f86c30263c8d13677355ef8959ca` |
| Installed Browser SHA-256 | `3d75633c8d17a9b75a677452f94bee78f66cd971f76da645824f2a4fcfe65f17` |
| Installed Relay SHA-256 | `630c134f879b253fa4174905604042d0b1f7089624cf045c57e883c744666b88` |

## Environment

| Item | Observed |
|---|---|
| Machine | Dell Latitude E7250, i5-5300U, 2C/4T |
| OS | Windows 11 Pro `10.0.22000` |
| RAM | `3968 MiB` visible |
| Storage | 256 GB SSD, prior health check good |
| Network | Tailscale SSH, key-only |
| Defender | Antivirus enabled; real-time protection enabled |

## Results

| Gate | Status | Evidence |
|---|---|---|
| Two isolated builds | PASS | Normalized payloads equivalent, 129 files |
| Installer copy/hash | PASS | Remote installer hash matched selected Build A |
| Silent install | PASS | Browser `0.3.27`, Relay `20`, shortcuts and firewall rules present |
| Packaged file ownership | PASS | Browser, Relay, launcher, companion, detector, and manifest exist; no reparse points |
| Packaged script hashes | PASS | Installed scripts, launcher, and manifest match Build A bytes |
| Startup shortcut | PASS | Target is installed `MKTBrowser.exe`; argument exactly `--background` |
| Browser startup after reboot | PASS | Four Browser processes in interactive session `1` |
| Browser MCP after reboot | PASS | `127.0.0.1:47822` owned by Browser and responsive in prior check |
| Relay automatic startup after reboot | PASS on reduced-load rerun | First reboot failed; second reboot with Zalo closed had Relay v20 healthy at 92 s and 157 s uptime |
| Installed conflict detector | PASS | Runtime inspection exit `0`: existing-install inspection passed |
| Manual interactive Relay launch | PASS | Temporary interactive Scheduled Task exit `0`; parent and child in session `1`; health HTTP `400`, `relayVersion=20` |
| Defender | PASS | Enabled throughout; no candidate detection observed |
| Repair / uninstall | SKIPPED | Deliberately not run before documenting startup failure |
| Release readiness | OPEN | Acceptance receipt remains `acceptance=OPEN`, `releaseReady=false` |

## Findings

### 1. Relay automatic startup passes only after reducing login load

The first real reboot returned Browser and MCP but no Relay during the 65-second observation window. After the owner closed Zalo, free RAM rose from about `456 MiB` to `1,521 MiB`. The next real reboot produced Browser and Relay automatically in interactive session `1`; Relay health returned HTTP `400` with `relayVersion=20` at both 92 and 157 seconds uptime.

The reduced-load rerun closes the basic automatic-start function but exposes a machine-capacity risk: the same installed bytes did not start reliably under the normal heavier login load.

### 2. Installed package and launcher are valid

- Browser startup shortcut: canonical target, `--background`, correct working directory, no reparse point.
- `windows-install-conflict-detection.ps1` passes with `-RuntimeInspection` while Browser is running.
- Installed companion, conflict detector, Relay manifest, Relay executable, and CMD launcher match Build A hashes.
- The same CMD launcher starts a healthy Relay when invoked in logged-in desktop session `1`.

These checks make package corruption, wrong path, duplicate installation, unsafe shortcut, and invalid Relay bytes unlikely causes.

### 3. Login-time resource pressure is strongly correlated, not fully instrumented

Before the successful rerun, observed free physical memory ranged from about `330 MiB` to `660 MiB`; Zalo used about `969 MiB`, Defender about `337 MiB`. Browser and Relay together used roughly `111 MiB`, but Windows had little headroom while login applications were starting. With Zalo closed, free RAM was `1,521 MiB` before reboot and `1,511 MiB` at 157 seconds uptime.

Browser performs one explicit companion attempt and does not supervise/retry it continuously. The PowerShell companion process has an `18,000 ms` timeout at `MKTBrowser/apps/desktop/src/main/windows-relay-companion.ts:91`; normal startup invokes it once at `MKTBrowser/apps/desktop/src/main/index.ts:1161`. The two reboot outcomes make login contention the leading explanation. No persisted companion duration/status proves whether the first attempt timed out, failed to spawn, or returned another status.

### 4. SSH-launched Relay attempts are not valid persistence evidence

Relay stayed available while the SSH diagnostic process remained open, then its process tree ended with the SSH job. The later interactive-session test remained healthy beyond 40 seconds after the task action completed. Only the interactive result is retained as manual-start evidence.

## Current State

- Browser remains installed and was automatically started in interactive session `1` after the second reboot.
- Relay was automatically started in interactive session `1` after the second reboot.
- Relay currently listens only on `127.0.0.1:47821` and returns expected unconfigured health: HTTP `400`, Relay `20`.
- Browser MCP listens only on `127.0.0.1:47822`.
- Temporary Scheduled Task was removed.
- No repair, uninstall, firewall change, SSH change, or product-data deletion performed.

## Recommendations

1. **P0:** Keep overall candidate acceptance `OPEN`; record reboot auto-start as `PASS under reduced login load`, with the initial heavy-load failure retained.
2. **P1:** Upgrade RAM to at least `8 GB`. A single additional compatible `4 GB DDR3L-1600 SO-DIMM` is sufficient for this pilot and should allow ordinary login applications to coexist with Browser/Relay.
3. **P1:** After the RAM upgrade, repeat reboot with the owner's normal startup applications and capture companion duration/status.
4. **P1:** Product follow-up: persist sanitized companion startup status/duration and consider a bounded delayed retry for resource-constrained login, without turning Relay into a restart loop.
5. **P2:** Run repair and uninstall lifecycle only after the reboot startup failure is either reproduced with instrumentation or closed by the RAM rerun.

## Unresolved Questions

- Did the first post-reboot companion invocation time out, fail to spawn PowerShell, or return another status under memory pressure?
- Does the same exact installation pass reboot auto-start with the owner's normal startup applications after RAM reaches 8 GB?
