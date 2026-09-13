# Browser 0.3.22 Readiness Closeout

Date: 2026-09-13

## Verified actions

- Rotated the Relay download token and synchronized Railway production with the Windows User
  scope. After redeploy, authenticated `HEAD /api/relay/download/v17` returned HTTP 200 and
  34,289,393 bytes.
- Ran `fetch-pinned-relay.cjs` without `MKTTOOL_RELAY_ARCHIVE`; Relay v17 was fetched over HTTPS
  and passed the checked-in size and SHA-256 pin.
- The CFT archive is present at the pinned 202,713,690 bytes and SHA-256
  `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004`. The executable reports
  version `152.0.7977.64` and created a disposable profile on this host.
- A direct headless CFT smoke did not complete: the executable emitted a Windows sandbox access
  error and the wrapper held the session until it was stopped. This is OPEN evidence, not a
  first-run PASS.

## Publication result

The production compatibility manifest is sequence 21 for Browser 0.3.17. A signed sequence-22
manifest for Browser 0.3.22 was prepared and validated locally against the exact installer,
`app.asar`, Relay v17 archive, control contract and CFT archive. Publication was correctly refused
before any write because the immutable R2 object `MKTTool-Compatibility-v17-installer.artifact`
already exists with different bytes. The same v17 namespace therefore cannot publish a new Browser
payload while Relay remains v17.

No compatibility object, installer pointer, or operator tuple was overwritten. Browser 0.3.22
remains unpublished and unpromoted.

## Decisions

1. Engine cache survives an in-place upgrade and is removed by uninstall. Operator data survives
   both. This matches the current installer contract and avoids retaining a large executable after
   explicit removal; changing it needs a separate product decision.
2. Network Relay download is the supported build path. The cached archive remains an emergency
   fallback only, with immutable size and checksum verification.
3. The machine-integration test should run on a controlled VM fixture only after the fixture can
   exercise the same exact installer and real CFT bytes. Moving a test without adding that coverage
   would only remove a skip label.

## Remaining release blockers

- Resolve the immutable artifact namespace conflict: either release Relay 18 with a new v18
  namespace, or implement and review candidate/sequence-scoped artifact URLs and storage keys.
- Complete signed compatibility publication and exact-tuple operator promotion after that change.
- Complete real CFT first-run, proxy failure/recovery, unfamiliar-operator, second-PC and seven-day
  canary evidence. Same-host VM evidence does not close independent-hardware gates.
- Rotate any production credentials exposed by the earlier human-readable Railway variable listing;
  do not use that command again. The Relay download token itself has already been rotated.

## Unresolved questions

- Keep Relay v17 and change artifact namespace, or cut Relay 18 to preserve the current immutable
  route contract?
- Should a product uninstall offer an explicit "keep engine for faster reinstall" option?
