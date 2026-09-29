---
phase: 3
title: "Profile switching and user status"
status: completed
priority: P1
dependencies: [2]
effort: ""
---

# Phase 3: Profile switching and user status

## Overview

Wire the lifecycle adapter and coordinator into the real app, then carry truthful status to Web.

## Related Code Files
- MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts
- MKTBrowser/apps/desktop/src/main/license-seat-wait-message.ts
- MKTBrowser/apps/desktop/src/main/one-seat-license-ui-contract.test.ts
- MKTTool/src/lib/relay/current-device-browser-health.ts
- MKTTool/src/lib/relay/current-device-browser-health.test.ts
- Existing Browser capacity contracts, desktop launch handlers and Relay status publishers:
  locate by symbol before editing; preserve managed launch authorization.

## Implementation Steps
1. [x] Connect open, manual window close, app close and recovery through the same coordinator.
   Remove unconditional cooldown only from the verified fast path.
2. [x] Preserve explicit user close/open behavior. Do not silently close an active profile when another
   is requested. A new one-click destructive switch is not required for this delivery.
3. [x] Show Closing profile, Checking availability, Ready, In use, and Unable to verify with an action.
   Avoid claiming a countdown is a vendor release promise or unknown capacity is free.
4. [x] Provide a bounded explicit availability check that refreshes state without launching an engine.
   This avoids a deadlock where Web blocks launch but nothing can refresh the cooling state.
   A blocked click must not enqueue a later automatic launch.
5. [x] Version optional aggregate freshness/reason fields if required. Older Relay/Web consumers must
   remain conservative; capability flag stays unadvertised until integration is validated.
6. [x] Preserve durable profile seed, per-profile directories, proxy credentials and no-direct-egress
   behavior. No JS fingerprint replacement, fingerprint-off flags, shared-context shortcut or CFT fallback.

## Success Criteria
- [x] Browser, Relay, and Web source tests agree for ready, stale, cooling, refusal, disconnected, and recovering states.
- [x] Duplicate user actions result in at most one launch; refresh never launches or queues a launch.
- [x] Existing authorization/ticket, proxy-failure, and profile-ownership tests remain passing.
- [x] Native engine startup failure produces an actionable error without another engine attempt.
- [x] UI tests cover delayed and out-of-order status delivery and backwards compatibility.

## Risk Assessment
A stale Web Ready badge cannot authorize launch: desktop performs fresh admission checks.
Status refresh must not leak licence credentials through Relay, Web, telemetry or exception strings.
