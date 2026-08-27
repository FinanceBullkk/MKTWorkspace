---
phase: 6
logicalPhase: 5
title: "Profile Persistence and Rollback"
status: pending
priority: P1
effort: "2h persistence slice; fault matrix runs unattended"
dependencies: [phase-05]
---

# Phase 5: Profile Persistence and Rollback (CLI phase 6)

## Context Links

- Plan: [plan.md](./plan.md)
- Upstream policy: [graphics and context consistency](./phase-05-graphics-and-context-consistency.md)
- MKT Browser storage contract (reference only): `MKTBrowser/README.md:125-156,196-225`
- Existing atomic runtime pattern (do not copy into current checkout): `MKTBrowser/apps/desktop/ChromiumBootstrap.ts:237-365,442-489`

## Overview

Make the experimental engine's profile identity durable and recoverable. This phase proves storage
isolation, deterministic restart behavior, atomic runtime replacement, and rollback without changing
MKT Browser's profile manager or installed engine path.

## Key Insights

- A profile's identity must survive restarts and engine updates; silent seed rotation invalidates all
  measurements and operational attribution.
- Runtime replacement must be atomic and checksum-bound, with a known-good rollback target.
- The experiment must never read or write `%LOCALAPPDATA%\MKTTool\MKTBrowser` or any real profile.

## Requirements

### Functional

- Persist a versioned manifest containing engine revision, opaque profile seed, cohort/policy IDs, and
  schema version; validate it before launch.
- Maintain separate profile roots and a quarantine/repair marker for interrupted operations.
- Support update `A -> B`, failed update recovery, and rollback `B -> A` with checksums and explicit
  identity migration when required.

### Non-functional

- Atomic writes and directory swaps; no partial manifest is treated as valid.
- No secret, master seed, proxy credential, cookie, or page content in evidence.
- Keep all tests sequential at the engine layer and use disposable fixtures only.

## Architecture

```text
profile root
  ├─ identity.manifest (validated, immutable per revision)
  ├─ data/ (profile-owned)
  └─ runtime-pointer
       ├─ runtime/           -> current checksum-bound engine
       └─ runtime.rollback/  -> last known-good engine
```

An update writes a staged directory, verifies checksum and manifest compatibility, atomically swaps
the pointer, and retains the prior runtime until the new candidate passes the smoke gate.

## Related Code Files

- **Create/modify (engine checkout/test tree only):** manifest schema, atomic store, updater, rollback
  harness, fault-injection tests.
- **Reference only:** MKTBrowser bootstrap/runtime path; no code copy into MKTBrowser in this phase.
- **Do not modify:** current MKTBrowser profile database, settings, Relay state, or engine manifest.

## Implementation Steps

1. Define and validate manifest schema; reject unknown versions and missing checksums.
2. Add atomic persistence and path-containment checks for 10 disposable profile roots.
3. Implement staged runtime update, checksum mismatch rejection, and rollback pointer.
4. Run restart and fault-injection matrix; compare identity manifests and surface hashes.
5. Verify cleanup and produce a sanitized recovery report.

## Success Criteria

- [ ] `10/10` profile roots remain path-disjoint and contain no file outside their assigned root.
- [ ] `10` restart cycles per profile preserve the manifest and all measured identity hashes `10/10`.
- [ ] Update sequence `A -> B -> A` succeeds `2/2` repetitions with exact expected runtime checksums.
- [ ] A corrupted checksum and an interrupted swap are rejected/recovered `1/1` each; no partial
  runtime is launched.
- [ ] No silent identity rotation occurs (`0` unexpected seed/manifest changes); explicit migration is
  required when the engine revision cannot preserve identity.
- [ ] Fault matrix ends with `0` owned processes, `0` orphaned roots, and `0` writes to MKTBrowser data.
- [ ] Manifest schema, runtime checksums, and patch provenance restore successfully in `2/2`
  independent clean-root checks; `0` undocumented schema or patch changes are accepted.

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Crash during swap | Mixed runtime/manifest | Stage, fsync/atomic rename where supported, retain rollback pointer |
| Engine revision changes rendering | Identity drift | Gate manifest compatibility; require explicit migration and re-measurement |
| Path traversal or shared roots | Cross-profile leakage | Canonical path containment checks and disjoint-root assertions |
| Disk pressure during dual runtime | Update failure | Budget two runtimes plus 20 GiB reserve before staging |

## Security Considerations

- Keep master identity material opaque and outside logs/evidence.
- Treat manifests and profile roots as sensitive; use disposable data and sanitized summaries.
- Do not distribute a runtime until license, source notices, checksum, and approval are independently
  verified.

## Next Steps

Only a passing persistence/fault matrix permits an adapter experiment. A failed rollback or leakage
keeps the candidate `FAIL` and blocks integration.

## Unresolved Questions

- Is identity migration allowed across security revisions, or must every revision reproduce exactly?
- Where will the long-lived rollback runtime be stored if the pilot uses only 162 GiB on D:?
