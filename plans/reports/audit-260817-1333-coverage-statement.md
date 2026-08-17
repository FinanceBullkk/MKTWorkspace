# Deep Audit — Closing Coverage Statement

17 August 2026. Closes the plan `260816-0507-full-codebase-deep-audit`. This is the document the
plan promised as its exit: what was examined, to what depth, what was found, and — the part that
matters most — **what was not examined**, so nobody reads silence as a clean bill.

Hand-off target: Phase 02 of the pre-MKB-04 audit, as its static-audit input.

## 1. Depth reached, by area

| Phase | Area | Declared | Reached | Result |
| --- | --- | --- | --- | --- |
| 00 | Fix re-verification | D2 | D2 | F1–F15 confirmed landed |
| 01 | Cryptographic protocols | D4 | D4 | All 20 hypotheses closed or owned by a finding |
| 02 | Local control surface, proxy containment | D4 | D4 | H21–H40 closed with executable evidence |
| 03 | Windows lifecycle | D3 + targeted D4 | as declared | C21 fixed; C22 closed for the supported topology |
| 04 | Release authority, supply chain | D3 + D4 on verification | as declared | No P0/P1/P2; C23–C25 |
| 05 | Data layer, business logic | D3 | D3 + D4 on H82 | C27–C30, all P3 |
| 06 | Breadth completion | D2, D3 on redaction | as declared | C31, C32, both P3 |

Every phase closed. No phase was skipped or silently downgraded.

## 2. What was examined and is now sound

- **The 1-nick-1-proxy-1-profile invariant is enforced by the database**, not only by application
  code: two `@unique` columns plus a structural split that leaves an observer proxy with no column
  through which it could ever attach to a nick.
- **Encrypted-column registry matches the schema exactly**, both directions, 8 columns, with a test
  that re-derives the comparison from `schema.prisma` on every run.
- **No unredacted path from any secret to any sink** across every route traced: the proxy transport
  authenticates by header rather than a credential-bearing URL, relay decrypt failures deliberately
  drop the original error, and Facebook redaction lives in the error constructor so a call site
  cannot forget it.
- **Every server action is guarded.** 25 files carry a real `"use server"` directive and every
  exported symbol in all of them passes through `guardedAction` or `adminAction`.
- **No DOM injection sink exists** in either application.
- **12 migrations classified**; none is irreversible-and-unrehearsed, and the one automated upgrade
  path backs up before it applies.
- **The suite has no expected failures.** As of C2 this is true for the first time in the audit, and it is CI-verified: run `32003277917` on commit `a63932c` reports 1739 passed, 10 skipped, and no expected-fail line at all, against 1729 passed plus 4 expected fail on the parent.

## 3. What was NOT examined — read this before trusting anything above

| Not examined | Why it matters |
| --- | --- |
| **Human Windows gates**: Authenticode after signing is enabled, power loss during an update, a withdrawn installer on a clean machine | Release-rehearsal observables, not code defects. Phase 04 closed them as far as code can. They remain open and are **not** discharged by this audit. |
| **The two-account Windows exercise** | Waived by the owner on 17 August 2026 as an unsupported topology (one Windows user per PC). A waiver, not a pass. |
| **MKTBrowser renderer, read line by line** | H94 is closed by the absence of DOM sinks plus React's escaping, which closes the hypothesis as written. It is not a line-by-line review of the renderer. |
| **The dependency tree of MKTBrowser, for install scripts** | `yarn.lock` does not record which packages declare them. The known native set was enumerated; that is not the same as exhaustive. `enableScripts` is on. |
| **C29 and C30 on the vulnerable path** | Both are proven to pass on CI. Neither was sabotage-proven, and C30's rollback cannot be fault-injected because `AuditLog` carries no constraint that can be made to fail on demand. |
| **H101, independently** | The lock expiry path it examines was rewritten hours earlier in this same audit by the same hand. Declared rather than glossed; an independent reading would be worth more. |
| **Prose quality, comment translation, `docs/archive/`** | Deliberately out of scope, and not deferred to a phantom later pass either. |

## 4. Findings — final state

32 deep-audit findings (C1–C32) plus 15 from the 16 August sweep (F1–F15).

- **No P0 remains.** No P1 remains. No P2 remains.
- **One P3 opened after this statement was first written:** C33, the vault-key parser having the
  same missing content check that C2 closed for the signing seed. Found while writing the closing
  handoff, recorded rather than quietly carried.
- **Fixed with tests:** C2, C3, C4, C6–C15, C17–C21, C23, C26, C27, C28, C29, C30, C31, and F1–F5,
  F8, F11–F14. C32 is fixed without a test, being a documentation claim.
- **Closed by decision, reasoning recorded:** C22, C24, F6, F7, F10, F15.
- **Accepted residual, named:** C16, C25, F9.
- **Deferred with a trigger:** C1 and C5 — the wire-format break. Revisit when the ticket format
  changes for any other reason, or before a third protocol signs with the server key.
- **One open:** C33 (above). C32, the roadmap's stale audit-status block, was closed by commit
  `df94910`, which replaced it with the closing statement that file had already promised.

## 5. The handoff control, and whether it worked

The audit's own worst failure was procedural: two of four cross-phase handoffs were dropped, and both
were recovered only because someone went looking. The fix was to register an item at the moment it is
handed over, and to open each phase by reconciling against that table.

It was then tested twice:

- **Phase 05** opened by reconciling, found no inbound handoff, and registered its one outbound item
  at the moment of handoff.
- **Phase 06** opened by reconciling and **caught a real gap**: C27's second half was in the register
  but absent from Phase 06's own scope and todo. That is the first handoff in this audit noticed by
  the receiving phase rather than by someone going looking later.

The control works. It is worth keeping for any multi-phase work that follows.

## 6. Corrections made during the audit, worth carrying forward

Recorded because each was a wrong turn caught late, and the pattern is more useful than the instance:

- **A count can measure the wrong thing.** H107 was sized at "~4 strings" — which turned out to be
  the English half, the part already compliant, because the count had assumed the translation
  direction. `AGENTS.md` settles it the other way.
- **`grep` counts mentions, not directives.** H93 first reported 33 `"use server"` files; 25 carry
  the real directive and the rest merely discuss it in comments.
- **A wrapper's exit code is not the command's.** `yarn npm audit` reported success through the
  background runner while the real command had failed with `yarn: command not found`.
- **A green suite does not prove your tests ran.** Every CI claim in Phases 05 and 06 was verified by
  differencing the test count against the parent commit's run, not by the green tick.
- **Fixing only what turned red is not fixing the class.** The C2 guard broke 22 tests locally; three
  fixture files were fixed and the work moved on. Six more sat in `*.database.test.ts`, which cannot
  run on this machine, so CI went red on the next push. The information needed to predict that was
  already on hand — 158 local files against 189 on CI, written down as the first environment trap in
  the handoff. The repair swept the whole repository for the pattern instead of the six files CI
  named. Recorded because the same shape will recur: when a new guard rejects fixtures, the fixtures
  it rejects are a class, not a list.

## 7. Unresolved questions

1. **The two draft PRs.** No merge gate has been decided. Recommendation now that the suite is fully
   green and every phase is closed: mark them ready, and let the human Windows gates in §3 gate the
   release rather than the pull requests.
2. **The human Windows gates themselves** remain the only thing between this code and a release
   claim. They need a machine and a person, not another audit phase.
