# Handoff S1b — Relay publication and compatibility migration
Date: 2026-08-30T02:55:00+07:00  |  Phase: 2  |  Status: PARTIAL

> **Historical S1b snapshot — superseded for Lane A by the consolidation plan.** The five-artifact
> Browser tuple remains P4b OPEN, while P4a Web is deployed; `/api/healthz` and full `/v16` route
> checks are current in the successor evidence. Q15/Q16 wording below is historical.

## Done
- Re-read the S1b requirements and the authority record. The selected Browser join key is `3f37653`; the Relay release is the immutable v16 jump and the decided security-floor target is `13 -> 16`.
- Published `MKTTool/relay/dist/MKTTool-Relay.zip` to the immutable R2 v16 object using `npm run relay:publish`. The second invocation observed the existing object and performed a full GET stream/hash/size read-back; `If-None-Match: *` is enforced by the publisher. The archive is 33,342,752 bytes with SHA-256 `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`; the embedded EXE is 87,987,200 bytes with SHA-256 `300646e1ea35aa47ece1b0d608d9b9681ee5bde82dd084bcdc5145345d07b60e`.
- Queried the production fleet read-only. Five RelayDevice rows exist: active v15=2, v13=0, v14=0, and already-revoked null/unknown=3. The two active v15 rows are the concrete migration surface; installer hash, acknowledgement, and rollback-floor history are not represented in the table.
- Ran the local compatibility contract suite: 5 files / 41 tests passed. Existing signer-chain and DPAPI availability were inspected without exposing protected material.

## Evidence written
- `reports/relay-v16-evidence.json` — local exact gate plus immutable R2 publication/read-back state.
- `reports/fleet-v13-v15-inventory.md` and `.json` — aggregate-only production inventory and migration limitations.
- `reports/compatibility-input-audit.md` — sanitized five-artifact preflight and signer/engine input audit.

## NOT done / deliberately skipped
- Compatibility manifest, signed revocations, five artifact objects, and update receipts remain OPEN. The available Browser package is quarantined 0.3.12, and the exact pinned CloakBrowser Stable `.2` archive is absent. Preview `.3` is different bytes and explicitly non-promotable; no substitute was signed or published.
- `/api/relay/download/v16` is not reachable from the current Railway deployment (`401` under the protected route), and `/api/healthz` was not present on that old deployment (`404`). The floor was therefore not raised; no operator can be stranded by a premature `13 -> 16` rejection.
- Physical power-cycle, vendor entitlement/channel, proxy pairs, human login, and second-PC evidence are external gates and remain OPEN.

## State the next session must know
- MKTTool remains on `ci/self-hosted-runners@1ade2c4a921507fac9e10c30843b67b5944197dd` with intentional dirty source changes and unrelated `AGENTS.md` work preserved. Do not claim a clean checkout or CI result.
- R2 v15 is immutable and retained as negative evidence. Do not overwrite it or alter the v16 object.
- The route-first/floor-second invariant remains active for any future floor change. The Browser
  five-artifact bundle is a P4b requirement only; it never gated the independent P4a Web deployment.

## Decisions still owed by the release owner
- None for the engineering choices covered by `decisions.md`. Vendor, proxy, human, second-PC, signing, and rollback-owner items remain external/owner gates rather than reasons to stop the unblocked work.

## Next unit
S2a — production/security hardening. First action: validate the newly added authenticated release-provenance route, then finish the restore/rate-limit/deepmerge evidence bundle before starting the one-seat UI boundary in S2b.
