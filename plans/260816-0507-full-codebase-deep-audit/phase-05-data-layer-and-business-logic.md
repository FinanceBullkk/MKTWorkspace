# Phase 05 — Data Layer & Business Logic

Depth: **D3** · Priority: P2 · Status: Not started · Effort: 1–2 sessions

## Context

- 16 Aug: `schema.prisma` never opened; rules/queue/schedule never read.
- These areas have the project's strongest existing tests (1484 pass, real Postgres in CI).

## Why D3 and not higher

The failure mode is not compromise — it is **silently wrong answers**. The project's own CI comment
names it: mocking Prisma proves "I called the function I meant to", not "the query filters correctly",
and a rules engine that silently passes is worse than one that errors. That is a correctness audit,
best served by adversarial tracing of each rule's edge cases against real data.

Existing coverage is good here, so the yield per hour is lower than Phases 01–04. Ranked accordingly.

## Scope

**Schema**: `prisma/schema.prisma` 671 lines · 12 migrations (largest: `init_postgres` 262,
`add_auth_users_and_nick_owner` 75, `merge_persona_into_account` 31)

**Rules** (16 files, `src/lib/rules/`): `rules-engine.ts` 200 · `rule-context-queries.ts` 164 ·
`rule-context-builder.ts` 136 · `rule-thread-collision.ts` 102 · `rule-types.ts` 92 ·
`rule-thresholds.ts` 65 · `rule-health-check.ts` 59 · `content-similarity-calculator.ts` 47 ·
`rule-target-eligibility.ts` 37 · `rule-account-health.ts` 37 · `rule-promo-ratio.ts` 36 ·
`rule-content-similarity.ts` 33 · `rule-target-cooldown.ts` 28 · `rule-link-policy.ts` 28 ·
`rule-daily-cap.ts` 27 · `text-normalizer.ts` 23

**Queue** (13 files): `post-job-actions.ts` 154 · `recheck-jobs-batch.ts` 109 ·
`post-job-status-actions.ts` 105 · `manual-post-reminders.ts` 102 · `duplicate-posted-url-check.ts` 97 ·
`interaction-actions.ts` 87 · `post-job-revert.ts` 85 · `posted-url-title-check.ts` 69 · others

**Schedule**: `daily-run-schedule.ts` 128 · `scheduled-job-run-store.ts` 78

**Health**: `health-check-lock.ts` · `daily-health-check-scheduler.ts` · `health-status-evaluator.ts` ·
`discovered-post-matcher.ts` · `health-check-recorder.ts` · `health-check-runner.ts`

## Key insights carried in

- Architecture is right: DB access outside pure evaluators, `RuleContext` + pure evaluator split
  (stated in AGENTS.md, appears to be honoured). Pure evaluators are cheap to test exhaustively.
- The core product invariant — **one nick = one static proxy = one antidetect profile** — must be
  enforced by schema constraints, not only by application code. This is the first thing to check.
- `encrypted-field-registry.ts` declares which columns are encrypted and in which key domain. It must
  agree with `schema.prisma`; drift means a column is silently plaintext or rekeyed with the wrong key.
- Test suite showed expected `healthCheckLock` unique-constraint errors — the lock is contention-tested.
  Good sign; verify the lock's expiry path, not just acquisition.

## Failure hypotheses

**Schema and migrations**
- H73 The 1-nick-1-proxy-1-profile invariant has no unique constraint — enforced only in application
  code, so a concurrent write or a direct SQL fix breaks it silently.
- H74 `encrypted-field-registry.ts` and `schema.prisma` disagree: a column ending `Enc` not in the
  registry, or a registry entry with the wrong key domain. Directly reachable via `vault:rekey`.
- H75 Cascade deletes over-reach — deleting a proxy or owner removes accounts or audit history.
- H76 `AuditLog` rows are deletable or updatable, so the audit trail is not append-only.
- H77 A migration is irreversible with no documented recovery, or `merge_persona_into_account` had a
  data-loss path never rehearsed.
- H78 Hot query paths lack indexes (`rule-context-queries.ts` filters) — a correctness-adjacent
  performance cliff as job volume grows.

**Rules engine — the silent-pass class**
- H79 A rule returns "pass" when its input data is missing, rather than erroring or blocking. Check
  **every** evaluator for this shape; it is the single most dangerous pattern here.
- H80 `rule-context-builder` silently drops a context field, so a downstream rule evaluates on
  `undefined` and passes.
- H81 Timezone boundary: `rule-daily-cap` and `daily-run-schedule` disagree on when a day starts under
  `TEAM_TIMEZONE`, or break across DST.
- H82 `rule-thread-collision` misses a collision on URL-normalization differences (trailing slash,
  query params, `www.`, casing).
- H83 `content-similarity-calculator` trigram/Jaccard threshold passes near-duplicates, or
  `text-normalizer` strips enough to make distinct content collide.
- H84 `rule-promo-ratio` divides by zero or passes on an empty history.
- H85 A rule at a given level is skipped entirely when a prior rule errors (`SkippedRule` exists —
  trace what skipping means for the verdict).

**Queue and scheduling**
- H86 `duplicate-posted-url-check` misses duplicates differing only by normalization (couples to H82).
- H87 `post-job-revert` leaves partial state — job reverted, side effects not.
- H88 Two schedulers double-post the same job (lock scope vs job scope).
- H89 `recheck-jobs-batch` partial failure marks the whole batch done.
- H90 `post-job-override-policy` allows overriding a rule that must never be overridable.

## Method

1. Write H73–H90 before reading.
2. Schema first: read `schema.prisma`, build a constraint table, diff against
   `encrypted-field-registry.ts` and against the stated product invariant.
3. Read all 16 rule files. For each evaluator answer one question in writing: **what does it do when
   its input is missing or malformed?** Tabulate. Any "returns pass" is a finding.
4. Migration review: reversibility and data-loss risk per migration.
5. Trace queue/schedule state machines for partial-failure paths.
6. Where a hypothesis is cheap to prove and the pure evaluator is already isolated, write the test
   (opportunistic D4 — no obligation to reach it across the phase).

## Todo

- [ ] Write H73–H90
- [ ] Schema read + constraint table
- [ ] Registry ↔ schema diff
- [ ] All 16 rule evaluators: missing-input behaviour table
- [ ] 12 migrations: reversibility review
- [ ] Queue/schedule partial-failure trace
- [ ] `plans/reports/audit-{date}-data-and-business-logic.md`

## Success criteria

- Constraint table complete; product invariant either DB-enforced or the gap recorded as a finding.
- Registry ↔ schema drift: zero, or every drift is a finding.
- Missing-input behaviour documented for all 16 evaluators.
- Every migration classified reversible / irreversible-with-recovery / irreversible-unrehearsed.

## Security considerations

Read-only against the schema. No migrations run. Any database work uses the `_test` database only —
`assertIsTestDatabase()` already refuses other names; do not weaken it.

## Risks

- **Volume.** 16 rules + 13 queue files + schema is the largest read in the plan. The missing-input
  table is the highest-yield artifact — if time runs short, finish that and defer the queue trace.
- **Duplicating existing tests.** Coverage is genuinely good here. Check the existing test first; only
  write a new one where the adversarial case is absent.

## Next

Phase 06.
