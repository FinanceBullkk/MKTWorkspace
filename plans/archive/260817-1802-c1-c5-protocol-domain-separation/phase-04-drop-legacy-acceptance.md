# Phase 04 — drop legacy acceptance; the security gain lands here

**Priority:** high — without it the migration was pure cost · **Status:** not started
**Gate to enter:** Phase 03 stable in production, legacy-branch log silent for one full working week

## Why this phase is the point

Phases 01–03 buy nothing on their own. While a relay still accepts an unprefixed signature, an
artifact from another protocol is refused only by the `kind` check — exactly today's position.
Removing legacy acceptance is what turns domain separation from a field every verifier must remember
to check into a property of the bytes.

A migration abandoned here is worse than never starting: permanent dual-verification code, a
`RELAY_VERSION` burned, and no gain.

## Requirements

- All three verifiers accept the domain form **only**.
- `verifyWithDomainOrLegacy` and its legacy log are deleted, not left unused — a permissive helper
  sitting in the tree is one autocomplete away from being called again.
- `RELAY_VERSION` bumped to 14; relay release published and rolled out.

## Key insight

After this phase a legacy-signed artifact is refused **before** JSON parsing. That is the second
thing a prefix buys and an in-payload field cannot: a foreign artifact never reaches the parser at
all. Worth stating in the module comment, because the `kind` checks stay in place afterwards and a
later reader will otherwise ask why both exist. Both exist because they fail at different depths, and
the shallower one is the one you want firing.

## Related code files

- `src/lib/crypto/domain-separated-signature.ts` — delete `verifyWithDomainOrLegacy`.
- The three verifiers — call `verifyWithDomain`.
- `src/lib/tickets/server-key-cross-protocol-matrix.test.ts` — legacy artifacts move from "accepted"
  to "rejected"; keep them in the matrix as rejection cases rather than deleting them, so the file
  still records that this form once existed and is now refused.
- `src/lib/tickets/ticket-verifier.ts` — keep `isKnownTicketKind`. It is defence in depth now rather
  than the only separation, and removing it would trade one guard for another instead of keeping two.
- `src/lib/relay/relay-endpoints.ts` — `RELAY_VERSION` → 14.

## Implementation steps

1. Confirm the gate: legacy-branch log silent for one working week, and the fleet view shows every
   enrolled non-revoked device at ≥ 13.
2. Remove the legacy branch and its log.
3. Flip the matrix: every legacy-form artifact becomes a rejection case.
4. **Sabotage-verify**: restore legacy acceptance locally, watch the new rejection cases go green
   again, restore, confirm red, `git status`. A rejection test that never passed for the wrong reason
   proves nothing.
5. `RELAY_VERSION` → 14; publish; roll out.
6. Update `docs/project-changelog.md` — this is the phase where "the three protocols are now
   separated at the signature, not only by a field inside it" becomes true.
7. Close C1 and C5 in the register, and delete the trigger, which will have fired.

## Todo

- [ ] Gate confirmed: silent log + full fleet at ≥ 13
- [ ] Legacy branch and log removed
- [ ] Matrix flipped to rejection cases
- [ ] Sabotage-verified
- [ ] `RELAY_VERSION` → 14, released, rolled out
- [ ] Changelog and register updated; C1/C5 closed

## Success criteria

A legacy-signed artifact is rejected by all three verifiers, proven by the matrix, and rejected
**before** parsing. Every ticket kind still works on a real machine. The register's C1 and C5 rows
close with no trigger left behind.

## Risks

| Risk | Mitigation |
| --- | --- |
| A device that was quiet for a week — on leave, spare laptop — reappears on the old build | The fleet view, not the log alone, is the gate: `unknown` or `< 13` blocks this phase. Retire genuinely dead devices first rather than counting them as absent. |
| Legacy acceptance is removed from the helper but a caller still passes through it | Delete the function, do not deprecate it. A compile error is the cheapest possible reminder. |
| The changelog claims the gain at Phase 02 or 03 | Only this phase's step 6 writes that sentence. |

## Security considerations

This is the phase that changes the security posture, and the only one whose changelog entry should
say so. After it: six protocols, six domains, separation enforced at the signature. `kind` checks
remain as the second layer.

## Next steps

None. C1 and C5 close here. If a seventh protocol is ever added, it signs through `signWithDomain`
with its own literal domain string, and the matrix grows by one row.
