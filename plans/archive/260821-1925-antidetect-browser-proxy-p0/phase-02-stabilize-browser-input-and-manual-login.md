---
phase: 2
title: "Stabilize Browser Input and Manual Login"
status: pending
priority: P1
effort: "1-2 days"
dependencies: [1]
---

# Phase 2: Stabilize Browser Input and Manual Login

## Overview

Close the active input-dispatch and occlusion investigation before changing production launch flags.
Prove whether Chromium occlusion controls remove the measured stall, add missing click timing, and
demonstrate repeatable human-controlled login and manual browsing on a disposable profile.

## Context Links

- E:\MKTWorkspace\plans\reports\review-260821-1019-nghiem-thu-d1-ep-occlusion.md
- E:\MKTWorkspace\plans\reports\handoff-260821-1103-ep-cover-occlusion-va-ab-co.md
- E:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs

## Requirements

- Functional: finish and validate cover-mode occlusion, window-state evidence, and cleanup on every exit.
- Functional: run valid control/treatment pairs before promoting any no-occlusion flag to production.
- Functional: add clickPoint timing and outcome fields to result JSON so login failures are measurable.
- Functional: human controls email, password, OTP, CAPTCHA, consent, and final login confirmation.
- Non-functional: no JS scrolling, fake visibility, silent retry, credential automation, or treatment
  enabled by default in the measurement harness.
- Non-functional: a degraded page-load control cannot be used as a behavioral comparison.

## Architecture

The test harness remains a measurement instrument. It forces real Windows minimize or opaque cover
states and observes CDP acknowledgements, rAF, visibility, focus, foreground/z-order, title arrival,
DOM readiness, click timing, and actual scroll movement. Production Browser flags change only after
two valid A/B pairs show stalled controls and healthy treatments.

## File Inventory

| Action | Path | Purpose |
|---|---|---|
| Modify | E:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs | Finish cover mode, click timings, winstate, and A/B output |
| Modify only if A/B wins | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\chromium-network-privacy-flags.ts | Add the proven occlusion-disable launch switches |
| Modify only if A/B wins | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\chromium-network-privacy-flags.test.ts | Lock exact production switches and one emission path |
| Modify | E:\MKTWorkspace\MKTBrowser\scripts\verify-packaged-runtime-contract.cjs | Verify packaged args if the production contract changes |
| Create during execution | E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\reports\input-stability-verdict.md | Sanitized controls, treatments, login runs, and verdict |
| Delete | None | Preserve D1 minimize behavior as a regression control |

## Tests Before

1. node --check on the harness.
2. Re-run D1 minimize control once to prove the old measurement still behaves as recorded.
3. Confirm cover windows always self-destruct and the finally block removes them.
4. Capture clickPoint current missing-result behavior as a failing regression test or assertion.

## Implementation Steps

1. Correct report 0957 language and evidence as required by the D1 review.
2. Complete cover-mode monitor selection, target-window lookup, topmost opaque cover, 800 ms settle,
   uncover, and two-layer cleanup.
3. Record launch foreground window, z-order neighbors, target rectangle, focus, and cover owner.
4. Run cov1 and cov2 with predictions written before execution.
5. Reject D2.5 if either control fails to become covered, fails to stall at bursts 3-4, or fails to
   recover at burst 5.
6. Add no-occlusion treatment switches only in the harness. Keep them off by default.
7. Run interleaved ab1-ab4 cover pairs. Controls must stall; both treatments must avoid the stall.
8. Run ab5-ab6 minimize diagnostic pair; do not use it as the primary production decision.
9. Add clickPoint attempted, acknowledged, timedOut, elapsedMs, lateAckMs, target class, and outcome
   fields without recording typed content.
10. Run three disposable manual-login sessions. The operator enters all credentials and handles any
    checkpoint through the normal browser UI. The harness may measure non-sensitive control
    responsiveness but must not type, submit, or replay secrets. Stop immediately on unexpected
    account or security state.
11. If and only if both A/B pairs pass, add the switches to the single production launch-argument
    owner and lock them with tests.
12. Rebuild the packaged Browser and repeat one manual-login session from the package.

## Test Scenario Matrix

| Scenario | Expected |
|---|---|
| Cover control | Bursts 3-4 stall; burst 5 recovers after uncover |
| Treatment pair | Controls stall and treatments remain responsive in both interleaved pairs |
| Invalid control | Entire A/B batch rejected; no production change |
| Page never builds | Report navigation/title degradation; do not call ack-only output healthy |
| Late acknowledgement | Captured after timeout and correlated to the original command |
| Login click timeout | Exact stage and timing reported; no credential replay |
| CAPTCHA or checkpoint | Human handoff; automation stops |
| Cover helper crash | Cover removed by process exit or self-destruct |

## Dependency Map

- Requires phase 1 frozen baseline and rollback artifact.
- Blocks phase 3 because production launch-argument changes invalidate network evidence.
- Blocks phase 5 operator readiness.

## Tests After

- Exact launch-argument unit tests.
- Packaged runtime-contract verification.
- Three consecutive manual-login or login-page interaction runs with no unexplained 4-second input
  timeout, no missing title gate, and actual DOM/scroll movement where expected.
- Repeat after Browser close and reopen to exclude a one-process-only result.

## Regression Gate

- MKTBrowser typecheck, lint, test:installer, desktop build, and packaged contract pass under Node 22.
- D1 minimize control remains reproducible.
- Treatment is never enabled in the harness control branch.

## Success Criteria

- [ ] D2.5 cover control is valid in two runs and cleanup leaves no cover window.
- [ ] Two interleaved A/B pairs produce a valid verdict.
- [ ] Production flags change only if controls and treatments meet the prewritten rule.
- [ ] clickPoint emits complete sanitized timing and outcome evidence.
- [ ] Three packaged manual-login interactions complete without unexplained input stall.
- [ ] Credentials, OTP, CAPTCHA, and consent remain human-controlled.

## Risk Assessment

- Foreground/z-order changes can falsify the control. Mitigation: capture OS window state at launch,
  cover, uncover, and each burst.
- Adding flags may mask a deeper page-load failure. Mitigation: require title, DOM, video/container,
  and real movement evidence, not fast acknowledgement alone.
- A test account may trigger checkpoint state. Mitigation: disposable account first and immediate
  human stop on any unexpected challenge.

## Security Considerations

- Never log click coordinates over password/OTP fields with typed values.
- Never save screenshots containing credentials, QR codes, recovery codes, or cookies.
- The harness never types into or submits password, OTP, recovery, or CAPTCHA controls.
- No automated CAPTCHA solving or credential injection.
