# Handoff U5 — Fleet migration and Relay floor
Date: 2026-08-30T04:55:33.4569813Z | Phase: 5 | Status: PARTIAL (route pass; device gate open)

## Done

- Re-ran an aggregate-only production inventory after P4a deployment through the Railway TCP proxy:
  v15 = 2 active, unknown/null = 3 revoked, all rows = 5. No identifiers were retained.
- Re-verified route-first with an authorized full GET of `/api/relay/download/v16`: HTTP 200,
  33,342,752 bytes, SHA-256 `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`.
- Applied Q15: both v15 devices are the owner's machines, so the upgrade path is a self-serve 0.3.13
  reinstall with no notification channel. This operational path does not itself publish or attest the
  Browser five-artifact tuple.
- Kept `MIN_RELAY_VERSION=13`; no floor, R2 pointer, or revocation mutation was made.

## Evidence written

- `reports/fleet-migration.md` — route, inventory, self-serve path, and gate ledger.
- `reports/fleet-inventory-postdeploy.json` — sanitized timestamped aggregate receipt.
- `reports/p4a-postdeploy-evidence.json` — linked deployment/route evidence.

## NOT done / deliberately skipped

- No real-device reinstall observation: this host cannot operate or observe the owner's two machines.
  Do not infer v16 from the database, fixtures, or route bytes.
- P4b remains OPEN and the 0.3.13 Browser installer/tuple is not treated as published or provenance-
  complete here; use only an owner-approved installer receipt when the owner performs the reinstall.
- No `MIN_RELAY_VERSION` edit, production floor deploy, v15 revocation, or compatibility tuple
  fabrication. Those actions wait for both local health observations and the probe matrix.

## State the next session must know

- Live deployment: `ed972e5b-7597-4c6d-8066-24bc11c4ea0b`, master merge SHA
  `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`; final master CI/deploy-verification run is
  `33297347911`; healthcheck is `/api/healthz`.
- Route-first is PASS. The only U5 operational blocker is physical owner-machine evidence; leave
  the floor at 13 until both machines report `relayVersion: 16`.
- P4b remains an independent OPEN Browser tuple; Lane C is CLOSED because no CloakBrowser channel
  exists (no request/date/“coming soon”).

## Decisions still owed by the owner

- None for the current U5 preparation. The eventual floor mutation remains owner-approved only after
  the two machine observations and complete probe evidence.

## Next unit

U3's deterministic packaging residual and U7's documentation reconciliation are already recorded.
The remaining work is final explicit-path review/commit bookkeeping; do not restart U3 or reopen the
closed Lane C path.
