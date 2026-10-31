# Relay v16 — S1a evidence

> **Historical S1a snapshot.** Relay publication/read-back is complete and the current `/v16` route
> is verified in the successor P4a report. The floor remains 13 pending owner-machine observations;
> any vendor/Browser tuple language in this report is P4b history, not a current Lane A gate.

Date: 2026-08-30 (ICT)
Status: **EXACT_LOCAL_GATE_PASS (historical)**; publication is complete, while fleet migration and
the floor change remain open in the successor U5 record.

## Candidate

- Source: MKTTool `HEAD 1ade2c4a921507fac9e10c30843b67b5944197dd`, tree `2eb0f14174c794625ca799d961adcb30c1774bbc`; required `57e14fa` ancestor confirmed.
- Host: Windows `win32/x64`, Node `v22.23.2` (the default `v24.14.1` was not used).
- Web origin baked into the bundle: `https://mkttool-web-production.up.railway.app`.
- Relay protocol identity: v16. Security floor at build time: 13 (floor stays route-first).
- Archive: `MKTTool/relay/dist/MKTTool-Relay.zip`, 33,342,752 bytes, SHA-256 `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`.
- Extracted executable: `MKTTool-Relay.exe`, 87,987,200 bytes, SHA-256 `300646e1ea35aa47ece1b0d608d9b9681ee5bde82dd084bcdc5145345d07b60e`.
- Sidecar binds archive and executable sizes/hashes, Node/platform, origin, source commit, and compatibility sequence.

## Durability implementation

`spent-ticket-journal` now treats replay state as security state: strict JSON/record validation,
bounded size, one-time initialization marker, temp-write + `fsync` + atomic rename, and visible
typed errors. `TicketReplayGuard` commits its in-memory snapshot only after persistence succeeds;
a write failure permanently makes the running guard reject subsequent tickets. Startup exposes a
journal problem and keeps ticket routes unavailable. No recovery path deletes or replaces spent
state implicitly.

## Executed checks

`npm exec -- vitest run --no-cache relay/src/spent-ticket-journal.test.ts src/lib/tickets/ticket-replay-guard.test.ts`: **18 passed**.
`npm run typecheck`: **pass**.
`npm run relay:verify -- --archive=relay/dist/MKTTool-Relay.zip`: **pass** on the exact extracted
EXE. It covered same-run duplicate, graceful restart duplicate, fresh credential success once,
forced-termination duplicate, corrupt-journal not-ready, expired ticket, secret round-trip, and
retirement lifecycle.

The journal matrix also passed missing-after-initialization, invalid/non-array/partial JSON,
invalid and duplicate records, interrupted first-write temp, simulated flush/rename failures,
unwritable-home simulation, and serialized concurrent writes. Physical power cut remains an
external S5 gate and is not claimed here.

## Open / deliberately not claimed

- R2 `/v16` publication and byte read-back: S1b.
- Compatibility manifest, v13/v14/v15 fleet inventory, revocations, and floor 13→16: S1b.
- Authenticode: absent; the authorized 60-day Lane A/B exception still needs owner/operator rows.
- Physical power-cycle and vendor/second-PC identity gates: external and remain open.
