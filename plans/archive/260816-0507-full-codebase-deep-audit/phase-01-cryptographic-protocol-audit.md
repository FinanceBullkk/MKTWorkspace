# Phase 01 — Cryptographic Protocols

Depth: **D4 (executable proof)** · Priority: P0-risk area · Status: Completed · Effort: 2–3 full sessions

Execution result: 20 of 20 hypotheses closed or subsumed by a recorded finding, with D4 evidence.
See [`audit-260816-1015-phase-01-complete.md`](../reports/audit-260816-1015-phase-01-complete.md)
and [`findings-register.md`](./findings-register.md).

## Context

- 16 Aug pass reviewed `ticket-verifier.ts` and `credential-encryption.ts` only. Everything else here
  is unread.

## Why D4

This is a bespoke protocol family — ticket issue/verify, operator-key grant with generations, device
retirement with a one-use finalization key and recipient-only completion proof. There is no standard
to diff against, and every failure mode is silent: a replayable grant, a missing domain separator, a
skew window that accepts future-dated authorizations — none of these break a happy path. They only
show up when someone looks, or when someone attacks.

The existing tests here are real (`grant-authorization.test.ts`, `device-retirement-authorization.test.ts`,
`device-retirement-finalization.test.ts`, `ticket-lifecycle.test.ts`). The question is not *are there
tests* — it is *do they encode the adversary*. That question is only answerable by writing the
adversarial cases and seeing whether they already fail.

## Scope — file inventory

**Ticket core** (MKTTool `src/lib/tickets/`, 12 non-test files):
`ticket-types.ts` 218 · `relay-device-actions.ts` 330 · `relay-device-key.ts` 187 ·
`ticket-recipient-lookup.ts` 174 · `ticket-verifier.ts` 150 (read) · `server-signing-key.ts` 138 ·
`ticket-sealed-box.ts` 128 · `relay-enrollment-actions.ts` 108 · `ticket-rate-limit.ts` 73 ·
`ticket-issuer.ts` 69 · `ticket-replay-guard.ts` 57 (read)

**Enrollment / grant** (`src/lib/relay/enrollment/`, `src/lib/enrollment/`):
`operator-key-delivery-actions.ts` 183 · `bootstrap-actions.ts` 125 · `grant-authorization.ts` 118 ·
`operator-key-completion.ts` 34 · `grant-digests.ts` 11

**Retirement** (`src/lib/relay/retirement/`, `src/lib/retirement/`):
`relay-device-retirement-actions.ts` 302 · `device-retirement-authorization.ts` 119 ·
`device-retirement-finalization.ts` 71 · `device-retirement-finalization-key.ts` 33

**Relay side** (`relay/src/`): `handle-ticket.ts` · `handle-receive-operator-key.ts` ·
`handle-seal-operator-key.ts` · `handle-authorize-bootstrap.ts` · `handle-retire-device.ts` ·
`handle-finalize-device-retirement.ts` · `device-retirement.ts` · `device-retirement-receipt.ts` ·
`device-retirement-recovery-server.ts` · `grant-completion-proof.ts` · `operator-grant-state.ts` ·
`bootstrap-authorization.ts` · `secret-migration.ts`

## Key insights carried in

- `verifyTicket` returns `payload` **unchecked** by design; each caller runs `reviewTicketPayload(kind, …)`.
  Correct pattern, but it means kind-confusion safety lives at every call site, not at one choke point.
- Replay guard is in-memory and documented as an accepted trade-off against a 30 s ticket lifetime.
  The trade-off is only sound if the lifetime is actually 30 s — unverified.
- `grant-digests.ts` at 11 lines suggests domain separation exists. Verify it is applied to **every**
  signed message, not just grants.
- One Ed25519 server signing key appears to sign tickets, grant authorizations, retirement
  authorizations, rollback authorizations, and compatibility manifests. Key reuse across five protocols
  is safe **only** with strict domain separation on every message.

## Attack hypotheses — written before reading

Each becomes a test. H-numbers carry into the findings register.

**Signing and domain separation**
- H01 A message valid in protocol A verifies in protocol B (ticket envelope accepted as a grant
  authorization, or rollback authorization accepted as compatibility update). Root cause would be a
  missing or non-injective domain prefix.
- H02 Domain prefix is concatenated without a length delimiter, so `"grant" + "1abc"` collides with
  `"grant1" + "abc"`.
- H03 Signature verified over a re-serialized object rather than received bytes anywhere outside
  `ticket-verifier.ts` (which does it correctly) — enables JSON canonicalization mismatch.

**Ticket lifecycle**
- H04 `TICKET_LIFETIME_MS` is materially longer than the 30 s the replay-guard rationale assumes.
- H05 A CREDENTIAL ticket is accepted at `/ticket` (profile launch), or a PROFILE ticket at
  `/secret/reveal`. `handle-secret` filters kind; confirm `handle-ticket` does too.
- H06 `minRelayVersion` can be downgraded — an old relay accepts a ticket meant for a newer one.
- H07 Rate limit (`ticket-rate-limit.ts`) is in-memory per-process and resets on redeploy, or is keyed
  such that one actor can exhaust another's budget.
- H08 `ticket-recipient-lookup` returns a recipient key for a revoked device.

**Grant generations**
- H09 A grant authorization from generation N is accepted after rotation to N+1 (generation not
  compared, or compared non-strictly).
- H10 `bootstrap.consume()` is not single-use under concurrency — two simultaneous
  `/set-operator-key` calls both consume one completion.
- H11 `completionProof` is verifiable by anyone rather than recipient-only, leaking that a specific
  device completed bootstrap.
- H12 `grantHash` does not bind the device id + public key, so a valid grant is replayable at a
  different device.

**Retirement**
- H13 `finalize` is not idempotent, or is replayable after the one-use seed is erased — stranding
  cleanup retry (the plan explicitly claims this is handled; prove it).
- H14 Retirement authorization for device A is accepted by device B.
- H15 `DEVICE_RETIREMENT_CLOCK_SKEW_MS` is applied symmetrically, accepting future-dated
  authorizations far beyond issue time.
- H16 Retirement receipt is written before revocation is durable, so a crash between them leaves the
  server believing the device is live while the device has erased its credentials.
- H17 `secret-migration.ts` fault points leave partially-migrated state that fails open.

**Key handling**
- H18 `server-signing-key.ts` accepts a short or low-entropy seed (mirror of the
  `MIN_RELEASE_DOWNLOAD_TOKEN_LENGTH` guard that `release-download-token.ts` gets right).
- H19 `relay-device-key.ts` accepts a malformed or attacker-chosen X25519 public key — no SPKI prefix
  check, or a small-order/identity point accepted.
- H20 `ticket-sealed-box.ts` reuses an ephemeral key across seals, or omits authenticated associated
  data binding the seal to the envelope.

## Method

1. Write H01–H20 as failing-first tests before reading implementations.
2. Read the area D2 in dependency order: types → digests → issuer → verifier → grant → retirement →
   relay handlers.
3. Revise hypotheses from what reading reveals. New hypotheses go through the same write-test-first loop.
4. For each hypothesis: test goes red on a deliberately broken copy of the code, then green on the
   real code. A test that cannot be made red is not testing anything — rewrite it.
5. Cross-protocol matrix: attempt every signed artifact against every verifier. Table of 5×5 outcomes.

## Todo

- [x] Write H01-H20 as tests
- [x] D2 read of ticket core
- [x] D2 read of enrollment/grant
- [x] D2 read of retirement
- [x] D2 read of relay handlers
- [x] Cross-protocol signature matrix
- [x] Red-then-green verification of every new test
- [x] `plans/reports/audit-260816-1015-phase-01-complete.md`

## Success criteria

- Every hypothesis is either a finding with a reproduction, or a committed test that stays green.
- The 5×5 cross-protocol matrix is complete, with domain separation proven per cell.
- No hypothesis is closed by reading alone.

## Security considerations

Tests use synthetic keys only. No real device identity, no operational database, no key material in
fixtures or reports. Any finding written up gets a reproduction that does not embed a working secret.

## Risks

- **Reading-first bias.** The strongest defence is that hypotheses are written before reading. Hold
  that order even when it feels wasteful.
- **False confidence from green tests.** A test that never went red is a decoration. The red-then-green
  step is mandatory, not a formality.
- **Scope creep into Phase 04.** Compatibility manifest signing touches the same key; leave it to
  Phase 04, only note the domain-separation result here.

## Next

Phase 02. If H01/H02 land as findings, Phase 04 inherits them — the same key signs manifests.
