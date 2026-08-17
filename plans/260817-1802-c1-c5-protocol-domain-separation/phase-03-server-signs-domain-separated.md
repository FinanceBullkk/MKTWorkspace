# Phase 03 — the server signs the domain-separated form

**Priority:** high · **Status:** not started · **Gate to enter:** every enrolled, non-revoked device
reports version ≥ 13 (Phase 01 gives the answer; Phase 02 sets the number)

## The one irreversible-feeling step, and why it is not

This is the phase that can stop the whole team working. It is also the only one with a clean
rollback, **provided the gate was honoured**: every Phase-02 relay accepts both forms, so reverting
the server to legacy signing restores service immediately. The rollback is a redeploy of the previous
server build — no relay touched, no reinstall, no data migration.

That safety net exists **only** if every machine really is on version ≥ 13. A single device left
behind does not degrade; it stops entirely, with `BAD_SIGNATURE` on every ticket. Do not enter this
phase on "probably everyone".

## Requirements

- All three issuers sign `DOMAIN ‖ encoded` using the Phase 02 helper.
- No envelope contents change. Only the bytes fed to `sign()` change.
- Deploy during working hours with the team reachable — an evening deploy means finding out at 9am.

## Related code files

- `src/lib/tickets/ticket-issuer.ts` — the `sign(...)` call.
- `src/lib/relay/enrollment/grant-authorization.ts` — `issueGrantAuthorization`.
- `src/lib/relay/retirement/device-retirement-authorization.ts` —
  `issueDeviceRetirementAuthorization`.
- No relay file changes in this phase. A diff touching `relay/` belongs elsewhere.

## Implementation steps

1. **Re-check the gate the day of.** Not the week before — a machine can be rebuilt from an old
   installer in between.
2. Route the three issuers through `signWithDomain`.
3. Update the matrix so artifacts are minted in the domain form by default, keeping the legacy-form
   cases as explicit acceptance tests until Phase 04 removes them.
4. Deploy. Watch the Phase 02 legacy-branch log: it should fall to zero. **Anything still arriving on
   the legacy branch after this deploy is a machine that did not update** — the log names the
   protocol; find the device before Phase 04.
5. Exercise one ticket of each kind end to end on a real machine. `CREDENTIAL` and `OTP` are the
   everyday paths; `LAUNCH_PROFILE` and `CREATE_PROFILE` need MKT Browser; `COMPATIBILITY_UPDATE`
   needs a staged compatibility set.

## Todo

- [ ] Gate re-checked on the day
- [ ] Three issuers switched
- [ ] Matrix updated, legacy cases retained
- [ ] Deployed in working hours
- [ ] Legacy-branch log confirmed at zero
- [ ] One ticket of each kind exercised on a real machine

## Success criteria

Every ticket kind works on a real relay, and the legacy-branch log is silent for a full working day.
Silence is what licenses Phase 04; a green test suite does not, because the suite never runs an
un-updated relay.

## Risks

| Risk | Mitigation |
| --- | --- |
| A device was missed and now cannot work at all | The gate. If it happens anyway: redeploy the previous server build, service returns at once, then update the device. |
| A device is rebuilt from an old installer mid-migration | Re-check the gate on the day; keep watching the legacy log after the deploy rather than declaring victory on deploy. |
| Retirement or bootstrap breaks unnoticed | These run rarely, so an ordinary day proves nothing about them. Exercise one enrollment and one retirement deliberately. |

## Security considerations

The security property still is not gained here — the legacy path remains open on the relay side.
Phase 03 is what makes Phase 04 possible. Resist writing "domain separation shipped" in the changelog
until Phase 04 lands; that sentence would be false and would be believed.

## Next steps

Phase 04 after one full working week of silence on the legacy branch.
