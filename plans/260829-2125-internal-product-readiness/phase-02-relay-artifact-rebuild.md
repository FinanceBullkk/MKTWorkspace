---
phase: 2
title: "relay-artifact-rebuild"
status: partial
priority: P0
effort: "5–8 days (journal durability + Windows build + signed compatibility bundle + fleet migration)"
dependencies: [1]
---

# Phase 2: relay-artifact-rebuild

> **Historical predecessor phase — current outcome is split.** Relay v16 publication/read-back and
> P4a `/v16` route verification are recorded in the successor plan; `MIN_RELAY_VERSION` remains 13
> pending owner-machine observations. Any five-artifact Browser bundle requirement below is P4b
> only, not a prerequisite for the MKTTool Web deployment.

## Overview

Produce an immutable Relay release containing the spent-ticket journal/replay fix from `57e14fa`,
then prove the fix against the exact archive that will be embedded in the Browser installer. The
published v15 object must not be overwritten: its bytes are immutable and its restart behavior is
known-bad.

## Requirements

> **Historical procedure notice (superseded 30 August 2026):** The requirements and steps below
> were written for the predecessor Browser/Relay ceremony. They remain evidence of the intended
> controls, but are not current work instructions. Q15 identifies the two v15 devices as the
> owner's machines, so no operator-notification channel is required; Q16 records that no
> CloakBrowser channel exists and Lane C is **CLOSED**. Current Lane A Web and fleet status lives in
> `plans/260830-0830-consolidation-and-lane-a-release/`.

- Functional: a stopped-and-restarted Relay must reject a ticket already spent before shutdown and
  accept a newly issued ticket after restart.
- Functional: the exact extracted EXE, archive, metadata sidecar, and published R2 object must have
  one version and matching hashes.
- Functional: old vulnerable Relay versions are refused by the server after a coordinated floor
  change, without stranding healthy operators before the new route is available. The floor today is
  `MIN_RELAY_VERSION = 13`, so the coordinated change is `13 -> 16` and it strands v13, v14, and v15
  devices, not v15 alone.
- Functional: the floor bump is a required deliverable of this phase, not an optional follow-up. If
  the floor stays at 13, the replay fix never becomes mandatory for the fleet and v15 relays keep
  receiving tickets; the security value of this phase lives entirely in the bump.
- Non-functional: build on a pinned Windows machine/VM with recorded Node, architecture, OS, origin,
  and compatibility settings; never infer an artifact from a path or filename.
- Security: malformed/corrupt/missing spent-ticket journal behavior is explicitly tested and is
  fail-closed for any Browser/real-account candidate. A fail-open journal cannot pass this phase;
  it keeps Lane C blocked until a separately approved redesign closes the gap.

## Architecture

Use an immutable version bump (v16 is recommended because v15 already exists in R2 with different
bytes). The safe order is:

```text
build v16 -> verify local sidecar -> exact archive/exe replay gate
       -> publish /v16 (If-None-Match: *) -> R2 read-back
       -> publish Browser pin -> package installer
       -> deploy server route/floor -> reject v15 only after v16 is reachable
```

`RELAY_VERSION` is the protocol identity (`MKTTool/src/lib/relay/relay-endpoints.ts:264`, now
`16`); `MIN_RELAY_VERSION` is the server security floor (`src/lib/tickets/ticket-types.ts:54`,
currently **`13`**, not 15). They may be changed in the same release, but the floor must never be
raised before `/v16` and the installer route are verified. Per-kind floors
(`MIN_RELAY_VERSION_BY_KIND`) remain unchanged unless the capability contract changes; note they are
derived from `MIN_RELAY_VERSION` via `Math.max`, so raising the floor moves them too.

Because the live floor is 13, the migration surface is **v13, v14, and v15**. Two decisions must be
made explicitly and recorded, not assumed:

1. **Single jump `13 -> 16`** (recommended: one coordinated migration, one probe matrix) versus a
   staged `13 -> 15` then `15 -> 16`. A staged move buys nothing here because v15 is itself the
   vulnerable version.
2. **Whether to bump at all in this release.** Leaving the floor at 13 is the do-nothing option and
   it silently keeps the replay-vulnerable v15 in service. That is a NO-GO for Lane C, and the
   decision must be signed rather than deferred.

The known fixed local v15 build is evidence of the source fix only, not the release candidate:
archive `c51ca311161b19da6846d2b131eda8bc516fccf1f10eb9159349f0016266a6f5` (34,287,423 bytes),
EXE `a1efb909d5f90b6c6fa2475a2be19ab93611cfebdbbf8d6a35733610aac48c77`. The published installer
contains different v15 bytes and failed the exact restart test. The final v16 tuple must be rebuilt
and rehashed after any version/floor change.

## Related Code Files

| Repository/path | Action | Purpose |
|---|---|---|
| `MKTTool/src/lib/relay/relay-endpoints.ts` | Modify if approved | Bump immutable `RELAY_VERSION` from 15 to the chosen unused version. |
| `MKTTool/src/lib/tickets/ticket-types.ts` | Modify if approved | Raise `MIN_RELAY_VERSION` from 13 to 16 only after v16 is published and reachable. |
| `MKTTool/relay/src/relay-identity.ts` | Verify/fix if needed | **Relay-side** replay guard: `buildReplayGuard(home)` at line 54 wires the durable journal into startup. This is the file the durability work touches. |
| `MKTTool/relay/src/spent-ticket-journal.ts` and `spent-ticket-journal.test.ts` | Verify/extend | Atomic persistence, corruption, permissions, and restart behavior. |
| `MKTTool/src/lib/tickets/ticket-replay-guard.ts` and tests | Verify (do not confuse with the relay guard) | **Server-side** ticket consumption and duplicate rejection. There is no `relay/src/ticket-replay-guard.ts`; the two guards answer different questions and must not be edited interchangeably. |
| `MKTTool/scripts/build-relay-executable.ts` | Run/possibly harden | Windows SEA build, origin/floor injection, sidecar/hash output. |
| `MKTTool/scripts/publish-relay-release.ts` | Run/possibly harden | Immutable R2 upload, metadata, and read-back. |
| `MKTTool/scripts/publish-compatibility-manifest.ts`, `scripts/sign-compatibility-manifest.ts` | Run/extend | Publish signed compatibility artifacts, revocations, and five-artifact tuple for the new floor. |
| `MKTTool/src/lib/release/compatibility-manifest*`, `compatibility-artifact-paths.ts`, `compatibility-rollback-actions.ts` | Verify/test | Existing device update/rollback contract and old-version migration. |
| `MKTTool/src/lib/relay/relay-device-version-status.ts` and retirement/update tests | Verify/extend | Inventory v15 devices and prove update/rollback-floor behavior. |
| `MKTTool/scripts/smoke-test-relay-executable.ts` | Extend | Keep same-process smoke separate from restart-specific evidence. |
| `local-test-artifacts/phase5/run-relay-spent-ticket-restart-gate.ts` | Refactor/replace | Accept candidate archive/EXE instead of hard-coded `relay/dist` path. |
| `MKTBrowser/apps/desktop/relay-release.json` | Modify in Phase 3 | Pin the published v16 archive only after this phase passes. |
| `plans/260829-2125-internal-product-readiness/reports/relay-v16-evidence.json` | Create | Sanitized exact artifact and replay evidence. |

## Implementation Steps

1. Confirm `57e14fa` is an ancestor of the chosen MKTTool release tree and inspect the diff for
   `spent-ticket-journal`, `ticket-replay-guard`, startup restore, and shutdown persistence. Run
   focused Relay tests before changing version constants.
2. Select an unused Relay version (recommend v16). Record the decision and why v15 cannot be
   overwritten. Update all generated/compatibility references atomically; search for hard-coded 15
   and distinguish fixtures/history from live release constants.
3. Implement and test fail-closed journal behavior as a mandatory Browser gate: startup/consumption
   must not accept a ticket when the journal is corrupt, unreadable, partially written, or cannot be
   durably persisted. Provide an operator-safe recovery path that cannot erase spent-ticket history;
   verify fsync/flush plus atomic rename semantics under the declared power-loss model.
4. On the pinned Windows build host, start from a clean checkout/worktree and run:
   `npm ci`, focused Relay tests, `npm run relay:build`, and `npm run relay:verify`. Record Node
   version, OS/arch, web origin, compatibility floor, source/tree SHA, archive size/SHA, EXE
   size/SHA, and metadata sidecar contents.
5. Make the restart harness consume a candidate archive (or an explicit EXE plus sidecar), extract
   it into a fresh disposable home, and assert before execution that the extracted EXE hash equals
   the archive payload and sidecar. Do not let it silently fall back to `relay/dist`.
6. Run the exact restart scenario: issue a recipient-bound disposable ticket; consume it; stop the
   process gracefully; confirm the journal is durably written; restart the same EXE with the same
   home; replay the old ticket (must reject); issue/consume a fresh ticket (must succeed); repeat
   after crash/forced termination if the vendor contract supports it. Capture process/port and
   cleanup evidence without secrets.
7. Exercise journal failure cases: missing journal on first run, corrupt JSON, partial/temp file,
   read-only directory, concurrent writes, and interrupted rename. Verify no duplicate ticket can
   be accepted and that recovery instructions are deterministic.
8. Publish the verified archive with `npm run relay:publish`. Confirm R2 uses the new immutable
   `/api/relay/download/v16` object, `If-None-Match: *`, expected metadata, and full byte/hash
   read-back. A same-version mismatch must fail, not overwrite.
9. Inventory the fleet before changing the floor. The live floor is 13, so enumerate **v13, v14, and
   v15** devices separately — device state, rollback floors, installer versions, and last-seen times.
   Define an operator notification/update path for each stranded version and a safe rollback policy
   that never re-enables the replay-vulnerable artifact silently. Record the signed decision on the
   `13 -> 16` jump (or an owner-approved alternative) before touching the constant.
10. Generate, sign, and publish the compatibility manifest and all required artifact/revocation
    objects (`npm run release:manifest:sign`, then the approved `release:compatibility:publish`/
    `release:manifest:publish` sequence). Verify the five-artifact tuple, route/version metadata,
    revocation behavior, update path, and rollback-floor tests before raising `MIN_RELAY_VERSION`.
11. Run old/new compatibility probes across the whole stranded set: **v13, v14, and v15** are each
    rejected only after the server floor/route sequence; v16 is accepted; too-new/unknown versions
    fail safely; `MIN_RELAY_VERSION_BY_KIND` stays coherent once `Math.max` lifts it to 16; existing
    healthy devices on every stranded version have a tested migration path.
12. Produce `relay-v16-evidence.json` and a human-readable report, obtain release-owner and security
    signoff, and hand the immutable tuple plus compatibility bundle to Phase 3. If any exact-artifact
    or migration check fails, stop and leave the Browser lane blocked.

## Test Scenario Matrix

| ID | Scenario | Method | Expected result | Evidence |
|---|---|---|---|---|
| P2-01 | Source contains replay fix | Ancestor/diff check + focused tests | Fix files and tests are in the frozen tree | Source SHA + test log |
| P2-02 | Build reproducibility | Clean Windows build with pinned toolchain | Sidecar version, origin, floor, size, and hashes are complete | Build metadata |
| P2-03 | Archive/EXE binding | Extract candidate and hash payload | Extracted EXE == sidecar and archive manifest | Hash record |
| P2-04 | Same-run duplicate | Consume one disposable ticket twice | Second use rejects | Replay log |
| P2-05 | Restart duplicate (P0) | Consume, stop, restart exact EXE, replay | `spentTicketRejectedAfterRestart=true` | Restart evidence |
| P2-06 | Fresh ticket after restart | Issue after restart and consume | Fresh ticket succeeds exactly once | Restart evidence |
| P2-07 | Crash/forced stop | Kill process, restart same home, replay | No spent ticket is accepted; recovery is bounded | Recovery evidence |
| P2-08 | Journal corruption | Corrupt/missing/partial/read-only fixtures | Fail-closed; no Browser candidate may silently replay | Failure matrix |
| P2-09 | R2 immutability | Publish v16 twice/mismatched bytes | First publish succeeds; mismatch fails closed | R2 HEAD/GET log |
| P2-10 | Floor sequencing | Probe v13/v14/v15 before and after the `13 -> 16` change, plus v16 | No premature stranding; every old version rejected only after route ready; per-kind floors follow | Compatibility report |
| P2-11 | Fleet migration | Inventory v13/v14/v15 devices and run update/rollback fixtures | Existing healthy devices on all three versions have a bounded upgrade path; vulnerable bytes revoked | Fleet report |
| P2-14 | Floor-bump decision | Review signed decision record before promotion | Floor bump is executed or explicitly refused with owner signature; the current refusal leaves the floor at 13 pending observed owner-machine reinstalls and preserves Lane C **CLOSED** | Decision record |
| P2-12 | Compatibility artifacts | Sign/publish five-artifact manifest/revocations and fetch them | Every route/hash/version agrees; tamper and stale revocation fail closed | Manifest receipt |
| P2-13 | Durable write failure | fsync/flush interruption and power-loss simulation | Spent state is never lost or accepted; recovery is deterministic | Durability report |

## Function / Interface Checklist

| Contract | Required check |
|---|---|
| `buildReplayGuard(home)` | Restores durable spent-ticket state before serving and has explicit corruption semantics. |
| `spent-ticket-journal` | Fail-closed read/write, fsync/flush/rename expectations, bounded size, and safe recovery are tested. |
| `ticket-replay-guard` | Recipient, expiry, signature, and duplicate checks remain unchanged except for durability. |
| Relay `/health` | Reports the chosen Relay version and does not expose secrets or ticket material. |
| Relay release sidecar | Version, archive/EXE sizes and SHA-256, source/tree SHA, build metadata are present. |
| `publish-relay-release` | Validates local sidecar, uses immutable write, and performs full read-back. |
| Restart harness | Takes explicit artifact input and fails if it uses an unbound path or mismatched hash. |
| Compatibility floor | `MIN_RELAY_VERSION` moves 13 -> 16; sequencing and the `Math.max`-derived per-kind floors are tested together. |
| Compatibility manifest | Signed five-artifact tuple, revocations, update route, and rollback floor are published/read back. |
| Fleet migration | v13/v14/v15 inventory, the Q15 owner self-serve upgrade path, and vulnerable-artifact revocation are evidenced; no notification step exists for this owner-only fleet. |

## Dependency Map

| Dependency | Direction | Reason |
|---|---|---|
| Phase 1 manifest | P1 → P2 | Version and candidate owner are frozen first. |
| `57e14fa` source | P1 → P2 | Required replay fix baseline. |
| Windows build host/VM | External → P2 | SEA executable cannot be validated on Linux alone. |
| R2 release credentials/config | External → P2 | Publish/read-back requires the release bucket; never store credentials in evidence. |
| P2 artifact tuple | P2 → P3/P4/P5/P6 | Browser pin, server floor, CI, and environment tests must use identical bytes. |

## Historical S1a/S1b closeout (pre-successor P4a; retained for evidence)

The fail-closed journal/replay implementation and exact v16 archive/EXE evidence are complete
locally, and the immutable R2 v16 object has passed full byte/hash read-back. At this historical
checkpoint the live route and floor work were OPEN; the successor later verified the deployed `/v16`
route while keeping the floor at 13 pending owner-machine evidence. See the successor
`reports/lane-a-deploy.md` and `reports/fleet-migration.md` for current status.

## Success Criteria

- [x] Chosen immutable Relay version is unused; v15 is not overwritten (local v16 candidate; R2 publication remains S1b).
- [x] Exact extracted candidate passes restart replay, fresh-ticket, crash, and journal-failure tests (see `reports/relay-v16-evidence.json`).
- [x] Archive, EXE, sidecar, and R2 object hashes/metadata match byte-for-byte (local archive/EXE binding plus immutable R2 full GET/read-back; see `reports/relay-v16-evidence.json`).
- [ ] `/v16` is reachable before any security-floor rejection of v13/v14/v15 is enabled.
- [ ] `MIN_RELAY_VERSION` is moved 13 -> 16 with a signed decision record, or the refusal to move it
  is signed and Lane C is marked blocked; the constant is never left at 13 by omission.
- [ ] Signed compatibility manifest, five-artifact tuple, revocations, fleet inventory, and update/
  rollback evidence are complete.
- [x] Journal corruption/write/fault-injection behavior is fail-closed; physical power-cycle remains
  an external S5 gate and is not substituted by this local evidence.
- [ ] Old published installer remains quarantined/revoked and is never used for positive evidence.
- [ ] Release owner and security approver sign the sanitized P2 evidence bundle.

## Risk Assessment

- **Version-floor stranding:** raising the floor before v16 is downloadable strands operators, and
  because the live floor is 13 the blast radius is v13+v14+v15, not v15 alone. Mitigate with
  route-first sequencing and an old/new compatibility probe covering all three versions.
- **Silent no-op floor:** the phase "passes" while `MIN_RELAY_VERSION` stays 13, so vulnerable v15
  relays keep receiving tickets and the fix ships without effect. Mitigate by making the bump a
  named deliverable (P2-14) with a signed decision, never an implicit follow-up.
- **Artifact substitution:** a harness or installer silently uses a different EXE. Mitigate with
  archive extraction/hash assertions and explicit artifact arguments.
- **Journal fail-open:** corrupt state could permit replay. Mitigate by making fail-closed durability
  a hard Browser gate; if it cannot be implemented, stop at NO-GO rather than shipping an exception.
- **Fleet migration:** raising the floor strands old devices or leaves vulnerable EXEs active. Mitigate
  with inventory, signed compatibility artifacts/revocations, the Q15 owner self-serve reinstall
  path, and a tested update/rollback path before changing the floor; there is no external notification
  channel to add for the owner's machines.
- **R2 overwrite/rollback ambiguity:** mutable installer metadata can point at different bytes.
  Mitigate with immutable Relay keys, versioned manifests, full read-back, and a retained rollback
  tuple.
- **Build-host contamination:** stale `dist` or credentials affect output. Mitigate with a clean VM,
  clean output directory, toolchain capture, and secret-safe logs.
