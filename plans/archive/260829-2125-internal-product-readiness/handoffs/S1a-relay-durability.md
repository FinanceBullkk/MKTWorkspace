# Handoff S1a — Relay journal durability and exact v16 artifact

> **Historical S1a snapshot — superseded by U1/P4a (30 August 2026).** The source, R2, and replay
> evidence below remains valid historical evidence. Current deployment/fleet status is recorded in
> `plans/260830-0830-consolidation-and-lane-a-release/handoffs/U4-lane-a-release.md`; do not treat
> this handoff's old branch, dirty-tree, or pending-floor wording as current.
Date: 2026-08-30T02:00:00+07:00  |  Phase: 2  |  Status: COMPLETE (local exact gate)

## Done
- Replaced fail-open spent-ticket journal with strict validation, one-time initialization marker, durable temp write (`fsync`), atomic rename, bounded records, and typed errors.
- Made `TicketReplayGuard` transactional: persistence failure does not mutate memory and permanently disables later consumption in that process.
- Wired startup journal errors into visible not-ready state and added safe `JOURNAL_UNAVAILABLE` rejection.
- Updated the restart harness to require an explicit candidate archive, verify sidecar/archive/executable hashes after extraction, and never fall back to relay/dist.
- Built Relay v16 on Windows x64 with Node v22.23.2 and ran the exact archive harness.

## Evidence written
- `reports/relay-v16-evidence.json` — sanitized candidate, hashes, test matrix, and open gates.
- `reports/relay-v16-s1a.md` — human-readable S1a report.
- `MKTTool/relay/dist/MKTTool-Relay.metadata.json` — v16 archive/EXE hash binding and build provenance (generated output, not committed).

## Verified results
- Archive `MKTTool-Relay.zip`: 33,342,752 bytes, SHA-256 `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`.
- Extracted `MKTTool-Relay.exe`: 87,987,200 bytes, SHA-256 `300646e1ea35aa47ece1b0d608d9b9681ee5bde82dd084bcdc5145345d07b60e`.
- Focused Relay tests: 18 passed; typecheck: pass.
- Exact harness: pass for same-run/restart/forced-termination replay, fresh secret ticket, corrupt journal, expiry, secret round-trip, and retirement lifecycle.

## NOT done / deliberately skipped
- R2 publish, compatibility bundle, fleet inventory, and floor 13→16 are S1b.
- Physical power cut remains an external S5 gate; fault injection is covered, not substituted for a real power cycle.
- Authenticode is absent; only the documented unsigned internal exception path is prepared.

## State the next session must know
- MKTTool HEAD `1ade2c4a921507fac9e10c30843b67b5944197dd`; pre-existing dirty `AGENTS.md` and backup preserved; S1a-owned source files are modified and uncommitted.
- `RELAY_VERSION` is now 16; `MIN_RELAY_VERSION` intentionally remains 13 until `/v16` route publication and migration preconditions are evidenced.
- MKTBrowser remains dirty in three unrelated files; do not use its current built installer as positive evidence.

## Decisions still owed by the release owner
- None for S1a; decisions record authorizes R2/floor/deploy conditionally and leaves vendor/physical gates external.

## Next unit
S1b — publish/read back v16, prepare signed compatibility bundle, inventory v13/v14/v15, then raise floor only after route-first checks. First action: run `railway status`/R2 preflight and inspect local compatibility manifest inputs.
