# S4b — Final freeze and publication/deployment preflight

> **Historical Browser freeze — superseded for Lane A.** The Browser five-artifact tuple remains
> P4b OPEN, but it never gates the MKTTool Web deployment. Q16 closed Lane C because no CloakBrowser
> channel exists; no vendor request, date, or waiting state is implied by this retained freeze.

Date: 2026-08-30 (ICT)  |  Candidate: `20260830-browser-0.3.13-relay-16`  |  Status: OPEN / NOT PROMOTED

This is a **historical Browser-only freeze**. The successor plan separately completed P4a MKTTool
Web deployment; the Browser five-artifact tuple remains P4b OPEN, and Q16 closed Lane C because no
CloakBrowser channel exists. The pre-deploy Railway observations below must not be read as current
production state.

## Freeze decision

There is no promotable signed five-artifact tuple in this run. The candidate remains a local draft,
and no Browser installer publication, stable-pointer promotion, compatibility-manifest publication,
floor change, or Railway deployment was executed. This is an explicit S4b `OPEN` result, not a
skipped PASS.

The Relay-only v16 object is an independent completed prerequisite: its immutable bytes and full
GET/hash read-back are recorded in `relay-v16-evidence.json`. It does not make the Browser tuple,
identity gate, clean-VM gate, or production deployment complete.

## Candidate tuple at the freeze boundary

| Component | Frozen/observed value | Status |
|---|---|---|
| Candidate ID | `20260830-browser-0.3.13-relay-16` | Draft only |
| MKTTool | `ci/self-hosted-runners@1ade2c4a921507fac9e10c30843b67b5944197dd`; working tree dirty | Source SHA known; clean attestation OPEN |
| MKTBrowser | `feat/installed-contract-on-clean-runner@3f3765360eae6de83fd617bf8e19949fb70719af`; working tree dirty | Join key selected; clean attestation OPEN |
| Relay archive | 33,342,752 bytes; SHA-256 `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` | PASS local + immutable R2 read-back |
| Relay EXE | 87,987,200 bytes; SHA-256 `300646e1ea35aa47ece1b0d608d9b9681ee5bde82dd084bcdc5145345d07b60e` | PASS inside archive |
| Browser installer draft | 145,140,593 bytes; SHA-256 `e5623b8a5275ca2ca917caebc9b4baa9640379747da8c9d5ba0fccbe256876cc` | Local run 4 draft; not published |
| `app.asar` draft | 51,723,396 bytes; SHA-256 `579b634d29ff0ddfff74cafcf37a79f2cd1b3646ecb3f56642888bc56458e063` | Local draft; equal to preserved run 3 |
| Normalized payload | 130 entries; SHA-256 `517272ad864410c278ef59e3c5ef9955c6ddafd99226259452b2206145d03566` | Historical run 3/run 4 manifests equal; outer NSIS differed by 78 bytes (successor U3 controlled pair is 103 bytes) |
| Licensed engine pin | CloakBrowser Stable `.2`, `151.0.7922.108.2`, expected archive SHA `7b16ae3070bfcbed9cd381d03d1a8d57a8baf8f4540650397d620eb8dbe89561` | Pin frozen; exact archive absent |
| Signing | `NotSigned`; owner decision allows Lane A/B exception for 60 days from S3 build | Lane C hard-blocked; operator names/clean-VM proof OPEN |

The draft release manifest is deliberately `status: draft`, `buildEvidence.publicationStatus:
NOT_PUBLISHED`, and `deployment.deployStatus: NOT_AUTHORIZED`. The Browser publisher refuses this
manifest until it is frozen/signed and refuses to overwrite the existing legacy fixed installer key.

### Final host reproducibility comparison

The preserved run 3 installer was 145,140,515 bytes with SHA-256
`1f8d04d440800216bffe82d00e19bdbfcc4e4d47b604022cff9066ff4d141044`. The final run 4 installer is
the tuple above (145,140,593 bytes; SHA-256 `e5623b8a5275ca2ca917caebc9b4baa9640379747da8c9d5ba0fccbe256876cc`).
The outer NSIS difference is 78 bytes, so full installer reproducibility remains OPEN. The full
normalized 130-entry payload manifests are equal at SHA-256
`517272ad864410c278ef59e3c5ef9955c6ddafd99226259452b2206145d03566`; `app.asar` and the embedded
Relay archive are byte-identical. This is host evidence, not a clean-checkout or clean-VM
attestation. The compared records are `reports/s4b-payload-manifest-run3.json` and
`reports/s4b-payload-manifest-run4.json`.

## Preflight observations

### Railway (read-only)

`railway status --json` immediately before this record showed:

- service `mkttool-web` deployment `3621f603-1c51-4246-824c-55cc0e6b5764`;
- deployed commit `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa`;
- one running replica in `asia-southeast1-eqsg3a`;
- `healthcheckPath: null` and pre-deploy `npx prisma migrate deploy`;
- target hardened commit `1ade2c4a921507fac9e10c30843b67b5944197dd` is not deployed.

Sanitized route checks against `https://mkttool-web-production.up.railway.app` returned:

| Route | Result | Interpretation |
|---|---:|---|
| `/login` | 200 | Existing deployment responds |
| `/setup` | 307 → `/login` | Existing auth guard responds |
| `/api/healthz` | 404 | New health route is not deployed |
| `/api/relay/download/v16` | 401 | Protected route on old deployment; no authenticated real GET available |
| `/api/relay/download/v15` | 401 | Protected route; no floor/revocation conclusion inferred |

The R2/build token was not present in the local shell, so no secret-bearing workaround was attempted.
The required route-first proof for raising `MIN_RELAY_VERSION` is therefore absent. No `railway up`
command was run.

### Required preconditions and disposition

| S4b precondition | Status | Evidence/blocker |
|---|---|---|
| P2 exact Relay/restart/durability gates | `PASS` | `relay-v16-evidence.json`, local and extracted harness |
| R2 v16 immutable publish/read-back | `PASS` | Full byte/hash read-back recorded |
| P5 backup/restore | `PASS (local)` | local-only `restore-verify-20260830-r4.json`; raw receipt is withheld from Git; no production migration applied |
| P5 rate limit/dependency controls | `PASS (local)` | DB-backed verifier, override, typecheck/build; live proxy chain OPEN |
| P3 candidate/build | `PARTIAL` | Full normalized payload, `app.asar`, and Relay equal across final runs; dirty source, 78-byte outer variance, and clean VM remain OPEN |
| Exact Stable `.2` engine archive | `BLOCKED` | Vendor/archive unavailable |
| S4a identity pin | `FAIL/OPEN` | Early named-surface collisions; formal fresh matrix OPEN |
| Signed P4 tuple | `OPEN` | Manifest remains draft; signing/compatibility bundle unavailable |
| Browser R2 immutable object/pointer/revocation | `OPEN` | Existing fixed key is mutable; publisher intentionally refuses overwrite |
| Railway healthcheck/provenance alignment | `OPEN` | Old deployment, healthcheck unset, hardened source not deployed |
| Rollback tuple | `RECORDED` | See below; owner must approve any actual rollback |

## Rollback tuple (recorded, not executed)

- Previous Railway source: `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa`;
  deployment ID `3621f603-1c51-4246-824c-55cc0e6b5764`.
- Candidate MKTTool source: `1ade2c4a921507fac9e10c30843b67b5944197dd`; migration
  `20260830030000_add_better_auth_rate_limit` is prepared and locally verified, not applied to
  Railway in this run.
- Relay: immutable v16 archive/EXE hashes above; vulnerable v15 object remains immutable negative
  evidence and is not overwritten.
- Browser: draft run 4 installer `e5623b8a5275ca2ca917caebc9b4baa9640379747da8c9d5ba0fccbe256876cc`
  (145,140,593 bytes), app.asar `579b634d29ff0ddfff74cafcf37a79f2cd1b3646ecb3f56642888bc56458e063`
  (51,723,396 bytes), and normalized payload manifest `517272ad864410c278ef59e3c5ef9955c6ddafd99226259452b2206145d03566`;
  no stable pointer or compatibility
  revocation object exists.
- Engine: Stable `.2` metadata pin above; exact archive absent; `G2-IDENTITY` is FAIL.
- Rollback approver: workspace owner only. The agent must not execute a rollback autonomously.

## Final S4b gate roll-up

| Lane | Result | Reason |
|---|---|---|
| Lane A — Web/Facebook admin-led | `OPEN` | Local controls pass, but live proxy/header, healthcheck, signed deployment, and external smoke remain |
| Lane B — Browser controlled demo | `BLOCKED` | Exact clean-VM/public tuple, immutable installer pointer, and real-environment gates remain |
| Lane C — Browser real-account production | `CLOSED` | `G2-IDENTITY=FAIL` and no CloakBrowser channel; no vendor request or date exists |

No open gate was relabeled as product-ready. The next actionable work is external S5 preparation and
vendor/resource response, not another local release publication attempt.
