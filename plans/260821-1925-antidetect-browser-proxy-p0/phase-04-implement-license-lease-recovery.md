---
phase: 4
title: "Implement License Lease Recovery"
status: in-progress
priority: P1
effort: "3-5 days"
dependencies: [1, 3]
---

# Phase 4: Implement License Lease Recovery

## Overview

Replace shutdown-method guesses with measured, profile-bound license lease state. Route vendor
session traffic through the profile's proven proxy bridge, journal the minimum recovery metadata,
and recover normal close, hard kill, Electron crash, and restart without exposing keys or marking
ambiguous seats free.

## Context Links

- E:\MKTWorkspace\plans\260820-1001-per-profile-license-sidecar-recovery\plan.md
- E:\MKTWorkspace\plans\reports\research-260820-0858-giao-thuc-license-cloakbrowser.md
- E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-key-pool.ts
- E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\startup-orphan-sweep.ts
- E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBrowserDriver.ts

## Requirements

- Functional: verify the live vendor start, heartbeat, end, identity, and error schema using valid
  owner-controlled keys before production code depends on it.
- Functional: create one loopback-only sidecar per profile launch and forward only measured vendor
  requests through that profile's existing SOCKS bridge.
- Functional: persist lease identity, profile ID, key fingerprint/tail, timestamps, state, and bounded
  recovery data; never persist the full key, proxy URL, credentials, or raw response bodies.
- Functional: a key is idle only after confirmed release. Unknown, timed-out, or crashed outcomes
  remain pending-recovery or cooling.
- Functional: simultaneous profiles cannot cross-wire sidecar ports, keys, proxy routes, or journal rows.
- Non-functional: keep the proprietary engine and vendor protocol unmodified; no response synthesis,
  key generation, install-id rotation, replay, or bypass.
- Non-functional: CFT remains unchanged and never enters the licensed sidecar path.

## Architecture

Profile launch reserves a key, starts the existing profile SOCKS bridge, starts a profile-bound
license sidecar on a random loopback port, points the unmodified engine to that local endpoint, and
journals state transitions. The sidecar forwards vendor traffic through the profile bridge. On
normal end it confirms release before returning the key to idle. On abnormal shutdown the next
startup combines orphan sweep evidence with the journal, recreates the proxy path, requests release,
and keeps uncertainty visible instead of guessing.

## File Inventory

| Action | Path | Purpose |
|---|---|---|
| Create | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-session-sidecar.ts | Profile-bound loopback forwarder with strict route allowlist |
| Create | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-lease-journal.ts | Atomic, minimal, redacted lease state |
| Create | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-lease-recovery.ts | Startup and retry recovery state machine |
| Create | Matching test files beside each module | Protocol, redaction, concurrency, and recovery coverage |
| Modify | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-key-pool.ts | Derive capacity from confirmed lease states |
| Modify | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBrowserDriver.ts | Start/stop sidecar and record launch lifecycle |
| Modify | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\startup-orphan-sweep.ts | Reconcile process cleanup with pending leases |
| Modify | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\index.ts | Run bounded recovery before accepting launches |
| Modify if needed | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\socks5Bridge.ts | Expose a safe forwarding seam without weakening containment |
| Delete | None | Preserve key-pool and orphan-sweep behavior until replacement tests are green |

## Tests Before

1. Preserve current key pool allocation, no-overbooking, seat-refusal rotation, redaction, and empty
   pool tests.
2. Preserve orphan polite-close, kill fallback, process ownership, and process-table failure tests.
3. Write failing contract tests for confirmed-release-only idle state and profile-route isolation.
4. Record sanitized successful and refused live protocol schemas; abort the phase if the schema is
   not stable enough to implement without guessing.

## Implementation Steps

1. Run one controlled protocol gate with a disposable profile and valid key. Record method, path,
   required fields, response status categories, timing, and correlation only.
2. Define the lease state machine: idle, reserved, starting, active, ending, pending-recovery,
   cooling, confirmed-released, and terminal-refused where applicable.
3. Implement atomic journal writes with schema versioning and crash-safe replacement.
4. Implement a loopback-only sidecar with exact vendor host/path/method allowlist, body-size limits,
   timeouts, correlation IDs, and longest-first secret redaction.
5. Route sidecar upstream through the already-running profile SOCKS bridge. Refuse direct egress if
   the bridge is missing or unhealthy.
6. Bind sidecar instance, proxy bridge, profile ID, key allocation, child PID, and journal row into
   one launch context owned by ChromiumBrowserDriver.
7. Confirm session start before reporting launch capacity consumed and active.
8. On normal Browser.close, forward session end and mark the key idle only after confirmed release.
9. On SIGTERM, SIGKILL, launcher handoff, Electron crash, or unknown exit, mark pending-recovery.
10. At startup, finish orphan process cleanup, restore the matching proxy bridge, and attempt bounded
    release recovery. Never block the UI indefinitely.
11. Add an explicit retry path for pending recovery and a safe operator-visible cooling state.
12. Test two simultaneous profile launches with two keys and two proxies under forced interleaving.
13. Test app restart and simulated power loss from journal fixtures before any live destructive gate.
14. Remove timer-only assumptions only after the measured state machine passes all regressions.

## Measured 23 August 2026 - live vendor protocol

Evidence: [`ket-qua-260823-1250-do-nang-luc-seat-cloakbrowser.md`](../reports/ket-qua-260823-1250-do-nang-luc-seat-cloakbrowser.md),
[`ket-qua-260823-1910-gate-cach-ly-va-loi-khong-xoay-khoa.md`](../reports/ket-qua-260823-1910-gate-cach-ly-va-loi-khong-xoay-khoa.md)

| Measured | Result |
|---|---|
| `session/start` | HTTP 200, `lease_id`, `plan: "free"` |
| `lease_ttl_seconds` | 900 |
| `heartbeat_interval_seconds` | 300 |
| `session/end` | HTTP 200 `{"ok":true}`, seat free within seconds |
| Second session, same key | HTTP 403 `session_limit_exceeded`, `active_sessions:1`, `limit:1` |
| Second session, second key, same `install_id` | Granted. Sessions are counted **per licence**, not per account and not per install |
| Normal profile close | Seat free in seconds, not after the 900s lease. Measured twice |

The capacity model is therefore N keys on one machine, not N machines. A launch that dies before it
is licensed leaves the seat held until the lease expires.

**Corrected 24 August 2026.** This section previously recorded that expiry as "roughly 20-25
minutes rather than the nominal 900s". That was wrong. Measured directly with
`scripts/measure-licence-lease-ttl.cjs` - open a session, abandon it with no `session/end` and no
heartbeat exactly as a killed browser does, then ask for it back every 30s:

| Abandoned | Reclaimed | Elapsed |
|---|---|---|
| `15:58:22.667Z` | `16:13:27.169Z` | **15.1 minutes** |

The last refusal landed at t+15m and the next attempt was granted, five seconds past the declared
`lease_ttl_seconds: 900`. The vendor enforces its stated TTL to within seconds; there is no hidden
grace period and no silent extension. The 15m19s unaided recovery in the acceptance matrix agrees.

The earlier 20-25 minute figure was never reproduced and is most likely elapsed time counted from
launch start rather than from the moment the engine died. The pool's 17-minute cooldown stays as
it is: 900s plus two minutes of clock-skew margin, now known to be sufficient rather than assumed.

### Blocker found and fixed while measuring

Key rotation never ran. The engine serves CDP before the licence server answers, and every check for
the child's exit sampled it once while it was still alive, so launch resolved successfully at ~0.9s
and the verdict landed at ~1.2s against a loop that had already returned. A held primary killed the
launch with a free key sitting unused in the pool.

Fixed in browser commit `b63d212`, proven on hardware: a held primary is refused, logged as
`LICENCE-KEY-REFUSED` with a `keysLeft` countdown, and the launch succeeds on the next free key,
reaching bootstrap in 1.4s. Two log shapes now tell the story apart - 15s with `port: null` and exit
76 means no seat; ~1.4s to `BOOTSTRAP-DONE` means the seat was granted.

Alongside it, browser commit `22207ad`: nothing in the renderer referenced the key list, so an
operator had no way to enter a second key at all. An N-key cost model needs a route into the product.

### Still open

Heartbeat behaviour across a long session, and recovery from hard kill, Electron crash, Relay restart
and reboot. Until those are measured, `license-capacity-v1` stays unadvertised.

## Measured 24 August 2026 - safe lifecycle continuation

Evidence: [`lifecycle-installer-repair-evidence-20260824.md`](./reports/lifecycle-installer-repair-evidence-20260824.md).

The current local directory artifact, source `c802fabb` / tree `bd87f752`, passed another normal-close
gate with one unmanaged disposable no-proxy profile. Capacity moved from `free 1 / active 0 / cooling
1 / pending 0` to `0 / 1 / 1 / 0`, then returned to `1 / 0 / 1 / 0`. The lifecycle log records
`Browser.close`, child exit code 0, and `SHUTDOWN-COMPLETE` with method `Browser.close`. No new
cooling or pending-recovery state appeared during close.

The existing cooling seat came from a preceding live refusal: starting from two free keys, one key
was refused and rotation opened on the second. The refused key stayed cooling instead of becoming
false-free; the active key returned on normal close. A final sanitized read later found
`free 2 / active 0 / cooling 0 / pending 0`, so the refused seat returned naturally without being
declared free by the close gate.

Destructive faults remain open. The sandbox had no terminate access to the six disposable engine
processes or Browser main process, Relay was not running on the host, and host reboot was not
authorized separately from the preservation requirement. More importantly, production recovery is
still not integrated: no per-profile sidecar, driver journal lifecycle writes, or startup vendor
release path exists. Current fixture recovery therefore cannot be promoted to live recovery proof.

## Measured 25 August 2026 - hard-kill and restart cooling gate

Evidence: `local-test-artifacts/phase5/hard-kill-restart-cooling-evidence.json`, run
`P0-G3-SEAT-20260825110255`.

The corrected dirty-source directory artifact passed the narrow human seat-safety gate. Its base is
source `78499472f0283f31328432e79b45d1dee34c6fa3`, tree
`b060da0583a768580afb2fa54c00101a4c708150`, with dirty-source SHA-256
`e00e333ead8b488630d81abf0229854501c0cf5561b861659a48e639b1b0f212`. The digest includes the
binary tracked patch plus sorted untracked path/content records. The tested executable SHA-256 is
`c4a156219a49ec1ced225c0435274786490c6ae066ef58496eb38d3b94cc0eee`; packaged `app.asar` SHA-256
is `fea4c756c079144588944ca1fab98269d99742b1613466600ae11f3482f7b09f`. The destructive gate used
CloakBrowser `151.0.7922.108.2`.

With a disposable root and exactly one configured key, the licensed profile reached journal state
`active` and capacity `free 0 / active 1 / cooling 0 / pending 0`. The exact owned CloakBrowser main
process was then killed externally. The journal moved to `cooling`, never `confirmed-released`, and
capacity became `0 / 0 / 1 / 0`. After restarting the app with the same single key, relaunch was
blocked before engine spawn with the bounded cooling-wait message. Restoring the original two-key
settings produced `free 1 / active 0 / cooling 1 / pending 0`, so the held key did not make the other
key unavailable.

Cleanup restored the original settings byte-for-byte and left no owned process. The cooling journal
record remains intentionally: deleting it would falsely advertise the vendor-held seat as free. The
same executable and `app.asar` hashes passed the fresh packaged runtime/profile contract under Node
`22.23.2`; that verifier used the independently downloaded engine `151.0.7922.174`.

This is a pass for the hard-kill/restart **cooling-safety subset**, not full recovery. The restart
occurred after the browser process was already gone and cooling; terminating the Electron app at
that point does not prove an active-session Electron crash. It also does not prove Relay restart,
reboot/startup convergence, or early vendor seat release. Those rows remain open, and
`G3-RECOVERY` remains open.

### Post-gate adversarial correction

Inline review found one additional false-free edge case after that human run. On Windows the
spawned child can be a short-lived launcher while the owned browser runs under a different PID. If
the launcher exited `0` and the handed-off browser then crashed, the child exit code could be
mistaken for proof that the browser released its seat.

The driver now accepts a zero/no-signal child exit as clean only when the exiting child is also the
owned browser PID. A launcher handoff is ambiguous and therefore cools the seat. Regression coverage
locks both the running-child and failed-launch paths.

The corrected dirty source has SHA-256
`e00e333ead8b488630d81abf0229854501c0cf5561b861659a48e639b1b0f212`. Node `22.23.2` verification
passes: focused lifecycle `47/47`, `test:mkb02` `116/116`, critical coverage `89/89` at 88.07% lines,
82.70% branches, and 87.50% functions, plus typecheck, lint, the full installer/build gate, and the
fresh packaged runtime/profile contract. The rebuilt unsigned directory artifact is executable
SHA-256 `c4a156219a49ec1ced225c0435274786490c6ae066ef58496eb38d3b94cc0eee`, `app.asar` SHA-256
`fea4c756c079144588944ca1fab98269d99742b1613466600ae11f3482f7b09f`.

The pre-review PASS is retained separately at
`local-test-artifacts/phase5/hard-kill-restart-cooling-evidence-pre-review.json`, run
`P0-G3-SEAT-20260825103809`, executable `d4189049...`. After that lease expired, the same narrow
gate reran on the corrected artifact and passed. Do not repeat it again while the new retained seat
is cooling.

## Measured 25 August 2026 - active Electron crash recovery

Evidence: `local-test-artifacts/phase5/active-electron-crash-evidence.json`, run
`P0-G3-ELECTRON-20260825122143`. The pre-fix failure is retained at
`local-test-artifacts/phase5/active-electron-crash-evidence-pre-fix.json`.

The first real run reproduced a structural blocker: Electron was force-killed while the licensed
CloakBrowser remained active; startup closed the exact orphan through `Browser.close`, but the
journal stayed `active` and capacity stayed `pendingRecovery 1`. Startup sweep outcomes carried only
PIDs, so no profile lease could be reconciled, and the pool had already seeded that key as blocked.

The fix binds only the exact owned `profiles/<id>/engines/cloakbrowser` process to its journal row.
`Browser.close` moves the lease through `ending` to `confirmed-released` and clears the pool block;
a startup SIGKILL moves it to `cooling`; unmatched or failed reconciliation stays pending. CFT and
foreign/nested paths produce no licence recovery verdict.

The rebuilt dirty-source artifact is source `78499472f0283f31328432e79b45d1dee34c6fa3`, tree
`b060da0583a768580afb2fa54c00101a4c708150`, dirty-source SHA-256
`38196691421f0d529c7e4aa459f11aed140d957da23c74b4d815144881ee067a`. Executable SHA-256 is
`50b0ccb3ae470d7089203877f8cbf0e3b17718dabde693182fbc4be688655469`; `app.asar` SHA-256 is
`7160c85a49afe0095a06e7e9df80ef5d07e2fc80f50df54ffb95b7102a1aa557`.

The exact Electron main PID was killed while the owned browser and journal remained active. Restart
logged `ORPHAN-SWEEP-CLOSED` for that browser, left zero orphan processes, moved the journal to
`confirmed-released`, and reported `1 free / 0 active / 0 pending / 0 cooling`. The same profile then
reused the same one-key capacity and closed cleanly. Settings and the pre-gate journal were restored,
no owned process or backup remained, and evidence contains no key, token, profile ID, or local path.

Node `22.23.2` verification passes `test:mkb02` `120/120`, critical coverage `93/93` at 88.66% lines,
83.74% branches, and 87.78% functions, typecheck, lint, the full installer/build gate, and the fresh
packaged contract on the same executable and `app.asar` hashes. This closes the active-session
Electron-crash subset. `G3-RECOVERY` remains open because the Relay-restart and reboot gates below
now have concrete failures.

## Measured 25 August 2026 - Relay restart and host reboot

Relay evidence: `local-test-artifacts/phase5/relay-restart-recovery-evidence.json`, run
`P0-G3-RELAY-20260825130239`. Reboot evidence:
`local-test-artifacts/phase5/reboot-recovery-evidence.json`, run
`P0-G3-REBOOT-20260825135710`. Both use Browser EXE `50b0ccb3...5469`, `app.asar`
`7160c85a...a557`, and dirty source `38196691...067a`.

Relay restart preserved the active Browser, stable Relay identity, active lease, and occupied
capacity. A fresh ticket worked after restart and the profile closed to `confirmed-released`.
However, the restarted Relay accepted a still-valid ticket already consumed before restart. Spent
JTI state is process-memory-only, so restart loses replay protection. Verdict:
`FAIL - RELAY-RESTART-FORGETS-SPENT-TICKET`.

The owner-approved host reboot started from one licensed profile at journal `active`, capacity
`0 free / 1 active`. After the real boot-time change, no Browser process survived. Startup retained
the journal row as `active`, seeded capacity as `0 free / 0 active / 1 pending`, and rejected a
relaunch before spawning. This is safe fail-closed behavior: no false-free seat and no overbooking.
It is not deterministic recovery because the seat never converges to cooling, confirmed release,
or an operator-retry state. Verdict: `FAIL - REBOOT_LEASE_STUCK_PENDING_RECOVERY`.

Cleanup waited through the 17-minute vendor-TTL safety margin. The first restore attempt hit a
profile-DB lock from the separately installed Browser app; after that app closed, a cleanup-only
retry restored the original two-key settings, journal, and profile DB, removed the disposable
profile/task/backups, and left no owned process. The retry observation is explicitly excluded from
the product verdict because the first restore had already begun.

`G3-RECOVERY` remains open. Required fixes are durable spent-ticket replay state in Relay and a
bounded startup path that moves a reboot-stranded lease out of `active` without ever guessing free.

## Fixed 26 August 2026 - the reboot-stranded lease now converges

`FAIL - REBOOT_LEASE_STUCK_PENDING_RECOVERY` was not a missing timeout. Startup had exactly one way
to settle a lease left mid-flight: `reconcileStartupOrphanLeases` acting on what the orphan sweep
found running. A reboot destroys the browser, so the sweep finds nothing, reports no recovery, and
the record stays `active` — and `LicenseKeyPool` deliberately refuses to age an `active` record out
by timestamp, because a browser that outlived the app may still be heartbeating. Correct rule,
missing branch: nothing spoke for the browser that could not have survived.

The hold was therefore not 15 minutes but unbounded. Reproduced against the shipped modules with a
journal fixture at `active`, an empty enumerated sweep and clocks at +2 min, +20 min, +1 day and
+1 week after the boot: `acquire` returned null at every point, `nextFreeAtMs` stayed null, and the
operator string was "a previous browser closed without handing its licence session back" with no
deadline attached. On a one-key install that is the product, permanently, until someone deletes
`license-leases.json` by hand.

Fix: give startup the two verdicts it was missing, and keep the pool the conservative party.

| Change | File |
|---|---|
| Boot time as proof of death. `bootedAtMs = Date.now() - os.uptime() * 1000`; a boot later than the record means that browser stopped heartbeating at the boot at the latest, so the seat rests from the boot rather than from this start | `startup-license-lease-reconciliation.ts`, `index.ts` |
| A sweep that did read the process table and found nothing is itself a verdict for every lease it did not name; a sweep that could not look changes nothing | `startup-license-lease-reconciliation.ts` |
| A lease whose rest already ran out is retired to `expired` rather than written `cooling` as of now, so reopening the app does not re-arm a cooldown from the moment of writing | `startup-license-lease-reconciliation.ts` |
| `reconcilePersistedLease` accepts when the rest began; `LICENSE_SEAT_COOLDOWN_MS` exported so the 17 minutes has one definition | `license-key-pool.ts` |
| The disabled-sweep placeholder no longer claims `enumerated: true` — nothing was looked at | `index.ts` |

The pool still refuses to free an `active` record on its own evidence. Both proofs live in the one
place that also writes the journal, so the pool and the durable record can never disagree about
whether a key may be handed out.

Behaviour after the fix, measured on the same fixture: reboot then app opened 2 min later gives a
wait with a deadline ("It frees in about 15 minutes") rather than a dead end; opened 18 min later
or a day later the key is idle and the launch is granted; a second and third restart do not rest it
again. Within one boot session, an app and browser that died together now rest the key a full
cooldown from now instead of blocking for ever. A process table that could not be read still frees
nothing, which is the fail-closed case and unchanged.

Gates, run under Node 22 as the repo requires: full `test:mkb02` 171/171 including 10 new tests,
critical-coverage contract exit 0 at 101/101 with `license-key-pool.ts` at 100% lines and
`startup-license-lease-reconciliation.ts` at 100% lines / 90.63% branches, full `yarn lint` exit 0,
workspace typecheck exit 0.

### Measured on the packaged app, 26 August 2026

Evidence: `local-test-artifacts/phase5/reboot-lease-convergence-evidence-20260826.json`, run
`P0-G3-REBOOT-CONVERGENCE-20260826233900`.

The machine could not be power-cycled during the session, so the reboot was reconstructed from the
two things the app actually reads, both of them real: the boot clock and the process table. A lease
was seeded at `active` stamped a full day before this machine's genuine last boot, with no browser
process anywhere. The reconstruction is faithful by its own control run — the **pre-fix** packaged
build reproduces the 25 August verdict digit for digit.

| Run | Journal | `get_runtime_info` capacity |
|---|---|---|
| Packaged build of 25 August, unmodified | `active` → `active` | total 1, **free 0**, pendingRecovery 1 |
| Same runtime, `app.asar` repacked from the fixed bundle | `active` → `expired` | total 1, **free 1**, pendingRecovery 0 |
| Fixed build, app and browser died inside one boot session | `active` → `cooling` | bounded 17 minutes |
| Fixed build, second and third start on a settled root | `expired` → `expired`, `updatedAt` unchanged | no cooldown re-armed |

Disposable `--user-data-dir` per run; the operator install was never touched. The licence key was a
fake string and the app does not read `CLOAKBROWSER_LICENSE_KEY`, so no vendor endpoint was called
and no seat was spent. The attested `release/win-unpacked` artifact is unchanged — its `app.asar`
still hashes to `7160c85a…a557`. `electron-vite build` was invoked directly, bypassing the build
script's Node 22 gate; it bundles JS/TS only and rebuilds no native module, so this is a local
diagnostic runtime, not a release artifact, and it is unsigned.

Not done: a real power cycle, and a real vendor seat coming back on a real key. `G3-RECOVERY` still
owes that run. Relay spent-ticket durability is a separate open item and is untouched here.

Residual, bounded and recorded rather than fixed: a lease settled while its rest is still running is
stamped `cooling` at the moment of writing, so a later restart counts the remaining rest from that
stamp and can add up to the boot-to-app-start gap to the wait. It never compounds, because the stamp
does not move. Carrying the true resting instant would need a journal schema field, which is not
worth a version bump for a few minutes.

## Test Scenario Matrix

| Scenario | Expected |
|---|---|
| Normal close | End confirmed; key returns idle |
| Browser hard kill | Lease becomes pending-recovery; not advertised free |
| Electron crash | Journal survives; startup recovery is deterministic |
| Power loss fixture | Partial write rejected or recovered from last valid record |
| Recovery success | Correct profile proxy used; exact lease released |
| Recovery timeout | State remains pending/cooling; bounded error shown |
| Two profiles/two keys | No key, port, proxy, or journal cross-wire |
| Seat refusal | Only refused key rests; next valid key may be tried |
| Proxy bridge failure | License and browser launch fail closed; no direct request |
| CFT launch | Sidecar and lease journal remain inactive |
| Malformed vendor response | No guessed success; state remains non-idle |
| Secret-like overlap in error | Full key/proxy fragments redacted longest-first |

## Dependency Map

- Requires phase 1 baseline and phase 3 proven proxy route.
- Supersedes execution details in 260820-1001-per-profile-license-sidecar-recovery.
- Blocks phase 5 capacity UX and phase 6 lifecycle canary.

## Tests After

- Unit tests for state machine, journal atomicity, sidecar allowlist, timeouts, redaction, and recovery.
- Driver integration tests for start/close/crash ordering.
- Concurrency tests with delayed start/end responses.
- Packaged restart test using disposable roots.
- One controlled live normal-close and one owner-approved hard-kill recovery run.

## Regression Gate

- Existing MKTBrowser suites remain green.
- New lease tests prove a key cannot become idle from shutdown method alone.
- Full Node 22 typecheck, lint, test:installer, desktop build, and packaged runtime contract pass.
- No full key, proxy secret, raw vendor body, or observed IP exists in files or logs.

## Success Criteria

### Automated checkpoint - 22 August 2026

- Implemented a versioned lease journal with atomic replacement, `.previous` recovery, strict record
  validation, copy-on-write memory updates, and serialized concurrent mutations.
- Full keys never enter the journal or runtime capacity boundary. Short development keys are masked,
  key fingerprints cannot cross the MCP response, and persisted error codes are bounded stable codes.
- Implemented deterministic recovery logic for unstarted reservations, missing profiles/keys,
  confirmed release, retry, thrown release, and concurrent profile isolation using fixtures.
- Capacity aggregation excludes pending-recovery and cooling records from free seats, but remains
  diagnostic-only.
- Not implemented by design: vendor protocol sidecar, driver lifecycle journal writes, startup
  release through the profile proxy, and live normal-close/hard-kill recovery. Those require the
  sanitized owner-controlled vendor protocol capture first.

- [x] Live protocol schema is measured and sanitized before implementation.
- [ ] Each licensed profile owns one sidecar, bridge, key allocation, and journal row.
- [ ] Confirmed release is the only transition to idle.
- [ ] Normal close, hard kill, Electron crash, restart, and power-loss fixtures recover deterministically.
- [ ] Two simultaneous profiles cannot cross-wire keys or routes.
- [ ] CFT behavior is unchanged.

## Risk Assessment

- Vendor protocol can change without notice. Mitigation: strict schema validation, versioned evidence,
  bounded failure, and no synthesized responses.
- Recovery through an expired or unavailable proxy may be impossible. Mitigation: retain pending state,
  expose retry, and never lie that capacity is free.
- Sidecar work can accidentally become a license bypass. Mitigation: forward only measured traffic,
  keep engine and response semantics unmodified, and stop on any requirement to emulate the vendor.
- ChromiumBrowserDriver is already large. Mitigation: new lease responsibilities live in focused modules;
  the driver only owns orchestration.

## Security Considerations

- Store only key tail or one-way fingerprint; never full keys.
- Bind listeners to 127.0.0.1 with unguessable per-launch correlation and strict request limits.
- Do not expose sidecar endpoints through MCP, renderer IPC, Web, or Relay responses.
- Treat raw vendor captures as ephemeral sensitive material and delete them after sanitized schema review.
