# Profile-manager owner handoff

Updated: 8 September 2026. Scope: Windows x64, one profile at a time, manual input.

## Current use boundary

MKTTool's shared Nick vault, Proxy vault, and Relay PC handoff are the delivered surface. Browser
startup is repaired in the technical candidate, but **normal fresh Browser use and distribution
remain blocked**. This is a profile/proxy manager, not proof of identity isolation or account safety.
Antidetect research and Lane C stay closed; `G2-IDENTITY=FAIL` remains historical evidence.

For current Web/Relay use, open **Setup**, use its authenticated Relay download, register the detected
PC, and follow its owner/administrator approval state. Keep proxy assignment with the administrator.
Relay readiness does not certify Browser readiness. Do not re-enable parked posting workflows.

Until the Browser gates close, use only administrator-led demonstrations with disposable profiles
and a dedicated test proxy. Do not enter real-account credentials or distribute this installer.
Stop on unknown ownership, missing activation, proxy rejection, or a setup conflict; do not bypass
checks, disable the firewall, or edit compatibility state by hand.

## Verified evidence

| Surface | Result and limit |
|---|---|
| MKTTool delivery | PR #68 merged as `46a99f2bc3c209fd3bc0b8943f60d217505b5295`; post-merge CI `34171586969`, deploy verification, Railway production, and secret scan `34171586987` PASS |
| Relay executable | PR check PASS; post-merge job policy-SKIPPED. These are distinct observations |
| Browser startup repair | Fresh serialized CIM queries avoid repeated shell-startup overhead; 15-second readiness, exact ownership, signed tickets, and proxy fail-closed checks are retained |
| Repaired directory package on VM | Two complete signed managed lifecycles PASS, including real guest reboot, reopen, failed-proxy refusal, and recovery. This is not the new installer's first-run test |
| Fresh settings | CFT is the default; explicit saved CFT/CloakBrowser choices survive. This selects an engine, not an activated release pin |
| Local Browser checks | 391 PASS / 1 intentional live-host SKIP; typecheck/lint PASS; critical coverage 91.48% lines / 84.23% branches / 91.39% functions; independent reviews found no issues |
| New local packaged fixture | 1/1 PASS in 6.395 seconds using explicit CFT `152.0.7977.64`; compatibility evidence only |
| New installer VM checks | Clean install 9/9, repair 13/13, initial and post-repair uninstall 15/15 each PASS on the exact artifact. Defender enabled; operator data/token/Relay state retained; no residual product/query processes, control listeners, product firewall rules or gate tasks |
| Normal installed first run | BLOCKED: without runtime/cache overrides, read-only runtime status reports CFT, no engine version, engine error, no active pin, and no CFT runtime |

The installed observation is Browser `0.3.13` / contract 4 at `2026-09-08T00:09:23.4261693Z`.
Its ASAR matches the candidate below. Receipt:
`local-test-artifacts/profile-manager-closeout-20260908/closeout-installed-runtime.json` in the
workspace. This confirms the first-run blocker on a real clean installation, not only in source.
Installer tests used restored snapshot `326357d7-35b1-4c91-92ca-856fb0f35e9b`; repair recorded no
threats or harness errors. Repair's successful shell/control-port launch is not engine readiness.

## Technical candidate

This local unsigned artifact is **not published, installed on the owner's host, or approved for
distribution**. Its location is for evidence and controlled VM testing, not a current install step.

| Item | Exact identity |
|---|---|
| Browser source | Commits `c7e17429e8ddb12fde54ac38e1a6f2373e86b7aa` and `36939cdd0b0989d4ed58bc272878e40c8d7bc20c`; tree `35a1dc6d91b6680dad02eb20b6e5849b4991e38d` |
| Installer path | `E:\MKTWorkspace\MKTBrowser\apps\desktop\release\installer\MKTBrowser-win-x64.exe` |
| Installer size / SHA-256 | 145149536 bytes / `50e4866055572651e7557d47eb11c0ada7557871eb75618499376f4c6dd7d615` |
| app.asar SHA-256 | `b36f3626a71c3514faae27533366ea9e95171588fef34327ed0be12f46acf828` |
| Browser EXE SHA-256 | `d0b2259365aa582f10424afd8f4a2775165f9ce808c183418e6f0617a9664cac` |
| Measured official CFT archive | `152.0.7977.64`; 202713690 bytes; SHA-256 `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004` |

The CFT archive is preparation evidence, not a signed or activated compatibility set. Browser,
Relay, engine, and hosted verification must be bound to the same release tuple before promotion.
Browser source `36939cdd` is pushed with local/remote parity `0/0`. No new Browser PR, CI trigger,
merge, publication, or owner-host installation occurred.

## Remaining actions

1. **Organization owner - artifact storage BLOCKED:** resolve shared Actions/Packages storage and
   billing access. Latest Browser run `34165090202` passed quality/build, failed upload, and skipped
   packaged-contract. Only about 56 KB of unexpired Browser artifacts were observed; expired
   artifacts do not prove live usage. The current organization-member session lacks `admin:org`.
   Retry only after the blocker changes; local or VM success cannot replace the hosted gate.
2. **Release implementation - normal first run BLOCKED:** provision and activate the reviewed signed
   compatibility set through the supported update path, then prove a clean installed launch. Fresh
   packaged engine provisioning requires a pin; the clean installed observation confirms it is absent.
   Repeated repair or changing the default cannot manufacture this missing activation. Preserve signature, pin, archive
   size/hash, and rollback checks; never instruct operators to hand-edit the pin.
3. **Verification - OPEN:** observe browser-page IP/DNS/WebRTC
   containment on the exact candidate; then run unfamiliar-operator acceptance and seven actual days
   of bounded manual canary. Dedicated proxy probes and earlier candidate passes do not close them.

## References

- [Current product roadmap](../../MKTTool/docs/development-roadmap.md)
- [Product scope and release boundary](../../MKTTool/docs/internal-beta-release.md)
- [VM startup repair evidence](../260908-0537-vm-browser-startup-fix/report.md)
- [Closeout plan](plan.md)
