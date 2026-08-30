---
title: "Consolidation and Lane A Release"
description: "Land 105 uncommitted files, enforce the new safety contracts in CI, ship Lane A to production, move the Relay floor safely, and record Lane C as closed with its reason."
status: partial
priority: P1
# Orchestration records are maintained from the workspace branch; release work landed on the
# repository-specific branches below and was merged to MKTTool master under Q13. This is the
# workspace-plan branch, not a release-source branch.
branch: "codex/fingerprint-engine-phase0"
releaseBranches:
  mktTool: "release/consolidation-20260830"
  mktBrowser: "release/consolidation-20260830"
tags: [mkttool, mktbrowser, relay, ci, lane-a, engine-decision]
blockedBy: []
blocks: []
created: "2026-08-30T01:30:00.000Z"
createdBy: "orchestrator"
source: manual
---

# Consolidation and Lane A Release

## Overview

The 2026-08-30 autonomous run produced real, verified work and then stopped at genuine external
boundaries. This plan turns that work into something durable: committed, enforced by CI, shipped for
Lane A, and no longer hostage to a single vendor answer. It is a consolidation plan, not new
features.

## Current execution truth — 30 August 2026, post-deploy reconciliation

- **U1 complete.** MKTTool branch `release/consolidation-20260830` is pushed at
  `e6a55ee` after the source/docs follow-up; PR #42 is merged to `master` at
  `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`. The only MKTTool dirt is the protected `AGENTS.md`
  and `AGENTS.md.bak-260828`. MKTBrowser is pushed at `7c9b7cf` after its documentation follow-up;
  the accepted provenance source remains `5ef710dd`.
  The three Q14 files are in the dedicated commit `1decde437cf6495652b9d7bdbb76290ab2130411`.
- **U2 MKTTool gates complete; Browser CI remains qualified OPEN.** PR #42 run
  `33296599912` and final post-merge master run `33297347911` are successful for their required jobs;
  earlier branch/master runs `33292005382` and `33292350436` remain historical evidence;
  the earlier `33291209847` is retained only as failure evidence. The MKTBrowser push run
  `33291356306` failed before quality tests because the self-hosted Windows PowerShell shell could
  not resolve `node` after setup; its package jobs were skipped. This is a Browser/P4b runner gate,
  not evidence against the independent P4a web deployment.
- **U3 open.** Normalized payloads are byte-identical, but the outer installer has a measured
  103-byte NSIS/resource-order/trailer variance. No normalization or promotion is claimed.
- **U4 split and P4a qualified.** PR #42 merged to `master` at
  `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432` after the fresh current-DB backup/restore and recorded
  rollback tuple. Final Railway deployment `ed972e5b-7597-4c6d-8066-24bc11c4ea0b` succeeded;
  `/api/healthz` returned 200, the authorized full `/v16` GET matched the immutable SHA, the
  shared-IP warning was absent in the final log query, and `healthcheckPath=/api/healthz` is set.
  P4a still has the bounded credentialed smoke and rollback rehearsal OPEN. P4b is the Browser
  five-artifact tuple and remains OPEN because the Stable `.2` engine archive is absent; it does not
  gate P4a.
- **U5 remains route-first.** `MIN_RELAY_VERSION` stays 13 after the post-deploy full GET/hash and
  aggregate inventory. The two owner-machine self-serve reinstalls cannot be observed from this
  host, so no floor or revocation mutation is claimed.
- **U6 complete.** The custom-engine track and Lane C are CLOSED: there is no CloakBrowser channel,
  no vendor request, no date, and no “coming soon” promise. `G2-IDENTITY` remains FAIL.

### What the run left behind at plan start (historical baseline)

| Fact | Consequence |
|---|---|
| **105 files uncommitted** (79 MKTTool, 26 MKTBrowser) | Entire night's work is one crash from gone, and a dirty tree blocks the provenance attestation. Highest-urgency item in this plan. |
| New contracts exist only as scripts | `db:restore:verify`, rate-limit concurrency, one-seat, version coherence, payload reproducibility, trusted-proxy, secret scan — U2 wires them into required or explicitly OPEN-reporting jobs. |
| MKTTool CI runs lint/typecheck/test/coverage/build + `relay:build`/`relay:verify` | The original baseline was extended; branch and master required MKTTool jobs are green. |
| Relay v16 published, read-back verified; floor still 13 | Post-deploy authorized full GET of `/api/relay/download/v16` is HTTP 200 and hash-exact; the floor remains 13 until both owner machines provide observed v16 health responses. |
| Installer `e5623b8a…76cc` built, unsigned, unattested | Normalized payload is deterministic (`517272ad…`); the controlled outer NSIS pair differs by **103 bytes** (the historical 78-byte source-drift figure is superseded) → full reproducibility OPEN. |
| `G2-IDENTITY=FAIL` on licensed Stable `.2` | fonts `08050B16`, audio `0B09CAEB`, WebGL `BF16CA5C` collide across profiles. Lane C cannot ship on this engine. |
| **Custom engine track CLOSED** (owner decision, 2026-08-30) | Preflight measured **2.935 GiB available RAM** against a >12 GiB gate on a 15.924 GiB machine; `D:` was fine at 234.8 GiB. A reboot/isolation attempt reached 8.231 GiB, still below the gate. Owner closed the build path; with no CloakBrowser channel, Lane C is closed for this product shape. |
| 2 active v15 devices on the owner's machines | Self-serve 0.3.13 reinstall is the path; no notification channel is needed. Database inventory cannot prove installed binary versions. |

Evidence: the pre-Q14/pre-P4a [verification snapshot](../reports/verification-260830-0430-codex-autonomous-run.md)
is historical. Current P4a evidence is in `reports/lane-a-deploy.md` and
`reports/p4a-postdeploy-evidence.json`; the [predecessor plan](../260829-2125-internal-product-readiness/plan.md)
and [engine plan](../260828-0428-chromium-fingerprint-engine/plan.md) retain historical context.

### Lane C, stated plainly

`G2-IDENTITY` fails on the licensed engine: fonts `08050B16`, audio `0B09CAEB`, WebGL `BF16CA5C` all
collide across profiles.

**Resolved 2026-08-30: no lever exists.** The owner closed the custom-engine track, and there is
no channel to CloakBrowser. **Lane C is closed for this product shape** — a conclusion, not a pending
item. MKTBrowser is a Lane A/B tool that does not claim identity isolation, which the shipped UI copy
already states honestly. The alternative-vendor shortlist is the only future path and is a separate
product decision, out of scope here.

### Scope: HOLD

No new product features. No TikTok/Reddit automation, no CAPTCHA/OTP/credential automation, no
page-driving tools, no macOS, no updater, no multi-profile concurrency. The invariant stands:
`1 account = 1 static proxy = 1 managed profile = 1 assigned Relay device`. Lane C is closed; any
future reopening requires an engine that passes `G2-IDENTITY` under external measurement.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [land-the-work](./phase-01-land-the-work.md) | **Complete** — source commits landed; protected owner files preserved |
| 2 | [enforce-contracts-in-ci](./phase-02-enforce-contracts-in-ci.md) | **Partial** — MKTTool required run green; Browser Windows runner failure remains OPEN and package jobs were skipped |
| 3 | [deterministic-packaging](./phase-03-deterministic-packaging.md) | **Open** — normalized payload PASS; outer NSIS variance remains |
| 4 | [ship-lane-a](./phase-04-ship-lane-a.md) | **Partial / P4a qualified** — deployment and route pass; rollback rehearsal and credentialed smoke OPEN; P4b separate OPEN |
| 5 | [fleet-migration-and-floor](./phase-05-fleet-migration-and-floor.md) | **Partial** — route/inventory/self-serve path recorded; physical device observation and floor mutation OPEN |
| 6 | [engine-path-closure-and-vendor-decision](./phase-06-engine-decision-gate.md) | **Complete** — custom engine and Lane C closed |
| 7 | [docs-and-handoff](./phase-07-docs-and-handoff.md) | **Complete** — source docs, predecessor qualifiers, runbooks, and final evidence reconciled |

## Dependencies

```text
P1 land the work  (urgent — everything waits on clean trees)
 ├─> P2 enforce contracts in CI ────┐
 ├─> P3 deterministic packaging ────┤
 └─> P4 ship Lane A ────────────────┤
          │                          │
          └─> P5 fleet + floor bump ─┤
                                     └─> P7 docs and handoff

P6 engine closure + vendor decision — independent, runs in parallel from day 0
```

At plan start, P1 blocked attestation while 105 files were uncommitted; that start-state condition is
now resolved. P2 and P3 are independent of each other. P4 needs P1; P3 improves P4's evidence but
does not gate it if the residual variance is documented. P5 needs P4's deploy so the `/v16` route is
live before the floor moves. P6 needs no machine resources at all now that the build track is closed.
Lane C has no vendor clock: there is no CloakBrowser channel. Any future alternative-vendor
evaluation is a separately funded, separately owned product decision and stays off this release's
critical path.

### Delivery sequence

| Window | Work | Exit |
|---|---|---|
| Hour 0–2 (planned; executed) | P1 land the work | Owned run-work landed on branches; protected MKTTool AGENTS files untouched; Q14 Browser files later landed in their dedicated commit |
| Day 1–3 (planned; executed/partial) | P2 CI enforcement (parallel with P3) | MKTTool required contracts green; unavailable Browser runner remains OPEN/FAIL rather than satisfying promotion |
| Day 1–2 (planned; residual) | P3 packaging determinism | 103-byte controlled NSIS delta remains OPEN; no unsupported normalization |
| Day 2–3 (planned; executed P4a) | P4 ship Lane A | Committed MKTTool web candidate deployed; `/api/healthz` 200; `/v16` reachable (no Browser tuple required) |
| Day 3–4 (planned; residual) | P5 fleet migration and floor `13→16` | Route verified live; floor remains 13 pending observed owner-machine reinstalls |
| Day 0–1 (planned; executed) | P6 engine closure + Lane C closure | Build track and Lane C formally closed with reasons; alternative vendors are future scope |
| Day 5 (planned; reconciliation) | P7 docs and handoff | `docs/` reflects reality; source-doc delivery and residual gate review are recorded |

## Definition of done and residual release gates

- Zero uncommitted run-work; protected MKTTool `AGENTS.md` files remain untouched, while the three
  Q14 Browser files are committed separately with the owner's explicit attribution decision.
- Every safety contract built on 2026-08-30 is enforced automatically and fails the build when
  violated; a skipped check reports `OPEN` and cannot satisfy a required gate.
- Lane A P4a runs the committed candidate in production with a verified health signal and live `/v16`
  route. A bounded credentialed smoke and disposable rollback rehearsal remain required before a
  final Lane A GO; neither is inferred from the deployment pass.
- The Relay security floor remains `13` until the route-first evidence is followed by observed
  self-serve reinstalls on both owner machines and the complete version probe/revocation procedure.
- The custom-engine track and Lane C are both formally closed with written reasons and a reopening
  condition; alternative vendors are ranked as a future option, not as a pending item.
- `docs/` describes the system as it actually is, including what remains unproven.

### Current residual gates (not relabelled)

- **P2 Browser CI:** latest run `33296202751` failed at the self-hosted Windows Node invocation;
  package jobs were skipped (the earlier `33291356306` failure is retained as historical evidence).
  Fix/re-run the runner contract before claiming Browser CI green.
- **P3:** full installer reproducibility is OPEN on the measured NSIS RT_DIALOG/order/trailer delta.
- **P4a:** credentialed Lane A smoke and disposable rollback rehearsal are OPEN; P4b's five-artifact
  Browser tuple is independently OPEN because the exact Stable `.2` archive is absent.
- **P5:** both owner machines must self-serve reinstall and report v16 before changing the floor;
  no device or owner identifiers are stored in evidence.
- **P6/Lane C:** CLOSED. There is no CloakBrowser channel, so no request, date, or waiting state exists.

## Owner decisions

1. ~~Push/merge approval~~ — **ANSWERED 2026-08-30: approved and executed.** Merge to master with CI green.
   Merging is deploying (`ci.yml:235`); preconditions in `decisions.md` Q13.
2. ~~Disposition of the three dirty MKTBrowser files~~ — **ANSWERED 2026-08-30: committed in one
   dedicated safety commit** `1decde437cf6495652b9d7bdbb76290ab2130411`, after the analysis report in
   `reports/user-dirty-files-analysis.md`. See `decisions.md` Q14.
3. ~~v15 device ownership~~ — **ANSWERED: both are the owner's own machines.** No notification
   channel needed; self-serve reinstall. Route-first still applies in full.
4. ~~Vendor deadline~~ — **ANSWERED: there is no channel to CloakBrowser. Lane C is CLOSED**, not
   pending. See `decisions.md` Q16.
5. ~~Reboot timing~~ — **answered** (2026-08-30): authorized after P1 lands. Work stays on this
   machine; a VM is acceptable where a second machine is needed, but **never concurrently with the
   P6 build gate** — 15.9 GB total cannot serve both a VM and a >12 GB build.
