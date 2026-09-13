# Browser 0.3.23 Release Readiness

Date: 2026-09-13

## Summary

Candidate `20260913-browser-0.3.23-relay-17-relay-payload-hash-fix-cft` is the cleanest Browser
candidate so far, but rollout remains **NO-GO**. Packaging, immutable publication, live route
read-back, and exact installer lifecycle checks pass. Exact engine activation and full clean-VM
acceptance remain open, so the operator tuple was not changed.

## Verified

| Gate | Result | Evidence |
|---|---|---|
| Source tuple | PASS | Browser `b0b5c8f57b3add2c45bf0b6dbbde7ad9d4a2aa65`; MKTTool `1fefe2cbc8babb5df52ff5971c941a1c144eefd9`; Relay 17 |
| Frozen-source seven-command quality | PASS | Exact candidate commits; receipt `quality-frozen-b0b5c8f-1fefe2c-r2/quality-receipt.json`, SHA-256 `d98053974e7266527f5db87fe68e81100d3c3d308c203fc4f985e9904eb6f53c` |
| Build A/B equivalence | PASS | 129 normalized files; `app.asar` byte-identical, 51,770,195 bytes |
| Exact installer | PASS | 146,056,721 bytes; SHA-256 `a0adfcc0727bd2241d32cad426e06931f64836d1e1f44786f0eb9a46504ba549` |
| CFT archive | PASS | 202,713,690 bytes; SHA-256 `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004` |
| Sequence 23 publication | PASS | Immutable R2 objects, full read-back; transition from sequence 22 |
| Sequence 24 publication | PASS | Immutable R2 objects, full read-back; direct transition from operator sequence 21 |
| Sequence 25 publication | PASS | Immutable R2 objects, full read-back; fresh-install transition from sequence 0 |
| Live sequence 23 routes | PASS | All five artifacts HTTP 200, exact size/SHA-256; `candidate-0.3.23/live-route-readback.json` |
| Live sequence 24 route | PASS | Manifest HTTP 200; installer HTTP 200, exact size/SHA-256 |
| Relay network token | PASS | `/api/relay/download/v17` full GET, 34,289,393 bytes, SHA-256 `d8bf25dcb446d779bd5461419ea7562044e280ac1d16592a71a52f156f6359cf` |
| Railway | PASS | Deployment online; active sequence 25; mapping `0 -> 25`, `21 -> 24`, `22 -> 23`; live manifest HTTP 200 |
| Exact clean-VM installer lifecycle | PASS (scope-limited) | Restored snapshot `326357d7-35b1-4c91-92ca-856fb0f35e9b`; clean `9/9`, repair `13/13`, uninstall `15/15`; bound receipts `childExitCode=0` |

Post-publication verification: Railway deployment `a4bbb73a-12c7-4a25-9c85-24bb4e505f83` is
`SUCCESS` on MKTTool commit `1fefe2c`; `/api/healthz` is HTTP 200 and the authenticated manifest
route returns sequence 25 with transition `0 -> 25`. The earlier claim that VBoxManage was absent
was incorrect: the executable exists at `C:\Program Files\Oracle\VirtualBox\VBoxManage.exe`.
The later installer-only runs below supersede the earlier no-VM-run checkpoint.

The sequence-24 publisher was re-run after the R2 `HEAD` fix. All seven existing immutable objects
were accepted and full GET/hash verification passed; no object was overwritten.

The first 0.3.23 VM bundle used a Windows PowerShell 5.1 process-wrapper defect that recorded
`childExitCode: null` even when the child matrix passed. The wrapper was corrected by retaining the
process handle before `WaitForExit`; the corrected bundle hash is
`d9b88489494523045fd0eb85c1f7ed41808d7c551888f890c30a29b769a0627d`. Clean, repair, and uninstall
were then rerun with the corrected wrapper. These receipts are local-only evidence and do not attest
the candidate or change publication/promotion state. The retained candidate descriptor and the exact
frozen-source quality receipt both bind Browser `b0b5c8f` and MKTTool `1fefe2c`; later Browser
`50a4c6c` and MKTTool `8a41e26` changes are documentation-only.

Evidence root: `local-test-artifacts/local-release-20260913/vm-gate/` (ignored, retained locally).
Each bound receipt has `releaseReady: false`; local raw hashes match its `rawEvidence.sha256`.

| Gate | Completed UTC | Bound receipt SHA-256 |
|---|---|---|
| Clean, 9/9 | 05:01:41Z | `0d2d3a4e5e08ff66aa117c24ea3b4d088fdee99002bb8d87a7354dd4dc376cbd` |
| Repair, 13/13 | 05:20:14Z | `89de8c9f5b740b1cbda2c74599ecfe100963dc8b9873089a2f6160383d484155` |
| Uninstall, 15/15 | 04:55:27Z | `a57bbc3441edd5af4ebea7d0db3272f7ef2711ee5f9341162eb2acf3ed1c3a3c` |

Earlier clean/repair wrapper failures remain historical failures; a later PASS does not rewrite
them. A repair retry carrying copied output files was rejected by the no-overwrite guard, not a
new repair result. The final fresh repair run above completed with exit 0. No real engine was
provisioned by these installer-only scripts. ACPI shutdown did not finish within the observed
window; the disposable VM was powered off at 05:26:54Z after collecting receipts. No host user
application was closed; the repaired guest is retained powered off, not a final fixture-cleanup PASS.

## Download Token And Security Follow-Up

At 05:28Z, a fresh 32-byte random release-download token replaced the production value and Windows
User-scope `MKTTOOL_RELEASE_TOKEN`. Railway deployment `20102b61-5db3-468b-935b-5143c1dbae43`
completed successfully on `8a41e263f6f2439883d2f3052bb21c7f0df3509f`. An old inherited process
environment still returned HTTP 401; explicitly refreshing from User scope returned HTTP 200,
34,289,393 bytes and exact Relay v17 SHA-256. Existing build shells must refresh their environment.
Health read-back at 05:34:52Z returned ready with database, release metadata and R2 OK.

The earlier diagnostic agent reported that a human-readable Railway variable listing printed
production secrets into tool output. Rotating the release-download token closes only that token's
exposure. Other exposed credentials have not been inventoried, rotated or revoked; this security
follow-up remains OPEN. Do not blindly replace vault/signing keys: preserve encrypted data and
enrolled-device trust with a coordinated recovery/rotation procedure. No secret values are in this
report or the documentation commits.

## Open / Blocking

- Exact installer on clean VM has not passed signed CFT activation, first-run engine behavior,
  packaged Relay lifecycle, or proxy failure/recovery. Lifecycle install/repair/uninstall now pass;
  prior cache test remains a synthetic fixture.
- Sequence 25 now covers fresh sequence-0 selection. The live route is verified, but exact installer
  activation remains unexercised.
- The publisher now tolerates R2 `HEAD` responses that report zero content length, relying on the
  required full GET/hash verification; regression test passes (14/14).
- Current disposable VM has a measured UTC clock-drift failure; host free RAM was about 1.4 GiB,
  below the safe reserve for a 4 GiB guest. No clock, ticket, Defender, or source gate was weakened.
- Machine-integration gate remains skipped for the fourth consecutive release.
- Unfamiliar-operator, second physical Windows PC, and seven-day canary remain unobserved.
- Installer remains unsigned; SmartScreen/UAC acceptance is not closed.
- Other credentials exposed by the earlier diagnostic output remain a security closeout blocker.
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
