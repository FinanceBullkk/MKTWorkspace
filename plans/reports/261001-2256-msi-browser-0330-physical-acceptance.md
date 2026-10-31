# MSI physical-PC acceptance — Browser 0.3.30 / Relay 22

## Summary

Direct test on the separate MSI Windows 11 laptop over key-only SSH, with Defender and all firewall profiles enabled. The exact retained Build A installer passed repair, final-state uninstall cleanup, and reinstall checks. Normal desktop first run then reached `Setup failed` on `Continue -> Create profile`: team use is **NO-GO**. This is physical second-PC installer-lifecycle evidence, not clean-VM, unfamiliar-operator, managed-profile, or release approval.

Candidate: `20260930-browser-0.3.30-relay-22-self-service-onboarding-cft`. Source checkpoints: MKTBrowser `52325793fc564ffcfffe7bfb10c8139363eb56b2`; MKTTool `a2f41fe11d8703657be1554ccf6391cf8b869b92`; workspace `6220cf82de26a8532cf18a9d0e00d9431a698b2a`.

## Findings

| Gate | Result | Observation |
| --- | --- | --- |
| Candidate identity | PASS | Retained installer `0b733f18bb129e97dcf355fc3cbc6182981e03f660cfb51c6b8f3d190667b0ad`, 148,993,695 bytes; hash rechecked on MSI before repair/reinstall. Prior A/B comparison matched 130 normalized payload files; outer EXEs differed. |
| Backup | PASS | Private MSI backup at `C:\MKTBrowser-Acceptance\state-backup-before-repair`; 57/57 Browser and 8/8 Relay files matched live SHA-256 before changes. Backup not exported or committed. |
| Repair | PASS | Exact installer `/S` exited 0. Installed `app.asar` hash `fdf5aae3a6b1e74e27876f38944510dbcb9142c65b1d73c8e820cb21b6a6e8db`; Relay EXE hash `55cc1b51cd559e73fcead09a8dd38954ab787f1ef8035d3b31524cc6bf40d78d`; version 0.3.30; two outbound-block rules and Browser startup entry present; 57/57 and 8/8 protected files unchanged. |
| Uninstall final state | PASS | Installed directory, owned Relay EXE/starter, HKCU uninstall entry, Browser startup/desktop shortcut, and both owned firewall rules absent; no product processes. Browser data 57/57 unchanged. Six Relay state files unchanged; EXE and starter intentionally removed. |
| Uninstall command completion | OPEN | `/S /currentuser`, then `/S`, and an interactive-session scheduled `/S` task each returned code 0 before removal was observed. A later read showed complete removal. Exact completing invocation cannot be attributed; exit code alone is not a safe completion receipt. Verify converged state after any automation. |
| Reinstall | PASS | Exact installer `/S` exited 0. Manifest read-back: 119/119 non-PE hashes and 11/11 PE sizes match, zero missing. `app.asar` and Relay EXE hashes unchanged; version 0.3.30, owned Relay/startup registry fields, Browser startup entry, two firewall rules restored. Browser 57/57 and Relay 8/8 backup files unchanged. |
| Normal desktop first run | FAIL | Owner opened from Start Menu and observed `Continue -> Create profile -> Setup failed`. Browser and Relay ran in desktop session 1 on ports 47822/47821. Authenticated Browser health returned 200; unauthenticated 401 was expected. Relay health returned HTTP 400 with `configured=false`, version 22. |
| Profile/runtime state | FAIL | Authenticated MCP reported Browser 0.3.30, contract 6, schema 3, CFT engine `error` with no version, and one local profile after the Create action. CFT runtime directory absent; zero owned engine processes. `%LOCALAPPDATA%\MKTTool\compatibility-updater` and `active-engine.json` were absent. Packaged source refuses unpinned runtime resolution and requires verified activation through a paired Relay; reinstall cannot create the pin. Exact UI error detail awaits owner read-back. |
| Release/distribution binding | OPEN | Local release-manifest draft says installer `NOT_PUBLISHED`, approval `HOLD_PENDING_ACCEPTANCE`, deployment `NOT_DEPLOYED`, approved tuple `NOT_SET`, Relay production fetch OPEN. These are draft statements, not live publication checks. Live GitHub `ls-remote` shows MKTTool and MKTBrowser candidate heads each three commits ahead of their respective remote branches; exact candidate deployment/download has no verified receipt. |
| CFT activation, profile/proxy failure and recovery, account onboarding | OPEN | No signed activation, real proxy, device pairing, Google/Vaultwarden key paste, or managed profile exercised in this run. |
| Identity isolation | FAIL, unchanged | Historical `G2-IDENTITY=FAIL`; CFT lifecycle and installer tests do not establish antidetect identity. |
| Clean VM, unfamiliar operator, seven-day canary | OPEN | Separate acceptance lanes; this owner-assisted physical-PC installation does not substitute for them. |

## 2 October 2026 SSH continuation

MSI was initially offline on Tailscale; SSH and ping timed out. After it reconnected, key-only SSH as `msi\admin` passed. Windows had an interactive `MSI\ADMIN` desktop session, but Browser/Relay were not running. The existing `mkt-physical-0330-launch-r1` task was inspected: one exact action targeting the installed Browser executable, interactive `ADMIN` principal. Starting that task launched Browser and Relay in session 1; local ports 47822 and 47821 listened. No new task or software was installed.

Authenticated Browser `/healthz` returned HTTP 200. MCP `get_runtime_info` returned app `0.3.30`, contract `6`, CFT engine `error`, no engine version, install readiness `checking`. MCP `list_profiles` returned count `1`; no profile was created or deleted during this continuation. Relay `/health` returned HTTP 400, version `22`, `configured=false`. `active-engine.json` remained absent. Production `/api/healthz` returned HTTP 200 with Relay version `21`. These fresh checks reproduce the onboarding blocker; they do not close signed activation or managed-profile launch. No secret value was printed or modified.

Defender detection/block event count was zero during the uninstall window. Silent uninstall's immediate code 0 was never treated as success without independent state read-back. No production publication, promotion, deployment, push, licence use, or user-app shutdown was performed.

## 2 October 2026 evening verification

Key-only SSH to `MSI\ADMIN` passed with the existing dedicated key. Browser remained in desktop session 1; ports 47822 and 47821 listened. Unauthenticated Browser `/healthz` returned the expected 401. Relay `/health` returned HTTP 400 with `relayVersion=22`, `configured=false`, `ok=false`. The authenticated Browser token file existed, but no token value was printed. The MSI had neither `%LOCALAPPDATA%\MKTTool\compatibility-updater\active-engine.json` nor the CFT `runtime\chrome.exe` or `current.json` cache files.

The packaged Browser source requires a verified compatibility engine pin and explicitly refuses upstream-latest resolution without one (`apps/desktop/src/main/ChromiumBootstrap.ts`, `fetchManifest`). The pin is written only after verified activation through the paired Relay. Thus missing pin/runtime plus unconfigured Relay is a confirmed technical block to this MSI's profile launch; the exact text rendered in the desktop error remains unobserved in this run. Do not treat `Create profile` or installer repair as activation.

Production `/api/healthz` freshly returned HTTP 200, `status=ready`, `relayVersion=21`, `releaseSource=r2`, and healthy release-metadata/operator-fingerprint checks. This proves the production Web is still not serving the candidate Relay v22 source; it does not prove installer publication status. The local exact-candidate release-manifest remains a draft with publication/approval/deployment unset. No publish, deploy, activation, profile mutation, or retry was attempted.

The owner offered Moonlight/Apollo/Tailscale for visual control. This session's Windows Computer Use native helper failed to connect to its pipe before app selection, so no Moonlight window or MSI UI was controlled or observed. This is a test-observation limit, not a product failure; SSH diagnostics continue to work.

## Recommendations

1. Do not repeat Retry or edit `active-engine.json` manually. Complete the reviewed publication/deployment and exact-tuple approval flow, pair a disposable MSI operator through the supported Web/Relay path, then dispatch the signed compatibility activation. Recheck the CFT hash, runtime and first profile launch.
2. Investigate delayed NSIS uninstaller completion separately. Release automation must poll installed directory, registry, Relay ownership, and firewall to a terminal state rather than trusting code 0 alone.
3. Use authorized human checkpoints for sign-in, local operator-key paste, and proxy recovery. Keep team release `NO-GO` while these, clean-VM, unfamiliar-operator, identity, and canary gates remain open.

## Unresolved questions

- What exact detail appears under `Setup failed` in the MSI window?
- Is the first local profile disposable and safe to remove through the supported in-app deletion flow before unfamiliar-operator testing?
- Which exact signed CFT candidate and disposable account/proxy will be used for the remaining workflow, and when will the candidate release/deployment be approved?
