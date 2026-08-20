---
phase: 3
title: "Integrate Driver and Startup Recovery"
status: pending
priority: P1
effort: "1-1.5 days"
dependencies: [2]
---

# Phase 03: Integrate Driver and Startup Recovery

## Context Links

- `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBrowserDriver.ts`
- `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\index.ts`
- `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\startup-orphan-sweep.ts`
- `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-key-pool.ts`
- `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\cloakbrowser-pro-channel.ts`

## Overview

Add one orchestration seam between driver lifecycle, sidecar instances, lease recovery, and key-pool
state. Make the smallest possible edits to the 2,700-line driver; keep new behavior in a focused
controller with injected dependencies and plain Node tests.

## Requirements

- Start the sidecar after the profile SOCKS5 bridge is ready and before spawning CloakBrowser.
- Set `CLOAKBROWSER_LICENSE_API` only for CloakBrowser launches.
- Keep the sidecar alive until browser shutdown and explicit release finalization finish.
- Close every sidecar and bridge on failed launch, normal close, external exit, and app quit.
- On startup: close orphan browsers first, then recover pending leases, then allow new launches.
- A key returns to idle only after the controller reports confirmed release. Unknown release remains
  cooling/pending.
- Recovery resolves proxy/key material from current local state by profile ID and key hash. It does
  not persist a second plaintext copy.

## Architecture

Create `LicenseRuntimeController` with these responsibilities:

```ts
prepareLaunch({ profileId, key, proxyBridgeUrl }): Promise<{ apiBaseUrl: string }>
finalizeProfile(profileId): Promise<"released" | "pending" | "not-started">
recoverPending(resolveProfile, resolveKey): Promise<RecoverySummary>
stopProfile(profileId): Promise<void>
closeAll(): Promise<void>
```

The exact interface may change, but ownership must not: the driver requests lifecycle operations;
the controller owns sidecar/store details.

## Related Code Files

- Create:
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-runtime-controller.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-runtime-controller.test.ts`
- Modify:
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBrowserDriver.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\index.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\startup-orphan-sweep.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\startup-orphan-sweep.test.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-key-pool.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-key-pool.test.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\cloakbrowser-pro-channel.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\package.json`

## Tests Before

Write failing tests for:

1. CloakBrowser launch gets a profile-specific sidecar URL; CFT launch gets no license API env.
2. Sidecar startup failure prevents browser spawn and releases only a never-started reservation.
3. Two concurrent profiles receive different sidecar URLs and cannot share lease state.
4. `Browser.close` plus observed vendor end marks the key idle immediately.
5. SIGKILL/external exit with no confirmed end keeps the key pending until explicit recovery.
6. Recovery waits for orphan sweep completion before sending end or enabling launch.
7. Missing profile, removed key, unavailable proxy, or store failure never causes direct fallback.
8. Every cleanup path closes sidecar and SOCKS5 bridge exactly once.

## Implementation Steps

1. Construct the lease store and controller after `ProfileManager` is available in `index.ts`.
2. Replace fire-and-forget orphan handling with one startup recovery promise:
   - sweep orphan browser processes;
   - wait until close/kill outcomes are known;
   - recover pending leases through current profile proxies;
   - expose a sanitized summary;
   - allow the window to render, but make licensed `launch()` await this promise.
3. Inject the controller into `ChromiumBrowserDriverOptions`.
4. In `launchTracked()`:
   - reserve key as today;
   - start existing proxy bridge when configured;
   - call `prepareLaunch()` with profile ID, full key in memory, and bridge URL;
   - set `cleanEnv.CLOAKBROWSER_LICENSE_API` to the returned loopback URL;
   - keep `USERPROFILE/HOME` behavior unchanged; do not rotate vendor `install_id`.
5. Do not add `--license-through-proxy`; the sidecar's Node transport owns proxy routing.
6. Refactor shutdown order to:
   - close/terminate browser;
   - let sidecar observe normal end;
   - if active lease remains, call the measured explicit end once/retry only as Phase 01 permits;
   - update key-pool disposition from confirmed evidence;
   - stop sidecar;
   - stop SOCKS5 bridge.
7. Replace ambiguous `release(profileId, boolean)` with a named disposition such as
   `release(profileId, "confirmed" | "cooldown")` and update every caller/test.
8. Fix the current non-seat launch-failure path that unconditionally reports a clean release. A
   failure after successful session start must consult controller state.
9. Update exit-78 comments/message in `cloakbrowser-pro-channel.ts`; the old statement that license
   traffic never uses the profile proxy becomes false.
10. Add controller tests to the explicit `test:mkb02` command.

## Recovery Rules

- `released`: vendor confirmed end; key may become idle.
- `expired`: vendor explicitly says lease no longer exists; treat as released only if Phase 01
  proves this response is authoritative.
- `pending`: transport ambiguity; retain journal row and cooldown.
- `blocked-profile-missing`: profile no longer exists; do not send direct.
- `blocked-key-missing`: matching key hash cannot be resolved; retain row without logging the hash.
- `blocked-proxy`: proxied profile route unavailable; retain row and retry on next startup/manual close.

## Tests After

- Process-level integration fixture proving env injection and cleanup ordering.
- App restart fixture with a pre-populated active lease and mocked orphan process.
- Recovery retry fixture proving only permitted transitions issue another end call.
- CFT regression fixture proving no new server/store path is required for unlicensed launches.

## Success Criteria

- [ ] Driver contains only thin controller calls; protocol/store logic remains outside the large file.
- [ ] Licensed launch waits for startup recovery without blocking renderer startup.
- [ ] All launch/shutdown paths use evidence-based key release state.
- [ ] Power-loss journal recovery can release a measured valid lease through the profile proxy.
- [ ] Missing recovery dependencies fail closed and preserve retryable state.
- [ ] CFT launch and existing profile/proxy behavior remain unchanged.

## Risk Assessment

- Startup recovery can race new launch. Mitigation: one shared recovery promise awaited by licensed launch.
- Browser end and controller end can race. Mitigation: durable transition/Phase 01 idempotency rule.
- Cleanup order can destroy the proxy before release. Mitigation: sidecar finalization precedes bridge stop.

## Security Considerations

- Full key exists only in current settings/memory and sidecar request transit.
- Do not include install/instance/lease identifiers in routine logs or renderer IPC.
- Recovery errors expose profile ID and typed reason only, never proxy or vendor payload details.

