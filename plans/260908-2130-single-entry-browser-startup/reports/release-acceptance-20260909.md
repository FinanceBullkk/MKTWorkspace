# Single-Entry Release Acceptance - 9 September 2026

## Current Verdict

RELEASED for controlled internal Windows x64 use. Exact candidate
`20260909-browser-0.3.17-relay-17-browser-ip-observer-cft` passed independent normalized A/B build
comparison, signed sequence-21 activation, clean VM lifecycle, and owner-operated physical MSI
acceptance. The retained EXE is 146,047,736 bytes with SHA-256
`6d07fd4ef529b3505a8de385c7d0d3214258e8a020abbd00de51e8f9810a4ca8`; it was not rebuilt after
acceptance.

The installer was created under its immutable R2 candidate key with conditional write semantics.
Publisher full GET/hash read-back passed. Production source commit
`d161dd523e9fe3b62b08eb09bb7731c155ae926c` is live in Railway deployment
`54091ee1-f46e-4b8d-8bdb-d6d111ba5cd7`; health reports ready with database, release metadata, and R2
OK. The production release probe reports `available=true`, `metadataComplete=true`, Browser `0.3.17`,
Relay `17`, CFT `152.0.7977.64`, and no missing metadata. An authenticated ADMIN download returned
HTTP 200, all 146,047,736 bytes, and the accepted SHA-256.

Physical MSI checks passed install, Windows restart and Relay startup, supported activation,
disposable proxy-profile launch, active-profile tray close, tray reopen, shortcut reuse, explicit
Quit, repair, uninstall, independent Relay retention, and reinstall with profile/device/sequence
preservation. Repair initially required stopping the running independent Relay process before retry.
Unfamiliar-operator, another independent physical PC, and seven-day canary evidence remain OPEN.
No identity-isolation or real-account-safety claim is approved.

## Historical Frozen Candidate - Rejected A

- Candidate: `20260909-browser-0.3.13-relay-16-single-entry-5ff43b2`.
- Actual embedded Browser version: `0.3.13`; Relay remains v16. No binary relabeling or rebuild of A.
- Browser commit/tree: `5ff43b27f54d754388acc2c04005216e3db5b426` /
  `b089edb21299a080a4929e000203a4ec341d2f5a`.
- Build sibling: authentic historical MKTTool `b4ef969b5cac9473da77ef3db1bbb941b46cdd9c`.
  The new Web metadata preparation is separately tested and is not a claim about that historical build input.
- Retained installer: `D:/mkt-single-entry-20260908/candidate/installer.exe`;
  145073829 bytes; SHA-256 `25e8fc156c0769245623dfc7b082cd9f88886b3516fbca24ea9509114928e8a3`.
- Browser ASAR: `d2e5017d67f932eda5fbad8d5bfd5cee12dd470018649b20a81403511110d8a8`.
- Relay ZIP: `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`.
- CFT 152.0.7977.64 archive: `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004`.
- Control contract v4: `b3d0b07981958b5f972da83f32f50475c8d95ccca005ce72525d0714a275dcaa`.

## Evidence

Evidence root: `D:/mkt-single-entry-20260908/candidate/`.

| Gate | Result | Evidence / limit |
|---|---|---|
| Independent build B | PASS | `../b-package.json`; same frozen source, locks, Node 22.23.1 and Yarn 4.5.0; source unchanged |
| Normalized delivered payload | PASS | `build-comparison.json`; 129 files; digest `607e229dea5506b0ffa6bfffb2714b7826634d1f2fad4548a411abaf04f779b8`; no differences |
| Raw installer identity | DIFFERENT | B SHA `729f487953f10a1a26f4ccb1fc742a9d2c89f0cf953b7612d72b19e6d63ed115`; only the existing PE timestamp/checksum normalization applied to payload files; no byte-identical outer-EXE claim |
| Signed metadata | PASS | Sequence 17, fresh-install transition from 0; signature, root/delegation/revocations, five artifact hashes/sizes and control contract verified in `metadata-verification.json` |
| Installer signing | UNSIGNED | `NotSigned`; delegated manifest signature is separate from Authenticode |
| Storage conflict preflight | PASS, read-only | `remote-storage-preflight.json`; candidate installer key and six compatibility objects absent; no upload or full-GET publication evidence |
| Web metadata checks | PASS | 57/57 DB-free tests across four files, full typecheck and lint; logs in evidence root |
| Publisher file contract | PASS, simulated I/O | `frozen-release-manifest.json` matches the actual CLI reader; one real-CLI test accepted exact A/provenance/metadata with all R2 operations mocked, zero network calls. `publisher-simulated-preflight.json`; no upload/read-back evidence |
| Clean installed VM | PASS 9/9 | `vm-gate/clean-bound-evidence.json`, wrapper exit 0, exact hash bindings and raw receipt verified |
| First-run UI | BLOCKED | Welcome and profile creation reached through installed UI; then missing verified compatibility-set engine pin; no CFT override or manual pin injected |
| Close to tray | PASS, bounded | Window disappears; Browser PID 8152 and Relay PID 3448 retain their control listeners. `vm-tray-observed.json`; no running-profile continuity claim |
| Browser starts an absent Relay | PASS, bounded | `vm-gate-cpu1/companion-autostart-r2-evidence.json`; no product processes/listeners before normal Browser-only launch; Browser control owner PID 2068 and exactly one owned Relay PID 4376 afterward. No enrollment/readiness or explicit Quit claim |
| Windows login startup | PASS, bounded / performance OPEN | Cold boot and automatic guest login started Browser PID 7568 and Relay PID 6504 without manual product launch; exact Startup target and `--background` observed. First observation at about 100 seconds after boot had Browser only; both services were verified by about 211 seconds. No MSI performance or tray-visibility claim |
| Reopen / explicit Quit | OPEN | Foreground testing paused at owner request |
| Repair | PASS 13/13 on 1 vCPU | `vm-gate-cpu1/repair-bound-evidence.json`; wrapper exit 0, receipt/raw hashes verified; prior 2-vCPU environment failure retained |
| Uninstall | PASS 15/15 on 1 vCPU | `vm-gate-cpu1/uninstall-bound-evidence.json`; wrapper exit 0, exact raw/receipt hashes verified; owned Browser/Relay payload, shortcuts, registry, firewall and listeners removed; data retained |
| Final cleanup | PASS | `vm-cpu1-cleanup.json`; zero product processes/listeners/firewall rules, no remaining gate tasks, profile database preserved, Defender enabled. Guest shut down normally |
| Evidence integrity | PASS | `vm-evidence-verification.json`; rechecked clean/repair/uninstall matrices, receipt/raw/bundle hashes, every bundled input and exact source/artifact bindings |
| MSI | PASS | Physical MSI receipt binds the exact installer and passes install/restart/activation/profile/tray/Quit/repair/uninstall/reinstall lifecycle |
| Publication / deployment | PASS | Immutable R2 create and full byte read-back; PRs #73/#74 merged; Railway `54091ee1-f46e-4b8d-8bdb-d6d111ba5cd7` SUCCESS; production metadata and authenticated full download PASS |

## VM Environment

VM `13b74869-d2e9-4df6-a043-d8c6b079db04`, restored snapshot
`dde2d98e-72d7-466e-8339-fb6b9c552752`, Windows 11, 4 GiB / 2 vCPU.
Initial clean preflight: correct VM UUID, interactive session 1, no Node or product path,
Defender enabled (engine 1.1.26080.3, signatures 1.459.105.0), host/guest UTC within the measured
2.5-second request interval. Host reserves were remeasured before starting the guest.

Prior diagnostic state and the successful clean-install state were preserved in separate snapshots.
The fresh repair run later lost SSH banner responsiveness; VBox recorded heartbeat loss. This is
an environment failure, not a repair PASS or proof of installer failure. Preserve the attempt and
its logs. Any CPU/configuration experiment must have separate prospective environment evidence.

The stalled 2-vCPU state was saved successfully and preserved as snapshot
`64a41e74-ec8c-42b9-a309-a242cad09043`. The clean snapshot was restored again and only guest CPU count
changed to 1. `vm-cpu1-before-boot.txt` and `vm-cpu1-preflight.json` record actual VM UUID, 1 vCPU,
4 GiB, interactive session 1, absent product/Node and enabled Defender. Guest UTC fell inside the
4.1-second host request interval. An early boot probe saw Defender not yet ready; installation
waited for enabled protection. The initial receive path required moving only the verified bundle
files into the declared namespace; the wrapper then independently verified all eight inputs.
Bundle SHA-256: `72aeeacffe62b3c5aa5ef6eeeea778661db9c7e7694951ee25d69376fe520826`.
Repair subsequently completed all 13 checks, restoring the exact installed file tree, shortcuts
and registry while preserving the fixture database, token and Relay configuration state.

Companion trial 1 failed the immediate post-stop absence precondition before any launch. A later
independent query found no remaining product process/listener. R2 retains that failure and adds
a maximum 15-second teardown wait, preserving the strict absence condition and using a new
receipt. R2 observed empty processes/listeners, launched only the normal installed Browser through
an interactive limited-user task, and passed with one control owner per service. The administrative
fixture stop is explicitly excluded from Quit acceptance.

The repaired state was shut down normally and preserved as snapshot
`b1293b78-71d5-462c-8cc2-da033d023a65` (`single-entry-cpu1-repaired-20260909`) before a fresh boot.
`vm-cpu1-login-before.json`, `vm-cpu1-login-after.json` and `vm-cpu1-login-settled.json` retain the
Startup-link, early-boot and settled observations. Relay health returned HTTP 400 with v16 because
the device is unconfigured; that proves a responding runtime, not enrollment or Setup readiness.
Window handles queried from the SSH session do not prove visibility in the interactive session.

After uninstall, all 15 checks passed. The final independent cleanup query found zero product
processes, control listeners or owned firewall rules; the four exact one-shot harness tasks were
removed after recording their result codes. Profile data remains preserved. The guest was shut
down normally to release host RAM; the repaired snapshot remains available for pending UI work.
The owned-Relay removal case is verified. Retention/restoration of an independently installed Relay
is still OPEN for this exact artifact.

## Supported Engine Activation Boundary

The existing supported path is installed Relay enrollment, followed by the authenticated ADMIN
compatibility repair in Setup. `src/lib/release/compatibility-update-actions.ts` signs the exact
device/manifest authorization; Relay `handle-compatibility-update.ts` requires ADMIN plus
`repairMissingState` before initializing absent protected state. The transition runner verifies
and activates the staged artifacts, then writes the engine pin and runs post-activation smoke.
Rerunning the combined EXE alone does not complete this signed initialization.

No live candidate fixture enrollment/authorization or profile activation was completed in this
run. Candidate artifacts are still local and the authenticated test distribution remains to be
bound to sequence 17. The prior fixture/sequence is not evidence for this installer. This source
trace is diagnosis only; normal signed activation and proxy failure/recovery stay OPEN.

## Historical Metadata Source Checkpoint

MKTTool commit `48e70fd` freezes the reviewed candidate constant, immutable storage key, exact
Relay/CFT publisher assertion and current documentation. Inline review found no scoped defects.
Validation: 57/57 targeted tests, full typecheck/lint, actual publisher file-contract test with
simulated I/O, scoped secret scan (seven source/doc files) and staged diff check PASS. This is a
local source commit; no push, deployment, artifact upload or operator promotion occurred. Browser
source and the original historical MKTTool build input remain exactly as recorded in Frozen Candidate.

## Ready-To-Use Continuation - 9 September

The owner authorized VM mouse use. On the installed repaired snapshot, the Browser manager was
closed with X, opened through the actual **Open MKT Browser** tray menu, closed again, then exited
through **Quit MKT Browser**. The reopened manager was visibly observed. Before Quit, the process
inventory showed one Browser parent (7644) with its Electron children and Relay 7624. After Quit,
no Browser process remained; the same Relay 7624 still owned 127.0.0.1:47821 and returned its fresh,
unconfigured HTTP 400 health response. Defender antivirus and real-time protection were enabled.
Evidence: `tray-reopen-before-quit.json` and `tray-after-quit.json` in the candidate root.
Tray reopen and explicit Quit PASS for **no active profile**; active-profile continuity remains OPEN.

A fresh isolated database/auth fixture and TLS CA were prepared for exact signed sequence 17.
The unchanged quality-verified frozen Web runtime binding passed; helper tests passed 34/34.
Synthetic ADMIN/session creation and real server session validation passed. The isolated database
uses port 55420; no production database, host trust store or host DNS was changed. Sustained clock
preflight passed three samples over 122 seconds, receipt SHA-256
`676ba55535e65ee5feb84ab1a8540929f73aed4d86ecc58db464f939eabcfab1`.
Guest-only CA trust and hosts mapping then reached the local HTTPS login endpoint with status 200.
This is authenticated test infrastructure, not production OAuth or operator acceptance.

Before signed activation dispatch, SSH stopped at banner exchange on both 2222 and a temporary
loopback diagnostic 2223 forward. VBox logged an AHCI port reset at elapsed 00:11:11, followed by
heartbeat loss. The guest clock display stopped advancing. The state and log were preserved in
snapshot `20e02678-e865-4482-bf6c-bf368458d0fd` and `activation-stall-vbox.log`; no enrollment or
signed transition was dispatched. The earlier bounded environment PASS does not establish sustained
stability. The repaired snapshot was restored for a separate, prospective trial enabling SATA host
I/O cache, previously disabled. CPU/RAM remain 1 vCPU/4 GiB. This experiment is not a proven fix.

## Next Actions

1. Run an unfamiliar-operator walkthrough without developer coaching.
2. Observe the exact tuple on another independent physical Windows PC.
3. Record seven actual canary days and stop-condition outcomes.

These are follow-up adoption/canary evidence. They do not reopen the completed exact-installer
publication gate or authorize an identity-isolation claim.

## Unresolved Questions

None for the completed controlled internal release.
