# Browser 0.3.23 Release Readiness

Date: 2026-09-13

## Summary

Candidate `20260913-browser-0.3.23-relay-17-relay-payload-hash-fix-cft` is the cleanest Browser
candidate so far, but rollout remains **NO-GO**. Packaging, immutable publication, and live route
read-back pass. Exact engine activation and clean-VM acceptance remain open, so the operator tuple
was not changed.

## Verified

| Gate | Result | Evidence |
|---|---|---|
| Source tuple | PASS | Browser `b0b5c8f`; MKTTool `cc29725`; Relay 17 |
| Frozen-source seven-command quality | **OPEN** | No retained 0.3.23 quality receipt; targeted contract tests pass |
| Build A/B equivalence | PASS | 129 normalized files; `app.asar` byte-identical, 51,770,195 bytes |
| Exact installer | PASS | 146,056,721 bytes; SHA-256 `a0adfcc0727bd2241d32cad426e06931f64836d1e1f44786f0eb9a46504ba549` |
| CFT archive | PASS | 202,713,690 bytes; SHA-256 `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004` |
| Sequence 23 publication | PASS | Immutable R2 objects, full read-back; transition from sequence 22 |
| Sequence 24 publication | PASS | Immutable R2 objects, full read-back; direct transition from operator sequence 21 |
| Live sequence 23 routes | PASS | All five artifacts HTTP 200, exact size/SHA-256; `candidate-0.3.23/live-route-readback.json` |
| Live sequence 24 route | PASS | Manifest HTTP 200; installer HTTP 200, exact size/SHA-256 |
| Relay network token | PASS | `/api/relay/download/v17` full GET, 34,289,393 bytes, SHA-256 `d8bf25dcb446d779bd5461419ea7562044e280ac1d16592a71a52f156f6359cf` |
| Railway | PASS | Deployment online; `RELAY_COMPATIBILITY_SEQUENCE=24` |

The sequence-24 publisher was re-run after the R2 `HEAD` fix. All seven existing immutable objects
were accepted and full GET/hash verification passed; no object was overwritten.

## Open / Blocking

- Exact installer on clean VM has not passed signed CFT activation, first-run engine behavior,
  packaged Relay lifecycle, or proxy failure/recovery. Prior cache test used a synthetic fixture.
- The publisher now tolerates R2 `HEAD` responses that report zero content length, relying on the
  required full GET/hash verification; regression test passes (14/14).
- Current disposable VM has a measured UTC clock-drift failure; host free RAM was about 1 GiB,
  below the safe reserve for a 4 GiB guest. No clock, ticket, Defender, or source gate was weakened.
- Machine-integration gate remains skipped for the fourth consecutive release.
- Unfamiliar-operator, second physical Windows PC, and seven-day canary remain unobserved.
- Installer remains unsigned; SmartScreen/UAC acceptance is not closed.
- Operator promotion remains **NO-GO**. The approved operator tuple is still Browser `0.3.17` /
  Relay `17` / sequence `21`.

## Product decisions

1. Engine cache survives in-place upgrade.
2. Uninstall removes engine cache but retains operator/profile data.
3. Network Relay download is the supported build path; cached archive is emergency fallback only.
4. Machine-integration may move into the exact VM fixture only when the same real installer and CFT
   bytes are exercised; relabeling a synthetic test is not evidence.

## Next required action

Use a stable second Windows test machine (or restore the VM after resolving clock/resource limits),
run the exact retained installer through signed activation and proxy failure/recovery, then perform
the owner-operated/unfamiliar-operator and canary checks. Do not promote before those receipts exist.

## Unresolved questions

- Which independent Windows machine will host the exact acceptance run?
- Who will perform the unfamiliar-operator walkthrough and start the seven-day canary?
