---
title: "MKTTool + MKTBrowser Internal Product Readiness"
description: "Close the verified Relay, installer, production, security, identity, and operational gates required for a controlled internal release."
status: superseded
priority: P1
branch: "codex/fingerprint-engine-phase0"
releaseBranches:
  mktTool: "ci/self-hosted-runners"
  mktBrowser: "feat/installed-contract-on-clean-runner"
tags: [mkttool, mktbrowser, relay, release-readiness, internal-beta, security]
blockedBy: []
blocks: []
created: "2026-08-29T14:26:52.743Z"
createdBy: "ck:plan"
source: skill
supersededBy:
  - 260830-0830-consolidation-and-lane-a-release
---

# MKTTool + MKTBrowser Internal Product Readiness

> **Executed outcome — 2026-08-30:** `PARTIAL / BLOCKED` at this plan's close. The independent
> verification report ([verification-260830-0430-codex-autonomous-run](../reports/verification-260830-0430-codex-autonomous-run.md))
> confirms the Relay v16 artifact chain and hardened local contracts from the predecessor snapshot.
> Its then-current Browser candidate was unsigned/unpublished and Lane A was undeployed **at that
> snapshot**; the successor later shipped the independent P4a Web path. `G2-IDENTITY` remains `FAIL`
> on the licensed Stable `.2` evidence, and exact-candidate `G3-RECOVERY` remains `OPEN`. This plan's
> remaining work continues in the [Consolidation and Lane A Release plan](../260830-0830-consolidation-and-lane-a-release/plan.md);
> the detailed rows below are retained historical context, not current release status.

## Overview

This is an umbrella closure plan, not a feature expansion. It turns the audit's current
NO-GO into two explicitly gated internal release lanes: MKTTool Web/Facebook and the
MKTBrowser + Relay desktop lane. The Browser lane may be promoted only when the packaged
artifact, real-environment evidence, vendor/license evidence, human operation, and identity
measurement all pass on the same immutable candidate.

### Current baseline (2026-08-29)

| Area | Verified state | Consequence |
|---|---|---|
| MKTTool local quality | 1,922/1,922 tests, coverage floor, typecheck, lint, and build pass | Technical baseline is green; it does not close deployment or Browser gates. |
| MKTBrowser managed quality | 135/135 and 31/31 managed suites pass; packaging 34 pass; one Windows-live test skipped | Packaged/host evidence is incomplete; a skip is not a pass. |
| Published installer 0.3.12 | Embeds Relay archive `cfeefc7f...4364b261`, EXE `eb37eb54...e47b210d1` | Exact restart replay rejects-spent-ticket test fails. Do not distribute or inherit its evidence. |
| Fixed Relay build | `57e14fa` produces a different local v15 EXE/archive and passes a separate restart test | It is not inside the published installer; the test is not artifact-equivalent. |
| Onboarding copy | Hard-coded 0.3.2, overclaims fingerprint isolation, and says TikTok is ready | User-facing release contract is unsafe and must be corrected before pilot. |
| Identity/network/vendor/human | `G2-IDENTITY=FAIL`; network, human input, vendor, second-PC, and canary are open | Real Browser accounts remain prohibited. |
| Production | Railway serves `c819e6a8` from 2026-08-22; current source is `1ade2c4`; Better Auth logs shared-IP warning | Production is not aligned to the candidate. `auth-server.ts` declares no `ipAddress`/`rateLimit`/`storage` options at all, so the service runs Better Auth defaults: an in-memory limiter on one shared bucket. |
| Relay security floor | `RELAY_VERSION = 15`; `MIN_RELAY_VERSION = 13` (not 15) | The floor move is `13 -> 16` and strands v13, v14, and v15. Leaving it at 13 ships the replay fix with no effect, because vulnerable v15 relays keep receiving tickets. |
| Backup/restore | `db:backup:remote` exists; **no restore tooling exists** | `backup-database.ts:80-82` only prints restore hints. P5's restore gate needs a script written first. |
| Dependency security | `prisma@7.9.1 -> @prisma/config@7.9.1 -> deepmerge-ts@7.1.5` is HIGH in audit | Resolve, isolate, or record time-bounded risk acceptance; do not claim “secure” while unresolved. |

Evidence references: [audit report](../reports/audit-260829-1607-internal-product-readiness.md),
[acceptance matrix](../260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md),
[release-stabilization predecessor](../260822-1038-mktbrowser-release-readiness-stabilization/plan.md),
`MKTTool/docs/development-roadmap.md`, `MKTTool/docs/internal-beta-release.md`,
`MKTTool/README.md`, and `MKTBrowser/README.md`. The latest hash-bound evidence supersedes
contradictory historical checkboxes; historical plans are not rewritten by this plan.

This is a multi-repository release, not a claim that the root experiment branch is the product
branch. The final manifest must carry independent immutable tuples for MKTTool (current baseline
`ci/self-hosted-runners@1ade2c4`), MKTBrowser (`feat/installed-contract-on-clean-runner`, candidate
baseline `6d1b0a2` — one docs-only commit behind HEAD `3f37653`; P1 picks one and records why),
Relay source/fix (`57e14fa`, verified as an ancestor of the MKTTool baseline), and the selected
engine. There is no single release branch spanning the repositories; the frontmatter lists each
repository's real branch. A final release tag/commit policy, clean-worktree policy, and signed
handoff must be recorded for each repository before P4 freezes the bundle.

### Scope challenge: HOLD

The minimum safe scope is to close existing blockers and make claims match evidence. Do not
add page-driving tools, unattended posting, CAPTCHA/OTP automation, TikTok or Reddit automation,
multi-profile concurrency, macOS support, an updater, or a custom Chromium engine to this release.
The custom-engine experiments stay in their isolated lab/worktree and cannot be used as a shortcut
around `G2-IDENTITY`. Preserve the existing Web → Relay → local Browser contracts and the invariant:
`1 account = 1 static proxy = 1 managed profile = 1 assigned Relay device`.

### Release lanes and exit rules

| Lane | Can ship when | Must remain blocked when |
|---|---|---|
| A — MKTTool Web/Facebook admin-led internal production | Phase 1 baseline, Phase 5 production/security, Phase 4 signed deployment, allowlist/role + OAuth/token + posting-safety + backup/rate-limit smoke, and owner risk acceptance are complete | auth/role, OAuth/token revocation, backup/restore, deploy provenance, rate-limit, Prisma, or scheduled-job controls are unresolved without written acceptance |
| B — MKTBrowser + Relay technical demo/controlled beta | Exact candidate passes Phases 1–6; one profile/PC, human-only login, synthetic/disposable accounts only, truthful demo banner, and signed owner approval | Any exact-artifact replay, proxy/DNS/WebRTC, vendor lease, recovery, second-PC, or human gate is open; it is never a real-account authorization |
| C — Browser real-account internal production | Lane B plus Phase 7 identity PASS, code-signing/distribution decision, and Phase 8 canary PASS. **Currently unreachable: no in-scope task can turn `G2-IDENTITY` from FAIL to PASS; it depends on a vendor deliverable.** Track with a status and owner, never a date | `G2-IDENTITY` is FAIL/OPEN, vendor evidence is missing, or canary stop conditions fire |

“Product-ready” must always name the lane. A green unit suite alone cannot make the whole stack
product-ready.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [baseline-and-scope](./phase-01-baseline-and-scope.md) | Partial — baseline captured; owner/external signoff open |
| 2 | [relay-artifact-rebuild](./phase-02-relay-artifact-rebuild.md) | Partial — v16 published/read back; floor/compatibility migration open |
| 3 | [browser-installer-and-copy](./phase-03-browser-installer-and-copy.md) | Partial — host draft and truthful copy pass; clean/provenance/publication open |
| 4 | [release-authority-and-ci](./phase-04-release-authority-and-ci.md) | Partial — preflight and refusal controls ready; signed/deployed tuple open |
| 5 | [production-security-hardening](./phase-05-production-security-hardening.md) | Partial — local controls pass; live Railway/proxy/owner gates open |
| 6 | [real-environment-gates](./phase-06-real-environment-gates.md) | Blocked — waits for S4a pin plus vendor/proxy/PC/human resources |
| 7 | [identity-engine-decision](./phase-07-identity-engine-decision.md) | Partial — Stage A no-chance/frozen pin; formal matrix/vendor answer open |
| 8 | [canary-and-promotion](./phase-08-canary-and-promotion.md) | Pending — requires signed candidate and lane-specific S5/S6 evidence |

## Dependencies

### Execution graph

```text
P1 baseline/scope  (also opens vendor identity request + P6 resource booking on day 0)
 ├─> P2 Relay v16 artifact + floor 13->16 ──┐
 └─> P5 production/security hardening ──────┤
        (P4 CI scaffolding may start here)  │
                                            v
                          P3 Browser installer/copy   (needs P2 + P5)
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    v                                               v
        P7a identity EARLY PROBE                      P4 final authority/freeze/deploy
        (installer + 1 host only)                                   │
                    │                                    P5/P4 ─> P8-A Web/Facebook canary
        pin frozen? ─ repin ─> back to P3
                    │ pin final
                    v
              P6 real environment  (expensive: vendor, proxies, 2nd PC, power-cycle)
                    │
              P7b identity DECISION
                    │
        all Browser gates ─> P8-C Browser canary/promotion   [blocked on vendor]
```

P2 and the code-hardening portion of P5 can proceed in parallel after P1. P3 waits for both the
fixed Relay and final MKTTool copy/config so the Browser candidate is not invalidated by a later
server change. P4 may prepare CI scaffolding early, but its phase is not complete until it consumes
P2/P3/P5, freezes/signs the final tuple, and performs the approved deployment.

**P7 is split into two stages and P7a gates P6.** Identity measurement needs only the P3 installer
and one host, while P6 consumes a vendor lease, two disposable proxy pairs, operator time, a
power-cycle host, and a clean second PC — and P7 step 6 invalidates every P6 result whenever the
engine pin changes. Running P6 first would mean burning all of it and re-running after a repin.
So P7a runs right after P3 (parallel with P4) to freeze the pin; P6 starts only once it has; P7b is
the gate of record after P6 removes host/route confounders.

### Delivery sequence and checkpoints

| Window | Workstream | Exit checkpoint |
|---|---|---|
| Day 0–1 | P1 baseline, scope, owners, manifest, evidence redaction; **open vendor request + book P6 resources** | Signed baseline; no candidate bytes changed; both long-lead tracks have owners and SLAs. |
| Day 1–8 | P2 Relay v16 build/publish/restart gate + `MIN_RELAY_VERSION` 13→16 migration | Exact archive/EXE restart replay PASS, immutable `/v16` read-back, signed floor decision, v13/v14/v15 fleet migration proven. |
| Day 1–5 (parallel) | P4 CI scaffolding + P5 production/security hardening | Required checks prepared, restore script written and proven, code/config changes reviewed. |
| Day 8–12 | P3 Browser installer, metadata, copy, clean lifecycle | Draft candidate embeds exact Relay and truthful final copy. |
| Day 12–16 (parallel) | **P7a identity early probe** + P4 final freeze, signature, publication, Railway alignment | Engine pin frozen (or repin → back to P3); one signed tuple published/deployed; old tuple revoked. |
| Day 16–26 | P6 disposable real-environment gates — **only after P7a freezes the pin** | G1/G2-network/G3/G4 PASS on a candidate that will not be rebuilt. |
| Day 26+ | P7b identity decision | Honest `G2-IDENTITY` PASS or FAIL/OPEN. Bounded by the vendor answer, not by team effort. |
| Day 16–23 (Lane A) | P8-A canary, cold-start observation, promotion | Signed Lane A GO, or rollback/NO-GO with next action. |
| **Lane C: no date** | P8-C canary and promotion | Blocked on the vendor identity deliverable (see below). |

**Lane C deliberately carries no schedule estimate.** `G2-IDENTITY` is FAIL on the licensed engine,
the custom Chromium engine is out of scope under HOLD, and Preview `.3` was measured and not
promoted. Therefore no task in Phases 1–8 can change the identity outcome — P7 can only re-measure
what the vendor already ships. Lane C is blocked on a vendor deliverable whose date the team does
not control. It gets a status and an owner (Phase 7 step 0), never a day count. Publishing a
"20–34 day" figure for Lane C would restate the exact overclaim this plan exists to remove.

The P2 window is 5–8 days, not 2–3: it carries fail-closed journal durability (fsync + atomic
rename + power-loss model), the corruption/permission/partial-write matrix, a clean-VM SEA rebuild,
immutable R2 publish and read-back, a signed five-artifact compatibility manifest with revocations,
and fleet migration across three relay versions. P2 is P0 and blocks P3 → P4 → everything.

External vendor, proxy, signing, second-PC, and identity measurement waits can extend this
schedule. They are explicit blockers, not reasons to shorten or relabel a gate. Suggested ownership
is: Release Owner (manifest/promotion), Relay Owner (P2), Desktop Owner (P3), CI/Build Owner (P4),
Web/SRE Owner (P5), Network/Vendor Owners (P6), Identity/Vendor Owner (P7), and Operations Owner
(P8). Replace these role labels with named people in the Phase 1 ledger.

### Cross-plan relationship

This plan consolidates the remaining work from `260822-1038-mktbrowser-release-readiness-stabilization`
and consumes the authoritative acceptance matrix. There is intentionally no plan-level `blockedBy`
relationship: the predecessor contains historical work that is partly complete, while this plan's
phase-level dependencies identify the actual blockers. Do not duplicate or silently reuse its stale
artifact hashes or recovery checkboxes.

### Gate ledger (initial → target)

| Gate | Initial | Target for Lane A | Target for Lane C |
|---|---|---|---|
| G0 source/artifact/provenance | PASS for old technical runs, candidate not frozen | PASS | PASS |
| G0 disposable pairs | BLOCKED (no approved pair set in the audit) | N/A | PASS |
| G1 human input/login | OPEN | Not required for Web-only smoke beyond normal operator control | PASS |
| G2 network (egress/DNS/WebRTC) | OPEN | Web/Facebook server paths verified | PASS on disposable Browser profiles |
| G2 identity | FAIL | Not a Lane A dependency | PASS for the pinned native engine, or Lane C remains blocked. No in-scope lever exists; owned vendor request only (P7 step 0) |
| G3 recovery (matrix reconciliation) | Contradictory: matrix `:64` PASS, `:540` OPEN | N/A | Reconciled in P1 ledger; exact-candidate re-run required regardless |
| G2 concurrency | DEFERRED | One Web operator policy | One profile/seat at a time unless entitlement is proven |
| G3 license/vendor | OPEN | Not used by Lane A | PASS with vendor evidence |
| G3 recovery | Historical PASS, exact published installer FAIL | N/A | PASS on exact candidate, including power-cycle |
| Distribution signing | Unsigned | Internal-only exception may be time-bounded for Lane A/B demo | PASS signature or named expiring exception; no real-account authorization |
| G4 operator/second PC | OPEN | N/A | PASS |
| G5 canary/decision | OPEN | Controlled Web smoke and owner signoff | 7-day canary (plus cold-start check) and owner signoff |

### Evidence and change-control rules

1. Every evidence record binds source SHA, tree/installer/app.asar/EXE/archive SHA, version,
   engine version/SHA, host or disposable-machine label, proxy label/country/ASN, test command,
   timestamp, result, and operator/owner. Never store cookies, OTPs, tickets, proxy URLs or
   credentials, page content, or decrypted vault material.
2. A change to source, artifact bytes, engine, flags, host image, proxy, firewall, schema, or
   test order invalidates downstream evidence. Re-run from the first affected gate.
3. “Skipped”, “not observed”, and “local-only” remain OPEN; host-machine PASS is not clean-VM PASS.
4. Keep the failing v15 installer quarantined/revoked and retain its hashes only as negative evidence.
   Never overwrite an immutable Relay object with different bytes.

### Definition of done

- Lane-specific release manifest and signed/owner-approved gate ledger are complete.
- Relay and Browser installer are built once, hash-verified end to end, and reproducible from the
  frozen source; the exact extracted Relay rejects a spent ticket after restart.
- Production runs the same approved MKTTool source/manifest, has tested backup/restore, explicit
  trusted-proxy rate limiting, one-seat enforcement, health checks, and a rollback runbook.
- Browser claims, versions, hashes, engine/license labels, and allowed operations match reality.
- Required real-environment gates and identity evidence are either PASS or explicitly keep the
  Browser lane blocked; no open gate is relabeled as product-ready.
- Canary metrics remain within threshold for the full observation window and an owner signs the
  lane-specific GO decision.

### Remaining owner / external inputs

The authority record in `decisions.md` settles the engineering questions: Browser join key
`3f37653`, Relay v16 and the single `13 -> 16` decision, DB-backed rate limiting, the locked
`deepmerge-ts` override, Browser `0.3.13`, Node 22, the identity thresholds, and conditional R2/
Railway authorization. They must not be re-asked. The following items remain genuinely external or
owner-only:

1. Name the CloakBrowser vendor identity contact/channel and SLA; until a written answer and exact
   licensed archive exist, `G2-IDENTITY` remains FAIL/OPEN and Lane C has no date.
2. Supply/authorize the vendor test entitlement, two disposable static proxy/profile pairs, a real
   power-cycle host, and a clean second Windows PC/VM owner for S5.
3. Name Lane A/B pilot operators, on-call, and canary observation dates after S4a/S4b; the workspace
   owner remains the sole rollback approver.
4. Supply signing/compatibility-manifest custody or keep the documented Lane A/B unsigned exception;
   Lane C cannot use the exception.
5. Confirm the Railway trusted proxy header/CIDR from the live chain and complete remote backup,
   healthcheck, provenance, route-first `/v16`, and fleet migration receipts before any deployment or
   floor change.
