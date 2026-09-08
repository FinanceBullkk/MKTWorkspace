# Profile-manager closeout - 8 September 2026

## Outcome

MKTTool Web/Relay handoff changes are merged and deployed. Browser startup repair and fresh CFT
defaults are committed and pushed, with an exact rebuilt technical installer. Normal fresh Browser
use remains BLOCKED: the installed application has no activated compatibility-set engine pin.
Browser CI artifact upload is still blocked by organization storage quota; no skipped gate is PASS.

## Git and deployment

| Repository | Action | Exact result |
|---|---|---|
| MKTBrowser | Two focused commits, pushed to `codex/profile-manager-scope` | `c7e17429e8ddb12fde54ac38e1a6f2373e86b7aa`, `36939cdd0b0989d4ed58bc272878e40c8d7bc20c`; tree `35a1dc6d91b6680dad02eb20b6e5849b4991e38d`; remote parity 0/0 |
| MKTBrowser | No PR/merge/release/CI rerun | Feature-branch push has no technical-workflow trigger; main unchanged |
| MKTTool | PR #68 merged | `46a99f2bc3c209fd3bc0b8943f60d217505b5295`; tree `67e30ce9765c7b8b1d0451740bd72c1ebb6a90b1` matched the green tested merge tree |
| MKTTool | Postmerge CI and production | Run `34171586969` SUCCESS; check/contracts/audit/deploy-verification PASS; secret scan `34171586987` PASS; Railway deployment `804ff207-7ec8-4421-b6c3-60adbc8e9167` succeeded |

MKTTool postmerge `relay-executable` was policy-SKIPPED; exact PR executable verification was PASS.
No separate manual deploy, vendor licence activation/purchase, production account test, or installer
publication occurred. No secrets or raw proxy/network observations were added to Git.

Final documentation delivery: MKTTool docs commit `402d520c`, integration commit `00b47b98`, and
docs-only PR #69 merged as `64fdb9f3cbbdfc1553210c247489751d39885d5c`. Secret scans `34173267249`
and `34173375831` PASS; technical CI intentionally not scheduled by the docs-only path policy.
Automatic Railway deployment `b808255c-70d3-407c-91d4-b0df95d64ccb` reached SUCCESS at
`2026-09-08T00:28:36Z` (GitHub deployment `6318287792`). Six workspace reports were committed and
pushed as `a423e30107d991369ee9659733bd331a9d82d7cc`. All three working branches had remote parity
0/0; only the unrelated root quota report remained untracked, unchanged. VM state verified poweroff.

## Source and local verification

- Startup worker reuses a short-lived PowerShell process, not its table. Each request performs fresh
  CIM; requests serialize; frames are bounded; failed/expired/idle workers retire. Exact repeated
  process/listener checks, 5/20-second query policy and 15-second operator readiness stay unchanged.
- Fresh/missing/unsupported settings select CFT. Explicit persisted engine choices are retained,
  load does not rewrite settings, and failed persistence does not replace the cached configuration.
  An activated compatibility set still controls engine selection as before.
- Independent startup and settings review: no findings (9/10 each). Review did not claim release
  approval. Late-child callback protection was inspected structurally; forced late-callback
  injection remains a test enhancement, not reported as measured behavior.
- Node 22.23.2: typecheck/lint PASS; installer suite 391 PASS, 0 FAIL, 1 intentional live-host SKIP;
  critical suite 121/121 PASS. Coverage: 91.48% lines / 84.23% branches / 91.39% functions; worker 100%.
- Packaging reran lint and the full installer suite, built successfully, and restored native modules
  and workspace links. Browser worktree remained clean.
- Exact installer-directory packaged runtime contract: 1/1 PASS, 6.395 seconds. This used the explicit
  CFT verifier fixture and its separate readiness budget, not normal installed first-run evidence.

## Exact technical tuple

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| Combined installer | 145149536 | `50e4866055572651e7557d47eb11c0ada7557871eb75618499376f4c6dd7d615` |
| Browser app.asar | 51745256 | `b36f3626a71c3514faae27533366ea9e95171588fef34327ed0be12f46acf828` |
| Browser EXE | 221933568 | `d0b2259365aa582f10424afd8f4a2775165f9ce808c183418e6f0617a9664cac` |
| Bundled Relay v16 archive | 33342752 | `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` |
| Control contract v4 | 153 | `b3d0b07981958b5f972da83f32f50475c8d95ccca005ce72525d0714a275dcaa` |
| Official CFT 152.0.7977.64 archive | 202713690 | `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004` |

Installer: `E:\MKTWorkspace\MKTBrowser\apps\desktop\release\installer\MKTBrowser-win-x64.exe`.
Unsigned and unpublished. Official engine archive obtained by full HTTPS GET from Google's
version-specific CFT endpoint; extracted EXE matches prior measured fixture
`79832d1e60cbad9323c07339f9608bc0ce93cb9242b9b5481c04a0c536720980`.
No signed compatibility manifest was created or activated. The CFT EXE's Authenticode result was
NotSigned; no signature validation is claimed.

## VM verification

VM: `mkt-phase5-clean`, 6144 MB / 2 CPUs. Saved previous powered-off fixture state as snapshot
`687672aa-4669-43ac-b48e-4aede79c3ead` before restoring clean Defender snapshot
`326357d7-35b1-4c91-92ca-856fb0f35e9b`. No user application was closed. Local heavy work finished
before VM startup. First boot SSH banner timeouts resolved once Windows finished starting.

| Check on new installer | Result |
|---|---|
| Clean install | PASS 9/9; no product or Node on PATH before installation; Defender enabled, no detections |
| Initial uninstall | PASS 15/15; profiles/token and unrelated Relay state preserved |
| Fresh-snapshot repair | PASS 13/13; deliberately damaged payload/shortcuts/registry restored; operator data retained |
| Post-repair uninstall/cleanup | PASS 15/15; zero product/query processes, control listeners, product firewall rules and gate tasks |
| Normal installed first-run | BLOCKED, directly observed |

At `2026-09-08T00:09:23.4261693Z`, authenticated read-only `get_runtime_info` from the normally
installed Browser returned `appVersion=0.3.13`, `contractVersion=4`, `engineKind=cft`,
`engineVersion=null`, `engineStatus=error`. No active pin and no CFT runtime existed. Installed ASAR
matched the table. No developer cache/runtime override or hand-edited activation was used.
The source rejects manifest resolution without a verified compatibility-set pin; the installer does
not provision it. Repeating Repair cannot supply an absent signed release.

Final cleanup at `2026-09-08T00:21:43.7540613Z` retained the disposable profile database and unrelated
Relay marker, left Defender enabled, and removed both one-shot repair/uninstall tasks. VM shut down
normally after receipts were copied to the host. Prior fixture snapshot remains recoverable.

Earlier startup-fix directory-package managed lifecycles remain separate PASS evidence: two runs,
including actual guest reboot, all six successful launches within normal 15-second readiness,
correlated broken-proxy rejection/recovery, exact cleanup. They do not replace current installed
network/engine activation evidence. See [startup report](../260908-0537-vm-browser-startup-fix/report.md).

## Remaining blockers and next action

1. **BLOCKED - hosted Browser gate:** run `34165090202` quality/build PASS, artifact upload FAIL,
   packaged-contract SKIPPED. Current Browser unexpired artifacts total only about 56 KB; expired
   archives are not live storage evidence. `FinanceBullkk` is an active organization member; billing
   usage access returns 404 plus missing `admin:org`. Organization owner must resolve shared
   Actions/Packages storage/access. No deletion or blind rerun performed this closeout.
   MKTTool has zero unexpired artifacts; Packages inventory returns 403, missing `read:packages`.
2. **BLOCKED - installed engine activation:** bind the exact CFT/Browser/Relay/control/installer set
   to successful hosted evidence, sign/publish through the existing release-authority workflow,
   activate through supported Relay update/repair, then prove fresh installed launch. Do not bypass
   signature/hash/pin/rollback checks or publish before the gate passes.
3. **OPEN - actual use acceptance:** exact browser-page IP/DNS/WebRTC containment, unfamiliar operator,
   second PC, and seven elapsed canary days. Dedicated proxy probe and isolated Relay-handler tests
   are not page egress or packaged Relay HTTP end-to-end evidence. Manual input only; no antidetect
   claim or identity research is reopened.

## Evidence location

Ignored machine receipts, exact archive, build log, packaging metadata and VM logs:
`E:\MKTWorkspace\local-test-artifacts\profile-manager-closeout-20260908\`.
Local test report: [validation](../reports/tester-260908-0651-closeout-local-validation.md).
Operator guidance: [owner handoff](owner-handoff.md).

Unresolved owner action: obtain organization-owner billing/storage access or resolve the storage
limit, so the required hosted Browser gate can run. Code authorization alone cannot grant that role.
