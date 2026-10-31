# Licence Lease TTL, and the Seat Bookkeeping That Never Survived a Restart — 24 August 2026

## Verdict

- Abandoned lease expiry **measured**: **15.1 minutes**, against the server's declared
  `lease_ttl_seconds: 900`. No hidden grace, no silent extension.
- The pool's 17-minute cooldown is **correct and stays**. Prior worry that it was too short is dead.
- The persistent lease journal and its recovery module were **built, tested, and never wired into
  the product**. Seat bookkeeping lived only in memory, so every app restart forgot a held seat.
  Now connected.
- Rollout verdict unchanged: **NO-GO**. This closes a real operator-facing defect, not a gate.

## 1. Lease TTL, measured

Method: `MKTBrowser/scripts/measure-licence-lease-ttl.cjs`. Open a session, then stop — no
`session/end`, no heartbeat, exactly what a SIGKILLed browser leaves behind. Then request the seat
every 30s until granted.

| Event | Time |
|---|---|
| Session opened, then abandoned | `15:58:22.667Z` |
| Last refusal (`session_limit_exceeded`, `active_sessions:1, limit:1`) | `16:12:56.351Z` (t+15m) |
| Seat reclaimed | `16:13:27.169Z` |
| **Elapsed** | **15.1 minutes** |

Server declared at open: `plan=free · lease_ttl_seconds=900 · heartbeat_interval_seconds=300`.

900s expected, reclaimed 5 seconds past it. The vendor enforces its stated TTL to the second.

### Three recorded numbers reconciled

| Source | Claim | Verdict |
|---|---|---|
| Server `lease_ttl_seconds` | 900s | ✅ |
| This measurement | 15.1 min | ✅ |
| `acceptance-matrix.md` unaided recovery | 15m19s | ✅ agrees |
| `phase-04` "roughly 20-25 minutes" | — | ❌ **wrong, corrected** |
| `license-key-pool.ts` docblock "7-17 minutes" | — | ❌ **wrong, corrected** |

The 20-25 figure was never reproduced. Most likely elapsed counted from launch start rather than
from engine death. Corrected in place rather than left to mislead the next reader.

**Cooldown decision:** keep 17 minutes = 900s + 2 min clock-skew margin. Now known sufficient
rather than assumed. Do not shorten below 15.

## 2. The defect this began as

`licence-key-reliability-probe-20260824.md` reported one profile launching and the second refused
`ENGINE_UNAVAILABLE`, with licence 1 holding an orphaned session while **zero engine processes ran
locally**.

Root cause, found by reading the wiring rather than the symptom:

| Component | State before |
|---|---|
| `license-lease-journal.ts` (210 ln, tested) | Opened at startup, read **only** for capacity display |
| `license-lease-recovery.ts` (88 ln, tested) | `recoverLicenseLeases` referenced **only by its own test** — never called in production |
| `LicenseKeyPool` | The only live seat bookkeeping. Pure in-memory |

`LicenseKeyPool` was constructed from `cachedSettings.cloakBrowserLicenseKeys` alone. Every key
started `idle` on every app start. So: browser killed → vendor counts the seat ~15 min → app
restarts → pool offers the key as free → engine refuses exit 76 → key cools → on a one-key install
the operator has no browser and no explanation.

The whole persistent layer existed. Nothing called it.

## 3. Fixed

| Change | File |
|---|---|
| Pool seeds `cooling` from persisted leases, counted from the lease's own `updatedAt`, not from process start | `license-key-pool.ts` |
| Launch/close path writes real lease records: reserve → starting → active → ending → `confirmed-released` / `cooling`, plus `terminal-refused` on refusal | `license-lease-recorder.ts` (new) |
| Wait message distinguishes "a profile is open, close it" from "a previous session is still resting, ~X min left" | `license-seat-wait-message.ts` (new) |
| Wired into launch, shutdown, and startup | `ChromiumBrowserDriver.ts`, `index.ts` |

Design rule held: **a journal write can never fail a launch.** Every write is best-effort and
logged. The journal serves the next run; refusing to open a browser over a bookkeeping file would
trade a real capability for a hypothetical one.

State-machine correction found by test: `starting → ending` is illegal. A browser that died while
still starting must pass through `pending-recovery` first.

### Verification

| Suite | Result |
|---|---|
| `test:mkb02` (pool, journal, recovery, verdict, managed mode) | **145 pass / 0 fail** |
| `test:mkb01` | 48 pass / 0 fail |
| `test:mkb03` | 35 pass / 0 fail |
| `critical-coverage-contract` | exit 0 — `license-key-pool.ts` 99.63% line |
| `verify:workspace-quality` | passed |
| Workspace typecheck | exit 0 |

16 new tests, registered in `test:mkb02` so CI runs them.

## 4. Not fixed, and why

**A killed browser still loses its seat for the full 15 minutes.** `session/end` needs a `lease_id`
and `instance_id` that die with the engine process. The fix here does not recover the seat — it
declines to offer that key until the vendor's clock has run, trading an unexplained refusal for an
explained wait. Recovering it for real would mean intercepting the licence channel, which sits
against the binary licence's reverse-engineering clause. Not done deliberately.

**`recoverLicenseLeases` is still not called at startup.** Its `deps.release` must call the vendor,
which is the same thing that cannot be done. The journal now carries real data, so the module is
ready the day a legitimate release path exists.

**No hardware run.** Everything above is unit-tested. The human gate remains: kill a browser →
restart the app → confirm the key shows `cooling` with a correct remaining time instead of a
refusal.

## 5. Two seats spent by operator error

Both mine, recorded because the licence footing matters more than the embarrassment.

1. A syntax check of the probe was run as `node --check … && node script …`. `CLOAKBROWSER_LICENSE_KEY`
   was already set in the shell environment, so the second half ran for real: opened a live session
   at `15:58:22Z` and abandoned it by design. Not recoverable — the script discards `lease_id`
   deliberately. Converted into the measurement above rather than wasted.
2. The probe reclaimed the seat at `16:13:27Z` and its own `session/end` returned **HTTP 422** — the
   payload omitted `license_key`. That held the seat a further full lease, to ~`16:28:27Z`.

Script fixed: `license_key` added to the release payload, and a non-200 release now logs a loud
warning instead of passing silently.

**Rule for anyone touching this script: it talks to the live vendor with a real key. Check the
environment before running it, including for a syntax check.**

## Unresolved

1. Where did phase-04's 20-25 minute figure come from? Corrected, but if it was measured from
   launch start there may be ~10 unexplained minutes inside the startup path worth a look.
2. Is `license_key` actually the missing field in `session/end`, or is the 422 something else? The
   fix is untested — the next probe run will say.
3. Does a crash between spawn and the `starting` journal write still lose a seat silently? That
   window is small but real, and unmeasured.
