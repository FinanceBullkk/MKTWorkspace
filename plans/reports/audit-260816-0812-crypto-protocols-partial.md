# Phase 01 — Cryptographic Protocols (PARTIAL — stopped at a clean boundary)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Prior: [`audit-260816-0803-fix-reverification.md`](./audit-260816-0803-fix-reverification.md)

**Status: INCOMPLETE. 5 of 20 hypotheses closed.** Phase file estimates 2–3 full sessions; this is
roughly the first. Stopping at a coherent boundary per the plan's "report progress, do not silently
extend" rule.

**Depth achieved: D4 on the signature/domain-separation cluster (H01–H03). D2 elsewhere.**
Planned depth was D4 throughout — not reached, and I am not claiming it.

## Gates

MKTTool `tsc` PASS · `eslint` PASS 0 · `vitest` **1550 passed** (1526 at Phase 00 exit, +24 new).
No regressions. MKTBrowser untouched this phase.

## Hypothesis status

| H | Verdict | How |
| --- | --- | --- |
| H01 cross-protocol message confusion | **CLOSED-CLEAN, but structurally fragile — finding P3** | executable 5×4 matrix, red-then-green |
| H02 domain prefix length-delimiter collision | **NOT APPLICABLE — subsumed by C1** | there is no domain prefix at all |
| H03 signature over re-serialized object | **CLOSED-CLEAN** | all four verifiers check received bytes |
| H04 ticket lifetime ≠ 30 s | **CLOSED-CLEAN** | `TICKET_LIFETIME_MS = 30_000`; boundary already tested |
| H05 ticket kind confusion across handlers | **CLOSED-CLEAN** | all three consumers filter kind |
| H06–H08, H10, H11, H13–H20 | **NOT EXAMINED** | see "Not examined" |
| H09 generation replay | **PARTIAL** | read-level evidence only, no test |
| H12 grant replay at another device | **PARTIAL** | read-level evidence only, no test |

## C1 (P3) — Four protocols share one Ed25519 key with **no cryptographic domain separation**

**Boundary:** server signing key → relay verifiers.

`ticket-issuer.ts:66`, `grant-authorization.ts:39`, `device-retirement-authorization.ts:45` all emit
the identical wire shape:

```
base64url(JSON(envelope)) + "." + base64url(Ed25519_sign(encoded))
```

signed by the **same** server key. No protocol tag is mixed into the signed bytes. A signature minted
for one protocol is therefore a mathematically valid signature for every other one. Verified directly:
each artifact's raw signature passes `verify()` under the server key regardless of which verifier it
was meant for (asserted in the matrix).

The only barrier is each verifier's **field-shape validation, which runs after the signature check**.
It holds today because the required-field sets happen to be disjoint:

| Protocol | Discriminating requirement |
| --- | --- |
| Ticket | `minRelayVersion`, `jti`, `epk`, `sealed` |
| Grant authorization | `kind ∈ {delivery,bootstrap}`, `grantId`, `generation`, `grantHash` |
| Retirement authorization | `kind = "device-retirement"`, `retirementId`, `finalizationPublicKey` |
| Retirement finalization | separate one-use key — **not shape-dependent** |

**Not currently exploitable.** I attempted every cross pair; all rejected. Ranking this P3, not
higher: it is a structural fragility, not a live vulnerability.

**Why it still matters:** the property is an accident of current field sets, not a design invariant.
Any of these re-opens it — relaxing a validator, making a field optional, adding a fifth protocol that
overlaps an existing shape, or a `COMPATIBILITY_UPDATE`-style extension reusing grant fields.

**Reproduction (demonstrated, then reverted):** delete the shape-validation block in
`verifyGrantAuthorization` (`grant-authorization.ts:72-89`). A **ticket** and a **retirement
authorization** then both verify as valid grant authorizations. Nothing else in the codebase stops it.

**Remediation:** prefix a length-delimited domain tag into the signed bytes, e.g.
`sign(len(tag) ‖ tag ‖ encoded)` with tags `mkttool/ticket/v1`, `mkttool/grant/v1`,
`mkttool/retirement/v1`. This is a **wire-format break** requiring coordinated relay rollout — it
belongs in a planned migration, not a patch. Interim mitigation is the committed matrix.

**Retest gate:** `src/lib/tickets/server-key-cross-protocol-matrix.test.ts`.

**Phase 04 inheritance:** the compatibility manifest is signed by the same key family. Phase 04 must
add its cells to this matrix — per the plan, I did not pull manifest signing into Phase 01.

### Good design worth recording — retirement finalization

`device-retirement-finalization-key.ts:24` mints a **per-retirement one-use signing key**, seed
encrypted under the server vault key. Finalization is the one protocol separated **by key**, so no
server-signed artifact can reach its verifier regardless of shape. This is the pattern the other three
lack, and it is already in the codebase — C1's fix has a local precedent.

## Closed clean, with evidence

- **H03.** `ticket-verifier.ts:98`, `grant-authorization.ts:61`, `device-retirement-authorization.ts:67`,
  `device-retirement-finalization.ts:45` all verify over the received `encoded` string; none
  re-serializes. `ticket-issuer.ts:11-19` documents why. Confirmed for all four, not just the ticket.
- **H04.** `TICKET_LIFETIME_MS = 30_000` (`ticket-types.ts:41`), consumed at `ticket-issuer.ts:61`.
  The replay-guard trade-off rationale is sound. Boundary behavior already covered by
  `ticket-lifecycle.test.ts:175-179`.
- **H05.** All three ticket consumers filter kind **before** dispatch: `handle-ticket.ts:99`
  (allowlist `[LAUNCH_PROFILE, CREATE_PROFILE]`), `handle-secret.ts:104` (`CREDENTIAL`/`OTP` only),
  `handle-compatibility-update.ts:67`. A CREDENTIAL ticket cannot reach `/ticket`, nor a PROFILE
  ticket `/secret/reveal`. Intra-grant kind confusion is also blocked — `handle-receive-operator-key.ts:59`
  requires `delivery`, `bootstrap-authorization.ts:33` requires `bootstrap`.

## Partial — read-level only, no test yet

- **H09 (generation replay).** `handle-receive-operator-key.ts:81` enforces
  `authorization.generation <= existing.generation → reject`, which is strict monotonicity. **Looks
  correct; not proven.** Needs a test, and needs the concurrency case (two simultaneous deliveries at
  generation N+1) which I have not examined.
- **H12 (grant replay at another device).** `handle-receive-operator-key.ts:60` binds both `deviceId`
  and `recipientPublicKey`; `:64` binds `grantHash` to the sealed grant. **Looks correct; not proven.**

Both must go through the write-test-then-red loop before I would call them closed. Per the phase's own
rule, reading is not closure.

### Observation (informational, not a finding)

`handle-ticket.ts:35` comments that other kinds are rejected "**trước khi** ruột được mở ra" (before
the payload is opened). In fact `verifyTicket` at `:90` already unseals the payload; the kind check is
at `:99`, after. Not a security issue — unsealing requires the device private key and the signature is
already verified — but the comment misdescribes the order and could mislead a future reader into
relying on an ordering guarantee that does not exist.

## Tests added

| File | Tests | Red-then-green |
| --- | --- | --- |
| `src/lib/tickets/server-key-cross-protocol-matrix.test.ts` | 24 (new) | **Yes** — see below |

Red-then-green detail, since this is the phase's central discipline:

1. **First red attempt failed to go red.** Sabotage `if (false && a \|\| b \|\| …)` disabled only the
   first clause — `&&` binds tighter than `||`. All 24 still passed. Had I accepted that, I would have
   recorded a false verification.
2. **Second attempt, correct sabotage.** Replacing the whole shape-validation condition with `false`
   turned exactly the two expected cells red: `verifyGrantAuthorization rejects ticket` and
   `verifyGrantAuthorization rejects retirement-authorization`.
3. Restored; `git diff --stat` on `grant-authorization.ts` is empty — byte-exact revert.
4. A design error in my own matrix also surfaced: `ACCEPTED` claimed the server-keyed finalization
   verifier should accept its own artifact. It must accept **nothing** under the server key. Corrected,
   with the accepting path asserted in a dedicated control test.

The matrix asserts all 20 cells plus 4 control tests. No cell skipped.

## Not examined — no conclusion should be drawn

Fourteen hypotheses untouched. Explicitly:

| H | Area | Files not read |
| --- | --- | --- |
| H06 | `minRelayVersion` downgrade | — |
| H07 | rate limit keying / process-reset | `ticket-rate-limit.ts` |
| H08 | recipient lookup returns revoked device key | `ticket-recipient-lookup.ts` |
| H10 | `bootstrap.consume()` single-use under concurrency | `bootstrap-authorization.ts` (partially read) |
| H11 | completion proof verifiable by non-recipient | `grant-completion-proof.ts`, `operator-key-completion.ts` |
| H13 | finalize idempotence / replay after seed erase | `device-retirement-receipt.ts`, `device-retirement.ts` |
| H14 | retirement authorization accepted by wrong device | `device-retirement.ts` |
| H15 | clock-skew symmetry | partially read — skew is ±60 s on both bounds and there is **no maximum-lifetime cap**; server chooses lifetime, so not obviously exploitable. Unresolved. |
| H16 | receipt written before revocation durable | `device-retirement-recovery-server.ts` |
| H17 | partial secret migration fails open | `secret-migration.ts` |
| H18 | weak signing seed accepted | `server-signing-key.ts` — `parseSigningSeed` + `SIGNING_SEED_BYTES=32` exist; unverified |
| H19 | malformed / small-order X25519 key | `relay-device-key.ts` — `SPKI_X25519_PREFIX` + `assertRelayPublicKeyUsable` exist; unverified |
| H20 | ephemeral key reuse / missing AAD in sealed box | `ticket-sealed-box.ts` |

Also not done: the plan's full cross-protocol matrix **including compatibility-manifest signing**
(deferred to Phase 04 by the plan's own instruction), and any concurrency testing.

H18/H19/H20 are the ones I would prioritise next — they are the primitive layer everything above rests
on, and all three have plausible-looking guards whose adequacy is unverified.

## Files changed

MKTTool: `src/lib/tickets/server-key-cross-protocol-matrix.test.ts` (new, test-only).
**No production code modified in this phase.** Nothing committed or pushed. No sabotage remains
(grep-verified for `if (false`).

## Unresolved questions

1. **Continue Phase 01?** ~15 hypotheses remain, ~2 sessions. Alternative: accept C1 + the 5 closures
   and move to Phase 02, carrying the rest as declared-open. I recommend continuing — H18/H19/H20 are
   primitive-layer and cheap relative to their blast radius.
2. **C1 remediation appetite.** Adding domain separation is a wire-format break needing a coordinated
   relay rollout. Is that in scope for this branch, or a follow-on migration with the matrix as the
   interim guard?
3. Carried from Phase 00, still open: **F7 restore script** (production relay identity with the
   operator domain key still parked in `local-test-artifacts/`), **F6** token sealing decision, **F10**
   CI branch filter, **F15** language-rule scoping.
