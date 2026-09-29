---
title: Clean VM Acceptance Terminal Report
observed_at: 2026-09-23T22:57:01.199+07:00
candidate_id: 20260922-browser-0.3.24-relay-18-fast-profile-reuse-cft
verdict: NO-GO
evidence_root: E:\MKTWorkspace\local-test-artifacts\local-release-20260922\pilot-0324-r3\guest-gate-r1
---

# Clean VM Acceptance Terminal Report

## Summary

- Final verdict: **NO-GO**. The frozen candidate was not rebuilt, promoted, published, deployed, or used with a real account.
- Normal Web-to-Relay acceptance remains **FAIL** because cold Relay health exceeded the browser's 4,000 ms timeout.
- Compatibility acceptance remains **FAIL** because ticket issuance succeeded but packaged Relay rejected pilot TLS while fetching the artifact.
- The one permitted `/profiles` diagnostic returned HTTP 400. Its response message remains **OPEN**; no retry or profile action occurred.
- Cleanup completed. The VM is powered off, task ports are closed, owned processes are gone, and disposable host paths were removed.

## Frozen Candidate

| Component | Pinned value |
|---|---|
| Candidate | `20260922-browser-0.3.24-relay-18-fast-profile-reuse-cft` |
| Browser source | `81f3014821c471b583a37fae0dd001d0e10f59ce` |
| Current Web source | `43b12a76b37d932b4e3ceb330e2897e4421b3b73` |
| Frozen Relay/tool source | `450975c0006d6804ea3b0044c25c4db77e8ee3d8` |
| Installer SHA-256 | `ba66883a6b9ce9dc75a93781cc9c7573927e7fb1b3f73c6e14069ace55e9cd45` |
| Browser SHA-256 | `681a829abe4a7a20695ad07a1db993946ebbb709011ff5f43d7d7078ece82878` |
| Relay SHA-256 | `fabb6ebbe4ec166662689487cd60114be5baefd88d93f65b4e7faf802fac44f4` |
| Control contract SHA-256 | `c44a41425f1b46444a2e8cb5074d8b64e3d93558fca3d07817cf4299d05336db` |
| Engine SHA-256 | `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004` |

The Browser and MKTTool repositories were read back clean at the Browser and Current Web commits above. The workspace documentation root remained dirty from pre-existing work and was not staged.

## PASS

- Candidate preflight and static readiness receipts passed and bind the exact candidate tuple. These are preparation checks, not promotion evidence.
- Compatibility signed-ticket issuance passed: one authorization audit matched the synthetic fixture registration. Artifact download did not pass.
- Diagnostic recovery corrected the UI interpretation: feedback hash `91607452b4155b6e00a3a7883267b78d6504ec0c9be0e138c5d5bdcf1e99bd51` maps to `relay-permission`, not `no-capacity`.
- Guest cleanup r8b passed: pilot CA absent from LocalMachine and CurrentUser, production-host mapping removed, owned Edge/debug state closed, pilot roots removed, and cleanup tasks absent.
- Host service terminal r6 and Edge tunnel terminal r3 passed; ports `38117`, `443`, and `19333` closed.
- Host fixture cleanup passed after the helper fix: two exact databases and two exact roles dropped, PostgreSQL PID 20820 stopped, port `55424` closed, and 18 validated paths totaling 3,686,473,096 bytes removed.
- Guest-OS shutdown fallback r4 passed without ACPI retry or hard power-off. VM `13b74869-d2e9-4df6-a043-d8c6b079db04` reached `poweroff`; snapshot `dde2d98e-72d7-466e-8339-fb6b9c552752` remained selected; shutdown task/helper self-cleanup was observed.
- Final independent read-back: ports `38117`, `443`, `19333`, `55424`, and `2222` have zero listeners; PIDs 20820 and 11452 are absent; no owned runtime process or `D:\mkttool-pilot-0324*` path remains.

## FAIL

- Normal Web-to-Relay gate: first health response was HTTP 200 after 5,064.978 ms, beyond the 4,000 ms product contract. A later 1,950.684 ms warm response does not supersede the cold failure.
- Compatibility gate: signed ticket issued, but packaged Relay rejected pilot TLS during artifact fetch. No Relay transition started; the current ticket was not retried.
- `/profiles` diagnostic: initial page request ended with status 0 after 4,729.6 ms; exactly one diagnostic request returned HTTP 400 after 3,449.4 ms. Recovery made zero network requests.
- Downstream profile UI gate did not become valid. No `Check again`, profile creation, or profile launch occurred.
- ACPI terminal stop r3 failed after three minutes: VM remained `running`, port `2222` remained open, and VBoxHeadless PID 11452 remained alive. The failure receipt is preserved.
- First host-fixture cleanup invocation failed before mutation because the strict-mode size helper accessed `.Sum` for an empty directory. The helper was changed to an explicit file loop, syntax-checked, dry-run over all 18 targets, then rerun successfully. No receipt was created by the pre-mutation failure.

## OPEN

- `/profiles` HTTP 400 response message and exact server-side cause. The original recorder rejected its incorrect `no-capacity` assumption before writing evidence.
- Human local-network permission prompt, unfamiliar-operator acceptance, and physical second-PC evidence.
- Production public-TLS compatibility path; pilot TLS failure does not prove production behavior.
- Browser-page proxy, DNS, and WebRTC containment; packaged two-process contention; profile failure/recovery; repair and uninstall lifecycle.
- Elapsed seven-day canary and explicit exact-tuple promotion approval.
- Root cause for VirtualBox ACPI power-button delivery being ignored by the Windows guest. Guest SYSTEM `shutdown.exe` proved a normal OS shutdown fallback only.

## Evidence

| Receipt | Status | SHA-256 |
|---|---|---|
| `host-candidate-preflight-r4.json` | PASS | `5d4ccdb340f88bc3c070ac986ee22dbeefbdb031fa12438ced5f771b7cbc7f84` |
| `guest-ui-health-timeout-contract-failure-r1.json` | FAIL | `d85e364284e6b49d4e9c1cb5e98fbc4bf646b34b5a3c7814dd349ad7dd60bfe3` |
| `guest-ui-compatibility-artifact-fetch-failure-r1.json` | FAIL | `6c877745f1e8139394eb833fe9961bfb6550c9c828621e7fa4078d8b4e9a4bf3` |
| `guest-ui-relay-profiles-probe-recovered-r1.json` | FAIL | `fc0077acb65959528688a7d9bfbc9f092c5c4133a8ac375e994ee4b379f28544` |
| `guest-pilot-cleanup-r8b.json` | PASS | `1d40bde90a7b2661b02c33de0f3bdaa29ac0e00280909650936bcac984b1e405` |
| `host-guest-services-terminal-r6.json` | PASS | `7943b86432d1f4e09e2825b211f1107caf88ecbd3cec54a325e4fca8e428531a` |
| `guest-edge-tunnel-terminal-r3.json` | PASS | `affc6bd089fa1f28ccdb0d1e4bf098a15e35445d4475e2b6e9bfcc157e259a50` |
| `host-pilot-fixture-cleanup-r1.json` | PASS | `bde6b5b757cfb5fa3871c291f7951897dcd37d95ff206d57fed048e19add17c1` |
| `clean-vm-stop-r3.json` | FAIL | `3a781b655e65bafb1775c512cd73addce0b8e60b2fe680135876d03ab55c70a3` |
| `clean-vm-stop-r4.json` | PASS | `e2866180c5b76d3a80909c3471f106503b7b7506fa3c9d5f055bdca17ff0d336` |

All listed receipt sidecars matched their receipt bytes during terminal verification.

## Actions Not Taken

- No compatibility ticket, preview, confirmation, `/profiles`, or permission retry.
- No `Check again` click, profile create/launch, installer rebuild, snapshot restore, or real-account action.
- No commit, push, deploy, publish, promotion, rollback, or release mutation.
- No fingerprint, identity-isolation, antidetect, or real-account-safety claim.

## Recommendations

1. Fix or redesign the cold Relay health contract, then freeze a new candidate and rerun the normal path from a restored clean snapshot.
2. Make packaged Relay trust the intended compatibility artifact TLS chain without weakening production TLS verification; freeze a new candidate before retest.
3. Add deterministic error capture for `/profiles` HTTP 400 before any further diagnostic request.
4. Diagnose VirtualBox ACPI delivery separately; keep guest SYSTEM shutdown as cleanup fallback, not acceptance proof for ACPI behavior.

## Unresolved Questions

- What exact response body and server-side validation produced the single `/profiles` HTTP 400?
- Why did VirtualBox accept `acpipowerbutton` while Windows remained running with no state-change timestamp?
