# Phase 05 — Data Layer & Business Logic

Depth D3 (opportunistic D4 on one hypothesis). 17 August 2026. Read-only against source; no
migrations run, no database touched. One temporary probe test written, run, deleted — `git status`
clean, confirmed.

## 1. Handoff Audit reconciliation — done first, before any code was read

The register's Handoff Audit table exists because two of four cross-phase handoffs were dropped.
Phase 05 opens by reconciling against it, as the register instructs.

**Inbound to Phase 05: nothing.** Swept every phase file and every report under `plans/reports/`
for handoff language (`handed to`, `deferred to`, `carried to`, `for phase 0X`, `unowned`,
`next phase`). Every hit resolves to Phase 02, 03, or 04:

| Source | Assigned to | In register? |
| --- | --- | --- |
| `audit-260816-0803` — driver half of F2 | Phase 02 | yes, F2 Fixed |
| `audit-260816-0928:293` — "Observation, unowned: `handle-configure.ts:94`" | Phase 02 | yes, recovered as C26 |
| `audit-260816-1015:158` — C2/C3 | Phase 04 | yes, C3 Fixed / C2 Open |
| `audit-260816-1453:115` — H54 clean-machine withdrawal | Phase 04 | yes, human gate |
| `audit-260816-1344:94` — first-run flakiness evidence | Phase 03 | yes, C10 fixed |
| `phase-04:135` — "Phase 05 unrelated risk area, can run in parallel" | — | scheduling note, not a handoff |

So the table is complete as written and Phase 05 inherits no unregistered debt. The check cost ~5
minutes; the two dropped handoffs cost days. Keep it as the phase-opening ritual.

**Outbound from Phase 05: one, registered at the moment of handoff** (see §8), not when Phase 06
remembers it.

## 2. Hypotheses

H73–H90 were written on 16 Aug, before any of this code was read, and are **unchanged** — no
revision after reading, per the plan rule. Disposition table in §7.

## 3. Findings

Ranked by reachability, not by how alarming the shape looks. Four findings, all P3. No P0/P1/P2.

### C27 (P3) — thread-collision keys miss two live Reddit link formats

`normalizeThreadUrl` (`src/lib/rules/rule-thread-collision.ts:102`) canonicalises a Reddit thread
only when the URL contains `/comments/<id>`. Two formats an operator actually pastes do not:

Proven against the real function (temporary probe, `npx vitest run`, since deleted):

```
canonical  https://www.reddit.com/r/Trove/comments/1veg99o/is_trove_still_alive/  → reddit:1veg99o
shortlink  https://redd.it/1veg99o                                               → redd.it/1veg99o
share      https://www.reddit.com/r/Trove/s/AbCdEfGh12                           → reddit.com/r/trove/s/abcdefgh12
mobile     https://m.reddit.com/r/Trove/comments/1veg99o/                        → reddit:1veg99o   (ok)
```

Three different keys for one thread. Impact runs through four modules that all key on this function:

- **Rule 8, thread collision** (`rules-engine.ts:96`) — the one rule marked `overridable: false`,
  the one the codebase calls the clearest coordination signal a platform can catch. Nick A records a
  `/comments/` link, nick B pastes the `redd.it` link for the same thread: no collision found, ALLOW.
  The `sameTargetNeighbors` WARN branch only backstops within `threadCollisionWarnHours` = 1 hour.
- **`duplicate-posted-url-check.ts:55`** — the paste-the-wrong-link detector misses the case where
  the two jobs used different link formats. This is H86's predicted coupling, confirmed.
- **`health-check-recorder.ts:76,111`** — visible-vs-expected post matching splits one real post
  into two keys, inflating the denominator.
- **`post-job-revert.ts:49`** — the auto-post trace is looked up by key, so reverting a job whose
  `postedUrl` was a short link leaves the Interaction behind: rule 8 then remembers a touch that no
  longer exists, and blocks with no override path.

The two halves need different remedies, and conflating them would prescribe something the code
cannot do:

- `redd.it/<id>` is **locally fixable** — the id is right there in the path; extend the regex.
- `/r/<sub>/s/<opaque>` is **not locally resolvable** — the id is opaque and only an HTTP redirect
  resolves it. The honest fix is rejection at input time in the interaction form, telling the
  operator to open the link and paste the full permalink. That half is a UI change → handed to
  Phase 06 (§8).

Existing tests cover www/old/`reddit.com` + `utm_*` and the Facebook `permalink.php` vs `story.php`
case well; neither format above appears in any test. Note the codebase already knows `redd.it`
exists — `reddit-title-slug-match.ts:38` names it explicitly as a slug-less link — so this is a gap
between two modules' assumptions, not an unknown format.

### C28 (P3) — rule 10 fails open on an unrecognised health verdict

`ruleHealthCheck` (`rule-health-check.ts:18`) enumerates `SHADOWBANNED`/`CHECKPOINT` → BLOCK, then
`ERROR`/`NO_BASELINE`/`WARN` → WARN, then `return ALLOW`. Any verdict string it does not recognise
falls through to ALLOW.

Rule 1 on the same class of data does the opposite: `ruleAccountHealth` blocks everything that is
not exactly `ALIVE`. Same file family, same shape of input, opposite default. The asymmetry is the
finding — one of the two is wrong, and the fail-open one is the rule whose own header says *"không
có tin xấu KHÔNG phải là tin tốt"*.

Reachability: not attacker-reachable — `verdict` is written by this project's own recorder. It is
**developer-reachable**, which is the realistic path: adding a verdict to `health-verdict.ts`
without editing rule 10 silently allows posting on it. Exactly the class the phase was scoped for
(silent wrong answers), and exactly how `NO_BASELINE` would have behaved had rule 10 not been
updated for it.

### C29 (P3) — the health-check lock stops working as the herd grows

`STALE_AFTER_MS = 30 min` is a fixed constant (`health-check-lock.ts:39`). Run duration is not
fixed: the runner sleeps a random 30–90 s between nicks by design. The comment does the maths for
today — *"8 nicks × 90 s < 15 min, so 30 min is generous"* — and it is right today.

At ~20 nicks the worst-case run reaches 30 min and a second run declares the first one orphaned,
deletes nothing (token mismatch protects the row), and takes the lock while the first is still
probing. Two concurrent runs through the single observer proxy is precisely the failure the module
exists to prevent, and it presents as normal: both runs log normally, and the symptom is Reddit
throttling the observer IP, which reads as `ERROR` verdicts, which reads as "Reddit changed its
HTML".

There is no heartbeat: `startedAt` is written once at acquire and never renewed, so staleness
measures *elapsed time*, not *liveness*. Remedy is small — renew `startedAt` between nicks, so the
threshold means "the holder stopped moving" rather than "the holder has been going a while".

Not urgent at 5–10 nicks. Recorded because the trigger is the product's own growth, and because the
constant and the loop that invalidates it live in different files.

### C30 (P3) — the rule-override audit entry is written outside the job's transaction

`post-job-actions.ts` header states the invariant: *"Ghi đè luật thì bắt buộc có lý do và luôn để
lại AuditLog."* The code creates the job (`:139`) and then, in a separate statement (`:150`), writes
the `RULE_OVERRIDDEN` audit row. A failure or crash between them leaves an overridden job with no
audit trail — the record of the single most sensitive queue action, and the one action whose whole
purpose is to be attributable afterwards.

The correct pattern is already in this repo one directory over:
`relay/…/relay-device-retirement-actions.ts:143,233` writes `tx.auditLog.create` inside the
transaction. Same shape as C26's note — the missing pattern exists nearby.

Reachability: needs a crash or DB error inside a two-statement window. Low, and honestly ranked
there. Cheap to close.

## 4. Observations — below the finding line

Recorded so the absence of a finding is interpretable; none is ranked as a defect.

- **Rules are evaluated outside the write transaction.** `createPostJob` evaluates, then creates.
  Two concurrent submissions for the same nick/day can both read `postsSameDay = 1` against a cap of
  2 and both commit. No DB constraint expresses a daily cap, and none reasonably could. At a 5-person
  team this needs two people submitting for the same nick in the same second.
- **`loadComparableContent` has no supporting composite index** and loads the whole 30-day window of
  *all* jobs into memory before filtering platform family in JS (deliberately — the family notion is
  a rules-layer convention, and the file says so). Indexes on `PostJob` are `[accountId, scheduledAt]`,
  `[targetId, scheduledAt]`, `[status]`; this query filters `status` + `scheduledAt`. Every other hot
  path in `rule-context-queries.ts` is covered by an existing index — checked one by one. H78's
  "performance cliff" is real in shape but far from the current scale.
- **`AuditLog` append-only is an application convention.** No `UPDATE`/`DELETE` path exists in
  product code (only `deleteMany` in test setup), and the schema deliberately keeps `actorId` as a
  plain column so the log outlives user deletion. But nothing at the database level stops rewriting
  it — the app's role owns the table. Whoever holds `DATABASE_URL` can already read every ciphertext;
  they still cannot decrypt the operator domain. Rewriting history is a real capability of that role;
  it is not a new exposure.
- **Registry drift detection is name-based.** `encrypted-field-registry.test.ts` parses
  `^(\w+Enc)\s+String` out of `schema.prisma`. A ciphertext column not named `*Enc`, or typed
  `Bytes`, is invisible to both the registry and its test, and `vault:rekey` would skip it. The
  convention is stated at `schema.prisma:6-13`. Works; depends on the convention holding.
- **`applyThresholdOverrides` has no floors or ceilings.** `similarityBlock = 9` or
  `targetCooldownHours = 0` silently disables a rule; only non-finite and negative are rejected.
  There is **no application write path to `RuleConfig`** (grep: zero `ruleConfig.create/update/upsert`),
  so this needs Prisma Studio or direct SQL — i.e. someone who could edit the verdicts anyway. Not
  ranked. Minor: the `row.key in result` guard also accepts inherited keys such as `constructor`;
  harmless (own-property assignment on a plain object, and `__proto__` assignment of a number is
  ignored by the engine), noted only so the next reader does not have to re-derive it.

## 5. Missing-input behaviour — all 10 evaluators

The phase's highest-yield artifact. For each pure evaluator: what does it do when its input is
missing or malformed? Any "returns ALLOW" is examined, not automatically a finding — several are
correct, because absence genuinely means "no constraint".

| Rule | Input absent / malformed | Behaviour | Correct? |
| --- | --- | --- | --- |
| 1 `ruleAccountHealth` | unknown `status` string | **BLOCK** (anything ≠ `ALIVE`) | yes — fails closed |
| 2 `ruleColdStart` | `coldStartUntil = null` | ALLOW | yes — null *means* no cold start |
| 3 `ruleTargetEligibility` | `platformCreatedAt = null` with age requirement | **WARN**, states it cannot check | yes — announces the blind spot |
| 3 | `karma` missing | n/a — column is `NOT NULL default 0`, so absence reads as 0 → blocks | yes |
| 4 `ruleDailyCap` | no jobs found | count 0 → ALLOW | yes — nothing scheduled is genuinely under cap |
| 5 `ruleTargetCooldown` | `hoursToNearestPostSameTarget = null` | ALLOW | yes — null *means* no prior post |
| 6 `rulePromoRatio` | empty history, PROMO content | **BLOCK** (`required = ratio`, `missing > 0`) | yes — H84 refuted, no division anywhere |
| 6 | `promoRatio ≤ 0` | ALLOW, documented as "target opts out" | yes |
| 7 `ruleContentSimilarity` | no candidates / text normalises to empty | ALLOW (`findMostSimilar` → null, or score 0) | acceptable — nothing to compare against |
| 8 `ruleThreadCollision` | `threadCollisions = []` at scheduling time | ALLOW-or-WARN; BLOCK branch unreachable pre-post | yes, and the label says so (`rules-engine.ts:96`) |
| 8 | thread key mismatch from link format | **ALLOW — silent miss** | **no → C27** |
| 9 `ruleLinkPolicy` | `links = []` | ALLOW | yes |
| 10 `ruleHealthCheck` | `latestHealthCheck = null` | WARN, "never probed ≠ healthy" | yes — model behaviour |
| 10 | unrecognised `verdict` string | **ALLOW — silent pass** | **no → C28** |

Supporting modules: `applyThresholdOverrides` falls back to the stricter defaults on bad rows;
`resolveContent` treats an unrecognised content type as `PROMO` (tightens, does not loosen);
`parseLinks` treats corrupt JSON as no links (loosens rule 9, but the body scan in `mergeLinks`
re-derives links from the text anyway); `deserializeEvaluation` returns null on corrupt stored
verdicts rather than crashing the queue page.

Two silent passes out of fourteen input-absence paths. The engine's own structure is sound:
`evaluateRules` runs every applicable rule (no short-circuit on first BLOCK), platform-skipped rules
are listed explicitly rather than silently allowed, and an evaluator that throws propagates instead
of degrading to a pass — H85 refuted, `SkippedRule` is declarative platform scope, never an error
outcome.

## 6. Schema, registry, migrations

**Product invariant (H73) — DB-enforced, not application-only.** `Account.proxyId @unique` and
`Account.antidetectProfileId @unique`; Postgres allows many NULLs but one real value, and
`schema.prisma:258` records that this survived the SQLite→Postgres move deliberately.
`ObserverProxy` is a separate table rather than a flag on `Proxy`, so an observer proxy has no
column through which it could ever be attached to a nick — structural, not remembered. The one leg
that is *not* DB-expressible is named in the schema itself (`:352`): `deviceId ⇒ device.userId ==
ownerId` needs a cross-table constraint, so it is enforced by `assignAccountCluster()` and surfaced
in an operations warning tray. Declared, not silently absent.

**Registry ↔ schema drift (H74): zero.** Eight `*Enc` columns in the schema, eight in
`ENCRYPTED_MODELS`, domains matching the in-line `vault:` marks one for one — Proxy/ObserverProxy
`passwordEnc` server, the three `Account` credential columns operator, both Facebook
`accessTokenEnc` server, `RelayDevice.retirementFinalizationKeyEnc` server. The test enforces both
directions plus "every column carries a domain mark" plus "all Account columns are operator".
Sealed-box columns (`operatorKeyGrant`, `*Authorization`, `*Grant`) are correctly outside the vault
registry — different mechanism, not rekeyed.

**Cascades (H75/H76): no over-reach found.** `PostJob` and `Interaction` hold `RESTRICT` on
`Account`/`PlatformTarget`/`ContentItem`, so history cannot be deleted out from under the rules
engine. `SetNull` on `ownerId`/`deviceId`/`proxyId` — losing a person or a machine never deletes a
nick. `Cascade` is confined to `Session`/`AuthAccount`/`RelayDevice` off `User`, `FacebookPage` off
`FacebookConnection`, and `HealthCheck` off `Account`. `AuditLog` deliberately has no FK at all.
Every one of these carries its reasoning in the schema.

**Migrations (H77) — 12, classified:**

| Class | Migrations |
| --- | --- |
| Reversible / additive | 9 (`init_postgres`, relay registry, lock table, scheduled-run table, invite, grant, pin, enrollment grant, retirement) |
| Structural drop, no live data at the time | `grant_operator_key_per_device` (`DROP TABLE "RelayInvite"`, superseded per-device) |
| Irreversible with documented recovery | `reddit_google_login_and_first_login` — `UPDATE Account SET passwordEnc = NULL WHERE platform='REDDIT'`; one-way, and it says so, because the server holds no operator key to read the value back |
| Irreversible with documented recovery | `merge_persona_into_account` — copies then `DROP TABLE "Persona"`; names the one field with nowhere to go (`Persona.notes`) and gives the `SELECT` to preserve it first |

None is irreversible-and-unrehearsed. Both destructive migrations instruct `npm run db:backup`
first, and `scripts/upgrade-database.ts` **enforces** it: it backs up before `migrate deploy`,
skips the backup only when the ledger is empty (a backup of an empty database being worse than
none), and on failure prints the restore command. Residual, already documented rather than
discovered here: the hosted path runs bare `npx prisma migrate deploy` as a Railway pre-deploy
(`deployment-guide.md:298`), where backup is manual step 10 — the guide states this and why
(`:423`). Accepted as recorded, not raised as a finding.

## 7. Hypothesis disposition

| State | Hypotheses |
| --- | --- |
| Closed — control found and traced | H73, H74, H75, H76, H77, H84, H85, H87, H88 (scheduler half), H89, H90 |
| Closed by remediation-worthy finding | H79 → C28, H82 → C27, H86 → C27 (coupling confirmed as predicted) |
| Closed with observation, not ranked | H78, H80, H81, H83 |
| Open, scale-triggered | H88 (lock half) → C29 |
| New, not hypothesised | C30 (audit entry outside transaction) |

Notes on the four closed-with-observation:

- **H80** — `rule-context-builder` drops nothing: every `RuleContext` field is assigned from a named
  query, and the two that can legitimately be empty (`threadCollisions` pre-post, `latestHealthCheck`
  never probed) are consumed as meaningful absence by rules 8 and 10 respectively.
- **H81** — no disagreement. `rule-daily-cap` and `daily-run-schedule` both go through
  `team-timezone.ts`; nothing calls `setHours`/`getHours` directly, and `machine-clock-ban.test.ts`
  enforces that. `instantFromWallClock` does the guess-then-correct two-pass specifically so a DST
  transition cannot land on the wrong offset, and says it is dead weight for `Asia/Ho_Chi_Minh`
  today and kept for the day the team timezone changes. `hourCycle: "h23"` rather than
  `hour12: false`, with the ICU midnight-returns-24 reason written down.
- **H83** — thresholds are tuning, not a defect: 0.7 block / 0.5 warn on trigram Jaccard after
  diacritic-stripping normalisation. Over-collision produces a false BLOCK on an *overridable* rule
  (recoverable); under-collision was accepted in phase-02's risk section. Unchanged position.
- **H88 scheduler half** — `claimScheduledRun` is genuinely atomic: conditional `updateMany` on
  `lastRunAt < scheduledFor`, falling back to `create` where the primary key decides. Two app
  replicas ticking at 09:00 cannot both win. The lock half is C29.

## 8. Handoff to Phase 06 — registered now, at the moment of handoff

Per the register's procedural fix. Also written into `findings-register.md` in the same edit as this
report, not left for Phase 06 to rediscover.

| Item | Why Phase 06 | Acceptance |
| --- | --- | --- |
| C27 second half — reject `/r/<sub>/s/<opaque>` share links at input in `interaction-form.tsx` and the mark-posted field | Frontend surface; Phase 06 owns it. Cannot be fixed in `normalizeThreadUrl` — the id is opaque without an HTTP redirect | Form refuses the format with a message telling the operator to open the link and paste the permalink |

C27's first half (`redd.it`), C28, C29, C30 are source remediation in Phase 05's own area and need
an authorization decision (§10), not a phase handoff.

## 9. What was not done

- No test was added. C27 is proven and would make a good regression guard, but the C2 gates are
  currently the only expected-fail tests in the suite and the handoff is explicit that ambient red
  stops being read. The guard lands with the fix, not before it.
- No source was modified. This phase is read-only per the plan; Phase 03's product remediation was
  separately authorized and recorded as a follow-up. Same authorization is requested below.
- Queue trace covered `post-job-actions`, `post-job-mark-posted`, `post-job-revert`,
  `recheck-jobs-batch`, `duplicate-posted-url-check`, `post-job-override-policy`,
  `interaction-actions`. Not read: `manual-post-reminders`, `posted-url-title-check`,
  `post-job-status-actions`, `posting-loop-summary`, `promo-ratio-summary`,
  `post-job-rule-preview`. The phase's own risk note ranks the missing-input table above the queue
  trace; the unread six are reporting and reminder surfaces, none of which key on rule verdicts.

## 10. Remediation — authorized and applied, 17 August 2026

Owner authorized fixing all four, and chose **block** for C28's unknown-verdict policy. Applied in
the same session; the audit's read-only rule was lifted by that authorization, same shape as Phase 03.

**C28 turned out worse than reported.** `HEALTH_VERDICTS` has six members and rule 10 enumerated
five: `UNTRACKED_POSTS` was already falling through to ALLOW. It is not a future trap — it is a live
silent pass, and on the one verdict that means rules 4/5/6 are undercounting. It is now WARN (not
BLOCK: `statusForcedBy` deliberately does not quarantine a nick for a bookkeeping fault, and the
nick itself is fine), while genuinely unknown verdicts BLOCK.

Two design points worth keeping:

- Rule 10 keeps its **own** list of judgeable verdicts and does not import `HEALTH_VERDICTS`.
  Importing would auto-accept any new verdict into the ALLOW path and reinstate exactly this bug.
  The pair is: fail closed at runtime, plus a test asserting every `HEALTH_VERDICTS` member is
  judgeable, so a developer adding one gets a red test locally instead of a herd-wide block in
  production.
- The unknown-verdict check sits **before** the staleness check. Sabotage proved this ordering
  earns its place: with the check after, an unknown-and-stale verdict returns WARN and still posts.

**C29 needed a column, not a constant.** Reusing `startedAt` as the heartbeat would have silently
broken the operator-facing "holding for N minutes" line. New nullable `heartbeatAt` + additive
migration; old rows fall back to `startedAt`, i.e. exactly the previous behaviour, so no row becomes
permanently orphaned by the upgrade. Renewal is token-scoped and fires after every nick, including
nicks that errored — a heartbeat reports the process is alive, not that the last nick went well.

| Finding | Files | Proof |
| --- | --- | --- |
| C27a | `rule-thread-collision.ts` | Sabotage-proven locally: guard removed → red (`'redd.it/1a2b3c'` vs `'reddit:1a2b3c'`), restored → green |
| C28 | `rule-health-check.ts` | Sabotage-proven locally: guard removed → 3 red, restored → green |
| C29 | `schema.prisma`, migration, `health-check-lock.ts`, `health-check-runner.ts` | 4 tests, Postgres-only → CI |
| C30 | `post-job-actions.ts` | 2 tests, Postgres-only → CI |

Gates: `tsc --noEmit` clean, `eslint .` clean, local suite **157 files / 1464 passed + 4 expected
fail** — the 4 being C2's gates, unchanged, and no regression anywhere else.

**Not yet verified:** C29 and C30's tests need Postgres, which does not exist locally. They have not
run. CI is the only place they can, and per the plan CI's `status`/`conclusion` must be read
directly rather than trusting `gh run watch`. Until that happens both fixes are argued, not proven.

## 11. Unresolved questions

Questions 1–3 were answered on 17 Aug: remediation authorized for all four, C28 blocks on unknown
verdict, C29 fixed by heartbeat. What remains:

1. **Push to run CI?** C29 and C30 cannot be verified locally. The draft PRs exist for exactly this.
   Nothing is committed yet.
2. **`UNTRACKED_POSTS` is now WARN, not BLOCK.** It was outside the authorized decision, which
   covered *unknown* verdicts. The nick is healthy and only the ledger is short, so blocking would
   punish the wrong thing — but if the owner wants posting stopped until the missing posts are
   recorded, it is a one-line change.
3. Carried, unchanged: C2 placeholder signing seeds (still the only red gates), C1/C5 wire-format
   rollout, F7 archive retention, and whether the two draft PRs stay draft until the audit closes.
