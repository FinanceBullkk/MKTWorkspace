# Phase 01 (cont.) — Retirement Cluster Complete (H13–H17)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Prior: [`audit-260816-0945-retirement-cluster-partial.md`](./audit-260816-0945-retirement-cluster-partial.md)
Repo: MKTTool @ `feat/mkt-browser-clean-break`, 8 commits, **nothing pushed**.

**Status: Phase 01 — 13 of 20 hypotheses closed.** Retirement cluster (H13–H17) **complete**.
**Depth achieved: D4** throughout. One finding: **C6 (P3, test-coverage)**.

Steps 1 and 2 of the agreed plan are done. **Step 3 (H06–H12) not started** — see the end.

## Gates

`tsc` PASS · `eslint` PASS 0 · `vitest` **1640 passed + 6 expected-fail / 181 files**
(was 1623+6/179). +17 tests. No regressions. Sabotage sweep clean, `git diff --stat` empty.

## Commits this session

| Commit | Contents |
| --- | --- |
| `13f7f48` | `test(retirement)`: finalization replay + authorization time window |
| `7439925` | `test(relay)`: retirement device binding + migration fail-closed |

## Hypothesis status

| H | Verdict | How |
| --- | --- | --- |
| H13 finalize idempotence / replay | **CLOSED-CLEAN** | 12 tests, 5 red on sabotage |
| H14 authorization accepted by wrong device | **CLOSED-CLEAN** | 9 tests, 4 red on sabotage |
| H15 clock-skew symmetry | **CLOSED-CLEAN** | 10 tests, 6 red on sabotage |
| H16 receipt before revocation durable | **CLOSED-CLEAN** | existing DB test, proven load-bearing (2 red) |
| H17 secret migration fails open | **CLOSED-CLEAN, but guards were untested → C6** | 6 new tests, 5 red on sabotage |

## H14 — device binding: closed clean (the one that mattered)

`relay/src/device-retirement.ts:67` — `assertAuthorizationMatchesActiveIdentity`

Retirement is the relay's only self-destructive operation (erases device private key, operator domain
key, operator grant state). Cross-device acceptance would be the highest-impact failure in the
protocol. It does not occur. All four identity vectors are refused:

| Perturbation | Result |
| --- | --- |
| authorization names another `deviceId` | refused, nothing destroyed |
| relay claims a different `deviceId` | refused, nothing destroyed |
| authorization addressed to another device's public key | refused, nothing destroyed |
| relay presents a key the authorization does not name | refused, nothing destroyed |
| authorization signed by an untrusted key | refused, nothing destroyed |
| relay pins a different server key | refused; **succeeds with the correct key** (differential) |
| completion sealed to another device | refused, nothing destroyed |
| completion hash ≠ sealed proof | refused, nothing destroyed |

Every case varies **one** field against a shared fixture, and asserts not just that it threw but that
**the secrets are still present**. A rejection that still erased credentials would be a failure
dressed as a pass; asserting only the throw would not distinguish them.

Red-then-green: disabling `assertAuthorizationMatchesActiveIdentity` turns exactly **4 tests red**.

## H16 — revocation durability: closed clean, by construction

`src/lib/retirement/relay-device-retirement-actions.ts:120`

The hypothesis feared the receipt being written before revocation was durable. The real ordering is
the safe one and is stronger than the hypothesis assumed: `revokedAt` is set **inside**
`prisma.$transaction`, committed **before** the authorization is returned to the caller. The relay
cannot begin erasing until the server has durably revoked. On the relay side, the receipt and
security guard are likewise written before `removeRelaySecrets`.

A crash anywhere in the sequence therefore leaves the server believing the device is **revoked** —
the safe direction — not live.

Closed with executable proof rather than by reading: the existing test *"revokes first, persists one
stable retirement, and issues a recipient-bound authorization"* was **shown load-bearing** — setting
`revokedAt: null` turns 2 DB tests red. Per the phase rule, an existing test only closes a hypothesis
once it has been made to fail.

## C6 (P3, test-coverage) — migration read-back guards were untested

**Boundary:** relay protected-secret migration. **Not a vulnerability — a coverage gap on guards that
protect against unrecoverable secret loss.**

`relay/src/secret-migration.ts:131` (`verifySecret`), `:138` (`requireProtectedSecret`)

`migrateRelaySecrets` moves the operator domain key and device private key from plaintext files into
the OS-protected store, then deletes the plaintext. Three guards stand between a failed protected
write and permanent loss of the only copy.

**Discovered by sabotage:** disabling `verifySecret` and `requireProtectedSecret` left **all 15**
tests in `secret-migration.test.ts` green — including the one named *"never deletes plaintext before
protected read-back verification passes"*. Adding the conflict-check to the sabotage turns exactly
**1** of the 15 red, so that third guard was covered and the other two were not.

**Root cause:** every existing fault is injected via `MigrationFaultPoint` — thrown *by the migration
itself*. The store always behaves. Nothing exercised the case the guards exist for: a protected store
that reports a successful write without persisting.

**Impact if a guard regressed:** on a DPAPI write that silently fails (profile not loaded, roaming
profile race — real Windows failure modes), the migration would delete the plaintext operator domain
key having never stored it. Per the F7 analysis, that key is unrecoverable without a re-issue
ceremony. The guards are **correct today**; they were simply unprotected against regression.

**Remediation: done.** `relay/src/secret-migration-read-back-failure.test.ts` — 6 tests using a store
that reports success without persisting, and one that reads back foreign data. These are fault
injections of the same kind the module already provides for itself, not mocks of the logic under
test; the migration path is entirely real. Each asserts the plaintext **survives**, and one asserts a
later retry with a healthy store still converges.

**Retest gate:** the new file. 5 of its 6 tests go red under the same sabotage that the existing suite
survived.

## Corrections recorded

- **H15 lifetime cap** (prior report): my hypothesis that a ten-year authorization should be rejected
  was over-broad. There is one issue path with a hardcoded `RETIREMENT_LIFETIME_MS = 30_000`;
  `lifetimeMs` is not attacker-reachable. Converted to a pinned observation, not inflated to a finding.
- Third hypothesis of mine to fail on contact this phase, after Ed25519/X25519 discrimination (H19)
  and this one. Recording the rate deliberately: the discipline is producing corrections in both
  directions, which is the point.

## Phase 01 running tally — 13 of 20

| Closed clean | Findings | Open |
| --- | --- | --- |
| H01, H03, H04, H05, H13, H14, H15, H16, H17, H19, H20 | **C1** P3, **C2** P3, **C3** P3, **C4** P2 *(fixed)*, **C5** P3, **C6** P3 *(fixed)* | **H06, H07, H08, H09, H10, H11, H12** |

H02 not applicable. Six findings, two fixed, none above P2.

**Assessment, stated plainly:** the retirement protocol is the strongest part of this codebase so far.
Separation by a per-retirement one-use key, revocation committed before authorization, receipt written
before destruction, identity bound on every vector. The single real gap was a *test* gap, not a code
gap. That conclusion is only meaningful because every guard was shown red first — which is exactly
how C6 surfaced.

## Not examined

- **H06–H12 entirely** — step 3, not started. Ticket lifecycle (`minRelayVersion` downgrade, rate-limit
  keying, revoked-device recipient lookup) and grant generations (generation replay, bootstrap
  single-use under concurrency, completion-proof leakage, cross-device grant replay).
- **H09 and H12 remain PARTIAL** from three sessions ago — read-level evidence only. Still not closed.
- **No concurrency testing** anywhere in this phase. H10 is explicitly a concurrency hypothesis and
  will need a different technique than everything used so far.
- Whether the `handle-retire-device.ts` / `handle-finalize-device-retirement.ts` HTTP handlers add or
  weaken any binding — I tested the modules beneath them, not the routes.

## Unresolved questions

1. **Step 3 (H06–H12) is a full session** and I stopped rather than run it thin. H10 (bootstrap
   single-use under concurrency) is the one needing a genuinely new approach; the rest follow the
   pattern now established. Continue next?
2. **C6 suggests a broader question:** if the migration guards were untested, are other
   `faultAt`-style suites in the same shape — testing only self-injected faults, never a misbehaving
   dependency? `device-retirement.test.ts` uses the same pattern. Worth a targeted sweep, cheap now
   that the technique exists.
3. Carried, unchanged: **C1** domain-separation appetite, **C2/C3** deferred to Phase 04, **F6**,
   **F10**, **F15**, `local-test-artifacts/` retention, `handle-configure.ts:94` → Phase 02.
