# Licence Key Reliability Probe - 24 August 2026

## Verdict

**Corrected at 12:40Z. The 12:18Z verdict below was too strong and is retained for the record.**

Licence 2 works end to end. Licence 1 does **not**: it holds an orphaned session on the licence
service (`active_sessions: 1, limit: 1`) with zero engine processes running locally, verified three
times across one minute.

**Concurrent isolation is still blocked.** The gate was attempted at 12:34Z and could not start:
profile A launched, profile B was refused `ENGINE_UNAVAILABLE`. Two profiles never ran at once.

The licence API grants two concurrent leases. The product cannot currently convert that into two
concurrent profiles, because launching one profile burns licence 1 on a refused attempt and leaves
nothing for the second.

Measured 12:13Z-12:40Z, single session, no other gate running (confirmed with the operator).

## Why this was in doubt

23 August recorded licence 2 refused with exit 76 after 28 minutes of total silence, and the earlier
report concluded only one of two keys could start a browser. Licence 2 had itself run 433 seconds and
closed cleanly on 20 August, so "unreliable rather than dead" was the standing description.

## What was measured

| Layer | Probe | Result |
|---|---|---|
| Licence API, key 1 | `session/start` then `session/end` | `FREE`, released HTTP 200 |
| Licence API, key 2 | `session/start` then `session/end` | `FREE`, released HTTP 200 |
| Licence API, both at once | hold key 1, then request key 2 | **Both GRANTED**, plan=free, both released HTTP 200 |
| Engine, key 2 | hold key 1's seat so rotation is forced onto key 2 | `BOOTSTRAP-DONE` at 2.229s; alive at t+8s, t+15s, t+25s |
| Engine, key 1 | **not tested at 12:18Z** -- key 1 was deliberately held, so only key 2 was ever exercised | See the 12:34Z section |

Seat state after every probe in this 12:13Z-12:18Z window: `key 1 FREE, key 2 FREE`, no
`CloakBrowser` process left running. That was no longer true after 12:34Z; see below.

The per-licence counting model is confirmed a second time: two concurrent sessions on one
`install_id`. N concurrent profiles cost N licences, not N machines.

## Rotation and cooling both behaved correctly

First engine run, from `profile-shutdown.log`:

| pid | Event | Reading |
|---|---|---|
| 21004 | `CHILD-EXIT` exit `76` -> `LICENCE-KEY-REFUSED` | Correct. Licence 1's seat was deliberately held |
| 23760 | `BOOTSTRAP-DONE` at 2.229s | Rotation reached licence 2 and it worked |

Second engine run launched in 3.9s instead of 22s because licence 1 was still cooling, so rotation
skipped it rather than spending another refused attempt. Cooling is doing its job.

## Two probe defects found and corrected

Both were in the probe, not the product. Recorded because the first one produced a confidently
wrong verdict that read exactly like a real failure.

1. Aliveness was tested as `JSON.stringify(get_runtime_info()).includes(profileId)`.
   `get_runtime_info` does not list running profiles by id, so this is a false negative every time.
   The first run therefore reported "licence 2 refused" while the log showed `BOOTSTRAP-DONE`
   followed by the probe's own graceful close at `CHILD-EXIT 0`. Corrected to poll the engine's own
   CDP `/json/version`.
2. The wait schedule was anchored to the call start rather than to the moment the engine became
   ready, so a slow launch collapsed all three checks into one immediate check. Corrected to anchor
   on launch return.

This is the same failure shape as the invalid 9/9 clean-machine record and the R3 `total: 6,
passed: 6` summary: **the harness, not the product, produced the wrong answer, and the wrong answer
looked green enough to believe.** Log evidence discriminated in all three cases.

## 12:34Z - Concurrent isolation attempt, and what it exposed

Control measurement first: both proxies reachable, distinct exits, neither equal to the operator's
own address. The gate's hardcoded real-address constant still matches the current one, so it is not
stale.

Two seats were free (`2/2, cooling 0`) after waiting out a 17-minute cooldown, which expired exactly
on schedule and confirms the cooldown constant.

Result: **the gate could not start.**

| Step | Result |
|---|---|
| Persist proxy A/B on the profiles | `configured: true, hasAuth: true` on both |
| Launch A | Refused once on licence 1 (`CHILD-EXIT 76` -> `LICENCE-KEY-REFUSED`), then `BOOTSTRAP-DONE` on licence 2 |
| Launch B while A open | `ENGINE_UNAVAILABLE`: session limit reached. **No engine was spawned and no log entry exists for B** |
| Cleanup | A closed gracefully; licence 2 released |

Launching a single profile consumed both keys: one by refusal, one by use.

### The orphaned session

After cleanup, with **zero** `CloakBrowser` processes running:

```
key 1: HELD  HTTP 403  {"error":"session_limit_exceeded","active_sessions":1,"limit":1}
key 2: FREE
```

Stable across three checks over one minute. The probe tooling was ruled out as the cause: key 2 was
acquired and released cleanly on every one of those three cycles, so the probe does not leak seats.

This is the failure mode `license-key-pool.ts` already documents -- a seat held by something outside
this app, and an exit-76 death that cannot call `session/end` because the lease and instance ids died
with the browser. What is not yet established is what first put licence 1 into that state, and
whether a refused attempt is itself what creates the orphan that guarantees the next refusal.

### The product cannot see or release a seat at all

Searched the whole workspace: **no product code calls `session/start`, `session/end`, or any
`api/license` endpoint.** The only `cloakbrowser.dev` calls in the source are engine download and
checksum fetches. The engine binary owns the entire session lifecycle; the app hands it a key at
spawn and learns the outcome only from the process exit code (`76` limit, `77` invalid, `78` server
unreachable, `79` local state unwritable).

Three consequences, all confirmed by today's run:

1. **The pool's view can be wrong, and was.** At 12:33:36Z the app reported `free 2/2, cooling 0`
   while licence 1 was in fact held. `license-key-pool.ts` says so itself -- "a good guess that
   corrects itself, never an authority" -- and the capacity payload is deliberately not advertised
   as launch-authoritative. Today vindicates that caution: a UI that trusted it would have told the
   operator two seats were free when one was not.
2. **An orphaned seat cannot be detected or cleared by the product.** It has no way to ask. The only
   recovery is waiting out the 17-minute cooldown and hoping the service-side lease expired too.
3. **"Confirmed release" is not obtainable as the acceptance contract words it.** `G3-RECOVERY`
   requires that no key returns to idle until release is confirmed. The product can only infer
   release from whether `Browser.close` ran -- an honest inference, but not confirmation from the
   licence service. Either the gate wording should say "inferred from a completed graceful
   shutdown", or the product needs licence-service visibility it does not currently have.

The local engine state directory `~/.cloakbrowser` holds only `install_id`, unchanged since
19 August, so no stale local session file is involved. The stuck session exists only service-side.

### Stale script corrected

`launch-pair.mjs` passed the proxy to `launch_managed_profile`. A and B are locally created
profiles, so that call is refused by design since `68e2911`, and the proxy argument did nothing on
the launch path regardless. Corrected to persist the proxy with `update_profile` and launch with
`launch_profile`. This is the fourth harness defect found today.

## 12:49Z-12:51Z - The decisive test

Licence 1's stuck seat cleared on its own at 12:49:21Z, **15 minutes 19 seconds** after the
12:34:02Z attempt that left it held. That is inside the documented 7-17 minute lease expiry, so the
recovery mechanism itself works.

The test then forced the engine onto licence 1 with every other licence held, the mirror of the
licence 2 test that passed:

| Moment | Licence 1 state |
|---|---|
| 12:49:21Z, API acquire and release | `FREE` |
| 12:51:09Z, app pool | `2/2 free, cooling 0` |
| 12:51:xx, engine launch on licence 1 | Refused after 34s, `ENGINE_UNAVAILABLE` / exit 76 |
| Immediately after, API | `HELD (session_limit_exceeded, active=1)` -- no engine process running |

**A seat that was verified free two minutes earlier is held immediately after a refused attempt,
with nothing running locally to hold it.** That is the self-perpetuating loop: the refusal leaves an
orphan, and the orphan guarantees the next refusal for the next ~15 minutes.

This matches a previously recorded episode in which nine consecutive measurements failed because
measuring was what kept the seat broken.

### The lease TTL is a fixed constant, measured twice

| Refusal | Recovery | Held for |
|---|---|---|
| 12:34:02Z | 12:49:21Z | 15m 19s |
| ~12:51:43Z | 13:06:55Z | 15m 12s |

Two independent observations agreeing within seven seconds. This is a fixed server-side lease TTL of
about **15m 15s**, not a variable expiry, and it sits comfortably inside the app's 17-minute
cooldown -- so the cooldown constant is correctly chosen: a key never leaves cooling while its
service-side lease could still be alive.

The practical cost is blunt: **each refused attempt on this key costs about 15 minutes of that key's
availability.** Two attempts, as happened today, cost half an hour.

### Established, and not established

Established by repeated observation:

- Licence 1 is refused at engine level even when its seat reads free. Twice: 12:34:02Z and 12:51Z.
- After each refusal, licence 1 reads `active_sessions: 1` with zero local engine processes. Twice.
- Licence 1 recovers unaided after a fixed ~15m 15s lease TTL. Measured twice, agreeing within 7s.
- Licence 2 starts an engine and holds it. Twice.
- The probe tooling does not leak seats: licence 2 was acquired and released cleanly on every cycle.

Not established:

- **Whether the refused attempt creates the orphan, or an orphan already existed that the free
  reading failed to see.** The evidence leans hard to the former, because licence 1 was confirmed
  free by an acquire-and-release two minutes before the attempt. It is not proof: confirming "free"
  requires acquiring, so no check can observe the seat without touching it.
- Why licence 1 behaves differently from licence 2 at all. Both are on the free plan, on different
  accounts. The asymmetry is unexplained.

### The discriminating experiment, not yet run

Once licence 1 clears again: hold an API session open on licence 1 for a full minute and release it
cleanly, proving the seat is functional and releasable under a sustained hold rather than a
sub-second one. Then immediately force the engine onto it. If a long API hold succeeds and the
engine is refused seconds later, the fault is specific to how the engine acquires, not to the
licence or the account.

## Consequence for the gates

| Gate | Status |
|---|---|
| Concurrent two-profile isolation | **Still blocked.** Attempted and failed to start. Not a proxy problem and not a plan-limit problem -- the licence API grants two concurrent leases. One of the two keys cannot start an engine at all, so only one profile can run |
| Crash / hard kill / Relay restart / reboot | Needs one seat; runnable once licence 1 recovers |

Rollout stays **NO-GO**.

The cost model needs restating: the licence service supports N concurrent sessions on N keys, but
the product currently spends more than one key to open one profile whenever a key is in the orphaned
state. Until that is resolved, N keys does not buy N profiles in practice.

## Evidence

- `local-test-artifacts/phase5/probe-seat-state.mjs`
- `local-test-artifacts/phase5/measure-two-key-concurrency.mjs`
- `local-test-artifacts/phase5/probe-key-engine-level.mjs` (created for this run; takes the
  1-based licence index to test and re-checks that seat afterwards)
- `local-test-artifacts/phase5/launch-pair.mjs` (corrected for locally created profiles)
- `local-test-artifacts/phase5/probe-proxies.mjs`
- `%LOCALAPPDATA%\MKTTool\MKTBrowser\profile-shutdown.log`, windows `12:16:10Z`-`12:16:15Z`
  and `12:34:02Z`-`12:34:09Z`

No key, lease id, or token is recorded here; keys appear only as their last six characters in
console output.

## Unresolved questions

- What first put licence 1 into the orphaned state, and does a refused attempt itself create the
  orphan that guarantees the next refusal? This is the open question that blocks concurrency.
- The 23 August "licence 2 refused" finding now looks like the same orphan mechanism seen on the
  other key, not an unreliable key. Worth re-reading with that lens.
- Does the startup orphan sweep (`startupOrphanSweep`, wired in `index.ts`) cover this case? A seat
  orphaned mid-session while the app keeps running would not be swept until the next start.
- A third key was approved for purchase. It is back on the critical path: with one key stuck
  orphaned, a third key is what would let the concurrent gate run at all today.
- Both keys sit on different accounts on the free plan. Whether a paid plan changes the per-licence
  seat count is unmeasured.
