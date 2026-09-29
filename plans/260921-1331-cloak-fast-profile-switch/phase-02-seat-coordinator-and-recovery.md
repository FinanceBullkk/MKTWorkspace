---
phase: 2
title: "Seat coordinator and recovery"
status: completed
priority: P1
dependencies: [1]
effort: ""
---

# Phase 2: Seat coordinator and recovery

## Overview

Make one desktop coordinator own admission, reservations, close reconciliation and capacity state.

## Architecture
Engine adapter owns launch/close/process evidence. A local capacity observer owns the vendor count
request. The coordinator combines both with a durable journal; UI/Relay consume snapshots only.
Reuse existing modules where possible rather than adding a second pool or recovery state machine.

Keep three independent concepts: key credential, observed vendor entitlement, local allocation.
For this release effective concurrency is min(verified vendor limit, local policy limit 1).
Do not enable paid parallel sessions or duplicate keys to simulate seats.

## Related Code Files
- MKTBrowser/apps/desktop/src/main/license-key-pool.ts
- MKTBrowser/apps/desktop/src/main/license-lease-journal.ts
- MKTBrowser/apps/desktop/src/main/license-lease-journal-schema.ts
- MKTBrowser/apps/desktop/src/main/license-lease-journal-storage.ts
- MKTBrowser/apps/desktop/src/main/license-lease-recorder.ts
- MKTBrowser/apps/desktop/src/main/license-lease-recovery.ts
- MKTBrowser/apps/desktop/src/main/index.ts
- Proposed focused modules: license-seat-coordinator.ts and license-capacity-observer.ts,
  only if existing module boundaries cannot hold these responsibilities clearly.

## Implementation Steps
1. [x] Add the official count-only observer locally. Validate finite nonnegative integer count and
   positive limit, documented state/reason, and response size. Distinguish occupied, denied,
   malformed, timeout and rate-limited results. Redact request bodies and error payloads.
2. [x] Use a bounded request timeout (initial 5 s) and observation freshness (initial 5 s from
   completion, monotonic clock). Reject older/out-of-order observations using operation generation.
   Invalidate on launch/close/key change/recovery. Do not poll automatically or cache a free
   observation across launches; single-flight duplicate count requests.
3. [x] Serialize local admission for each key across all app entry points; confirm app single-instance
   protection or add an owned cross-process lock. Check local recovery/ownership before capacity.
4. [x] Fast path: prove prior local process ownership reconciled and all owned processes exited;
   get fresh vendor availability; durably record reservation/starting; attempt one engine launch.
   If state changes during the count request, re-evaluate without spawning.
5. [x] Represent capacity-observed availability separately from confirmed vendor lease release.
   Do not rewrite an old lease as confirmed-released based only on count 0. Define a compatible
   journal transition for reconciled local closure with fresh admission evidence.
6. [x] Refusal invalidates free capacity, enters existing conservative refusal policy, and ends request.
   Timeout/unknown capacity retains conservative close policy. A timer never proves availability.
   Require a fresh observation for subsequent admission; expose an explicit check action.
7. [x] Fail closed on durable-write errors, corrupted journals and ambiguous ownership. Existing records
   migrate conservatively; document reader-version compatibility and rollback before schema changes.

## Success Criteria
- [x] Source tests cover stale/out-of-order results, occupied capacity, vendor limit >1 with local
  limit 1, denial/rate/malformed/timeout paths, key rotation, duplicate actions, and competing entry paths.
- [ ] Packaged two-process contention remains **OPEN**; source verifies the canonical Windows lock is
  acquired before settings, SQLite, tokens, or lease journals are opened.
- [x] Regression coverage protects reservation before spawn, failure after spawn, close invalidation,
  startup recovery, and persistence failure paths.
- [x] Unknown/orphan processes cannot be freed merely by count 0; PID reuse does not prove ownership.
- [x] Disk failure and clock anomalies cannot create a free seat or extend retry deadlines indefinitely.
- [x] One authoritative snapshot; no secret/key identity in public aggregate status.

## Risk Assessment
Vendor counts are observations, not reservations; another machine may win before launch.
Native licence enforcement remains authoritative. Handle its refusal without automatic engine retry.
Journal rollback must never erase uncertainty or turn existing allocations into free capacity.
