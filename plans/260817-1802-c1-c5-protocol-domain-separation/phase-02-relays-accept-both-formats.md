# Phase 02 — relays accept both the legacy and the domain-separated signature

**Priority:** high · **Status:** not started · **Gate to enter:** Phase 01 shipped, fleet versions
visible

## What this phase does, and what it deliberately does not

Each of the three verifiers learns to accept **either** `Ed25519(encoded)` (legacy) **or**
`Ed25519(DOMAIN ‖ encoded)` (new). Issuers are untouched: the server keeps signing legacy for the
whole of this phase.

**This phase gains no security.** While the legacy form is still accepted, a foreign artifact is
refused by the `kind` check exactly as it is today and no more. The gain arrives in Phase 04. Say
this out loud in the release notes, because a migration that stops here leaves permanent
dual-verification complexity in exchange for nothing.

## Key insight

The order is forced by which side breaks. Verifiers must be permissive **before** the signer changes;
the reverse order rejects every ticket on every machine simultaneously. Phase 02 is therefore the
only phase that is safe to ship without knowing the fleet state — and it is still worth having
Phase 01 first, because Phase 03 cannot be scheduled without it.

## Domain strings

Copy the convention already in use at `src/lib/release/compatibility-update-authorization.ts:8` —
human-readable, versioned, terminated by a newline. The leading space-and-newline shape is what keeps
these byte-disjoint from any base64url string:

```
"MKTTool ticket v1\n"
"MKTTool grant authorization v1\n"
"MKTTool device retirement authorization v1\n"
```

Three distinct strings. Do **not** derive them from an enum or build them by concatenation — a domain
separator assembled at runtime is one refactor away from two protocols computing the same string.

## Architecture

Add one shared helper rather than three copies — three copies of a security check is the C1 pattern
repeating itself:

```
src/lib/crypto/domain-separated-signature.ts
  signWithDomain(domain, encoded, privateKey): string
  verifyWithDomain(domain, encoded, signature, publicKey): boolean
  verifyWithDomainOrLegacy(domain, encoded, signature, publicKey): "domain" | "legacy" | false
```

`verifyWithDomainOrLegacy` returns **which** form matched, not just a boolean, so Phase 03 and 04 can
count legacy acceptances in the logs and prove the legacy path has gone quiet before removing it.

## Related code files

- `src/lib/crypto/domain-separated-signature.ts` — new.
- `src/lib/tickets/ticket-verifier.ts` — the `verify(...)` call.
- `src/lib/relay/enrollment/grant-authorization.ts` — `verifyGrantAuthorization`.
- `src/lib/relay/retirement/device-retirement-authorization.ts` — `verifyDeviceRetirementAuthorization`.
- `src/lib/relay/relay-endpoints.ts` — bump `RELAY_VERSION` to 13.
- `src/lib/tickets/server-key-cross-protocol-matrix.test.ts` — extend the matrix to both forms.

## Implementation steps

1. Write the helper with its own unit tests first: a domain signature verifies under its own domain
   and **fails under every other domain**, and the legacy form fails `verifyWithDomain` outright.
2. Route the three verifiers through `verifyWithDomainOrLegacy`.
3. Log at INFO when the legacy branch matches, with the protocol name and no envelope contents. This
   log is the Phase 04 entry gate; without it, "the legacy path is quiet" is a guess.
4. Extend the 5×4 matrix so every artifact is built in **both** forms — 10×4. Cross-protocol
   rejection must hold for the domain form too, and this is where a copy-pasted domain string would
   be caught.
5. Bump `RELAY_VERSION` to 13. Ship the relay release.

## Todo

- [ ] `domain-separated-signature.ts` + unit tests
- [ ] Three verifiers routed through it
- [ ] Legacy-branch INFO log, no envelope contents
- [ ] Matrix extended to both forms
- [ ] `RELAY_VERSION` → 13
- [ ] Relay release published and rolled out

## Success criteria

Every existing test passes untouched — the server is still signing legacy, so a green suite after
this phase means the legacy path is intact. New tests prove the domain form is accepted and that a
signature made under one domain is rejected under the other two.

## Risks

| Risk | Mitigation |
| --- | --- |
| A permissive verifier is a weaker verifier | Legacy acceptance is time-boxed by Phase 04 and its use is logged. The entry gate to Phase 04 is a silent log. |
| The two domain strings for two protocols end up equal after a refactor | Three literal constants, never derived. Matrix asserts cross-domain rejection. |
| Migration stalls here | `plan.md` names this explicitly; the release note must state that no security is gained until Phase 04. |

## Security considerations

Verification surface grows for the duration of the migration. Nothing else changes: the same key, the
same envelopes, the same `kind` checks. No issuer changes in this phase — if a diff in this phase
touches an `issue*` function, it belongs to Phase 03.

## Next steps

Phase 03 once every enrolled non-revoked device reports version ≥ 13.
