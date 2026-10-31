# Owner decision — 31 October 2026: free seat only

No paid CloakBrowser seat will be purchased for now. Capacity stays at the vendor's free-seat
limit (one concurrent session per key; vendor-down days fail closed with exit 78). Consequence:
effectively one operator launches at a time. This is accepted as part of running the tool as a
solo/small internal setup. Revisit this decision only when a second operator genuinely needs to
launch concurrently.

---

# Licence seat retry and engine integrity policy

**Source checkpoint:** 21 September 2026. The conservative baseline is recorded in the
[licence-seat fixes](../plans/260921-1109-licence-seat-fixes/plan.md). The current source behavior is
tracked by the [fast sequential switching plan](../plans/260921-1331-cloak-fast-profile-switch/plan.md).

## Local launch policy

`Browser.close`, a normal exit code 0, and successful orphan cleanup prove local process handling,
not that the vendor released its session. An independently proven vendor release may explicitly
bypass the wait. An unstarted reservation remains immediately releasable because no engine ran.

| Event | Current source policy | Operator action |
|---|---|---|
| Reconciled local close; fresh vendor count reports capacity | Retire only the local cooling/refusal hold as `expired`, then permit one launch attempt | Request one launch; do not treat the count as a lease receipt |
| Vendor count is occupied, denied, rate-limited, malformed, timed out, unreachable, or stale | Keep capacity unavailable | Use **Check availability** later; no launch is queued |
| Engine closes without usable fresh observation | Keep the existing 25-minute conservative wait | Wait until the displayed time, then request one manual launch |
| Vendor refuses the session | Invalidate capacity and keep the 30-minute conservative refusal wait | Stop; do not retry automatically |
| Prior session needs recovery | Keep its capacity unavailable until reconciled; an interrupted start uses the longer 30-minute wait | Follow Browser recovery guidance |

Wait state survives Browser restart. Restarting the app must not make a resting key free or
shorten a refusal wait. A count of zero cannot identify which lease ended, so fast admission never
rewrites a prior record as `confirmed-released`. Each operator request makes at most one engine
attempt; there is no automatic key rotation, queued launch, or background retry after refusal.

`MKT_BROWSER_FAST_LICENSE_REUSE=0` disables the count-assisted fast path and restores the fixed
25/30-minute conservative behavior without changing engine bytes, profiles, or the durable journal.

These durations are conservative local policy, not verified vendor TTLs. The 21 September audit
observed delayed availability after clean close and repeated refusals. A failed launch resetting
the vendor timer remains a hypothesis. A local deadline permits another manual attempt; it does
not promise that the vendor will accept it.

## Capacity across Browser, Relay, and Web

Browser combines local pool/journal state with a bounded count-only vendor observation. The request
and freshness windows are five seconds and are scoped to the current key generation. Late,
out-of-order, or invalidated results cannot authorize launch. Runtime health passes only sanitized
aggregate state through Relay to Web; it must not include licence keys, key tails, profile
identifiers, response bodies, or signed download URLs.

The optional `retryAt` field is an ISO timestamp for the earliest known local retry when capacity
is exhausted. Omit it when a free slot exists or no deadline is known. It is neither a vendor
release receipt nor a countdown that launches automatically. Missing timestamps keep older
capacity payloads compatible; show truthful wait or recovery guidance without inventing a time.

Web enforces valid CloakBrowser capacity even while `license-capacity-v1` remains unadvertised.
Contract 5 adds sanitized `availability`, `reason`, observation timestamps, and optional vendor
counts plus an explicit profile-lifecycle refresh tool. The Web-to-Relay refresh has a 10-second
timeout, never launches an engine, and never queues a later launch. Missing, stale, or invalid
capacity fails closed. CFT launch readiness is unaffected. Desktop admission always performs its
own fresh check because a Web health snapshot is display evidence, not authorization.

## Download and measurement integrity

New CloakBrowser downloads fail closed when the expected checksum is unavailable or invalid, or
the downloaded bytes do not match. Pinned CFT downloads retain checksum enforcement. The existing
unpinned development CFT behavior is unchanged. A checksum proves correspondence with expected
bytes; it does not prove engine identity isolation or expand licensing rights.

The harness checks the selected version/hash against the active engine pin before launching and
requires explicit engine arguments to resolve pin drift. Preserve the historical `.2` defaults.
The `.6` provenance record contains only sanitized artifact URL, SHA-256, version, and activation
sequence; never retain signed query parameters, credentials, or raw vendor responses.

## Evidence and acceptance

The [one-shot real-engine receipt](../plans/260921-1109-licence-seat-fixes/live-seat-once.json)
records **FAIL** for seat availability: the sole launch at `2026-09-21T04:43:20.005Z` was refused
with exit code `76`, after at least 31.25 locally quiet minutes. No second engine attempt or vendor
probe followed. This observation does not support a guarantee that 25 quiet minutes clears a seat,
and it does not establish the cause or prove the timer-reset hypothesis.

The repaired runtime correctly reported `free: 0`, `cooling: 1`, and
`retryAt: 2026-09-21T05:13:23.817Z` immediately after refusal. Clean-close capacity has automated
driver coverage, but real successful-launch/clean-close acceptance remains **OPEN**. The smoke used
the new source bundle with existing packaged dependencies in a disposable Electron runtime; it is
not installer acceptance. The [fingerprint acceptance gate](../MKTBrowser/docs/fingerprint-acceptance-gate.md)
remains separate.

CloakBrowser identity remains **BLOCKED**. Historical `.2` retains `0/10`; the `.6` audit contains
a partial P1 observation, not five profiles with two complete runs each. Future measurement may
need verified multi-session entitlement or a long manually paced session, with the longer wait
after any refusal. No purchase or research reopening is authorized by this document.

Source checks, live smoke, exact installer acceptance, clean VM, second physical PC, human
acceptance, and canary evidence remain separate. The fast-path source suites pass, but product-path
P1 -> P2, packaged contention, coordinated Relay 18, native fingerprint A/B/C, proxy/DNS/WebRTC,
human, second-PC, and canary evidence remain OPEN. `G2-IDENTITY=FAIL` is unchanged. This checkpoint
records no new live launch, installer, publication, push, deployment, or operator promotion.

## Remaining evidence

- Vendor availability after a quiet interval remains blocked; another timed retry is not evidence
  that the cause is understood. No paid seat was purchased or activated in this task.
- The existing .6 pin record is local provenance only; its signature and archive were not revalidated.
- Disposable Electron cleanup initially found a locked DIPS cache file. No diagnostic process
  remained afterward; temporary licence settings were cleared. This is not a clean-VM cleanup pass.
