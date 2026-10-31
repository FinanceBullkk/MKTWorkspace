# C1 / C5 — domain separation for the three prefix-less protocols

**Status:** planned, not started · **Created:** 17 August 2026 · **Trigger not yet fired**

The register defers C1's remaining half with a trigger: *the next time the ticket wire format
changes for any other reason.* This directory exists so that when the trigger fires the work is
already designed. **Do not start it just because the plan exists.**

## What is left, precisely

The server signing key signs six protocols. Two release authorizations (`compatibility update`,
`rollback`) already prefix the signed bytes with `"MKTTool … v1\n"`. The other three — **ticket**,
**grant authorization** (`delivery` / `bootstrap`), **device retirement authorization** — sign
`base64url(JSON(envelope))` with no prefix, sharing one byte space.

Since `6eb16f9` all three check an explicit, disjoint `kind`, so confusion is **checked, not
coincidental**, and there is no known reachable defect. What remains buys two things a prefix gives
and an in-payload field cannot:

1. the domain is checked **before** JSON parsing, so a foreign artifact never reaches the parser;
2. a future protocol gets separation **by construction** instead of by remembering — the ticket
   verifier is the standing proof that it gets forgotten, having omitted the check for the whole
   life of the codebase until 17 August 2026.

## Why this is a project and not a patch

All three protocols cross the server↔relay boundary: the server signs, the deployed `.exe` verifies.
Changing the signed bytes breaks every relay that has not updated, and the ticket signature is
verified **before** `minRelayVersion` is parsed — so the usual version-gate cannot soften it. The
rollout order is forced and cannot be shortened:

```
Phase 01  fleet version visibility        ← prerequisite, and today it does not exist
Phase 02  relays accept BOTH formats      ← relay release, RELAY_VERSION bump
Phase 03  server signs the new format     ← only after 100% adoption is *proven*
Phase 04  relays drop the legacy format   ← the security gain lands here, not before
```

**The blocking discovery:** `RelayDevice` (`prisma/schema.prisma:665`) has no version column, and
nothing reports a relay's version to the server. So there is no way to know when Phase 02 has
reached every machine — and Phase 03 without that knowledge is a blind switch that rejects every
ticket on any machine left behind. Phase 01 is not preparation; it is the thing that makes the rest
schedulable.

## The trap to keep in view

Phase 02 alone gains **nothing**: while both formats are accepted, the old one still works, so
cross-protocol separation is not improved until Phase 04. A migration abandoned at Phase 02 or 03
leaves permanent dual-verification complexity and no benefit. Either commit to all four or do none.

## Phases

| # | File | Gate to enter |
| --- | --- | --- |
| 01 | [phase-01-fleet-version-visibility.md](phase-01-fleet-version-visibility.md) | none — start here |
| 02 | [phase-02-relays-accept-both-formats.md](phase-02-relays-accept-both-formats.md) | Phase 01 shipped; fleet versions visible |
| 03 | [phase-03-server-signs-domain-separated.md](phase-03-server-signs-domain-separated.md) | every enrolled, non-revoked device shows the Phase 02 version |
| 04 | [phase-04-drop-legacy-acceptance.md](phase-04-drop-legacy-acceptance.md) | Phase 03 stable in production for one full working week |

## Key references

- `src/lib/tickets/server-key-cross-protocol-matrix.test.ts` — the 5×4 matrix; the authority on what
  is actually separated from what. **Read this, not a prose summary** — the register's prose summary
  of this property was wrong once already.
- `src/lib/tickets/ticket-verifier.ts` — `isKnownTicketKind` documents the current separation.
- `src/lib/release/compatibility-update-authorization.ts:8` — the domain-string convention to copy.
- Register rows C1, C5 in `../260816-0507-full-codebase-deep-audit/findings-register.md`.
