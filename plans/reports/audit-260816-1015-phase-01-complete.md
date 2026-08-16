# Phase 01 — Cryptographic Protocols: COMPLETE (H01–H20)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Prior: [`audit-260816-0955-retirement-cluster-complete.md`](./audit-260816-0955-retirement-cluster-complete.md)
Repo: MKTTool @ `feat/mkt-browser-clean-break`, 10 commits, **nothing pushed**.

**Status: Phase 01 COMPLETE. 20 of 20 hypotheses closed.**
**Depth achieved: D4** throughout. Planned depth was D4; reached it.

## Gates

`tsc` PASS · `eslint` PASS 0 · `vitest` **1690 passed + 6 expected-fail / 186 files**
(Phase 00 exit: 1526. Phase 01 total: **+170 tests**.) No regressions. Sweep clean, tree clean.

## This session — H06–H12

| H | Verdict | Evidence |
| --- | --- | --- |
| H06 `minRelayVersion` downgrade | **CLOSED-CLEAN** | 9 tests, 3 red on sabotage |
| H07 rate-limit keying | **CLOSED-CLEAN** | 12 tests, 3 independent sabotages, each red on its own group |
| H08 revoked device as recipient | **CLOSED-CLEAN, coverage gap fixed** | 7 tests, 6 red |
| H09 generation replay | **CLOSED-CLEAN** (was PARTIAL) | existing test proven load-bearing + 3 new, 2 red |
| H10 bootstrap single-use / concurrency | **CLOSED-CLEAN, ordering gap fixed** | 11 tests, ordering regression caught by 1 |
| H11 completion proof recipient-only | **CLOSED-CLEAN** | 4 tests + entropy dependency pinned |
| H12 grant replay at another device | **CLOSED-CLEAN, coverage gap fixed** | existing test proven load-bearing + 6 new, 3 red |

### H06 — the floor holds, and cannot be edited in transit
`ticket-verifier.ts:130`. Enforced on the correct side, boundary-exact, per-kind (a raised floor for
one kind does not lock old relays out of credential tickets). The **deployed relay 9 correctly
refuses a floor-12 compatibility-update ticket** — pinned as a live-configuration test. Editing the
floor in the envelope fails in **both** directions (lowering to bypass, raising to deny service).

### H07 — per-account, sliding, and not recoverable by clock manipulation
10 per 60 s, keyed per account. Isolation asserted differentially: a user who has spent nothing
succeeds at the same instant a exhausted user fails. Sliding rather than fixed — nine issues at t0 and
one at t0+30 s leaves 9 available at t0+60 s, not 10, so no burst across the boundary. A backwards
clock does not restore budget. Three separate sabotages (shared bucket / no expiry / raised ceiling)
each turned a distinct, attributable group red.

### H09 + H12 — closed, and both were genuinely PARTIAL until now
The existing `handle-receive-operator-key.test.ts` covers both; per the phase rule I did not accept
that until each guard was individually sabotaged. Attribution:

| Guard | Existing coverage |
| --- | --- |
| device + recipient binding (H12) | **covered** — 1 red |
| generation monotonicity (H09) | **covered** — 2 red |
| `grantHash` binding | **NOT covered** — all 11 stayed green → C7 |

Nuance worth recording: `hashOperatorKeyGrant` binds only `(ephemeralPublicKey, sealed)`. H12's
literal wording — "grantHash does not bind device id + public key" — is **true**, but the binding
lives in the signed envelope instead, and is enforced. The hypothesis was right about the hash and
wrong about the consequence.

## C7 (P3, test-coverage) — the grant substitution guard was untested

**Boundary:** relay operator-key delivery. **Not a vulnerability — the guard is correct today.**

`relay/src/handle-receive-operator-key.ts:64`

The request body carries two independent values: a **signed** `authorization` and an **unsigned**,
sealed `grant`. The `grantHash` comparison is the only thing tying the sealed blob to the authority
that approved it.

**Impact had it regressed:** a genuine, signed, unexpired, correctly-addressed authorization could be
paired with a *different* sealed grant — sealed to the same device, so it opens perfectly — and the
relay would store an attacker-chosen operator key as if authorized. Reachability requires the allowed
web origin, so web-app compromise or a malicious server; this guard is what makes the sealed blob
tamper-evident independent of transport.

**Fixed:** `relay/src/operator-key-grant-substitution.test.ts` — substitution with a different key,
honest reseal of the *correct* key (guards against hashing plaintext instead of ciphertext), in-place
ciphertext tampering, ephemeral-key swap, and cross-pairing of two legitimate deliveries. Assertions
check the **stored operator key**, not just the returned boolean. 3 of 6 go red under the guard's
sabotage; the other 3 fail earlier at decryption, which is stated rather than claimed as hash coverage.

## C8 (P3, test-coverage) — bootstrap take-and-clear ordering was untested

`relay/src/bootstrap-authorization.ts:47`

`consume()` reads `this.current` and nulls it **before** validating. That ordering is what makes
single-use hold on the failure path: a consume that throws after clearing must not leave the
authorization reusable. It is a structural property, not a lock — one line moved and it is gone.

Moving the clear below `assertGrantAuthorizationActive` leaves the existing 4 tests **fully green**
and turns exactly one of mine red. Fixed by `relay/src/bootstrap-completion-single-use.test.ts`,
which also pins the 16-way interleaved-consumer case (one winner, fifteen losers).

H11 note: the completion proof is `randomBytes(32)`, and `hashGrantCompletionProof` is an **unsalted**
SHA-256. That is safe only because of the entropy. If a future change derived the proof from a grant
id or counter, the stored hash would become invertible by search and any observer could complete a
bootstrap. The entropy dependency is now asserted, not assumed.

---

## The pattern that dominated this phase

**Five separate guards had no test coverage, each found the same way: by sabotaging the guard and
watching the existing suite stay green.**

| Guard | Existing suite result |
| --- | --- |
| `secret-migration` read-back + post-deletion (C6) | 15/15 green |
| `ticket-verifier` version floor | 6/6 green (existing test asserts the *table*, not enforcement) |
| `resolveTicketRecipient` + `listActiveRelayDevices` revocation filters | 27/28 green |
| `grantHash` binding (C7) | 11/11 green |
| bootstrap take-and-clear ordering (C8) | 4/4 green |

The common shape: tests exercise faults the module **injects into itself** (`faultAt`,
`MigrationFaultPoint`) or assert the **data** a guard consults, never a **dependency misbehaving** or
the guard's own comparison. Every one of these suites is otherwise well-written; the gap is
systematic, not sloppiness.

**This is the phase's most transferable result.** The plan's rule — "a test that never went red is a
decoration" — was written for *new* tests. Applied to *existing* tests it found five gaps in one
phase, at near-zero cost. **Recommend adopting sabotage-verification of existing suites as a standing
technique for Phases 02–06**, starting with Phase 02, which inherits the same `faultAt` idiom.

## Phase 01 final tally

| | |
| --- | --- |
| Hypotheses closed clean | H01, H03–H17, H19, H20 (18) |
| Not applicable | H02 (subsumed by C1) |
| Findings | **C1** P3, **C2** P3, **C3** P3, **C4** P2 *(fixed)*, **C5** P3, **C6** P3 *(fixed)*, **C7** P3 *(fixed)*, **C8** P3 *(fixed)* |
| Tests added | **+170** across 10 new files |
| Production code changed | **one** condition (C4) |

**Nothing above P2.** One real defect (C4 — X25519 encoding aliasing defeating revocation), fixed and
provably non-breaking. Four test-coverage findings, all fixed. Three structural/hardening findings
(C1, C2, C3, C5) carried forward with reasons.

**Three of my own hypotheses were wrong on contact** and were corrected rather than inflated:
Ed25519/X25519 discrimination (impossible), retirement lifetime cap (not attacker-reachable), H12's
consequence (binding exists, in a different place). Recording the rate deliberately — a register with
no corrections in it would be the suspicious outcome.

## Not examined — no conclusion should be drawn

- **Compatibility-manifest signing.** Deferred to Phase 04 by the plan. It uses a **separate**
  `publicKeyFromHex` in `scripts/release-authority/release-authority-key-primitives.mjs`, and
  `compatibility-manifest-crypto.ts:37` feeds it a `delegatedPublicKeyHex` taken **from data** —
  plausibly a more reachable instance of C3 than the one I found. **Phase 04 should test it first.**
- **HTTP route layer.** I tested the modules beneath `handle-retire-device.ts`,
  `handle-finalize-device-retirement.ts`, `handle-authorize-bootstrap.ts` — not the routes themselves.
  Phase 02 owns the local control surface.
- **True multi-process concurrency.** H10 was closed on the single-threaded ordering property, which
  is the correct model for this code. A future move to workers or multiple relay processes invalidates
  that reasoning, and no test would catch it.
- Rate limiting across **multiple server instances** — process-local by design; pinned as an
  observation, unobservable in unit tests.

## Unresolved questions

1. **C1 domain separation** — still the only structural finding without a decision. Wire-format break
   needing coordinated relay rollout. Interim guard (the cross-protocol matrix) is committed.
2. **C2 / C3** — deferred to Phase 04 so C3 can be fixed once across both `publicKeyFromHex`
   implementations. Confirm that placement.
3. **Adopt sabotage-verification of existing suites for Phases 02–06?** My recommendation is yes; it
   was the single highest-yield technique in this phase.
4. **Phase 02 next?** It is the other D4 phase and already inherits: the driver half of F2, and the
   `handle-configure.ts:94` trust-root-replacement observation.
5. Carried, unchanged: **F6**, **F10**, **F15**, `local-test-artifacts/` retention.
6. Ten commits sit unpushed on `feat/mkt-browser-clean-break`. Push, or hold for the audit baseline?
