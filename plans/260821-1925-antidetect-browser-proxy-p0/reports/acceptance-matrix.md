# P0 Acceptance Matrix

**Baseline run:** `P0-G0-20260821-01`

**Status vocabulary:** `PASS`, `FAIL`, `BLOCKED`, `OPEN`, `INVALID`, `NOT-RUN`, `SUPERSEDED`

`NOT-RUN` marks a declared check that never executed; it is never absent and never implied to pass.
`SUPERSEDED` marks a result a later, better-instrumented run replaced. The superseded row stays
visible with a pointer to what replaced it, so a reversal is never silently overwritten.

**Rule:** A unit test cannot close a packaged Windows, real-proxy, license-service, second-PC, or
human interaction gate.

## Evidence Contract

Every retained run must contain only:

- run ID, source SHA, dirty-diff digest when applicable, artifact SHA-256, and version;
- disposable profile label, proxy label, engine kind, host label, and operator role;
- stable error code, boolean route match, country/ASN label, bounded timing, and cleanup result;
- control/treatment classification, invalidation reason, and final verdict.

Never retain full license keys, proxy URLs, proxy hosts, proxy credentials, observed IP addresses,
MCP tokens, Relay tickets, cookies, credentials, OTP values, raw vendor responses, or page content.
Secret-like error values must be redacted longest-first before they can enter a report.

## Disposable Assignments

| Label | Profile ID | Proxy label | Engine | Status |
|---|---|---|---|---|
| `P0-A` | Pending owner selection | Pending owner selection | CloakBrowser for operational proof; CFT control where specified | `BLOCKED` |
| `P0-B` | Pending owner selection | Pending owner selection; must differ from `P0-A` | CloakBrowser for operational proof; CFT control where specified | `BLOCKED` |

No real account, existing operational profile, or production proxy may be substituted for these
labels during disposable gates.

## G0 Baseline Gates

| Gate | Expected evidence | Current result | Status |
|---|---|---|---|
| `G0-SOURCE` | Workspace, MKTTool, and MKTBrowser branch/SHA/dirty state | Recorded in `baseline-report.md` | `PASS` |
| `G0-OWNERSHIP` | Existing root work is inventoried and untouched | 18 reports plus one audit-plan edit remain user-owned | `PASS` |
| `G0-NODE22` | Node 22 plus adjacent Corepack runs package preflight | Node `22.18.0`, Yarn `4.5.0` | `PASS` |
| `G0-MKTTOOL` | Tests, typecheck, lint, build | 1,878 tests and all compile/build gates pass | `PASS` |
| `G0-BROWSER` | verify:node, typecheck, lint, installer tests | Pass; 217 passed, 1 explicit pre-install machine skip, 0 failed | `PASS` |
| `G0-PACKAGED` | Fresh directory package passes public runtime/lifecycle contract | Pass after preserving the `PROXY_REJECTED` assertion | `PASS` |
| `G0-ARTIFACTS` | Installed, candidate, Relay, installer, and rollback hashes | Final installer, installed Browser, Relay archive entry, and frozen rollback tuple match | `PASS` |
| `G0-PORTS` | `47821` and `47822` owned by expected installed binaries | Exact installed Relay and Browser paths, hashes, versions, and sanitized health verified | `PASS` |
| `G0-PAIRS` | Two approved disposable profile/proxy pairs | Not supplied | `BLOCKED` |
| `G0-REDACTION` | Owner approves this evidence contract | Approved by owner on 21 August 2026 | `PASS` |

## Downstream Gates

| Gate | Minimum evidence | Status |
|---|---|---|
| `G1-INPUT` | Valid cover control, interleaved A/B evidence, three packaged manual-login interactions | `OPEN` |
| `G2-NETWORK` | Two proxies, matching independent/in-browser route, no DNS/WebRTC bypass | `OPEN` |
| `G2-IDENTITY` | Same-profile stability plus cross-profile fingerprint/storage separation | `OPEN` |
| `G3-LICENSE` | Measured vendor schema and confirmed-release-only lease state | `OPEN` |
| `G3-RECOVERY` | Normal close, hard kill, Electron crash, Relay restart, and reboot recovery | `OPEN` |
| `G4-OPERATOR` | Second-PC installer/setup with no manual secret or configuration copying | `OPEN` |
| `G5-CANARY` | Seven days of approved manual use with all metrics inside threshold | `OPEN` |
| `G5-DECISION` | Signed GO or exact NO-GO blockers | `OPEN` |

## 24 August Lifecycle and Installer Reconciliation

| Gate subset | Current result | Status |
|---|---|---|
| Receiving-machine candidate hash | Clean guest hash equals published `d18c8d79...` | `PASS` |
| Supported combined install | Old 9/9 evidence stopped at Browser-file appearance; Relay/firewall/custom metadata were absent | `INVALID` |
| Installer repair | Superseded by the R3 run below. The Defender block was caused by the installer's `EncodedCommand` pattern, not by the product contract | `SUPERSEDED` |
| Normal close | Current local artifact reached `Browser.close`, child exit 0, and `SHUTDOWN-COMPLETE`; the used seat returned without new recovery/cooling state | `PASS` |
| Hard kill / Electron crash | Terminate access denied for all disposable engine processes and Browser main process | `BLOCKED` |
| Relay restart | No Relay process/listener on the measured host | `BLOCKED` |
| Host reboot | Not separately authorized; would disrupt unrelated user processes | `BLOCKED` |
| Pending-recovery reboot | Driver journal writes, profile sidecar, and startup vendor release remain unintegrated | `OPEN` |

These subset results do not close `G3-RECOVERY` or `G4-OPERATOR`. Normal-close evidence is bound to
the current local directory artifact, not the older attested candidate. See
`lifecycle-installer-repair-evidence-20260824.md`.

## 24 August R3 Installer Repair Reconciliation

Supersedes the midday Defender-block record above. Evidence:
`local-test-artifacts/installer-repair/vm-local-r3-20260824/installer-repair-evidence.json`.

Candidate under test is a **dirty local build**: source `c802fabb`, tree `bd87f752`, installer
SHA-256 `e5f10512...aeaaa3e`, `attested: false`, `releasable: false`. Nothing here authorizes
publication, and none of it transfers to a future rebuilt candidate.

| Gate subset | Current result | Status |
|---|---|---|
| Defender policy untouched | Real-time protection enabled throughout; `policyChanged: false`; zero threats detected | `PASS` |
| Supported combined install | Browser plus the pinned Relay archive reached the supported combined state with Defender on | `PASS` |
| Initial launch | Browser serves loopback port `47822` | `PASS` |
| Damage injection onward | Harness aborted before these ran | `NOT-RUN` |
| Repair matrix verdict | 6 of 13 declared checks ran; the rest never executed | `FAIL` |

The `EncodedCommand` remediation is closed: packaged `.ps1` files replaced the pattern Defender was
flagging as `Behavior:Win32/PShellCobStager.A`.

### Why the run stopped, and what was wrong with how it reported

Root cause was the harness, not the product. After `initial launch` the gate hashed
`profiles.db` while the Browser it had just started still held the file open.
`Get-Sha256` called `.Hash` on the empty result of a failed `Get-FileHash`, producing
`You cannot call a method on a null-valued expression`. The underlying reason the process was still
alive is that `Stop-OwnedProcesses` force-killed by name under `-ErrorAction SilentlyContinue`,
so a denied termination was silently discarded and the harness continued as if the file were free.

The evidence file then recorded `total: 6, passed: 6, failed: []`. A truncated matrix read as a
green result. This is the same reporting defect that produced the invalid 9/9 clean-machine record,
in a different script.

Fixes applied to `local-test-artifacts/vm/run-installer-repair-gate.ps1`:

1. `Get-Sha256` retries a locked file, then fails with `REPAIR-HASH-FILE-LOCKED` instead of crashing.
2. `Stop-OwnedProcesses` closes gracefully first so SQLite releases its handles, waits for real
   process exit, and raises `REPAIR-PROCESS-STOP-DENIED` rather than swallowing an access denial.
3. The summary declares all 13 expected checks and carries `notRun` plus an explicit `verdict`, so
   an incomplete run cannot be read as a pass. Replaying the R3 outcome against the fixed logic
   yields `verdict=FAIL, ran=6/13, notRun=7`; a complete clean run still yields `verdict=PASS`.
4. The `REPAIR-CANDIDATE-HASH` detail no longer claims the value is "attested" when it is not.

Rerunning the matrix requires only `VBoxManage snapshot mkt-phase5-clean restore clean-with-ssh`.
No VirtualBox registration change is involved.

## 24 August Licence Key Reliability

Evidence: `licence-key-reliability-probe-20260824.md`. Measured 12:13Z-12:18Z, single session.

| Gate subset | Current result | Status |
|---|---|---|
| Key 1 seat grant/release | Granted and released cleanly | `PASS` |
| Key 2 seat grant/release | Granted and released cleanly; the key is not dead or revoked | `PASS` |
| Two concurrent seats, one `install_id` | Both granted while the other was held; per-licence counting confirmed again | `PASS` |
| Key 2 at engine level | Rotation forced onto key 2; `BOOTSTRAP-DONE` at 2.229s, alive through t+25s | `PASS` |
| 23 August "only one key works" finding | Cause restated: an orphaned seat, not an unreliable key | `SUPERSEDED` |
| Key 1 at engine level | Refused twice (12:34Z, 12:51Z) while both the pool and the licence API read the seat free; each refusal left `active_sessions: 1` with no local process | `FAIL` |
| Key 1 unaided recovery | Cleared on its own 15m19s after the first refusal, inside the 900s lease expiry measured on 24 Aug (15.1 min) | `PASS` |
| Product visibility of seat state | No product code calls the licence session API; the pool is an inference and read `2/2 free` while a seat was held | `FAIL` |
| **Concurrent two-profile launch** | **Attempted 12:34Z. Profile A launched; profile B refused `ENGINE_UNAVAILABLE`. No engine spawned for B** | `FAIL` |

Two proxies were verified reachable with distinct exits first, so this is not a proxy fault, and the
licence API grants two concurrent leases, so it is not a plan-limit fault. Launching one profile
spent both keys: one on a refused attempt, one on the profile.

`G2-IDENTITY`'s concurrent two-profile requirement stays `OPEN` and is now blocked by an orphaned
licence seat rather than by key count.

## Invalidation Rules

A run becomes `INVALID` when any source diff, artifact hash, profile/proxy assignment, engine version,
firewall rule, compatibility tuple, test order, or prewritten control changes. A failed control makes
its paired treatment invalid. Missing cleanup, missing timestamps, secret-bearing output, or an
unexplained process owner also invalidates the run.

Skipped machine and human gates remain `OPEN` or `BLOCKED`; they are never converted to `PASS` from
unit, mock, source-shape, or unpackaged evidence.
