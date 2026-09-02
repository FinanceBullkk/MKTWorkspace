# Handoff U4 — P4a Lane A web release
Date: 2026-08-30T11:15:00+07:00 | Phase: 4 | Status: PARTIAL (P4a QUALIFIED; residual gates OPEN)

## Done

- MKTTool PR #42 required checks (`33296599912`) passed, then the approved merge reached `master`
  at `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`; final master CI/deploy-verification run
  `33297347911` passed. Railway deployment `ed972e5b-7597-4c6d-8066-24bc11c4ea0b` is `SUCCESS`
  with the matching commit and one running instance. Earlier PR #40/`8e1123a3…` and docs
  deployment `c4ac6781…` remain historical receipts.
- Fresh current-database backup/restore passed before merge: dump
  `MKTTool/data/backups/mkttool-prod-20260830-101918.sql`, 64,270 bytes, SHA-256
  `40ba103453a764db5ecd4288bba7a8537fa911832e9216c56303a31e9ef1694f`; restore aggregate 100/100,
  mismatches 0, cleanup PASS (receipt SHA-256
  `b5f652ec178d037f3c3353769d79926cd42327b33375a6c7f278e850d5955804`).
- Rollback tuple recorded before merge: prior deployment
  `3621f603-1c51-4246-824c-55cc0e6b5764`, prior commit
  `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa`, migration action `npx prisma migrate deploy`, and
  candidate merge SHA above. The applied schema state is recorded; no rollback was executed.
- External `/api/healthz` on the final deployment returned HTTP 200 (166 bytes, SHA-256
  `7fac32dc21433db23cb4995006a08a7d054831530bbcab436ad15bd022dbf224`) with readiness/database/
  release/R2 checks and `relayVersion: 16`. An authorized **full GET** of
  `/api/relay/download/v16` returned 33,342,752 bytes and SHA-256
  `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` (exact immutable match).
- `TRUSTED_PROXY_IP_HEADERS=x-real-ip` is configured. The bounded synthetic/header-labelled burst
  produced separate labelled outcomes and no shared-IP warning in fresh logs; all requests came from
  one test host, so this is not two physical-network proof. Prisma rate-limit unique-key diagnostics
  during the burst are recorded separately, not hidden as proxy warnings.
- Railway service-instance `healthcheckPath=/api/healthz` is verified. The deployment manifest's
  historical null field is not used as the source of truth.

## Evidence written

- `../reports/p4a-postdeploy-evidence.json` — sanitized CI/deployment/health/route/proxy/healthcheck
  evidence.
- `../reports/lane-a-deploy.md` — P4a/P4b split, rollback tuple, backup/restore, and gate ledger.
- `../reports/fleet-inventory-postdeploy.json` — aggregate-only post-deploy inventory.

## NOT done / deliberately skipped

- P4-08 bounded credentialed Lane A smoke remains OPEN; no GO claim is made from synthetic or
  read-only evidence. P4-09 is now complete as a disposable rehearsal in
  `../reports/rollback-drill-p4-09.md`; it did not execute a production rollback.
- The rehearsal found the prior source returns 404 for `/api/healthz` while the live service
  healthcheck targets that path. A prior-compatible healthcheck choice is an owner prerequisite
  before any real rollback.
- P4b Browser five-artifact tuple remains OPEN because the exact Stable `.2` engine archive is absent.
  It never gates P4a, and no tuple was fabricated.
- No floor bump or v15 revocation was made; U5 requires observed self-serve reinstall responses from
  both owner machines. Lane C is CLOSED because no CloakBrowser channel exists.

## State the next session must know

- MKTTool release branch is `release/consolidation-20260830` at `e6a55ee`; `master` is merged at
  `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`. Protected MKTTool files remain outside commits.
- MKTBrowser branch head is `4b9564a` after documentation follow-ups; provenance receipt source is
  `5ef710dd931028d4d608bea098311bf54bf5dc31`, with P4b tuple still open.

## Decisions still owed by the owner

- None. Q13, Q14, Q15, Q16, and Q17 are answered. Any actual rollback remains human-approved;
  the healthcheck prerequisite is recorded, not silently waived.

## Next unit

U5 — fleet migration evidence is recorded; keep `MIN_RELAY_VERSION=13` until both owner machines
provide observed v16 health responses, then continue U3 and U7.
