# Browser IP Observer Candidate Checkpoint

Updated: 9 September 2026, 04:32 UTC. Publication: HOLD.

## Candidate

- Browser 0.3.17 / retained Relay 17.
- ID: `20260909-browser-0.3.17-relay-17-browser-ip-observer-cft`.
- Evidence root: `D:/mkt-ip-observer-fix-20260909`.
- Browser source: `26bc2d839975082cb4f0b2ee437c9c319d71d94e`;
  tree `b75bdf8143d7b39ffbfea3304803ab4fca61873b`.
- Web source: `bb378ae8f6fd27612654da1b93554e97869e0827`;
  tree `64c994f8368ee433e889b558c400e7f37d91419c`.
- Source commits remain local. Sequence 21 signed; no deployment, artifact upload or publication.

## Diagnosis and Correction

Exact 0.3.16 reaches signed activation smoke but ipapi responds to Chromium with a Cloudflare
security-verification page, including observed HTTP 403 with valid TLS. The independent Node
geolocation probe succeeds. A disposable CFT diagnostic through the same proxy receives HTTPS 200
JSON from ipify and its IP matches the independent Node probe. Browser 0.3.17 uses that IP-only
observer and preserves exact egress matching. Redirects and invalid addresses fail closed; raw
provider response content is omitted from errors. No TLS, CAPTCHA or proxy-policy bypass.

The prior exact artifact and failed activation remain recorded in
[the retained checkpoint](nonblocking-relay-build-checkpoint.md). Diagnostic results are not
replacement-installer acceptance.

## Gates

| Gate | State | Evidence |
|---|---|---|
| Source regression | PASS | Nine new failures before; 12/12 smoke tests after |
| Source Browser checks | PASS | Full lint/typecheck and five version-coherence tests |
| Web metadata | PASS | 67/67 across five files |
| Browser A | PASS | Fresh dependencies, seven frozen quality commands and installer packaging |
| Browser B/comparison | PASS | Independent builds; 129 normalized files, zero differences |
| Web security | PASS | `bf6be61e8cbc584772e2dba4c24234dd2ce496313f6605c5e342066554802737` |
| Web database contracts | PASS | PG16/Node22, `f1ae6d725397017930664f85383b4626a44c31a1da3c8a7005600269350d10e2` |
| Frozen Web quality | PASS | 2168/2168 tests and coverage, zero skips, lint/typecheck/build |
| Signed sequence 21 | PASS | Signature, 5 artifacts and metadata verified; fresh state 0 only |
| Exact VM clean installation | PASS | 9/9; independently verified exact installer and bundle receipts |
| Exact VM signed activation | PASS | Sequence 21 current, no pending state; five exact artifact hashes and signed manifest verified |
| Exact VM native lifecycle | PASS | Active-profile tray close/Open/shortcut/Quit; same Relay retained; nonblocking notice and proxy rejection/recovery observed |
| Visible-manager profile launch | PASS on 2 vCPU | Two successful native launches; earlier 1-vCPU contention/timeouts retained separately |
| Exact VM uninstall | PASS | 15/15 with bound/raw hash verification; prior harness race retained |
| Exact VM repair | PASS | 13/13; damaged files, shortcuts and registry repaired; operator/Relay data preserved |
| Exact VM independent Relay | PASS | 21/21; existing config/Relay preserved, standalone login restored after Browser uninstall |
| Final fixture cleanup | PASS | Clean restore verified; no guest fixture/product/trust/hosts/tasks, Defender ON; VM OFF and host fixture listeners absent |
| Physical MSI | OPEN | Owner will execute the exact-candidate checklist after VM acceptance |
| Publication | HOLD | MSI state/private activation access and owner exact-file acceptance required |

## Resources and Cleanup

A/B finished at 02:32 UTC: 129 normalized files, zero differences, payload digest
`8d81bd80081f7c45431b7009166fb60338c721e4b9925ab9f97e2ab38be8752c`.
Exact retained installer: `D:/mkt-ip-observer-fix-20260909/candidate/installer.exe`, 146,047,736
bytes, SHA-256 `6d07fd4ef529b3505a8de385c7d0d3214258e8a020abbd00de51e8f9810a4ca8`.
App ASAR: `d0889548095ab1901d12bf832604b6000a66d3b6ab267482dce8a7474c3a25f8`.
The two outer installers differ in raw hash; acceptance and publication must use the retained A.
Authenticode `NotSigned`; compatibility metadata signing is a separate gate.

Frozen release manifest SHA-256:
`fff14673d9856fe1f1f712103802b54307b35842474a1030b6488e7266bf8bbe`.
VM bundle SHA-256:
`0580102077c2cdd8d128f248608d5588b10e47f5fb0957f936161edc203f35c1`.
The packaged ASAR contains the expected IP observer and fail-closed checks; this is a wiring
inspection, separate from the subsequently passed exact VM activation gate.

Web quality receipt SHA-256:
`43a34f726b0c18e270c6ebe38af129410bbfb67cf1f62fb493f766b5a7250303`.
Coverage: 81.01% statements, 76.7% branches, 82.34% functions, 83.59% lines. PG17 quality cluster
stopped and its password file removed. A malformed first command was rejected at argument parsing;
no cluster or output existed before the correctly quoted invocation. This was not a test failure.

Fresh private fixture database `mkt_candidate_ip_observer_test`, PG17 port 55424, prepared.
The runtime is the exact quality checkout under `D:/mkt-ip-observer-fix-20260909/web-quality/MKTTool`;
do not mutate its dependencies or `.next`. Guest-only CA:
`e580ebc7203c3fe53a9c60580231a00bf296f7d2c535b8e11db843c1f23fda06`, thumbprint
`EAE2DDDBC4AC6CA7F9C4EDBD2DAD5D5374C10B12`. Host trust unchanged. Synthetic session creation and
guest network configuration are separate steps; cleanup is required after acceptance.

Prior synthetic fixture session revoked: one removed, zero remaining. Owned Next, HTTPS, SSH
tunnel and dedicated PG55423 stopped. VM is off; no build overlaps a running VM.
Failure snapshot: `bcb0392f-31e4-4ea5-b6c4-684abcc7b190`.

Registered snapshot medium `e052927a-ffbd-47ad-82c7-b630a95f3430` was moved by VirtualBox to
`D:/mkt-ip-observer-fix-20260909/preserved-ipapi-failure-medium.vdi`, 7,460,618,240 bytes,
SHA-256 `8e2391521a7765f27eda8a92ee5e86211b0860b0a84d4e916c611d4b88944ece`.
UUID, snapshot links, byte count and full hash readback match. This is a registered VM dependency;
never delete it during build cleanup. The earlier two preserved media remain dependencies too.

62 ignored dependency directories from retired clean isolated checkouts removed in three guarded
passes. Source, installers, evidence and snapshots retained; old 0.3.16 hash verified before/after.
Receipts: `E:/MKTWorkspace/local-test-artifacts/host-disk-recovery-20260909/`.

## Exact VM Progress - 02:55 UTC

Original clean snapshot restored, Defender and real-time protection enabled, no Browser/Relay/Node
present. Exact 0.3.17 installation passes 9/9 at 02:46:13Z. Independently verified bound receipt
SHA-256 `e11fcebdfbda73d05f574993ba0a374fa816d863caca430f12b07a6c14aebc8a`;
raw receipt `0e3c53da18816b1a38c79d994c9f429bec6ce15e98d33d0410d004d13c7d566e`.
Automatic Browser/Relay first launch is recorded in `candidate/runtime-clean-first-launch.json`.
The native profile action correctly refuses a missing signed engine pin before activation.

Initial elevated installer launch shows a Relay safety notice despite a running Relay; a normal
cold-login observation is required before interpreting it. At 02:52-02:55, SSH fails during banner
exchange and native actions are delayed; VirtualBox logs an AHCI port reset. Network setup receipt
is not yet reconciled. Saved log: `evidence/vm-transport-recovery-1.log`. Soft ACPI shutdown succeeds
at about 02:55:42; cold power-on resumes the installed guest without restoring or changing payloads.
No unanswered-dialog, tray, activation or normal-login PASS is inferred from these stalled actions.

Exact verified Web fixture and PG55424/private HTTPS are active. Synthetic ADMIN session is active
and must be revoked during cleanup. Guest trust/hosts setup remains unconfirmed; inspect before
retrying its exclusive writer. Host C: reserve is about 6.7 GB; no build overlaps this VM run.

## Signed Activation - 03:20 UTC

Guest network setup reconciled as untouched, then completed with HTTPS 200 and normal TLS validation
at 02:57:54Z. At 02:58:39Z, the normal-login Browser main PID 8140/MCP47822 and Relay5008/47821
are present at normal priority; Defender and real-time protection remain on. An earlier 02:57:57Z
readback preceded Windows' delayed Startup-folder launch and is not a startup failure.

Limited-token process-only CA fixture passes; Relay5008 replaced by verified Relay9020.
Receipt SHA-256: `b308d6ca67a909913a943bdf0c01e4ad053762b37a1645488ce95dcf1249f262`.
Native Web Confirm PC and first-device bootstrap complete for the synthetic fixture administrator.
Read-only MCP initialize/list/runtime before activation return HTTP200 in 185/16/810 ms.
This is baseline responsiveness, not an unanswered-notice test.

Sequence21 stages through the supported Web confirmation. The VM display idles to black just
before the first firewall UAC; it is not approved and the uninstaller stops safely. After display
recovery, the same installer retries. Native details show the exact packaged firewall script,
owned runtime paths and modes Uninstall/Install; both requests are approved visibly. Guest display
AC timeout is disabled for the remainder of this disposable test and will be removed by restore.

At 03:11:39Z the update marker/helper lock clear, set21 is present and Browser/Relay restart.
Independent readback verifies current/highest sequence21, no pending transition, ready configured
Relay17, exact installed ASAR/Relay EXE, all five retained artifacts, signed manifest and Defender.
`candidate/activation-acceptance.json` SHA-256:
`fbbc0d9c4d0744f0f80f6e364496b135d56e20f790e6112374de9754ecc60426`.
Production transition code promotes the set only after protected packaged browser/proxy smoke.
This closes the exact signed-activation gate; the later manual lifecycle gates remain separate.

An immediate Web request during Relay restart times out; later browser-page health returns HTTP200,
configured/ready Relay17. No local-network permission was changed to make it pass. A new Proxy-vault
form was opened, but native and DOM readback showed all credential fields empty; no proxy was saved.
Its delayed helper was stopped, as was the owned Edge SSH tunnel. Soft ACPI reboot requested at
03:20:17Z for continued native profile/tray tests. Synthetic session and host fixture services remain
active and need cleanup. Host C: reserve is about 3.1 GB; no heavy build is running.

## Native Lifecycle And Resource Diagnosis - 03:44 UTC

At cold login, Browser7300 and Relay7180 start at normal priority. Check Relay resolves the
initial unverified-startup state. Dedicated unmanaged profile `96527333-33e7-4b4c-a5f5-7026075e86b8`
uses the authorized observer proxy; no managed ownership or page-control permission was changed.
Two native launches fail with DevToolsPortDiscoveryError; the browser appears briefly on the
second run and is stopped by launch cleanup. A third supported MCP launch fails at active-port
with only 809 ms remaining after prelaunch inspection. These failures remain recorded, not passes.
The attempted MCP navigate is correctly refused by the profile-management access policy.

With the manager hidden to tray, the unchanged profile launches successfully at 03:39:53Z
(Chromium5132, endpoint52830). Native profile window persists and loads its default Google page.
Five-second samples show Browser GPU process7452 consumes 2.828125 CPU seconds with the manager
visible, and zero while hidden, on one virtual CPU. This supports a resource-contention hypothesis;
it is not sufficient to clear normal visible-manager launch acceptance.

Native close-to-tray with the active profile, tray Open and desktop-shortcut reuse pass. Same
Browser7300, Relay7180 and Chromium5132 remain. Native Quit at 03:43:25 closes Browser/MCP and
the active profile; settled readback at 03:43:53 has no Browser/Chrome process or port47822,
and retains Relay7180/47821 with Defender enabled. Receipts: runtime-tray-hidden-active-profile,
runtime-desktop-shortcut-reuse, runtime-native-active-quit and its settled readback in candidate/.

VM ACPI shutdown requested before a prospective two-vCPU resource comparison. The earlier
two-vCPU transport failure occurred before the SATA I/O-cache correction; preserve that failure
and measure this new configuration separately. Exact installer and installed payload stay fixed.

## Two-CPU Profile And Notice Acceptance - 03:56 UTC

Normal ACPI shutdown completes at 03:45:59Z. Only virtual CPU count changes from one to two;
memory stays 4 GiB and I/O cache stays enabled. Prospective configuration is recorded in
`evidence/vm-cpu2-before-boot.txt`. Early boot Defender false is not acceptance; settled Defender
and real-time protection are on. Browser8284 and Relay9128 start normally. Native visible-manager
Launch succeeds, Chromium2384 stays running. A second native launch after proxy restoration also
succeeds (Chromium9020); installed artifact is unchanged.

An intentional unavailable proxy on the dedicated unmanaged profile produces native
"Proxy unreachable" and supported MCP `PROXY_REJECTED`; the profile is not launched. Restoring
the exact authorized observer proxy through supported update_profile recovers normal native launch.
Receipts: lifecycle-mcp-observations.jsonl, runtime-cpu2-native-profile-launch.json and
runtime-cpu2-proxy-restored.json. One-CPU launch failures remain historical FAILs; two-CPU results
are separate evidence and establish the prospective VM resource baseline for profile use.

A disposable duplicate of the owned Browser startup link triggers the real safety notice via
native Check Relay. While unanswered, MCP initialize/list/runtime all return HTTP200 without error
in 130/11/739 ms. Native tray menu and Open MKT Browser continue working. The duplicate link is
removed only after matching its hash to the unchanged original; original startup link remains.
Notice evidence: candidate/mcp-cpu2-unanswered-relay-notice.json. No owned process is replaced,
no conflict policy is bypassed and no page-control token is enabled.

Synthetic fixture session revoked (one removed, zero remaining). Owned Next38117, HTTPS443 and
PG55424 stopped; listener readback is empty. Guest trust/hosts cleanup still requires clean restore.
Native lifecycle receipt SHA-256: `5a2577fc6780fde3eefbc45f633facaae20fd531c57b419e4dd87694aabe11e9`.
Repair/uninstall/independent Relay and MSI remain OPEN. No source push/deploy/upload/publication.

## Uninstall Acceptance - 04:07 UTC

Registered historical snapshot medium500111ef moves through VirtualBox from C: to
`E:/MKTWorkspace/local-test-artifacts/host-disk-recovery-20260909/preserved-installed-vm-medium.vdi`.
UUID, parent/snapshot association, 3,948,937,216 bytes and full SHA-256 match:
`3e55e34af2bf89537b249a59de0a6e76380b6501a0f02ea1a18e369110e006a3`.
C: reserve recovers to about 5.18 GB. This remains a registered dependency; never delete it.

Uninstall uses the original one-vCPU frozen bundle. Attempt1 fails in harness Stop-OwnedProcesses:
PID7492 exits between enumeration and Stop-Process. Three preflight checks pass; the actual
uninstaller never starts. Failure receipts are retained unchanged in vm-gate/uninstall-attempt1.
After confirming Browser/Chrome are absent, the single exact Relay is stopped as fixture setup.
The completed failed task/receipts are archived, then the identical frozen runner is retried.

R2 passes all 15 checks, including operator data/config preservation, owned payload/shortcuts,
firewall/registry removal, stopped processes and closed control port. Independent receipt verification
passes. Bound receipt SHA `2643a15c60aa5afb6fba67d46a8d1f0c709e6cc2471ae27d6dbf863a3245b21f`;
raw SHA `14488f0a2dc01ae49e40b21fe63b2f4a84799b504d0ffbc1acb838c63f119240`.
Normal guest shutdown precedes clean restore for repair and independent Relay testing.

## Repair Acceptance - 04:19 UTC

After a clean snapshot restore, the exact frozen repair runner completes 13/13 checks at
04:15:47Z. The damaged Browser tree returns to its original digest; desktop/startup shortcuts
and Publisher metadata are restored. Profile marker, token, database and Relay configuration
remain unchanged. Repaired Browser serves its normal control endpoint; Defender remains enabled.

Independent verification at 04:19:04Z binds the installer and bundle to the exact guest receipts.
Bound SHA `122f8055b832860863a47b22b02ee95fe823f5ff70408da9aa64fa7f16517dd6`;
raw SHA `df99d977284e9891a10390d24e328e02b2c844e073329a81322d7356ffdd4c64`.
Normal ACPI shutdown then precedes a separate clean restore for the standalone Relay case.
At 04:21:48Z that guest has no Browser/Relay/Node, one vCPU, and Defender/real-time protection on.
The eight-file bundle is receive-hash verified before the independent Relay task starts.

## Independent Relay Acceptance - 04:26 UTC

On a separate clean restore, the exact retained Relay ZIP's packaged standalone installer runs
normally. The standalone executable and Startup entry match; the combined installer records
`RelayOwned=0`, retains configuration and makes Browser the sole owned login entry. Browser
uninstall removes Browser/registry/firewall, preserves the independent Relay/configuration/data
marker and restores standalone Relay login. Defender remains enabled before and after.

All 21 checks pass at 04:25:03Z; independent receive-hash verification passes at 04:25:39Z.
Receipt SHA `1933cac63c1dd49392fd65a7391b01004f2e138b4b83e17d19ccbc5a93d2652d`;
runner SHA `7028a8a30faac4472b3226f2b60cf8c935e4668761bba8973031a6f915d7c32f`.
The guest then shuts down normally and restores the clean baseline for final fixture readback.

MSI packet contains the retained installer and read-only PowerShell preflight. Native Windows
PowerShell 5.1.26100.9168 parses the final inspector successfully. No host execution is presented
as MSI evidence. Await the owner's MSI JSON to reconcile current compatibility sequence and
private activation access. Production candidate availability has not been deployed or published.

## Final Cleanup And MSI Handoff - 04:32 UTC

After another actual clean restore, guest readback verifies Browser, Relay, their data, private
fixture directory, test CA, hosts entry, tasks, processes and product listeners absent. Defender
and real-time protection are enabled. Guest receipt SHA
`6f7e1de77a2a59e496a8d59a9c1e9c51cafaf5d763ff8cda99c455d5152337a6`.
Normal ACPI shutdown leaves VM powered off, configured with two vCPUs and 4 GiB. Host fixture
ports 38117/443/55424 have no listeners. Final receipt at 04:30:37Z:
`a526e367beb17c608057dedd757cc5560a9d7cf48ab29d90efe1ea09d3a9c757`.
Registered historical disks remain preserved and registered; no deletion was used for this cleanup.

The acceptance index rechecks the installer, frozen metadata, A/B comparison, exact clean/repair/
uninstall receipts, native lifecycle evidence, retained Relay result and final cleanup hashes.
`candidate/vm-acceptance-closeout.json` SHA:
`063518c4e995f36622fb2f3b5c4ef4850ace2ded2a8f388d95c3c3d10a7dd64d`.
Its initial generation stopped on the clean runner's different summary schema (`open`, not
`notRun`) before writing any index. The generator now explicitly validates both committed receipt
schemas; no raw result or product byte changed. A premature copy command left a partial packet;
the final packet is reconciled by exact hashes after successful index generation.

The exact A installer, PowerShell 5.1-compatible read-only inspector, checklist, frozen distribution
metadata and acceptance index form `candidate/msi-handoff`; SHA256SUMS binds the supplied files.
The owner has been asked to return physical MSI preflight JSON. Sequence 21 accepts state 0 only;
existing nonzero state must not be erased. Private MSI activation access is not provisioned yet.
The VM fixture remains revoked/stopped. No source push, deployment, upload or publication occurred.

Remaining: MSI state/access and owner exact-file acceptance; separately, unfamiliar-operator,
broader browser-page network containment and seven-day canary evidence. These are not VM passes.

## MSI Inspector PowerShell 5.1 Correction - 05:16 UTC

The owner's first physical MSI preflight stopped before reading machine state. Windows PowerShell
5.1 evaluated the `InstallerPath` default expression inside `param(...)` while `$PSScriptRoot` was
still empty, so `Join-Path` rejected its empty parent. No installer was run and no machine state was
changed. The same exact command reproduced on the build host.

The inspector now accepts an empty parameter and resolves the default file beside the script after
parameter binding. The unchanged old copy also works when `-InstallerPath` is passed explicitly.
Fresh Windows PowerShell 5.1 checks pass for both the exact documented command and explicit-path
form; the inspector reads the retained installer hash correctly. Build-host output is validation of
the script only and is not physical MSI evidence. Updated inspector SHA:
`1909ea32c7b58dea2d76a7a0ad34d4bb3942a1e96700c738241266cf8bc5481e`.
Updated packet checksum-list SHA:
`77c79930ed06e84a4683912294bc0be9be5b8e1acdf8ff904ea694fab1e9decd`.

## Physical MSI Read-Only Preflight

The owner ran the explicit-path inspector on a Micro-Star International Modern 14 B5M with
Windows 11 Home Single Language build 26200, 12 logical processors and 7.4 GiB memory. The received
installer SHA matches exact retained A:
`6d07fd4ef529b3505a8de385c7d0d3214258e8a020abbd00de51e8f9810a4ca8`.

Existing state is MKT Browser 0.3.1 with `RelayOwned=0`, so the Relay is independently owned.
Its executable exists, but loopback health is unavailable; Relay version and compatibility state
remain OPEN. Defender real-time protection reports false. No installer ran and the inspector made
no configuration change. Physical MSI promotion is blocked until antivirus state is reconciled,
Relay health/compatibility state is read, and supported candidate activation access is available.

The owner then enabled Defender and started the existing Relay. Follow-up readback at 05:32:31Z
reports Defender real-time protection on, Relay v16, no pending transition, and initialized
compatibility state with highest accepted sequence 0, current sequence null and rollback floor 1.
This is the signed sequence-21 manifest's authorized `fromSequences: [0]` state.

Installer source inspection confirms the combined installer will install bundled Relay v17 while
preserving the existing Relay configuration and independent ownership. A later Browser uninstall
will retain that Relay. MSI is cleared for normal exact-installer execution. Engine/profile
activation remains separate and requires authenticated candidate access.
