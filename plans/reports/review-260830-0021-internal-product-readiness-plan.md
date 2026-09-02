# Review — Internal Product Readiness Plan (Codex)

**Target:** `plans/260829-2125-internal-product-readiness/` (plan.md + 8 phases, 1,667 lines)
**Reviewer:** Claude (inline, no subagents)
**Date:** 2026-08-30
**Verdict:** **APPROVE WITH FIXES** — structurally sound, evidence-honest. 2 blockers + 3 correctness
errors + 3 gaps to fix before `/ck:cook`. Do not start P6/P7 as currently ordered.

> **Historical review — superseded by the 30 August consolidation decisions.** This review is retained
> as rationale only. Q13–Q17 are now answered, P4a is deployed independently of the Browser tuple,
> U3 records a 103-byte residual, and Lane C is CLOSED because no CloakBrowser channel exists. Do not
> execute its old vendor/push/build recommendations.

> **STATUS 2026-08-30: all findings below applied to the plan.** B0 (P7 split into Stage A/B, deps
> `[1,3]`, Stage A gates P6), B1 (vendor step 0 moved to P1 day 0, Lane C date removed), C1 (guard
> path), C2 (floor 13→16 across steps 9/11, P2-10/11/14, risks), C3 (branch frontmatter), G1 (restore
> script as Create), G2 (new `api/healthz`, `health/run` marked do-not-repurpose), G3 (baseline
> decision), P2 effort 2–3 → 5–8 days, plan.md graph/timeline redrawn, P4 step 5 de-duplicated,
> acceptance-matrix G3-RECOVERY reconciliation added to P1. `ck plan validate --strict`: 0 errors,
> 0 warnings. Deliberately **not** applied: phase-template sections (Context Links / Key Insights /
> Todo List / Next Steps) and the ≤80-line plan.md guidance — cosmetic, and trimming plan.md would
> cost substance.

---

## 1. What I verified against the repos (not just read)

| Check | Result |
|---|---|
| 54 cited file paths | 51 exist. 2 misses intentional (`api/healthz` = Create, `railway.json` = documented absent). 1 real error (see B1). |
| npm/yarn scripts cited | ALL exist: `relay:build`, `relay:verify`, `relay:publish`, `release:manifest:sign`, `release:compatibility:publish`, `release:ceremony:verify`, `db:backup:remote`, `test:installer`, `verify:node`, `package:windows-installer`. |
| `57e14fa` (relay fix) | Exists, ancestor of MKTTool HEAD `1ade2c4`. Subject: "fix(relay): keep spent tickets across a restart". ✓ |
| `c819e6a8` (Railway) | Exists. ✓ |
| `relay-release.json` v15 | `sha256=cfeefc7f…4364b261`, `sizeBytes=34285450` — matches plan claim exactly. ✓ |
| Engine pin | `151.0.7922.108.2`, sha `7b16ae30…89561`, licensed-channel — matches. ✓ |
| Version drift | Browser root `0.3.2`, desktop `0.3.12`, MKTTool `0.1.0`. Drift is real. ✓ |
| Better Auth API | `advanced.ipAddress.ipAddressHeaders` AND `advanced.ipAddress.trustedProxies` both exist in installed build (`dist/api/rate-limiter/index.mjs:284` emits the exact shared-bucket warning). P5's remedy is implementable as written. ✓ |
| Current auth config | `auth-server.ts` has **zero** `ipAddress`/`rateLimit`/`storage` config → defaults → memory limiter + shared bucket. P5 diagnosis correct. ✓ |
| Audit numbers | 1,922 tests / 34 packaging + 1 skipped live / 0.3.2-vs-0.3.12 all match `audit-260829-1607`. ✓ |

Plan quality is high: build-once/verify-once, hash-bound evidence, lane separation, "skipped ≠ pass",
and refusal to let a local score close G2 are all correct instincts. The problems below are
sequencing and precision, not direction.

---

## 2. Blockers (fix before executing)

### B0 — P7 identity is gated behind the most expensive phase (P6). Wrong order.

`phase-07` frontmatter: `dependencies: [1, 3, 6]`. So identity measurement runs only after P6's
5–10 days of vendor entitlement, two disposable proxy pairs, human operator, power-cycle host, and a
clean second PC. But `phase-07` step 6 states that an engine repin **invalidates P3, P4, P5-deploy,
and P6** and forces a new signed tuple. Combined with `G2-IDENTITY=FAIL` today, the expected path is:
spend all of P6 → measure → repin or fail → re-run all of P6.

**Fix:** split P7 into `P7a` (cheap) and `P7b` (decision). P7a needs only the P3 installer + 2–3
disposable profiles on one host — no vendor lease, no second PC, no power-cycle. Run P7a immediately
after P3, in parallel with P4. Only enter P6 once the engine pin is known-final. Keep P7b (vendor
confirmation, threshold signoff, promotion) where it is.

### B1 — Lane C has no remediation lever inside this plan's scope.

`G2-IDENTITY` is FAIL on the licensed engine. The HOLD scope forbids the custom Chromium engine.
Preview `.3` was a partial improvement and explicitly not promoted. So nothing in Phases 1–8 can
*change* the identity outcome — P7 can only re-measure what the vendor already ships. The delivery
table nevertheless estimates "Lane C ~20–34+ days", which reads as achievable.

**Fix:** either (a) add an explicit vendor-engagement task to P7 with owner, ask, and SLA (request a
build that isolates fonts/audio/WebGL per profile), or (b) relabel Lane C as **blocked pending
vendor deliverable — no date**. Do not leave a day estimate on a gate with no in-scope lever.

---

## 3. Correctness errors (small, must fix)

### C1 — Wrong path: `MKTTool/relay/src/ticket-replay-guard.ts` does not exist.

Two different things share the name:
- server-side: `MKTTool/src/lib/tickets/ticket-replay-guard.ts` (exists)
- relay-side: `buildReplayGuard()` at `MKTTool/relay/src/relay-identity.ts:54`, backed by
  `MKTTool/relay/src/spent-ticket-journal.ts`

P2's Related Code Files table points at a non-existent relay-side file. The Function/Interface
Checklist correctly names `buildReplayGuard(home)` — so it's the table that is wrong. Fix it, or a
`/ck:cook` run will edit the server guard while believing it is hardening the relay journal.

### C2 — `MIN_RELAY_VERSION` is **13**, not 15.

`MKTTool/src/lib/tickets/ticket-types.ts:54` → `MIN_RELAY_VERSION = 13`.
`relay-endpoints.ts:264` → `RELAY_VERSION = 15`.

P2 frames the floor move entirely as "reject v15". Two consequences the plan misses:

1. Raising 13 → 16 strands **v13 and v14** devices too, not only v15. P2 step 9's fleet inventory
   must enumerate 13/14/15, and P2-10's probe matrix must cover all three.
2. If the floor stays at 13 — the safe-looking option — the replay fix **never becomes mandatory**.
   Vulnerable v15 relays keep being issued tickets. The security value of P2 lives entirely in the
   floor bump, so the bump is not optional and needs its own go/no-go, not a footnote.

Name the exact transition (`13 → 16`) and the full stranded set in P2 steps 9/11 and P2-10/P2-11.

### C3 — `branch: multi-repo-release-candidate` does not exist.

Checked root, MKTTool, MKTBrowser (local + remote): no such branch. Real branches today are
MKTTool `ci/self-hosted-runners`, MKTBrowser `feat/installed-contract-on-clean-runner`, root
`codex/fingerprint-engine-phase0`. Either create it as a P1 step or record the three real branches —
P1's whole point is that the join key is accurate.

---

## 4. Gaps

### G1 — No restore tooling exists, but P5-02 requires a proven restore.

`db:backup:remote` exists (`scripts/backup-database.ts`, plain SQL dump). There is **no restore
script** — only printed hints at `backup-database.ts:80-82` (`createdb mkttool_restore_test` +
`psql -f`). P5's Related Code Files lists `database-backup.ts` as "Run/test" but never lists a
restore path as "Create". Add either a `db:restore:verify` script or the literal psql commands +
row-count/checksum comparison method to the P5 runbook. As written, P5-02 is a checkbox with no tool
behind it.

### G2 — Liveness endpoint collides conceptually with an existing route.

`MKTTool/src/app/api/health/run/route.ts` already exists: an authenticated (`guardedRoute`),
same-origin-guarded, `maxDuration = 120` per-account probe that opens a browser. P5 says "create
`api/healthz/route.ts` **or an approved existing route**" — that "or" is dangerous. Railway's
`healthcheckPath` must hit an unauthenticated, sub-second liveness route. Delete the "or existing
route" option and state explicitly that the new route must not inherit `guardedRoute`.

### G3 — MKTBrowser baseline `6d1b0a2` is one commit behind HEAD `3f37653`.

`6d1b0a2` is an ancestor of HEAD; the only commit after it is `3f37653 docs(release): record internal
beta candidate` (docs-only). Harmless either way, but this is the manifest join key — P1 must pick
one explicitly rather than inheriting the audit's number.

---

## 5. Estimate risk

**P2 is under-scoped at "2–3 days".** It contains: fail-closed journal durability (fsync + atomic
rename + power-loss model), a corruption/permission/partial-write matrix, clean-VM SEA rebuild,
immutable R2 publish + read-back, a signed five-artifact compatibility manifest with revocations,
fleet inventory across three relay versions, and update/rollback migration tests. Realistically
**5–8 days**. P2 is P0 and blocks P3 → P4 → everything; a 3-day figure here understates the whole
critical path.

---

## 6. Consistency notes (non-blocking)

- **Acceptance matrix contradicts itself on `G3-RECOVERY`:** line 64 says `PASS`, line 540 says
  `remains OPEN` on real power-cycle/licence-key. Codex's ledger ("historical PASS, exact published
  installer FAIL") takes the safe reading — good. But P1 should reconcile the matrix explicitly so
  nobody later cites line 64 as closure.
- **plan.md ASCII graph vs frontmatter:** the graph draws P3 hanging off P1, while `phase-03`
  declares `dependencies: [1, 2, 5]` and the prose says P3 waits for both. Redraw the graph.
- **Template deviation:** phase files omit Context Links / Key Insights / Todo List / Next Steps from
  the documented phase template; Success Criteria checkboxes substitute for Todo List. plan.md is 191
  lines against the ≤80-line overview guidance. Cosmetic.
- **P4 step 5 redundancy:** `yarn test:installer` already runs W02/MKB01/MKB01E/MKB02/MKB03/packaging;
  listing them again as separate items invites double execution.

---

## 7. Recommended answers to the 7 open questions

1. **Relay v16 — yes.** v15 exists in R2 with different bytes; overwrite is forbidden. Additionally
   decide the floor move `13 → 16` as its own gate (see C2).
2. **Browser 0.3.13 — yes**, payload and Relay both change. On signing: take the time-bounded
   unsigned exception for Lane A/B demo; make Authenticode a hard prerequisite for Lane C. Signing is
   not on the Lane C critical path today — identity is.
3. **Rate limit:** memory is defensible only for a single-replica Lane A pilot with a named expiry.
   Since P5 already touches Prisma/migrations, DB-backed storage is the cheaper long-run choice —
   decide once here rather than migrating mid-canary.
4. **deepmerge-ts:** try the locked npm override to `>=8` first (P5 step 7 already scopes the test
   set). If it breaks the Prisma CLI, take the expiring risk acceptance — the call path is
   developer-controlled config parsing, not request JSON. Do not claim "secure" while open.
5. **External resources:** this is the true schedule risk. Get the vendor test entitlement started in
   P1, not P6 — it has the longest lead time and it also gates the B1 vendor conversation.
6. **G2-IDENTITY thresholds:** approve them **before** P7a runs (P7 step 2 already says this). Only
   the licensed native engine may be measured; the custom-engine lab stays out.
7. **Canary roster:** cannot be answered from the repo — owner decision. Fix the dates only after
   P7a returns, since a repin restarts the window.

---

## Unresolved questions

1. Is there any open vendor channel to CloakBrowser for an identity fix, or is Lane C effectively
   dead until a new vendor release ships on its own schedule? This determines whether B1 gets a task
   or a "no date" label.
2. Should MIN_RELAY_VERSION go 13 → 16 in this release, or 13 → 15 first as a staged migration? The
   plan assumes a single jump without arguing it.
3. Is the self-hosted runner / PR #39 path recoverable (P4 step 1), or is the local disposable VM the
   permanent authoritative gate? P4 leaves this as an either/or with no owner.
