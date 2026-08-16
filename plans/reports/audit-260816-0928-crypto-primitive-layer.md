# Phase 01 (cont.) — Cryptographic Primitive Layer (H18, H19, H20)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Prior: [`audit-260816-0812-crypto-protocols-partial.md`](./audit-260816-0812-crypto-protocols-partial.md)
Repo: MKTTool @ `feat/mkt-browser-clean-break`. MKTBrowser untouched this session.

**Status: Phase 01 still INCOMPLETE. 8 of 20 hypotheses closed** (H01–H05 prior, H18–H20 this session).
**Depth achieved: D4** on all three hypotheses taken this session — hypotheses written as tests before
reading verification logic, every guard sabotage-verified.

## Gates

`tsc --noEmit` PASS · `eslint .` PASS 0 · `vitest` **1599 passed + 7 expected-fail / 177 files**
(baseline 1550; +56 tests). No regressions. No production code modified.

## Hypothesis status

| H | Verdict | How |
| --- | --- | --- |
| H18 weak signing seed | **FINDING C2 (P3)** + guards proven | 28 tests, red-then-green |
| H19 malformed / small-order X25519 | **FINDING C4 (P2)**; small-order guard CLOSED-CLEAN | 19 tests, red-then-green |
| H20 ephemeral reuse / missing AAD | reuse+integrity **CLOSED-CLEAN**; AAD **FINDING C5 (P3)** | 9 tests, red-then-green |
| H06–H17 | **NOT EXAMINED** | not started this session |
| H09, H12 | **STILL PARTIAL** | untouched; read-level evidence only, not closed |

---

## C4 (P2) — X25519 encoding aliasing defeats device revocation — **FIXED, see Decisions**

**Boundary:** relay device key → enrollment/revocation. **The strongest finding of the session.**

`src/lib/tickets/relay-device-key.ts:54` (`normalizeRelayPublicKey`)

RFC 7748 §5: the most-significant bit of the final byte of an X25519 u-coordinate is **ignored**.
`…a110` and `…a190` are therefore the *same key* and derive the *same shared secret*, but are two
distinct 64-character hex strings.

`normalizeRelayPublicKey` folds case and whitespace. It does not mask that bit.

This defeats a control the codebase documents explicitly. `prisma/schema.prisma:675`:

> `@unique` is a safety constraint, not tidying: the same key in two rows means revoking one row
> leaves the other alive, and the revoker believes they have blocked it. Normalize to lowercase
> before writing, because "AB…" and "ab…" are the same key but Postgres treats them as two.

The author identified the exact threat and defended the case/whitespace variants. The bit-255 alias
was missed.

**Reproduction:** `generateRelayDeviceKeyPair()`, then set bit 7 of byte 31. Both strings pass
`relayPublicKeyToKeyObject` + `assertRelayPublicKeyUsable`, and `relayPublicKeyToHex` returns each
unchanged — no canonicalization. Both enroll as separate `RelayDevice` rows under `@unique`.

**Impact:** one private key holds two device identities. Revoking the row the admin knows about
leaves the other live and still receiving sealed tickets, decryptable by the same private key. All
three enrollment paths are affected — `relay-enrollment-actions.ts:46`, `relay-device-actions.ts:112`,
`setup-device-actions.ts:32` — because all funnel through `relayPublicKeyToKeyObject`.

**Ranked P2, not higher:** exploitation needs the ability to enroll a device (admin-mediated), and it
does not by itself expose credentials — the attacker must already hold the private key. It is an
insider / lost-device scenario: pre-plant a duplicate identity so a later revocation is ineffective.

**Remediation, and why it is safe:** a genuine u-coordinate is `< p = 2^255 − 19`, so bit 255 is
**always clear** on every legitimately generated key. Asserted over 32 fresh keypairs in the test.
Therefore **rejecting** a key with that bit set changes nothing for any real key and needs no data
migration. Recommend reject over mask — masking silently changes a submitted identity. One condition
in `normalizeRelayPublicKey`, covering all three enrollment paths at once.

**Retest gate:** `src/lib/tickets/relay-device-key-point-validation.test.ts` — the `it.fails` case
flips to red the moment the guard lands, prompting conversion to a plain assertion.

## C2 (P3) — no entropy or placeholder policy on the server signing seed

`src/lib/tickets/server-signing-key.ts:61` (`parseSigningSeed`)

Length and hex-charset are enforced (both proven load-bearing). Content is not. `00…00`, `ff…ff`,
`abab…`, and an ascending counter are all accepted and derive working server signing keys.

Contrast `src/lib/relay/release-download-token.ts:44`, which enforces
`MIN_RELEASE_DOWNLOAD_TOKEN_LENGTH = 32` on a far less powerful secret. The pattern exists in the
codebase; it is not applied to the key that signs tickets, grants and retirement authorizations.

**Impact:** an operator who pastes a placeholder gets a guessable signing key, and anyone who guesses
it forges every protocol. **Mitigating:** `.env.example:67` ships `TICKET_SIGNING_KEY=""` — empty, not
a decoy value — and a keygen script exists. So the realistic path is deliberate operator error.
Genuinely P3.

**Retest gate:** `src/lib/tickets/server-signing-key-seed-hardening.test.ts`.

## C3 (P3) — `publicKeyFromHex` accepts low-order Ed25519 points

`src/lib/tickets/server-signing-key.ts:127`

Validation is shape-only (64 lowercase hex). All five canonical low-order/non-canonical points import
successfully, and **every one admits a universal forgery** for an attacker-chosen message.

Demonstrated, not asserted about: with `A` = identity, the signature `(R = identity, S = 0)` verifies
under Node/OpenSSL for arbitrary messages — no private key, no interaction. For a point of order *n*
the same artifact works whenever `h ≡ 0 mod n`, probability `1/n` over messages; since the attacker
picks the message, all five are forgeable in practice. The test searches 64 deterministic messages and
confirms it for all five, with a genuine key as the differential control (0 hits in 64).

**Reachability:** `serverPublicKey` is **not** hand-pasted — the web app POSTs it to the relay
(`relay-config.ts:88`, `relay-endpoints.ts:61`, `handle-configure.ts:94`). That endpoint is properly
Origin-guarded in-body, with a good written rationale.

**Ranked P3 because the precondition is already fatal:** an attacker who can push `serverPublicKey`
can equally push their own real key and gain the same control. The incremental gain is that a
low-order key needs *no key material at all* and leaves the relay forgeable by any third party, not
just the attacker. Defense-in-depth on the trust root, not an independent vulnerability.

**Remediation:** reject low-order points at import. Same shape of fix as C4 and equally non-breaking.

**Retest gate:** `src/lib/tickets/server-signing-key-seed-hardening.test.ts`.

## C5 (P3) — sealed box carries no associated data binding it to its envelope

`src/lib/tickets/ticket-sealed-box.ts:86`

`sealForDevice(payload, devicePublicKeyHex)` takes no context argument, so structurally there is no
AAD binding a seal to the ticket id, kind, or expiry it ships with. A box cannot detect being moved
between envelopes.

**What covers it today:** the Ed25519 signature over the whole envelope, `epk` and `sealed` included.
**Why it still matters:** that is the *same single layer* finding C1 shows carries no domain
separation. Envelope binding and protocol separation both rest on one mechanism, with no independent
second check at the seal layer. Fixing C1 by mixing a domain tag into the signed bytes would be a
natural place to also bind the seal.

**Retest gate:** `src/lib/tickets/ticket-sealed-box-binding.test.ts`.

---

## Closed clean, with evidence

- **H19 small-order recipient keys.** `assertRelayPublicKeyUsable` (`relay-device-key.ts:180`) rejects
  all 7 canonical small-order points. Proven load-bearing — disabling it turns 8 tests red. The design
  is good and worth recording: rather than hard-coding a blacklist it performs one probe
  Diffie-Hellman and lets OpenSSL refuse the degenerate result, which covers the whole class. Its own
  comment argues exactly that.
- **H20 ephemeral uniqueness.** 64 seals of identical plaintext to one recipient yield 64 distinct
  ephemeral keys, 64 distinct ciphertexts, 64 distinct (epk, IV) pairs. Forcing ephemeral reuse turns
  2 tests red.
- **H20 integrity.** Ciphertext bit-flip, tag bit-flip, ephemeral-key substitution, and wrong-recipient
  all fail closed. Making the AES key independent of the shared secret turns 2 tests red.
- **H20 attacker-supplied ephemeral key.** `openSealedPayload` imports the ephemeral key without the
  `assertRelayPublicKeyUsable` check applied to recipient keys — an asymmetry — but small-order
  ephemerals fail closed anyway because OpenSSL refuses the derivation. Pinned so a future hand-rolled
  derivation cannot lose it silently.
- **H18 seed length and encoding.** Length, odd-length, empty, and four hex-truncation vectors
  (including `0x`-prefixed and trailing-non-hex, which `Buffer.from(_, "hex")` would silently truncate
  to a short seed) are all rejected. Disabling the guards turns 10 tests red.

## Tests added

| File | Tests | Red-then-green |
| --- | --- | --- |
| `src/lib/tickets/server-signing-key-seed-hardening.test.ts` | 28 (22 pass, 6 expected-fail) | **Yes** — 10 red on 4 disabled guards |
| `src/lib/tickets/relay-device-key-point-validation.test.ts` | 19 (18 pass, 1 expected-fail) | **Yes** — 8 red on disabled `assertRelayPublicKeyUsable` |
| `src/lib/tickets/ticket-sealed-box-binding.test.ts` | 9 | **Yes** — 2 red on ephemeral reuse, 2 red on constant AES key |

All sabotage replaced **whole conditions**, never a clause inside `&&`/`||`, and each was
grep-confirmed applied before the run — the trap from the prior session. All restored via
`git checkout`; `git diff --stat` empty; sabotage sweep clean.

**On `it.fails`:** the 7 expected-fail cases pin the three open findings. The assertion is the one we
actually want to hold, unweakened; `it.fails` records that it does not hold *yet*, keeps the suite
honestly green, and turns **red the moment someone fixes the code** — forcing conversion to a plain
assertion. No test was weakened, skipped, or rewritten to obtain green.

## Corrections and negative results

Recorded because they change what future passes should trust.

1. **One of my own hypotheses was wrong.** I asserted an Ed25519 key pasted where an X25519 key
   belongs should be rejected. It cannot be: both are 32 opaque bytes and no validation distinguishes
   them. Converted to a documented observation asserting the true behavior. Consequence is
   recoverability (secrets sealed to a point nobody holds the private half of), not confidentiality.
   `server-signing-key.ts:145` catches the *mirror* mistake only because Ed25519 import validates the
   point; the reverse direction has no equivalent.
2. **Two shape checks are not independently load-bearing.** Disabling the length/charset checks in
   `publicKeyFromHex` and `normalizeRelayPublicKey` did **not** turn their tests red — Node's JWK
   importer rejects those inputs anyway. They are error-message/UX guards, not security gates. The
   real gap in both is point validity, which neither they nor Node check.
3. **`SPKI_X25519_PREFIX` confirmed dead** (corroborates Phase 00 F16). Nothing uses it; the import
   path goes via JWK. Its value is now pinned by a test so a future reintroduction as a real check
   starts from a correct constant. Notable: a self-describing DER format is exactly what would have
   made correction #1 detectable — the constant is a fossil of an abandoned safer wire format.

## Observation — trust-root replacement on a live relay (not one of H01–H20)

`handle-configure.ts:94` writes `{deviceId, serverPublicKey}` with **no check that a trust root
already exists**. A live, enrolled relay's server public key can be replaced by any request from the
allowed origin. The handler's own comment (lines 15–17) names the consequence — a mis-pointed relay
still holds `VAULT_KEY_OPERATOR` and becomes a decryption oracle — which is why the Origin check is
in-body rather than left to CORS. The residual gap is only that *replacing* an existing root is
treated identically to *setting* the first one. Compounds C3. Flagging, not ranking: it is outside the
declared hypothesis set and belongs to Phase 02's local control surface.

## Not examined — no conclusion should be drawn

- **H06–H17 entirely.** 12 hypotheses: `minRelayVersion` downgrade, rate-limit keying, recipient
  lookup of revoked devices, bootstrap single-use under concurrency, completion-proof leakage,
  retirement idempotence/wrong-device/clock-skew/receipt-durability, secret-migration fail-open.
- **H09 and H12 remain PARTIAL, not closed.** Untouched this session. Still read-level evidence only.
  H09's concurrency case (two simultaneous deliveries at generation N+1) is still unexamined.
- **No concurrency testing anywhere** in this phase.
- **`TEST_DATABASE_URL` is unset** in the shell. H08 and H16 are DB-backed; whether vitest loads it
  from `.env` was not determined. Not mocked — flagged instead.
- Compatibility-manifest signing, deferred to Phase 04 by the plan. Note it uses a **separate**
  `publicKeyFromHex` in `scripts/release-authority/release-authority-key-primitives.mjs`, and
  `compatibility-manifest-crypto.ts:37` feeds it a `delegatedPublicKeyHex` taken **from data**.
  Whether C3's low-order gap exists there too is unchecked — **Phase 04 should test it first.**
- No relay was started; nothing exercised against the live v9 relay.

## Files changed

MKTTool, test-only, 3 new files (listed above). **No production code modified.** Nothing committed or
pushed.

---

## Decisions taken (16 Aug, 09:35) — delegated to me, recorded here

### 1. C4 — FIXED. C2 and C3 deliberately deferred.

**C4 fixed** at `src/lib/tickets/relay-device-key.ts:73`. One condition in `normalizeRelayPublicKey`
rejecting a non-canonical encoding, covering all three enrollment paths at once. Rejects rather than
masks — masking would silently change a submitted identity.

Red-then-green: disabling the new guard turns **3 tests red**; restored, 19/19 green, stable over 3
consecutive runs. The C4 `it.fails` gate converted to a plain assertion, as designed.

**Side effect worth recording:** Ed25519 encodes the sign of x in bit 255 — the same bit X25519
ignores — so this guard now incidentally rejects **~half** of all Ed25519-pasted-as-X25519 mistakes.
That is a partial mitigation for the "undetectable" observation above, arrived at by accident. Both
halves are pinned in the test so the 50/50 split is never mistaken for flakiness.

**C2 and C3 deferred, and this is a reversal of my own earlier suggestion that they "ride along".**
Reasons, having tried to specify them:

- **C2 is not mechanically detectable in its general form.** My test asserted four "placeholder"
  seeds should be rejected, but an ascending counter has 32 distinct byte values — no simple entropy
  heuristic catches it, and a real one is unjustifiable complexity for a P3. The defensible guard
  covers only all-identical bytes, which is a fraction of the finding. The realistic risk is already
  controlled operationally (`.env.example` ships an empty value; a keygen script exists). Building a
  heuristic here would be inventing a control to satisfy a test I wrote too broadly.
- **C3's correct fix is a torsion-point blacklist**, which is easy to get subtly wrong and should be
  written **once**. There is a *second, separate* `publicKeyFromHex` in
  `scripts/release-authority/release-authority-key-primitives.mjs`, and
  `compatibility-manifest-crypto.ts:37` feeds it a `delegatedPublicKeyHex` taken **from data** —
  potentially a more reachable instance of the same gap than the one I found. Fixing the relay copy
  now would leave the release copy unfixed and create a false sense of closure. **Phase 04 should fix
  both with one shared helper.**

Both retest gates remain in the suite as `it.fails`, so either fix flips them red on arrival.

### 2. Phase 01 — CONTINUE, not bank-and-move.

The plan ranks Phase 01 as the only D4/P0-risk area besides Phase 02, and the hypotheses still open
are the ones it expects real risk in: retirement (H13–H17) and grant generations (H09–H12). Findings
so far are P2/P3, which is *weak evidence for* continuing, not against — the primitive layer was
expected to be the solid part, and it largely was. Stopping at 8/20 would leave the retirement
protocol, which has the most moving parts and the one-use-key design, entirely unexamined while
carrying a "crypto audited" label.

### 3. `TEST_DATABASE_URL` — available. H08 and H16 are closable.

The unset shell variable was a red herring. `vitest.config.mts:20-23` reads exactly that one variable
out of `.env` into `process.env`, and `.env` defines it. Verified by running
`relay-device-actions.database.test.ts`: **17 tests pass** against a live Postgres `_test` database.
The full 177-file suite includes the DB tests. No blocker; H08/H16 need no special handling.

## Gates after the fix

`tsc --noEmit` PASS · `eslint .` PASS 0 · `vitest` **1600 passed + 6 expected-fail / 177 files**.
`git diff --stat`: one file, +20 lines. Sabotage sweep clean.

**Language note (F15):** the new error message is English per `AGENTS.md:25`, consistent with the
Phase 00 F4 precedent, in a file whose existing messages are Vietnamese. F15 scoping is still
undecided; this follows the written rule.

## Unresolved questions

1. **Commit the C4 fix?** Not committed — `AGENTS.md` says do not commit unless asked. The change is
   one file, +20 lines, all gates green. Suggested message: `fix(tickets): reject non-canonical relay
   device public keys`.
2. **C3 in Phase 04, as decided above** — confirm that placement, since it means the relay-side gap
   stays open until then. The `it.fails` gate keeps it visible.
3. Carried, still open from Phase 00: **F6** token sealing decision, **F10** CI branch filter, **F15**
   language-rule scoping, retention of the remaining `local-test-artifacts/` archives, and **C1**
   domain-separation remediation appetite.
4. **Observation, unowned:** `handle-configure.ts:94` allows trust-root replacement on a live relay.
   Assigned to Phase 02 above, but it is a one-line guard if you want it sooner.
