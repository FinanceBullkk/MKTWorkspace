# Engine Cache Replacement - 9 September 2026

Publication HOLD. Exact 0.3.15 / Relay 17 is frozen; clean VM install passes 9/9.
Signed engine activation, active-profile tray lifecycle, repair/uninstall and physical MSI remain OPEN.
The older 0.3.13 and 0.3.14 installers remain rejected and preserved.

## Frozen Candidate

- Root: `D:/mkt-engine-cache-fix-20260909`.
- Candidate: `20260909-browser-0.3.15-relay-17-activated-engine-cache-cft`.
- Browser source: `6f4b771d2698b13fabfaa096bd6a68d71c22e7b4`.
- Browser build sibling: `e25f6ce3042230ebc3fd29c2f7c986599957a964`.
- Patched Web runtime: `b614ba26962418429aa807d59cbebe98fcc6eadf`; candidate metadata byte-identical
  to the Browser build sibling. Separate binding in `candidate/web-runtime-provenance.json`.
- Unchanged Relay 17 source: `78a8a84`, exact previous A2/B2 bytes retained.
- Installer: `candidate/installer.exe`, 146047538 bytes.
  SHA-256 `a5879c5e181c7d1a040b9ba885767b44e9c77788e698e0a8e09f556e3cd305a4`.
- Browser app.asar SHA-256 `062bc42fa6083391945666db6aa40031bfa262c367810d7503d29d3c4addfc10`.
- Relay ZIP SHA-256 `d8bf25dcb446d779bd5461419ea7562044e280ac1d16592a71a52f156f6359cf`.
- CFT 152.0.7977.64 SHA-256 `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004`.
- Signed sequence 19: fresh state 0 only; SHA-256
  `3fa8ffd1d733bf23ce0463f263004e4f0a51ccdd5c39a01e390181be14789320`.
- EXE remains NotSigned. Signed metadata does not add Authenticode.

## Verified Gates

| Gate | Result | Evidence / limit |
|---|---|---|
| Cache/bootstrap regression | PASS | Failed before; four focused cases pass, including explicit Retry bypass |
| Browser frozen quality | PASS | Seven commands; `evidence/browser-a-quality.json` |
| Critical coverage | PASS | 124/124; 91.57% lines, 84.57% branches, 91.43% functions |
| A/B payload comparison | PASS | 129 normalized files; zero differences; digest `fcffd1584891917c0b57dd04b4cbd36f3c4a37d938cce468473bb033af6c5dc1` |
| Signed metadata | PASS | Five artifact hashes/sizes, delegation, revocation, control contract; `candidate/metadata-verification.json` |
| Patched Web full quality | PASS | 2168/2168 tests; same count in coverage; production build, lint, typecheck; `evidence/mkttool-patched-quality/receipt.json` |
| Patched Web coverage | PASS | 81.01% statements, 76.70% branches, 82.34% functions, 83.59% lines |
| Patched Web security | PASS | Next.js 16.3.3 and sharp 0.35.4 remove fresh production advisories; `evidence/mkttool-patched-security/receipt.json` |
| Patched DB contracts | PASS | PostgreSQL 16.15 / Node 22.23.1; cluster stopped; `evidence/mkttool-patched-contracts/receipt.json` |
| Clean VM install | PASS | 9/9, exact tuple and receipt hashes verified; `candidate/vm-gate/clean-verification.json` |
| Signed activation / lifecycle | OPEN | First profile attempt before signed activation correctly refuses the absent engine pin; supported activation and recovery are next |
| Physical MSI | OPEN | Owner-run checklist after exact VM acceptance |

The first security run failed on critical Next.js and high sharp advisories. Preserve that receipt;
its source passed quality but is excluded from the acceptance fixture. One packaging preflight
refused transient coverage output in the Web test checkout; Browser packages use a separate clean
metadata sibling. Initial cold-boot VM preflight timed out; the bounded readback then confirmed the
exact VM, one CPU, Defender enabled, and no installed Browser, Relay or Node.

## Active Fixture

Private root: `C:/mkt-vm/pilot-engine-cache-private-20260909` (never commit contents).
Dedicated PostgreSQL port 55422, database `mkt_candidate_engine_cache_test`.
Helpers: `E:/MKTWorkspace/local-test-artifacts/local-release-20260908/pilot-engine-cache`.
Runtime binding: 42842 entries, SHA-256
`c6e19def822d672529355eaa6581d21217eb2b9889baf6f585ace02290185e9f`.
Observer proxy line 2 was independently verified: valid IP/timezone, country SG, no rate limit.
Clean snapshot `dde2d98e-72d7-466e-8339-fb6b9c552752` restored; 1 CPU / 4096 MiB / SATA host I/O cache.
Synthetic ADMIN session created and validated. Session revocation, fixture shutdown and guest
trust/hosts cleanup remain required after acceptance. No source push, deployment, upload or publication.

## Remaining Acceptance

### Host interruption and fixture reconciliation

Private CA launcher attempts R4 and R5 failed conservatively at bootstrap-state and immediate
process-identity checks. R5 stopped the known installed Relay and started PID 6532. A separate
read-only reconciliation verifies its exact executable hash, user SID, creation interval and
loopback listener ownership. This does not change R5 into PASS or prove enrollment/TLS success.
The guest Web UI accepted the synthetic session and opened Confirm this PC. The subsequent click
timed out as VirtualBox paused with `DrvVD_DISKFULL` because host C: had zero free bytes.
`candidate/vm-host-disk-full.log` preserves the environmental interruption. Retain the current
guest; recover host space, resume, and inspect enrollment before retrying any state change.
No sequence-19 activation request has yet been verified.

Host disk recovery relocated only the npm content cache to
`E:/MKTWorkspace/local-test-artifacts/host-disk-recovery-20260909/npm-cacache` and retained the
original path as a junction. All 10,870 files / 3,617,162,280 bytes match SHA-256. Receipt:
`E:/MKTWorkspace/local-test-artifacts/host-disk-recovery-20260909/receipt.json`;
manifest SHA-256 `f286727f17728d17ec20498773a0c122aca093f9c1f77485acf404cf6955e2fb`.
C: had 7,117,172,736 bytes free at completion. Installers, VM snapshots and private fixture data
were not relocated. The guest resumed; Defender and real-time protection were both enabled,
and a read-only database check confirmed zero fixture devices with the synthetic session valid.
Guest SSH/CDP still timed out after resumption. An ACPI shutdown was requested to recover the
guest without restoring or discarding its installed state; these interruptions are not product PASS.

The ACPI shutdown completed. Powered-off recovery snapshot
`96ae1217-439a-4f90-bc5c-9e921a751d15` preserves that state. The subsequent boot retained the
exact install. R6 fixes the fixture launcher's immediate process-discovery race and UTC comparison;
its guarded process-only CA launch passes, with Relay PID 3248 and the exact retained EXE.
`candidate/fixture-relay-ca-r6.json` SHA-256:
`dc76abfd76061afd1c12edb06451e33d3e098f43a7c3deb02e6e5656c76f7366`.
The normal Web Setup flow registered the one synthetic fixture PC, and the signed first-device
bootstrap completed through the local Relay form. The Web row reports operator key Ready.

Maintenance remains OPEN: Web health expires at four seconds while an independent browser read
took 4,514 ms. Later calls and a direct Browser MCP initialize read timed out. Setting the two
owned scheduled fixture processes from BelowNormal to Normal did not resolve the timeout, so
priority is not established as the cause. A native Check Relay action was also exercised; inspect
its error dialog and the synchronous `showErrorBox` path before attributing the later MCP stall.
No compatibility update request was submitted. Guest display AC timeout was temporarily disabled
to keep the observed test visible; host settings remain unchanged. Restore the clean VM at cleanup.

The new guest differencing disk grew to 5,684,330,496 bytes before activation; host C: fell below
600 MB. The agent proactively paused the VM to avoid another disk-full write failure. Relocation
of a registered medium belonging only to the powered-off older `mkt-phase5-clean` VM is in progress,
with original SHA-256 and VirtualBox snapshot links retained. Do not resume acceptance until the
storage readback passes and adequate reserve exists.

### Promotion Rejected: Blocking Relay Dialog

Native tray > Check Relay opened "Relay needs attention" with the owned-installation safety
failure message. While that dialog remained open, authenticated Browser MCP initialize timed out
after 12,287 ms and the tray stopped responding. After native OK dismissed it, initialize returned
HTTP 200 in 351 ms, tools/list in 26 ms, and get_runtime_info in 2,243 ms. These are observed
diagnostic tool results, not an automated acceptance receipt. The synchronous `dialog.showErrorBox`
in `checkRelayCompanion` blocks Electron's main thread. 0.3.15 is rejected for promotion; preserve
its artifacts and sequence 19. The elevated fixture Relay may correctly fail normal Browser
ownership checks; do not weaken those checks to avoid the dialog.

Native Quit was subsequently selected. The delayed readback
`candidate/runtime-post-quit-before-notification-fix.json` confirms no Browser processes or Browser
control listener, with the exact Relay PID 3248/listener retained and Defender enabled. This closes
empty-session Quit for the rejected candidate only; active-profile Quit remains OPEN.

Offline-medium transfer completed with matching SHA-256 and VirtualBox registration preserved:
`E:/MKTWorkspace/local-test-artifacts/host-disk-recovery-20260909/offline-medium-transfer-receipt.json`.
The moved file is a registered snapshot dependency and must be retained. The exact synthetic
session was revoked (one deleted, zero remaining) at 2026-09-09T00:29:35Z; receipt:
`candidate/pilot-session-revocation.json`. ACPI shutdown was requested before further build work.

Next: correct the notification, validate the pending-dialog regression, commit before freezing a
new version, and repeat A/B plus exact VM acceptance. Existing nonzero MSI activation requires its
own reviewed transition; do not force a fresh-state manifest onto it. MSI delivery and publication
remain HOLD until the replacement passes its own gates.
