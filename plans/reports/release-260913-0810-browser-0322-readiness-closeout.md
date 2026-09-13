# Browser 0.3.22 Readiness Closeout

Date: 2026-09-13

## Verified actions

- Rotated the Relay download token and synchronized Railway production with the Windows User
  scope. After redeploy, authenticated `HEAD /api/relay/download/v17` returned HTTP 200 and
  34,289,393 bytes.
- A full authenticated GET was read back to `D:\mkt-release-evidence\relay-v17-network-readback-260913.zip`;
  it measured 34,289,393 bytes and matched Relay v17 SHA-256
  `d8bf25dcb446d779bd5461419ea7562044e280ac1d16592a71a52f156f6359cf`.
- Ran `fetch-pinned-relay.cjs` without `MKTTOOL_RELAY_ARCHIVE`; Relay v17 was fetched over HTTPS
  and passed the checked-in size and SHA-256 pin.
- The CFT archive is present at the pinned 202,713,690 bytes and SHA-256
  `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004`. The executable reports
  version `152.0.7977.64` and created a disposable profile on this host.
- A direct headless CFT smoke did not complete: the executable emitted a Windows sandbox access
  error and the wrapper held the session until it was stopped. This is OPEN evidence, not a
  first-run PASS.
- A fresh direct smoke on 2026-09-13 using the pinned CFT executable then reached DevTools in
  3.7 seconds and reported `Chrome/152.0.7977.64` on loopback. This closes only the standalone
  CFT process-start check; it does not prove Browser installer provisioning, proxy recovery or
  browser-page egress.

## Publication result

The signed sequence-22 manifest was validated locally and read back from the immutable R2 object
`MKTTool-Relay-v17-s22.compatibility.json` byte-for-byte (3,406 bytes,
SHA-256 `3d120c4fd6b5fd67fc4eaebfb1677fb6df219626e909700ddd482f9c21363e78`). The five sequence-22
artifact objects and revocations object were also preflighted and uploaded without overwriting the
older sequence-21 keys.

The namespace fix is committed in MKTTool `9472a77` and deployed to Railway deployment
`b3afd304-ce71-49b4-b4f2-54e55f6142b8`, with `RELAY_COMPATIBILITY_SEQUENCE=22`. Live checks passed:
the authenticated manifest route returns sequence 22 / Browser 0.3.22 / Relay 17, and a signed
artifact authorization returned HTTP 200 with the exact installer length (146,056,615 bytes).
The unscoped sequence-21 manifest remains readable directly from R2 for rollback.
The operator-approved tuple remains Browser 0.3.17 / Relay 17 / sequence 21; 0.3.22 is published
to the authenticated compatibility channel but intentionally not promoted.

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

- Complete real CFT first-run, proxy failure/recovery, unfamiliar-operator, second-PC and seven-day
  canary evidence. Same-host VM evidence does not close independent-hardware gates.
- The exact VM preflight still has a reproducible clock-drift failure. Use a stable second test
  machine or resolve the VM environment before attempting signed activation again.
- Authenticode signing, SmartScreen/UAC acceptance and machine-integration remain open. Signed
  compatibility metadata does not sign the Windows installer itself.
- Rotate any production credentials exposed by the earlier human-readable Railway variable listing;
  do not use that command again. The Relay download token itself has already been rotated.

## Resolved product decisions

- Keep Relay v17 and use sequence-scoped compatibility artifact keys. A Relay 18 cut is not needed
  for this candidate.
- Upgrade preserves the engine cache; uninstall removes it and preserves operator data. An explicit
  keep-engine uninstall option is deferred until a separate product decision.
