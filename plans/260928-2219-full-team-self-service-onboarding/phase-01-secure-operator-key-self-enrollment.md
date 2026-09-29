---
phase: 1
title: "Secure operator-key self-enrollment"
status: pending
priority: P1
effort: "4-6h"
dependencies: []
---

# Phase 1: Secure operator-key self-enrollment

## Overview

Extend the existing local bootstrap ceremony into owner-authorized self-enrollment. A wrong key
must never create server-side Ready state; the plaintext key must never leave loopback or appear in
logs, database rows, action payloads, or test output.

## Requirements

- Functional: an allowlisted user can authorize only their own active, unready Relay PC.
- Functional: Relay validates/stores the key locally and returns a domain-separated fingerprint
  with the existing recipient-only completion proof.
- Functional: server commits Ready only when proof, generation, ownership, expiry, and fingerprint
  all match; retries are idempotent and a wrong key remains retryable.
- Non-functional: preserve signed authorization, X25519 recipient binding, DPAPI storage, CORS,
  retirement, revocation, and admin sealed-grant paths.

## Architecture

`/setup` mints a five-minute authorization for the signed-in device owner. Local Relay accepts the
authorization, enables its own key form, stores the entered key in protected grant state, and
returns `{ grantId, generation, proof, keyFingerprint }`. MKTTool Web forwards no key; the server
compares the fingerprint with its configured verifier under the existing transaction lock.

## Related Code Files

- Create: `MKTTool/src/lib/crypto/operator-key-fingerprint.ts`
- Modify: enrollment actions/tests, Relay bootstrap handlers/state/tests, shared endpoint contracts,
  setup state machine, `.env.example`, security/architecture docs.

## Implementation Steps

1. Add one canonical key parser and domain-separated fingerprint function shared by server and Relay.
2. Add strict environment loading for `VAULT_KEY_OPERATOR_FINGERPRINT`; never fall back to
   `VAULT_KEY_OPERATOR` on the server.
3. Change bootstrap authorization/completion to `guardedAction`, enforce exact owner/device state,
   remove the first-device/admin restriction, and compare fingerprints before Ready commit.
4. Include the fingerprint in immediate and cached Relay completion responses without persisting it
   separately or printing it on the status page.
5. Keep admin sealed delivery unchanged; add wrong-key, cross-owner, revoked, expired, replay,
   idempotency, and missing-config regression tests.

## Success Criteria

- [ ] Operator can complete their own PC with the correct locally pasted key.
- [ ] Wrong key, wrong owner, stale generation, revoked/retiring device, or missing verifier cannot
      mark the PC ready.
- [ ] Plaintext operator key remains local-only and secret scans/tests pass.
- [ ] Existing admin grant and first-device recovery behavior remains compatible or is explicitly
      migrated with focused coverage.

## Risk Assessment

Main risk is false Ready state or accidental server key exposure. Mitigate with a single shared
derivation, constant-time comparison, owner checks inside the transaction, no secret logging, and
negative database tests before UI work.
