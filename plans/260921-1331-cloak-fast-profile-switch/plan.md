---
title: "CloakBrowser fast sequential profile switching"
description: "Repair sequential reuse of the free CloakBrowser key with coordinated capacity, durable recovery and mandatory native fingerprint validation."
status: in_progress
priority: P1
branch: "master"
tags: []
blockedBy: [260924-0114-relay-cold-start-tls-profiles]
blocks: []
created: "2026-09-21T06:33:43.960Z"
updated: "2026-09-22"
createdBy: "ck:plan"
source: skill
---

# CloakBrowser fast sequential profile switching

## Overview

Close P1, then open P2 with the same free key after verified shutdown and fresh capacity.
Retain native CloakBrowser fingerprint functionality. One active profile at a time.
Source phases 1-3 are complete. Packaged Stage A passed on R27; the frozen fingerprint gate was
measured on R28 and failed all three criteria. Proxy and clean-VM delivery gates remain open.

## Evidence and scope

- [Successful SDK experiment](../reports/debug-260921-1314-cloak-free-seat-reuse.md): exact `.6` engine,
  SDK 0.5.10, count 0 -> 1 -> 0 -> 1 -> 0. P2 requested 1.732 s after P1 closed;
  usable by 5.193 s including a deliberate 3 s pause. Not a performance guarantee.
- Browser baseline `06fe257c7ee615b156d776cfd10d415a933c23b2`; Tool baseline
  `3461b58f5e0e6e30221354e1b29b945e84c5fdf8`. Recheck HEAD/dirty work before implementing.
- Earlier refusal remains valid negative evidence. Root cause is not isolated.
- Architecture scope: engine lifecycle adapter, one seat coordinator, durable journal,
  read-only aggregate Browser/Relay/Web status. No new service or database required.
- Key identity is not seat identity. Read vendor entitlement separately from the local concurrency
  policy; retain local limit 1 for this delivery. Paid multi-session execution is deferred.
- No CFT/Brave fallback, native engine rebuild, shared process/context shortcut, new key or purchase.
  Stock Chrome/CFT may only serve as the fingerprint laboratory control, never a product substitute.
- Preserve proxy binding, managed launch authorization, signed engine pins and checksum enforcement.

## Required outcome

- [x] P1 closes and P2 opens through the actual packaged app without a fixed 25/30-minute wait on the healthy path. **PASS: R27 completed P1 -> P2 -> P1 -> P2 in 3.647-3.929 seconds per transition.**
- [x] Unknown ownership, stale capacity, refusal and persistence errors remain conservative in source behavior and regression tests.
- [x] Each operator request performs at most one engine launch; duplicate admission/refresh requests do not queue a later launch.
- [x] Native fingerprint configuration survives actual close/reopen and profile switching. **PASS for configuration preservation: R27 retained all 13 required native flags; this is not identity evidence.**
- [x] Report fingerprint A/B/C independently using the existing five-profile gate; no invented PASS. **MEASURED / FAIL: R28 completed 10/10 launches and all three criteria failed.**
- [x] Packaged acceptance and delivery evidence remain separate from source tests and SDK evidence.

Architecture and product tests must finish before live acceptance. Do not delete the conservative
fallback globally. Do not claim zero startup time or robust reuse from the single SDK observation.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Lifecycle diagnosis](./phase-01-lifecycle-diagnosis.md) | Completed (source) |
| 2 | [Seat coordinator and recovery](./phase-02-seat-coordinator-and-recovery.md) | Completed (source) |
| 3 | [Profile switching and user status](./phase-03-profile-switching-and-user-status.md) | Completed (source) |
| 4 | [Native fingerprint and live acceptance](./phase-04-native-fingerprint-and-live-acceptance.md) | In progress — Stage A and host proxy preflight PASS; fingerprint FAIL; browser-network/two-process OPEN |
| 5 | [Delivery and rollback](./phase-05-delivery-and-rollback.md) | In progress - source/build/preflight PASS; VM/promotion OPEN |

## Current checkpoint - 22 September 2026

- **PASS:** R27 completed the packaged P1 -> P2 -> P1 -> P2 lifecycle with graceful SDK closes,
  no surviving engine process, separate persistent storage, all native arguments and fresh provider
  capacity returning to `0/1` after each close. The replacement directory package passed its
  packaged contract and packaging reported `83 PASS / 1 SKIP`; the machine-integration skip remains
  OPEN rather than promotion evidence.
- **PASS:** R28 completed five profiles twice, 10/10 launches and 10/10 `Browser.close` shutdowns;
  raw host-identifying evidence was deleted after the redacted receipt was verified.
- **PASS:** Review found and fixed close/invalidation races both during cooling-hold persistence and
  app-wide shutdown. Focused regressions pass; full validation must be rerun on the final frozen tree.
- **PASS:** review fixes cover generation-aware observations, sanitized reasons, stream failure
  classification, refresh coalescing, profile-lifecycle authorization, a 10-second Web timeout, and
  acquisition of the Windows single-instance lock before shared licence state.
- **PASS:** Browser and MKTTool source commits are pushed. Two isolated Browser builds produced the
  same normalized 129-file payload; retained installer, Relay 18, CFT and 20-file VM bundle hashes
  passed the host-only candidate preflight.
- **PASS:** A redacted host preflight exercised all 10 entries in the newest Webshare source through
  the product's proxy probe. All 10 produced distinct proxy egress from the direct baseline in
  0.709-1.017 seconds; no host, username, password or observed IP is present in the receipt. This
  proves current proxy reachability only, not browser-page, DNS or WebRTC containment.
- **PASS:** Host candidate preflight r3 binds the unchanged 20-file candidate bundle, a synthetic
  account, separate real proxy entries for compatibility smoke and profile traffic, and the
  revision-aware guest UI controller. The isolated fixture database now holds exactly one user,
  session, account, profile proxy and observer proxy, with no Relay device before enrollment.
- **FAIL / separate production operation:** the one active production ObserverProxy was read and
  probed through a read-only database connection but was unreachable. It was not copied into the
  clean-VM fixture or represented as healthy. The fixture uses two live, unassigned Webshare
  entries and makes no independent-provider claim.
- **OPEN:** packaged two-process contention, browser-page proxy/DNS/WebRTC and failure/recovery,
  exact installer clean-VM
  lifecycle, repair/uninstall, second-PC, human acceptance, and canary.
- **FAIL:** R28 criterion A, B and C all failed; `G2-IDENTITY=FAIL` remains unchanged. This blocks
  antidetect, identity-isolation and real-account-safety claims, not the profile-manager boundary.
- **BLOCKED:** none at source level.

## Dependencies

The remaining practical acceptance/delivery work is blocked by the
[Relay cold health, pilot TLS and profiles repair plan](../260924-0114-relay-cold-start-tls-profiles/plan.md).
This reflects the 23 September terminal NO-GO; it does not reopen completed source/lifecycle or
fingerprint measurements. Historical PASS and FAIL results remain unchanged.

Completed inputs: [licence fixes](../260921-1109-licence-seat-fixes/plan.md),
[free-key experiment](../260921-1314-cloak-free-seat-reuse/plan.md).
The old fingerprint spike is completed historical input; its Brave scope is not reopened.
Current source implements the conditional fast path; the accepted product does not supersede its
existing cooldown behavior until Phase 4 and Phase 5 acceptance passes.
The new repair dependency applies to the remaining Web/Relay clean-VM and delivery gates.

## Execution and unresolved decisions

Execute remaining phases in order; Phase 4 and Phase 5 are in progress. Source selected the existing
launcher, a five-second capacity request/freshness bound, and conservative rollback via
`MKT_BROWSER_FAST_LICENSE_REUSE=0`. Use Node 22.23.2 / pinned Yarn; preserve unrelated changes and
original receipts. Do not adjust fingerprint thresholds after measurement begins.
