---
phase: 4
title: "Native fingerprint and live acceptance"
status: in_progress
priority: P1
dependencies: [3]
effort: ""
---

# Phase 4: Native fingerprint and live acceptance

## Overview

Validate source first, then exact packaged CloakBrowser behavior with disposable profiles.
Record PASS / FAIL / OPEN / BLOCKED separately for each gate.

**Status boundary:** Phase 4 is in progress. Stage A passed through the packaged product on R27.
R28 completed the frozen five-profile/two-run fingerprint measurement and criteria A, B and C all
failed. A redacted host probe now confirms 10/10 available real proxies with egress distinct from
the direct baseline. Packaged two-process contention and browser-page proxy/DNS/WebRTC evidence
remain OPEN;
`G2-IDENTITY=FAIL` remains unchanged.

## References
- MKTBrowser/docs/fingerprint-acceptance-gate.md
- plans/reports/debug-260921-1314-cloak-free-seat-reuse.md
- Existing packaged lifecycle and fingerprint measurement scripts; retain pin-drift/checksum guards.

## Implementation Steps
1. Run focused driver/pool/journal/recovery/contract tests, Browser typecheck/lint/build, and
   affected Tool/Relay tests. Resolve failures locally before any live launch.
2. Prepare a NEW receipt/harness with exclusive attempt markers; never rerun the consumed SDK
   experiment. Record exact app/engine hashes, active pin, dependency locks and capacity schema.
   Measure free RAM, use disposable profiles and do not close user apps.
3. Stage A budget: at most 4 Cloak launches, P1 -> P2 -> P1 -> P2, sequentially through the actual
   app/Relay path. Before every launch check fresh vendor capacity and reconciled local ownership.
   Stop immediately on refusal, unknown capacity, ownership mismatch or cleanup failure.
4. Record count before/during/after, close method/escalation, process ownership, separate storage,
   native seed/arguments and actual proxy binding/egress. Assert P2 never starts before P1 exit.
   Capture request AND response completion timestamps; no request-start release-time claim.
5. Performance target: each healthy transition reaches usable local test page within 10 s of prior
   close completion on this host, excluding a declared external proxy outage. Record raw timings;
   do not subtract real work or intentional waits. A miss is a performance gate failure, not permission
   to weaken thresholds. Also report page/network timing independently.
6. Only after Stage A passes, Stage B budget: 10 Cloak launches, five disposable profiles twice,
   one at a time, using the existing fingerprint measurement methodology. Preserve same-profile
   seed and complete surface/context readings across restart. No substitutions or reduced pool.
   Same-machine stock control is laboratory evidence only and must be separately identified.
7. Freeze fingerprint A/B/C interpretation before measurement. The existing stable-subset definition
   has a mathematical caveat: any nonempty subset selected as identical across all profiles
   necessarily collides. Report the literal gate plus this limitation; do not silently redefine it
   or manufacture a pass. Any criterion change requires an explicit recorded decision.
8. Failure budget is stop-on-first-refusal, not 14 retries. New attempts after a failure require a
   diagnosed change and a newly documented budget. No timed launch loops or API-acquired probe seats.

## Success Criteria
- [x] Stage A passes through product code; final count returns to baseline and no owned engine remains.
- [x] Clean close, manual window close and restart/recovery have source regression coverage.
- [ ] Real proxy/DNS/WebRTC fail-closed evidence is recorded separately from localhost success.
- [x] Native Cloak functionality remains enabled; A/B/C measured independently over the full pool.
- [x] Missing/failed fingerprint results block identity claims; seat success remains separately recorded.
- [x] Receipts contain no credentials/account data; hashes and timing semantics are reproducible.

## Real proxy host preflight - 22 September 2026

- **PASS / scope-limited:** all 10 entries in `Webshare 10 proxies (1).txt` passed the existing
  independent proxy-exit probe and differed from the direct egress baseline. Latency was
  0.709-1.017 seconds.
- Receipt:
  `local-test-artifacts/local-release-20260922/pilot-0324-r2/guest-gate-r1/real-proxy-preflight-r1-20260922-065840.json`,
  SHA-256 `6ef9562a3220a51a03b73a9000082024d36b373c951b5a9620d769936f6e5eb7`.
- Redaction verification found zero occurrences of every source host, username and password. The
  receipt stores only source hash, entry index, latency, verdict and run-scoped egress fingerprints;
  its HMAC key is discarded.
- **OPEN:** this host probe does not exercise the retained installer, browser page, DNS, WebRTC,
  signed Web -> Relay ticket path, bad-proxy refusal or recovery. Those remain clean-VM gates.

## Isolated signed-path fixture - 22 September 2026

- **PASS:** a production read-only comparison found all 10 Webshare entries absent from production
  nick assignments and the production ObserverProxy table. Index 1 is reserved as the no-login
  compatibility-smoke proxy and index 2 as the synthetic profile proxy for this isolated run.
- **PASS:** the loopback PostgreSQL fixture on port `55424` now contains exactly one synthetic user,
  session, account, profile proxy and observer proxy, with credentials encrypted under the fixture
  keys and zero Relay devices before UI enrollment. No production row was changed.
- **PASS:** guest UI controller r2 adds bounded navigation and clicks for the synthetic account,
  profile creation and profile opening while preserving the versioned session handoff and redacting
  endpoint-shaped page text.
- Host preflight r3 receipt:
  `local-test-artifacts/local-release-20260922/pilot-0324-r2/guest-gate-r1/host-candidate-preflight-r3.json`,
  SHA-256 `79514d08e50088d47888c5e2f65c68158d22135d92cdab9f7ae4a5459a3ce864`.
- **FAIL / production-only:** the existing active production ObserverProxy is currently
  unreachable. The clean-VM fixture does not inherit or hide this failure; its two proxy entries are
  from the same provider, so independent-provider observer evidence remains OPEN.

## Risk Assessment
Engine-native fingerprint weaknesses may remain even after lifecycle repair. Report them without
rewriting the engine, switching vendors or claiming real-account safety. Proxy/control prerequisites
that are unavailable remain OPEN; do not substitute synthetic output as live acceptance.

## Post-failure local-only diagnostic budget - 21 September 2026

The first product-path attempt passed a fresh count-only preflight at `0/1`, then the engine was
refused and left vendor capacity at `1/1` with no local CloakBrowser process. The vendor reclaimed
that session about 15 minutes later. This contradicts the selected direct-launch lifecycle enough
to reopen diagnosis, but does not permit another real engine attempt yet.

A separate budget of at most four **local-only** engine launches may compare the current direct
process model, narrowly varied Windows relaunch guards, and the official SDK process model against
a strict loopback licence simulator. Every launch must use a synthetic key and
`CLOAKBROWSER_LICENSE_API` pointing at `127.0.0.1`; no vendor endpoint, account, seat, or attempt is
used. Record only request shape, counts, timings, process ownership, and sanitized digests. Stop on
any unexpected route, external fallback, or cleanup failure. This diagnostic does not satisfy any
Stage A acceptance criterion and does not reset the real stop-on-first-refusal rule.

### Corrected local-only R2 budget

The first four-launch local receipt is retained as invalid diagnostic evidence: dependency
resolution failed in all direct modes, the simulator omitted the observed `limit` field, and the
harness still wrote `status: passed` despite per-mode failures. It therefore supports no lifecycle
conclusion. A corrected R2 harness may use one new budget of at most four loopback-only launches:
product-exact-observed, product plus only `SystemDrive`, the historical working direct shape, and
the official SDK. It must require exactly one start and one end, zero remaining owned processes,
record the diagnostic licence exit code and bounded sanitized stderr, and fail overall when any
mode fails. The synthetic key and loopback API remain mandatory; no vendor endpoint, account, seat,
or real Stage A attempt is authorized by this R2 budget.

### Local R2 result and signed-token boundary

R2 used all four local launches and correctly failed all four with licence exit `78`, exactly one
`session/start`, no `session/end`, and zero remaining owned processes. Static analysis of the pinned
engine then identified the missing contract: a successful start response requires a vendor-signed
`token` in addition to `valid`, `lease_id`, `heartbeat_interval_seconds`, and
`lease_ttl_seconds`. The engine validates token claims including `license_key_hash`, `install_id`,
`instance_id`, `lease_id`, and `expires_at`. A loopback simulator cannot mint that signature, so the
R2 matrix cannot distinguish launcher variants and must not be rerun or treated as product evidence.
Receipt: `local-license-launch-comparison-r2.json`, SHA-256
`119b2568859c3d5a27942dcc360c9722f617e99c48231638125b5be9667bd86c`.

### Product-path diagnostic R4 budget

Vendor capacity was freshly observed at `0/1` after the failed R2 work, which used no vendor seat.
One new product-path budget may run the normal `P1 -> P2 -> P1 -> P2` sequence with at most four
real launches and stop on the first failure. The product artifact remains unchanged from R3; the
evidence harness now records the stable MCP error code, normalized licence reason, licence exit code,
and only boolean CDP-readiness facts from sanitized app diagnostics. No raw URL, key, command line,
profile data, automatic retry, or API-acquired probe seat is permitted. A first-launch failure is
diagnostic only; a full four-launch pass is still required for Stage A acceptance.

### Product-path diagnostic R5 budget

R4 stopped on its first launch after a successful `0/1` preflight, but its receipt could only retain
the generic `ENGINE_UNAVAILABLE` code. The elapsed launch interval was approximately five seconds,
matching the coordinator's bounded provider check, but that timing alone is not sufficient root-cause
evidence. The evidence normalizer now maps every documented coordinator admission message to its
stable reason without retaining the operator text, URL, credential, PID, port, or command line; its
Node 22 regression suite passes 6/6.

One new product-path diagnostic budget may run the unchanged packaged artifact through the normal
`P1 -> P2 -> P1 -> P2` sequence under Node 22.23.2, with at most four real launches and stop on the
first failure. The harness's fresh provider preflight must observe `0/1` before any engine launch.
R5 exists only to distinguish a coordinator admission refusal from an engine/process refusal. No
automatic retry or extra capacity probe is permitted. A failure remains diagnostic; a full four-step
pass is still required for Stage A acceptance.

### Product-path diagnostic R5 result

R5 used Node 22.23.2 and consumed two of four permitted launches before stopping. P1 and P2 both
opened through the packaged product path, reached the local page, preserved separate storage, used
the exact pinned executable, and carried all 13 required native fingerprint flags. P1 became usable
in 7.549 s and P2 in 6.077 s from the prior close, both within the 10-second target. P1 closed and
fresh capacity returned to `0/1`; P2 also exited cleanly locally, but the first completed count after
its close remained `1/1`. The provider still reported `1/1` at 20:13 local while exact-engine process
enumeration reported zero. Stage A therefore remains **FAIL** at release confirmation, not at profile
launch or local process cleanup.

Receipt: `260921-2002-stage-a-product-path-r5.json`, SHA-256
`7f7f1425c03e31ad7976f594b1f277ffcd2ee51e3133861abc034a8e0b5e0d76`.
The successful P1 open duration was 4.894 s from spawn to close request; P2 was only 2.819 s. That
correlation supports, but does not prove, a minimum-session-dwell hypothesis. The next run must first
capture the exact shutdown method and hold every session open for at least five seconds; no new
engine attempt is permitted until count-only monitoring returns to `0/1`.

### Product-path diagnostic R6 budget

After the provider returns to `0/1`, one unchanged-artifact diagnostic may use at most four real
launches in the normal `P1 -> P2 -> P1 -> P2` order and stop on the first failure. The harness must
run under Node 22.23.2, keep each engine open for at least 5,000 ms from spawn before requesting
close, and record the sanitized shutdown method, child-exit fact, open duration, process cleanup,
and completed provider counts. This tests one hypothesis only: the short 2.819-second R5 P2 session
closed before the native licence lifecycle could reliably finish initialization. It is not a product
fix and does not permit retrying a refused engine. If R6 passes, enforce the proven lower bound in
the product close path with regression coverage, rebuild, and rerun Stage A without a harness-only
dwell override. If R6 fails, reject the dwell hypothesis and return to lifecycle comparison.

### Product-path diagnostic R6 result

R6 ran under Node 22.23.2 after a fresh `0/1` provider preflight and stopped after its first real
launch. P1 reached the local page in 5.561 s and remained open for 5.002 s, so the minimum-session
dwell hypothesis is rejected. The page-target `Browser.close` request did not terminate the engine
within the four-second graceful-close window; product code escalated to `SIGTERM`, observed child
exit code `1`, and the first completed provider count after close remained `1/1`. Local process and
disposable-data cleanup completed, but lifecycle evidence recorded zero browser closes and one signal
escalation. The provider later reclaimed the seat through its external expiry path.

Receipt: `260921-2018-stage-a-product-path-r6.json`, SHA-256
`16b9822ec88666633840f09fc23d622055b8d279a190d3ad77253f41cc0a204c`.

The root cause is the CDP transport level, not session duration. The default `chrome-remote-interface`
connection is attached to a page target, while reliable shutdown requires `Browser.close` on the
browser-level WebSocket endpoint. `CdpSession.closeBrowser()` now obtains that endpoint from
`CDP.Version()`, sends the close through a dedicated browser-level transport, and retains the prior
page-target request only as a connection-establishment fallback. The new regression failed before
the change and passes after it; the focused CDP, shutdown/licence, harness, TypeScript, and packaging
checks pass.

### Product-path acceptance R7 budget

The rebuilt Windows directory artifact contains the browser-level close repair:

- `MKTBrowser.exe` SHA-256: `73c53ab3d79b6d39349485016e6d287efc0b51bfc2db2a521c94fb9e712a3e18`
- `resources/app.asar` SHA-256: `33d3c67d2651412db7f0ac06e077e9cf32b989a956f4b099b73688da2fd1e8ab`
- Runtime: Node 22.23.2; restored workspace links verified after packaging.

One new Stage A acceptance run may use at most four real launches in the required
`P1 -> P2 -> P1 -> P2` order, with stop-on-first-failure and no harness-only minimum-open delay.
The harness must observe a fresh provider count of `0/1` before the first engine attempt. Each launch
must reach the usable local page within 10 seconds of the prior close completion, retain separate P1
and P2 storage, use the exact pinned engine with all 13 native fingerprint flags, and close through
`Browser.close` without `SIGTERM` or `SIGKILL`. Every completed close must leave no exact-engine
process and return the provider count to `0/1`. Any failed condition keeps Stage A failed and requires
new diagnosis before another engine attempt.

The first R7 invocation stopped at its initial count-only preflight with provider capacity still
`1/1` from R6. It used zero engine launches, removed its disposable root, and left no exact-engine
process, so it does not consume the four-launch R7 budget. Receipt:
`260921-2030-stage-a-product-path-r7.json`, SHA-256
`6e7fbd3a9972e04b01ae087fc839e34e70bf8b8056313ee9f4bdffb452f3bdd7`.
The acceptance invocation may proceed only after the prior 15-16 minute provider expiry window and
its own fresh preflight reports `0/1`; it retains all R7 limits and stop conditions.

### Product-path acceptance R7 result

R7b began from a fresh `0/1` provider preflight and used two real launches before stopping. P1 and
P2 both reached the local page in 7.105 s and 7.092 s respectively, preserved separate storage, used
the exact pinned executable, and carried all 13 required native fingerprint flags. Both shutdowns
still escalated to `SIGTERM` with child exit code `1`; lifecycle evidence recorded zero
`Browser.close` exits and two signal escalations. P1's completed post-close observation returned to
`0/1`. P2's post-close observation could not verify provider state and the local key remained
cooling, so the harness stopped and removed its disposable root. Stage A remains **FAIL**.

Receipt: `260921-2034-stage-a-product-path-r7b.json`, SHA-256
`a38be95c80b9808a23f10b03d606ee42507091b1198a138786a6ae318c57d563`.

R7 disproves the browser-WebSocket target as a sufficient repair. Source comparison with the exact
successful SDK path identified the remaining transport difference: Playwright launches CloakBrowser
with `--remote-debugging-pipe`, owns file descriptors 3/4, and sends the raw null-delimited
`Browser.close` message through that process pipe. The product launched only
`--remote-debugging-port=0`, so even a browser-level WebSocket did not reproduce the successful SDK
shutdown path. A no-seat Chrome diagnostic confirmed that remote-debugging port and pipe can coexist:
normal page control remained available over the port while the exact pipe close ended the process in
209 ms with exit code 0.

### Product-path acceptance R8 budget

The selected repair keeps all existing WebSocket page control and adds a process-owned shutdown pipe
only for fast-reuse Windows CloakBrowser launches. CFT, non-Windows, and rollback mode remain
unchanged. The product adds `--remote-debugging-pipe`, owns descriptors 3/4, drains responses, and
gives `CdpSession.closeBrowser()` a one-shot pipe sender; a missing or closed pipe falls back to the
existing browser-WebSocket path. No Playwright or vendor SDK dependency is added.

After focused lifecycle tests pass, rebuild the Windows directory package under Node 22.23.2. Once
a fresh count-only preflight reports `0/1`, one R8 run may use at most four real launches in the
required `P1 -> P2 -> P1 -> P2` order, with no minimum-open override and stop-on-first-failure. Every
launch must remain usable within 10 seconds, retain separate storage and all 13 native fingerprint
flags, exit through `Browser.close` without signals, leave no exact-engine process, and return the
provider count to `0/1` before the next launch. Any miss keeps Stage A failed.

### Product-path acceptance R8 result

R8 began from a fresh `0/1` provider preflight and stopped after its first real launch. P1 reached
the local page in 7.299 s, used the exact pinned executable, retained all 13 native fingerprint
flags, and wrote its isolated storage marker. The process-pipe repair changed the shutdown result:
`Browser.close` completed, the child exited with code `0`, no signal escalation occurred, no exact
engine process remained, and disposable cleanup passed. This closes the process-shutdown defect
observed in R6/R7.

Stage A still failed because the first completed post-close capacity observation reported vendor
capacity `1/1` and local cooling `1`. The engine had been alive for only 2.885 s from spawn to close
request. A separate count-only observation completed 88.742 s after close and still reported `1/1`;
later count-only samples remained occupied beyond seven minutes. These observations create no new
session and do not justify another engine attempt. Receipt:
`260921-2101-stage-a-product-path-r8.json`, SHA-256
`fcac69081e403806e8f45389bc5dd1819447a116782e7f56ff1a80f8e417d84f`.

### Product-path diagnostic R9 budget

The remaining narrow hypothesis is a licence-initialization race: CDP and the local page become
usable before the engine has retained enough session state to send its own `session/end` during an
immediate clean close. The successful official-SDK evidence kept P1 alive for about 6.36 s and P2
for about 4.17 s, while R8 closed at 2.885 s. R6 cannot reject this combined hypothesis because its
five-second run still used the disproven WebSocket shutdown and ended through `SIGTERM`.

Only after count-only monitoring returns to `0/1`, one unchanged-artifact R9 diagnostic may use the
normal `P1 -> P2 -> P1 -> P2` sequence with `--minimum-open-ms 5000`, at most four real launches,
and stop on the first failure. All R8 process, storage, fingerprint, timing, capacity and cleanup
criteria remain. This changes one variable only: clean process-pipe close occurs no earlier than five
seconds after spawn. If R9 passes, implement the minimum licence-ready lifetime in product close
handling with regression coverage, rebuild, and rerun Stage A without a harness override. If R9
fails, reject the dwell hypothesis and compare the remaining launch environment/official lifecycle
boundary before selecting another product change.

### Product-path diagnostic R9 result

R9 started from a completed `0/1` count response and used one real launch. The engine exposed its
DevTools endpoint and CDP became ready, but it then exited with licence code `76` before
`launch_profile` resolved. Cleanup completed through `Browser.close` with no signal escalation and
removed the disposable root. Because the controlled launch never resolved, the five-second dwell
was never reached and R9 neither proves nor rejects the dwell hypothesis.

Receipt: `260921-2117-stage-a-product-path-r9.json`, SHA-256
`c62792c755a6a0b22245f34fbf5ec2e4a2b4546630ff2f3ade421b0f6f954170`.
A separate count-only observation at `2026-09-21T14:23:46.135Z`, with zero engine launches, then
reported `1/1`. Its receipt is `260921-2124-r9-post-failure-capacity.json`, SHA-256
`375291a9e4e99803bff214e0b4b6c5b4d115773c8ee501c8cb2a02e37314c5c6`.
Together with the immediately preceding `0/1` preflight, this shows that one aggregate zero is not a
sufficient post-expiry admission proof. The R9 engine attempt is the only intervening live launch,
but the evidence does not reveal whether the provider retained a new partial session or surfaced a
prior lease through an eventually consistent store.

No further engine attempt is permitted while count-only monitoring remains `1/1`. A replacement
R9b may run only after the current 15-minute lease window has elapsed and multiple count-only
observations remain `0/1`. It retains the unchanged artifact, five-second minimum-open variable,
four-launch maximum, normal `P1 -> P2 -> P1 -> P2` order, and stop-on-first-failure rule. Before that
run, compare the official SDK's full pipe-owned lifecycle and launch environment with the product;
do not infer a product fix from aggregate count behavior alone.

### Product-path diagnostic R9b result

R9b began after three consecutive count-only samples reported `0/1`. P1 reached the local page in
5.757 s, remained open for 5.014 s, used the exact pinned executable, retained all 13 native
fingerprint flags, and wrote its isolated storage marker. Shutdown completed through
`Browser.close`; the spawned child itself exited with code `0`, no signal escalation occurred, no
exact-engine process remained, and disposable cleanup passed. The recorded primary process matched
the spawned child, so no process relaunch or ownership handoff occurred.

The first completed post-close capacity observation still reported vendor capacity `1/1` and local
cooling `1`. R9b therefore rejects both the minimum-dwell and process-relaunch hypotheses while
keeping Stage A **FAIL** at provider release confirmation. Stable-free preflight receipt:
`260921-2133-r9b-stable-free-preflight.json`, SHA-256
`5688054f7e50d1446af6a307e1a48e033ba5fb14cbfd507dac0b18e30f4527d9`. Product receipt:
`260921-2134-stage-a-product-path-r9b.json`, SHA-256
`1634cb8b2893a851cb3e725052a72548ad2ab5861e4821ec00257e7d0aea1e53`.

The official SDK remains the working comparison on the same host, key, engine and executable. SDK
`0.5.10` with Playwright `1.62.0` opened P1 and P2 and observed provider capacity return to `0/1`
322-324 ms after each close. Receipt: `../260921-1314-cloak-free-seat-reuse/official-sdk-reuse.json`,
SHA-256 `fb010fe5a78067476f09bb108fd80a886c7b5de57a8468d2281714184069c006`.

### Product-path acceptance R10 budget

The remaining isolated difference selected for R10 is the child-process environment. The product
previously supplied POSIX defaults such as `TMPDIR=/tmp`, `SHELL=/bin/sh` and an empty `HOME` on
Windows while omitting ordinary native variables including `TEMP`, `TMP`, `SystemDrive` and
`ComSpec`. The SDK inherited a normal Windows environment. Source now uses a Windows allowlist that
keeps native temp, profile, application-data and system variables while still excluding Electron,
Chrome, V8 and Node option markers. Linux and macOS behavior remains unchanged. No SDK or Playwright
dependency is added. Focused environment tests passed `2/2`; the Stage A evidence harness passed
`9/9` under Node 22.23.2.

Before any R10 engine attempt, typecheck, lint and diff checks must pass, a new Windows directory
artifact must be built under Node 22.23.2 / Yarn 4.5.0, and multiple count-only samples must remain
`0/1`. R10 may then use at most four real launches in the required `P1 -> P2 -> P1 -> P2` order,
without a minimum-open override and with stop-on-first-failure. It retains every R8 process,
storage, fingerprint, timing, capacity and cleanup criterion. This is a one-variable test: the only
intended product-path difference from R9b is the corrected Windows launch environment. If R10 fails,
reject the environment hypothesis and replace the custom licensed-engine lifecycle boundary with an
adapter based on the proven official SDK/Playwright lifecycle rather than trying additional flags.

### Product-path acceptance R10 result

Source verification passed before the run: focused environment tests `2/2`, Stage A harness tests
`9/9`, the affected MKB-02 group `167/167`, typecheck, lint and `git diff --check`. The Windows
directory package completed under Node 22.23.2 / Yarn 4.5.0 with `MKTBrowser.exe` SHA-256
`6b540afd2731b6ab42ac46fba93b2aef707f5507770f3ce2fc81b3f06a982f66` and `resources/app.asar`
SHA-256 `5e278373c1510a141d003a2fb6655390e00ab49c18b18ba518dd289f8ffb5d92`.
Three count-only samples remained `0/1` before the attempt. Preflight receipt:
`260921-2150-r10-stable-free-preflight.json`, SHA-256
`6cadd6ef6a0432b1959fed8fbc645d3bfa31856faabb7afbe06f8ec1d26384c2`.

R10 stopped after its first real launch. The exact pinned process exposed its DevTools endpoint, the
primary process matched the launched process, and CDP became ready, but the engine exited with
licence code `76` before `launch_profile` resolved. Cleanup completed through `Browser.close`, no
signal escalation occurred, the disposable root was removed, and no exact-engine process remained.
The immediate count-only observation reported `1/1`. Receipt:
`260921-2156-stage-a-product-path-r10.json`, SHA-256
`25f7054079c242cf7b01ad35a9c57591a6ff9d6ff15a29052a7467e0009ba85d`.

R10 rejects the corrected-environment hypothesis. No further direct-spawn flag or environment trial
is permitted. The selected repair is an adapter that launches and closes Windows CloakBrowser
through the proven official `cloakbrowser 0.5.10` / `playwright-core 1.62.0` persistent-context
lifecycle while retaining the product's exact engine pin, profile storage, native fingerprint
arguments, proxy preflight/bridge, MCP control contract, durable lease journal and stop-on-first-
failure coordinator. The adapter must refuse SDK engine download or pin substitution and must keep
CFT and the rollback path on the existing launcher.

### Product-path acceptance R11 budget

Implement the SDK lifecycle behind the existing fast-reuse Windows CloakBrowser boundary with
regression coverage for exact-binary selection, one launch attempt, owned process discovery,
graceful SDK context close, cleanup fallback and no SDK use for CFT/non-Windows/rollback mode. Run
focused tests, typecheck, lint, packaging tests and build a new directory artifact under the pinned
toolchain. No real engine launch is permitted while provider capacity is `1/1`.

After the lease expires and multiple count-only samples remain `0/1`, one R11 run may use at most
four real launches in the required `P1 -> P2 -> P1 -> P2` order, without a minimum-open override and
with stop-on-first-failure. It retains every Stage A timing, storage, native fingerprint, exact-engine,
capacity and cleanup criterion. A pass requires all four launches and all four completed closes to
return the provider to `0/1`; an SDK launch alone is not acceptance.

### Product-path acceptance R11 result

R11 began after three consecutive count-only samples reported `0/1` and stopped after P1, using one
of four permitted launches. P1 reached the local page in 5.652 seconds through the rebuilt packaged
product, used the exact pinned executable and all 13 native fingerprint flags, wrote isolated storage,
and closed through the SDK-owned graceful path without a signal or remaining engine process. The
first completed provider observation after close still reported `1/1`, so the sequence did not open
P2. A separate count-only observation roughly 50 seconds later reported `0/1`. Stage A remains
**FAIL** because the provider release was not prompt enough for the ten-second transition target.

Preflight receipt: `260921-r11-stable-free-preflight.json`, SHA-256
`3a762b2097c2d0309e23e7d7ef562bc237b35fcac79f330a3fa0bdf11760d1ce`.
Product receipt: `260921-r11-stage-a-product-path.json`, SHA-256
`51719bf2a32f40285379d4e08f8812be7ac0a52b834de67f7fc128563482d867`.

### External-CDP isolation diagnostic R12 budget

The official SDK comparison returned provider capacity to `0/1` 322-324 ms after each close and did
not open a second DevTools transport. R8 and R11 both retained the product's external port CDP
connection during their otherwise graceful close and both left the provider occupied. One isolated
R12 launch may therefore keep the known-working official SDK options and add only
`--remote-debugging-port=0` plus one external CDP connection that remains open while
`context.close()` runs. It must start from multiple stable `0/1` count-only samples, use the exact
pin, stop after that single launch, retain a 30-second SDK close deadline, record count-only samples
through ten seconds after close, leave no engine process, and never retry an engine. R12 is diagnostic
only. If it reproduces delayed release, the product must disconnect its external CDP session before
SDK close; if it does not, the next isolation target is the product launch argument/environment set.

### External-CDP isolation diagnostic R12 result

R12 started from a fresh `0/1` capacity response and launched the exact pinned engine through the
official SDK with `--remote-debugging-port=0`. The local page and external CDP connection became
ready, but the active-capacity request completed only about 1.3 seconds after the launch request and
still reported `0/1`. The harness therefore stopped before its measured close. SDK cleanup left no
exact-engine process and the final capacity response was `0/1`, but this run neither proves nor
rejects the external-CDP hypothesis because it never observed the required occupied `1/1` state.

Receipt: `260921-r12-sdk-external-cdp-release.json`, SHA-256
`0b775865ff6703240a1e71647322e8cd1f477ac91275bdd51dd2f1db95587847`.

### External-CDP isolation diagnostic R12b budget

R12b may use one real launch after multiple stable `0/1` count-only samples. It keeps the R12 engine,
SDK, Playwright, launch options and external port CDP connection unchanged. The harness must wait at
least three seconds from the launch request and observe provider capacity at exactly `1/1` before
requesting close; otherwise the result is inconclusive and no retry is permitted. During the measured
close, the external CDP connection must remain undisconnected while `context.close()` runs. The run
must then poll capacity through ten seconds after close, record the first verified `0/1` delay, leave
no exact-engine process, remove no non-disposable data, and stop after this single engine attempt.

If R12b reproduces the delayed release, production must disconnect its external `CdpSession` before
closing the SDK context and gain an ordering regression test before rebuild. If R12b returns capacity
promptly, reject this hypothesis and isolate the remaining product argument/environment differences;
do not change production based on an inconclusive result.

### External-CDP isolation diagnostic R12b result

R12b began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. The official SDK opened the exact pinned engine with the external port CDP connection, the
provider then confirmed the required occupied state at `1/1`, and that external connection remained
undisconnected while `context.close()` ran. SDK close completed in 758 ms, no exact-engine process
remained, and the first completed post-close capacity response returned to `0/1` after 314 ms.

This valid run rejects the external-CDP hypothesis. Production must not be changed merely to close
its `CdpSession` before the SDK context. The remaining isolation boundary is the product-specific
launch argument/environment set and its close deadline.

Preflight receipt: `260921-r12b-stable-free-preflight.json`, SHA-256
`0dcfd9a73740d28da9b762436203dede2662638d70f0ba5e777fc284ff1368f5`.
Diagnostic receipt: `260921-r12b-sdk-external-cdp-release.json`, SHA-256
`c382c9cca26774c99644997faa8ced49d9f8647f903ad95938044f48de89d223`.

### Background-networking isolation diagnostic R13 budget

The first product-only launch switch selected for isolation is
`--disable-background-networking`. MKT Browser applies it to every CloakBrowser profile, while the
working official SDK comparison does not. Its documented purpose is to suppress Chromium background
traffic, so it could also suppress or delay a vendor shutdown request even though foreground licence
admission succeeds.

After a new multiple-sample `0/1` preflight, R13 may use exactly one real launch. It must reproduce
the valid R12b setup and add only `--disable-background-networking`: same exact engine, SDK,
Playwright, profile isolation, external CDP connection, three-second minimum before required `1/1`,
30-second close deadline, post-close capacity sampling through ten seconds, and no retry. If capacity
does not return promptly, remove this switch only from the fast-reuse Windows CloakBrowser path with
a regression test, then separately revalidate proxy/DNS/WebRTC behavior. If capacity returns
promptly, reject this switch as the cause and continue isolating the remaining product options.

### Background-networking isolation diagnostic R13 result

R13 began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. It reproduced the valid R12b setup and added only `--disable-background-networking`.
The provider confirmed `1/1` before close, SDK close completed in 2.119 seconds, and no exact-engine
process remained. Capacity nevertheless stayed `1/1` in every completed observation at roughly
zero, two, five and ten seconds after close, including the final sample.

Compared with R12b's 314 ms release, this one-variable result identifies
`--disable-background-networking` as the cause of the product's delayed vendor release. The selected
repair omits only that switch when the measured fast-reuse Windows CloakBrowser SDK lifecycle is
active. CFT, non-Windows CloakBrowser and `MKT_BROWSER_FAST_LICENSE_REUSE=0` retain the existing
switch. All DNS, prefetch, component-update, domain-reliability and phishing-containment switches
remain unchanged. Proxy/DNS/WebRTC acceptance must be rerun after sequential reuse passes.

Preflight receipt: `260921-r13-stable-free-preflight.json`, SHA-256
`09387fab389a0165935f0958aaec5bf784c8a70297ab9325f9495a1a8c51a8d5`.
Diagnostic receipt: `260921-r13-disable-background-networking-sdk-external-cdp-release.json`,
SHA-256 `13b0c292bfa647ffeb60f8e494193a99e1c06f46203295353b99648528e49a2c`.

### Product-path acceptance R14 budget

The product repair has a red-before/green-after regression for the SDK lifecycle exception. Focused
lifecycle tests pass `40/40`, the full MKB-02 group passes `173/173`, the Stage A harness passes
`9/9`, and typecheck, lint and `git diff --check` pass under Node 22.23.2 / Yarn 4.5.0. The Windows
directory build completed with its packaging suite at `83 PASS / 1 SKIP`; the skip is the explicit
live-machine integration gate, not product acceptance. The freshly built packaged runtime contract
passes `1/1`.

Rebuilt artifact:

- `MKTBrowser.exe` SHA-256: `0d272238ad80a4646188236f8d4b47f4a3db67aa460569b1215ef0d6f421d7c8`
- `resources/app.asar` SHA-256: `3d6ffe9fc5613f04a40ff455a9efe9e362b59ca2bc21e026a4971c3c2c9d8ad7`

After the R13 lease expires and at least three consecutive count-only samples report `0/1`, one R14
run may use at most four real launches in the required `P1 -> P2 -> P1 -> P2` order, with no
minimum-open override and stop on first failure. Every launch must become usable within ten seconds
of the prior completed close, retain separate storage, use the exact pinned engine and all 13 native
fingerprint flags, close through `Browser.close` without signals, leave no exact-engine process, and
return provider capacity to `0/1` before the next launch. Any miss keeps Stage A failed and forbids an
automatic retry.

### Product-path acceptance R14 result

R14 began after three consecutive count-only samples reported `0/1` and used two real launches
before stopping. P1 reached the usable local page in 6.298 seconds, used the exact pinned engine and
all 13 native fingerprint flags, preserved isolated storage, and closed through `Browser.close` in
636 ms without a signal or remaining process. The next completed product capacity observation
returned `0/1`, so the R13 repair is confirmed on the packaged product path.

P2 was then requested only 9 ms after that `0/1` response completed and the vendor refused the
engine with `ENGINE_UNAVAILABLE`. Cleanup remained signal-free and disposable data was removed, but
Stage A remains **FAIL**. The working official SDK reference waited about 989 ms between its completed
pre-P2 `0/1` response and the P2 launch request. Together with the earlier R9 evidence that one
aggregate zero is not an immediate admission guarantee, this selects a bounded post-observation
settlement hypothesis rather than reopening the release fix.

Preflight receipt: `260921-r14-stable-free-preflight.json`, SHA-256
`f17645075955e29d3d67bf7aa7ab822530bc2a8e06786eb961dbbf3078c6f0af`.
Product receipt: `260921-r14-stage-a-product-path.json`, SHA-256
`72aef9faedcb3951120e6fbdc1e01fa02d102b0ffbcad3db6a4155854f6e154`.

### Post-observation settlement diagnostic R15 budget

The one variable selected for R15 is a 1,000 ms quiet period after a completed vendor `0/1`
observation and before local acquisition/engine launch. This matches the successful official SDK
reference while preserving the ten-second handoff target. The coordinator must hold its existing
single-admission lock during the wait and recheck its revision afterward, so close, engine change or
another invalidation still prevents the engine attempt. Rollback mode must not wait or contact the
vendor.

Add a red-before/green-after coordinator regression, rebuild the exact Windows directory artifact,
and do not run a live engine while capacity is `1/1`. After multiple stable `0/1` samples, one R15
run may use the normal four-launch sequence with all R14 timing, storage, fingerprint, process,
capacity and stop-on-first-failure criteria. If it fails, remove the settlement change and return to
the remaining launch-option comparison; do not stack another speculative fix.

### Post-observation settlement diagnostic R15 build evidence

The R15 Windows directory artifact was rebuilt under Node 22.23.2 / Yarn 4.5.0. Packaging completed
with `83 PASS / 1 SKIP`; the skip is the explicit live-machine integration gate. The freshly rebuilt
packaged runtime contract passed `1/1`, `git diff --check` exited zero, and all five desktop workspace
junctions were restored to their repository package targets.

Source baseline and live-path SHA-256 values:

- Baseline commit: `06fe257c7ee615b156d776cfd10d415a933c23b2`
- `license-seat-coordinator.ts`: `9cc89a5d096b90072881ea4a2e5e9854615988bb133bb82298f0baa6792d26e1`
- `license-seat-coordinator.test.ts`: `b6f85e0113804b6a8d3e02a92526d4f305295a6ec5b4cf2137cd106a692b1b0b`
- `chromium-network-privacy-flags.ts`: `7697aae33a8a24564d6f4eee05fea9d119644198cfad127456bfae39653bc931`
- `chromium-network-privacy-flags.test.ts`: `aa1ca22de40816eefc33e86821f87908219e6a5e1451f6d46519150dee6d83dc`
- `ChromiumBrowserDriver.ts`: `a375e0714493dc5c14f8f16658ba50df30cea9a87fb094817d6db4103ba95a20`

Rebuilt artifact:

- `MKTBrowser.exe` SHA-256: `74265aeaaeedb16078ae16dd86a5cbc8fe3538122b7a3c57394431acab28c69c`
- `resources/app.asar` SHA-256: `c9c2bead3f3977694504c5813bf07eb42c9a0c0e3f81cd47010226d808f1e4c8`

### Post-observation settlement diagnostic R15 result

The R15 preflight first observed `1/1`, then passed only after three consecutive count-only samples
reported `0/1`. The product run used one of four permitted launches and stopped at P1. Its initial
in-app capacity refresh completed at `0/1`, but the vendor refused the subsequent SDK launch as
`ENGINE_UNAVAILABLE`. No engine process remained, no signal escalation occurred, and disposable
data cleanup completed. Stage A therefore remains **FAIL**.

This rejects the fixed 1,000 ms post-observation settlement hypothesis. The settlement constant,
sleep injection and its two regressions were removed without changing the R13 background-networking
repair or the existing admission serialization. Post-revert coordinator tests pass `7/7`, typecheck
passes under Node 22.23.2 / Yarn 4.5.0, and `git diff --check` exits zero.

- Preflight receipt: `260921-r15-stable-free-preflight.json`, SHA-256
  `557f3c7207fac97898a4c1364d5785a22b612066d45dc7ec4ec6113f8be9c39e`
- Product receipt: `260921-r15-stage-a-product-path.json`, SHA-256
  `c71f1a625d8e749dea6437cd0cf1616325715444fccbbc752f02e449730ecb2d`
- Reverted `license-seat-coordinator.ts` SHA-256:
  `a20e24cf536c34388b4d2ce90b7dcb7e2a8f639d12cda7cc8c43ab8f77206ea9`
- Reverted `license-seat-coordinator.test.ts` SHA-256:
  `af1a24ea0b4f3e1fbc6d8e1ad30205b3d97e6076d803ace6e89c0879a383399b`

### Minimal-SDK admission baseline R16 budget

R15 failed after the vendor count had remained `0/1` for more than one minute, while R14 had already
shown that the repaired product can launch and release P1. Before attributing the new refusal to any
remaining product argument, re-establish the known-good official SDK baseline against the same
current provider state. After at least three consecutive count-only `0/1` samples, R16 may use one
real launch with the exact pinned engine, official SDK options and one external CDP connection. It
must require an observed `1/1` active state, close through `context.close()`, verify no remaining
engine process, sample capacity through ten seconds, and never retry.

If the minimal baseline is also refused, the current blocker is provider admission despite its own
`0/1` count and no product launch-option conclusion is permitted. If the minimal baseline succeeds,
resume one-variable comparison of the product-only launch options; do not change production from the
baseline alone.

### Minimal-SDK admission baseline R16 result

R16 began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. The same exact engine opened through the known-good official SDK baseline, the provider
confirmed `1/1`, SDK close completed in 401 ms, no exact-engine process remained, and the first
completed post-close observation returned `0/1` after 300 ms. Current provider admission and release
are therefore healthy; R15's refusal belongs to a product-path launch difference rather than the
count endpoint alone.

- Preflight receipt: `260921-r16-stable-free-preflight.json`, SHA-256
  `52beb90cf76ec795d1993eeb4f375df710bc78f6dd154e4fe47505a80bce0a2c`
- Diagnostic receipt: `260921-r16-minimal-admission-baseline-sdk-external-cdp-release.json`,
  SHA-256 `86c54fc05edb13b9321eb028d90b6ea325b8e5c3372e13a5265621fe23646d07`

### SDK default-argument isolation R17 budget

The first remaining product-only SDK option selected for isolation is `stealthArgs: false`. R16
uses the SDK defaults, which add `--no-sandbox` plus a default platform flag before the caller's
fingerprint seed; the product disables that default set and supplies its full native fingerprint
configuration itself. R17 may start only after three consecutive `0/1` count-only samples and may
use exactly one real launch. It reproduces R16 and adds only `stealthArgs: false`, retaining the exact
engine, one external CDP connection, required `1/1` active observation, graceful close, ten-second
capacity sampling, no remaining engine process and no retry.

If R17 is refused while R16 passes, production must stop disabling the SDK defaults and reconcile
the resulting launch argument set without weakening the 13 native fingerprint requirements. If R17
passes, reject this option as the admission cause and isolate the next product-only option.

### SDK default-argument isolation R17 result

R17 began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. Adding only `stealthArgs: false` to the R16 baseline still opened the engine, reached a
verified `1/1`, closed through the SDK in 422 ms, left no exact-engine process, and returned capacity
to `0/1` after 347 ms. Disabling the SDK default argument set is not the admission cause.

- Preflight receipt: `260921-r17-stable-free-preflight.json`, SHA-256
  `fc1175d310ab9c34a63aaab9bec3ef4ced86d2744e366c1e2fcbfa3fc003c38a`
- Diagnostic receipt: `260921-r17-stealth-args-false-sdk-external-cdp-release.json`, SHA-256
  `a7365bc03e92b9f136801470704fe4d4d6b839ba006b7a7378049241549d5e98`

### Native fingerprint-argument isolation R18 budget

R18 retains the successful R17 lifecycle and replaces its single seed flag with one deterministic
product-generated native fingerprint argument set: seed, platform, locale, timezone, screen, scale,
hardware concurrency, device memory, GPU vendor/renderer, browser brand version, platform version,
taskbar height and storage quota. It does not add the product network, restore, language, window or
environment options yet.

After three consecutive `0/1` count-only samples, R18 may use exactly one real launch with the exact
engine, required `1/1` active observation, external CDP held through SDK close, no surviving process,
capacity sampling through ten seconds and no retry. A refusal selects further fingerprint-flag
isolation; a pass preserves the native set and moves comparison to the remaining product options.

### Native fingerprint-argument isolation R18 result

R18 began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. The deterministic full native fingerprint set opened successfully, reached a verified
`1/1`, closed through the SDK in 390 ms, left no exact-engine process, and returned capacity to
`0/1` after 330 ms. The native fingerprint arguments are not the admission cause and remain required.

- Preflight receipt: `260921-r18-stable-free-preflight.json`, SHA-256
  `c9bb9ad623c0da8c9a277ba30afa44c50345367b43261fcd1bfd733d3b471ad8`
- Diagnostic receipt: `260921-r18-product-fingerprint-args-sdk-external-cdp-release.json`, SHA-256
  `dc3a9ab818e0b70754ea04ba08e11009ec578e2b23b901dc8852000e85826e35`

### Windows launch-environment isolation R19 budget

R19 retains the successful R18 SDK options and native fingerprint arguments, then adds only the
product's Windows child-process environment allowlist. The SDK otherwise inherits the app process
environment; the product currently retains selected path, system, temp, user-profile, app-data and
processor variables while dropping all others before the SDK injects its key and denial-file path.

After three consecutive `0/1` samples, R19 may use one exact-engine launch, require the provider to
show `1/1`, close through the SDK, leave no engine process, observe capacity through ten seconds and
never retry. A refusal selects environment construction as the root cause; a pass preserves it and
moves to the remaining product options.

### Windows launch-environment isolation R19 result

R19 began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. The product Windows environment allowlist still opened the exact engine, reached `1/1`,
closed through the SDK in 398 ms, left no engine process, and returned capacity to `0/1` after
322 ms. The environment allowlist is not the admission cause.

- Preflight receipt: `260921-r19-stable-free-preflight.json`, SHA-256
  `91a87a28ef47ef4c282bc8fa715856b300e526edb34b90a85d9f7dd6d5e85083`
- Diagnostic receipt: `260921-r19-product-environment-sdk-external-cdp-release.json`, SHA-256
  `ca65930ffb69be61cf50ebe5d4aabc3da2a412920cf381eece350d1ee919bc65`

### Chromium sandbox isolation R20 budget

R20 retains the successful R19 environment and arguments and adds only
`launchOptions.chromiumSandbox: true`, matching the product's SDK path when no explicit
`--no-sandbox` argument is present. After three consecutive `0/1` samples it may use one exact-engine
launch, require `1/1`, close through the SDK, leave no engine process, observe release through ten
seconds and never retry. A refusal selects this sandbox override; a pass moves to the remaining
Playwright and Chromium options.

### Chromium sandbox isolation R20 result

R20 began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. Enabling the product's Chromium sandbox setting still opened the engine, reached `1/1`,
closed through the SDK in 450 ms, left no engine process, and returned capacity to `0/1` after
357 ms. The sandbox override is not the admission cause.

- Preflight receipt: `260921-r20-stable-free-preflight.json`, SHA-256
  `22cb125f11a71b783c22577753ad40fca5fe49b32102003b73076ec2244c535a`
- Diagnostic receipt: `260921-r20-chromium-sandbox-sdk-external-cdp-release.json`, SHA-256
  `9ddfecfc680df835ce1ce9de13ba230d0ee66554a407a7a1dd5822a2b227684e`

### Playwright ignored-default isolation R21 budget

R21 retains the successful R20 setup and adds only the product's `ignoreDefaultArgs` override:
`--enable-automation`, `--enable-unsafe-swiftshader`, and the default `about:blank` argument. After
three consecutive `0/1` samples it may use one exact-engine launch, require `1/1`, close through the
SDK, leave no engine process, observe release through ten seconds and never retry. A refusal selects
this override; a pass moves to viewport and product Chromium switches.

### Playwright ignored-default isolation R21 result

R21 began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. The product's ignored-default override still opened the engine, reached `1/1`, closed
through the SDK in 469 ms, left no engine process, and returned capacity to `0/1` after 396 ms.
The override is not the admission cause.

- Preflight receipt: `260921-r21-stable-free-preflight.json`, SHA-256
  `4742759601b1b32368bd6cad21e2c5533c728e6dd0e8624c25e0a0ffb22b1b49`
- Diagnostic receipt: `260921-r21-ignore-default-args-sdk-external-cdp-release.json`, SHA-256
  `c4a350c836356b65e48bad96b63a9b34b87b78a21d45de138521796b30c78169`

### Null-viewport isolation R22 budget

R22 retains R21 and adds only top-level `viewport: null`, matching the product lifecycle. After
three consecutive `0/1` samples it may use one exact-engine launch, require `1/1`, close through the
SDK, leave no engine process, observe release through ten seconds and never retry. A refusal selects
the viewport override; a pass completes the SDK-option comparison and moves to product Chromium
switches.

### Null-viewport isolation R22 result

R22 began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. The null viewport still opened the engine, reached `1/1`, closed through the SDK in 476 ms,
left no engine process, and returned capacity to `0/1` after 407 ms. The viewport override is not
the admission cause; the SDK-option comparison is complete.

- Preflight receipt: `260921-r22-stable-free-preflight.json`, SHA-256
  `34764be36ff50c514633fd330a058942884436c69f84b3e86774fa7828282838`
- Diagnostic receipt: `260921-r22-null-viewport-sdk-external-cdp-release.json`, SHA-256
  `4962cb0d54b3eb50deb4fd28d55f44396af5de91cf577f77a3a0cf46ca336245`

### Network-privacy argument isolation R23 budget

R23 retains R22 and adds the remaining product network-containment arguments as one coherent set:
the single DNS/privacy `--disable-features` value plus DoH-off, DNS-prefetch-off, async-DNS-off,
no-prerender, no-pings, component-update-off, domain-reliability-off and client-side-phishing-off.
It deliberately does not restore `--disable-background-networking`, which R13 already proved blocks
prompt release.

After three consecutive `0/1` samples R23 may use one exact-engine launch, require `1/1`, close
through the SDK, leave no engine process, observe release through ten seconds and never retry. A
refusal requires splitting this set; a pass preserves it and moves to session/UI/language options.

### Network-privacy argument isolation R23 result

R23 began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. The remaining network-containment set opened the engine, reached `1/1`, closed through the
SDK in 426 ms, left no engine process, and returned capacity to `0/1` after 405 ms. These switches
are not the admission cause and remain enabled; `--disable-background-networking` remains the only
measured exception.

- Preflight receipt: `260921-r23-stable-free-preflight.json`, SHA-256
  `c59c383394a31478a992b0c5c8806e9f4acc10f6ae3523779ed7d415fd664b07`
- Diagnostic receipt: `260921-r23-network-privacy-args-sdk-external-cdp-release.json`, SHA-256
  `6c31073de99aa9142cceede1d42342d0682eb50d374330d6524869a5293a6473`

### Startup/language argument isolation R24 budget

R24 retains R23 and adds the remaining normal unproxied product arguments: no-first-run,
no-default-browser-check, restore-last-session, locale language, plain Accept-Language list and
initial window size. After three consecutive `0/1` samples it may use one exact-engine launch,
require `1/1`, close through the SDK, leave no engine process, observe release through ten seconds
and never retry. A refusal requires splitting this group; a pass clears the product argument set and
moves diagnosis to profile-directory preparation and app integration.

### Startup/language argument isolation R24 result

R24 began after three consecutive count-only samples reported `0/1` and used exactly one real
launch. The complete normal unproxied product argument set opened the exact engine, reached `1/1`,
closed through the SDK in 416 ms, left no engine process, and returned capacity to `0/1` after
413 ms. The launch-option comparison is complete: none of the retained product SDK options, native
fingerprint arguments, environment, sandbox, Playwright overrides, network switches or startup
arguments reproduces R15's admission refusal.

- Preflight receipt: `260921-r24-stable-free-preflight.json`, SHA-256
  `b8dfd2bfa8d57ab47149ad7976baf165f0c55ad6d58d6522372e3dca144dfe32`
- Diagnostic receipt: `260921-r24-startup-language-args-sdk-external-cdp-release.json`, SHA-256
  `1cf36849a1e814d6ee92ebff2c0d2f1903eecd17596d84b2a70d9040b74b3853`

### Reverted-settlement product acceptance R25 budget

R16 through R24 produced nine consecutive successful one-launch SDK trials, including a final trial
with every normal unproxied product launch option, and each released capacity promptly. The rejected
R15 settlement code is removed. Re-run the full affected source gates, rebuild the Windows directory
artifact under Node 22.23.2 / Yarn 4.5.0, verify its packaged contract and hashes, and do not use the
older R15 package.

After three consecutive count-only samples report `0/1`, one R25 product-path run may use the normal
four-launch `P1 -> P2 -> P1 -> P2` sequence with stop on first failure. It retains the ten-second
transition, exact engine, 13 required native flags, separate/persistent storage, graceful close,
zero surviving process and post-close `0/1` requirements. Any failure remains Stage A **FAIL** and
must be diagnosed from product integration evidence rather than another launch-option change.

### Reverted-settlement product acceptance R25 build evidence

The R25 Windows directory artifact was rebuilt under Node 22.23.2 / Yarn 4.5.0. Packaging passed
with `83 PASS / 1 SKIP`; the skip remains the explicit live-machine integration gate. The freshly
built packaged runtime contract passed `1/1`, all five desktop workspace junctions were restored,
and `git diff --check` exited zero. The verifier's temporary Chrome fixture was
`153.0.8010.50`; that fixture is lifecycle-only and is not the product's pinned CloakBrowser engine.

- `MKTBrowser.exe` SHA-256:
  `0d272238ad80a4646188236f8d4b47f4a3db67aa460569b1215ef0d6f421d7c8`
- `resources/app.asar` SHA-256:
  `3d6ffe9fc5613f04a40ff455a9efe9e362b59ca2bc21e026a4971c3c2c9d8ad7`

### Reverted-settlement product acceptance R25 result

R25 began after three consecutive count-only samples reported `0/1`; no exact-engine process was
present. It used one of four permitted launches and stopped at P1. The packaged app's initial
capacity refresh completed at `0/1`, but `launch_profile` returned `ENGINE_UNAVAILABLE` before a
usable page existed. Cleanup removed the disposable root, no exact-engine process remained, and no
automatic retry was made. Stage A remains **FAIL**.

- Preflight receipt: `260922-r25-stable-free-preflight.json`, SHA-256
  `15cea4ca5714eb98ab5ba673e30318fcfa1178344addb10004879745c146c853`
- Product receipt: `260922-r25-stage-a-product-path.json`, SHA-256
  `13b4b6940f89563b07cc0bdca06deac96b718bf653f20d7b2e117c23c54da10a`

R16 through R24 prove the exact engine, SDK lifecycle and normal unproxied product options can
launch and release. R25 keeps the remaining fault in packaged integration. The packaged companion
extension is the one launch-argument difference not present in R24; it is isolated next without
changing production behavior.

### Packaged-companion argument isolation R26 budget

R26 retains the successful R24 SDK lifecycle and adds only the two arguments used to load the exact
companion files from the R25 Windows directory artifact: `--load-extension` and
`--disable-extensions-except`. It uses the verified source runtime rather than the product's copied
test cache, so the companion pair is the only changed variable.

After three consecutive count-only `0/1` samples, R26 may use exactly one real launch. It must
observe `1/1`, close through the SDK, leave no exact-engine process, return capacity to `0/1` within
ten seconds and never retry. A refusal selects packaged companion integration for further
isolation; a pass eliminates it and moves diagnosis to profile-directory preparation and the
Electron admission path.

### R26 companion isolation superseded before launch

No R26 companion launch was made. The post-R25 count-only preflight first reported `1/1` for three
samples, then returned to `0/1` roughly fifteen minutes after the failed R25 attempt. R25 therefore
consumed a provider session even though the product reported `ENGINE_UNAVAILABLE`, removed its
disposable data and left no exact-engine process. This is stronger evidence than the untested
companion pair and moves diagnosis earlier in the product path.

### Licensed version-probe isolation R26 budget

Immediately before every product launch, `ChromiumBrowserDriver` executes the licensed binary with
`--version`. R16 through R24 never did this. The probe inherits the licence key, bypasses the SDK
lifecycle and has no `Browser.close`, making it capable of consuming a session that the following
real launch then finds occupied.

After the existing R26 preflight reaches three consecutive `0/1` samples, run the exact pinned
binary once with only `--version`; do not launch a profile. Record its exit/version, verify no
exact-engine process remains, and observe count-only capacity through sixty seconds. If capacity
changes to `1/1`, the pre-launch version probe is the root cause and production must use the already
verified pin/bootstrap version instead of executing the licensed binary. If capacity stays `0/1`,
return to copied-runtime, profile-directory and Electron admission differences.

### Licensed version-probe isolation R26 result

R26 began from three consecutive count-only `0/1` samples and executed only the exact licensed
binary with `--version`; no profile was launched. The process did not report a version, exceeded the
ten-second bound and was terminated, with no exact-engine process remaining. Provider capacity
changed immediately from `0/1` to `1/1` and remained occupied through the final sixty-second sample.
This confirms that the product's pre-launch version probe consumed the only provider session before
the real SDK launch and caused the subsequent `ENGINE_UNAVAILABLE` refusal.

- Diagnostic receipt: `260922-r26-licensed-version-probe.json`, SHA-256
  `326bcb51192bc11813d151d4ad94ef2a88ca92a35ee85946662fccbb207cb162`

Production now resolves CloakBrowser's Chromium version from the already verified bootstrap/pin
metadata and never executes the licensed binary for version discovery. The existing binary probe is
retained only for CFT. Focused regressions pass `4/4`, the affected MKB-02 group passes `177/177`,
the Stage A harness passes `9/9`, and root typecheck, desktop lint and `git diff --check` pass under
Node 22.23.2 / Yarn 4.5.0.

The replacement Windows directory package completed with `83 PASS / 1 SKIP`; the skip remains the
explicit live-machine integration gate. Its packaged runtime contract passed `1/1`, all five
desktop workspace junctions were restored, and the verifier's temporary CFT fixture remains
lifecycle-only rather than CloakBrowser acceptance.

- `MKTBrowser.exe` SHA-256:
  `38b6bdfa186b296652956c43b93a5db2bb2b4cf56b0a0b6c46a98182001552c7`
- `resources/app.asar` SHA-256:
  `4a90b1538878e04351fec3172482b674ddf38f92294a4e719f29723d7c8614e8`

### Root-fix product acceptance R27 budget

After the R26 probe lease expires and three consecutive count-only samples report `0/1`, one R27
product-path run may use the replacement package through the required `P1 -> P2 -> P1 -> P2`
sequence. It retains the four-launch maximum, stop-on-first-failure rule and no automatic retry.
Every launch must become usable within ten seconds of the preceding completed close, use the exact
pinned engine and all 13 native fingerprint flags, preserve separate and persistent P1/P2 storage,
close through `Browser.close` without a signal, leave no exact-engine process and return provider
capacity to `0/1` before the next launch. Any miss keeps Stage A failed and requires diagnosis before
another live engine attempt.

### Root-fix product acceptance R27 result

R27 began after three consecutive count-only samples reported `0/1` and completed the full packaged
`P1 -> P2 -> P1 -> P2` sequence. All four launches used the exact pinned `.6` runtime, carried all
13 native fingerprint flags, preserved separate and persistent P1/P2 storage, and reached the local
page in 3.647-3.929 seconds from the preceding completed close. Every close used `Browser.close`
without signal escalation, left no exact-engine process and returned provider capacity to `0/1`.
Disposable cleanup completed. Stage A is **PASS**.

- Stable-free preflight receipt: `260922-r27-stable-free-preflight.json`, SHA-256
  `a44a5ee613d2b1e830172631c015916e02ab5777cf36fddcc62a7e0e2eb3a18b`
- Product receipt: `260922-r27-stage-a-product-path.json`, SHA-256
  `66f87c7a9fc4edca35ae183f0bc76b246f7786cd002f5122ac494b51d88e9eac`

### Native fingerprint measurement R28 budget

The existing acceptance definition is frozen before R28: five disposable profiles, two launches
each, one profile at a time; criterion A is exact restart/context consistency, criterion B reports
the literal computed stable-subset collision verdict and its known mathematical limitation, and
criterion C compares every component with a same-session stock Chrome control. No threshold,
surface, pool-size or interpretation changes are permitted after measurement begins.

After a new three-sample `0/1` preflight, R28 may use exactly ten real CloakBrowser launches through
the packaged product. It stops on the first refusal or cleanup failure, uses no seat retry or fixed
settlement delay, and must close every profile through `Browser.close`, return capacity to `0/1` and
leave no exact-engine process. Raw host-identifying readings stay in a temporary file; only the
redacted aliases, classifications, counts, hashes and independent A/B/C verdicts are retained.

### Native fingerprint measurement R28 result

R28 began after three consecutive count-only samples reported `0/1` and completed all ten packaged
launches: five disposable profiles, two runs each, one at a time. All ten closes completed through
`Browser.close`, no signal escalation occurred, no exact-engine process remained and provider
capacity returned to `0/1` between launches. The raw host-identifying file was removed from the
system temporary directory after the redacted evidence was verified.

The three frozen criteria are independently **FAIL**:

- **A consistency - FAIL:** restart consistency passed with zero restart mismatches, but the four
  required contexts did not agree. There were 40 mismatches: iframe `clientRects`, plus worker
  fonts, canvas and UA/client-hints for every profile/run.
- **B no stable-subset collision - FAIL:** both runs computed 61 stable components and all ten
  profile pairs collided on that stable subset. The weaker full tuple had zero collisions. This is
  reported literally with the gate's known mathematical limitation; the criterion was not changed
  after seeing the data.
- **C cohort plausibility - FAIL:** 18 of 73 components were invariant across all profiles while
  differing from the same-session stock Chrome control. Failed surfaces were audio, fonts,
  screen/locale, UA/client hints, WebGL 1, WebGL 2 and WebGPU; 43 components matched stock and 12
  varied per profile.

These failures do not negate Stage A profile lifecycle behavior, but they preserve
`G2-IDENTITY=FAIL` and prohibit antidetect, identity-isolation or real-account-safety claims.

- Stable-free preflight receipt: `260922-r28-stable-free-preflight.json`, SHA-256
  `908caef1b38809f095755c468e0dd136786337790799ce9d8fdf106dbfc3998d`
- Redacted measurement receipt: `260922-r28-fingerprint.redacted.json`, SHA-256
  `134f2cee844600328a01e86a88d63c65829f9e3ee96fb217e50aa7113c8d2a72`
