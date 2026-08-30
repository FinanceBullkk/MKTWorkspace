# Relay fleet inventory — v13/v14/v15 floor-migration surface

> **Historical DB-only inventory — superseded by the post-deploy aggregate receipt.** This report
> predates Q15 and is retained for traceability; it must not be read as evidence of two different
> operators or as a notification requirement. Q15 confirms both active v15 devices are the owner's
> machines, so migration is self-serve with no notification channel. Current aggregate evidence is
> `plans/260830-0830-consolidation-and-lane-a-release/reports/fleet-inventory-postdeploy.json`.

## Result

**PASS_WITH_OPEN_MIGRATION** — a read-only query of the production `RelayDevice` table completed at
`2026-08-29T19:03:15.188Z` (2026-08-30 02:03:15 ICT). No database mutation was attempted. The
current security floor is 13 and the decided target is a single jump to 16.

| Latest reported Relay version | Total | Active | Revoked | With last-seen | Last-seen age at query | Linked accounts |
|---|---:|---:|---:|---:|---|---:|
| v13 | 0 | 0 | 0 | 0 | — | 0 |
| v14 | 0 | 0 | 0 | 0 | — | 0 |
| v15 | 2 | 2 | 0 | 2 | both over 7 days | 1 |
| null/unknown | 3 | 0 | 3 | 0 | unknown | 0 |
| **All rows** | **5** | **2** | **3** | **2** | — | **1** |

The two active v15 rows are the concrete stranded-device surface for the planned 13 → 16 floor
change. Both have a last-seen timestamp; the oldest is `2026-08-19T01:55:37.312Z` and the newest
is `2026-08-19T07:13:16.881Z`. They belong to two distinct owners (owner IDs are intentionally
redacted). Three rows have no reported version and are already revoked, so they are not counted as
active v13/v14/v15 devices.

## Query and redaction

- Source: `PRODUCTION_DATABASE_URL` loaded by `tsx --env-file=.env`; the URL and all credential
  material were kept out of output.
- Command shape: `tsx --env-file=.env <one-off read-only PrismaPg query using
  PRODUCTION_DATABASE_URL>`.
- Query: `RelayDevice.findMany`, selecting only `userId` (used transiently for a distinct-owner
  count), `relayVersion`, `lastSeenAt`, `revokedAt`, `createdAt`, `operatorKeyReadyAt`,
  `operatorKeyGrantedAt`, and `_count.accounts`; ordered by `relayVersion` and `createdAt`.
- The hosted database needed the pg/libpq compatibility flag added to the in-memory connection URL
  so its existing `sslmode=require` behavior accepted the self-signed service certificate. No `.env`
  value was changed.
- Output is aggregate-only. Device IDs, names, owner IDs, public keys, account IDs, and opaque grant
  values were never emitted.

The complete machine-readable result is in
[`fleet-v13-v15-inventory.json`](fleet-v13-v15-inventory.json).

## Migration implications

1. v13 and v14 have no rows in this snapshot; the migration still needs compatibility probes for
   those protocol versions because inventory is a latest-snapshot view, not historical proof.
2. Two active v15 devices need an operator notification and a tested v16 update path before the
   floor can be raised. Their last-seen values are more than seven days old, so “active” means
   `revokedAt IS NULL`, not currently online.
3. `RelayDevice` has no installer-version/installer-hash columns. It cannot prove which EXE is on a
   machine, whether an update was acknowledged, or what rollback floor applies. Those facts remain
   OPEN and must come from the signed compatibility manifest, update receipts, and human/operator
   evidence.
4. `relayVersion` and `lastSeenAt` are overwritten latest-state fields. They do not establish a
   per-device version timeline or prove that an old vulnerable binary is no longer present.

## Limitations / unresolved questions

- The database snapshot cannot identify historical v13/v14 devices that never reported after the
  reporting columns were introduced.
- Installer bytes, rollback-floor history, update acknowledgements, and physical online status need
  separate compatibility/update and operator evidence; no claim of completion is made here.
