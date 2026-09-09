# Browser Candidate Checkpoint

## 9 September Addendum

Build B packaging and normalized comparison are complete: 129 files, zero differences, same
payload digest as A. Raw outer EXEs differ. Exact A is retained unchanged at
`D:/mkt-single-entry-20260908/candidate/installer.exe`.
Release identity: `20260909-browser-0.3.13-relay-16-single-entry-5ff43b2`; embedded Browser 0.3.13,
Relay v16 and CFT 152.0.7977.64. Signed sequence 17 authorizes a fresh transition from 0 only.

Exact clean VM install passes 9/9, separate fresh 1-vCPU repair 13/13 and uninstall 15/15 pass,
and bounded close-to-tray, absent-Relay startup and cold-login service startup passed. Supported
CFT activation is blocked by an absent verified pin; tray reopen/Quit, active-profile/proxy use,
independent Relay retention and manual MSI results remain pending. The guest is shut down after
verified cleanup. The owner requested background work while using the host. No upload or promotion.
Use the [current acceptance report](release-acceptance-20260909.md) and [MSI checklist](msi-acceptance-checklist.md).
The original checkpoint below records the earlier resource pause; do not rerun build B or rebuild A.

## Summary

Build A is a retained, unsigned technical candidate, not an accepted release. Build B
dependencies are installed, but packaging and VM acceptance are paused because the host
has insufficient reserves and the owner cannot free resources now. No installer was
uploaded, signed, installed, or substituted into the existing release channel.

## Frozen Inputs

- Browser commit: `5ff43b27f54d754388acc2c04005216e3db5b426`.
- Browser tree: `b089edb21299a080a4929e000203a4ec341d2f5a`.
- Historical sibling contract: MKTTool `b4ef969b5cac9473da77ef3db1bbb941b46cdd9c`.
  This is not the deployed Web revision. Production master lacks its candidate metadata.
- Node: `E:/tools/node-v22.23.1/node.exe`, version `22.23.1`.
- Yarn: `4.5.0`; CLI and lock hashes are recorded in every frozen-command receipt.
- Technical candidate ID: `20260908-browser-0.3.13-relay-16-single-entry-5ff43b2-technical`.
  This local ID is not a signed release authorization or operator distribution identity.

## Evidence

| Gate | Result | Receipt / limit |
|---|---|---|
| Fresh install A | PASS | `D:/mkt-single-entry-20260908/a-install.json` |
| Frozen quality A | PASS | `a-quality.json`; seven commands, including directory build. Source/locks unchanged. |
| Installer suites | PASS / OPEN | 435 passing executions, one real-machine integration skip. The skip is not acceptance. |
| Installer package A | PASS | `a-package.json`; exact pinned Relay verified; Node native modules restored. |
| Fresh install B | PASS | `b-install.json`; same committed source, independently installed dependencies. |
| Package B / equivalence | OPEN | Not started; no two-build reproducibility claim. |
| Authenticode | UNSIGNED | `Get-AuthenticodeSignature` returned `NotSigned`, as expected for this technical candidate. |
| VM / installed startup | OPEN | No new installer install, repair, uninstall, login, tray, Quit or physical MSI acceptance. |
| Publication | HOLD | No upload/promotion; existing signed manifests bind different bytes. |

Build A installer:

`D:/mkt-single-entry-20260908/a/apps/desktop/release/installer/MKTBrowser-win-x64.exe`

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| Installer | 145073829 | `25e8fc156c0769245623dfc7b082cd9f88886b3516fbca24ea9509114928e8a3` |
| Browser app.asar | 51756076 | `d2e5017d67f932eda5fbad8d5bfd5cee12dd470018649b20a81403511110d8a8` |
| Bundled Relay v16 ZIP | 33342752 | `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` |
| Control contract v4 | 153 | `b3d0b07981958b5f972da83f32f50475c8d95ccca005ce72525d0714a275dcaa` |

Normalized A payload: 129 files, manifest digest
`607e229dea5506b0ffa6bfffb2714b7826634d1f2fad4548a411abaf04f779b8`.
Manifest: `D:/mkt-single-entry-20260908/a-payload-manifest.json`.
Provenance: `D:/mkt-single-entry-20260908/a-provenance.json`.
The engine remains the separately pinned CFT `152.0.7977.64`; it is not bundled.

Old frozen installer was rehashed after packaging and is unchanged:
`E:/MKTWorkspace/local-test-artifacts/local-release-20260908/candidate/installer.exe`,
SHA-256 `255c1a1c0128dabc4ef1fc3c51a864cc2dd2c790b98fb9af2ff462f885e06347`.

## Resume Safely

1. Remeasure RAM and disk. Latest low-water measurement was approximately 0.5 GiB
   free RAM; C: was approximately 13.3 GiB, below the VM preflight's 15 GiB floor.
   User applications and files were not closed or deleted. All disposable VMs remain off.
2. Verify both frozen checkouts and receipt hashes, then package B using the same
   wrapper and exact inputs. Do not reuse an existing receipt prefix or rebuild A.

```powershell
& 'E:\tools\node-v22.23.1\node.exe' `
  'E:\MKTWorkspace\local-test-artifacts\local-release-20260908\run-browser-frozen-command.cjs' `
  'D:\mkt-single-entry-20260908\b' `
  'E:\MKTWorkspace\local-test-artifacts\startup-frozen-sibling-b4ef969b' `
  'C:\Users\anhha\AppData\Local\node\corepack\v1\yarn\4.5.0\yarn.js' `
  package 'D:\mkt-single-entry-20260908\b-package' `
  'E:\MKTWorkspace\local-test-artifacts\local-release-20260908\candidate\MKTTool-Relay-v16.zip'
```

3. Generate B's normalized manifest with the committed manifest tool and compare to A.
   Keep every mismatch; do not expand normalization exclusions to force agreement.
4. Reconcile a coherent release version/candidate identity and Web distribution metadata
   before delivery. Current source still reports `0.3.13`; old candidate preparation
   scripts and signed manifests must not be reused for these new bytes.
5. Create a new hash-bound VM bundle/task namespace, preserve guest state, restore the
   reviewed snapshot, and pass resource/clock/Defender preflight. Previous wrappers
   hardcode old evidence and cannot certify this installer unchanged.
6. Run exact-installer clean/repair/uninstall and normal startup/tray/Quit acceptance;
   then physical MSI acceptance. Do not substitute disposable-directory MCP smoke for
   normal installed startup behavior.

## Unresolved Questions

No new implementation decision is requested now. Resource availability, release identity
reconciliation, second-build comparison and exact-installer acceptance remain open.
