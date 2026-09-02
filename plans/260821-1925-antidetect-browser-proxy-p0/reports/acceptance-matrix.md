# P0 Acceptance Matrix

**Baseline run:** `P0-G0-20260821-01`

**Status vocabulary:** `PASS`, `FAIL`, `BLOCKED`, `OPEN`, `INVALID`, `NOT-RUN`, `SUPERSEDED`, `DEFERRED`

`NOT-RUN` marks a declared check that never executed; it is never absent and never implied to pass.
`SUPERSEDED` marks a result a later, better-instrumented run replaced. The superseded row stays
visible with a pointer to what replaced it, so a reversal is never silently overwritten.

`DEFERRED` marks a declared check removed from the release path by an owner scope decision, never by
evidence. It is not a pass, and a `DEFERRED` row may never be counted as one.

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

## G0 Baseline Gates (historical 21 August snapshot)

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

## Downstream Gates (ledger snapshot; current candidate reconciliation below)

| Gate | Minimum evidence | Status |
|---|---|---|
| `G1-INPUT` | Valid cover control, interleaved A/B evidence, three packaged manual-login interactions | `OPEN` - one manual-login interaction now evidenced, see 27 August below |
| `G2-NETWORK` | Two proxies, matching independent/in-browser route, no DNS/WebRTC bypass | `OPEN` |
| `G2-IDENTITY` | Same-profile stability plus cross-profile fingerprint/storage separation, measured sequentially | `FAIL` - reaffirmed 2026-08-30 from the licensed Stable `.2` evidence: fonts `08050B16`, `OfflineAudioContext` `0B09CAEB`, and WebGL `BF16CA5C` collide; see the reconciliation below |
| `G2-CONCURRENT` | Two profiles open at once with no cross-wiring | `DEFERRED` - one seat, capped at one profile (25 Aug owner decision) |
| `G3-LICENSE` | Measured vendor schema and confirmed-release-only lease state | `OPEN` |
| `G3-RECOVERY` | Normal close, hard kill, Electron crash, Relay restart, and reboot recovery | `OPEN` - 2026-08-30 reconciliation: the historical dirty-source/v15 power-cycle subset is PASS, but the exact v16 candidate still lacks clean-VM and power-cycle evidence; see the reconciliation below |
| `G4-OPERATOR` | Second-PC installer/setup with no manual secret or configuration copying; the clean VM guest is PC B and is recorded as virtual | `OPEN` |
| `G5-CANARY` | Seven days of approved manual use with all metrics inside threshold | `OPEN` |
| `G5-DECISION` | Signed GO or exact NO-GO blockers | `OPEN` |

## 27 August first human input session

Evidence: `local-test-artifacts/phase5/g1-input-first-human-session-evidence-20260827.json`, run
`P0-G1-INPUT-FIRST-HUMAN-20260827124333`.

The first time a person typed into this product. Every earlier gate was machine-measured. Packaged
build of 27 August 02:45 from Browser source `137a849`, engine CloakBrowser `151.0.7922.108.2`,
run against the real operator data root rather than a disposable one.

| Gate subset | Current result | Status |
|---|---|---|
| Typing, click, scroll on the packaged build | Operator reports normal behaviour with no stall, in the area whose history includes input-dispatch stall, ten-second profile death, and occlusion stall | `PASS` (human testimony) |
| Real third-party login | A YouTube/Google sign-in completed inside a launched profile | `PASS` (human testimony) |
| Session survives close and reopen | Closed 05:56:43Z, reopened 05:56:48Z, still signed in | `PASS` (human testimony) |
| Launch/close discipline across five cycles | Four closes, all `Browser.close` with exit 0 and `SHUTDOWN-COMPLETE`; all four leases `confirmed-released` on one key; no kill, no cooling from a bad close, no stranded lease | `PASS` (machine) |
| Cold versus warm launch | Cold 21.7s; warm relaunch 3-4s with `BOOTSTRAP-DONE` at 1.58s | `PASS` (machine) |
| DevTools listener ownership on real hardware | Port resolved to the owned process on 127.0.0.1 at first try, with no listener-provider warm-up | `PASS` (machine) |
| Licence key rotation under a live refusal | Key `...bdf2ae` refused with exit 76 and "session limit is reached"; the pool rotated to `...b8f6b7` and the launch succeeded with no operator-visible error | `PASS` (machine) |
| State written to disk on close | Cookies and History written at close | `PASS` (machine) |

`G1-INPUT` stays `OPEN`. It requires **three** packaged manual-login interactions plus valid cover
control and interleaved A/B evidence; one interaction is now evidenced and the cover/A-B halves are
untouched.

This session carries **no network-identity claim**: the profile had no proxy, so egress used the
operator's real IP. It is input evidence only.

Two earlier claims are corrected by this run:

- The second licence key was retested the same day and the reading above was wrong. See the
  concurrency retest below.
- The `portOwnerPids=none` blocker seen twice in the disposable VM earlier the same day did not
  reproduce on real hardware, supporting the existing note that it is an environment artifact rather
  than a product defect.

## 27 August cross-profile fingerprint measurement

Evidence: `local-test-artifacts/phase5/g2-identity-cross-profile-fingerprint-evidence-20260827.json`,
run `P0-G2-IDENTITY-20260827131800`. Two profiles measured sequentially on
`browserscan.net/fingerprint`, same packaged build, same host, minutes apart.

Neither profile had a proxy, so every IP-derived reading is the operator's real address. This is an
identity-separation measurement only and carries no network claim.

### Three surfaces are identical across profiles

| Surface | Profile A | Profile B | |
|---|---|---|---|
| Fonts | `08050B16` (72) | `08050B16` (72) | **identical** |
| Audio | `0B09CAEB` | `0B09CAEB` | **identical** |
| WebGL | `BF16CA5C` | `BF16CA5C` | **identical** |

The fonts result confirms the prediction in `research-260819-1234`. The audio and WebGL results were
not predicted and **contradict** that report's note that canvas, WebGL and audio all rotate with the
seed: canvas does, the WebGL image hash and audio do not.

Together they are a three-field join that survives separate proxies, separate cookies and separate
canvas noise. One flagged account can point at every sibling on the host.

### What does rotate

Canvas `D4D88270`/`D08CCA8E`, WebGL Report `55AEDBC1`/`87C03A8B`, Client Rects, WebGPU Report,
visitor ID, hardware concurrency (6 vs 8), screen size, GPU renderer string, timezone, and the full
language stack. Timezone and locale are coherent end to end: A reported `America/Vancouver` with
Pacific Daylight Time and a date rolled back to 26 August, B reported `Asia/Jakarta` with Waktu
Indonesia Barat, and each profile's JS languages, `Accept-Language` header and Intl API agreed.
Neither profile reported the host's real GPU.

### A separate defect found by the same run: screen scaling

| Profile | Declared | Reported `screen` | Reported `avail` |
|---|---|---|---|
| A | 1680x1050 | **2520x1575** | 1680x1002 |
| B | 1536x864 | **2304x1296** | 1536x816 |

The host runs at 150% (`AppliedDPI 144`). `--fingerprint-screen-width/height` are multiplied by that
scale; `availWidth/availHeight` and `--fingerprint-taskbar-height` are not. The halves end up in
different units, which produces values no real machine can show: `availWidth` smaller than `width`,
and a height-minus-availHeight of 573 and 480 pixels against a real taskbar of 40 to 72. It also
makes a profile non-portable, since the same profile reports different screens on hosts with
different scaling. The driver comment records the switch as honoured exactly on CloakBrowser 146, so
either 151 regressed or the case was never exercised away from 100% scaling.

### Screen scaling: fixed and re-measured the same day

Browser `55b8587` forces the engine's device scale factor to the persona's own `dpr`, so the host's
Windows scaling no longer reaches `--fingerprint-screen-width/height`. Re-measured on profile A with the
rebuilt package:

| Reading | Before | After |
|---|---|---|
| `screen` | 2520x1575 | **1680x1050**, the declared size |
| `availScreen` | 1680x1002 | 1680x1002, unchanged |
| `height - availHeight` | 573 | **48**, a real taskbar |
| `availWidth` against `width` | 1680 sitting inside 2520 | **equal** |

Side effect, taken deliberately: the browser no longer follows the operator's Windows scaling, so a
persona claiming a 1680x1050 screen at dpr 1 renders as that machine would. Personas declaring a dpr
other than 1 have not been re-measured.

**Still unpinned by any test.** The switch list cannot be asserted from a unit test today, because
`ChromiumBrowserDriver` does not load standalone under strip-types - it pulls in profile-manager and
its native sqlite. That is precisely how this defect survived every automated gate. Pinning it needs
the CloakBrowser arg builder extracted into its own module, as `chromium-network-privacy-flags.ts`
already was after that set regressed twice from the same file.

### The score, and why it misleads

Browserscan rated the profile **90% authentic**, deducting only for "Different time zones - IP
timezone does not match local timezone" - which is exactly what an assigned proxy fixes. A correctly
proxied profile should score 100%.

That score is nonetheless the wrong instrument for this product. It is computed per profile, so it
is structurally blind to the cross-profile joins above. Each account looks convincingly real on its
own while every account carries the same three-field mark.

### Effect

`G2-IDENTITY` is `FAIL`. At two or three profiles the shared triple is tolerable; at ten channels it
is a real linking risk, so this blocks scaling rather than blocking today's use. Ordered actions:
wire the unused `--fingerprint-fonts-dir`; re-read the CloakBrowser 151 switch table for anything
that rotates audio and the WebGL image hash; and fix the screen scaling, which is the only one of
the three entirely within our own code.

## 27 August switch experiment: the joins are not fixable with what 151 ships

Evidence: `local-test-artifacts/phase5/cloakbrowser-151-switch-experiment-20260827.json`, run
`P0-FP-SWITCH-EXPERIMENT-20260827135700`.

### The engine's switch table is not the one the August research read

Re-read from the running engine's `chrome.dll` (151.0.7922.108), not from 146:

| Gone since 146 | New since 146 |
|---|---|
| `fingerprint-fonts-dir` | `fingerprint-windows-font-metrics` |
| `fingerprint-location` | `fingerprint-sapi-voices`, `fingerprint-headless`, `fingerprint-allow-3p-cookies` |

**This voids the 19 August recommendation.** That report's fix for the font join was to wire
`--fingerprint-fonts-dir`; the switch no longer exists in the engine the product runs. Three
switches present in 151 have never been passed by this build: `-noise`, `-windows-font-metrics`
and `-sapi-voices`.

### Both candidates were tried and both were reverted

| Switch | Result |
|---|---|
| `--fingerprint-noise` (bare) | **No effect.** Audio stayed `0B09CAEB` and WebGL stayed `BF16CA5C` on both profiles. Canvas also unchanged, so it reached nothing. It may need a value; the binary carries the name with no help text. |
| `--fingerprint-windows-font-metrics` (bare) | **Works, and makes things worse.** Fonts moved from `08050B16`/72 to `7072F8D3`/854 — but **identically on both profiles**, so the join column survived untouched. And 854 fonts on Windows 11, the list including Helvetica (which Windows does not ship) and Google Sans, is not a machine that exists. It appears to answer yes to every font probed rather than vary per profile. |

Losing plausibility without gaining separation is worse than the defect it was meant to fix, so both
were reverted. Client rects moved on both profiles, but client rects measure text layout, so that is
most likely downstream of the font-metrics change rather than evidence for the noise switch.

### A side finding that needs its own measurement

Browserscan scored profile B **85%** with a new deduction — *Canvas Tampering, -5%, "your Canvas
related functions have been artificially modified"* — while profile A scored 90% with no canvas
deduction on the same build and the same switches.

Probably not caused by the experiment: B's canvas hash was `D08CCA8E` both before and after, so
the switches did not change canvas output. The likeliest reading is a per-seed lottery, where B's
noise crosses browserscan's detection threshold and A's does not. **Unproven** — no authenticity
score was captured for B before the experiment, so there is no baseline. Detectable canvas tampering
is a first-order signal and deserves measuring across several seeds.

### The screen fix held

Browser `55b8587` confirmed independently on both profiles: A reported 1680x1050 against
1680x1002, B reported 1536x864 against 1536x816, each a real 48px inset.

### What this leaves

The font, audio and WebGL joins **cannot be closed with what the engine ships today**. Until the
vendor answers what value `--fingerprint-noise` expects and whether the font-metrics switch takes a
seed, the mitigation is organisational rather than technical: **keep the number of profiles per
physical machine low**, because every profile on one host carries the same three marks.

## 28 August Preview 151.0.7922.108.3 candidate measurement

Evidence: `plans/260821-1925-antidetect-browser-proxy-p0/reports/fingerprint-isolation-preview-151-0-7922-108-3-20260828.md`
and sanitized probe outputs under `local-test-artifacts/engine-switch-audit/`.

The checksum-verified Windows Preview archive was measured outside the installed runtime. Stable
`.2` remained installed and the signed engine release record was not changed. Two fresh profile
directories used the same locale, timezone, screen, GPU, cores, and memory; only the deterministic
fingerprint seed changed. A third run repeated the first seed.

| BrowserScan surface | Stable `.2` | Preview `.3` | Candidate verdict |
|---|---|---|---|
| Fonts | `08050B16` / `08050B16` | `8BA38B6D` / `8BA38B6D` | Initial pair collided; later seeds found more buckets |
| Audio | `0B09CAEB` / `0B09CAEB` | `0B09CAEB` / `0B09CAEB` | Still joined |
| WebGL image | `BF16CA5C` / `BF16CA5C` | `2FF52706` / `1C093001` | Seed-sensitive on Preview; repeated seed reproduced exactly |

Follow-up with vendor-recommended seeds `47091`/`10035` produced different BrowserScan font hashes
(`8BA38B6D`/`6B101CA5`), proving that fonts are seed-bucketed rather than universally joined. The same
pair collided on BrowserScan WebGL (`2FF52706` both) and still joined on audio (`0B09CAEB` both).
Removing every MKT Browser-style override and passing only `--fingerprint=<seed>` produced the same
result, so the audio invariant is inside the engine rather than an interaction with this driver.

Across nine explicit Preview seeds, BrowserScan exposed only three font buckets, one audio bucket,
and two WebGL image buckets. The local native probe exposed ten distinct font-metric and ten distinct
WebGL readback hashes across ten seeds, but only one audio render hash. Custom local hashes therefore
overstate the isolation visible to the named external gate.

`--fingerprint-windows-font-metrics` did not change the Windows font result; vendor documentation
limits that switch to aligning a Linux host with a spoofed Windows platform. The documented
`--fingerprint-noise=false` disables native noise rather than creating a new per-profile seed and
does not repair the remaining joins.

This is a real partial vendor improvement, but the scanner-visible seed pool has high collision and
audio remains build-invariant. No JS preload was added: it would violate the native C++ boundary and
create cross-API tampering signals.
`G2-IDENTITY` stays **FAIL**, machine profile count stays low, and Preview `.3` is **not promoted** to
the Windows engine pin.

## 27 August second-key concurrency retest

Run `P0-G2-CONCURRENT-RETEST-20260827130127`. Same packaged build and data root as the human input
session above.

Method: with profile `78849f09` still live on key `...b8f6b7`, a second idle no-proxy profile was
launched. Key `...bdf2ae` had left its cooldown and the pool reported it `free`, so the pool had to
reach for it.

| Gate subset | Current result | Status |
|---|---|---|
| Second concurrent launch | Refused after 17.9s with `ENGINE_UNAVAILABLE` and the vendor text "your plan's session limit is reached ... the free key allows one at a time" | `FAIL` (expected) |
| First profile during the refusal | Stayed live and untouched; capacity settled to 1 active, 1 cooling, 0 free | `PASS` |
| Operator-facing message | The vendor's own reason was surfaced verbatim rather than a generic failure | `PASS` |

**The limit is per plan, not per key.** Both keys on this install sit under one free CloakBrowser
plan, so holding two of them buys no concurrency at all. This confirms rather than falsifies the
25 August one-seat decision, and `G2-CONCURRENT` stays `DEFERRED` on a now-measured premise instead
of an assumed one.

Two consequences worth acting on:

- A second key on one install is **worse than none**: every launch spends about 18 seconds being
  refused on it before rotating, and parks it in a 17-minute cooldown. Remove it from this install
  unless it is proven to belong to a separate account.
- The "one free key per person" model is untouched by this. It fails only when one person holds two
  keys on one plan and expects two concurrent profiles. One person, one PC, one account, one profile
  at a time still holds, and matches what manual operation needs.

`G2-IDENTITY` remains reachable without a second seat: the gate already accepts sequential
measurement, so cross-profile fingerprint separation can be measured by opening one profile at a
time.

## 27 August Relay restart/spent-ticket continuation

Evidence: `local-test-artifacts/phase5/relay-spent-ticket-restart-evidence-20260827.json`, run
`P0-G3-RELAY-SPENT-20260826192828`.

| Gate subset | Current result | Status |
|---|---|---|
| Packaged Relay process restart | Relay v15 stopped and started as a real packaged process with an isolated disposable home | `PASS` |
| Identity continuity | Relay device identity stayed stable across restart | `PASS` |
| Spent-ticket replay | The previously consumed ticket was rejected after restart with `ALREADY_USED` | `PASS` |
| Fresh-ticket route | A fresh ticket still reached the Browser-operation boundary after restart | `PASS` |
| Evidence hygiene | Redacted evidence contains no secret values | `PASS` |

This closes only the Relay restart/spent-ticket subset. The real power-cycle with a disposable
profile and real licence key remains pending, and `G3-RECOVERY` stays `OPEN` until that evidence is
checked by the owner. The earlier reboot blocker is retained; this subset does not claim full
reboot or recovery convergence.

## 27 August real power-cycle attempts

Evidence: `local-test-artifacts/phase5/real-power-cycle-recovery-evidence-20260827.json`, run
`P0-G3-POWER-CYCLE-ATTEMPT-20260826205642`; follow-up evidence:
`local-test-artifacts/phase5/real-power-cycle-recovery-evidence-20260827-rerun.json`, run
`P0-G3-POWER-CYCLE-RERUN-20260826214410`.

| Gate subset | Current result | Status |
|---|---|---|
| Browser/Relay artifact binding | Browser source `137a849`, packaged Browser hashes recorded, Relay archive v15 hash recorded, CloakBrowser engine pin `151.0.7922.108.2` | `PASS` |
| Disposable profile and real key setup | Disposable VM profile path was used and a real key was supplied through a non-recording path | `PASS` |
| Initial DevTools ownership diagnostic | First attempt reported a live Browser child/process set but `portOwnerPids=none`; no power cut followed | `SUPERSEDED` |
| Listener ownership follow-up | Warming the Windows listener provider allowed the packaged Browser to attribute the DevTools listener to the owned process | `PASS` |
| Single-key prelaunch capacity | Follow-up observed `total=1, free=1, active=0, pendingRecovery=0, cooling=0` before launch | `PASS` |
| Active lease at a validated cut checkpoint | The scheduled arm task ran immediately and again at its one-minute trigger, invalidating the checkpoint; cleanup ended at `0 active / 0 pendingRecovery / 1 cooling` with no profile Browser process | `BLOCKED` |
| Power-cycle and post-boot recovery | Not run because no valid stable active checkpoint existed | `NOT-RUN` |
| Current blocker at this historical attempt | `HARNESS_DUPLICATE_SCHEDULED_TASK_RUN`; superseded by the owner-approved rerun recorded below | `SUPERSEDED` |

No power-cycle was attempted after either precondition failure. These are environment/harness
blockers, not recovery verdicts; the owner-approved continuation and its final blocker are recorded
below, and `G3-RECOVERY` remains `OPEN` pending a runnable gate and owner evidence review.

## 27 August owner-approved rerun: final pre-cut blocker

Evidence: `local-test-artifacts/phase5/real-power-cycle-recovery-evidence-20260827-final.json`, run
`P0-G3-POWER-CYCLE-GATE-20260827044719`.

| Gate subset | Current result | Status |
|---|---|---|
| Browser/Relay artifact binding | Browser source `137a849`, packaged Browser hashes, Relay v15 archive/executable hashes, and CloakBrowser `151.0.7922.108.2` remained bound | `PASS` |
| Disposable profile and real key setup | Disposable linked clone used; real key entered through a non-recording guest path; no secret values written to evidence | `PASS` |
| Harness single-run guard | `G3ArmPrecut`, `G3DisposableBrowser`, and `G3DisposableRelay` had no future triggers; Relay config included a random disposable `vaultKeyOperator` | `PASS` |
| Active lease at a validated cut checkpoint | Packaged launch reached a live child and DevToolsActivePort, but ownership returned `portOwnerPids=none`; no `gate-state.json` checkpoint was written and cleanup settled `confirmed-released` | `BLOCKED` |
| Power-cycle and post-boot recovery | Not run because no valid stable active checkpoint existed | `NOT-RUN` |
| Cooldown/capacity cleanup | After the measured cooldown, capacity returned to `1 free / 0 active / 0 pendingRecovery / 0 cooling`; no profile Browser process remained | `PASS` |
| Historical blocker at this attempt | `VM_PRECUT_ACTIVE_CHECKPOINT_UNAVAILABLE` | `SUPERSEDED` by the final PASS below |

The later disposable-VM poweroff was cleanup only and is not recovery evidence. For this historical
attempt, the result remains an environment/ownership blocker rather than a recovery verdict;
`G3-RECOVERY` was `OPEN` pending a runnable owner-reviewed power-cycle gate.

## 27 August root-cause review of the next bounded rerun

Evidence: `local-test-artifacts/phase5/real-power-cycle-recovery-evidence-20260827-root-cause-review.json`.

The next disposable clone was stopped before any recovery claim. Review found three harness defects,
all outside the product recovery decision: the scheduled tasks referenced `run-browser.cmd` and
`run-relay.cmd` while the transferred files were prefixed `g3-`; the PowerShell settings writer used
UTF-8 with BOM, which made `SettingsStore` reject the JSON and report zero configured seats; and the
two-vCPU NEM guest became unresponsive during cold CloakBrowser startup. The task names and writer
encoding were corrected, native `tar.exe` replaced the pathological `Expand-Archive` path, and a
four-vCPU disposable retry was attempted. No `gate-state.json` with an active lease was validated,
so no checkpoint-qualified recovery power-cycle was made. Preparation and cleanup poweroffs are
excluded. The clone was reset, cleaned, powered off, and unregistered.

This remains a harness blocker, not a recovery verdict. At that point `G3-RECOVERY` was `OPEN`; the
earlier `REBOOT_LEASE_STUCK_PENDING_RECOVERY` blocker remained in force until an owner-approved run
simultaneously proved the active checkpoint tuple. The owner explicitly chose to keep the existing
licence key; no key value is retained in evidence, and any later gate must continue to stream it
without logging.

## 27 August durable checkpoint review

Evidence: `local-test-artifacts/phase5/real-power-cycle-recovery-evidence-20260827-durable-checkpoint-review.json`.

The root-cause harness fixes reached a real active checkpoint and the host performed one
`VBoxManage controlvm poweroff` only after `ValidateCut` returned `checkpointValid=true` with
`journal=active`, capacity `total=1/free=0/active=1/pendingRecovery=0/cooling=0`, live pinned Browser
and profile Browser processes, and demand-only tasks. After boot, the exact lease remained `active`
and no Browser process remained, but the `cutCheckpoint` update was absent from `gate-state.json`.
The checkpoint write was not durable across power loss, so the run is invalid for recovery evidence;
it is not a product recovery PASS or FAIL. The clone was stopped and deleted as cleanup.

The guest gate now writes state with a write-through file handle and `Flush(true)`, and post-boot
requires the persisted checkpoint plus a bounded boot window. At that point `G3-RECOVERY` was `OPEN`
with blocker `GATE_STATE_NOT_DURABLE_ACROSS_POWER_CYCLE`; no Phase 2, Phase 5, or Phase 6 work
started.

## 27 August final real power-cycle recovery PASS

Evidence: `local-test-artifacts/phase5/real-power-cycle-recovery-evidence-20260827-ownership-fix-r2.json`,
run `P0-G3-POWER-CYCLE-20260827134131`.

The final owner-approved bounded rerun used Browser source `55b8587`, the pinned packaged Browser
and Relay v15, a disposable VM profile, and the existing real licence key through a non-recording
guest path. The key was not revoked or rotated, and its value is not retained anywhere in the
evidence. The host performed exactly one `VBoxManage controlvm poweroff` after the complete active
checkpoint was validated.

| Gate subset | Current result | Status |
|---|---|---|
| Pre-cut checkpoint | `journal=active`; capacity `total=1/free=0/active=1/pendingRecovery=0/cooling=0`; exact lease record; pinned Browser/profile processes alive; demand-only tasks | `PASS` |
| Power cut and boot identity | Boot time changed after the real VirtualBox poweroff; no Browser or profile Browser process remained before app startup | `PASS` |
| Stranded lease safety | The exact pre-cut lease remained `active` after boot; immediate startup moved it to `cooling` with capacity `total=1/free=0/active=0/pendingRecovery=0/cooling=1` | `PASS` |
| Recovery convergence | After the vendor TTL, capacity became `total=1/free=1/active=0/pendingRecovery=0/cooling=0` | `PASS` |
| Reuse and clean release | The same profile relaunched with the recovered seat, then closed to `confirmed-released`; no profile Browser process remained | `PASS` |
| Evidence hygiene | `noSecretValuesWritten=true`; final evidence contains no licence-key value | `PASS` |

This closes `G3-RECOVERY`. The earlier `REBOOT_LEASE_STUCK_PENDING_RECOVERY`,
`VM_PRECUT_ACTIVE_CHECKPOINT_UNAVAILABLE`, and `GATE_STATE_NOT_DURABLE_ACROSS_POWER_CYCLE`
entries remain visible as historical observations and are superseded/resolved by this final
checkpoint-qualified run. Rollout remains `NO-GO`; no Phase 2, Phase 5, or Phase 6 work starts.

## 24 August Lifecycle and Installer Reconciliation

| Gate subset | Current result | Status |
|---|---|---|
| Receiving-machine candidate hash | Clean guest hash equals published `d18c8d79...` | `PASS` |
| Supported combined install | Old 9/9 evidence stopped at Browser-file appearance; Relay/firewall/custom metadata were absent | `INVALID` |
| Installer repair | Superseded by the R3 run below. The Defender block was caused by the installer's `EncodedCommand` pattern, not by the product contract | `SUPERSEDED` |
| Normal close | Current local artifact reached `Browser.close`, child exit 0, and `SHUTDOWN-COMPLETE`; the used seat returned without new recovery/cooling state | `PASS` |
| Hard kill / Electron crash | Superseded by the 25 August continuations below | `SUPERSEDED` |
| Relay restart | This 24 August fixed-pending-rerun record is replaced by the 27 August packaged Relay v15 continuation above, which stopped and started the real process and rejected the spent ticket as `ALREADY_USED` | `SUPERSEDED` |
| Host reboot | Owner-approved real reboot failed closed: no false-free seat, but no convergence | `FAIL-CLOSED` |
| Pending-recovery reboot | Persisted `active` became capacity `pendingRecovery=1`; launch blocked before spawn indefinitely | `FAIL` |

These subset results do not close `G3-RECOVERY` or `G4-OPERATOR`. Normal-close evidence is bound to
the current local directory artifact, not the older attested candidate. See
`lifecycle-installer-repair-evidence-20260824.md`.

## 25 August Hard-Kill and Restart Cooling Continuation

Evidence: `local-test-artifacts/phase5/hard-kill-restart-cooling-evidence.json`, run
`P0-G3-SEAT-20260825110255`.

The tested dirty-source artifact is based on source `78499472f0283f31328432e79b45d1dee34c6fa3`
and tree `b060da0583a768580afb2fa54c00101a4c708150`. Its dirty-source SHA-256 is
`e00e333ead8b488630d81abf0229854501c0cf5561b861659a48e639b1b0f212`, covering the binary tracked
patch plus sorted untracked path/content records. Executable SHA-256 is
`c4a156219a49ec1ced225c0435274786490c6ae066ef58496eb38d3b94cc0eee`; packaged `app.asar` SHA-256
is `fea4c756c079144588944ca1fab98269d99742b1613466600ae11f3482f7b09f`. The hard-kill gate used
CloakBrowser `151.0.7922.108.2`; the later packaged-contract rerun used engine `151.0.7922.174` with
the same Browser executable and `app.asar` hashes.

| Gate subset | Current result | Status |
|---|---|---|
| Licensed launch baseline | One disposable licensed profile reached journal `active`; capacity was `0 free / 1 active` | `PASS` |
| Browser hard kill | Exact owned CloakBrowser main process was externally killed; journal moved to `cooling`, never `confirmed-released` | `PASS` |
| Same-key app restart | Restart preserved `cooling`; relaunch was blocked before spawn with an honest bounded wait message | `PASS` |
| Normal two-key configuration | Original settings were restored byte-for-byte; capacity became `1 free / 1 cooling` | `PASS` |
| Cleanup | No owned Browser/profile process remained; the cooling journal was intentionally retained | `PASS` |
| Fresh packaged contract | Same executable and `app.asar` hashes passed runtime/profile lifecycle verification under Node `22.23.2` | `PASS` |
| Active-session Electron crash | App termination occurred only after the browser was already gone and cooling | `NOT-RUN` |
| Relay restart / reboot-startup recovery | Not part of this run | `NOT-RUN` |

This closes only the hard-kill/restart cooling-safety subset. It does not prove an active Electron
crash, Relay restart, reboot convergence, or early vendor release, so `G3-RECOVERY` remains `OPEN`.

### Post-gate source correction

Adversarial review found that a clean exit from a Windows launcher PID was not proof that its
handed-off browser PID released the vendor seat. The corrected source requires the exit event to
belong to the owned browser PID before a zero/no-signal exit can be treated as clean; launcher
handoff remains cooling/ambiguous.

| Gate subset | Current result | Status |
|---|---|---|
| Launcher-handoff false-free regression | Focused lifecycle suite passes `47/47`; launcher exit `0` is non-releasing when browser ownership moved to another PID | `PASS` |
| Corrected-source automated matrix | `test:mkb02` `116/116`; critical coverage `89/89` at 88.07/82.70/87.50; typecheck, lint, installer/build, and packaged contract pass | `PASS` |
| Corrected dirty-source identity | Dirty-source SHA-256 `e00e333e...f212`; executable `c4a15621...0eee`; `app.asar` `fea4c756...b09f`; unsigned and unattested | `PASS` |
| Corrected-artifact hard-kill/restart cooling gate | Run `P0-G3-SEAT-20260825110255` reached active -> cooling, blocked same-key restart before spawn, restored two-key capacity, and left no owned process | `PASS` |

The pre-review run is retained at
`local-test-artifacts/phase5/hard-kill-restart-cooling-evidence-pre-review.json`. The corrected
artifact owns the current hard-kill subset PASS.

### Active Electron crash continuation

Evidence: `local-test-artifacts/phase5/active-electron-crash-evidence.json`, run
`P0-G3-ELECTRON-20260825122143`. Pre-fix evidence is retained separately.

| Gate subset | Current result | Status |
|---|---|---|
| Exact active-session Electron crash | Exact owned Electron main PID killed while CloakBrowser and journal remained active | `PASS` |
| Startup orphan ownership | Exact `profiles/<id>/engines/cloakbrowser` orphan closed by `Browser.close`; CFT/foreign paths cannot create a lease verdict | `PASS` |
| Journal/capacity convergence | `active -> ending -> confirmed-released`; capacity `0 free / 1 active` became `1 free / 0 active / 0 pending / 0 cooling` | `PASS` |
| Vendor differential | Same one-key profile relaunched after recovery and closed cleanly | `PASS` |
| Cleanup and evidence | Settings/journal restored; no owned process or backup; secret scan zero | `PASS` |
| Artifact verification | Dirty source `38196691...067a`, EXE `50b0ccb3...5469`, `app.asar` `7160c85a...a557`; `test:mkb02` 120/120, coverage 93/93, build and final packaged contract pass | `PASS` |

This closes active Electron crash recovery for the tested dirty-source artifact. `G3-RECOVERY`
stays `OPEN`; the later Relay restart and reboot/startup results are recorded below and in the
27 August continuation above.

### Relay restart and host reboot continuation

Evidence: `local-test-artifacts/phase5/relay-restart-recovery-evidence.json`, run
`P0-G3-RELAY-20260825130239`; `local-test-artifacts/phase5/reboot-recovery-evidence.json`, run
`P0-G3-REBOOT-20260825135710`.

| Gate subset | Current result | Status |
|---|---|---|
| Relay active-session safety | Browser survived Relay stop/restart; identity and lease stayed stable; no false-free capacity | `PASS` |
| Relay fresh operation | Fresh ticket accepted after restart; profile reached `confirmed-released` | `PASS` |
| Relay replay protection | This run accepted a still-valid spent ticket after restart. The result is retained but replaced by the 27 August packaged Relay v15 rerun, which returned `ALREADY_USED` | `SUPERSEDED` |
| Real host reboot | Boot time changed; no Browser process survived; persisted journal remained `active` | `PASS` |
| Reboot capacity safety | Startup reported `0 free / 0 active / 1 pending`; relaunch rejected before spawn | `PASS` |
| Reboot deterministic convergence | Journal remained `active`; no bounded transition to cooling, release, or retry path | `FAIL` |
| Cleanup | After the TTL margin and one retry for an installed-app DB lock, original settings/journal/profile DB restored; task/backups/processes removed | `PASS` |
| Artifact binding | Browser dirty source `38196691...067a`, EXE `50b0ccb3...5469`, `app.asar` `7160c85a...a557`; Relay EXE `eb37eb54...10d1`, version 15 | `PASS` |

The valid reboot verdict is `FAIL-CLOSED`, not `PASS`: safety held, availability did not recover.
The cleanup-only retry is not a second product observation because the first restore had already
copied part of the original snapshot. The 27 August packaged rerun closes
`RELAY-RESTART-FORGETS-SPENT-TICKET`; `G3-RECOVERY` remains `OPEN` on the real power-cycle/licence-key
gate, `REBOOT_LEASE_STUCK_PENDING_RECOVERY`, and owner evidence review.

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

## 25 August Owner Scope Decisions

| Decision | Ruling | Gate effect |
|---|---|---|
| Concurrent capacity | One profile at a time; a single free licence seat | `G2-IDENTITY`'s concurrent two-profile requirement becomes `DEFERRED`. Sequential cross-profile isolation stays the evidence of record |
| Code signing | Unsigned v1; no certificate budget | No gate changes. The Phase 4 onboarding item stays open: announce SmartScreen and publish the hash |
| Second machine | The clean VM guest is PC B | `G4-OPERATOR` may close on a virtual machine, recorded as virtual |

The 24 August `FAIL` row for concurrent two-profile launch keeps its verdict. It is not repaired by
this decision; it is removed from the release path, which is a different thing and is recorded as
such.

Because the cap is one seat, a stranded seat now blocks the whole product for up to the measured
15.1-minute expiry instead of costing a rotation. `G3-RECOVERY` therefore carries more weight under
this decision, not less.

## Invalidation Rules

A run becomes `INVALID` when any source diff, artifact hash, profile/proxy assignment, engine version,
firewall rule, compatibility tuple, test order, or prewritten control changes. A failed control makes
its paired treatment invalid. Missing cleanup, missing timestamps, secret-bearing output, or an
unexplained process owner also invalidates the run.

Skipped machine and human gates remain `OPEN` or `BLOCKED`; they are never converted to `PASS` from
unit, mock, source-shape, or unpackaged evidence.

## 30 August consolidation reconciliation

Candidate: `20260830-browser-0.3.13-relay-16`. Evidence reviewed: the 30 August identity decision
(`plans/260829-2125-internal-product-readiness/reports/identity-measurement.md`), the current gate
ledger, and the Lane A preflight record. This section is authoritative for the current candidate;
all dated sections above remain retained history.

### G2-IDENTITY — FAIL (reaffirmed 2026-08-30)

No new licensed-engine launch was performed on 30 August. The approved binary threshold was
re-applied to the existing hash-bound native Stable `.2` measurement (`P0-G2-IDENTITY-20260827131800`)
and remains a fail-fast result:

| Required surface | Profile A | Profile B | Result |
|---|---|---|---|
| Fonts | `08050B16` | `08050B16` | **Collision** |
| `OfflineAudioContext` | `0B09CAEB` | `0B09CAEB` | **Collision** |
| WebGL parameter/image surface | `BF16CA5C` | `BF16CA5C` | **Collision** |

The formal fresh three-profile × five-run matrix is still `OPEN`; that qualification does not turn
the observed required-surface collisions into a pass. Preview `.3` remains an experimental,
not-promoted result, and the custom-engine track is closed. No document may infer fingerprint
uniqueness or identity isolation from this candidate.

### G3-RECOVERY — OPEN for the current candidate

Before this update, the summary row at line 64 said `PASS`; the final bounded power-cycle section at
lines 414–437 records a PASS on a **dirty-source** Browser artifact (`55b8587`) carrying Relay v15.
The separate historical restart/reboot continuation at lines 520–541 explicitly retained an
`OPEN`/`FAIL-CLOSED` availability result. Those entries describe different artifact scopes and are
not silently interchangeable.

The reconciliation is:

- The historical dirty-source/v15 power-cycle subset at lines 414–437 stays visible and remains
  `PASS` for that tested subset.
- The previously published `0.3.12`/Relay v15 installer has a different embedded payload and a
  failed restart-replay result. The current `0.3.13`/Relay v16 candidate has host/local contract
  and replay evidence, but no clean-VM lifecycle run and no candidate-bound physical
  power-cycle/recovery run. Those checks are `OPEN`/`NOT-RUN`, not implied by the historical result.
- Accordingly, the current summary row at line 64 is `OPEN`; the old `PASS` wording is superseded
  by artifact qualification, not deleted. Lane B promotion cannot use the historical PASS as an
  exact-candidate recovery proof, and Lane C is **CLOSED** for this product shape (not a pending
  recovery or vendor-promotion path).

### Lane and owner status — current consolidation

The following rows are the current 30 August release truth and supersede any older lane or owner
wording retained in the dated sections above:

| Area | Current status | Boundary |
|---|---|---|
| **U2 / CI** | **Qualified** — required MKTTool contract jobs are green; Browser Windows runner setup failed before quality jobs (`33291356306`), so package jobs were skipped. | The skipped Browser jobs remain **OPEN** and cannot be called PASS. |
| **U3 / packaging** | **OPEN** — normalized payloads are byte-identical, but the controlled outer installer still has a measured 103-byte NSIS/resource-order/trailer variance. | No normalizer or full-installer reproducibility claim is made. |
| **P4a / Lane A Web** | **Qualified deployment** — MKTTool merged to `master` at `380962a49576a4663438ef50685dcb386c86aa08`; the merge deployment `8e1123a3-c7f6-49a8-bb97-68c35bd4807a` and later docs deployment `c4ac6781-6c41-486f-9e24-eeaf67aed22b` both returned SUCCESS, with `/api/healthz` 200 and the authorized full `/api/relay/download/v16` GET hash-exact. The latest active deployment is maintained in the successor P4a receipt. | This is deployment/route evidence only. Credentialed smoke (P4-08) and rollback rehearsal (P4-09) remain `OPEN`. |
| **P4b / Browser five-artifact tuple** | **OPEN** — the exact tuple is not published because the CloakBrowser Stable `.2` engine archive is absent. | P4b is independent of P4a; no Browser tuple is fabricated or inferred from Web deployment evidence. |
| **U5 / Q15 Relay floor** | **OPEN** — both v15 devices are the owner's machines; the path is self-serve `0.3.13` reinstall with no notification channel. | Keep `MIN_RELAY_VERSION=13` until observed v16 health responses from both owner machines and the full probe/revocation procedure are complete. |
| **U6 / Q16 Lane C** | **CLOSED** — there is no CloakBrowser channel, so no vendor request, date, or waiting state exists. | `G2-IDENTITY` remains **FAIL**; any alternative-vendor route requires a new product decision and is outside this release. |
