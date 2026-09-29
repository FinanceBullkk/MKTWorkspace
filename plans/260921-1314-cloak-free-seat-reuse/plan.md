# Verify sequential reuse of the free CloakBrowser seat

Status: COMPLETE - scoped sequential key reuse PASS through the official SDK.
User requires CloakBrowser; no CFT substitution. Product integration remains separate.
Scope: verify one free-key P1 -> close -> P2 transition on the installed pinned engine.

## Boundaries

- Use disposable profiles and the existing key, never real account data.
- Query the official session-count interface; do not acquire probe leases through session/start.
- Maximum two engine launch attempts: P1, then P2 only if P1 succeeded and fresh capacity permits.
- Stop on a licence refusal, unknown capacity, or an occupied seat. No timed launch retries.
- No purchase, key rotation, engine update, vendor message, production setting or pin change.
- Preserve installed user applications and the previous one-shot evidence.
- A successful sequential launch is licence lifecycle evidence, not fingerprint-isolation acceptance.

## Work

- [x] Review current implementation, previous negative evidence and official count response schema.
- [x] Record sanitized server capacity and local process preflight: 0/1, no engine process.
- [x] Prepare official SDK 0.5.10 / Playwright 1.62.0 with the exact installed .6 engine.
- [x] Run P1-to-P2: exactly two launches; count 0 -> 1 -> 0 -> 1 -> 0; separate storage.
- [x] Record outcome, cleanup, timing limitations and implications for MKTBrowser.

## Result

At 13:23 Vietnam time both profiles launched with the same existing one-session key.
P2 launch was requested 1.732 seconds after the SDK finished closing P1. P2 was verified
usable 5.193 seconds after P1 closed, including a deliberate three-second diagnostic pause.
Both closes left no engine processes; final server count was 0/1. No retry or forced cleanup.

Receipt: [official-sdk-reuse.json](official-sdk-reuse.json).
Report: [verified reuse and boundaries](../reports/debug-260921-1314-cloak-free-seat-reuse.md).
Product code/cooldown and installed application remain unchanged. The earlier negative live
receipt remains valid history; the precise cause of that failure has not been isolated.

## Acceptance

PASS requires P1 and P2 to launch with the same key and exact CloakBrowser engine, with P1 fully
closed before P2. Record server count and elapsed handoff time; no paid or additional seat.
BLOCKED if prerequisites cannot be established; FAIL if an attempted transition is refused.
Do not change the application's conservative cooldown solely to make a diagnostic pass.
