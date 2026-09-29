# Fast switching between MKT Browser profiles

Type: research. Observed: 2026-09-21, 13:08 +07:00.
Scope: public documentation/source and local code/evidence inspection.
Product source: MKTBrowser `06fe257c7ee615b156d776cfd10d415a933c23b2`.
No new engine launch, licence API call, purchase, vendor contact, or product change.

## Summary

One licensed concurrent browser does not inherently require a 25-minute pause between
profiles. That pause is MKTBrowser's conservative local policy after an unconfirmed release,
not a published CloakBrowser requirement. The previous conversation overstated the evidence
when it assigned the cause solely to the vendor or implied buying seats would fix it.

There are three credible paths: repair/verify sequential reuse of the existing seat; support a
multi-session entitlement and keep two profiles running; or use the already supported CFT
engine for profile/proxy management. Only switching between two already running windows can
avoid browser startup time. Sequential switching can aim for normal shutdown/startup latency,
but that latency and reliable seat return have not been measured successfully here.

## Findings

### Official concurrency model

The official site and Manager documentation describe unlimited stored profiles and a cap on
simultaneously running browsers. Free permits one running profile. The site currently advertises
Solo at a promotional USD 19/month for five sessions, with USD 29 shown as the regular price.
This is a dated public price observation, not a purchase quote or verified entitlement for our key.

The Manager says the same key works in the library and Manager. Its current source passes an
application-wide key to each profile launch. This contradicts treating one key as inherently one
seat for every paid plan. Vendor marketing about identity separation was not treated as evidence.

### A capacity query exists without acquiring a session

Official SDK `js/src/license.ts:665` implements `getSessionSeats()` against
`POST /api/license/session/count`, with the key in the body. Python has the equivalent at
`cloakbrowser/license.py:517`. The helper returns count, limit, state and reason, and deliberately
does not cache the answer. Unknown, unreachable and denied responses remain distinguishable.

This is a materially better diagnostic interface than opening a probe session through
`session/start`. It can support an evidence-based fast path when fresh server state reports
capacity available and local process/journal state is reconciled. A count observation is neither
an atomic reservation nor a receipt for ending a particular lease; a later launch can still race
another device. Recheck on the single operator launch and handle refusal without a retry loop.

The query was inspected in source only, not called with the live key. A future implementation must
keep it local, validate the response, respect rate limiting and preserve uncertainty on failures.
It must not mark a specific lease vendor-released merely from a local close or an unrelated probe.

### Official close path is a reference, not a demonstrated cure

Official Manager `backend/browser_manager.py:538` launches through
`launch_persistent_context_async`; `_close_context` at line 829 awaits `context.close()`.
No `lease_id` or `session/end` call occurs in that inspected Manager file. The Python SDK's
persistent close wrapper awaits the original context close and stops Playwright afterward.
The inspected Python and JavaScript licence modules do not expose an engine lease-ID handoff
or perform `session/end`; there is no demonstrated drop-in release function to wire into MKTBrowser.

MKTBrowser directly spawns the engine, attaches through CDP and closes through `Browser.close`.
`browser-shutdown-sequence.ts:73` waits for shutdown, then can escalate to process termination.
The normal tracked path allows four seconds for exit; the handed-off Windows browser also gets
a four-second data-directory wait. Compare this lifecycle with the official persistent-context
path before choosing a fix. Forced termination, child-process handoff, launch environment,
native engine behaviour and server state remain possible causes, not established diagnoses.

Some local comments still assert that graceful shutdown returns the vendor seat. Those comments
are contradicted by later negative evidence and must not be used as proof.

The earlier API-only start/end observation does not prove that the engine-owned lease was ended.
The local September 2 baseline records HTTP 200 for the separate API start/end diagnostic followed
by another engine refusal. The September 21 audit also records probe-release-then-launch failures
at 0.2 seconds and 60 seconds. A successful probe release cannot establish reliable engine reuse.

### Buying more sessions requires application changes

Local limitations independently block using a paid multi-session key as advertised:

- `apps/desktop/src/main/index.ts:168`: additional keys are disabled.
- `apps/desktop/src/main/index.ts:565`: startup supplies only the primary key to the pool.
- `apps/desktop/src/main/license-key-pool.ts:134`: one slot per distinct key; duplicate keys are removed.
- `apps/desktop/src/main/license-lease-journal.ts:84`: another live profile owning the key blocks reservation.
- `apps/desktop/src/main/license-lease-journal-schema.ts:65`: multiple blocking records for a key are rejected.

A paid-key path needs per-key entitlement and multiple per-session allocations, a compatible
durable journal/recovery model, and correct aggregate capacity across Browser, Relay and Web.
Turning on the additional-keys flag or pasting the same key twice is insufficient.
Extra seats also do not cure leaking sessions: repeated close/reopen cycles can exhaust a larger cap.

### CFT already avoids this licence wait

`ChromiumBrowserDriver.ts:248` applies the licence pool only to CloakBrowser. CFT uses separate
profile data directories and per-profile proxy launch configuration without a CloakBrowser seat.
This is consistent with the existing product scope of a profile/proxy/ownership manager.

CFT is not equivalent to CloakBrowser fingerprint behaviour. Switching engines also does not
automatically migrate logins: `chromium-profile-data-dir.ts:9` gives CloakBrowser its own nested
data directory. Keep existing data intact and validate separate storage, proxies, lifecycle and
the selected signed/pinned runtime before any operational change. No engine selection changed here.

## Options

| Option | Expected user experience | Prerequisite | Verdict |
|---|---|---|---|
| Repair and verify reuse of one Cloak seat | Close P1, then open P2 after actual shutdown/startup; remove arbitrary wait only when supported by evidence | Compare official close lifecycle; obtain fresh server capacity; handle uncertainty and refusal; prove P1-to-P2 on exact Windows engine | First investigation choice; live success OPEN |
| Multiple Cloak seats, keep P1 and P2 running | Immediate window switching after both have launched | Valid entitlement for at least two sessions, application pool/journal changes, adequate RAM and actual dual-launch verification | Feasible design; purchase alone insufficient |
| Existing CFT profile/proxy mode | No Cloak licence cooldown; warm windows switch directly, cold profiles still start normally | Accept stock engine scope; preserve separate data/proxies; validate selected runtime | Simplest way to remove the licence dependency if Cloak is optional |
| Two contexts inside one Cloak process | Potential fast tab/context selection | New storage/proxy/fingerprint architecture and confirmed vendor session semantics | Not recommended as a shortcut for existing persistent profiles |

The last option is not an established replacement for independent persistent browser profiles.
Current MKTBrowser binds data directory, proxy and fingerprint launch arguments to each browser
process. Context or Chrome profile-directory reuse does not automatically preserve that contract.
Hiding or suspending a window also does not prove that the server released its licence session.

## Recommended next work

1. Prioritize the existing-key path if preserving CloakBrowser is the requirement. Do not buy a
   larger plan merely to diagnose the current failure.
2. Add a bounded local capacity observer based on the official count helper. Keep key material
   off Web and logs. This is proposed implementation, not an endpoint called in this research.
3. Prepare a controlled comparison using the exact same engine/key on Windows: official persistent
   lifecycle versus MKTBrowser lifecycle, with disposable data. Observe server count before/after
   closing and retain shutdown/escalation events. No `session/start` availability probes.
4. A future live test needs its own bounded launch budget; the earlier worklist's sole attempt was
   already consumed. Do not rerun that helper or repeat launches on a timer. Stop on refusal.
5. Only after evidence supports reuse, add a fast transition when server capacity permits and local
   ownership is reconciled; retain the conservative wait when state is unknown. Verify P1 then P2,
   distinct data/proxy bindings, restart handling, and no automatic engine retries.
6. If literal instant switching is required, scope the multi-session allocation/journal work and
   keep both profiles running. If only profile/proxy management is needed, evaluate CFT first.

These are next-work recommendations, not implemented changes or release approval. No additional
licence money was spent. Product source and the prior negative live receipt remain unchanged.

## Sources and methodology

Public sources retrieved on 21 September 2026. Context7 had no indexed documentation for the query;
used the vendor website and public upstream code. Broad issue-search output did not establish a
root cause and was not used as proof. No native engine implementation was available for inspection.

- [Official pricing and concurrency](https://cloakbrowser.dev/#pricing).
- [Official Manager product and FAQ](https://cloakbrowser.dev/manager).
- SDK source revision: `11c76ebe7530d51488a73ef0f4b1aa5a080d77b9`.
- [JavaScript session-count helper](https://github.com/CloakHQ/CloakBrowser/blob/11c76ebe7530d51488a73ef0f4b1aa5a080d77b9/js/src/license.ts#L654).
- [Python session-count helper](https://github.com/CloakHQ/CloakBrowser/blob/11c76ebe7530d51488a73ef0f4b1aa5a080d77b9/cloakbrowser/license.py#L517).
- [Python persistent-context close](https://github.com/CloakHQ/CloakBrowser/blob/11c76ebe7530d51488a73ef0f4b1aa5a080d77b9/cloakbrowser/browser.py#L699).
- Manager source revision: `c393d88c66fe2790ed8ea753c095ad48b9498486`.
- [Official Manager launch](https://github.com/CloakHQ/CloakBrowser-Manager/blob/c393d88c66fe2790ed8ea753c095ad48b9498486/backend/browser_manager.py#L538).
- [Official Manager close](https://github.com/CloakHQ/CloakBrowser-Manager/blob/c393d88c66fe2790ed8ea753c095ad48b9498486/backend/browser_manager.py#L829).
- [Current fix and negative live result](fix-260921-1109-licence-seat-fixes.md).
- [September 21 audit; observations are distinct from causal assertions](audit-260921-0932-identity-isolation.md).
- [September 2 baseline; separate API release did not make engine launch succeed](../260902-0544-fingerprint-gate-and-brave-spike/reports/cloak-baseline.md).

## Unresolved questions

- Does the exact Windows .6 engine return its seat promptly under the official persistent-context lifecycle?
- Does a fresh count of zero agree with the next engine launch, or is there another engine/device/session issue?
- Is the desired UX sequential switching with normal startup time, or two simultaneously running profiles?
- Is CloakBrowser mandatory, or is the existing CFT profile/proxy scope sufficient?
