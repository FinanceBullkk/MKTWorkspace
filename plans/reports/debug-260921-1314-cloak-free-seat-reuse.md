# Free CloakBrowser key reuse verified through the official SDK

Date: 21 September 2026, 13:23 +07:00. Scope: one sequential P1-to-P2 lifecycle.
User requirement: retain CloakBrowser and its native fingerprint functionality.

## Outcome

PASS: the existing one-session key opened P1, released its capacity after P1 closed, then opened
P2 without a 25/30-minute wait. P2 also released capacity after close. Exactly two launch calls;
no refusal, engine retry, additional key, purchase, engine replacement or CFT fallback.

This establishes a feasible free-key path for sequential profile use on this host and engine.
It does not establish reliability over repeated cycles, identify the exact cause of the earlier
failure, or mean the installed MKTBrowser application has already adopted this behaviour.

## Evidence

- [Raw sanitized receipt](../260921-1314-cloak-free-seat-reuse/official-sdk-reuse.json).
- [Initial count-only preflight](../260921-1314-cloak-free-seat-reuse/capacity-preflight.json).
- [Bounded experiment and assumptions](../260921-1314-cloak-free-seat-reuse/plan.md).
- [Experiment script](../260921-1314-cloak-free-seat-reuse/verify-official-sdk-reuse.cjs).

| Event | Local time | Vendor capacity |
|---|---|---|
| Initial count-only preflight | 13:17:27 | 0 active / limit 1 |
| Fresh preflight immediately before P1 | 13:23:30 | 0 / 1 |
| P1 launch requested | 13:23:31.770 | One launch attempt |
| P1 local page and separate storage verified | 13:23:36.302 | 1 / 1 |
| P1 close requested | 13:23:38.132 | SDK context.close |
| P1 close resolved | 13:23:39.585 | No engine processes remained |
| First count after P1 close | 13:23:39.909 | 0 / 1 |
| Fresh preflight before P2 | 13:23:40.328 | 0 / 1 |
| P2 launch requested | 13:23:41.317 | Second and final launch attempt |
| P2 local page and separate storage verified | 13:23:44.778 | 1 / 1 |
| P2 close resolved | 13:23:45.938 | No engine processes remained |
| First count after P2 close | 13:23:46.260 | 0 / 1 |
| Final count | 13:23:46.917 | 0 / 1 |

All count requests returned HTTP 200. There were eight count requests total: one standalone
preflight and seven inside the experiment. No API-only session/start or session/end probe.

Timing: P2 launch requested 1.732 seconds after P1 close resolved; P2 usability verified after
5.193 seconds. The latter includes an intentional three-second wait to catch a delayed licence
denial, plus capacity/process checks. This is not a latency benchmark or an instant-switch SLA.

Receipt timing limitation: count `observedAt` is the request-start time, not response completion
or the exact server release time. Consequently `vendorFreeDelayMs` (324/322 ms) is only a query
start offset and must not be described as a measured release duration.

## Exact runtime and data boundary

- CloakBrowser: `151.0.7922.108.6`, existing active pin sequence 2.
- Archive hash from local pin/cache metadata:
  `5bd3951f470fff79998a437a139e3e8d68478bc2663402aca1666faf4eadac37`.
- Executed chrome.exe SHA-256:
  `484ab0e66600a3b0a8c4848ccaef38ce65b69e87687a68a3b2b68d5db1f0455e`.
- Official npm SDK `cloakbrowser@0.5.10`; `playwright-core@1.62.0`; Node `22.23.2`.
- SDK used its supported local-binary override for the existing pinned executable. No engine
  download, version fallback or licence bypass. Native licence checks remained active.
- Separate disposable persistent directories P1 and P2; native fingerprint seeds `2609211314`
  and `2609211315`. No fingerprint-off flag or JavaScript fingerprint substitution.
- Headed Windows browser; local synthetic HTTP page only. Both profiles started with an empty
  synthetic localStorage marker, then stored only their own P1/P2 marker.
- No real account, cookies, page content, or operator proxy credentials used.
- SDK dependencies installed only under ignored `local-test-artifacts/cloak-free-seat-260921-1314`.
  Install scripts disabled. An initial shared npm-cache collision was resolved with a task-local
  cache; no shared cache removal or engine launch occurred during that preparation failure.

The same native user-agent hash across profiles is normal for the same engine version and is not
fingerprint-isolation evidence. Distinct seeds show native configuration intent; this experiment
did not measure fonts, canvas, audio or WebGL isolation, restart consistency, or external detection.
Fingerprint acceptance remains NOT-RUN for this experiment; historical gate findings are unchanged.
Proxy/network acceptance, real account use and packaged installer acceptance are also outside scope.

## Cleanup and application state

The SDK closed both diagnostic browsers; process enumeration found no remaining engine process.
Final vendor count was 0/1. No manual force-kill or data deletion was required.
Disposable profiles and dependency files remain local for audit; no licence key is written into
the scripts or receipts. The native SDK may use its normal local denial-file directory.

Original MKTBrowser processes 21344, 9904, 18056 and 2200 and Relay process 12048 were still present
afterward. No installed app was closed. MKTBrowser source worktree remains clean; no product code,
cooldown, production pin, package, release, deployment or key entitlement changed.

## Interpretation and next action

The previous statement that this key necessarily permits only one launch every 25-30 minutes
is disproved. Those durations are local uncertainty guards, not an inherent free-plan requirement.
The successful SDK path also means buying extra seats is unnecessary to demonstrate sequential use.

The previous failed attempt remains real evidence. This experiment differs in launcher, launch
arguments/environment, control transport and timing; it does not by itself prove that MKTBrowser's
shutdown code, the engine, or the vendor alone caused the earlier problem.

Recommended implementation: compare the proven official lifecycle with MKTBrowser, add a local
fresh-capacity observation, and permit prompt reuse when ownership is reconciled and server state
supports it. Preserve the conservative unknown/refusal path and one-attempt policy. A zero count
is a capacity observation, not an atomic reservation or a specific lease-release receipt.

Keep the existing app behaviour until that integration has its own tests and bounded real P1-to-P2
verification. This task's two-attempt budget is consumed; no further launch was made.

## Unresolved questions

- Which difference between the SDK and MKTBrowser explains the earlier refusal/retained session?
- Can the integrated app reproduce this transition reliably with its actual per-profile proxy setup?
- Do CloakBrowser fingerprint surfaces meet the separately required identity acceptance criteria?
