# Phase 01 — make every relay's version visible to the server

**Priority:** blocking for the whole plan · **Status:** not started · **Gate to enter:** none

## Why this comes first

Phase 03 flips the server to a signature format that only Phase-02 relays understand. If one
enrolled machine is still behind, **every ticket it receives fails signature verification** — not
with "your relay is too old" but with "bad signature", because the signature is checked before
`minRelayVersion` is ever parsed. The operator sees the least useful error the system can produce.

So Phase 03 needs a yes/no answer to *"is every enrolled, non-revoked device on version ≥ N?"*, and
today nothing can answer it: `RelayDevice` (`prisma/schema.prisma:665`) stores name, owner, public
key, `createdAt`, `revokedAt` and retirement fields — **no version, no last-seen**.

This phase is worth doing on its own merits. The same answer is what "who still carries the unfixed
bridge?" needed during the audit, and it was answered by hand then.

## Requirements

- The server records the version a relay reports, and when it last reported.
- The version arrives on a path the relay already calls — do **not** add a heartbeat endpoint for
  this alone.
- ADMIN can see, in one place: device, owner, version, last seen, and whether it is behind
  `RELAY_VERSION`.
- Recording must not become an authentication signal. A self-reported version is a **hint for
  rollout planning**, never a security decision — anyone holding a device key can report any number.
  Say so in the schema comment, because the next reader will be tempted.

## Architecture

`RELAY_VERSION` (`src/lib/relay/relay-endpoints.ts:264`, currently `12`) is bumped by hand per
release and is already shared by both sides. The relay sends it; the server stores the last value
seen per device.

Candidate carriers, in order of preference — pick one, do not add a second:

1. **Ticket redemption / secret fetch.** The relay already calls the server on the paths in
   `RELAY_PATHS`. Adding a version header is the smallest change and needs no new route.
2. **Enrollment and re-enrollment** (`relay-enrollment-actions.ts`). Certain to be hit, but only at
   enrollment, so a machine that never re-enrolls never updates its number — too stale to gate a
   rollout on.

Option 1 is the recommendation. Option 2 alone is not sufficient.

## Related code files

- `prisma/schema.prisma` — add `reportedVersion Int?` and `versionSeenAt DateTime?` to `RelayDevice`
  (nullable and additive; a device that has not reported since the migration reads as unknown, which
  is the truth and must not be defaulted to `0` or to `RELAY_VERSION`).
- `src/lib/relay/relay-endpoints.ts` — the header name, declared beside `RELAY_VERSION` so both
  sides read one definition.
- `relay/src/main.ts` — send the header.
- The server route handling the chosen path — record it.
- A new ADMIN view, or a section on the existing devices screen.

## Implementation steps

1. Migration adding the two nullable columns. Reversible by two `DROP COLUMN`s.
2. Declare the header name next to `RELAY_VERSION`.
3. Relay sends it on the chosen path.
4. Server records `reportedVersion` and `versionSeenAt` on that request. Never fail the request
   because the header is missing or unparsable — an old relay does not send it, and this must not
   break the very machines it exists to find.
5. ADMIN view listing device, owner, version, last seen, behind-or-current.
6. Tests: reported version is stored; a missing header leaves the columns untouched and the request
   succeeds; a garbage header is ignored, not stored; the view flags a behind device.

## Todo

- [ ] Migration for the two columns
- [ ] Shared header constant
- [ ] Relay sends the header
- [ ] Server records it, tolerating absence
- [ ] ADMIN view
- [ ] Tests, including the missing-header and garbage-header paths

## Success criteria

Every enrolled non-revoked device that has done real work since the release shows a version, and a
deliberately old build shows as behind. **The rollout gate for Phase 03 is: no enrolled non-revoked
device shows `unknown` or a version below the Phase 02 release.**

## Risks

| Risk | Mitigation |
| --- | --- |
| A device that never does work shows `unknown` forever, stalling Phase 03 | That is the correct answer, not a bug. Retire or revoke genuinely dead devices before Phase 03 rather than defaulting them to "probably fine". |
| The version is mistaken for a trust signal | Schema comment states it is self-reported and unauthenticated. Never branch a security decision on it. |
| Recording adds a write to a hot path | Write only when the value changes, or when `versionSeenAt` is older than an hour. |

## Security considerations

Self-reported and unauthenticated by design. It plans a rollout; it must never gate access. The
existing `minRelayVersion` mechanism stays the enforcement path, because that number is chosen by the
**server** and travels inside a signed envelope.

## Next steps

Phase 02 once this is deployed and the fleet reads as fully known.
