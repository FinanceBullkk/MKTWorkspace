# VM Stabilization Addendum

## Context

Continue phase 4 on the frozen installer SHA-256
`255c1a1c0128dabc4ef1fc3c51a864cc2dd2c790b98fb9af2ff462f885e06347`.
No product rebuild, host reboot, host security changes or source snapshot deletion.
The original VM repair task was independently read back at 04:43Z: Ready, result 267011,
last run 1999-11-30; no repair output. At that read-back it had not run. Preserve the original task.

## Hypothesis and Plan

Hypothesis: saturated D: SATA plus a mixed-drive chain contributes to guest stalls.
NEM and memory limits remain possible contributors; a storage clone is an experiment.

NVMe clone initial-boot checkpoint (8 September, executing agent observations): the independent
clone exists and has booted. Its allocated disk grew from 18.67 GiB to 25.56 GiB while Windows
maintenance ran. Guest-only 10-second idle sleep settings were disabled; no host power setting
was changed. Guest UTC still lagged by 46 seconds and a heartbeat gap reached 178 seconds.
At that checkpoint VBoxService time synchronization was under investigation; no synchronization
or stabilization PASS had been recorded. Disk growth, clone completion and disabled sleep do not
establish a root cause or close the responsiveness, resource or signed-ticket clock gates.

The separately reviewed NVMe gate generator preserves the exact r2 product tuple and raw gate
assertions, uses a distinct task namespace, and initially left every clone gate OPEN. Its VM/snapshot
provenance is declared metadata only; actual identity, storage, restore and responsiveness require
host/guest read-back. Supported activation will use the
[fresh NVMe fixture plan](./reports/pilot-nvme-fixture-plan.md), not the revoked session or enrolled
device state from the retained old fixture. Helper tests are synthetic, not activation evidence.

## Verified NVMe Checkpoint

Historical receipt read-back confirms a bounded environment stability PASS, not current sustained
stability or product readiness. The later 06:29Z clock preflight below is FAIL.
Clone VM: `13b74869-d2e9-4df6-a043-d8c6b079db04`; stable baseline verified by the executing agent:
`dde2d98e-72d7-466e-8339-fb6b9c552752`. The bound gate metadata names this baseline but does not
independently observe a restore. Source snapshot and original stalled VM evidence remain preserved.

- First stability attempt remains FAIL (`CLOCK_NOT_ACCEPTABLE`, 46,128 ms observed offset;
  host free RAM 0.98 GiB). It is not reclassified by the later pass.
- Guest-only VBoxService restart completed at 05:05:02Z. The receipt reports no host-clock or
  ticket-policy change; this does not establish storage as the sole cause of the earlier stalls.
- Stability r2 PASS completed at 05:08:28Z: three SSH probes over more than two minutes,
  maximum 3,620 ms response and 2,924 ms clock-offset bound; host free RAM 1.13-1.29 GiB,
  C: free 35.08-35.09 GiB. The helper checks original VM off and clone running at 4 GiB / 2 CPUs.
- Guest read-back: Defender and antivirus enabled; product, developer Node and pilot hosts entry
  absent; no gate tasks; original guest power values saved and idle sleep/hibernate timeouts zero.
  Windows Time still reports unsynchronized; only the measured offset window passed. Remeasure
  before signed-ticket work; do not infer persistent synchronization.
- I/O PASS: exact 145,066,456-byte installer copy and SHA-256 match in 3,176 ms. This is a bounded
  guest copy/hash observation, not an activation or sustained-performance result.

Evidence root: `local-test-artifacts/local-release-20260908/` (local-only).

| Receipt | Result | SHA-256 |
|---------|--------|---------|
| `nvme-stability-receipt.json` | Historical FAIL | `1962d2f0d28c79e3d6fac551e45d5efbc789b17240cdfc899252e13bf55f6026` |
| `nvme-stability-r2-receipt.json` | Environment PASS | `c3be09cfa574e089ae50ce3afd70fc324fb31541aef4c1119afeb17bab49f88a` |
| `io-receipt.json` | Copy/hash PASS | `f04e3b281676d7c82378f2d091052b969bc006f9e7038956049fe906288e9f05` |

Exact NVMe repair 13/13, uninstall 15/15 and clean install 9/9 now have bound PASS receipts,
all child exit 0; see [phase 4 receipt bindings](./phase-04-exact-vm-verification-and-delivery.md).
These technical results do not close supported CFT activation. The earlier fresh-fixture checkpoint
had a blank guest UI and no completed enrollment. Later observations below supersede the blank-UI
description, not the preserved failures or pending activation. Old enrollment and revoked-session
evidence cannot substitute. No public/operator publication or readiness claim.

## Later NVMe Diagnostic Checkpoint

Earlier executing-agent observations on 8 September, separate from hash-bound installer receipts.
The 10:36Z continuation below supersedes permission and process identities, not these failures:

- The NVMe guest is not globally frozen: the original host-forwarded SSH port 2222 times out at
  the banner, while guest-loopback SSH and Edge's local diagnostic port 9333 remain responsive.
  A runtime-only diagnostic NAT forward on port 2223 works. This isolates an access-path symptom;
  it does not prove NEM, storage or RAM as the root cause of earlier stalls.
- Guest display-off timeouts were AC 300 seconds / DC 180 seconds, saved in the guest record
  `display-power-before.txt`, then set to zero on the disposable guest only. These are display
  settings, distinct from the earlier sleep/hibernate change. No host power settings were changed.
- The guest-only test CA was accepted and the Web `/setup` session authenticated. Fresh enrollment
  count remains zero. Permission queries return `prompt` for `local-network-access`,
  `loopback-network` and `local-network`. Clicking the actual `Allow local access and retry`
  button still leaves `Needs repair`; user Allow remains pending. These observations do not
  establish Web-to-Relay connectivity or enrollment.
- Relay launcher r1 remains FAIL (`PROCESS_IDENTITY_UNCERTAIN`). Reviewed r2 two-stage helpers
  have 8/8 static tests reported PASS. Live stop-task read-back at 06:24:22Z is Ready with result
  267014 (`0x41306`), no stdout/stderr, attempt or receipt; old Relay PID 928 with creation time
  05:29:39.3150970Z is unchanged. An independent startup-only PowerShell probe has the same
  Ready/result and no receipt. Neither a completed stop nor a task-dispatch cause is established;
  do not attribute the result to the PT2M setting. Receipt binding and first-run observation are in
  [phase 4](./phase-04-exact-vm-verification-and-delivery.md).

06:29Z preflight remains FAIL: host UTC interval `06:29:05.0185585Z` to `06:29:13.5864710Z` versus guest
`06:28:38.3783479Z` gives guest lag 26.64-35.21 seconds, above the 5-second limit. Host free RAM
2.83 GiB, guest free RAM 691,232 KiB, C: free 17.84 GiB; original VM off. These reserves do not
override the clock failure or establish a root cause. Signed activation is paused while clock and
task dispatch remain unresolved; historical stability r2 PASS is not a current sustained PASS.

The installer tuple and three completed installer gates are unchanged. Supported activation,
managed lifecycle and page-network remain OPEN. Cleanup is explicitly OPEN: VM and fixture are
retained for continuation, with guest CA, hosts mapping, NAT 2223 and display changes still present.

## 10:36Z Continuation Checkpoint

- The user allowed Apps on device. At 10:36Z actual Edge queries returned `granted` for all three
  network permission names; screenshots showed Local network Allow and Apps on device Allow.
  Actual Web-page `/health` fetch reached Relay: HTTP 400, `ok: false`, `configured: false`,
  Relay v16, no device. Web-to-Relay transport PASS only; enrollment/activation remain OPEN.
  The UI now shows `Confirm this PC`; no confirmation was clicked.
- Guest Windows Update restarts at 07:20Z and 07:26Z are observed in event 1074. Current Relay PID
  4664 retains EXE SHA-256 `300646e1ea35aa47ece1b0d608d9b9681ee5bde82dd084bcdc5145345d07b60e`;
  Edge PID 6760 serves port 9333. PID 928 and its r2 stop assumptions are obsolete: do not rerun
  those helpers. The old stop/probe remain Ready/result 267014 with no receipts. Diagnostic tunnel
  19333 now uses session 74820; VM remains 4 GiB / 2 CPUs. No product rebuild or publication.
- UTC clock FAIL persists: host 10:37:01.4879Z-10:37:05.8087Z versus guest 10:36:53.8311Z gives
  7.657-11.978 seconds lag. Guest Pacific timezone offset -420 explains the 14-hour display
  difference from ICT; it does not explain or waive the measured UTC drift.
- A guest-only 1,000 ms timesync-interval experiment ran 10:44:46Z-10:44:55Z. Property read-back
  and VBoxService restart succeeded, but guest UTC 10:44:55.9696Z versus host
  10:45:38.8218Z-10:45:43.9150Z gives 42.852-47.945 seconds lag: FAIL. The exact interval property
  was removed to restore its prior absence, and VBoxService Running was confirmed. Retain local
  `nvme-clock-interval-r3.json` and `nvme-clock-interval-r3-terminal.json` as historical experiment
  records (`STARTED` / `APPLIED_UNVERIFIED`), not clock acceptance or rollback receipts.
- NTP stripchart returned three samples near +56.54 seconds; `w32tm` resync reported no time data.
  Later event 37 reports valid data, but neither result proves the measured clock gate passed.
  No battery instance was found; interactive-session state was not observed because `quser` was
  unavailable. Battery, task-dispatch, NEM, storage and RAM causes remain unproven.
- Read-only preflight r3 completed at 10:50:04Z: FAIL (`CLOCK_OR_LATENCY_GATE_FAILED`). Three
  samples over 125.587 seconds measured offset intervals [-667, 3670] ms (PASS),
  [13553, 18023] ms (FAIL), then [27755, 31762] ms (FAIL). SSH 4.007-4.471 seconds is within
  the 15-second limit; host free RAM 2.07-2.10 GiB, C: free 15.65 GiB, exact VM 4 GiB / 2 CPUs
  and original VM off pass their checks. Initial near-sync did not persist: approximately
  14 seconds/minute loss is observed, without proving NEM or another root cause.
- Local `nvme-current-preflight-r3-receipt.json` SHA-256 and sidecar match:
  `be08ceaad3d13f7b3b757376ca6ac63e39daa6c72cbfdb04131c2e7c62b0e653`.
  `signedActionsPerformed: false`, `releaseReady: false`. The experiment's interval property
  is again confirmed absent. Stop further runtime retries: signed activation remains paused for
  an architectural clock/environment decision, not another network-permission request.

No host clock/security or product changes were made. Cleanup remains OPEN: retained VM/fixture,
guest CA/hosts, NAT 2223, diagnostic tunnel and guest display changes need final reconciliation.

## 10:58Z Read-Only Clock Narrowing

The r3 receipt and helper bindings were independently reviewed; FAIL remains correct. No gate,
time-sync helper, stale Relay task or signed action was rerun during this diagnostic continuation.

- Current VBox configuration/log review found CPU cap 100%, NativeApi TSC multiplier 1 and equal
  host/guest TSC frequency 3,493,468,559 Hz. No clock-warp override was found. The reported WHv
  frequency differs by only 109 Hz; this does not explain seconds-per-minute loss. HyperV paravirt
  and NEM are observed, not proven causes. Log catch-up discards corroborate virtual timer debt.
- Guest `GetSystemTimeAdjustment` returned adjustment/increment 156250/156250 and disabled true;
  no Windows rate adjustment was active at that instant. W32Time remained unsynchronized.
- One read-only SSH process compared UTC, QPC and TickCount, with host monotonic receive stamps:

| Sample | Host receive UTC | Guest UTC | Guest QPC elapsed ms | Guest TickCount ms |
|--------|------------------|-----------|----------------------|--------------------|
| 0 | 10:57:29.5720209Z | 10:56:53.6445908Z | 62.5586 | 12678390 |
| 1 | 10:57:39.5877491Z | 10:57:01.6923695Z | 10237.0556 | 12688578 |
| 2 | 10:57:49.6048499Z | 10:57:10.3553491Z | 20253.8819 | 12698593 |

Across samples 0-2, host receive monotonic delta was 20,028.4178 ms, guest QPC 20,191.3233 ms,
TickCount 20,203 ms, but guest UTC only about 16,710.7583 ms. SSH exited 0. Receive timing is not
an exact guest execution timestamp; the independent guest-counter comparison nevertheless narrows
the fault to wall-clock progression rather than all guest counters slowing uniformly. It does not
identify the responsible virtualization/Windows component. These are diagnostic command observations,
not another acceptance receipt or proof of a lasting fix.

At 10:58:03Z host free RAM was 2.24 GiB and C: free 15.66 GiB. Both product worktrees stayed clean.
Do not apply another speculative timing change. Recommended next decision: use an available second
test machine with a stable clock for the remaining exact-installer acceptance; machine availability
and access must be established before migration. Preserve this VM and owned fixture pending that
decision; cleanup remains OPEN. No product rebuild, host reboot/security change or publication.

## Execution Steps

1. Collect original guest task/power/clock state; normal shutdown, verify poweroff.
2. Full clone only clean snapshot `326357d7-35b1-4c91-92ca-856fb0f35e9b`
   to `C:\mkt-vm\mkt-phase5-nvme-20260908`, mode machine, no linked clone.
   Preserve original VM and stalled snapshot. Require destination absent and C: reserve
   >=15 GiB. Clone source allocated sum is ~24 GiB; C: free ~62 GiB.
3. Before first boot set clone to 4096 MB, 2 CPUs. Verify disk parent is base,
   all clone hard disks on C:, original off, only one NAT port 2222 owner.
4. Check guest product/fixture absence, Defender, UTC and task/process state.
   Require measured host/guest UTC offset <=5 seconds before signed-ticket tests.
   Record and disable guest idle sleep/hibernate for the disposable acceptance VM
   only; retain original values. Never bypass TLS or signed-ticket expiry.
5. Measure at least three bounded SSH probes over >=2 minutes and a bounded
   guest file copy/hash before acceptance. Preserve host >=1 GiB and C: >=15 GiB.
   If stalls persist, investigate new evidence rather than repeatedly restarting tests.
6. Take powered-off clone baseline; record UUID/provenance. Transfer verified exact
   bundle, run repair then uninstall with bound receipts. Rebind the harness to the new
   clone baseline in a separate bundle; preserve exact product bytes and prior r2 evidence.
   Use unique task names; read back actual start/run and terminal state. An SSH timeout
   does not cancel a guest task: reconcile it before any retry or shutdown.
7. Resume isolated pilot only after reviewing fixture guard and reconciling enrollment.
   Signed provisioning, managed lifecycle and network acceptance remain separate.

## Todo

- [x] Independent review; accepted clone path, added UTC/task/provenance safeguards.
- [x] Independent NVMe clone created and booted; clone completion alone is not a PASS.
- [x] Stable clone baseline recorded; executing agent verified the exact baseline UUID.
- [x] Guest responsiveness, measured clock offset, power and resources passed the bounded r2 window.
- [x] Exact repair, uninstall and clean-install receipts collected with raw/hash bindings.
- [ ] Reconfirm original-off, NAT-port exclusivity, clock and reserves before resumed activation.
- [x] Web network permissions granted; actual Web-to-Relay health transport observed at 10:36Z.
- [x] Collect final r3 preflight FAIL receipt; preserve exact hash and three measured samples.
- [ ] Decide clock/environment remediation before more runtime retries; never rerun stale r2 stop.
- [ ] Complete fresh enrollment through the actual Confirm this PC UI after clock acceptance.
- [ ] Supported activation/lifecycle completed or bounded blocker documented.
- [ ] Plans/evidence updated; owned services and runtime diagnostic NAT forward cleaned up.

## Risks

Clean clone repeats machine identity but runs alone against isolated fixtures only.
Snapshot defaults can restore 6 GiB; reassert 4 GiB before every boot.
Do not infer environment or product PASS from a successful clone alone.

## Unresolved Questions

Why the original host-forwarded SSH path stalls while guest-loopback and diagnostic NAT access work;
whether longer guest operation remains stable after the bounded r2 environment pass.
