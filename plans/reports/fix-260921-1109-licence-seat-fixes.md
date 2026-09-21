# Licence seat fixes - source complete, vendor availability blocked

Date: 21 September 2026. Scope: MKTBrowser and MKTTool.
Input: [worklist](worklist-260921-1105-licence-seat-fixes.md).
Plan: [implementation and validation](../260921-1109-licence-seat-fixes/plan.md).

## Worklist outcomes

| Item | Source outcome | Acceptance boundary |
|---|---|---|
| 1. False release after close | Fixed: Browser.close, exit 0 and orphan cleanup cannot imply vendor release. Default close waits 25 minutes; explicit release proof and unstarted reservations remain supported | Automated actual-driver/journal tests pass. Real successful-close check is OPEN because the sole live launch was refused |
| 2. Repeated refusal | Fixed: one engine attempt per operator request, 30-minute refusal wait, no automatic rotation/relaunch, explicit manual retry time and uncertainty | The quiet real-key attempt FAILED after 31.25 minutes; a guaranteed vendor recovery deadline is unknown |
| 3. Web readiness | Fixed: validate and enforce aggregate capacity even without license-capacity-v1; missing/invalid Cloak capacity fails closed; preserve genuinely free slots and CFT behavior | Source verification only; no Web deployment or Relay rebuild |
| 4. Harness drift | Fixed: check active pin and cache before any browser launch; require paired version/hash overrides; preserve historical .2 defaults and user experiment edits | .6 URL/hash/sequence recorded as sanitized local provenance, not a new signed authority or acceptance receipt |
| 5. Best-effort checksum | Decision implemented: new CloakBrowser downloads fail closed for missing/invalid checksum and mismatched bytes; no silent fallback | Pinned CFT validation retained; existing unpinned development CFT unchanged |
| 6. Identity gate | Documented measured single-seat limitation and failed quiet launch | Historical .2 0/10 and G2-IDENTITY=FAIL retained; .6 A/B/C BLOCKED; five profiles and ten complete readings still required |

## Review corrections

- Retry a failed refusal journal write during cleanup, without retrying the engine. Repeated write
  failures leave an interrupted start; recovery durably retains a conservative 30-minute wait.
- Normalize a future journal timestamp once per lease revision. Capacity reporting and acquisition
  now agree at expiry instead of moving the reported deadline on every read.
- Check actual source driver behavior, durable disk reopen, two successive restarts, clean exit,
  orphan cleanup, unknown capacity, malformed timestamps, checksum failures, and early pin drift.
- Independent review confirmed all three durability/deadline findings resolved.

## Real key result

Receipt: [live-seat-once.json](../260921-1109-licence-seat-fixes/live-seat-once.json).

- Local quiet observation began `04:12:04.951Z`; no vendor seat probe was used.
- Exactly one engine attempt began `04:43:20.005Z`, after 31.25 locally quiet minutes.
- Engine `.6` exited with licence refusal `76` at `04:43:23.714Z`.
- Repaired runtime immediately returned `total: 1, free: 0, active: 0, pendingRecovery: 0,
  cooling: 1, retryAt: 2026-09-21T05:13:23.817Z` (12:13:23.817 Vietnam time).
- No second launch, vendor start/end probe, paid-seat purchase, or seat activation followed.
- This fails seat-availability acceptance. Refusal handling is observed working; successful
  clean-close capacity remains OPEN. The timer-reset hypothesis remains unconfirmed.

The smoke used Electron 42.8.1 from the existing local cache, the newly built source bundle, and
dependencies extracted from the existing technical package. It did not alter the installed app.
Source main-bundle SHA-256:
`0238f7be15515f0670f848b641fe6b400057a2e2b40c51eb78a2b3db9ef75670`.
Initial preparation exposed missing dev Electron and a Node/Electron SQLite ABI mismatch, before
any engine launch; an isolated diagnostic runtime resolved those preparation issues.

Temporary cleanup encountered a locked DIPS file. No diagnostic process remained afterward,
and temporary licence settings were cleared. Disposable runtime artifacts remain local/ignored;
this is not clean-VM cleanup evidence. The original installed Browser and Relay were not closed.
The receipt's primary error initially contained the cleanup exception; it was corrected from the
recorded `CHILD-EXIT 76` lifecycle, with the original cleanup exception retained separately.

## Validation and delivery

| Check | Result | Boundary |
|---|---|---|
| Browser `test:installer` | PASS: 623 executions, 622 passed, 0 failed, 1 skipped | The skipped live Windows process/listener/startup integration requires an explicit environment opt-in; this does not establish installer acceptance |
| Browser full typecheck and lint | PASS | Source checks on Node 22.23.2 / Yarn 4.5.0 |
| Browser Electron Vite source build | PASS | No new installer was built |
| Browser focused driver/journal/restart regressions | PASS: 43/43 | Additional focused check before the final broad run |
| MKTTool focused unit tests | PASS: 13 suites, 170/170 | Actual base Vitest config, with only database global setup disabled; no database integration claim |
| MKTTool full lint | PASS | Final validation run |
| MKTTool full TypeScript check | PASS | Earlier implementation validation; no later Tool source changes |
| Independent review | PASS | Three durability/deadline findings fixed and re-reviewed |
| Real licence seat availability | FAIL | Exactly one refused launch after 31.25 locally quiet minutes |
| Real successful clean-close capacity | OPEN | Live launch did not reach this check |
| Identity acceptance | BLOCKED | No new accepted fingerprint pool; historical `G2-IDENTITY=FAIL` unchanged |

Final command receipts: [final-validation.json](../260921-1109-licence-seat-fixes/final-validation.json).
Local commits:

| Repository | Commit | Scope |
|---|---|---|
| MKTBrowser `main` | `06fe257c7ee615b156d776cfd10d415a933c23b2` | 30 explicit paths; seat lifecycle, capacity, engine integrity, harness, tests and gate documentation |
| MKTTool `master` | `3461b58f5e0e6e30221354e1b29b945e84c5fdf8` | 13 explicit paths; capacity/readiness, tests and operational documentation |

Both application worktrees are clean after commit. Staged secret scans and committed diff checks
passed. Existing related measurement-script changes are preserved in the Browser commit.
Raw command logs remain local; the validation receipt retains their SHA-256 hashes. The two
user-authored input reports remain untouched and outside this task's commits.
No installer, clean VM, live machine integration, second-PC, human walkthrough, elapsed canary,
push, publication, deployment, or operator promotion ran.

## Remaining evidence

- Vendor cause and a reliable way to acquire the existing single seat remain unresolved; a fixed
  25-minute retry cannot be called a solution after the quiet attempt also failed.
- The [sanitized .6 pin](../260921-1109-licence-seat-fixes/cloakbrowser-151.0.7922.108.6-local-pin.json)
  agrees with local cache metadata; its signature and original archive were not revalidated.
- Distribution requires fresh packaged acceptance. Source checks and this negative live receipt
  do not approve a replacement installer or an identity-isolation claim.
