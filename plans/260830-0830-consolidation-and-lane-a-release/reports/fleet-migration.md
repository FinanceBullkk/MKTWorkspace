# Fleet migration and Relay floor record

Date: 2026-08-30 (ICT); revalidated 2026-09-01 (ICT)
Status: **ROUTE PASS / ONE DEVICE OBSERVED / FLOOR HELD AT 13**

The Lane A deployment is live and `/v16` is reachable. The compatibility floor was deliberately
not changed: one owner machine has been observed reinstalling and reporting Relay v16, while the
second remains unobserved from this host. Route-first is satisfied; the fleet device gate is still
required before promotion.

## Fresh post-deploy inventory

Captured `2026-08-30T04:55:33.4569813Z` from the current production database through the Railway TCP
proxy. The query emitted aggregates only; no device, owner, account, public-key, or grant identifier
was retained. Full machine-readable receipt: `reports/fleet-inventory-postdeploy.json`.

| Reported version | Total | Active | Revoked | Distinct DB owner IDs* | Linked active accounts |
|---|---:|---:|---:|---:|---:|
| v15 | 2 | 2 | 0 | 2 | 1 |
| unknown/null | 3 | 0 | 3 | 0 | 0 |
| **all rows** | **5** | **2** | **3** | — | — |

Q15 says both active v15 devices are the owner's own machines. No notification or acknowledgement
channel is needed. The intended path is a self-serve reinstall of the 0.3.13 installer on each
machine, followed by an observed v16 health response.

\* The distinct-owner value is an aggregate database grouping only; it is not a physical-operator
count and does not override Q15's owner statement.

`RelayDevice.relayVersion` is a latest self-report. It cannot prove the EXE currently installed,
the installer hash, or that a reinstall happened; those facts must come from the machines.

## 2026-09-01 owner-machine observation

One owner machine was observed through the complete self-serve path. Before installation, the local
Relay reported v15 and Browser 0.3.12; MCP listed 18 profiles with 0 running, and the lease journal
had no active, cooling, or pending-recovery records. Browser and Relay were closed normally. The
owner-approved 0.3.13 installer (SHA-256
`e5623b8a5275ca2ca917caebc9b4baa9640379747da8c9d5ba0fccbe256876cc`) then installed successfully.
After restart, local health reported Relay v16, Browser 0.3.13, contract-compatible, and the pinned
CloakBrowser engine ready. Full receipt: `reports/relay-v16-local-reinstall-20260901.md`.

This is one physical-machine observation, not both. The second owner machine remains open.

## Credentialed production inventory recheck - 2026-09-01 15:43 ICT

The authenticated `/relay-devices` page still rendered both active registry rows as `bản 15`.
That is not evidence that the local reinstall failed; `RelayDevice.relayVersion` is a self-report and
the local v16 observation is separate. It does mean the server-side inventory has not yet reconciled
the upgrade proof, so the floor must remain 13 and no v15 revocation is safe.

## Route-first evidence

After predecessor deployment `ed972e5b-7597-4c6d-8066-24bc11c4ea0b`, an authorized **full GET** (not HEAD)
of `/api/relay/download/v16` returned:

| HTTP | Bytes | SHA-256 | Match |
|---:|---:|---|---|
| 200 | 33,342,752 | `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` | **PASS** |

The hash matches the immutable published v16 object. The downloaded bytes were removed after the
comparison. One earlier client attempt ended before the complete body; the successful retry returned
all 33,342,752 bytes and the exact hash. This closes the route half of the gate, not the device half.

The predecessor deployment was `SUCCESS` at master commit
`6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`, with one running instance and
`healthcheckPath=/api/healthz`. Master CI run `33297347911` and its deploy-verification job passed.
The successor hardening deployment `0a696033-b610-492c-b75a-3e918cca102a` at commit
`2734e2f0ba9c2a2f9c3731a44540c01d263b36e2` is the current production deployment. Its 24-hour
health window is 947/947 HTTP 200 with zero server 5xx, and the authorized `/v16` full GET/hash
was reverified after that deploy.

## Self-serve upgrade path (Q15)

1. On owner machine A, verify the owner-approved local 0.3.13 installer receipt/artifact if it is
   available; if it is absent, keep the floor at 13 and do not infer an install. Then install it and query
   `http://127.0.0.1:47821/health` with the app origin. Record only `relayVersion: 16`, timestamp,
   and PASS/FAIL.
2. Repeat on owner machine B using the same owner-approved local receipt/artifact condition. The
   Browser five-artifact tuple is not published by this release.
3. Re-run the aggregate inventory; do not infer either result from the database alone.
4. Only after both observations, probe the complete version set and prepare the floor change.

No machine address, owner identifier, credential, or installer path is recorded here. No external
notification is needed because both devices are the owner's.

## Floor and probe disposition

`MIN_RELAY_VERSION` remains **13** in source and production. No R2 pointer, revocation, or database
mutation was made. The actionable `RELAY_TOO_OLD` message is covered by the branch/full test suites,
but no live under-floor request was generated against an owner device.

| Gate | Result | Evidence / next condition |
|---|---|---|
| P5-01 fresh post-deploy inventory | **PASS** | receipt at `reports/fleet-inventory-postdeploy.json` |
| P5-02 authorized full GET/hash `/v16` | **PASS** | current deployment `0a696033…`; 200 / 33,342,752 / exact SHA |
| P5-03 owner v15→v16 reinstall observation | **PARTIAL** | one owner machine reports v16; second machine remains unobserved |
| P5-04 actionable under-floor rejection | **PASS (source/tests)** | no live device probe |
| P5-05 v13/v14/v15/v16/unknown/too-new probe | **OPEN** | run after device observations and floor candidate |
| P5-06 per-kind floor derivation | **PASS (source)** | `Math.max` follows the floor; floor still 13 |
| P5-07 v15 revocation | **OPEN / deliberately unchanged** | do not invent a tuple or direct SQL mutation |
| P5-08 no premature stranding | **PASS** | route was live before any floor edit; floor remains 13 |

**Decision:** route-first is satisfied, but U5 is not promoted. Keep `MIN_RELAY_VERSION=13` until
both owner machines report v16. Revocation cannot recall an EXE already on disk; the compatibility
floor is the enforcement mechanism once the device gate is real.

## Other lane boundaries

The Browser five-artifact tuple is **P4b OPEN** because the exact Stable `.2` engine archive is
absent. Lane C is **CLOSED**: there is no CloakBrowser channel, no request was sent, and there is no
date or “coming soon” promise.

## Unresolved questions / external dependencies

- Physical access to the second owner machine for its reinstall and v16 health observation.
- Owner decision/deployment for the eventual `MIN_RELAY_VERSION` 13→16 change after those proofs.
- P4b Browser tuple remains open independently; Lane C remains closed for this product shape.
