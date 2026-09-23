---
phase: 2
title: Repair cold readiness and timeout classification
status: in-progress
priority: P1
effort: 5-7h
dependencies:
  - 1
---

# Phase 2: Repair cold readiness and timeout classification

## Overview

Make health available within the existing Web deadline and distinguish pending inspection,
transport timeout, confirmed permission denial, and actual Browser readiness failure.

## Requirements

- Keep `RELAY_TIMEOUT_MS=4_000` initially. Give health work a proposed 2,500 ms total budget;
  choose sub-budgets from Phase 1 measurements, leaving transport/body-read headroom.
- A responding Relay may report Browser/install checks pending. Never advertise a capability,
  enable create/launch, or use stale ready state before its required check passes.
- Introduce an explicit Browser contract v6 `install-readiness-v1` snapshot. The candidate Relay
  must treat a missing, unknown, checking, expired, failed, or old-generation snapshot as
  non-operational at `/profiles`, create, and launch boundaries; Web gating alone is insufficient.
- Preserve user-gesture initiation of local requests and explicit manual retry behavior.

## Related Code Files

- Modify: `E:/MKTWorkspace/MKTTool/relay/src/main.ts`, `relay-antidetect.ts` and their focused tests.
- Modify as measurements require: `E:/MKTWorkspace/MKTTool/src/lib/antidetect/mkt-browser-mcp-client.ts`,
  `mkt-browser-adapter.ts`; keep readiness request budgets separate from long mutation budgets.
- Modify: `E:/MKTWorkspace/MKTTool/src/lib/relay/relay-browser-client.ts`, `relay-endpoints.ts`,
  `profile-setup-readiness.ts`, `profile-launch-readiness.ts`, `relay-device-locality.ts` and tests.
- Modify: `E:/MKTWorkspace/MKTBrowser/apps/desktop/src/main/windows-local-install-inspector.ts`,
  its tests and `index.ts`; optimize `build/windows-install-conflict-detection.ps1` only if measured.
- Coordinate additive types/parsers if needed: `E:/MKTWorkspace/MKTBrowser/packages/types/src/index.ts`,
  `packages/mcp-server/src/server.ts`, and Tool `src/lib/antidetect/mkt-browser-contract.ts`.
- Inspect all `RelayOutcome` consumers, including setup and vault UI, before finalizing the union.

## Architecture

Preferred: retain the existing health route, split expensive observation from response assembly.
The install inspector already has in-flight coalescing and a five-second cache: extend that module,
do not introduce a second inspector service. A snapshot must distinguish unknown/checking, verified
ready and verified failure. Runtime info reads a current snapshot; a bounded asynchronous refresh
performs the expensive ownership check. An expired successful snapshot cannot grant readiness.

Version the Browser -> Relay -> Web contract at v6 and advertise `install-readiness-v1`. The
snapshot distinguishes checking, verified ready, and verified failure. Existing Relay/Web builds
must reject the new Browser as a contract mismatch; the candidate Relay must reject missing or
unknown snapshots. A definitive install conflict can say Repair; an incomplete or timed-out
inspection must say Checking/unable to verify. If measurements show a simpler bounded
synchronous-response design meets all cold/failure scenarios, document that choice before
implementation; do not convert a 5-second check into a shorter false failure.

## Implementation Steps

1. Add regressions demonstrating a slow inspector and slow/missing MCP do not block Relay health
   past its total budget. Cover the actual health handler composition, not only helper mocks.
2. Remove unnecessary serial availability/runtime probing where a single runtime result already
   proves reachability. Preserve old-Browser fallback. Coalesce concurrent read-only probes by
   adapter/token generation; never share a ready result across a token/config/device change.
3. Make install observation nonblocking for runtime-info as described above. Retain one in-flight
   inspection, finite child timeout, windowsHide, no repair mutation, and fail-closed expiration.
   Invalidate on relevant install/config lifecycle transitions; late old-generation completions
   must not overwrite current state. Do not cache licence admission as permission to launch.
   Require the v6 install snapshot at every Relay profile inventory/create/launch boundary and
   keep a matching Web readiness check. An action must not rely on a UI result or a stale Browser
   capability alone.
4. Bound MCP readiness work end to end, including initialize, tool discovery, rehandshake and body
   read. A per-fetch timeout does not bound a chain of calls. Cancel or contain timed-out work;
   `Promise.race` without handling pending work is insufficient. Never change retry semantics for
   state-changing tools while optimizing read-only health.
5. Inspect synchronous secure-store work from Phase 1. If material, move only the necessary
   diagnostic work off this path with explicit invalidation; retirement/revocation/setup state
   must remain authoritative. Avoid a global cached-health object masking security changes.
6. Add `timeout` (or equivalent explicit indeterminate transport outcome) to the client contract.
   A deadline alone must not become `no-permission`. Use denied permission only when supported
   browser evidence explicitly establishes it; unsupported Permissions API stays unknown.
   Generic fetch TypeError can mean offline, CORS or blocking; copy must not claim certainty.
7. Apply classification through both response headers and JSON body completion. Update all
   consumers, launch/reconciliation paths and local-device messages. Keep immediate fetch inside
   the click handler; do not await a permission query before starting that gesture-bound request.
8. Keep UI actions disabled while checking, with truthful copy and manual Check again. No
   automatic ticket/profile/engine retry, duplicate Relay process, or permission reset instruction
   based solely on a timeout. Preserve mutation reconciliation after ambiguous long operations.

## Test Matrix

| Case | Required result |
|---|---|
| Slow 5-second install inspection; two simultaneous page GETs | Fast health; explicit pending; one inspector; no Ready/Repair guess |
| Expired cached PASS then changed install ownership | Pending/failed and gated actions; stale PASS not reused |
| Token/config change during a probe | Old completion ignored; new generation checked |
| Pending/failed/missing v6 install snapshot at `/profiles`, create or launch | Relay refuses before any adapter mutation; UI remains blocked |
| MCP absent, hangs, rehandshakes or stalls body | Bounded health; meaningful unavailable/unknown; no leaked pending work |
| Granted or unknown browser permission plus request deadline | Timeout/unknown; never confirmed permission denial |
| Explicit permission denial | Permission guidance, no claim that Relay is absent |
| Complete health failure/setup/retirement | Existing authoritative block preserved |
| Legacy Relay/Browser and mixed measured versions | Conservative compatibility state; never false Ready |

## Success Criteria

- [ ] Health handler budget is enforced with a documented cold-path time breakdown.
- [ ] Delivered page's cold GET remains below 4,000 ms in Phase 5; warm success is separate.
- [ ] Timeout, pending, permission denial and capacity refusal have distinct tested handling.
- [ ] Setup/ownership/licence/security gates remain fail-closed; no action retries introduced.
- [ ] Browser v6 snapshot/capability negotiation prevents old Relay/Web from treating pending
  inspection as Ready.

## Risk Assessment

This is a cross-contract change, not just performance tuning. Review both old-client behavior and
mixed-version handling. Do not remove `local-install-ready-v1` checks to improve latency.
